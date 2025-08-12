import { Page } from "@playwright/test";
import fs from "fs";
import path from "path";
import axios from "axios";
import { apiLogger, APILogEntry } from "./llm_providers/api_logger";

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

// ... (imports and config loading remain the same) ...
// eslint-disable-next-line @typescript-eslint/no-var-requires
const playwrightConfig = fs.existsSync(configPath) ? require(configPath) : { aiConfig: {} };

interface RefinementContext {
  failingLocator: string;
  errorMessage: string;
  conflictingElementsHTML: string;
}

export class AIUtils {
  private page: Page;
  private referenceImagesDir: string;

  constructor(page: Page, referenceImagesDir: string = "./reference_images") {
    this.page = page;
    this.referenceImagesDir = referenceImagesDir;
  }

  /**
   * Enhanced helper function to extract visible, interactive elements.
   * This list is meant to be concise and focused on direct interaction points.
   */
  private async getVisibleInteractiveElements(): Promise<Array<any>> {
    return await this.page.evaluate(() => {
      function isVisible(el: HTMLElement): boolean {
        if (!el || !el.offsetParent) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }

      function getElementData(el: HTMLElement): any {
        const parent = el.parentElement;
        const parentData: any = parent ? {
          tag: parent.tagName.toLowerCase(),
          id: parent.id || undefined,
          'data-testid': parent.getAttribute('data-testid') || undefined,
          'data-cy': parent.getAttribute('data-cy') || undefined,
          role: parent.getAttribute('role') || undefined,
          'aria-label': parent.getAttribute('aria-label') || undefined,
          title: parent.getAttribute('title') || undefined,
          class: parent.className.includes('Mui') ? parent.className.split(' ').filter(c => c.startsWith('Mui')).join(' ') : undefined
        } : undefined;

        const data: any = {
          tag: el.tagName.toLowerCase(),
          id: el.id || undefined,
          'data-testid': el.getAttribute('data-testid') || undefined,
          'data-cy': el.getAttribute('data-cy') || undefined,
          'toolname': el.getAttribute('toolname') || undefined,
          role: el.getAttribute('role') || undefined,
          name: el.getAttribute('name') || undefined,
          'aria-label': el.getAttribute('aria-label') || undefined,
          'aria-labelledby': el.getAttribute('aria-labelledby') || undefined,
          'aria-describedby': el.getAttribute('aria-describedby') || undefined,
          title: el.getAttribute('title') || undefined,
          text: el.textContent?.trim()?.substring(0, 70) || undefined,
          parent: parentData
        };

        if (el.tagName.toLowerCase() === 'input') {
          data.placeholder = (el as HTMLInputElement).placeholder || undefined;
          data.value = (el as HTMLInputElement).value?.substring(0, 50) || undefined;
          data.type = (el as HTMLInputElement).type || undefined;
        }
        if (el.tagName.toLowerCase() === 'a') {
          data.href = (el as HTMLAnchorElement).href || undefined;
        }

        if (el.getAttribute('role') === 'menu') {
          const items = Array.from(el.querySelectorAll(':scope > li[role="menuitem"], :scope > div[role="menuitem"]'))
                             .map(item => item.textContent?.trim().substring(0, 40))
                             .filter(text => text && text.length > 0);
          if (items.length > 0) {
            data.menuItems = items;
          }
        }
        return data;
      }

      const interactiveSelectors = [
        'button', 'input:not([type="hidden"])', 'select', 'textarea', '[role="button"]', 
        '[role="link"]', '[role="menuitem"]', '[role="tab"]', '[role="checkbox"]', 
        '[role="radio"]', '[role="option"]', '[role="combobox"]', '[role="slider"]', 
        '[role="spinbutton"]', '[role="switch"]', '[contenteditable="true"]', 
        'a[href]', '[data-cy]', '[data-testid]', '[toolname]', '[aria-label]', '[title]',
        '[role="region"]', '[role="group"]', 'div[class*="container"]', 'div[class*="section"]',
        'div[class*="wrapper"]', 'div[class*="card"]', 'div[class*="header"]', 'div[class*="footer"]'
      ].join(', ');

      const elements = Array.from(
        document.querySelectorAll(interactiveSelectors) as NodeListOf<HTMLElement>
      )
      .filter(isVisible)
      .map(el => getElementData(el))
      .filter(attrs => 
        attrs.id || attrs['data-testid'] || attrs['data-cy'] || attrs.role ||
        attrs['aria-label'] || attrs.title || attrs.name || 
        (attrs.text && attrs.text.length > 0) || 
        (attrs.tag === 'div' && attrs.class && attrs.class.length > 0 && !/^\s*$/.test(attrs.class)) || 
        attrs.placeholder || attrs.href || attrs.menuItems ||
        (attrs.tag === 'div' && attrs.text && attrs.text.length > 0)
      );
      return elements;
    });
  }

