import fs from "fs";
import path from "path";

/**
 * Represents metadata for a POM method extracted from JSDoc comments
 */
export interface MethodMetadata {
  name: string;
  category?: string;
  keywords?: string[];
  deprecated?: boolean;
  deprecationMessage?: string;
  description?: string;
  selector?: string; // The actual selector used in the method (e.g., '[data-cy="table"]')
  selectorType?: 'locator' | 'getByTestId' | 'getByRole' | 'getByText' | 'getByLabel' | 'unknown'; // Type of selector
}

/**
 * Represents a POM page with its methods and metadata
 */
export interface POMPageInfo {
  className: string;
  filePath: string;
  methods: MethodMetadata[];
}

/**
 * Result of scanning the POM directory
 */
export interface POMStructure {
  pages: Map<string, POMPageInfo>;
  scanTimestamp: number;
}

/**
 * JavaScript keywords and control flow statements to exclude from method extraction
 */
const EXCLUDED_KEYWORDS = new Set([
  'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
  'break', 'continue', 'return', 'throw', 'try', 'catch', 'finally',
  'function', 'class', 'const', 'let', 'var', 'new', 'this', 'super',
  'import', 'export', 'from', 'as', 'await', 'yield', 'delete',
  'typeof', 'instanceof', 'void', 'in', 'of', 'with', 'debugger',
  'static', 'async', 'extends', 'implements', 'interface', 'package',
  'private', 'protected', 'public', 'enum', 'abstract', 'boolean',
  'byte', 'char', 'double', 'final', 'float', 'goto', 'int', 'long',
  'native', 'short', 'synchronized', 'throws', 'transient', 'volatile',
  'get', 'set', 'require', 'module', 'exports', 'console', 'window',
  'document', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Date',
  'Math', 'JSON', 'Promise', 'setTimeout', 'setInterval', 'clearTimeout',
  'clearInterval', 'Error', 'TypeError', 'ReferenceError', 'resolve', 'reject'
]);

/**
 * Dynamic POM scanner that discovers POM structure without hardcoding
 */
export class POMScanner {
  private pomDirectory: string;
  private cache: POMStructure | null = null;
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private usedMethodsFilter: Map<string, Set<string>> | null = null;
  private filterFilePath: string;

  constructor(pomDirectory: string, filterFilePath?: string) {
    this.pomDirectory = pomDirectory;
    // Default filter file path relative to the POM directory
    this.filterFilePath = filterFilePath || path.join(__dirname, '..', '..', 'used_pom_methods.json');
    this.loadUsedMethodsFilter();
  }

  /**
   * Load the filter file that contains only POM methods referenced in tests
   */
  private loadUsedMethodsFilter(): void {
    try {
      if (fs.existsSync(this.filterFilePath)) {
        const filterContent = fs.readFileSync(this.filterFilePath, 'utf8');
        const filterData = JSON.parse(filterContent);
        
        this.usedMethodsFilter = new Map();
        for (const [pageName, methods] of Object.entries(filterData)) {
          this.usedMethodsFilter.set(pageName, new Set(methods as string[]));
        }
        
        console.log(`✅ Loaded POM method filter from: ${this.filterFilePath}`);
        console.log(`   Filtering enabled for ${this.usedMethodsFilter.size} pages`);
      } else {
        console.warn(`⚠️  POM filter file not found: ${this.filterFilePath}`);
        console.warn(`   All POM methods will be included (no filtering)`);
      }
    } catch (error) {
      console.error(`❌ Error loading POM filter file:`, error);
      console.warn(`   All POM methods will be included (no filtering)`);
    }
  }

  /**
   * Scan the POM directory and return the structure
   * Uses cache if available and not expired
   */
  async scan(forceRefresh = false): Promise<POMStructure> {
    if (!forceRefresh && this.cache && Date.now() - this.cache.scanTimestamp < this.cacheExpiry) {
      return this.cache;
    }

    const pages = new Map<string, POMPageInfo>();
    await this.scanDirectory(this.pomDirectory, pages);

    this.cache = {
      pages,
      scanTimestamp: Date.now(),
    };

    return this.cache;
  }

