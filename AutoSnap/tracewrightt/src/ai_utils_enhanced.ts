import { Page } from "@playwright/test";
import fs from "fs";
import path from "path";
import axios from "axios";
import { apiLogger, APILogEntry } from "./llm_providers/api_logger.js";
import { forceScreenshotWithRetries } from "./screenshot_helper.js";

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
      console.error(`❌ Failed to write logs: ${error instanceof Error ? error.message : String(error)}`);
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
      textChunks?: string[];
      elementCount: number;
      interactiveCount: number;
      parentUid?: number;
      childrenUids: number[];
      nestedContainerUids?: number[];
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

      function collectTextContent(root: HTMLElement): {
        textChunks: string[];
      } {
        const text = (root.innerText || '').trim();
        
        // Split text into paragraphs/sentences and truncate each to 20 words
        const paragraphs = text.split(/\n\s*\n|\.\s+/).filter(p => p.trim().length > 0);
        const textChunks = paragraphs.map(paragraph => {
          const words = paragraph.trim().split(/\s+/);
          if (words.length <= 20) {
            return paragraph.trim();
          }
          return words.slice(0, 20).join(' ') + '...';
        }).slice(0, 5); // Limit to 5 chunks to avoid overwhelming the prompt
        
        return {
          textChunks
        };
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
        const textInfo = collectTextContent(el);
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
          textChunks: textInfo.textChunks,
          elementCount: 0,
          interactiveCount: 0,
          parentUid: undefined as number | undefined,
          childrenUids: [] as number[],
          nestedContainerUids: [] as number[], // Track containers inside this container
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
          closestParent.nestedContainerUids.push(c.uid);
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
        textChunks: c.textChunks,
        elementCount: c.elementCount,
        interactiveCount: c.interactiveCount,
        parentUid: c.parentUid,
        childrenUids: c.childrenUids,
        nestedContainerUids: c.nestedContainerUids,
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
  screenshotIntent?: string,
  fullJsonResponse?: string
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
        textChunks: c.textChunks?.slice(0, 3) || [], // Show up to 3 text chunks for better context
        headerText: c.headerText,
        interactiveCount: c.interactiveCount,
        isLandmark: c.isLandmark,
        isModalLike: c.isModalLike,
        nestedContainerUids: c.nestedContainerUids || []
      }));

    // Also collect a compact element listing grouped by container
    const compactElements = smartSummary.elements
      .slice(0, 500) // Increased from 300 to 500 for even more comprehensive element information
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
    
    **PRIORITY ORDER:**
    1. HIGHEST: Elements with [data-testid] that are most specific to the screenshot intent (e.g., if screenshotting a modal, prefer data-testids containing "modal", "dialog"; if screenshotting a table, prefer "table", "grid", "list")
    2. Elements with any [data-testid] attribute (critical for stable automation)
    3. Elements with stable semantic roles using CSS selectors: [role="dialog"], [role="listbox"], [role="menu"], [role="combobox"]
    4. Elements with stable, non-auto-generated IDs
    5. Semantic containers (main, section, article, nav) that contain the target
    6. Elements with CSS classes that clearly indicate their purpose
    7. Container elements with sensible dimensions (width > 100px and height > 50px)
    
    **USING THE PROVIDED CONTAINER INFORMATION:**
    You will receive detailed container information in this format:
    \`\`\`
    DETAILED CONTAINER INFORMATION:
    1. [1] ELEMENT: [data-testid="layout-view-root"]
      Attributes: no role, data-testid="layout-view-root"
      Position: x:64, y:61, w:1176, h:708
      Interactive elements: 1
      Text content: "Welcome to the application dashboard" | "Navigate using the menu options..." | "Current status: active"
      Nested containers: [2, 3, 4] (3 containers inside this one)
      Elements: div[data-testid="layout-view-root"]: "Omega.ai Default..."
    \`\`\`
    
    **NEW TEXT CONTENT FORMAT:**
    - **Text content**: Shows actual readable text from the container, split into meaningful chunks (max 20 words each)
    - **Nested containers**: Lists container UIDs that are inside this container for better hierarchy understanding
    
    **DECISION PROCESS:**
    1. **Read the screenshot intent** - Understand what needs to be captured
    2. **Analyze each numbered container** [1], [2], [3], etc. from the provided data
    3. **Match text content to intent** - Look for relevant phrases in the actual text content displayed
    4. **Consider nested containers** - Containers with many nested elements might provide better context if there are 2 containers with both having required text content find a container that has both these containers inside it.
    5. **Check interactive elements count** - Higher counts may indicate more relevant containers
    6. **Review container dimensions** - Prefer containers that provide spatial context (bigger is better for context)
    7. **Extract the exact data-testid** - Use the precise value from the ELEMENT field
    8. **Generate the locator** - Create Playwright code with \`[data-testid="exact-value"]\`

    **TECHNICAL REQUIREMENTS:**
    1. Pick EXACTLY ONE best container that includes the target and shows where the target is located
    2. Always prefer [data-testid] selectors over any other type when available
    3. Use page.locator() with CSS selectors - never use getByRole(), getByText(), or similar methods
    4. ALWAYS add a reasonable timeout (30000ms default, 60000ms for complex UI)
    5. NEVER use .first(), .nth(), or chained filters in screenshot locators - use more specific selectors instead
    6. ALWAYS include a "thinking" section in your response that explains your reasoning process
    7. Return the exact Playwright screenshot command after your thinking section
    8. **FORCE ALL SCREENSHOT COMMANDS by adding { force: true } to all locators**
    
    **RECOMMENDED SELECTOR PATTERNS (in order of preference):**
    - Data attributes: \`[data-testid="element-name"]\`
    - Compound selectors with parent-child: \`div:has([data-testid="child-element"])\`
    - Specific classes: \`.unique-container-class\`
    - Text content with data attributes: \`div:has-text("Title"):has([data-testid="content"])\`
    - Parent with multiple identifiers: \`div:has(.title):has(.content)\`
    - Elements with ARIA attributes: \`[aria-label="Description"]\`
    - Elements with semantic roles: \`[role="dialog"]\`
    
    **EXAMPLES USING PROVIDED CONTAINER DATA:**
    
    Given this container information:
    \`\`\`
    5. [5] CONTAINER: [data-testid="data-grid-table-container"]
      Position: x:88, y:129, w:1152, h:640
      Interactive elements: 1
    \`\`\`
    
    Good response:
    \`\`\`
    await page.locator('[data-testid="data-grid-table-container"]', { force: true }).screenshot({ path: './images/container.png', timeout: 30000 });
    \`\`\`
    
    Given this container information:
    \`\`\`
    7. [7] ELEMENT: [data-testid="worklist-data-grid-table-header"]
      Position: x:88, y:129, w:1990, h:93
      Interactive elements: 36
    \`\`\`
    
    Good response:
    \`\`\`
    await page.locator('[data-testid="worklist-data-grid-table-header"]', { force: true }).screenshot({ path: './images/header.png', timeout: 30000 });
    \`\`\`
    
    **BAD RESPONSES (DO NOT DO THESE):**
    - Using getBy methods: \`await page.getByRole('listbox').screenshot()\`
    - Using .first() on locators: \`await page.locator('.container').first().screenshot()\`
    - Using generic text locators: \`await page.getByText('Some text').screenshot()\`
    - Using complex chained locators: \`await page.locator('div').filter({ has: page.getByText('text') }).screenshot()\`
    - Missing timeout: \`await page.locator('.selector').screenshot({ path: 'file.png' })\`
    - Missing force option: \`await page.locator('.selector').screenshot({ path: 'file.png', timeout: 30000 })\`
    - Returning JSON objects, markdown code blocks, or explanations
    
    **TIMEOUT GUIDELINES:**
    - Use 30000ms (30 seconds) for standard UI elements
    - Use 60000ms (60 seconds) for:
    - Complex data grids with many rows
    - Dynamic content that loads asynchronously
    - Elements that require network requests to render
    - Containers with heavy JavaScript interactions
    
    DETAILED CONTAINER INFORMATION:
    ${condensedContainers.map((c, i) => {
    // Format bbox to be more readable
    const bbox = c.bbox ? `x:${c.bbox.x}, y:${c.bbox.y}, w:${c.bbox.width}, h:${c.bbox.height}` : 'unknown';
    
    // Get container elements if available
    const containerElements = compactElements.filter(e => e.containerUid === c.uid).slice(0, 10);
    const elementsList = containerElements.length > 0 
      ? `\n    Elements: ${containerElements.map(e => 
          `${e.tag}${e.testId ? `[data-testid="${e.testId}"]` : ''}${e.role ? `[role="${e.role}"]` : ''}${e.text ? `: "${e.text}"` : ''}`
        ).join(', ')}`
      : '';
    
    // Format nested containers information
    const nestedContainers = c.nestedContainerUids && c.nestedContainerUids.length > 0 
      ? `\n    Nested containers: [${c.nestedContainerUids.join(', ')}] (${c.nestedContainerUids.length} container${c.nestedContainerUids.length !== 1 ? 's' : ''} inside this one)`
      : '';
    
    // Format text content chunks
    const textContent = c.textChunks && c.textChunks.length > 0
      ? `\n    Text content: ${c.textChunks.map(chunk => `"${chunk}"`).join(' | ')}`
      : '';
    
    return `${i + 1}. [${c.uid}] ${c.type.toUpperCase()}: ${c.selector}
      Attributes: ${c.role ? `role="${c.role}"` : 'no role'}${c.testId ? `, data-testid="${c.testId}"` : ''}
      Position: ${bbox}
      Interactive elements: ${c.interactiveCount || 0}${textContent}${c.headerText ? `\n    Header: "${c.headerText}"` : ''}${c.isModalLike ? '\n    Type: modal-like container' : ''}${nestedContainers}${elementsList}`;
    }).join('\n\n')}
    
    URL: ${pageUrl}, Viewport: ${JSON.stringify(viewport)}
    
    **RESPONSE FORMAT:**
    Your response should be a strict JSON format with a thinking field and a code field and the name of the screenshot has to be exactly like in the code previously generated:
    
    {{
      "thinking": "Detailed explanation of your reasoning process, which container you chose and why, how it relates to the screenshot intent, and why this selector is the most appropriate choice.",
      "code": "await page.locator('[data-testid=\"example-container\"]', { force: true }).screenshot({ path: './images/example-image-name.png', timeout: 30000 });"
    }}
    `;

    // Get image description from LLM and add context
    let imageDescription = '';
    if (imgFileName && base64Screenshot) {
      // Extract image path information
      const imgDir = imgFileName.includes('/') ? imgFileName.substring(0, imgFileName.lastIndexOf('/')) : 
                    (imgFileName.includes('\\') ? imgFileName.substring(0, imgFileName.lastIndexOf('\\')) : '');
      const baseName = imgFileName.split('/').pop()?.split('\\').pop() || imgFileName;
      
      // Set up image description section
      imageDescription = `This is how the image should look\n`;
      
      // Try to get AI description of the image
      try {
        console.log(`🔍 Getting AI description for image: ${baseName}`);
        const aiDescription = await this.getImageDescription(base64Screenshot);
        
        if (aiDescription) {
          // Format the description nicely
          imageDescription += `\nThis is the description of how the screenshot looks:\n\n${aiDescription}\n`;
          console.log(`✅ Successfully added AI description for image: ${baseName}`);
        } else {
          console.warn(`⚠️ No AI description was generated for image: ${baseName}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to get AI description of the image: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    const userTextPrompt = `You are supposed to take a screenshot of the container that contains the target element and to do that consider the image description, the screenshot intent and the container highlighted image shared with you.

The following JSON contains the full previous response with all the details:
use the same name of the image when you write the playwright command for the screenshot.
the command might be right but it not always is your job is to find the best container that can fit the right elements with enough surrounding context to get the perfect screenshot.
bigger container is always better to get the right context.
pick the container based on the container name if it makes sense for the intent.
use the intent of the screenshot to pick the container.
${fullJsonResponse ? `${fullJsonResponse}` : ''}
this is the description of the ideal screenshot
you have to find a container to capture the screenshot of that can make it look like this:
${imageDescription ? `\n\n${imageDescription}` : ''}`;

    const userMessageContent: Array<{ type: string; text?: string; image_url?: { url: string, detail?: string } }> =
      [{ type: "text", text: userTextPrompt }];
    

    
    // Add container-highlighted screenshot if available
    if (enhancedScreenshotBase64 && enhancedScreenshotBase64 !== base64Screenshot) {
      // Send the container-highlighted screenshot without additional description
      userMessageContent.push({
        type: "image_url",
        image_url: { url: `data:image/png;base64,${enhancedScreenshotBase64}`, detail: "auto" }
      });
    }

    const requestPayload = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessageContent }
      ],
      temperature: 0.4,
      top_p: 0.8,
    };

    // Log the actual API call payload

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
      console.log('🔍 Response from ai utils enhanced: ' + response.data);
      const duration = Date.now() - startTime;
      const aiContent: string = response.data.choices?.[0]?.message?.content || '';
/* The above code is written in TypeScript and it is checking the `response.data.usage` object for the
existence of the `prompt_tokens` property. If the `prompt_tokens` property exists, it assigns its
value to the `inputTokenCount` variable. If the `prompt_tokens` property does not exist or is `null`
or `undefined`, it assigns the value `0` to the `inputTokenCount` variable. */
      const inputTokenCount = response.data.usage?.prompt_tokens || 0;
      const outputTokenCount = response.data.usage?.completion_tokens || 0;
      
      // Log token usage (excluding image tokens)
      
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
    
      // Try to extract thinking from the response
      try {
        // Look for JSON structure with thinking field
        const thinkingMatch = aiContent.match(/\{[\s\S]*?"thinking"\s*:\s*"([^"]+)"[\s\S]*?\}/);
        if (thinkingMatch && thinkingMatch[1]) {
          extractedThinking = thinkingMatch[1];
          console.log('\n💭 THINKING: ' + extractedThinking + '\n');
        } else {
          // Try to find thinking section with markdown-style formatting
          const markdownThinkingMatch = aiContent.match(/(?:thinking|reasoning|analysis):\s*([^\n]+(?:\n(?!\n)[^\n]+)*)/i);
          if (markdownThinkingMatch && markdownThinkingMatch[1]) {
            extractedThinking = markdownThinkingMatch[1].trim();
            console.log('\n💭 THINKING: ' + extractedThinking + '\n');
          }
        }
      } catch (thinkingError) {
        console.warn('⚠️ Error extracting thinking:', thinkingError instanceof Error ? thinkingError.message : String(thinkingError));
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
        .replace(/^```(?:json|javascript|typescript|js|ts)?\s*/g, '')  // Handle various code block language tags
        .replace(/```\s*$/g, '')
        .trim();

      // Default to using cleaned content as code
      extractedCode = cleaned;
      
        
        // Fallback: Look for Playwright code pattern directly
        console.log('💭 Response from ai utils enhanced: ' + aiContent);
        const playwrightCodePattern = /(await\s+page\s*\.\s*\w+\s*\([^)]*\)\s*\.\s*screenshot\s*\([^;]*\)\s*;|page\s*\.\s*\w+\s*\([^)]*\)\s*\.\s*screenshot\s*\([^;]*\)\s*;)/;
      const codeMatch = cleaned.match(playwrightCodePattern);
      
      if (codeMatch && codeMatch[0]) {
        extractedCode = codeMatch[0].trim();
        console.log('✅ Extracted Playwright screenshot code directly from response');
      } else {
        // Try to find code blocks
        const codeBlockMatch = cleaned.match(/```[a-z]*\s*([\s\S]*?)```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
          extractedCode = codeBlockMatch[1].trim();
          console.log('📝 Extracted code from markdown code block');
          
          // Check if the extracted code contains a Playwright screenshot command
          const codeMatch = extractedCode.match(playwrightCodePattern);
          if (codeMatch && codeMatch[0]) {
            extractedCode = codeMatch[0].trim();
            console.log('✅ Found Playwright screenshot code in code block');
          }
        }
      }
      
      // Try to extract thinking from markdown format
      const thinkingMatch = cleaned.match(/(?:THINKING|thinking|Thinking|THOUGHT|thought|Thought|ANALYSIS|analysis|Analysis)[:|\n]([\s\S]*?)(?:```|INSTRUCTIONS|instructions|Instructions|STEPS|steps|Steps)/i);
      if (thinkingMatch && thinkingMatch[1]) {
        extractedThinking = thinkingMatch[1].trim();
        console.log('💭 THINKING from markdown: ' + extractedThinking );
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
    screenshotIntent?: string,
    fullJsonResponse?: string
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


          
      // Generate enhanced prompt with all available context
      const aiGeneratedCommand = await this.generateEnhancedPrompt(
        base64Screenshot,
        originalScreenshotCommand, 
        origFileName,
        refinementContext,
        thinking,
        fullJsonResponse // Pass the full JSON response
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
    // Highlight a focused set of containers to avoid visual clutter
    const topContainers = containers.slice(0, 8); // Reduced back to 8 for cleaner visualization
    
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
      
      // Sort containers by size (largest first) to prevent small containers from being obscured
      const sortedContainers = [...containersToHighlight].sort((a, b) => {
        // Try to get elements
        const elemA = document.querySelector(a.selector);
        const elemB = document.querySelector(b.selector);
        
        if (!elemA || !elemB) return 0;
        
        const rectA = elemA.getBoundingClientRect();
        const rectB = elemB.getBoundingClientRect();
        
        // Calculate area
        const areaA = rectA.width * rectA.height;
        const areaB = rectB.width * rectB.height;
        
        // Sort by area (largest first)
        return areaB - areaA;
      });
      
      // Store badge positions to prevent overlap
      const usedPositions = new Set();
      
      // Create a highlight overlay for each container
      sortedContainers.forEach((container, index) => {
        try {
          const element = document.querySelector(container.selector);
          if (!element) return;
          
          const rect = element.getBoundingClientRect();
          
          // Skip tiny elements
          if (rect.width < 10 || rect.height < 10) return;
          
          // Create highlight element
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
          highlight.style.zIndex = (10000 - index).toString(); // Larger containers get lower z-index
          highlight.style.pointerEvents = 'none';
          
          // Find a good position for the badge that doesn't overlap with others
          // Define position types
          type BadgePosition = {
            top?: number;
            right?: number;
            bottom?: number;
            left?: number;
          };
          
          let badgePosition: BadgePosition = { top: -15, right: -15 }; // Default position
          
          // Try different positions if the default is already used
          const positions: BadgePosition[] = [
            { top: -15, right: -15 }, // Top right (default)
            { top: -15, right: 15 },  // Top middle-right
            { top: -15, right: 45 },  // Top far-right
            { top: 15, right: -15 },  // Middle right
            { top: 45, right: -15 },  // Far right
            { top: rect.height - 15, right: -15 }, // Bottom right
            { top: rect.height - 15, left: -15 },  // Bottom left
            { top: -15, left: -15 }     // Top left
          ];
          
          // Find first unused position
          for (const pos of positions) {
            const posKey = JSON.stringify(pos);
            if (!usedPositions.has(posKey)) {
              badgePosition = pos;
              usedPositions.add(posKey);
              break;
            }
          }
          
          // Add container number badge
          const badge = document.createElement('div');
          badge.className = 'container-highlight-badge';
          badge.style.position = 'absolute';
          
          // Apply the position
          if (badgePosition.top !== undefined) badge.style.top = `${badgePosition.top}px`;
          if (badgePosition.right !== undefined) badge.style.right = `${badgePosition.right}px`;
          if (badgePosition.bottom !== undefined) badge.style.bottom = `${badgePosition.bottom}px`;
          if (badgePosition.left !== undefined) badge.style.left = `${badgePosition.left}px`;
          
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
  /**
   * Get a description of an image using LLM
   */
  private async getImageDescription(base64Image: string): Promise<string> {
    try {
      const { aiConfig } = playwrightConfig;
      
      // Check if we have a valid base64 image
      if (!base64Image || base64Image.length < 100) {
        console.warn('⚠️ Invalid or empty base64 image provided');
        return '';
      }
      
      // Prefer explicit override via env or hardcoded endpoint provided by user
      const overrideEndpoint = process.env.AZURE_OPENAI_ENDPOINT || 'https://dhanu-m7k6n5e0-eastus2.cognitiveservices.azure.com/openai/deployments/gpt-5-chat/chat/completions?api-version=2025-01-01-preview';
      const endpoint = overrideEndpoint || `${aiConfig.apiUrl}/openai/deployments/${aiConfig.ivModel}/chat/completions?api-version=${aiConfig.apiVersion}`;
      const apiKey = process.env.AZURE_OPENAI_API_KEY || aiConfig.apiKey;

      console.log('🖼️ Getting image description from LLM...');
      
      // Enhanced prompt for better UI descriptions
      const userMessageContent = [
        {
          type: "text",
          text: "Analyze this website screenshot and describe what portion of the interface it represents. Specifically:\n\nDoes it show the entire webpage/application window, or just a specific section/panel/component? Clearly state this.\n\nIf it is a part, describe which container/section it seems to belong to (e.g., sidebar panel, modal dialog, content area, toolbar, footer, etc.).\n\nBriefly outline the main visible elements (toolbars, panels, text, buttons) to support the classification.\n\nKeep the output compact, structured, and focused on identifying the correct container scope for screenshotting."
        },
        {
          type: "image_url",
          image_url: { url: `data:image/png;base64,${base64Image}`, detail: "high" }
        }
      ];
      
      const requestPayload = {
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert UI analyst that provides clear, structured descriptions of user interface screenshots. Focus on identifying key UI elements, their arrangement, and the purpose of the screen. Be precise and thorough but concise. Organize your description logically.' 
          },
          { role: 'user', content: userMessageContent }
        ],
        temperature: 0.6,
        max_tokens: 1000
      };

      const startTime = Date.now();
      try {
        console.log(`📤 Sending API request to ${endpoint.split('/').slice(0, 3).join('/')}...`);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey,
          },
          body: JSON.stringify(requestPayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`LLM API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        const description = data.choices?.[0]?.message?.content?.trim();
        
        if (!description) {
          throw new Error('No description returned from API');
        }
        
        console.log(`✅ Got image description (${Date.now() - startTime}ms)`);
        console.log(`📝 Description preview: ${description.substring(0, 100)}...`);
        
        return description;
      } catch (apiError) {
        console.error(`❌ API error: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
        
        // Return a basic fallback description so the process can continue
        return "The image shows a user interface screen from the application.";
      }
    } catch (error) {
      console.error('❌ Error getting image description:', error);
      return '';
    }
  }

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
      console.error('⚠️ Failed to save highlighted container screenshot:', error instanceof Error ? error.message : String(error));
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
    screenshotIntent?: string,
    fullJsonResponse?: string // Add parameter for the full JSON response
  ): Promise<void> {
    console.log('🚀 Starting enhanced code execution...');
    console.log('📍 Page URL:', this.page.url());
    console.log('📝 Code to execute:', code);
    console.log('🧠 LLM thinking:', thinking);
    if (screenshotIntent) {
      console.log('📸 Screenshot intent:', screenshotIntent);
    }
    if (fullJsonResponse) {
      console.log('📋 Full JSON response:', fullJsonResponse);
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
        console.warn('⚠️ Could not write thinking to log file:', writeError instanceof Error ? writeError.message : String(writeError));
      }
    } catch (e) {
      console.warn('⚠️ Failed to process thinking:', e instanceof Error ? e.message : String(e));
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
        screenshotIntent,
        fullJsonResponse
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
        console.error('⚠️ Error during code execution:', execError instanceof Error ? execError.message : String(execError));
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
        console.log('⚠️ Directory setup failed, will continue anyway:', e instanceof Error ? e.message : String(e));
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

  private getReferenceImageBase64(imageFileName: string): string {
    try {
      // Hardcode the exact absolute path to the docs directory
      const docsDir = 'C:/Users/Rohith.MR/test/HelpManualAutomationTest/docs';
      
      if (!fs.existsSync(docsDir)) {
        return '';
      }
      
      // Get all subdirectories in the docs folder
      const docSubdirs = fs.readdirSync(docsDir)
        .filter(item => {
          const itemPath = path.join(docsDir, item);
          return fs.existsSync(itemPath) && fs.lstatSync(itemPath).isDirectory();
        })
        .map(dir => path.join(docsDir, dir));
      
      // First check if there's an img directory directly in the docs folder
      const docsImgDir = path.join(docsDir, 'img');
      if (fs.existsSync(docsImgDir)) {
        const exactPath = path.join(docsImgDir, imageFileName);
        if (fs.existsSync(exactPath)) {
          return fs.readFileSync(exactPath).toString('base64');
        }
      }
      
      // For each subdirectory, check if it has an img folder
      for (const subdir of docSubdirs) {
        // Check for img directory in this subdirectory
        const imgDir = path.join(subdir, 'img');
        if (fs.existsSync(imgDir)) {
          // Try exact filename match
          const exactPath = path.join(imgDir, imageFileName);
          if (fs.existsSync(exactPath)) {
            return fs.readFileSync(exactPath).toString('base64');
          }
        }
        
        // Also check for Images directory (alternative spelling)
        const imagesDir = path.join(subdir, 'Images');
        if (fs.existsSync(imagesDir)) {
          // Try exact filename match
          const exactPath = path.join(imagesDir, imageFileName);
          if (fs.existsSync(exactPath)) {
            console.log(`✅ Found image at: ${exactPath}`);
            return fs.readFileSync(exactPath).toString('base64');
          }
        }
        
        // Check for nested directories within this subdirectory
        try {
          const nestedDirs = fs.readdirSync(subdir)
            .filter(item => {
              const itemPath = path.join(subdir, item);
              return fs.existsSync(itemPath) && fs.lstatSync(itemPath).isDirectory();
            })
            .map(dir => path.join(subdir, dir));
          
          // Check each nested directory for img folders
          for (const nestedDir of nestedDirs) {
            // Skip img and Images directories as we already checked them
            if (path.basename(nestedDir) === 'img' || path.basename(nestedDir) === 'Images') {
              continue;
            }
            
            // Check for img directory in this nested directory
            const nestedImgDir = path.join(nestedDir, 'img');
            if (fs.existsSync(nestedImgDir)) {
              // Try exact filename match
              const exactPath = path.join(nestedImgDir, imageFileName);
              if (fs.existsSync(exactPath)) {
                return fs.readFileSync(exactPath).toString('base64');
              }
            }
            
            // Also check for Images directory in this nested directory
            const nestedImagesDir = path.join(nestedDir, 'Images');
            if (fs.existsSync(nestedImagesDir)) {
              // Try exact filename match
              const exactPath = path.join(nestedImagesDir, imageFileName);
              if (fs.existsSync(exactPath)) {
                return fs.readFileSync(exactPath).toString('base64');
              }
            }
          }
        } catch (e) {
          // Silent error
        }
      }
      
      // Silent failure when image not found
      console.log(`❌ Image not found anywhere in docs: ${imageFileName}`);
      return '';
    } catch (error: any) {
      // Silent error
      return '';
    }
  }


} 