  // getIdentifiableElements is no longer used in the prompt context but keeping it for completeness if needed elsewhere
  private async getIdentifiableElements(maxElements = 250): Promise<Array<any>> {
    return await this.page.evaluate((limit) => {
      const results: any[] = [];
      const selectorsToExclude = ['html', 'head', 'body', 'script', 'style', 'meta', 'link', 'noscript', 'title'];
      const all = Array.from(document.querySelectorAll('*')) as HTMLElement[];

      function getElementData(el: HTMLElement): any {
          const data: any = {
            tag: el.tagName.toLowerCase(),
            id: el.id || undefined,
            class: (el.className && typeof el.className === 'string') ? el.className.trim().substring(0, 70) : undefined,
            'data-testid': el.getAttribute('data-testid') || undefined,
            'data-cy': el.getAttribute('data-cy') || undefined,
            role: el.getAttribute('role') || undefined,
            'aria-label': el.getAttribute('aria-label') || undefined,
            title: el.getAttribute('title') || undefined,
            name: el.getAttribute('name') || undefined,
            toolname: el.getAttribute('toolname') || undefined,
            text: el.textContent?.trim()?.substring(0, 20) || undefined,
          };
          if (el.tagName.toLowerCase() === 'input') {
            data.placeholder = (el as HTMLInputElement).placeholder || undefined;
            data.value = (el as HTMLInputElement).value?.substring(0, 15) || undefined;
            data.type = (el as HTMLInputElement).type || undefined;
          }
          if (el.tagName.toLowerCase() === 'a') {
            data.href = (el as HTMLAnchorElement).href || undefined;
          }

          if (el.getAttribute('role') === 'menu') {
            const items = Array.from(el.querySelectorAll(':scope > li[role="menuitem"], :scope > div[role="menuitem"]'))
                               .map(item => item.textContent?.trim().substring(0, 15))
                               .filter(text => text && text.length > 0);
            if (items.length > 0) {
              data.menuItems = items;
            }
          }
          return data;
      }
      
      for (const el of all) {
        if (results.length >= limit) break;
        if (selectorsToExclude.includes(el.tagName.toLowerCase())) continue;

        const data = getElementData(el);
        if (data.id || data['data-testid'] || data['data-cy'] || data.role || 
            data['aria-label'] || data.title || data.name || data.toolname ||
            (data.class && data.class.length > 0 && !/^\s*$/.test(data.class)) || 
            (data.text && data.text.length > 0) || 
            data.placeholder || data.href || data.menuItems
        ) {
          if (Object.keys(data).length > 1 || (Object.keys(data).length === 1 && data.tag && (data.text || data.class))) { 
            Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
            results.push(data);
          }
        }
      }
      return results;
    }, maxElements);
  }

  /**
   * Enhanced HTML parser that provides rich context with indexed elements and full HTML structure.
   */
  private async getRichHTMLContext(maxElements = 200): Promise<Array<any>> {
    return await this.page.evaluate((limit) => {
      const results: any[] = [];
      let elementIndex = 1;

      function isVisible(element: HTMLElement): boolean {
        if (!element || !element.offsetParent) return false;
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }

      function isElementOrChildTopmost(element: Element): boolean {
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        let topmostElement = document.elementFromPoint(centerX, centerY);
        if (topmostElement && (topmostElement === element || element.contains(topmostElement))) return true;

        topmostElement = document.elementFromPoint(rect.left + 1, rect.top + 1);
        if (topmostElement && (topmostElement === element || element.contains(topmostElement))) return true;

        return false;
      }
      
      function isInteractiveElement(element: HTMLElement): boolean {
        const tag = element.tagName.toLowerCase();
        const role = element.getAttribute('role');
        const style = window.getComputedStyle(element);
        
        if (['button', 'input', 'select', 'textarea', 'a'].includes(tag)) return true;
        
        if (['button', 'link', 'menuitem', 'tab', 'checkbox', 'radio', 'option', 'combobox', 'slider', 'spinbutton', 'switch'].includes(role || '')) return true;
        
        if (style.cursor === 'pointer' && tag !== 'input') return true;
        
        if (element.getAttribute('data-testid') || element.getAttribute('data-cy') || element.getAttribute('toolname')) return true;
        
        return false;
      }

      function getElementContext(element: HTMLElement, index: number): any {
        const rect = element.getBoundingClientRect();
        const data: any = {
          index: index,
          tag: element.tagName.toLowerCase(),
          id: element.id || undefined,
          class: (element.className && typeof element.className === 'string') ? element.className.trim().substring(0, 150) : undefined,
          'data-testid': element.getAttribute('data-testid') || undefined,
          'data-cy': element.getAttribute('data-cy') || undefined,
          'toolname': element.getAttribute('toolname') || undefined,
          role: element.getAttribute('role') || undefined,
          name: element.getAttribute('name') || undefined,
          'aria-label': element.getAttribute('aria-label') || undefined,
          'aria-labelledby': element.getAttribute('aria-labelledby') || undefined,
          'aria-describedby': element.getAttribute('aria-describedby') || undefined,
          title: element.getAttribute('title') || undefined,
          text: element.textContent?.trim()?.substring(0, 100) || undefined,
          position: {
            x: Math.round(rect.left),
            y: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          },
          isVisible: isVisible(element),
          isInteractive: isInteractiveElement(element),
          outerHTML: element.outerHTML.substring(0, 500)
        };

        if (element.tagName.toLowerCase() === 'input') {
          data.placeholder = (element as HTMLInputElement).placeholder || undefined;
          data.value = (element as HTMLInputElement).value?.substring(0, 50) || undefined;
          data.type = (element as HTMLInputElement).type || undefined;
        }
        if (element.tagName.toLowerCase() === 'a') {
          data.href = (element as HTMLAnchorElement).href || undefined;
        }

        if (element.getAttribute('role') === 'menu') {
          const items = Array.from(element.querySelectorAll(':scope > li[role="menuitem"], :scope > div[role="menuitem"], :scope > [role="menuitem"]'))
                             .map(item => ({
                               text: item.textContent?.trim().substring(0, 50) || '',
                               id: item.id || undefined,
                               'data-testid': item.getAttribute('data-testid') || undefined,
                               class: (item.className && typeof item.className === 'string') ? item.className.trim().substring(0, 100) : undefined
                             }))
                             .filter(item => item.text.length > 0);
          if (items.length > 0) {
            data.menuItems = items;
          }
        }

        const parent = element.parentElement;
        if (parent && parent !== document.body) {
          const parentData: any = {
            tag: parent.tagName.toLowerCase(),
            id: parent.id || undefined,
            'data-testid': parent.getAttribute('data-testid') || undefined,
            'data-cy': parent.getAttribute('data-cy') || undefined,
            role: parent.getAttribute('role') || undefined,
            class: (parent.className && typeof parent.className === 'string') ? parent.className.trim().substring(0, 100) : undefined
          };
          const hasParentIdentifier = Object.values(parentData).some(val => val !== undefined && val !== '');
          if (hasParentIdentifier) {
            data.parent = parentData;
          }
        }

        return data;
      }

      const interactiveSelectors = [
        'button', 'input:not([type="hidden"])', 'select', 'textarea', 
        '[role="button"]', '[role="link"]', '[role="menuitem"]', '[role="tab"]', 
        '[role="checkbox"]', '[role="radio"]', '[role="option"]', '[role="combobox"]', 
        '[role="slider"]', '[role="spinbutton"]', '[role="switch"]', 
        '[contenteditable="true"]', 'a[href]', '[data-cy]', '[data-testid]', 
        '[toolname]', '[aria-label]', '[title]'
      ].join(', ');

      const relevantSelectors = [
        ...interactiveSelectors.split(', '), // Include all interactive selectors
        'div[id]', 'div[data-testid]', 'div[data-cy]', 'div[role]', 'div[aria-label]', 'div[title]',
        'div[class*="container"]', 'div[class*="section"]', 'div[class*="wrapper"]',
        'div[class*="card"]', 'div[class*="header"]', 'div[class*="footer"]',
        'form', 'fieldset', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span',
        'section', 'article', 'aside', 'nav', 'main', 'header', 'footer'
      ].join(', ');

      const allElementsOnPage = Array.from(document.querySelectorAll(relevantSelectors) as NodeListOf<HTMLElement>)
                                  .filter(el => {
                                      const tag = el.tagName.toLowerCase();
                                      return !['script', 'style', 'noscript', 'meta', 'link', 'title'].includes(tag) && isVisible(el);
                                  });

      const filteredElements = allElementsOnPage.filter(element => {
          if (isInteractiveElement(element)) return true;
          if (element.id || element.getAttribute('data-testid') || element.getAttribute('data-cy') || element.getAttribute('role')) return true;
          if (element.textContent?.trim().length && element.textContent.trim().length > 0 && element.children.length === 0) return true;
          if (['div', 'form', 'fieldset', 'ul', 'ol', 'li', 'section', 'article', 'aside', 'nav', 'main', 'header', 'footer'].includes(element.tagName.toLowerCase())) {
              if (element.className && element.className.trim().length > 0) return true;
              if (element.textContent?.trim().length && element.textContent.trim().length > 0) return true;
              return Array.from(element.querySelectorAll(interactiveSelectors)).some(child => isVisible(child as HTMLElement));
          }
          return false;
      });

      for (const element of filteredElements) {
        if (results.length >= limit) break;
        const elementData = getElementContext(element, elementIndex);
        Object.keys(elementData).forEach(key => {
          if (elementData[key] === undefined) delete elementData[key];
        });
        results.push(elementData);
        elementIndex++;
      }

      return results;
    }, maxElements);
  }