  /**
   * Recursively scan a directory for POM files
   */
  private async scanDirectory(directory: string, pages: Map<string, POMPageInfo>): Promise<void> {
    if (!fs.existsSync(directory)) {
      console.warn(`POM directory does not exist: ${directory}`);
      return;
    }

    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        // Skip utility directories and common non-POM directories
        if (!['utils', 'node_modules', 'dist', 'build', '.git'].includes(entry.name)) {
          await this.scanDirectory(fullPath, pages);
        }
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        // Skip utility files
        if (!entry.name.includes('utils') && 
            !entry.name.includes('helper') && 
            !entry.name.includes('config') &&
            entry.name !== 'timeouts.js' &&
            entry.name !== 'package.json') {
          const pageInfo = this.extractPageInfo(fullPath);
          if (pageInfo && pageInfo.methods.length > 0) {
            pages.set(pageInfo.className, pageInfo);
          }
        }
      }
    }
  }

  /**
   * Extract page information from a POM file
   */
  private extractPageInfo(filePath: string): POMPageInfo | null {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract class name
      const classMatch = content.match(/class\s+(\w+)/);
      if (!classMatch) {
        return null;
      }

      const className = classMatch[1];

      // Extract class body
      const classBodyMatch = content.match(/class\s+\w+[^{]*\{([\s\S]*)\}/);
      const classBody = classBodyMatch ? classBodyMatch[1] : content;

      // Extract methods with metadata
      const methods = this.extractMethods(classBody);

      return {
        className,
        filePath,
        methods,
      };
    } catch (error) {
      console.warn(`Error extracting page info from ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Convert class name to camelCase property name (e.g., "ClickWheel" -> "clickWheel")
   */
  private toCamelCase(className: string): string {
    return className.charAt(0).toLowerCase() + className.slice(1);
  }

  /**
   * Extract methods from class body with metadata
   * Now filters methods based on used_pom_methods.json if available
   */
  private extractMethods(classBody: string): MethodMetadata[] {
    const methods: MethodMetadata[] = [];
    
    // Split by method boundaries to extract JSDoc and method together
    const methodPattern = /(\/\*\*[\s\S]*?\*\/\s*)?^\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/gm;
    
    let match;
    while ((match = methodPattern.exec(classBody)) !== null) {
      const jsdocComment = match[1];
      const methodName = match[2];
      const methodBody = match[3] || '';
      
      // Filter out invalid method names
      if (methodName === 'constructor' || 
          methodName.startsWith('_') || 
          EXCLUDED_KEYWORDS.has(methodName) ||
          methodName.length <= 1) {
        continue;
      }

      // Extract metadata from JSDoc if present
      const metadata = this.parseJSDoc(jsdocComment, methodName);
      
      // Extract selector from method body
      const selectorInfo = this.extractSelector(methodBody);
      if (selectorInfo.selector) {
        metadata.selector = selectorInfo.selector;
        metadata.selectorType = selectorInfo.type;
      }
      
      // Only add non-deprecated methods by default
      // (filtering will handle this, but we mark them)
      methods.push(metadata);
    }

    return methods;
  }

  /**
   * Extract selector from method body
   * Returns the first selector found (usually the most relevant one)
   */
  private extractSelector(methodBody: string): { selector: string | undefined; type: 'locator' | 'getByTestId' | 'getByRole' | 'getByText' | 'getByLabel' | 'unknown' } {
    // Try to find page.locator() calls
    const locatorMatch = methodBody.match(/this\.page\.locator\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (locatorMatch) {
      return { selector: locatorMatch[1], type: 'locator' };
    }

    // Try to find page.getByTestId() calls
    const getByTestIdMatch = methodBody.match(/this\.page\.getByTestId\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (getByTestIdMatch) {
      return { selector: `[data-testid="${getByTestIdMatch[1]}"]`, type: 'getByTestId' };
    }

    // Try to find page.getByRole() calls
    const getByRoleMatch = methodBody.match(/this\.page\.getByRole\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (getByRoleMatch) {
      return { selector: `[role="${getByRoleMatch[1]}"]`, type: 'getByRole' };
    }

    // Try to find page.getByText() calls
    const getByTextMatch = methodBody.match(/this\.page\.getByText\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (getByTextMatch) {
      return { selector: getByTextMatch[1], type: 'getByText' };
    }

    // Try to find page.getByLabel() calls
    const getByLabelMatch = methodBody.match(/this\.page\.getByLabel\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (getByLabelMatch) {
      return { selector: `[aria-label="${getByLabelMatch[1]}"]`, type: 'getByLabel' };
    }

    return { selector: undefined, type: 'unknown' };
  }

  /**
   * Parse JSDoc comment to extract metadata
   */
  private parseJSDoc(jsdoc: string | undefined, methodName: string): MethodMetadata {
    const metadata: MethodMetadata = {
      name: methodName,
    };

    if (!jsdoc) {
      return metadata;
    }

    // Extract @category
    const categoryMatch = jsdoc.match(/@category\s+(\w+)/);
    if (categoryMatch) {
      metadata.category = categoryMatch[1];
    }

    // Extract @keywords
    const keywordsMatch = jsdoc.match(/@keywords\s+([^\n]+)/);
    if (keywordsMatch) {
      metadata.keywords = keywordsMatch[1]
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
    }

    // Extract @deprecated
    const deprecatedMatch = jsdoc.match(/@deprecated\s*([^\n]*)/);
    if (deprecatedMatch) {
      metadata.deprecated = true;
      metadata.deprecationMessage = deprecatedMatch[1].trim() || undefined;
    }

    // Extract description (first line of JSDoc that's not a tag)
    const descriptionMatch = jsdoc.match(/\/\*\*\s*\n\s*\*\s*([^@\n]+)/);
    if (descriptionMatch) {
      metadata.description = descriptionMatch[1].trim();
    }

    return metadata;
  }

  /**
   * Get all methods for a specific page
   * Applies filtering based on used_pom_methods.json if available
   * Accepts both class name (e.g., "ClickWheel") and property name (e.g., "clickWheel")
   */
  async getMethodsForPage(pageName: string): Promise<MethodMetadata[]> {
    const structure = await this.scan();
    
    // Try both the original name and the camelCase version
    let pageInfo = structure.pages.get(pageName);
    
    // If not found, try converting camelCase to PascalCase (e.g., "clickWheel" -> "ClickWheel")
    if (!pageInfo && pageName.length > 0) {
      const pascalCase = pageName.charAt(0).toUpperCase() + pageName.slice(1);
      pageInfo = structure.pages.get(pascalCase);
    }
    
    if (!pageInfo) {
      return [];
    }
    
    // If we have a filter, check both the class name and camelCase version
    if (this.usedMethodsFilter) {
      const camelCaseName = this.toCamelCase(pageInfo.className);
      const allowedMethods = this.usedMethodsFilter.get(camelCaseName) || this.usedMethodsFilter.get(pageInfo.className);
      
      if (allowedMethods) {
        const filteredMethods = pageInfo.methods.filter(method => allowedMethods.has(method.name));
        
        console.log(`🔍 Filtered ${pageInfo.className}: ${filteredMethods.length}/${pageInfo.methods.length} methods (only used in tests)`);
        
        return filteredMethods;
      }
    }
    
    // If no filter for this page, return all methods
    return pageInfo.methods;
  }

  /**
   * Get all available page names
   */
  async getAvailablePages(): Promise<string[]> {
    const structure = await this.scan();
    return Array.from(structure.pages.keys());
  }

  /**
   * Clear the cache to force a fresh scan
   */
  clearCache(): void {
    this.cache = null;
  }
}
