import { Page } from "@playwright/test";
import fs from "fs";
import path from "path";
import axios from "axios";
import { apiLogger, APILogEntry } from "./llm_providers/api_logger";
import { forceScreenshotWithRetries } from "./screenshot_helper";

// ---------------------------------------------------------------------------
// Robustly load the root-level Playwright config regardless of whether we are
// running from the source tree (ts-node) or a deeply nested compiled file in
// dist/esm/… .  We obtain an absolute path from the project root (assumed to be
// the current working directory when the consumer script is launched).
// ---------------------------------------------------------------------------
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Resolve to <cwd>/playwright.config.cjs (or .js if the CJS variant is absent).
let configPath = path.resolve(process.cwd(), "playwright.config.cjs");
if (!fs.existsSync(configPath)) {
  configPath = path.resolve(process.cwd(), "playwright.config.js");
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const playwrightConfig = fs.existsSync(configPath) ? require(configPath) : { aiConfig: {} };

// Create a global object to track token usage
// This avoids TypeScript errors with the global object
interface TokenStats {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalApiCalls: number;
}

// Create a global variable in a type-safe way
const globalStats: TokenStats = {
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalApiCalls: 0
};

interface RefinementContext {
  failingLocator: string;
  errorMessage: string;
  conflictingElementsHTML: string;
}

interface ContainerInfo {
  selector: string;
  type: 'card' | 'section' | 'panel' | 'container' | 'element';
  containsTarget: boolean;
  screenshotWorthy: boolean;
  description: string;
  children: string[];
  // Internal ranking fields (not sent verbatim to LLM)
  area?: number;
  hasTestId?: boolean;
  interactiveChildCount?: number;
}

interface ThinkingEntry {
  step?: number;
  code: string;
  thinking?: string;
  timestamp: string;
  url?: string;
}

export class AIUtilsEnhanced {
  private page: Page;
  private referenceImagesDir: string;
  private currentMdPath: string | null = null;
  public thinkingHistory: ThinkingEntry[] = [];

  constructor(page: Page, referenceImagesDir: string = "./reference_images") {
    this.page = page;
    this.referenceImagesDir = referenceImagesDir;
    this.thinkingHistory = [];
    // Token statistics will be shown at the end of execution
  }
  
  /**
   * Set the current markdown file path
   * This should be called by the page helper when processing a markdown file
   */
  public setCurrentMdFilePath(mdPath: string): void {
    console.log(`📝 Setting current markdown file path: ${mdPath}`);
    this.currentMdPath = mdPath;
    // Also set it as an environment variable for other components
    process.env.CURRENT_MD_PATH = mdPath;
  }
  
  /**
   * Write comprehensive token usage summary to a log file
   * This is called at the end of execution
   */
  public writeTokenUsageSummary(outputPath: string = 'token_usage_summary.txt', thinkingLogPath: string = 'ai_thinking_log.txt'): void {
    try {
      // Write token usage summary
      const timestamp = new Date().toISOString();
      
      // Format numbers with commas for readability
      const formatNumber = (num: number): string => num.toLocaleString();
      
      const summary = [
        `\n=============================================`,
        `        COMPREHENSIVE TOKEN USAGE REPORT`,
        `             ${timestamp}`,
        `=============================================`,
        `Total Input Tokens:        ${formatNumber(globalStats.totalInputTokens)}`,
        `Total Output Tokens:       ${formatNumber(globalStats.totalOutputTokens)}`,
        `TOTAL TOKENS USED:         ${formatNumber(globalStats.totalInputTokens + globalStats.totalOutputTokens)}`,
        `---------------------------------------------`,
        `Total API Calls:           ${formatNumber(globalStats.totalApiCalls)}`,
        `Average Tokens Per Call:   ${formatNumber(Math.round((globalStats.totalInputTokens + globalStats.totalOutputTokens) / (globalStats.totalApiCalls || 1)))}`,
        `---------------------------------------------`,
        `Estimated Cost ($0.0005/1K tokens): $${((globalStats.totalInputTokens + globalStats.totalOutputTokens) * 0.0005 / 1000).toFixed(4)}`,
        `=============================================`
      ].join('\n');
      
      fs.appendFileSync(outputPath, summary + '\n\n');
      
      // Print the final report to console as well
      console.log(summary);
      
      // Write AI thinking logs if we have any stored
      if (this.thinkingHistory && this.thinkingHistory.length > 0) {
        const thinkingLog = [
          `\n===== AI Thinking Log (${timestamp}) =====`,
          ...this.thinkingHistory.map((entry, index) => 
            `\n--- Step ${index + 1} ---\n${entry.thinking || 'No thinking provided'}`
          ),
          '\n=========================================='
        ].join('\n');
        
        fs.appendFileSync(thinkingLogPath, thinkingLog + '\n\n');
        console.log(`🧠 AI thinking log written to ${thinkingLogPath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to write logs: ${error.message}`);
    }
  }

  /**
   * Build a rich, hierarchical summary of visible containers and their interactive elements.
   * This is designed to give the LLM a high-fidelity mental model of the page structure.
   */
  public async getSmartVisibleContainersSummary(): Promise<{
    url: string;
    viewport: { width: number; height: number };
    containers: Array<{
      uid: number;
      selector: string;
      type: string;
      semanticTag?: string;
      testId?: string;
      id?: string;
      role?: string;
      ariaLabel?: string;
      classes?: string;
      bbox: { x: number; y: number; width: number; height: number };
      area: number;
      zIndex: number;
      scrollable: boolean;
      isLandmark: boolean;
      isModalLike: boolean;
      headerText?: string;
      keywords?: string[];
      elementCount: number;
      interactiveCount: number;
      parentUid?: number;
      childrenUids: number[];
    }>;
    elements: Array<{
      uid: number;
      containerUid?: number;
      tag: string;
      role?: string;
      testId?: string;
      id?: string;
      name?: string;
      ariaLabel?: string;
      title?: string;
      text?: string;
      bbox: { x: number; y: number; width: number; height: number };
      ancestorTestIds?: string[];
    }>;
    landmarks: number[]; // container uids with landmark semantics
  }> {
    return await this.page.evaluate(() => {
      function isVisible(el: HTMLElement): boolean {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity || '1') === 0) return false;
        return true;
      }

      function isScrollable(el: HTMLElement): boolean {
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        return (overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
      }

      function getZIndex(el: HTMLElement): number {
        const z = window.getComputedStyle(el).zIndex;
        const n = Number(z);
        return Number.isFinite(n) ? n : 0;
      }

      function getUniqueSelector(el: HTMLElement, maxDepth = 5): string {
        if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
        if (el.id && !/^mui-|^id\d+|.*-\d+$/.test(el.id)) return `#${el.id}`;
        const classes = (el.className && typeof el.className === 'string') ? el.className.trim().split(/\s+/).filter(Boolean) : [];
        if (classes.length > 0) {
          const clsSel = '.' + classes.slice(0, 3).join('.');
          if (document.querySelectorAll(clsSel).length === 1) return clsSel;
        }
        let current: HTMLElement | null = el;
        let depth = 0;
        const parts: string[] = [];
        while (current && depth < maxDepth) {
          let part = current.tagName.toLowerCase();
          if (current.id && !/^mui-|^id\d+|.*-\d+$/.test(current.id)) {
            part += `#${current.id}`;
            parts.unshift(part);
            break;
          } else if (current.getAttribute('data-testid')) {
            part += `[data-testid="${current.getAttribute('data-testid')}" ]`;
            parts.unshift(part);
            break;
          } else {
            const parent = current.parentElement;
            if (!parent) { parts.unshift(part); break; }
            const index = Array.from(parent.children).indexOf(current) + 1;
            part += `:nth-child(${index})`;
            parts.unshift(part);
          }
          current = current.parentElement;
          depth++;
        }
        return parts.join(' > ');
      }

      function collectTextKeywords(root: HTMLElement, max = 5): string[] {
        const text = (root.innerText || '').toLowerCase();
        const tokens = text.split(/[^a-z0-9]+/i).filter(t => t.length >= 4);
        const stop = new Set(['with','from','that','this','have','your','will','into','there','their','about','after','before','which','such','were','been','more','only','like','when','then','over','also','view','main','menu','panel','card','section','content','container']);
        const freq: Record<string, number> = {};
        for (const t of tokens) {
          if (stop.has(t)) continue;
          freq[t] = (freq[t] || 0) + 1;
        }
        return Object.entries(freq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, max)
          .map(([t]) => t);
      }

      const candidateSelectors = [
        'main', 'section', 'article', 'aside', 'nav', 'header', 'footer',
        '[role="main"]', '[role="navigation"]', '[role="dialog"]', '[role="menu"]', '[role="toolbar"]', '[role="region"]',
        '[data-testid]', '.MuiCard-root', '.MuiPaper-root', '.MuiAccordion-root', '.MuiDialog-root', '.modal', '.dialog',
        'form', 'fieldset', 'div[class*="container"], div[class*="panel"], div[class*="card"], div[class*="section"]'
      ];

      const allCandidates = new Set<HTMLElement>();
      for (const sel of candidateSelectors) {
        document.querySelectorAll(sel).forEach(el => { if (el instanceof HTMLElement) allCandidates.add(el); });
      }

      const containersRaw: Array<any> = [];
      let uidCounter = 1;
      for (const el of allCandidates) {
        if (!isVisible(el)) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width < 100 || rect.height < 60) continue;
        const role = el.getAttribute('role') || undefined;
        const testId = el.getAttribute('data-testid') || undefined;
        const semanticTag = el.tagName.toLowerCase();
        const classes = (el.className && typeof el.className === 'string') ? el.className.split(' ').filter(Boolean).slice(0, 8).join(' ') : undefined;
        const ariaLabel = el.getAttribute('aria-label') || undefined;
        const id = el.id || undefined;
        const header = el.querySelector('h1,h2,h3,h4,h5,h6');
        const headerText = header && isVisible(header as HTMLElement) ? (header as HTMLElement).innerText.trim().substring(0, 120) : undefined;
        const keywords = collectTextKeywords(el, 6);
        const container = {
          uid: uidCounter++,
          el,
          selector: getUniqueSelector(el),
          type: (classes || '').includes('Card') || (classes || '').toLowerCase().includes('card') ? 'card'
                : (classes || '').toLowerCase().includes('panel') ? 'panel'
                : (classes || '').toLowerCase().includes('container') ? 'container'
                : ['main','section','article','aside','nav','header','footer'].includes(semanticTag) ? 'section'
                : 'element',
          semanticTag,
          testId,
          id,
          role,
          ariaLabel,
          classes,
          bbox: { x: Math.round(rect.left), y: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) },
          area: Math.round(rect.width * rect.height),
          zIndex: getZIndex(el),
          scrollable: isScrollable(el),
          isLandmark: ['main','nav','header','footer'].includes(semanticTag) || ['main','navigation','dialog','menu','region','toolbar'].includes(role || ''),
          isModalLike: (role === 'dialog') || el.getAttribute('aria-modal') === 'true' || (classes || '').toLowerCase().includes('modal') || (classes || '').toLowerCase().includes('dialog'),
          headerText,
          keywords,
          elementCount: 0,
          interactiveCount: 0,
          parentUid: undefined as number | undefined,
          childrenUids: [] as number[],
        };
        containersRaw.push(container);
      }

      // Establish parent-child relationships among containers
      for (const c of containersRaw) {
        let closestParent: any | null = null;
        for (const p of containersRaw) {
          if (p === c) continue;
          if (p.el.contains(c.el)) {
            if (!closestParent || closestParent.el.contains(p.el)) {
              closestParent = p;
            }
          }
        }
        if (closestParent) {
          c.parentUid = closestParent.uid;
          closestParent.childrenUids.push(c.uid);
        }
      }

      const interactiveSel = 'button, input:not([type="hidden"]), select, textarea, a[href], [role], [data-testid], [data-cy], [contenteditable="true"]';
      const elements: Array<any> = [];
      let elemUid = 1;
      document.querySelectorAll(interactiveSel).forEach(el => {
        if (!(el instanceof HTMLElement)) return;
        if (!isVisible(el)) return;
        const rect = el.getBoundingClientRect();
        const role = el.getAttribute('role') || undefined;
        const e = {
          uid: elemUid++,
          el,
          tag: el.tagName.toLowerCase(),
          role,
          testId: el.getAttribute('data-testid') || undefined,
          id: el.id || undefined,
          name: el.getAttribute('name') || undefined,
          ariaLabel: el.getAttribute('aria-label') || undefined,
          title: el.getAttribute('title') || undefined,
          text: (el.innerText || el.textContent || '').trim().substring(0, 120) || undefined,
          bbox: { x: Math.round(rect.left), y: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) },
          ancestorTestIds: Array.from(el.closest('[data-testid]') ? [el.closest('[data-testid]') as HTMLElement] : [])
            .map(e => e.getAttribute('data-testid') || '')
            .filter(Boolean)
            .slice(0, 3),
          containerUid: undefined as number | undefined,
        };
        // assign to nearest containing container
        let candidate: any | null = null;
        for (const c of containersRaw) {
          if (c.el.contains(el)) {
            if (!candidate) candidate = c;
            else if (candidate.el.contains(c.el)) candidate = c; // choose the deepest container
          }
        }
        if (candidate) {
          e.containerUid = candidate.uid;
          candidate.elementCount += 1;
          candidate.interactiveCount += 1;
        }
        elements.push(e);
      });

      // Finalize output by dropping node references
      const containers = containersRaw.map((c: any) => ({
        uid: c.uid,
        selector: c.selector,
        type: c.type,
        semanticTag: c.semanticTag,
        testId: c.testId,
        id: c.id,
        role: c.role,
        ariaLabel: c.ariaLabel,
        classes: c.classes,
        bbox: c.bbox,
        area: c.area,
        zIndex: c.zIndex,
        scrollable: c.scrollable,
        isLandmark: c.isLandmark,
        isModalLike: c.isModalLike,
        headerText: c.headerText,
        keywords: c.keywords,
        elementCount: c.elementCount,
        interactiveCount: c.interactiveCount,
        parentUid: c.parentUid,
        childrenUids: c.childrenUids,
      }));

      const cleanElements = elements.map(e => ({
        uid: e.uid,
        containerUid: e.containerUid,
        tag: e.tag,
        role: e.role,
        testId: e.testId,
        id: e.id,
        name: e.name,
        ariaLabel: e.ariaLabel,
        title: e.title,
        text: e.text,
        bbox: e.bbox,
        ancestorTestIds: e.ancestorTestIds,
      }));

      const landmarks = containers.filter(c => c.isLandmark).map(c => c.uid);

      return {
        url: window.location.href,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        containers,
        elements: cleanElements,
        landmarks,
      };
    });
  }

  /**
   * Enhanced container extraction - finds screenshot-worthy containers
   */
  private async getScreenshotContainers(hints?: { texts?: string[]; testIds?: string[]; roles?: string[] }): Promise<ContainerInfo[]> {
    return await this.page.evaluate((hintsIn: { texts?: string[]; testIds?: string[]; roles?: string[] } | undefined) => {
      function isVisible(el: HTMLElement): boolean {
        if (!el || !el.offsetParent) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }

      function getUniqueSelector(element: HTMLElement, maxDepth = 5): string {
        // First try data-testid, data-cy, role, aria-label, name
        if (element.getAttribute('data-testid'))
          return `[data-testid="${element.getAttribute('data-testid')}"]`;
        if (element.getAttribute('data-cy')) 
          return `[data-cy="${element.getAttribute('data-cy')}"]`;
        if (element.getAttribute('role')) 
          return `[role="${element.getAttribute('role')}"]`;
        if (element.getAttribute('aria-label'))
          return `[aria-label="${element.getAttribute('aria-label')}"]`;
        if (element.getAttribute('name')) 
          return `[name="${element.getAttribute('name')}"]`;

        // Only use ID if it's not auto-generated
        if (element.id) {
          const { id } = element;
          if (!/^(mui-|id\d+|.*-\d+)$/.test(id)) {
            return `#${id}`;
          }
        }

        // Try class-based selector if available
        if (element.classList && element.classList.length) {
          const classSelector = '.' + Array.from(element.classList).join('.');
          if (document.querySelectorAll(classSelector).length === 1) return classSelector;
        }

        // Enhanced parent traversal: Look for parents with identifiers
        let current = element.parentElement;
        let depth = 0;
        
        while (current && depth < maxDepth) {
          const parentTestId = current.getAttribute('data-testid');
          const parentDataCy = current.getAttribute('data-cy');
          const parentRole = current.getAttribute('role');
          const parentAriaLabel = current.getAttribute('aria-label');
          const parentName = current.getAttribute('name');
          const parentId = current.id && !/^(mui-|id\d+|.*-\d+)$/.test(current.id) ? current.id : null;
          
          let parentSelector = null;
          if (parentTestId) {
            parentSelector = `[data-testid="${parentTestId}"]`;
          } else if (parentDataCy) {
            parentSelector = `[data-cy="${parentDataCy}"]`;
          } else if (parentRole) {
            parentSelector = `[role="${parentRole}"]`;
          } else if (parentAriaLabel) {
            parentSelector = `[aria-label="${parentAriaLabel}"]`;
          } else if (parentName) {
            parentSelector = `[name="${parentName}"]`;
          } else if (parentId) {
            parentSelector = `#${parentId}`;
          }
          
          if (parentSelector) {
            const siblings = Array.from(current.children);
            const index = siblings.indexOf(element) + 1;
            const combinedSelector = `${parentSelector} > :nth-child(${index})`;
            
            if (document.querySelectorAll(combinedSelector).length === 1) {
              return combinedSelector;
            }
          }
          
          current = current.parentElement;
          depth += 1;
        }

        return element.tagName.toLowerCase();
      }

      function isScreenshotWorthy(element: HTMLElement): boolean {
        const rect = element.getBoundingClientRect();
        
        // Size check - relaxed thresholds
        const minWidth = 100;  // Reduced from 200px
        const minHeight = 50;  // Reduced from 100px
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Skip tiny elements
        if (rect.width < minWidth || rect.height < minHeight) return false;
        
        // Skip elements that are larger than the viewport
        if (rect.width > viewportWidth * 1.1 || rect.height > viewportHeight * 1.1) return false;
        
        // Check element attributes (prioritize elements with these attributes)
        if (element.hasAttribute('data-testid')) return true;
        if (element.hasAttribute('data-test')) return true;
        if (element.hasAttribute('data-cy')) return true;
        if (element.hasAttribute('data-e2e')) return true;
        if (element.hasAttribute('data-automation-id')) return true;
        if (element.hasAttribute('role')) return true;
        if (element.id && element.id.length > 0) return true;
        
        // Check for container-like classes (much more comprehensive)
        const className = element.className || '';
        if (typeof className !== 'string') return false;
        
        const classStr = className.toLowerCase();
        const containerPatterns = [
          'card', 'panel', 'section', 'container', 'box', 'wrapper', 
          'content', 'main', 'sidebar', 'dialog', 'modal', 'popup', 
          'drawer', 'menu', 'dropdown', 'popover', 'result', 'list',
          'table', 'grid', 'view', 'form', 'widget', 'component',
          'root', 'paper', 'sheet', 'body', 'frame', 'search'
        ];
        
        const hasContainerClass = containerPatterns.some(pattern => 
          classStr.includes(pattern)
        );
        
        // Check for semantic elements (expanded list)
        const semanticTags = [
          'main', 'section', 'article', 'aside', 'header', 'footer',
          'nav', 'form', 'dialog', 'table', 'figure', 'details'
        ];
        const isSemantic = semanticTags.includes(element.tagName.toLowerCase());
        
        // Check for ARIA attributes that suggest important containers
        const hasAriaAttributes = element.hasAttribute('aria-label') || 
                                  element.hasAttribute('aria-labelledby') || 
                                  element.hasAttribute('aria-describedby');
        
        // Final check: either has container class, is semantic element, or has ARIA attributes
        return hasContainerClass || isSemantic || hasAriaAttributes;
      }

      function getContainerType(element: HTMLElement): 'card' | 'section' | 'panel' | 'container' | 'element' {
        const className = element.className || '';
        const testId = element.getAttribute('data-testid') || '';
        
        if (className.includes('card') || className.includes('Card') || testId.includes('card')) {
          return 'card';
        }
        if (className.includes('panel') || className.includes('Panel') || testId.includes('panel')) {
          return 'panel';
        }
        if (className.includes('section') || className.includes('Section') || testId.includes('section')) {
          return 'section';
        }
        if (className.includes('container') || className.includes('Container')) {
          return 'container';
        }
        return 'element';
      }

      function getContainerDescription(element: HTMLElement): string {
        // Basic element information
        const text = element.textContent?.trim().substring(0, 100) || '';
        const testId = element.getAttribute('data-testid') || '';
        const role = element.getAttribute('role') || '';
        const ariaLabel = element.getAttribute('aria-label') || '';
        const id = element.id || '';
        const className = element.className || '';
        
        // Count interactive elements
        const buttons = element.querySelectorAll('button, [role="button"]').length;
        const inputs = element.querySelectorAll('input, select, textarea').length;
        const links = element.querySelectorAll('a, [role="link"]').length;
        
        // Get important child elements
        const headings = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          .map(h => h.textContent?.trim())
          .filter(Boolean)
          .slice(0, 2)
          .join(', ');
        
        // Check for common UI patterns
        const hasTable = element.querySelector('table, [role="table"], [role="grid"]') !== null;
        const hasList = element.querySelector('ul, ol, [role="list"]') !== null;
        const hasForm = element.querySelector('form, [role="form"]') !== null;
        const hasImage = element.querySelector('img') !== null;
        
        // Build a comprehensive description
        let description = `${element.tagName.toLowerCase()}`;
        
        if (testId) description += ` (testId="${testId}")`;
        if (id) description += ` (id="${id}")`;
        if (role) description += ` role="${role}"`;
        if (ariaLabel) description += ` aria-label="${ariaLabel}"`;
        
        // Add UI pattern information
        const patterns = [];
        if (hasTable) patterns.push('table');
        if (hasList) patterns.push('list');
        if (hasForm) patterns.push('form');
        if (hasImage) patterns.push('image');
        
        if (patterns.length > 0) {
          description += ` [contains: ${patterns.join(', ')}]`;
        }
        
        // Add interactive element counts
        const interactives = [];
        if (buttons > 0) interactives.push(`${buttons} buttons`);
        if (inputs > 0) interactives.push(`${inputs} inputs`);
        if (links > 0) interactives.push(`${links} links`);
        
        if (interactives.length > 0) {
          description += ` [interactive: ${interactives.join(', ')}]`;
        }
        
        // Add headings if available
        if (headings) {
          description += ` [heading: ${headings}]`;
        }
        
        // Add text sample if available
        if (text) {
          description += ` - ${text}`;
        }
        
        return description;
      }

      function getChildrenInfo(element: HTMLElement): string[] {
        // Get direct children
        const children = Array.from(element.children);
        
        // Get the most important children first (up to 8)
        return children.slice(0, 8).map(child => {
          if (!(child instanceof HTMLElement)) return '';
          
          const tag = child.tagName.toLowerCase();
          const testId = child.getAttribute('data-testid');
          const role = child.getAttribute('role');
          const ariaLabel = child.getAttribute('aria-label');
          const id = child.id;
          const className = child.className?.toString().split(' ')[0]; // Get first class only
          const text = child.textContent?.trim().substring(0, 40);
          
          // Determine if this is an interactive element
          const isButton = tag === 'button' || role === 'button';
          const isInput = tag === 'input' || tag === 'select' || tag === 'textarea';
          const isLink = tag === 'a' || role === 'link';
          
          // Build a descriptive string
          let info = tag;
          
          // Add most important attributes
          if (testId) info += `[data-testid="${testId}"]`;
          else if (id) info += `#${id}`;
          else if (className) info += `.${className}`;
          
          // Add role if available
          if (role) info += `[role="${role}"]`;
          
          // Add aria-label if available
          if (ariaLabel) info += `[aria-label="${ariaLabel}"]`;
          
          // Add type information for interactive elements
          if (isButton) info += ' (button)';
          else if (isInput) {
            const inputType = child instanceof HTMLInputElement ? child.type : 'input';
            info += ` (${inputType})`;
          }
          else if (isLink) info += ' (link)';
          
          // Add text content if available
          if (text) info += `: "${text}"`;
          
          return info;
        }).filter(Boolean);
      }

      function getInteractiveChildCount(element: HTMLElement): number {
        const interactiveSelector = 'button, input:not([type="hidden"]), select, textarea, [role], a[href], [data-testid], [data-cy]';
        return element.querySelectorAll(interactiveSelector).length;
      }

      function elementContainsHints(element: HTMLElement, hintsLocal?: { texts?: string[]; testIds?: string[]; roles?: string[] }): boolean {
        if (!hintsLocal) return false;
        const { texts = [], testIds = [], roles = [] } = hintsLocal;
        const lcText = (element.textContent || '').toLowerCase();
        if (texts.some(t => t && lcText.includes(t.toLowerCase()))) return true;
        if (testIds.length > 0) {
          const anyTestId = element.closest('[data-testid]') as HTMLElement | null;
          if (anyTestId && testIds.includes(anyTestId.getAttribute('data-testid') || '')) return true;
          const directMatch = Array.from(element.querySelectorAll('[data-testid]')).some(el => testIds.includes((el as HTMLElement).getAttribute('data-testid') || ''));
          if (directMatch) return true;
        }
        if (roles.length > 0) {
          const anyRole = element.closest('[role]') as HTMLElement | null;
          if (anyRole && roles.includes(anyRole.getAttribute('role') || '')) return true;
          const roleMatch = Array.from(element.querySelectorAll('[role]')).some(el => roles.includes((el as HTMLElement).getAttribute('role') || ''));
          if (roleMatch) return true;
        }
        return false;
      }

      // Find all potential screenshot containers
      const containers: ContainerInfo[] = [];
      
      // Look for common container selectors - expanded to find more relevant UI elements
      const containerSelectors = [
        // Data attribute selectors (most stable)
        '[data-testid]',
        '[data-test]',
        '[data-cy]',
        '[data-e2e]',
        '[data-automation-id]',
        '[data-qa]',
        '[data-ref]',
        '[data-target]',
        '[data-id]',
        
        // Specific data-testid patterns
        '[data-testid*="card"]',
        '[data-testid*="panel"]', 
        '[data-testid*="section"]',
        '[data-testid*="container"]',
        '[data-testid*="list"]',
        '[data-testid*="table"]',
        '[data-testid*="grid"]',
        '[data-testid*="dialog"]',
        '[data-testid*="modal"]',
        '[data-testid*="drawer"]',
        '[data-testid*="menu"]',
        '[data-testid*="form"]',
        '[data-testid*="view"]',
        '[data-testid*="page"]',
        '[data-testid*="screen"]',
        '[data-testid*="result"]',
        '[data-testid*="search"]',
        '[data-testid*="dropdown"]',
        '[data-testid*="popup"]',
        
        // UI Framework components (not just Material UI)
        // Material UI
        '[class*="MuiCard"]',
        '[class*="MuiPaper"]',
        '[class*="MuiDialog"]',
        '[class*="MuiPopover"]',
        '[class*="MuiMenu"]',
        '[class*="MuiDrawer"]',
        
        // Bootstrap
        '.card',
        '.modal',
        '.dropdown',
        '.container',
        '.panel',
        
        // Generic UI components
        '[class*="card"]',
        '[class*="panel"]',
        '[class*="modal"]',
        '[class*="dialog"]',
        '[class*="popup"]',
        '[class*="container"]',
        '[class*="drawer"]',
        '[class*="menu"]',
        '[class*="dropdown"]',
        '[class*="popover"]',
        '[class*="result"]',
        '[class*="list"]',
        '[class*="table"]',
        '[class*="grid"]',
        '[class*="view"]',
        '[class*="wrapper"]',
        '[class*="search-result"]',
        
        // Semantic HTML elements
        'main',
        'section',
        'article',
        'aside',
        'header',
        'footer',
        'nav',
        'form',
        'dialog',
        'table',
        
        // Role-based selectors (broader set)
        '[role]',  // Any element with a role
        '[role="dialog"]',
        '[role="tabpanel"]',
        '[role="menu"]',
        '[role="listbox"]',
        '[role="grid"]',
        '[role="table"]',
        '[role="region"]',
        '[role="complementary"]',
        '[role="navigation"]',
        '[role="search"]',
        '[role="alert"]',
        '[role="alertdialog"]',
        '[role="banner"]',
        '[role="combobox"]',
        '[role="feed"]',
        '[role="form"]',
        '[role="main"]',
        '[role="presentation"]',
        '[role="tooltip"]',
        
        // Elements with specific attributes that suggest they're important containers
        '[aria-label]',
        '[aria-labelledby]',
        '[aria-describedby]',
        '[aria-controls]',
        '[aria-expanded="true"]',
        
        // ID-based selectors for common container naming patterns
        '[id*="container"]',
        '[id*="panel"]',
        '[id*="dialog"]',
        '[id*="modal"]',
        '[id*="popup"]',
        '[id*="menu"]',
        '[id*="drawer"]',
        '[id*="results"]',
        '[id*="search"]'
      ];

      containerSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          if (el instanceof HTMLElement && isVisible(el) && isScreenshotWorthy(el)) {
            const rect = el.getBoundingClientRect();
            containers.push({
              selector: getUniqueSelector(el),
              type: getContainerType(el),
              containsTarget: elementContainsHints(el, hintsIn),
              screenshotWorthy: true,
              description: getContainerDescription(el),
              children: getChildrenInfo(el),
              area: Math.round(rect.width * rect.height),
              hasTestId: !!el.getAttribute('data-testid'),
              interactiveChildCount: getInteractiveChildCount(el)
            });
          }
        });
      });

      // Also look for any div with container-like classes
      const allDivs = document.querySelectorAll('div');
      allDivs.forEach((el) => {
        if (el instanceof HTMLElement && isVisible(el) && isScreenshotWorthy(el)) {
          const selector = getUniqueSelector(el);
          // Avoid duplicates
          if (!containers.some(c => c.selector === selector)) {
            const rect = (el as HTMLElement).getBoundingClientRect();
            containers.push({
              selector,
              type: getContainerType(el as HTMLElement),
              containsTarget: elementContainsHints(el as HTMLElement, hintsIn),
              screenshotWorthy: true,
              description: getContainerDescription(el as HTMLElement),
              children: getChildrenInfo(el as HTMLElement),
              area: Math.round(rect.width * rect.height),
              hasTestId: !!(el as HTMLElement).getAttribute('data-testid'),
              interactiveChildCount: getInteractiveChildCount(el as HTMLElement)
            });
          }
        }
      });

      // Rank & dedupe to reduce tokens
      const viewportArea = Math.max(1, window.innerWidth * window.innerHeight);
      const idealAreaMin = viewportArea * 0.10;
      const idealAreaMax = viewportArea * 0.85;

      // Enhanced scoring algorithm to prioritize the most relevant containers
      const scored = containers.map((c) => {
        let score = 0;
        
        // Target relevance - highest priority
        if (c.containsTarget) score += 50;
        
        // Selector quality - prefer data-testid and semantic elements
        if (c.hasTestId) score += 25; // Increased from 15
        if (c.selector.startsWith('[data-testid')) score += 15;
        if (c.selector.startsWith('[role=')) score += 10;
        if (c.selector.startsWith('#')) score += 8;
        if (c.selector.startsWith('.')) score += 5;
        
        // Container type - prefer semantic containers
        if (c.type === 'card') score += 15;
        if (c.type === 'panel') score += 12;
        if (c.type === 'section') score += 10;
        if (c.type === 'container') score += 8;
        
        // Size appropriateness - not too small, not too big
        const area = c.area || 0;
        const viewportArea = window.innerWidth * window.innerHeight;
        const areaRatio = area / viewportArea;
        
        // Perfect size: between 10% and 85% of viewport
        if (area >= idealAreaMin && area <= idealAreaMax) score += 15;
        // Too small: less than 5% of viewport
        if (area > 0 && area < idealAreaMin * 0.5) score -= 10;
        // Too large: more than 90% of viewport
        if (area > idealAreaMax * 1.2) score -= 15;
        // Ideal size is around 30-60% of viewport
        if (areaRatio >= 0.3 && areaRatio <= 0.6) score += 10;
        
        // Interactive elements - containers with interactive elements are likely important
        const interactiveCount = c.interactiveChildCount || 0;
        if (interactiveCount > 0) {
          // Add points for interactive elements, but cap at 20
          score += Math.min(20, interactiveCount * 2);
        }
        
        // Depth in DOM - prefer containers that aren't too deeply nested
        const depthMatch = c.selector.match(/>/g);
        const depth = depthMatch ? depthMatch.length + 1 : 1;
        if (depth <= 3) score += 5; // Prefer shallower containers
        if (depth > 5) score -= 5; // Penalize deeply nested containers
        
        return { ...(c as any), score };
      }) as Array<ContainerInfo & { score: number }>;

      scored.sort((a, b) => b.score - a.score);
      const seen = new Set<string>();
      const uniqueRanked: ContainerInfo[] = [];
      for (const c of scored) {
        const key = `${c.type}|${c.selector.replace(/:nth-child\(\d+\)/g, ':nth-child(*)')}`;
        if (seen.has(key)) continue;
        seen.add(key);
        uniqueRanked.push(c);
      }

      return uniqueRanked;
    }, hints);
  }

  /**
   * Enhanced prompt generation with container information
   */
  async generateEnhancedPrompt(
    base64Screenshot: string,
    codeContext: string,
    imgFileName: string | null,
    refinementContext?: RefinementContext,
    thinking?: string,
    screenshotIntent?: string
  ): Promise<string> {
    try {
      const { aiConfig } = playwrightConfig;
      // Prefer explicit override via env or hardcoded endpoint provided by user
      const overrideEndpoint = process.env.AZURE_OPENAI_ENDPOINT || 'https://dhanu-m7k6n5e0-eastus2.cognitiveservices.azure.com/openai/deployments/gpt-5-chat/chat/completions?api-version=2025-01-01-preview';
      const endpoint = overrideEndpoint || `${aiConfig.apiUrl}/openai/deployments/${aiConfig.ivModel}/chat/completions?api-version=${aiConfig.apiVersion}`;
      const apiKey = process.env.AZURE_OPENAI_API_KEY || aiConfig.apiKey;

      // Take a screenshot with container highlighting
      let enhancedScreenshotBase64 = '';
      try {
        console.log('📸 Taking screenshot with highlighted containers...');
        enhancedScreenshotBase64 = await this.takeHighlightedScreenshot();
        console.log('✅ Container-highlighted screenshot captured successfully');
      } catch (error) {
        console.warn('⚠️ Failed to take highlighted screenshot:', error);
        // If we failed to take a highlighted screenshot, use the provided screenshot
        enhancedScreenshotBase64 = base64Screenshot;
      }

      // Build a rich, hierarchical summary of containers and elements
      const smartSummary = await this.getSmartVisibleContainersSummary();
      const pageUrl = smartSummary.url;
      const condensedContainers = smartSummary.containers
        .slice(0, 50) // Increased from 30 to 50 for more comprehensive container information
        .map(c => ({
          uid: c.uid,
          type: c.type,
          selector: c.selector,
          role: c.role,
          testId: c.testId,
          bbox: c.bbox,
          keywords: c.keywords?.slice(0, 5) || [],
          headerText: c.headerText,
          interactiveCount: c.interactiveCount,
          isLandmark: c.isLandmark,
          isModalLike: c.isModalLike
        }));

      // Also collect a compact element listing grouped by container
      const compactElements = smartSummary.elements
        .slice(0, 300) // Increased from 200 to 300 for more comprehensive element information
        .map(e => ({
          uid: e.uid,
          containerUid: e.containerUid,
          tag: e.tag,
          role: e.role,
          testId: e.testId,
          id: e.id,
          text: e.text?.substring(0, 80),
        }));

      // Keep page-level compact context
      const viewport = smartSummary.viewport;
      
      // Get page content with better element extraction (for minimal compatibility info)
      const pageContent = await this.page.evaluate(() => {
        function isVisible(el: HTMLElement): boolean {
          if (!el || !el.offsetParent) return false;
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }

        function getAttrs(el: HTMLElement) {
          const parent = el.parentElement;
          const parentIdentifier = parent ? {
            id: parent.id || undefined,
            'data-testid': parent.getAttribute('data-testid') || undefined,
            'data-cy': parent.getAttribute('data-cy') || undefined,
            role: parent.getAttribute('role') || undefined,
          } : undefined;

          const hasParentIdentifier = parentIdentifier && 
            (Object.values(parentIdentifier).some(val => val !== undefined));

          return {
            tag: el.tagName.toLowerCase(),
            id: el.id || undefined,
            'data-testid': el.getAttribute('data-testid') || undefined,
            'data-cy': el.getAttribute('data-cy') || undefined,
            role: el.getAttribute('role') || undefined,
            name: el.getAttribute('name') || undefined,
            text: el.textContent?.trim()?.substring(0, 30) || undefined,
            parent: hasParentIdentifier ? parentIdentifier : undefined
          };
        }

        const elements = Array.from(
          document.querySelectorAll(
            'button, input, select, [role="button"], [role="link"], [role="menuitem"], [data-cy], [data-testid], [contenteditable="true"]'
          )
        )
        .filter((el): el is HTMLElement => el instanceof HTMLElement && isVisible(el))
        .map(el => getAttrs(el))
        .filter(attrs => 
          attrs.id || 
          attrs['data-testid'] || 
          attrs['data-cy'] || 
          attrs.text || 
          attrs.parent
        );

        return { elements, url: window.location.href };
      });

      // Reduce and dedupe element list for compatibility section
      const seenElemKeys = new Set<string>();
      const minimalElements: Array<{ id?: string; testId?: string; role?: string; text?: string; parent?: { testId?: string; role?: string; id?: string } }> = [];
      for (const e of (pageContent.elements as any[])) {
        const key = `${e.id || ''}|${e['data-testid'] || ''}|${e.role || ''}|${(e.text || '').toLowerCase()}`;
        if (seenElemKeys.has(key)) continue;
        seenElemKeys.add(key);
        minimalElements.push({
          id: e.id,
          testId: e['data-testid'],
          role: e.role,
          text: e.text ? String(e.text).substring(0, 24) : undefined,
          parent: e.parent ? { testId: e.parent['data-testid'], role: e.parent.role, id: e.parent.id } : undefined,
        });
        if (minimalElements.length >= 40) break;
      }

      const systemPrompt = `You generate Playwright code to take screenshots of the correct UI container.

Choose a single, meaningful container that contains the target element based on the following strict priority order:

1. HIGHEST: Elements with [data-testid="search-dialog"], [data-testid="search-results"], or any [data-testid] that contains "search" or "dropdown"
2. Elements with any [data-testid] attribute (critical for stable automation)
3. Elements with stable [role] attributes like "dialog", "listbox", "menu", "combobox" that match the intent
4. Elements with stable IDs (not auto-generated ones)
5. Semantic containers (main, section, article, nav) that contain the search results
6. Elements with CSS classes that clearly indicate their purpose (.search-results, .dropdown, etc.)
7. Container elements with sensible dimensions (width > 100px and height > 50px)

IMPORTANT: For dropdown or search result containers, look SPECIFICALLY for:
- Elements that appeared after clicking a search input
- Elements containing results in a structured list
- Elements with visible borders or shadows indicating they're a dropdown
- Elements positioned below a search input

IMPORTANT ABOUT THE IMAGES:
You will receive two images:
1. The first image is the reference screenshot of what needs to be captured
2. The second image (if available) shows the same UI with container elements highlighted using colored borders and numbered labels to help you choose the correct container

The highlighted containers in the second image are color-coded and numbered. Each label shows:
- Container number
- Container type
- Test ID (if available)

Hover information (shown in tooltips) includes:
- Full selector information
- Selector type (data-testid, id, class, etc.)
- Additional attributes

Based on the described intent and reference image, choose the appropriate container using the highlighted containers in the second image.

DETAILED CONTAINER INFORMATION:
${condensedContainers.map((c, i) => {
  // Format bbox to be more readable
  const bbox = c.bbox ? `x:${c.bbox.x}, y:${c.bbox.y}, w:${c.bbox.width}, h:${c.bbox.height}` : 'unknown';
  
  // Get container elements if available
  const containerElements = compactElements.filter(e => e.containerUid === c.uid).slice(0, 5);
  const elementsList = containerElements.length > 0 
    ? `\n    Elements: ${containerElements.map(e => 
        `${e.tag}${e.testId ? `[data-testid="${e.testId}"]` : ''}${e.role ? `[role="${e.role}"]` : ''}${e.text ? `: "${e.text}"` : ''}`
      ).join(', ')}`
    : '';
  
  return `${i + 1}. [${c.uid}] ${c.type.toUpperCase()}: ${c.selector}
    Attributes: ${c.role ? `role="${c.role}"` : 'no role'}${c.testId ? `, data-testid="${c.testId}"` : ''}
    Position: ${bbox}
    Interactive elements: ${c.interactiveCount || 0}${(c.keywords && c.keywords.length) ? `\n    Keywords: ${c.keywords.join(', ')}` : ''}${c.headerText ? `\n    Header: "${c.headerText}"` : ''}${c.isModalLike ? '\n    Type: modal-like container' : ''}${elementsList}`;
}).join('\n\n')}

URL: ${pageUrl}, Viewport: ${JSON.stringify(viewport)}

Rules:
1) Pick EXACTLY ONE best container that includes the target, following the priority order above.
2) Always prefer [data-testid] selectors over any other type when available.
3) For search dropdowns/dialogs, SPECIFICALLY use [data-testid="search-dialog"] if available.
5) Use page.locator() with CSS selectors instead of getByRole() when taking screenshots.
6) ALWAYS add a reasonable timeout (30000ms default).
7) FORCE ALL SCREENSHOT COMMANDS by adding { force: true } to all locators.
8) NEVER use .first() or .nth() in screenshot locators - use more specific selectors instead.
9) Return ONLY the exact Playwright screenshot command, no additional formatting or text.

RECOMMENDED SELECTOR PATTERNS (in order of preference):
- Data attributes: '[data-testid="element-name"]'
- Compound selectors with parent-child: 'div:has([data-testid="child-element"])'
- Specific classes: '.unique-container-class'
- Text content with data attributes: 'div:has-text("Title"):has([data-testid="content"])'
- Parent with multiple identifiers: 'div:has(.title):has(.content)'
- Elements with ARIA attributes: '[aria-label="Description"]'
- Elements with specific semantic roles: '[role="dialog"]'

EXAMPLES OF GOOD RESPONSES:
await page.locator('[data-testid="container-element"]').screenshot({ path: 'screenshots/element.png', timeout: 30000, force: true });
await page.locator('div:has([data-testid="child-element"])').screenshot({ path: './images/container.png', timeout: 30000, force: true });
await page.locator('.container-class').screenshot({ path: './output/screenshot.png', timeout: 30000, force: true });
await page.locator('div:has-text("Container Title"):has([data-testid="content"])').screenshot({ path: './screenshots/dialog.png', timeout: 30000, force: true });

if you suspect the finding the locator takes long then increase the timeout if not keep 30000 as default.
BAD RESPONSES (DO NOT DO THESE):
- Using non-specific role locators: await page.getByRole('listbox').screenshot()
- Using .first() on locators: await page.locator('.container').first().screenshot()
- Using generic text locators: await page.getByText('Some text').screenshot()
- Using complex chained locators: await page.locator('div').filter({ has: page.getByText('text') }).screenshot()
- Missing the force: true option: await page.locator('.selector').screenshot({ timeout: 30000 })
- Returning JSON objects
- Returning markdown code blocks
- Returning explanations before or after the code

OUTPUT FORMAT:
Return ONLY a single line of Playwright code. No explanations, no markdown, no JSON, no additional text.

Example correct output:
await page.locator('[data-testid="container"]').screenshot({ path: './images/screenshot.png', timeout: 30000, force: true });

JUST RETURN THE SINGLE LINE OF PLAYWRIGHT CODE AND NOTHING ELSE.
`;

      const userTextPrompt = `This is the intent of the screenshot: 
${screenshotIntent ? `SCREENSHOT INTENT: ${screenshotIntent}` : ''}
      this is what another agent came up with: ${codeContext}
      maybe its right or maybe its wrong.
${refinementContext ? `Previous attempt failed: ${refinementContext.errorMessage}` : ''}
${thinking ? `this is what the agent thought before generating the code: ${thinking}` : ''}`;

      const userMessageContent: Array<{ type: string; text?: string; image_url?: { url: string, detail?: string } }> =
        [{ type: "text", text: userTextPrompt }];
      
      // Add original reference screenshot if available
      if (base64Screenshot) {
        userMessageContent.push({
          type: "image_url",
          image_url: { url: `data:image/png;base64,${base64Screenshot}`, detail: "auto" }
        });
      }
      
      // Add container-highlighted screenshot if available
      if (enhancedScreenshotBase64 && enhancedScreenshotBase64 !== base64Screenshot) {
        userMessageContent.push({
          type: "image_url",
          image_url: { url: `data:image/png;base64,${enhancedScreenshotBase64}`, detail: "auto" }
        });
      }

      // Prompt logging removed as requested by user
      // Only log minimal stats when verbose mode is enabled
      if (process.env.VERBOSE_LLM === 'true') {
        console.log('📊 Making API call with images:', 
          base64Screenshot ? 'Original reference ✓' : 'Original reference ✗',
          enhancedScreenshotBase64 && enhancedScreenshotBase64 !== base64Screenshot ? 'Container-highlighted ✓' : 'Container-highlighted ✗');
      }

      const requestPayload = {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessageContent }
        ],
        temperature: 0.3,
        top_p: 0.8,
        max_tokens: 220,
      };

      const startTime = Date.now();

      if (process.env.VERBOSE_LLM === 'true') {
        console.log(`🔗 Azure OpenAI request -> ${endpoint}`);
        console.log(`   prompt tokens approx (user text prompt only): ${userTextPrompt.split(/\s+/).length}`);
      }
      
      let response;

      try {
        // Increment API call counter
        globalStats.totalApiCalls++;
        console.log(`📡 Making API call #${globalStats.totalApiCalls} to model`);
        
        response = await axios.post(endpoint, requestPayload, {
          headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey, 
          },
        });

        const duration = Date.now() - startTime;
        const aiContent: string = response.data.choices?.[0]?.message?.content || '';
        const inputTokenCount = response.data.usage?.prompt_tokens || 0;
        const outputTokenCount = response.data.usage?.completion_tokens || 0;
        
        // Declare variables for extracted content
        let cleaned = '';
        let parsedResponse;
        let extractedCode = '';
        let extractedThinking = '';
        
        // Store raw response for thinking extraction
        const rawResponse = aiContent;

        // Minimal debug logging
        if (process.env.VERBOSE_LLM === 'true') {
          console.log('🔍 AI response received, length:', aiContent.length);
        }
      
      // Update global token counters silently (without logging)
      globalStats.totalInputTokens += inputTokenCount;
      globalStats.totalOutputTokens += outputTokenCount;

      // Create log entry
      const logEntry: APILogEntry = {
          timestamp: new Date().toISOString(),
          provider: 'openai',
          model: 'gpt-5-chat',
          rawRequest: requestPayload || {}, // Add missing field
          rawResponse: response || {}, // Add missing field
          request: {
            systemInstruction: systemPrompt,
            userPrompt: userTextPrompt,
            hasImage: !!base64Screenshot,
            imageSize: base64Screenshot ? Buffer.from(base64Screenshot, 'base64').length : undefined,
            hasHighlightedImage: !!(enhancedScreenshotBase64 && enhancedScreenshotBase64 !== base64Screenshot),
            highlightedImageSize: (enhancedScreenshotBase64 && enhancedScreenshotBase64 !== base64Screenshot) 
              ? Buffer.from(enhancedScreenshotBase64, 'base64').length 
              : undefined,
            pageUrl: await this.page.url(),
            visibleElementsLength: userTextPrompt.length,
            previouslyExecutedCode: codeContext,
            currentStepErrorCode: refinementContext?.errorMessage || ''
          },
          response: {
            status: response.status,
            content: aiContent,
            inputTokenCount,
            outputTokenCount,
            totalTokens: inputTokenCount + outputTokenCount,
            thinking: extractedThinking || 'Enhanced container-based screenshot generation',
            code: extractedCode || aiContent,
          },
          metadata: {
            temperature: refinementContext ? 0.2 : 0.3,
            maxTokens: 1000,
            topP: 1,
          },
          duration,
        };
        apiLogger.logAPICall(logEntry);

        if (process.env.VERBOSE_LLM === 'true') {
          console.log(`✅ Azure response status: ${response.status}`);
        }

        // Clean potential fenced code and try to parse as JSON
        cleaned = aiContent
          .replace(/^```[a-zA-Z]*\s*/g, '')
          .replace(/```\s*$/g, '')
          .trim();

        // Default to using cleaned content as code
        extractedCode = cleaned;
        
        // First, try to extract the actual Playwright code if it's wrapped in code blocks or JSON
        // Look for patterns like: await page.locator(...).screenshot(...)
        const playwrightCodePattern = /(await\s+page\s*\.\s*\w+\s*\([^)]*\)\s*\.\s*screenshot\s*\([^;]*\)\s*;|page\s*\.\s*\w+\s*\([^)]*\)\s*\.\s*screenshot\s*\([^;]*\)\s*;)/;
        const codeMatch = cleaned.match(playwrightCodePattern);

        if (codeMatch && codeMatch[0]) {
          extractedCode = codeMatch[0].trim();
          console.log('✅ Successfully extracted Playwright screenshot code');
        } else {
          // If we couldn't find a direct Playwright code match, try to parse as JSON
          try {
            parsedResponse = JSON.parse(cleaned);
            if (parsedResponse && typeof parsedResponse === 'object' && parsedResponse.code && typeof parsedResponse.code === 'string') {
              // Extract just the code part from the JSON
              const codeStr = parsedResponse.code;
              const codeMatch = codeStr.match(playwrightCodePattern);
              if (codeMatch && codeMatch[0]) {
                extractedCode = codeMatch[0].trim();
                console.log('✅ Extracted Playwright code from JSON code field');
              } else {
                extractedCode = codeStr.trim();
                console.log('✅ Using code field from JSON response');
              }
              
              // Also extract thinking if available
              if (parsedResponse.thinking) {
                extractedThinking = String(parsedResponse.thinking);
                console.log('💭 THINKING from JSON: ' + extractedThinking);
              }
              
              // Extract screenshotIntent if available
              if (parsedResponse.screenshotIntent) {
                const extractedIntent = String(parsedResponse.screenshotIntent);
                console.log('📸 SCREENSHOT INTENT from JSON: ' + extractedIntent);
                // Store it for later use
                screenshotIntent = extractedIntent;
              }
            }
          } catch (jsonError) {
            console.warn('⚠️ Could not parse as JSON: ' + jsonError.message);
            
            // Try to find code blocks
            const codeBlockMatch = cleaned.match(/```[a-z]*\s*([\s\S]*?)```/);
            if (codeBlockMatch && codeBlockMatch[1]) {
              extractedCode = codeBlockMatch[1].trim();
              console.log('📝 Extracted code from markdown code block');
              
              // Try to extract thinking from markdown format
              const thinkingMatch = cleaned.match(/(?:THINKING|thinking|Thinking|THOUGHT|thought|Thought|ANALYSIS|analysis|Analysis)[:|\n]([\s\S]*?)(?:```|INSTRUCTIONS|instructions|Instructions|STEPS|steps|Steps)/i);
              if (thinkingMatch && thinkingMatch[1]) {
                extractedThinking = thinkingMatch[1].trim();
                console.log('💭 THINKING from markdown: ' + extractedThinking);
              }
            } else {
              console.log('⚠️ Using raw response as code');
            }
          }
        }
        
        // Final validation - make sure it contains a screenshot command
        if (!extractedCode.includes('screenshot')) {
          console.warn('⚠️ Extracted code does not contain a screenshot command');
          // Try one more time to find a screenshot command in the raw response
          const screenshotMatch = cleaned.match(/await\s+page.*\.screenshot\s*\(.*\)/s);
          if (screenshotMatch) {
            extractedCode = screenshotMatch[0].trim();
            if (!extractedCode.endsWith(';')) extractedCode += ';';
            console.log('🔧 Extracted screenshot command from raw response');
          }
        }
        
        // If we still don't have thinking, try to extract it from the raw response
        if (!extractedThinking && rawResponse) {
          // Try to extract thinking from raw response using various patterns
          const thinkingPatterns = [
            // Common thinking section markers
            /(?:THINKING|thinking|Thinking|THOUGHT|thought|Thought|ANALYSIS|analysis|Analysis)[:|\n]([\s\S]*?)(?:```|INSTRUCTIONS|instructions|Instructions|STEPS|steps|Steps|CODE|code|Code)/i,
            // Current instruction pattern from the terminal output
            /Current instruction:.*?(?=Previous instruction:|$)/s,
            // Look for text that explains what the user wants to capture
            /The user wants to capture.*?(?=\.)/s,
            // Look for text that describes what's being captured
            /This ensures.*?(?=\.)/s,
            // Look for any explanatory text before code blocks
            /.*?(?=```)/s
          ];
          
          for (const pattern of thinkingPatterns) {
            const match = rawResponse.match(pattern);
            if (match && match[0]) {
              // If the pattern has a capture group, use that, otherwise use the whole match
              const thinkingText = match[1] || match[0];
              if (thinkingText && thinkingText.trim().length > 10) { // Ensure it's not just a few characters
                extractedThinking = thinkingText.trim();
                console.log('💭 Extracted thinking from raw response using pattern:', pattern);
                console.log('💭 THINKING from raw response:', extractedThinking);
                break;
              }
            }
          }
        }

        // Debug logging
        console.log('🔍 CLEANED AI RESPONSE:', JSON.stringify(extractedCode));

        // Add semicolon if needed for proper JS/TS syntax
        return (!extractedCode || extractedCode.endsWith(';') || extractedCode.endsWith('}')) 
          ? (extractedCode || codeContext) 
          : `${extractedCode};`;
      } catch (err: any) {
        const duration = Date.now() - startTime;
        
        // Log image information even in error case
        console.log('📸 Base screenshot size:', base64Screenshot ? Buffer.from(base64Screenshot, 'base64').length : 'none');
        console.log('📸 Highlighted screenshot size:', 
          (enhancedScreenshotBase64 && enhancedScreenshotBase64 !== base64Screenshot) 
            ? Buffer.from(enhancedScreenshotBase64, 'base64').length 
            : 'none');
            
        const logEntry: APILogEntry = {
          timestamp: new Date().toISOString(),
          provider: 'openai',
          model: 'gpt-5-chat',
          rawRequest: requestPayload || {}, // Add missing field
          rawResponse: err?.response || {}, // Add missing field for error case
          request: {
            systemInstruction: systemPrompt,
            userPrompt: userTextPrompt,
            hasImage: !!base64Screenshot,
            imageSize: base64Screenshot ? Buffer.from(base64Screenshot, 'base64').length : undefined,
            hasHighlightedImage: !!(enhancedScreenshotBase64 && enhancedScreenshotBase64 !== base64Screenshot),
            highlightedImageSize: (enhancedScreenshotBase64 && enhancedScreenshotBase64 !== base64Screenshot) 
              ? Buffer.from(enhancedScreenshotBase64, 'base64').length 
              : undefined,
            pageUrl: await this.page.url(),
            visibleElementsLength: userTextPrompt.length,
            previouslyExecutedCode: codeContext,
            currentStepErrorCode: refinementContext?.errorMessage || ''
          },
          response: {
            status: err?.response?.status || 500,
            content: err?.message || 'Unknown error',
            inputTokenCount: 0,
            outputTokenCount: 0,
            totalTokens: 0,
            thinking: 'Error occurred',
            code: 'error',
          },
          metadata: {
            temperature: refinementContext ? 0.2 : 0.3,
            maxTokens: 1000,
            topP: 1,
          },
          duration,
        };
        apiLogger.logAPICall(logEntry);

        // Surface error and fall back
        throw err;
      }
    } catch (error: any) {
      const reason = error?.message || 'unknown error';
      if (error?.response?.data) {
        console.warn('🔍 Azure error body:', JSON.stringify(error.response.data));
      }
      console.warn(`⚠️  Enhanced AI screenshot generation failed (${reason}); falling back to original/previous code`);
      return codeContext;
    }
  }

  // Extracts minimal hints from the existing code to bias container selection.
  private extractHintsFromCode(codeContext: string): { texts?: string[]; testIds?: string[]; roles?: string[] } {
    const texts: string[] = [];
    const testIds: string[] = [];
    const roles: string[] = [];

    // getByRole('role', { name: 'Text' })
    const roleRegex = /getByRole\(\s*['"]([^'"]+)['"][^)]*?\{\s*name:\s*['"]([^'"]+)['"]/g;
    let m: RegExpExecArray | null;
    while ((m = roleRegex.exec(codeContext)) !== null) {
      if (m[1]) roles.push(m[1]);
      if (m[2]) texts.push(m[2]);
    }

    // getByText('Some text') / locator(':has-text("...")')
    const textRegexes = [
      /getByText\(\s*['"]([^'"]{2,80})['"]/g,
      /:has-text\(\s*['"]([^'"]{2,80})['"]/g,
    ];
    for (const rx of textRegexes) {
      while ((m = rx.exec(codeContext)) !== null) {
        if (m[1]) texts.push(m[1]);
      }
    }

    // getByTestId('id') or [data-testid="id"]
    const testIdRegexes = [
      /getByTestId\(\s*['"]([^'"]{1,80})['"]/g,
      /\[data-testid=\"([^\"]{1,80})\"\]/g,
    ];
    for (const rx of testIdRegexes) {
      while ((m = rx.exec(codeContext)) !== null) {
        if (m[1]) testIds.push(m[1]);
      }
    }

    // Deduplicate and trim
    const dedupe = (arr: string[]) => Array.from(new Set(arr.map(s => s.trim()))).filter(Boolean).slice(0, 10);
    return {
      texts: dedupe(texts),
      testIds: dedupe(testIds),
      roles: dedupe(roles),
    };
  }

  /**
   * Extract image path and directory from a screenshot command
   */
  private extractImagePathInfo(screenshotCommand: string): { 
    imgFileName: string | null;
    imgPath: string | null;
    imgDir: string | null;
  } {
    let imgFileName: string | null = null;
    let imgPath: string | null = null;
    let imgDir: string | null = null;
    
    // Try to extract path from screenshot command
    const pathMatch = screenshotCommand.match(/path\s*:\s*['"]([^'\"]+\.(?:png|jpg|jpeg|gif|bmp|webp))['"]/i);
    if (pathMatch?.[1]) {
      imgPath = decodeURIComponent(pathMatch[1]);
      imgFileName = path.basename(imgPath);
      imgDir = path.dirname(imgPath);
    } else {
      // Try to extract from direct argument
      const argMatch = screenshotCommand.match(/(?:page\.screenshot|\.screenshot)\(\s*['"]([^'\"]+\.(?:png|jpg|jpeg|gif|bmp|webp))['"]/i);
      if (argMatch?.[1]) {
        imgPath = decodeURIComponent(argMatch[1]);
        imgFileName = path.basename(imgPath);
        imgDir = path.dirname(imgPath);
      }
    }
    
    return { imgFileName, imgPath, imgDir };
  }

  /**
   * Enhanced screenshot command interception
   */
  async interceptScreenshotCommandEnhanced(
    originalCodeBlock: string, 
    isRefinementCycle: boolean = false, 
    refinementContext?: RefinementContext,
    thinking?: string,
    screenshotIntent?: string
  ): Promise<string> {
    const screenshotCommandRegex = /(\bawait\s+)?(page\.screenshot\s*\(.*?\)|[^;]+\.screenshot\s*\(.*?\));?/i;
    const match = originalCodeBlock.match(screenshotCommandRegex);

    if (!match) return originalCodeBlock;

    const originalScreenshotCommand = match[0];
    console.log(isRefinementCycle ? "🎯 Enhanced refining screenshot command..." : "🎯 Enhanced screenshot command detected! Intercepting...");
    if(process.env.VERBOSE_LLM === 'true' || isRefinementCycle) {
        console.log("   Original screenshot command being processed:", originalScreenshotCommand);
    }

    try {
      // Extract image file details from screenshot command
      const origImageInfo = this.extractImagePathInfo(originalScreenshotCommand);
      const origFileName = origImageInfo.imgFileName;
      const origPath = origImageInfo.imgPath;
      const origDir = origImageInfo.imgDir;
      
      // Try to find reference image in markdown-related directories first
      let base64Screenshot = '';
      if (origFileName) {
        console.log(`🔍 Looking for reference image: '${origFileName}'`);
        
        // If we have an image directory from the command path, check there first
        if (origDir && origDir !== '.') {
          console.log(`📂 Checking command-specified image directory: ${origDir}`);
          try {
            const cmdDirPath = path.resolve(process.cwd(), origDir);
            if (fs.existsSync(cmdDirPath)) {
              const candidatePath = path.join(cmdDirPath, origFileName);
              if (fs.existsSync(candidatePath)) {
                console.log(`✅ Found reference image in command-specified directory: ${cmdDirPath}`);
                base64Screenshot = fs.readFileSync(candidatePath).toString('base64');
              }
            }
          } catch (e) {
            console.warn(`⚠️ Error checking command-specified directory: ${e}`);
          }
        }
        
        // If not found in command directory, use our enhanced image finder
        if (!base64Screenshot) {
          base64Screenshot = this.getReferenceImageBase64(origFileName);
          if (!base64Screenshot) console.warn(`⚠️ Reference image '${origFileName}' not found.`);
        }
      } else {
        console.warn(`⚠️ Could not extract image filename from: ${originalScreenshotCommand.substring(0, 100)}...`);
      }
      
      // Check if there's a screenshot intent available in the code context
      let extractedScreenshotIntent = screenshotIntent || '';
      
      // Log if we already have a screenshot intent from JSON
      if (extractedScreenshotIntent) {
        console.log(`✅ Using screenshot intent from JSON response: ${extractedScreenshotIntent}`);
      } else {
        // Only use regex extraction if no JSON-based intent was provided
        console.log(`⚠️ No screenshot intent found in JSON response, falling back to regex extraction`);
        
        const patterns = [
          // Standard pattern with prepositions
          /screenshot.*(of|to capture|showing|displaying|for|to verify).*?[.?!]/i,
          // Capture "take a screenshot" followed by any content until punctuation
          /take a screenshot.*?[.?!]/i,
          // Capture "screenshot" followed by any content until punctuation
          /screenshot.*?[.?!]/i,
          // Capture "save as" followed by filename
          /save as .*?\.png/i,
          // Capture comments that describe the screenshot
          /\/\/\s*.*?(screenshot|capture).*$/im
        ];
        
        // First try to extract from thinking if available
        if (!extractedScreenshotIntent && thinking) {
          for (const pattern of patterns) {
            const intentMatches = thinking.match(pattern);
            if (intentMatches && intentMatches[0]) {
              extractedScreenshotIntent = intentMatches[0].trim();
              console.log(`📝 Extracted screenshot intent from thinking using pattern: ${pattern}`);
              console.log(`📝 Extracted intent: ${extractedScreenshotIntent}`);
              break;
            }
          }
        }
        
        // If still not found, try to extract from the code block itself
        if (!extractedScreenshotIntent) {
          for (const pattern of patterns) {
            const intentMatches = originalCodeBlock.match(pattern);
            if (intentMatches && intentMatches[0]) {
              extractedScreenshotIntent = intentMatches[0].trim();
              console.log(`📝 Extracted screenshot intent from code using pattern: ${pattern}`);
              console.log(`📝 Extracted intent: ${extractedScreenshotIntent}`);
              break;
            }
          }
        }
      }
      
      // If we still don't have an intent and we have a filename, use that as a fallback
      if (!extractedScreenshotIntent && origFileName) {
        extractedScreenshotIntent = `Screenshot of ${origFileName.replace(/\.[^/.]+$/, "").replace(/_/g, " ")}`;
        console.log(`📝 Generated fallback intent from filename: ${extractedScreenshotIntent}`);
      }
      
      if (extractedScreenshotIntent) {
        console.log(`🎯 Using screenshot intent: ${extractedScreenshotIntent}`);
      } else {
        console.log(`⚠️ No screenshot intent found - will rely solely on container detection`);
      }
      
      // Generate enhanced prompt with all available context
      const aiGeneratedCommand = await this.generateEnhancedPrompt(
        base64Screenshot,
        originalScreenshotCommand, 
        origFileName,
        refinementContext,
        thinking,
        extractedScreenshotIntent
      );

      if (aiGeneratedCommand === originalScreenshotCommand || !aiGeneratedCommand.includes('.screenshot')) {
        console.log(isRefinementCycle ? "ℹ️ Enhanced AI did not refine the command or refinement skipped." : "ℹ️ Enhanced AI did not provide a different command, or generation was skipped.");
        return this.applyTimeoutAndClean(originalCodeBlock);
      }

      console.log(isRefinementCycle ? '✨ Enhanced AI provided refined screenshot code.' : '🖼️ Enhanced screenshot code generated by AI.');
      
      // Extract the path information to modify filenames
      const origImgInfo = this.extractImagePathInfo(originalScreenshotCommand);
      const enhancedImgInfo = this.extractImagePathInfo(aiGeneratedCommand);
      const fileName = origImgInfo.imgFileName;
      const filePath = origImgInfo.imgPath;
      const fileDir = origImgInfo.imgDir;
      
      // Create versions with _S and _E suffixes for stock and enhanced
      let stockCommand = originalScreenshotCommand;
      let enhancedCommand = aiGeneratedCommand;
      
      if (fileName && filePath) {
        // Check if the filename has an extension
        const lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex <= 0) {
          console.warn('⚠️ No valid extension found in filename. Using default extension.');
          // Add default extension if none exists
          const stockFileName = `${fileName}_S.png`;
          const enhancedFileName = `${fileName}_E.png`;
          
          // More robust replacement for stock command
          const escapedFileName = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const fileNameRegex = new RegExp(`(['\"])([^'\"]*?)${escapedFileName}(['\"])`, 'i');
          stockCommand = originalScreenshotCommand.replace(fileNameRegex, (match, p1, p2, p3) => {
            return `${p1}${p2}${stockFileName}${p3}`;
          });
          console.log(`📄 Modified stock filename from '${fileName}' to '${stockFileName}'`);
          
          // More robust replacement for enhanced command
          const enhancedFileNameToReplace = enhancedImgInfo.imgFileName || fileName;
          const escapedEnhancedFileName = enhancedFileNameToReplace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const enhancedRegex = new RegExp(`(['\"])([^'\"]*?)${escapedEnhancedFileName}(['\"])`, 'i');
          enhancedCommand = aiGeneratedCommand.replace(enhancedRegex, (match, p1, p2, p3) => {
            return `${p1}${p2}${enhancedFileName}${p3}`;
          });
          console.log(`📄 Modified enhanced filename from '${enhancedFileNameToReplace}' to '${enhancedFileName}'`);
        } else {
          // Generate the new filenames with suffixes
          const fileNameWithoutExt = fileName.substring(0, lastDotIndex);
          const extension = fileName.substring(lastDotIndex);
          const stockFileName = `${fileNameWithoutExt}_S${extension}`;
          const enhancedFileName = `${fileNameWithoutExt}_E${extension}`;
          
          // Replace the path in the original command in a more robust way
          if (filePath && fileDir) {
            const stockPath = path.join(fileDir, stockFileName);
            
            // More robust path replacement using regex with word boundaries
            const escapedFilePath = filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pathRegex = new RegExp(`(path\\s*:\\s*['\"])${escapedFilePath}(['\"])`, 'i');
            stockCommand = originalScreenshotCommand.replace(pathRegex, `$1${stockPath}$2`);
            
            // If no replacement occurred (no path: syntax), try direct replacement
            if (stockCommand === originalScreenshotCommand) {
              const directRegex = new RegExp(`(['\"])${escapedFilePath}(['\"])`, 'i');
              stockCommand = originalScreenshotCommand.replace(directRegex, `$1${stockPath}$2`);
            }
            
            console.log(`📂 Modified stock path from '${filePath}' to '${stockPath}'`);
          } else {
            // If we only have a filename, use a more precise replacement
            const escapedFileName = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const fileNameRegex = new RegExp(`(['\"])([^'\"]*?)${escapedFileName}(['\"])`, 'i');
            stockCommand = originalScreenshotCommand.replace(fileNameRegex, (match, p1, p2, p3) => {
              return `${p1}${p2}${stockFileName}${p3}`;
            });
            console.log(`📄 Modified stock filename from '${fileName}' to '${stockFileName}'`);
          }
          
          // Replace the path in the enhanced command using the same robust approach
          if (enhancedImgInfo.imgPath && enhancedImgInfo.imgDir) {
            const enhancedPath = path.join(enhancedImgInfo.imgDir, enhancedFileName);
            
            // More robust path replacement
            const escapedPath = enhancedImgInfo.imgPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pathRegex = new RegExp(`(path\\s*:\\s*['\"])${escapedPath}(['\"])`, 'i');
            enhancedCommand = aiGeneratedCommand.replace(pathRegex, `$1${enhancedPath}$2`);
            
            // If no replacement occurred, try direct replacement
            if (enhancedCommand === aiGeneratedCommand) {
              const directRegex = new RegExp(`(['\"])${escapedPath}(['\"])`, 'i');
              enhancedCommand = aiGeneratedCommand.replace(directRegex, `$1${enhancedPath}$2`);
            }
            
            console.log(`📂 Modified enhanced path from '${enhancedImgInfo.imgPath}' to '${enhancedPath}'`);
          } else {
            // If we only have a filename, use a more precise replacement
            const enhancedFileName = enhancedImgInfo.imgFileName || fileName;
            const escapedFileName = enhancedFileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const fileNameRegex = new RegExp(`(['\"])([^'\"]*?)${escapedFileName}(['\"])`, 'i');
            enhancedCommand = aiGeneratedCommand.replace(fileNameRegex, (match, p1, p2, p3) => {
              return `${p1}${p2}${enhancedFileName}${p3}`;
            });
            console.log(`📄 Modified enhanced filename from '${enhancedFileName}' to '${enhancedFileName}'`);
          }
        }
      }
      
      console.log('📸 Will take both stock and enhanced screenshots:');
      console.log('📸 Stock command:', stockCommand);
      console.log('📸 Enhanced command:', enhancedCommand);
      
      // Ensure target directories exist before taking screenshots
      let ensureDirCode = '';
      
      // Extract directories from both commands
      const stockPathMatch = stockCommand.match(/path\s*:\s*['"]([^'"]+)['"]/i);
      const enhancedPathMatch = enhancedCommand.match(/path\s*:\s*['"]([^'"]+)['"]/i);
      
      // If paths were found, ensure their directories exist
      if (stockPathMatch || enhancedPathMatch) {
        ensureDirCode = `
// Ensure screenshot directories exist
const fs = require('fs');
const path = require('path');

`;
        
        if (stockPathMatch) {
          const stockPath = stockPathMatch[1].replace(/\\/g, '/');
          ensureDirCode += `
// Ensure stock screenshot directory exists
const stockPath = "${stockPath}";
const stockDir = path.dirname(stockPath);
if (!fs.existsSync(stockDir)) {
  fs.mkdirSync(stockDir, { recursive: true });
  console.log('📁 Created directory for stock screenshot:', stockDir);
}
`;
        }
        
        if (enhancedPathMatch) {
          const enhancedPath = enhancedPathMatch[1].replace(/\\/g, '/');
          ensureDirCode += `
// Ensure enhanced screenshot directory exists
const enhancedPath = "${enhancedPath}";
const enhancedDir = path.dirname(enhancedPath);
if (!fs.existsSync(enhancedDir)) {
  fs.mkdirSync(enhancedDir, { recursive: true });
  console.log('📁 Created directory for enhanced screenshot:', enhancedDir);
}
`;
        }
      }
      
      // Generate a code block that executes both commands with directory creation
      const finalCodeBlock = originalCodeBlock.replace(
        originalScreenshotCommand, 
        `${ensureDirCode}

// Stock version
${stockCommand.replace(/path\s*:\s*(['"])(.*?\.(?:png|jpg|jpeg|gif|bmp|webp))(['"])/gi, (match, p1, p2, p3) => 
  `path: ${p1}${p2.replace(/\\/g, '/')}${p3}`)}

// Enhanced version
${enhancedCommand.replace(/path\s*:\s*(['"])(.*?\.(?:png|jpg|jpeg|gif|bmp|webp))(['"])/gi, (match, p1, p2, p3) => 
  `path: ${p1}${p2.replace(/\\/g, '/')}${p3}`)}`
      );
      
      return this.applyTimeoutAndClean(finalCodeBlock);

    } catch (error: any) {
      console.warn(`⚠️ Failed to ${isRefinementCycle ? 'refine' : 'enhance'} screenshot command (${error?.message ?? 'unknown'}).`);
      return this.applyTimeoutAndClean(originalCodeBlock);
    }
  }

  /**
   * Highlight container elements on the page for better AI understanding
   */
  private async highlightContainers(containers: ContainerInfo[]): Promise<string> {
    // Highlight more containers to give better options
    const topContainers = containers.slice(0, 15); // Increased from 8 to 15 for more lenient selection
    
    return await this.page.evaluate((containersToHighlight) => {
      // Clean up any previous highlights
      document.querySelectorAll('.container-highlight-overlay, .container-highlight-badge, .container-highlight-legend').forEach(el => el.remove());
      
      // Use a consistent color palette for better visibility
      function getContainerColor(index: number): string {
        const colors = [
          '#E63946', // bright red
          '#1D3557', // dark blue
          '#2A9D8F', // teal
          '#E9C46A', // gold
          '#8338EC', // purple
          '#FF6B35', // orange
          '#2B9348', // green
          '#7B2CBF', // violet
          '#F94144', // coral
          '#073B4C'  // navy
        ];
        return colors[index % colors.length];
      }
      
      // Create a highlight overlay for each container
      containersToHighlight.forEach((container, index) => {
        try {
          const element = document.querySelector(container.selector);
          if (!element) return;
          
          const rect = element.getBoundingClientRect();
          const highlight = document.createElement('div');
          highlight.className = 'container-highlight-overlay';
          highlight.style.position = 'absolute';
          highlight.style.top = rect.top + 'px';
          highlight.style.left = rect.left + 'px';
          highlight.style.width = rect.width + 'px';
          highlight.style.height = rect.height + 'px';
          
          const color = getContainerColor(index);
          highlight.style.border = `3px solid ${color}`;
          highlight.style.boxSizing = 'border-box';
          highlight.style.backgroundColor = 'transparent';
          highlight.style.zIndex = '9999';
          highlight.style.pointerEvents = 'none';
          
          // Add container number badge in corner
          const badge = document.createElement('div');
          badge.className = 'container-highlight-badge';
          badge.style.position = 'absolute';
          badge.style.top = '-15px';
          badge.style.right = '-15px';
          badge.style.backgroundColor = color;
          badge.style.color = 'white';
          badge.style.borderRadius = '50%';
          badge.style.width = '26px';
          badge.style.height = '26px';
          badge.style.display = 'flex';
          badge.style.alignItems = 'center';
          badge.style.justifyContent = 'center';
          badge.style.fontSize = '14px';
          badge.style.fontWeight = 'bold';
          badge.style.boxShadow = '0 0 0 2px white';
          badge.textContent = `${index + 1}`;
          highlight.appendChild(badge);
          
          document.body.appendChild(highlight);
        } catch (e) {
          console.error('Error highlighting container:', e);
        }
      });
      
      return 'Containers highlighted for screenshot';
    }, topContainers);
  }

  /**
   * Take a screenshot with container highlighting
   */
  private async takeHighlightedScreenshot(): Promise<string> {
    // Get container info based on the current page content
    const containers = await this.getScreenshotContainers();
    
    // Highlight containers and take screenshot
    await this.highlightContainers(containers);
    
    // Take screenshot with highlights
    const buffer = await this.page.screenshot({ fullPage: false });
    
          // Save the highlighted container screenshot to a special folder
    try {
      // Create container-images directory if it doesn't exist
      const containerImagesDir = path.join(process.cwd(), 'container-images').replace(/\\/g, '/');
      if (!fs.existsSync(containerImagesDir)) {
        fs.mkdirSync(containerImagesDir, { recursive: true });
        console.log('📁 Created directory for container screenshots:', containerImagesDir);
      }
      
      // Generate a filename with timestamp to avoid overwriting
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const pageUrl = new URL(await this.page.url());
      const pathSegment = pageUrl.pathname.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
      const filename = `container-highlights-${pathSegment}-${timestamp}.png`;
      const filePath = path.join(containerImagesDir, filename).replace(/\\/g, '/');
      
      // Save the screenshot
      fs.writeFileSync(filePath, buffer);
      console.log('📸 Saved highlighted container screenshot to:', filePath);
    } catch (error) {
      console.error('⚠️ Failed to save highlighted container screenshot:', error.message);
    }
    
    // Remove highlights
    await this.page.evaluate(() => {
      document.querySelectorAll('.container-highlight-overlay').forEach(el => el.remove());
    });
    
    return buffer.toString('base64');
  }

  /**
   * Execute code with enhanced screenshot interception
   */
  async executeWithEnhancedScreenshotInterception(
    code: string, 
    isInternalRetry: boolean = false, 
    logger?: any, 
    stepNumber?: number, 
    thinking?: string,
    mdFilePath?: string,
    screenshotIntent?: string
  ): Promise<void> {
    console.log('🚀 Starting enhanced code execution...');
    console.log('📍 Page URL:', this.page.url());
    console.log('📝 Code to execute:', code);
    console.log('🧠 LLM thinking:', thinking);
    if (screenshotIntent) {
      console.log('📸 Screenshot intent:', screenshotIntent);
    }
    console.log('📊 Step number:', stepNumber);
    
    // Store and log thinking immediately
    try {
      const pageUrl = await this.page.url();
      const timestamp = new Date().toISOString();
      const thinkingEntry = {
        step: stepNumber,
        code: code,
        thinking: thinking || 'No thinking provided',
        timestamp,
        url: pageUrl
      };
      
      this.thinkingHistory.push(thinkingEntry);
      
      // Write thinking to file immediately
      try {
        const thinkingLogPath = 'ai_thinking_log.txt';
        const thinkingLog = `\n--- Step ${stepNumber || this.thinkingHistory.length} (${timestamp}) ---\n${thinking || 'No thinking provided'}\n`;
        fs.appendFileSync(thinkingLogPath, thinkingLog);
      } catch (writeError) {
        console.warn('⚠️ Could not write thinking to log file:', writeError.message);
      }
    } catch (e) {
      console.warn('⚠️ Failed to process thinking:', e.message);
    }
    console.log('📋 Logger available:', !!logger);
    
    try {
      // If a markdown file path is provided, set it
      if (mdFilePath && !this.currentMdPath) {
        console.log('📄 Setting markdown path from execution context:', mdFilePath);
        this.setCurrentMdFilePath(mdFilePath);
      }
      
      // Check if we have a current markdown path
      if (this.currentMdPath) {
        console.log('📄 Using current markdown path for image reference:', this.currentMdPath);
      }
      
      // Look for screenshot commands in the code
      const hasScreenshotCommand = /\.screenshot\s*\(/i.test(code);
      if (hasScreenshotCommand) {
        console.log('📸 Detected screenshot command in code - will apply enhanced interception');
        if (screenshotIntent) {
          console.log('🎯 Using provided screenshot intent: ' + screenshotIntent);
        }
      }
      
      // Intercept screenshot commands with enhanced logic
      const enhancedCode = await this.interceptScreenshotCommandEnhanced(
        code, 
        isInternalRetry, 
        undefined, 
        thinking,
        screenshotIntent
      );
      
      // Execute the enhanced code using Function constructor
      // Log the code that will be executed
      console.log('🧪 Executing code:', enhancedCode);

      try {
        // Check if this is a screenshot command that can benefit from stabilization
        if (hasScreenshotCommand) {
          console.log('🛡️ Using screenshot stabilization for execution');
          await this.executeScreenshotWithStability(enhancedCode);
          console.log('✅ Enhanced stable screenshot execution completed successfully');
        } else {
          // Standard execution for non-screenshot code
          const func = new Function('page', `return (async () => { ${enhancedCode} })()`);
          await func(this.page);
          console.log('✅ Enhanced code execution completed successfully');
        }
      } catch (execError) {
        console.error('⚠️ Error during code execution:', execError.message);
        console.error('⚠️ Problem with code:', enhancedCode);
        
        // If execution failed and it's a screenshot command, try with standard execution
        if (hasScreenshotCommand) {
          console.log('🔄 Attempting fallback to standard execution without stabilization');
          try {
            const func = new Function('page', `return (async () => { ${enhancedCode} })()`);
            await func(this.page);
            console.log('✅ Standard execution succeeded as fallback');
          } catch (fallbackError) {
            console.error('💥 Both stabilized and standard execution failed');
            throw execError; // Throw the original error
          }
        } else {
          throw execError;
        }
      }
      
    } catch (error: any) {
      console.error('❌ Enhanced code execution failed:', error.message);
      console.error('📍 Error occurred on page:', this.page.url());
      console.error('📝 Failed code:', code);
      throw error;
    }
  }

  private applyTimeoutAndClean(code: string): string {
    // Add timeout to screenshot commands if not present
    return code.replace(
      /\.screenshot\(\s*{([^}]*)}\s*\)/g,
      (match, inner) => {
        if (inner.includes('timeout')) {
          return match; // Already has timeout
        }
        return `.screenshot({ ${inner}, timeout: 30000 })`;
      }
    ).replace(
      /\.screenshot\(\s*\)/g,
      '.screenshot({ timeout: 30000 })'
    );
  }
  
  /**
   * Analyzes screenshot code to extract the selector and options
   * @param code The screenshot code to analyze
   * @returns Object with parsed selector and options, or null if parsing failed
   */
  private parseScreenshotCode(code: string): { 
    selectorExpr: string; 
    selector: string | null; 
    selectorType: string; 
    options: {
      path?: string;
      timeout?: number;
      fullPage?: boolean;
      [key: string]: any;
    };
    fullCode: string;
  } | null {
    try {
      // Check if this is a screenshot command
      if (!code.includes('.screenshot(')) {
        return null;
      }
      
      // Detect the selector expression and type
      let selectorType = 'unknown';
      let selectorExpr = '';
      let selector = null;
      
      // Extract the part before .screenshot()
      const parts = code.split('.screenshot');
      if (!parts || parts.length < 2) return null;
      
      selectorExpr = parts[0].trim();
      
      // Detect selector pattern
      if (code.includes('page.locator(')) {
        selectorType = 'locator';
        const match = selectorExpr.match(/page\.locator\(['"]([^'"]+)['"]\)/);
        if (match) selector = match[1];
      } 
      else if (code.includes('page.getByRole(')) {
        selectorType = 'role';
        const match = selectorExpr.match(/page\.getByRole\(['"]([^'"]+)['"](?:,\s*{[^}]+})?\)/);
        if (match) selector = match[1];
      }
      else if (code.includes('page.getByText(')) {
        selectorType = 'text';
        const match = selectorExpr.match(/page\.getByText\(['"]([^'"]+)['"](?:,\s*{[^}]+})?\)/);
        if (match) selector = match[1];
      }
      else if (code.includes('page.getByTestId(')) {
        selectorType = 'testId';
        const match = selectorExpr.match(/page\.getByTestId\(['"]([^'"]+)['"]\)/);
        if (match) selector = match[1];
      }
      
      // Extract screenshot options
      let options: {
        path?: string;
        timeout?: number;
        fullPage?: boolean;
        [key: string]: any;
      } = {};
      const optionsMatch = code.match(/\.screenshot\(\s*({[^}]*})\s*\)/);
      if (optionsMatch && optionsMatch[1]) {
        try {
          // Convert the options string to a real object by evaluating it
          // This is safe because we're in a controlled environment
          const optionsStr = optionsMatch[1]
            .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')  // Quote unquoted keys
            .replace(/'/g, '"');  // Replace single quotes with double quotes
            
          options = JSON.parse(optionsStr);
        } catch (e) {
          console.warn('Failed to parse screenshot options:', e);
        }
      }
      
      return { 
        selectorExpr, 
        selector, 
        selectorType,
        options,
        fullCode: code
      };
    } catch (e) {
      console.error('Error parsing screenshot code:', e);
      return null;
    }
  }
  
  /**
   * Executes screenshot code with simplified retry logic
   * @param code The screenshot code to execute
   * @returns The result of the execution
   */
  async executeScreenshotWithStability(code: string): Promise<any> {
    // Ensure directories exist first (extract and run that part safely)
    if (code.includes('fs.mkdirSync')) {
      try {
        // Execute just the directory creation part
        const dirSetupCode = code.split(/\/\/\s*(Stock|Enhanced)\s*version/)[0];
        const dirSetupFunc = new Function('page', `return (async () => { ${dirSetupCode} })()`);
        await dirSetupFunc(this.page);
        console.log('✅ Directory setup completed');
      } catch (e) {
        console.log('⚠️ Directory setup failed, will continue anyway:', e.message);
      }
    }
    
    // Check if this is a complex multi-statement screenshot block
    if (code.includes('// Stock version') || code.includes('// Enhanced version')) {
      console.log('📦 Detected complex multi-statement screenshot block, executing both stock and enhanced versions');
      
      const lines = code.split('\n');
      let stockCmd = '';
      let enhancedCmd = '';
      
      // Find the stock command
      for (const line of lines) {
        if (line.includes('// Stock version') && lines.indexOf(line) + 1 < lines.length) {
          stockCmd = lines[lines.indexOf(line) + 1].trim();
          break;
        }
      }
      
      // Find the enhanced command
      for (const line of lines) {
        if (line.includes('// Enhanced version') && lines.indexOf(line) + 1 < lines.length) {
          enhancedCmd = lines[lines.indexOf(line) + 1].trim();
          break;
        }
      }
      
      // Execute both commands if found
      if (stockCmd) {
        console.log('🔍 Executing stock screenshot command with retries:', stockCmd);
        await forceScreenshotWithRetries(stockCmd, this.page, this);
      }
      
      if (enhancedCmd) {
        console.log('🔍 Executing enhanced screenshot command with retries:', enhancedCmd);
        await forceScreenshotWithRetries(enhancedCmd, this.page, this);
      }
      
      return;
    }
    
    // For simple screenshot commands, just execute directly with retries
    console.log('🔍 Executing simple screenshot command with retries');
    await forceScreenshotWithRetries(code, this.page, this);
    return;
  }

  /**
   * Takes a stable screenshot by ensuring the element is visible and stable before capturing
   * @param selector Playwright locator or selector string
   * @param options Screenshot options
   * @returns Buffer containing the screenshot image
   */
  async takeStableScreenshot(
    selector: string | any, // Can be a string selector or a Playwright Locator
    options: {
      path?: string;
      timeout?: number;
      fullPage?: boolean;
    } = {}
  ): Promise<Buffer> {
    const { path: screenshotPath, timeout = 30000, fullPage = false } = options;
    
    console.log(`📸 Taking stable screenshot${screenshotPath ? ` with path: ${screenshotPath}` : ''}`);
    
    try {
      // Convert string selector to locator if needed
      const locator = typeof selector === 'string' 
        ? this.page.locator(selector) 
        : selector;
      
      // Always wait for network idle before screenshots
      console.log('⏳ Waiting for network idle before taking screenshot...');
      await this.page.waitForLoadState('networkidle', { timeout: 5000 })
        .catch((e: Error) => console.log('❌ Network idle wait failed:', e.message));
      
      // 2. Count matching elements to detect potential issues
      const count = await locator.count();
      
      if (count === 0) {
        console.log('⚠️ Warning: No elements match the selector, trying smart alternative detection');
        
        // Smart container detection fallback - try to find a relevant container
        try {
          // Get all potentially relevant containers by common attributes/classes
          const containerInfo = await this.page.evaluate(() => {
            const containers: {selector: string, area: number, text: string}[] = [];
            
            // Look for elements with specific attributes (much more generic approach)
            const candidates = [
              // Test attribute elements (highest priority)
              ...Array.from(document.querySelectorAll('[data-testid], [data-test], [data-cy], [data-e2e], [data-automation-id], [data-qa], [data-ref]')),
              
              // Role-based elements (very common in accessible applications)
              ...Array.from(document.querySelectorAll('[role]')),
              
              // Specific role-based elements that often contain important UI
              ...Array.from(document.querySelectorAll('[role="dialog"], [role="listbox"], [role="menu"], [role="combobox"], [role="grid"], [role="tabpanel"], [role="search"], [role="alert"], [role="alertdialog"], [role="region"]')),
              
              // ARIA attributes that often mark important UI elements
              ...Array.from(document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby], [aria-expanded="true"]')),
              
              // Elements with IDs (often important structural elements)
              ...Array.from(document.querySelectorAll('[id]')).filter(el => {
                const id = el.getAttribute('id');
                // Avoid auto-generated IDs with random strings/numbers
                return id && !/^[a-z]+\d{1,3}$/.test(id) && !/^[0-9a-f]{8,}$/.test(id);
              }),
              
              // Generic UI component class patterns (framework agnostic)
              ...Array.from(document.querySelectorAll('[class*="container"], [class*="panel"], [class*="card"], [class*="dialog"], [class*="modal"], [class*="drawer"], [class*="menu"], [class*="dropdown"], [class*="popover"], [class*="result"], [class*="search"], [class*="list"], [class*="table"]')),
              
              // Framework-specific components
              ...Array.from(document.querySelectorAll('.MuiDialog-paper, .MuiPopover-paper, .modal-content, .modal-dialog, .card, .panel')),
              
              // Semantic HTML elements
              ...Array.from(document.querySelectorAll('main, section, article, aside, dialog, nav, header, footer')),
              
              // Recently shown elements that might be important UI components
              ...Array.from(document.querySelectorAll('div:not([style*="display: none"])')).filter(el => {
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                
                // Consider visible elements with reasonable sizing and styling
                return rect.width >= 100 && rect.height >= 50 && rect.width <= window.innerWidth && rect.height <= window.innerHeight &&
                       (style.position === 'absolute' || style.position === 'fixed' || 
                        style.boxShadow !== 'none' || 
                        parseInt(style.zIndex, 10) > 1 ||
                        el.className.includes('search') || 
                        el.className.includes('result') ||
                        el.className.includes('popup') ||
                        el.className.includes('dialog') ||
                        el.className.includes('dropdown'));
              })
            ];
            
            // Extract information from candidates
            candidates.forEach(el => {
              const rect = el.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                // Generate a CSS selector for this element
                let selector = '';
                if (el.id) {
                  selector = `#${el.id}`;
                } else if (el.getAttribute('data-testid')) {
                  selector = `[data-testid="${el.getAttribute('data-testid')}"]`;
                } else if (el.getAttribute('role')) {
                  selector = `[role="${el.getAttribute('role')}"]`;
                } else if (el.className && typeof el.className === 'string' && el.className.trim()) {
                  // Get first class for simplicity
                  const mainClass = el.className.trim().split(' ')[0];
                  selector = `.${mainClass}`;
                } else {
                  // Last resort - tag and position
                  selector = el.tagName.toLowerCase();
                }
                
                containers.push({
                  selector: selector,
                  area: rect.width * rect.height,
                  text: el.textContent?.slice(0, 100) || ''
                });
              }
            });
            
            // Sort by largest area (likely to be a modal/dropdown) and return top 5
            return containers
              .sort((a, b) => b.area - a.area)
              .slice(0, 5);
          });
          
          console.log(`🔍 Found ${containerInfo.length} potential containers`);
          
          // Try each container until we find one that works
          for (const container of containerInfo) {
            try {
              console.log(`Trying alternative selector: ${container.selector} (size: ${container.area})`);
              const altLocator = this.page.locator(container.selector);
              const isVisible = await altLocator.isVisible({ timeout: 3000 }).catch(() => false);
              
              if (isVisible) {
                console.log(`✅ Found visible alternative container: ${container.selector}`);
                console.log(`📝 Container text preview: ${container.text}`);
                
                await altLocator.scrollIntoViewIfNeeded().catch(() => {});
                await this.page.waitForTimeout(300);
                return await altLocator.screenshot({ path: screenshotPath });
              }
            } catch (e) {
              console.log(`❌ Error with alternative selector ${container.selector}:`, e.message);
            }
          }
        } catch (e) {
          console.log('❌ Smart container detection failed:', e.message);
        }
        
        // If all else fails, take a full page screenshot
        console.log('⚠️ No suitable container found, taking full page screenshot');
        return await this.page.screenshot({ path: screenshotPath, fullPage: true });
      }
      
      if (count > 1) {
        console.log(`⚠️ Warning: ${count} elements match the selector, using first match`);
      }
      
      // Use first() for multiple matches to avoid strict mode violation
      const targetLocator = count > 1 ? locator.first() : locator;
      
      // 3. Ensure element is in DOM and visible
      const isVisible = await targetLocator.isVisible({ timeout: Math.min(5000, timeout / 3) })
        .catch((_: Error) => false);
      
      if (!isVisible) {
        console.log('⚠️ Element not visible, trying forced visibility...');
        
        // Try to make the element visible if it exists but is hidden
        try {
          await this.page.evaluate((selector) => {
            // Try to get the element by selector
            let element: HTMLElement | null = null;
            if (selector.startsWith('#')) {
              element = document.querySelector(selector) as HTMLElement;
            } else if (selector.startsWith('.')) {
              element = document.querySelector(selector) as HTMLElement;
            } else if (selector.startsWith('[')) {
              element = document.querySelector(selector) as HTMLElement;
            } else {
              // For complex selectors, let's not try to evaluate them
              return false;
            }
            
            if (element) {
              // Force element to be visible
              element.style.display = 'block';
              element.style.visibility = 'visible';
              element.style.opacity = '1';
              return true;
            }
            return false;
          }, typeof selector === 'string' ? selector : 'unknown');
          
          // Check again if it's visible
          const nowVisible = await targetLocator.isVisible({ timeout: 2000 }).catch(() => false);
          if (!nowVisible) {
            console.log('⚠️ Element still not visible after forced visibility, taking full page screenshot');
            return await this.page.screenshot({ path: screenshotPath, fullPage: true });
          }
        } catch (e) {
          console.log('❌ Forced visibility failed:', e.message);
          return await this.page.screenshot({ path: screenshotPath, fullPage: true });
        }
      }
      
      // 4. Ensure element is in viewport
      await targetLocator.scrollIntoViewIfNeeded({ timeout: Math.min(5000, timeout / 3) })
        .catch((e: Error) => console.log('Could not scroll into view:', e.message));
      
      // 5. Wait a moment for any animations to complete
      await this.page.waitForTimeout(300);
      
      // 6. Take the element screenshot
      console.log('✅ Element is stable, taking screenshot');
      return await targetLocator.screenshot({ path: screenshotPath });
      
    } catch (error) {
      console.error('❌ Error during stable screenshot:', error.message);
      
      // Fallback to full page screenshot
      console.log('⚠️ Falling back to full page screenshot');
      try {
        return await this.page.screenshot({ path: screenshotPath, fullPage: true });
      } catch (fallbackError) {
        console.error('💥 Even fallback screenshot failed:', fallbackError.message);
        throw error;
      }
    }
  }

  private getCurrentMdFilePath(): string | null {
    try {
      // First check if we have a stored path from setCurrentMdFilePath
      console.log(`🔍 Checking for stored markdown path: ${this.currentMdPath || 'not set'}`);
      if (this.currentMdPath) {
        // If this is already a directory, return it directly
        if (fs.existsSync(this.currentMdPath) && fs.lstatSync(this.currentMdPath).isDirectory()) {
          return this.currentMdPath;
        }
        
        // If this is a file path, return its directory
        if (fs.existsSync(this.currentMdPath)) {
          return path.dirname(this.currentMdPath);
        }
        
        // Otherwise, try to find the directory
        const dirPath = path.dirname(this.currentMdPath);
        if (fs.existsSync(dirPath)) {
          return dirPath;
        }
      }
      
      // Check if the environment has a markdown file path variable
      if (process.env.CURRENT_MD_PATH) {
        const envPath = process.env.CURRENT_MD_PATH;
        
        // If this is already a directory, return it directly
        if (fs.existsSync(envPath) && fs.lstatSync(envPath).isDirectory()) {
          return envPath;
        }
        
        // If this is a file path, return its directory
        if (fs.existsSync(envPath)) {
          return path.dirname(envPath);
        }
        
        // Otherwise, try to find the directory
        const dirPath = path.dirname(envPath);
        if (fs.existsSync(dirPath)) {
          return dirPath;
        }
      }
      
      // Check if we're in a docs directory where we can determine the path
      const currentUrl = this.page.url();
      
      // Try to match multiple doc path patterns
      const patterns = [
        // Standard /docs/{section} pattern
        /\/docs\/([^\/]+)/i,
        
        // Handle numeric section prefixes like /docs/5-Document-Viewer/
        /\/docs\/(\d+[\-_][^\/]+)/i,
        
        // Match any path segment after /docs/
        /\/docs\/([^\/\.]+)/i
      ];
      
      for (const pattern of patterns) {
        const match = currentUrl.match(pattern);
        if (match) {
          const docSection = match[1];
          
          // Try to find the matching markdown directory with different formats
          const possibleDirs = [
            path.resolve(process.cwd(), 'docs', docSection),
            path.resolve(process.cwd(), 'docs', docSection.replace(/-/g, ' ')),
            path.resolve(process.cwd(), 'docs', docSection.replace(/-/g, '_')),
            path.resolve(process.cwd(), 'docs', docSection.replace(/_/g, '-')),
            // Handle numeric section prefixes
            ...Array.from({ length: 20 }, (_, i) => 
              path.resolve(process.cwd(), 'docs', `${i}-${docSection.replace(/^\d+[\-_]/, '')}`))
          ];
          
          for (const dir of possibleDirs) {
            if (fs.existsSync(dir)) {
              return dir;
            }
          }
        }
      }
      
      // Fall back to looking for any docs directory
      const docsDirs = [
        path.resolve(process.cwd(), 'docs'),
        path.resolve(process.cwd(), 'documentation')
      ];
      
      for (const dir of docsDirs) {
        if (fs.existsSync(dir)) {
          return dir;
        }
      }
      
      return null;
    } catch (error) {
      console.warn('⚠️ Failed to determine current markdown file path:', error);
      return null;
    }
  }

  private getReferenceImageBase64(imageFileName: string): string {
    try {
      console.log(`🔍 Looking for reference image: '${imageFileName}'`);
      
      // First, try to find the image relative to the current markdown file
      const mdFilePath = this.getCurrentMdFilePath();
      if (mdFilePath) {
        console.log(`📄 Using markdown path as reference: ${mdFilePath}`);
        
        // Check for 'img', 'image', or 'images' folder in the markdown directory
        // Prioritize the directory structure: if mdFilePath is a directory, look there first
        // If mdFilePath is a file, look in its parent directory
        const mdDir = fs.existsSync(mdFilePath) && fs.lstatSync(mdFilePath).isDirectory() 
          ? mdFilePath 
          : path.dirname(mdFilePath);
          
        console.log(`📂 Using markdown directory for image lookup: ${mdDir}`);
        
        const relatedImgDirs = [
          // First priority: img folder in the exact markdown directory
          path.join(mdDir, 'img'),
          path.join(mdDir, 'image'),
          path.join(mdDir, 'images'),
          path.join(mdDir, 'Images'),
          // Lower priority: other common locations
          path.join(mdFilePath, 'img'),
          path.join(path.dirname(mdFilePath), 'img'),
          path.join(path.dirname(mdFilePath), 'image'),
          path.join(path.dirname(mdFilePath), 'images'),
          path.join(path.dirname(mdFilePath), 'Images')
        ];
        
        // Try the md-related directories first
        for (const imgDir of relatedImgDirs) {
          if (fs.existsSync(imgDir)) {
            // First try exact match with the filename
            const candidatePath = path.join(imgDir, imageFileName);
            if (fs.existsSync(candidatePath)) {
              console.log(`✅ Found exact reference image in markdown-related directory: ${imgDir}`);
              return fs.readFileSync(candidatePath).toString('base64');
            }
            
            // If exact match not found, try to find the file without any suffix
            try {
              const files = fs.readdirSync(imgDir);
              const baseName = imageFileName.toLowerCase().replace(/\.[^/.]+$/, "").replace(/_[es]$/i, "");
              const exactMatch = files.find(file => 
                file.toLowerCase().replace(/\.[^/.]+$/, "") === baseName
              );
              
              if (exactMatch) {
                console.log(`✅ Found base reference image: ${exactMatch} in markdown-related directory: ${imgDir}`);
                return fs.readFileSync(path.join(imgDir, exactMatch)).toString('base64');
              }
            } catch (e) {
              console.warn(`⚠️ Error checking for base filename in ${imgDir}:`, e);
            }
            
            // Try to find an image with a similar name in this directory
            try {
              const files = fs.readdirSync(imgDir);
              // First try to find exact match without _E or _S suffix
              let similarFile = files.find(file => {
                const baseName = imageFileName.toLowerCase().replace(/\.[^/.]+$/, "");
                const fileBase = file.toLowerCase().replace(/\.[^/.]+$/, "");
                return fileBase === baseName || fileBase === baseName.replace(/_[es]$/i, "");
              });
              
              // If not found, fall back to partial match
              if (!similarFile) {
                similarFile = files.find(file => 
                  file.toLowerCase().includes(imageFileName.toLowerCase().replace(/\.[^/.]+$/, ""))
                );
              }
              if (similarFile) {
                console.log(`✅ Found similar reference image: ${similarFile} in markdown-related directory: ${imgDir}`);
                return fs.readFileSync(path.join(imgDir, similarFile)).toString('base64');
              }
            } catch (e) {
              console.warn(`⚠️ Error reading directory ${imgDir}:`, e);
            }
          }
        }
      }
      
      // Define other potential image directory paths as fallbacks
      const possibleImageDirs = [
        // Prioritize the Document-Viewer img directory with both absolute and relative paths
        'C:\\Users\\Rohith.MR\\test\\HelpManualAutomationTest\\docs\\5-Document-Viewer\\img',
        path.resolve(process.cwd(), 'docs', '5-Document-Viewer', 'img'),
        // Also check if we're working with a file from that directory
        ...(mdFilePath && mdFilePath.includes('5-Document-Viewer') ? 
          [path.resolve(path.dirname(mdFilePath), 'img')] : []),
        path.resolve(process.cwd(), 'docs', '6-Image-Viewer', 'img'),
        path.resolve(process.cwd(), 'img'),
        path.resolve(process.cwd(), 'docs', 'Images'),
        path.resolve(process.cwd(), 'AutoSnap', 'img'),
        path.resolve(process.cwd(), 'AutoSnap', 'img1'),
        path.resolve(process.cwd(), 'screenshots'),
        path.resolve(process.cwd(), 'images'),
      ];
      
      // Try to find the image in any of the fallback directories
      for (const imgDir of possibleImageDirs) {
        // First try exact match with the filename
        const candidatePath = path.join(imgDir, imageFileName);
        if (fs.existsSync(candidatePath)) {
          console.log(`✅ Found exact reference image in fallback directory: ${imgDir}`);
          return fs.readFileSync(candidatePath).toString('base64');
        }
        
        // If exact match not found, try to find the file without any suffix
        try {
          if (fs.existsSync(imgDir)) {
            const files = fs.readdirSync(imgDir);
            const baseName = imageFileName.toLowerCase().replace(/\.[^/.]+$/, "").replace(/_[es]$/i, "");
            const exactMatch = files.find(file => 
              file.toLowerCase().replace(/\.[^/.]+$/, "") === baseName
            );
            
            if (exactMatch) {
              console.log(`✅ Found base reference image: ${exactMatch} in fallback directory: ${imgDir}`);
              return fs.readFileSync(path.join(imgDir, exactMatch)).toString('base64');
            }
          }
        } catch (e) {
          console.warn(`⚠️ Error checking for base filename in ${imgDir}:`, e);
        }
      }
      
      // If still not found, try to find an image with a similar name in fallback directories
      for (const imgDir of possibleImageDirs) {
        if (fs.existsSync(imgDir)) {
          try {
            const files = fs.readdirSync(imgDir);
            // First try to find exact match without _E or _S suffix
            let similarFile = files.find(file => {
              const baseName = imageFileName.toLowerCase().replace(/\.[^/.]+$/, "");
              const fileBase = file.toLowerCase().replace(/\.[^/.]+$/, "");
              return fileBase === baseName || fileBase === baseName.replace(/_[es]$/i, "");
            });
            
            // If not found, fall back to partial match
            if (!similarFile) {
              similarFile = files.find(file => 
                file.toLowerCase().includes(imageFileName.toLowerCase().replace(/\.[^/.]+$/, ""))
              );
            }
            if (similarFile) {
              console.log(`✅ Found similar reference image: ${similarFile} in fallback directory: ${imgDir}`);
              return fs.readFileSync(path.join(imgDir, similarFile)).toString('base64');
            }
          } catch (e) {
            console.warn(`⚠️ Error reading directory ${imgDir}:`, e);
          }
        }
      }
      
      console.warn(`⚠️ Reference image '${imageFileName}' not found in any directory.`);
    } catch (error: any) {
      console.warn(`⚠️ Failed to load reference image '${imageFileName}':`, error.message);
    }
    return '';
  }


} 