  // ... (All other methods remain the same) ...

  /**
   * Intercepts screenshot commands and processes them through AI generation.
   */
  async interceptScreenshotCommand(
    originalCodeBlock: string, 
    isRefinementCycle: boolean = false, 
    refinementContext?: RefinementContext,
    thinking?: string
  ): Promise<string> {
    const screenshotCommandRegex = /(\bawait\s+)?(page\.screenshot\s*\(.*?\)|[^;]+\.screenshot\s*\(.*?\));?/i;
    const match = originalCodeBlock.match(screenshotCommandRegex);

    if (!match) return this.applyTimeoutAndClean(originalCodeBlock);

    const originalScreenshotCommand = match[0];
    console.log(isRefinementCycle ? "🎯 Refining screenshot command..." : "🎯 Screenshot command detected! Intercepting...");

    try {
      let imgFileName: string | null = null;
      const pathMatch = originalScreenshotCommand.match(/path\s*:\s*['"]([^'\"]+\.(?:png|jpg|jpeg|gif|bmp|webp))['"]/i);
      if (pathMatch?.[1]) {
        imgFileName = path.basename(decodeURIComponent(pathMatch[1]));
      }

      let base64Screenshot = '';
      if (imgFileName) {
        base64Screenshot = this.getReferenceImageBase64(imgFileName);
        if (!base64Screenshot) console.warn(`⚠️  Reference image '${imgFileName}' not found.`);
      }

      const aiGeneratedCode = await this.generatePlaywrightScreenshotFunction(
        base64Screenshot, 
        originalCodeBlock, 
        imgFileName, 
        refinementContext, 
        thinking
      );

      const processedCode = this.applyTimeoutAndClean(aiGeneratedCode);
      return originalCodeBlock.replace(originalScreenshotCommand, processedCode);
    } catch (error: any) {
      console.warn(`⚠️  Screenshot interception failed: ${error.message}`);
      return this.applyTimeoutAndClean(originalCodeBlock);
    }
  }

