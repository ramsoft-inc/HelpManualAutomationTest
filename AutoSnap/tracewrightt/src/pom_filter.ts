import { MethodMetadata } from "./pom_scanner.js";

/**
 * Configuration for method filtering
 */
export interface FilterConfig {
  maxMethods?: number;
  excludeDeprecated?: boolean;
  categoryFilter?: string[];
  minScore?: number;
}

/**
 * Result of filtering with scoring information
 */
export interface FilteredMethod extends MethodMetadata {
  score: number;
  matchReasons: string[];
}

/**
 * Smart filtering for POM methods based on user intent and context
 */
export class POMMethodFilter {
  /**
   * Extract keywords from user instructions
   * Returns both regular keywords and detected action intent
   */
  static extractKeywords(userInstructions: string): string[] {
    // Stop words - but KEEP action verbs!
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'should', 'could', 'may', 'might', 'must', 'can', 'i', 'you',
      'he', 'she', 'it', 'we', 'they', 'them', 'their', 'this', 'that',
      'these', 'those', 'then', 'than', 'so', 'if', 'when', 'where', 'what',
      'which', 'who', 'how', 'why', 'all', 'each', 'every', 'some', 'any',
      'few', 'more', 'most', 'other', 'such', 'no', 'not', 'only', 'own',
      'same', 'just', 'now', 'also', 'very', 'here', 'there', 'make', 'take',
      'go', 'get', 'see', 'know', 'think', 'come', 'want', 'use', 'find',
      'give', 'tell', 'work', 'call', 'try', 'ask', 'need', 'feel', 'become',
      'leave', 'put', 'mean', 'keep', 'let', 'begin', 'seem', 'help', 'show',
      'hear', 'play', 'run', 'move', 'like', 'live', 'believe', 'hold',
      'bring', 'happen', 'provide', 'sit', 'stand', 'lose', 'pay'
    ]);

    const words = userInstructions
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    // Remove duplicates
    return Array.from(new Set(words));
  }

  /**
   * Detect the action intent from user instructions
   * This helps us understand if they want to interact with inputs vs buttons
   */
  static detectActionIntent(userInstructions: string): {
    isInput: boolean;
    isButton: boolean;
    isDropdown: boolean;
    isCheckbox: boolean;
    actionVerbs: string[];
  } {
    const lowerInstructions = userInstructions.toLowerCase();
    
    // Input-related actions
    const inputActions = ['type', 'enter', 'fill', 'write', 'input', 'paste'];
    // Button/Click-related actions
    const clickActions = ['click', 'press', 'tap', 'select', 'choose'];
    // Dropdown-related actions
    const dropdownActions = ['select', 'choose', 'pick', 'dropdown', 'option'];
    // Checkbox-related actions
    const checkboxActions = ['check', 'uncheck', 'toggle', 'enable', 'disable'];
    
    const foundActions: string[] = [];
    
    const isInput = inputActions.some(action => {
      if (lowerInstructions.includes(action)) {
        foundActions.push(action);
        return true;
      }
      return false;
    });
    
    const isButton = clickActions.some(action => {
      if (lowerInstructions.includes(action)) {
        foundActions.push(action);
        return true;
      }
      return false;
    });
    
    const isDropdown = dropdownActions.some(action => {
      if (lowerInstructions.includes(action)) {
        foundActions.push(action);
        return true;
      }
      return false;
    });
    
    const isCheckbox = checkboxActions.some(action => {
      if (lowerInstructions.includes(action)) {
        foundActions.push(action);
        return true;
      }
      return false;
    });
    
    return {
      isInput,
      isButton,
      isDropdown,
      isCheckbox,
      actionVerbs: foundActions
    };
  }

  /**
   * Calculate similarity between two strings (simple Levenshtein-like)
   */
  static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    // Check if shorter is contained in longer
    if (longer.toLowerCase().includes(shorter.toLowerCase())) {
      return 0.8;
    }

    // Check if they start with the same prefix
    const commonPrefix = this.getCommonPrefix(str1.toLowerCase(), str2.toLowerCase());
    if (commonPrefix.length > 2) {
      return 0.6 * (commonPrefix.length / longer.length);
    }

    return 0;
  }

  /**
   * Get common prefix between two strings
   */
  static getCommonPrefix(str1: string, str2: string): string {
    let i = 0;
    while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
      i++;
    }
    return str1.substring(0, i);
  }

  /**
   * Score a method based on user intent and keywords
   */
  static scoreMethod(
    method: MethodMetadata,
    userKeywords: string[],
    userInstructions: string
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Base score for non-deprecated methods
    if (!method.deprecated) {
      score += 1;
    } else {
      score -= 5; // Heavily penalize deprecated methods
      reasons.push('deprecated');
    }

    // Detect action intent from user instructions
    const actionIntent = this.detectActionIntent(userInstructions);

    // Method name matching
    const methodNameLower = method.name.toLowerCase();
    for (const keyword of userKeywords) {
      // Exact match in method name
      if (methodNameLower === keyword) {
        score += 10;
        reasons.push(`exact match: ${keyword}`);
      } 
      // Method name contains keyword
      else if (methodNameLower.includes(keyword)) {
        score += 5;
        reasons.push(`contains: ${keyword}`);
      }
      // Keyword contains method name (e.g., "clicking" contains "click")
      else if (keyword.includes(methodNameLower.substring(0, Math.min(5, methodNameLower.length)))) {
        score += 3;
        reasons.push(`partial match: ${keyword}`);
      }
      // Similar based on edit distance
      else {
        const similarity = this.calculateSimilarity(methodNameLower, keyword);
        if (similarity > 0.5) {
          score += similarity * 4;
          reasons.push(`similar to: ${keyword} (${similarity.toFixed(2)})`);
        }
      }
    }

    // JSDoc keywords matching
    if (method.keywords) {
      for (const methodKeyword of method.keywords) {
        for (const userKeyword of userKeywords) {
          if (methodKeyword.toLowerCase().includes(userKeyword) || 
              userKeyword.includes(methodKeyword.toLowerCase())) {
            score += 3;
            reasons.push(`keyword match: ${methodKeyword}`);
          }
        }
      }
    }

    // Category bonus (certain categories are more commonly used)
    if (method.category) {
      const categoryLower = method.category.toLowerCase();
      if (['navigation', 'action', 'interaction'].includes(categoryLower)) {
        score += 2;
      }
    }

    // Prefer shorter, more atomic method names (likely to be selectors)
    const camelCaseWords = method.name.split(/(?=[A-Z])/);
    if (camelCaseWords.length <= 3) {
      score += 1; // Simple methods like "signBtn" are preferred
      reasons.push('simple method');
    }

    // ✨ NEW: Smart action-based scoring
    // Boost score if method type matches the action intent
    
    // If user wants to type/fill/enter something, boost INPUT/FIELD/TEXTAREA methods
    if (actionIntent.isInput) {
      if (methodNameLower.includes('input') || 
          methodNameLower.includes('field') || 
          methodNameLower.includes('textarea') ||
          methodNameLower.includes('textbox') ||
          methodNameLower.includes('editor')) {
        score += 8;
        reasons.push(`🎯 INPUT action detected → matches input/field method`);
      }
      // Penalize button methods when user wants to type
      if (methodNameLower.includes('btn') || methodNameLower.includes('button')) {
        score -= 3;
        reasons.push(`⚠️ INPUT action but this is a button`);
      }
    }

    // If user wants to click/press, boost BUTTON/BTN/ICON methods
    if (actionIntent.isButton) {
      if (methodNameLower.includes('btn') || 
          methodNameLower.includes('button') ||
          methodNameLower.includes('icon') ||
          methodNameLower.includes('link')) {
        score += 8;
        reasons.push(`🎯 CLICK action detected → matches button/icon method`);
      }
      // Penalize input fields when user wants to click
      if (methodNameLower.includes('input') || methodNameLower.includes('field')) {
        score -= 2;
        reasons.push(`⚠️ CLICK action but this is an input field`);
      }
    }

    // If user wants dropdown/select actions
    if (actionIntent.isDropdown) {
      if (methodNameLower.includes('dropdown') || 
          methodNameLower.includes('select') ||
          methodNameLower.includes('option') ||
          methodNameLower.includes('picker')) {
        score += 8;
        reasons.push(`🎯 SELECT action detected → matches dropdown/select method`);
      }
    }

    // If user wants checkbox actions
    if (actionIntent.isCheckbox) {
      if (methodNameLower.includes('checkbox') || 
          methodNameLower.includes('check') ||
          methodNameLower.includes('toggle') ||
          methodNameLower.includes('switch')) {
        score += 8;
        reasons.push(`🎯 TOGGLE action detected → matches checkbox/toggle method`);
      }
    }

    // Detect common patterns (keep existing logic but reduce weight)
    if (methodNameLower.endsWith('btn') || 
        methodNameLower.endsWith('button') ||
        methodNameLower.endsWith('icon') ||
        methodNameLower.endsWith('field') ||
        methodNameLower.endsWith('input')) {
      score += 1;
      reasons.push('selector method');
    }

    return { score, reasons };
  }

  /**
   * Filter and rank methods based on user intent
   */
  static filterMethods(
    methods: MethodMetadata[],
    userInstructions: string,
    config: FilterConfig = {}
  ): FilteredMethod[] {
    const {
      maxMethods = 40,
      excludeDeprecated = true,
      minScore = 0,
    } = config;

    const userKeywords = this.extractKeywords(userInstructions);

    // Score all methods
    const scoredMethods: FilteredMethod[] = methods.map(method => {
      const { score, reasons } = this.scoreMethod(method, userKeywords, userInstructions);
      return {
        ...method,
        score,
        matchReasons: reasons,
      };
    });

    // Filter out deprecated if configured
    let filtered = excludeDeprecated
      ? scoredMethods.filter(m => !m.deprecated)
      : scoredMethods;

    // Filter by minimum score
    filtered = filtered.filter(m => m.score >= minScore);

    // Sort by score (descending)
    filtered.sort((a, b) => b.score - a.score);

    // Limit to maxMethods
    if (filtered.length > maxMethods) {
      filtered = filtered.slice(0, maxMethods);
    }

    return filtered;
  }

  /**
   * Format filtered methods for LLM context
   */
  static formatForLLM(
    methods: FilteredMethod[],
    pageName: string,
    includeScores = false
  ): string {
    if (methods.length === 0) {
      return '';
    }

    let output = `\n### 🛠️ AVAILABLE POM TOOLS (Page: ${pageName})\n\n`;
    output += `**How to use:**\n`;
    output += `- Use \`po.${pageName}.methodName()\` to access stable selectors\n`;
    output += `- These methods return Playwright locators\n`;
    output += `- Chain with .click(), .fill(), .screenshot(), etc.\n`;
    output += `- **IMPORTANT**: When taking screenshots, use the selector shown for each method directly!\n\n`;

    output += `**Available methods** (${methods.length} most relevant):\n`;

    for (const method of methods) {
      let methodLine = `- po.${pageName}.${method.name}()`;
      
      // Add selector if available - THIS IS KEY!
      if (method.selector) {
        methodLine += ` → Selector: \`${method.selector}\``;
      }
      
      if (method.description) {
        methodLine += ` - ${method.description}`;
      }
      
      if (includeScores) {
        methodLine += ` [score: ${method.score.toFixed(1)}]`;
      }
      
      output += methodLine + '\n';
    }

    output += '\n**📸 For Screenshots:**\n';
    output += `When you see a POM method with a selector like \`po.homePage.worklistTable() → Selector: [data-cy="study-status-table"]\`,\n`;
    output += `you should use that EXACT selector in your screenshot command:\n`;
    output += `\`\`\`\n`;
    output += `await page.locator('[data-cy="study-status-table"]', { force: true }).screenshot({ path: './images/table.png', timeout: 30000 });\n`;
    output += `\`\`\`\n`;
    output += `This eliminates guesswork - the POM already knows the correct element!\n\n`;
    
    return output;
  }

  /**
   * Get category-specific methods
   */
  static getMethodsByCategory(
    methods: MethodMetadata[],
    category: string
  ): MethodMetadata[] {
    return methods.filter(m => m.category?.toLowerCase() === category.toLowerCase());
  }
}