  /**
   * Generates Playwright screenshot code using an AI model.
   */
  async generatePlaywrightScreenshotFunction(
    base64Screenshot: string,
    codeContext: string, // Original user code or failing AI code
    imgFileName: string | null,
    refinementContext?: RefinementContext,
    thinking?: string
  ): Promise<string> {
    try {
      // Check if required environment variables are set
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
      const apiKey = process.env.AZURE_OPENAI_API_KEY;
      
      if (!endpoint || !apiKey) {
        console.warn('⚠️  AI screenshot generation skipped – missing AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_API_KEY environment variables');
        return codeContext;
      }

      const visibleElements = await this.getVisibleInteractiveElements();
      const richHTMLContext = await this.getRichHTMLContext();

      let markdownContext = '';
      const imgMatchInCodeContext = codeContext.match(/["']([^"']+\.(?:png|jpg|jpeg|gif|bmp|webp))["']/i);
      if (imgMatchInCodeContext?.[1]) {
        const imgFileForMarkdownSearch = path.basename(imgMatchInCodeContext[1]);
        const ctx = this.findMarkdownContextLines(imgFileForMarkdownSearch);
        if (ctx) markdownContext = ctx;
      }

      const targetImgFilenameOrDefault = imgFileName || 'derived-screenshot.png';
      let targetImageFilenameInstruction = `\nThe output screenshot file MUST be named 'img/${targetImgFilenameOrDefault}'. Include this in the 'path' option of the screenshot command.`;

      let userPromptIntro = `The goal is to generate a Playwright screenshot command for the specific UI element shown in the 'Reference screenshot' (which will be provided as image data if available).`;

      if (thinking) {
        userPromptIntro += `\n\n🧠 LLM THINKING CONTEXT: ${thinking}\nThis thinking explains the intention behind taking this screenshot and what it should demonstrate.`;
      }

      if (refinementContext) {
        console.log("🧠 AI Refinement Mode: Using error context in prompt.");
        userPromptIntro = `ATTEMPTING TO REFINE A FAILING LOCATOR.
The previous Playwright command was:
\`\`\`javascript
${refinementContext.failingLocator}
\`\`\`
It failed with a strict mode violation: "${refinementContext.errorMessage}".
The locator matched multiple elements. Here are details of the conflicting elements:
<CONFLICTING_ELEMENTS_DETAILS>
${refinementContext.conflictingElementsHTML}
</CONFLICTING_ELEMENTS_DETAILS>

Your task is to provide a *more specific Playwright locator* for the screenshot command that uniquely identifies the element shown in the 'Reference screenshot' (image data provided) and resolves this conflict.
Consider the text content, aria-labels, roles, menuItems (if applicable), and unique class names (like 'MuiMenu-list' or 'css-r8u8y9' for the target menu, or 'css-1ontqvh' for a different menu if that's the conflict) visible in the DOM data below and in the reference image. The target menu likely contains items like 'Burn Study', 'Toggles', etc.
${thinking ? `\n\n🧠 LLM THINKING CONTEXT: ${thinking}\nThis thinking explains the intention behind taking this screenshot and what it should demonstrate.` : ''}
`;
      }

      const userTextPrompt = `${userPromptIntro}
${targetImageFilenameInstruction}
    
Use the following DOM information to identify the target element and its selector:
<<VISIBLE_INTERACTIVE_ELEMENTS>>
${JSON.stringify(visibleElements, null, 2)}
<<END_VISIBLE_INTERACTIVE_ELEMENTS>>

<<RICH_HTML_CONTEXT_WITH_INDEXED_ELEMENTS>>
${JSON.stringify(richHTMLContext, null, 2)}
<<END_RICH_HTML_CONTEXT_WITH_INDEXED_ELEMENTS>>
${markdownContext ? `\n<<NEARBY_DOC_LINES>>\n${markdownContext}\n<<END_NEARBY_DOC_LINES>>` : ''}`;

      // --- START OF SYSTEM PROMPT CLARITY IMPROVEMENTS ---
      const systemPrompt = `You are an expert Playwright automation engineer. Your primary goal is to generate highly accurate and robust Playwright 'locator.screenshot()' commands.

Your instructions are as follows:
1.  **Understand the Target:** Carefully analyze the 'Reference screenshot' to visually identify the exact UI element or section to be captured.
2.  **Utilize Provided DOM Context:**
    *   **'VISIBLE_INTERACTIVE_ELEMENTS'**: This list contains key interactive elements (buttons, inputs, links, etc.) and significant logical grouping containers (like cards, sections, or wrappers) that are currently visible on the page. Use this for high-level identification and potential direct selectors.
    *   **'RICH_HTML_CONTEXT_WITH_INDEXED_ELEMENTS'**: This provides a more detailed, structural view of the relevant visible elements, including their positions, full HTML snippets, and parent relationships. Use this for precise identification, understanding element nesting, and resolving ambiguities.
    *   **Removed for Efficiency**: Note that 'IDENTIFIABLE_PAGE_ELEMENTS_FOR_CONTEXT' has been removed to reduce prompt length and focus on the most relevant data.
3.  **Prioritize Robust Selectors:**
    *   Favor selectors that are resilient to minor UI changes and language localization.
    *   Prefer built-in Playwright locators: \`page.getByRole()\`, \`page.getByText()\`, \`page.getByLabel()\`, \`page.getByPlaceholder()\`, \`page.getByAltText()\`, \`page.getByTitle()\`, \`page.getByTestId()\`.
    *   When a specific UI *section* (a logical grouping of elements) is targeted in the reference image, use Playwright's \`locator().filter()\` or CSS \`:has()\` pseudo-class (e.g., \`page.locator('div:has(button:has-text("Button1")):has(button:has-text("Button2"))')\`) to select the appropriate parent container.
    *   Only use complex CSS selectors or XPath as a last resort.
4.  **Screenshot Scope:**
    *   The generated command MUST capture the *entire* UI element or logical section as depicted in the reference screenshot.
    *   This includes any expanded parts (like open dropdowns or menus) *if they are shown as such in the reference image*.
    *   The screenshot should provide sufficient surrounding context for clarity, but it should NOT capture the entire page unless the entire page is the specific, relevant context.
5.  **Command Requirements:**
    *   Generate ONLY the Playwright JavaScript code for the 'locator.screenshot()' command.
    *   The command MUST include a 'path' option, using the specified filename (e.g., \`path: 'img/your_filename.png'\`).
    *   Assume the UI is already in the exact state shown in the reference image.
6.  **Refinement Tasks (if applicable):**
    *   If a RefinementContext is provided, your task is to **REFINE** the previous, failing locator. Focus on resolving the strict mode violation or ambiguity by finding a more unique and stable selector for the target.
7.  **LLM Thinking Context:**
    *   If a LLM THINKING CONTEXT is provided, use it to understand the specific intention and purpose of this screenshot, which might guide your choice of selector or the boundaries of the captured element.

Output ONLY the Playwright JavaScript code for the 'locator.screenshot()' command.
`;
      // --- END OF SYSTEM PROMPT CLARITY IMPROVEMENTS ---

      const userMessageContent: Array<{ type: string; text?: string; image_url?: { url: string, detail?: string } }> =
        [{ type: "text", text: userTextPrompt }];
      if (base64Screenshot) {
        userMessageContent.push({
          type: "image_url",
          image_url: { url: `data:image/png;base64,${base64Screenshot}`, detail: "auto" }
        });
      }

      if (process.env.VERBOSE_LLM === 'true') {
        console.log('📝 system prompt:', systemPrompt);
        console.log('📝 user prompt (text part):', userTextPrompt);
        if (base64Screenshot) console.log('🖼️ Reference screenshot provided to LLM.');
      }
      
      const promptLogPath = path.join(process.cwd(), 'ai_prompt_logs.txt');
      const logEntry = [
        '\n===== Prompt @ ' + new Date().toISOString() + ` (Refinement: ${!!refinementContext}) =====`,
        'SYSTEM:\n' + systemPrompt,
        'USER (text part):\n' + userTextPrompt,
        base64Screenshot ? 'USER (image part): [Base64 Image Data Provided]' : 'USER (image part): [No Image Data]'
      ].join('\n');
      try { fs.appendFileSync(promptLogPath, logEntry); } catch (e: any) { console.warn('⚠️  Failed to write prompt log file:', e.message); }

      const requestPayload = {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessageContent }
        ],
        temperature: refinementContext ? 0.2 : 0.3,
        top_p: 1,
        max_tokens: 1000,
      };

      const startTime = Date.now();
      
      if (process.env.VERBOSE_LLM === 'true') {
        console.log(`🔗 Azure OpenAI request -> ${endpoint}`);
        console.log(`   prompt tokens approx (user text prompt only): ${userTextPrompt.split(/\s+/).length}`);
      }
      
      let response;

      try {
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

        // Create log entry
        const logEntry: APILogEntry = {
          timestamp: new Date().toISOString(),
          provider: 'openai',
          model: 'gpt-4o-mini', // Assuming this is the model being used
          request: {
            systemInstruction: systemPrompt,
            userPrompt: userTextPrompt,
            hasImage: !!base64Screenshot,
            imageSize: base64Screenshot ? Buffer.from(base64Screenshot, 'base64').length : undefined,
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
            thinking: "Screenshot generation",
            code: aiContent
          },
          metadata: {
            temperature: refinementContext ? 0.2 : 0.3,
            maxTokens: 1000,
            topP: 1
          },
          duration
        };

        apiLogger.logAPICall(logEntry);

        if (process.env.VERBOSE_LLM === 'true') console.log(`✅ Azure response status: ${response.status}`);

        const cleaned = aiContent.replace(/^```[a-zA-Z]*\s*/g, '').replace(/```\s*$/g, '').trim();
        
        if (cleaned && !cleaned.endsWith(';') && !cleaned.endsWith('}')) return `${cleaned};`;
        return cleaned || codeContext;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        // Log error entry
        const errorLogEntry: APILogEntry = {
          timestamp: new Date().toISOString(),
          provider: 'openai',
          model: 'gpt-4o-mini',
          request: {
            systemInstruction: systemPrompt,
            userPrompt: userTextPrompt,
            hasImage: !!base64Screenshot,
            imageSize: base64Screenshot ? Buffer.from(base64Screenshot, 'base64').length : undefined,
            pageUrl: await this.page.url(),
            visibleElementsLength: userTextPrompt.length,
            previouslyExecutedCode: codeContext,
            currentStepErrorCode: refinementContext?.errorMessage || ''
          },
          response: {
            status: error?.response?.status || 500,
            content: error?.message || "Unknown error",
            inputTokenCount: 0,
            outputTokenCount: 0,
            totalTokens: 0,
            thinking: "Error occurred",
            code: "error"
          },
          metadata: {
            temperature: refinementContext ? 0.2 : 0.3,
            maxTokens: 1000,
            topP: 1
          },
          duration
        };

        apiLogger.logAPICall(errorLogEntry);
        throw error;
      }

    } catch (error: any) {
      const shortMsg = error?.message || 'unknown error';
      if (error?.response?.data) console.warn('🔍 Azure error body:', JSON.stringify(error.response.data));
      console.warn(`⚠️  AI screenshot generation failed (${shortMsg}); falling back to original/previous code`);
      return codeContext;
    }
  }

  // ... (rest of AIUtils class methods) ...
  private getReferenceImageBase64(imageFileName: string): string {
    try {
      const docsRoot = path.join(process.cwd(), 'docs');
      if (!fs.existsSync(docsRoot)) return '';
      const stack: string[] = [docsRoot];
      while (stack.length) {
        const dir = stack.pop();
        if (!dir) break;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) stack.push(fullPath);
          else if (entry.isFile() && entry.name === imageFileName) return fs.readFileSync(fullPath).toString('base64');
        }
      }
      return '';
    } catch (err: any) {
      console.warn('⚠️  Failed to load reference image:', err.message);
      return '';
    }
  }

  /**
   * Finds markdown context lines for a given image file, optionally searching only specified files (PR-diff aware).
   * @param imageFileName The image filename to search for (e.g., 'access.png')
   * @param linesBefore Number of lines before the match to include as context
   * @param filePaths Optional array of markdown file paths to restrict the search (PR-diff aware)
   */
  private findMarkdownContextLines(imageFileName: string, linesBefore = 10, filePaths?: string[]): string | null {
    try {
      if (filePaths && filePaths.length > 0) {
        for (const filePath of filePaths) {
          if (!fs.existsSync(filePath)) continue;
          const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(imageFileName)) {
              const collected: string[] = [];
              for (let j = i - 1; j >= 0 && collected.length < linesBefore; j--) {
                const ln = lines[j].trimEnd();
                if (ln.trim() === '') break;
                collected.unshift(ln);
              }
              return collected.join('\n');
            }
          }
        }
        return null;
      }
      const preferredMd = path.join(process.cwd(), 'docs', '6-Image-Viewer', '4_MoreOptionsToolbarMenu.md');
      if (fs.existsSync(preferredMd)) {
        const lines = fs.readFileSync(preferredMd, 'utf-8').split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(imageFileName)) {
            const collected: string[] = [];
            for (let j = i - 1; j >= 0 && collected.length < linesBefore; j--) {
              const ln = lines[j].trimEnd();
              if (ln.trim() === '') break;
              collected.unshift(ln);
            }
            return collected.join('\n');
          }
        }
      }
      const docsRoot = path.join(process.cwd(), 'docs');
      if (!fs.existsSync(docsRoot)) return null;
      const stack: string[] = [docsRoot];
      while (stack.length) {
        const dir = stack.pop();
        if (!dir) break;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) stack.push(fullPath);
          else if (entry.isFile() && entry.name.endsWith('.md')) {
            const content = fs.readFileSync(fullPath, 'utf-8').split('\n');
            for (let i = 0; i < content.length; i++) {
              if (content[i].includes(imageFileName)) {
                const collected: string[] = [];
                for (let j = i - 1; j >= 0 && collected.length < linesBefore; j--) {
                  const ln = content[j].trimEnd();
                  if (ln.trim() === '') break;
                  collected.unshift(ln);
                }
                return collected.join('\n');
              }
            }
          }
        }
      }
      return null;
    } catch (err) {
      console.warn('⚠️  Failed to scan docs for markdown context:', (err as Error).message);
      return null;
    }
  }

  private applyTimeoutAndClean(code: string): string {
    let processedCode = code;
    processedCode = processedCode.replace(
      /(\.screenshot\(\s*)(\{)?(\s*[^}]*?\s*)(\})?(\s*\))/g,
      (match, prefix, openBrace, inside, closeBrace, suffix) => {
        let options = inside ? inside.trim() : '';
        if (options.includes('timeout:')) return match;
        if (openBrace && closeBrace) {
          return `${prefix}{ timeout: 180000, ${options.length > 0 ? options + (options.endsWith(',') ? '' : ',') : ''} }${suffix}`;
        } else if (openBrace || closeBrace) {
            console.warn("⚠️ Malformed screenshot options, timeout not injected:", match);
            return match;
        } else {
          return `${prefix}{ timeout: 180000 }${suffix}`;
        }
      }
    );
    processedCode = processedCode.replace(/\bawait\s+await\s+/g, 'await ');
    processedCode = processedCode.replace(/^await([a-zA-Z\(])/, 'await $1'); 
    const trimmedCode = processedCode.trim();
    if (trimmedCode.split('\n').length === 1 && !trimmedCode.endsWith(';') && !trimmedCode.endsWith('}')) {
        processedCode = `${trimmedCode};`;
    }
    if (code.includes('.screenshot')) {
        console.log('⚙️ Final code after timeout/cleaning:\n', processedCode);
        console.log("✅ Screenshot command processing complete!");
    }
    return processedCode;
  }

  /**
   * Extracts a natural language command from the Playwright screenshot code.
   */
  private extractScreenshotContext(code: string): string {
    const screenshotMatch = code.match(/await\s+page\.screenshot\([^)]*\);/i);
    if (screenshotMatch) {
      return `Screenshot command: ${screenshotMatch[0]}`;
    }
    const locatorScreenshotMatch = code.match(/await\s+\S+\.screenshot\([^)]*\);/i);
    if (locatorScreenshotMatch) {
        return `Screenshot command: ${locatorScreenshotMatch[0]}`;
    }
    return "Screenshot command detected in code";
  }

  /**
   * Executes Playwright code with stabilization, interception, and retries.
   */
  async executeWithScreenshotInterception(
    code: string, 
    isInternalRetry: boolean = false, 
    logger?: any, 
    stepNumber?: number, 
    thinking?: string
  ): Promise<void> {
    let currentCodeToExecute = code;
    try {
      if (!isInternalRetry) {
        await this.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {
            console.warn("⚠️ Page did not reach networkidle state within timeout.");
        });
        await this.page.waitForTimeout(500);
        currentCodeToExecute = await this.interceptScreenshotCommand(code, false, undefined, thinking);
      }
      
      console.log('🚀 Executing code:\n', currentCodeToExecute);
      if (thinking) {
        console.log('🧠 LLM thinking:', thinking);
      }
      
      const runSnippet = async (snippet: string) => {
        const fn = new Function("page", `return (async (page) => { ${snippet} })(page);`);
        await fn(this.page);
      };

      const hasScreenshotCmd = /\.screenshot\(/i.test(currentCodeToExecute);
      const MAX_RETRIES = hasScreenshotCmd ? 1 : 1;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`🔄 Executing attempt ${attempt}/${MAX_RETRIES} ...`);
          await runSnippet(currentCodeToExecute);
          console.log('✅ Snippet executed successfully');
          return; 
        } catch (err: any) {
          const msg = err?.message || '';
          const isRetryableError = err?.name === 'TimeoutError' || /timeout|waiting for selector|No node found|strict mode violation/i.test(msg);
          console.warn(`⚠️  Attempt ${attempt} failed: ${msg.split('\n')[0]}`);

          if (attempt === MAX_RETRIES || !isRetryableError) {
            if (msg.includes('strict mode violation') && !isInternalRetry) {
              console.log("🎢 Strict mode violation on final retry, will attempt specific fixes.");
            }
            throw err;
          }
          console.log('⏳ Waiting 1s before retry...');
          await this.page.waitForTimeout(1000);
        }
      }
    } catch (error: any) {
      if (error.message && error.message.includes('strict mode violation') && !isInternalRetry) {
        console.log('SMV: Strict mode violation detected for original step code.');

        let codeForFirstFix = code;
        let modifiedByFirst = false;
        const locatorPattern = /(page\.locator\((?:[^()'""]+|"[^"]*"|'[^']*')+\))(?!\.first\(\))(?=\.(?:screenshot|click|fill|hover|check|uncheck|selectOption|focus|blur|dblclick|press|type|setInputFiles|dispatchEvent|evaluate|evaluateHandle|scrollIntoViewIfNeeded|selectText|tap|waitFor))/g;
        codeForFirstFix = codeForFirstFix.replace(locatorPattern, (match, p1) => { modifiedByFirst = true; console.log(`SMV: Appending .first() to locator: ${p1}`); return `${p1}.first()`; });
        
        const getByPattern = /(page\.(getBy(?:Role|Text|Label|Placeholder|AltText|Title|TestId)\((?:[^()'""]+|"[^"]*"|'[^']*')+\)))(?!\.first\(\))(?=\.(?:screenshot|click|fill|hover|check|uncheck|selectOption|focus|blur|dblclick|press|type|setInputFiles|dispatchEvent|evaluate|evaluateHandle|scrollIntoViewIfNeeded|selectText|tap|waitFor))/g;
        codeForFirstFix = codeForFirstFix.replace(getByPattern, (match, p1) => { modifiedByFirst = true; console.log(`SMV: Appending .first() to getBy: ${p1}`); return `${p1}.first()`; });
        
        if (modifiedByFirst) {
          console.log('SMV: Attempting retry with .first() appended code:\n', codeForFirstFix);
          try {
            const firstAttemptProcessedCode = await this.interceptScreenshotCommand(codeForFirstFix, true, undefined, thinking);
            await this.executeWithScreenshotInterception(firstAttemptProcessedCode, true, logger, stepNumber, thinking); 
            console.log('✅ SMV: Strict mode violation resolved with .first().');
            return;
          } catch (firstFixError: any) {
            console.warn('⚠️ SMV: Retry with .first() also failed:', firstFixError.message.split('\n')[0]);
            error = firstFixError; 
          }
        } else {
          console.warn("SMV: .first() fix did not alter the code. Proceeding to AI refinement.");
        }

        console.log('🆘 SMV: .first() fix failed or not applicable – requesting AI to refine the locator...');
        
        const failingCommandMatch = (currentCodeToExecute || code).match(/(\bawait\s+)?(page\.screenshot\s*\(.*?\)|[^;]+\.screenshot\s*\(.*?\));?/i);
        const failingCommandForContext = failingCommandMatch ? failingCommandMatch[0] : (currentCodeToExecute || code);

        const errorMessage = error.message.split('\nCall log:')[0].trim();
        const elementDetailsMatch = error.message.match(/resolved to \d+ elements:\s*([\s\S]*?)Call log:/);
        const conflictingElementsHTML = elementDetailsMatch ? elementDetailsMatch[1].trim() : "Conflict details not extracted from error message.";

        const refinementContext: RefinementContext = {
          failingLocator: failingCommandForContext, 
          errorMessage: errorMessage,
          conflictingElementsHTML: conflictingElementsHTML
        };
        
        const aiRefinedCode = await this.interceptScreenshotCommand(code, true, refinementContext, thinking);

        if (aiRefinedCode !== code && aiRefinedCode !== currentCodeToExecute && aiRefinedCode.includes('.screenshot')) { 
          console.log('SMV: Re-executing with AI-refined code after strict mode failure:\n', aiRefinedCode);
          await this.executeWithScreenshotInterception(aiRefinedCode, true, logger, stepNumber, thinking); 
          console.log('✅ SMV: Strict mode violation potentially resolved by AI refinement.');
        } else {
          console.warn('SMV: AI did not provide a new refined code or refinement failed. Rethrowing error.');
          throw error; 
        }
      } else {
        console.error(`❌ Error executing step (isInternalRetry: ${isInternalRetry}). Final error:`, error.message.split('\n')[0]);
        throw error;
      }
    }
  }
}

/**
 * Generates a prompt for replacing a screenshot due to a UI element change.
 * UPDATED: Removed identifiableElements from arguments and prompt structure.
 */
export function getPromptForUIChange({
  imgFileName,
  visibleElements,
  richHTMLContext,
  markdownContext = '',
}: {
  imgFileName: string;
  visibleElements: any;
  richHTMLContext: any;
  markdownContext?: string;
}): string {
  // --- START OF SYSTEM PROMPT CLARITY IMPROVEMENTS (for specific scenarios) ---
  return `You are an expert Playwright automation engineer. Your primary goal is to generate highly accurate and robust Playwright 'locator.screenshot()' commands.
A UI element has changed (selector, appearance, or structure), and the existing screenshot is now outdated.

Your instructions are as follows:
1.  **Understand the Target:** Carefully analyze the 'Reference screenshot' to visually identify the exact UI element or section to be captured.
2.  **Utilize Provided DOM Context:**
    *   **'VISIBLE_INTERACTIVE_ELEMENTS'**: This list contains key interactive elements (buttons, inputs, links, etc.) and significant logical grouping containers (like cards, sections, or wrappers) that are currently visible on the page. Use this for high-level identification and potential direct selectors.
    *   **'RICH_HTML_CONTEXT_WITH_INDEXED_ELEMENTS'**: This provides a more detailed, structural view of the relevant visible elements, including their positions, full HTML snippets, and parent relationships. Use this for precise identification, understanding element nesting, and resolving ambiguities.
    *   **Removed for Efficiency**: Note that 'IDENTIFIABLE_PAGE_ELEMENTS_FOR_CONTEXT' has been removed to reduce prompt length and focus on the most relevant data.
3.  **Prioritize Robust Selectors:**
    *   Favor selectors that are resilient to minor UI changes and language localization.
    *   Prefer built-in Playwright locators: \`page.getByRole()\`, \`page.getByText()\`, \`page.getByLabel()\`, \`page.getByPlaceholder()\`, \`page.getByAltText()\`, \`page.getByTitle()\`, \`page.getByTestId()\`.
    *   When a specific UI *section* (a logical grouping of elements) is targeted in the reference image, use Playwright's \`locator().filter()\` or CSS \`:has()\` pseudo-class (e.g., \`page.locator('div:has(button:has-text("Button1")):has(button:has-text("Button2"))')\`) to select the appropriate parent container.
    *   Only use complex CSS selectors or XPath as a last resort.
4.  **Screenshot Scope:**
    *   The generated command MUST capture the *entire* UI element or logical section as depicted in the reference screenshot.
    *   This includes any expanded parts (like open dropdowns or menus) *if they are shown as such in the reference image*.
    *   The screenshot should provide sufficient surrounding context for clarity, but it should NOT capture the entire page unless the entire page is the specific, relevant context.
5.  **Command Requirements:**
    *   Generate ONLY the Playwright JavaScript code for the 'locator.screenshot()' command.
    *   The command MUST include a 'path' option, using the specified filename (e.g., \`path: 'img/your_filename.png'\`).
    *   Assume the UI is already in the exact state shown in the reference image.
6.  **LLM Thinking Context:**
    *   If a LLM THINKING CONTEXT is provided (though not explicitly in this specific getPromptForUIChange call, it's a general instruction), use it to understand the specific intention and purpose of this screenshot.

Output ONLY the Playwright JavaScript code for the 'locator.screenshot()' command.

<<VISIBLE_INTERACTIVE_ELEMENTS>>
${JSON.stringify(visibleElements, null, 2)}
<<END_VISIBLE_INTERACTIVE_ELEMENTS>>

<<RICH_HTML_CONTEXT_WITH_INDEXED_ELEMENTS>>
${JSON.stringify(richHTMLContext, null, 2)}
<<END_RICH_HTML_CONTEXT_WITH_INDEXED_ELEMENTS>>
${markdownContext ? `\n<<NEARBY_DOC_LINES>>\n${markdownContext}\n<<END_NEARBY_DOC_LINES>>` : ''}`;
}

/**
 * Generates a prompt for filling a screenshot placeholder for a new document or feature.
 * UPDATED: Removed identifiableElements from arguments and prompt structure.
 */
export function getPromptForNewFeature({
  imgFileName,
  visibleElements,
  richHTMLContext,
  markdownContext = '',
}: {
  imgFileName: string;
  visibleElements: any;
  richHTMLContext: any;
  markdownContext?: string;
}): string {
  // --- START OF SYSTEM PROMPT CLARITY IMPROVEMENTS (for specific scenarios) ---
  return `You are an expert Playwright automation engineer. Your primary goal is to generate highly accurate and robust Playwright 'locator.screenshot()' commands.
A new document section or feature has been added, and there is a placeholder for a screenshot that needs to be filled.

Your instructions are as follows:
1.  **Understand the Target:** Carefully analyze the 'Reference screenshot' to visually identify the exact UI element or section to be captured.
2.  **Utilize Provided DOM Context:**
    *   **'VISIBLE_INTERACTIVE_ELEMENTS'**: This list contains key interactive elements (buttons, inputs, links, etc.) and significant logical grouping containers (like cards, sections, or wrappers) that are currently visible on the page. Use this for high-level identification and potential direct selectors.
    *   **'RICH_HTML_CONTEXT_WITH_INDEXED_ELEMENTS'**: This provides a more detailed, structural view of the relevant visible elements, including their positions, full HTML snippets, and parent relationships. Use this for precise identification, understanding element nesting, and resolving ambiguities.
    *   **Removed for Efficiency**: Note that 'IDENTIFIABLE_PAGE_ELEMENTS_FOR_CONTEXT' has been removed to reduce prompt length and focus on the most relevant data.
3.  **Prioritize Robust Selectors:**
    *   Favor selectors that are resilient to minor UI changes and language localization.
    *   Prefer built-in Playwright locators: \`page.getByRole()\`, \`page.getByText()\`, \`page.getByLabel()\`, \`page.getByPlaceholder()\`, \`page.getByAltText()\`, \`page.getByTitle()\`, \`page.getByTestId()\`.
    *   When a specific UI *section* (a logical grouping of elements) is targeted in the reference image, use Playwright's \`locator().filter()\` or CSS \`:has()\` pseudo-class (e.g., \`page.locator('div:has(button:has-text("Button1")):has(button:has-text("Button2"))')\`) to select the appropriate parent container.
    *   Only use complex CSS selectors or XPath as a last resort.
4.  **Screenshot Scope:**
    *   The generated command MUST capture the *entire* UI element or logical section as depicted in the reference screenshot.
    *   This includes any expanded parts (like open dropdowns or menus) *if they are shown as such in the reference image*.
    *   The screenshot should provide sufficient surrounding context for clarity, but it should NOT capture the entire page unless the entire page is the specific, relevant context.
5.  **Command Requirements:**
    *   Generate ONLY the Playwright JavaScript code for the 'locator.screenshot()' command.
    *   The command MUST include a 'path' option, using the specified filename (e.g., \`path: 'img/your_filename.png'\`).
    *   Assume the UI is already in the exact state shown in the reference image.
6.  **LLM Thinking Context:**
    *   If a LLM THINKING CONTEXT is provided (though not explicitly in this specific getPromptForNewFeature call, it's a general instruction), use it to understand the specific intention and purpose of this screenshot.

Output ONLY the Playwright JavaScript code for the 'locator.screenshot()' command.

<<VISIBLE_INTERACTIVE_ELEMENTS>>
${JSON.stringify(visibleElements, null, 2)}
<<END_VISIBLE_INTERACTIVE_ELEMENTS>>

<<RICH_HTML_CONTEXT_WITH_INDEXED_ELEMENTS>>
${JSON.stringify(richHTMLContext, null, 2)}
<<END_RICH_HTML_CONTEXT_WITH_INDEXED_ELEMENTS>>
${markdownContext ? `\n<<NEARBY_DOC_LINES>>\n${markdownContext}\n<<END_NEARBY_DOC_LINES>>` : ''}`;
}

export type ScenarioType = 'ui_change' | 'new_feature' | 'default';

export function getPromptByScenario({
  scenarioType,
  imgFileName,
  visibleElements,
  identifiableElements, // Keep for signature, but argument for prompt is removed
  richHTMLContext,
  markdownContext = '',
  defaultPromptFn
}: {
  scenarioType: ScenarioType;
  imgFileName: string;
  visibleElements: any;
  identifiableElements: any;
  richHTMLContext: any;
  markdownContext?: string;
  defaultPromptFn: () => string;
}): string {
  switch (scenarioType) {
    case 'ui_change':
      return getPromptForUIChange({
        imgFileName,
        visibleElements,
        richHTMLContext,
        markdownContext
      });
    case 'new_feature':
      return getPromptForNewFeature({
        imgFileName,
        visibleElements,
        richHTMLContext,
        markdownContext
      });
    case 'default':
    default:
      // The defaultPromptFn itself should ideally generate the new, clearer system prompt structure.
      // For a clean implementation, generatePlaywrightScreenshotFunction's internal prompt is the source of truth.
      // The getPromptByScenario is mostly for external interfaces.
      return defaultPromptFn(); // This will call the main generatePlaywrightScreenshotFunction's prompt logic.
  }
}

/**
 * Get mode-specific description for better UX
 */
export function getModeDescription(scenarioType: ScenarioType): string {
  const descriptions = {
    'ui_change': 'UI Change Mode - Replace existing screenshots due to UI changes',
    'new_feature': 'New Feature Mode - Take screenshots for new features/placeholders',
    'default': 'Default Mode - Standard translation mode with both English and Spanish docs'
  };
  return descriptions[scenarioType] || descriptions['default'];
}

/**
 * Validate if a scenario type is supported
 */
export function isValidScenarioType(scenarioType: string): scenarioType is ScenarioType {
  return ['ui_change', 'new_feature', 'default'].includes(scenarioType);
}