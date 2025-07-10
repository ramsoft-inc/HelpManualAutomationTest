import { Page } from "@playwright/test";
import fs from "fs";
import path from "path";
import axios from "axios";

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
        } : undefined;
        const hasParentIdentifier = parentData && (Object.values(parentData).some(val => val !== undefined && val !== ''));


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
          text: el.textContent?.trim()?.substring(0, 70) || undefined, // Increased text length
          parent: hasParentIdentifier ? parentData : undefined
        };

        if (el.tagName.toLowerCase() === 'input') {
          data.placeholder = (el as HTMLInputElement).placeholder || undefined;
          data.value = (el as HTMLInputElement).value?.substring(0, 50) || undefined;
          data.type = (el as HTMLInputElement).type || undefined;
        }
        if (el.tagName.toLowerCase() === 'a') {
          data.href = (el as HTMLAnchorElement).href || undefined;
        }

        // Basic menu item extraction
        if (el.getAttribute('role') === 'menu') {
          const items = Array.from(el.querySelectorAll(':scope > li[role="menuitem"], :scope > div[role="menuitem"]')) // Direct children
                             .map(item => item.textContent?.trim().substring(0, 40)) // Shorter text for menu items
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
        'a[href]', '[data-cy]', '[data-testid]', '[toolname]', '[aria-label]', '[title]'
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
        attrs.placeholder || attrs.href || attrs.menuItems ||
        attrs.parent // Keep if parent has an identifier
      );
      return elements;
    });
  }

  /**
   * Enhanced function to extract a broader set of identifiable elements.
   */
  private async getIdentifiableElements(maxElements = 500): Promise<Array<any>> {
    return await this.page.evaluate((limit) => {
      const results: any[] = [];
      const all = Array.from(document.querySelectorAll('*')) as HTMLElement[];

      function getElementData(el: HTMLElement): any {
          const data: any = {
            tag: el.tagName.toLowerCase(),
            id: el.id || undefined,
            class: (el.className && typeof el.className === 'string') ? (el.className as string).trim().substring(0, 100) : undefined,
            'data-testid': el.getAttribute('data-testid') || undefined,
            'data-cy': el.getAttribute('data-cy') || undefined,
            role: el.getAttribute('role') || undefined,
            'aria-label': el.getAttribute('aria-label') || undefined,
            'aria-labelledby': el.getAttribute('aria-labelledby') || undefined,
            'aria-describedby': el.getAttribute('aria-describedby') || undefined,
            title: el.getAttribute('title') || undefined,
            name: el.getAttribute('name') || undefined,
            toolname: el.getAttribute('toolname') || undefined,
            text: el.textContent?.trim()?.substring(0, 40) || undefined, // Slightly shorter for general elements
          };
          if (el.tagName.toLowerCase() === 'input') {
            data.placeholder = (el as HTMLInputElement).placeholder || undefined;
            data.value = (el as HTMLInputElement).value?.substring(0, 30) || undefined;
            data.type = (el as HTMLInputElement).type || undefined;
          }
          if (el.tagName.toLowerCase() === 'a') {
            data.href = (el as HTMLAnchorElement).href || undefined;
          }

          // Basic menu item extraction
          if (el.getAttribute('role') === 'menu') {
            const items = Array.from(el.querySelectorAll(':scope > li[role="menuitem"], :scope > div[role="menuitem"]')) // Direct children
                               .map(item => item.textContent?.trim().substring(0, 30))
                               .filter(text => text && text.length > 0);
            if (items.length > 0) {
              data.menuItems = items;
            }
          }
          return data;
      }
      
      for (const el of all) {
        if (results.length >= limit) break;
        const data = getElementData(el);
        // Filter: include if it has any significant identifying attribute
        if (data.id || data['data-testid'] || data['data-cy'] || data.role || 
            data['aria-label'] || data.title || data.name || data.toolname ||
            (data.class && data.class.length > 0 && !/^\s*$/.test(data.class)) || // Non-empty class
            (data.text && data.text.length > 0) || 
            data.placeholder || data.href || data.menuItems
        ) {
          // Remove undefined properties for cleaner JSON
          Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
          if (Object.keys(data).length > 1 || (Object.keys(data).length === 1 && data.tag)) { // Ensure it's not just a tag
            results.push(data);
          }
        }
      }
      return results;
    }, maxElements);
  }

  /**
   * Enhanced HTML parser that provides rich context with indexed elements and full HTML structure.
   * This approach is inspired by the tracewright project's element highlighting and indexing system.
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

      function isTopElement(element: Element): boolean {
        const rect = element.getBoundingClientRect();
        const elementX = rect.left + rect.width / 2;
        const elementY = rect.top + rect.height / 2;
        const topElement = document.elementFromPoint(elementX, elementY);
        return !topElement ? false : topElement === element;
      }

      function containsChildOnTop(element: Element): boolean {
        const children = element.children;
        if (element.children.length === 0) return isTopElement(element);
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          const isTopElement = containsChildOnTop(child);
          if (isTopElement) return true;
        }
        return false;
      }

      function isInteractiveElement(element: HTMLElement): boolean {
        const tag = element.tagName.toLowerCase();
        const role = element.getAttribute('role');
        const style = window.getComputedStyle(element);
        
        // Check for interactive tags
        if (['button', 'input', 'select', 'textarea', 'a'].includes(tag)) return true;
        
        // Check for interactive roles
        if (['button', 'link', 'menuitem', 'tab', 'checkbox', 'radio', 'option', 'combobox', 'slider', 'spinbutton', 'switch'].includes(role || '')) return true;
        
        // Check for clickable styling
        if (style.cursor === 'pointer' && tag !== 'input') return true;
        
        // Check for data attributes that indicate interactivity
        if (element.getAttribute('data-testid') || element.getAttribute('data-cy') || element.getAttribute('toolname')) return true;
        
        return false;
      }

      function getElementContext(element: HTMLElement, index: number): any {
        const rect = element.getBoundingClientRect();
        const data: any = {
          index: index,
          tag: element.tagName.toLowerCase(),
          id: element.id || undefined,
          class: (element.className && typeof element.className === 'string') ? (element.className as string).trim().substring(0, 150) : undefined,
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
          isTopElement: isTopElement(element),
          isInteractive: isInteractiveElement(element),
          outerHTML: element.outerHTML.substring(0, 500) // Truncated for token efficiency
        };

        // Add input-specific attributes
        if (element.tagName.toLowerCase() === 'input') {
          data.placeholder = (element as HTMLInputElement).placeholder || undefined;
          data.value = (element as HTMLInputElement).value?.substring(0, 50) || undefined;
          data.type = (element as HTMLInputElement).type || undefined;
        }
        
        // Add link-specific attributes
        if (element.tagName.toLowerCase() === 'a') {
          data.href = (element as HTMLAnchorElement).href || undefined;
        }

        // Enhanced menu item extraction
        if (element.getAttribute('role') === 'menu') {
          const items = Array.from(element.querySelectorAll(':scope > li[role="menuitem"], :scope > div[role="menuitem"], :scope > [role="menuitem"]'))
                             .map(item => ({
                               text: item.textContent?.trim().substring(0, 50) || '',
                               id: item.id || undefined,
                               'data-testid': item.getAttribute('data-testid') || undefined,
                               class: (item.className && typeof item.className === 'string') ? (item.className as string).trim().substring(0, 100) : undefined
                             }))
                             .filter(item => item.text.length > 0);
          if (items.length > 0) {
            data.menuItems = items;
          }
        }

        // Get parent context for better element identification
        const parent = element.parentElement;
        if (parent && parent !== document.body) {
          const parentData: any = {
            tag: parent.tagName.toLowerCase(),
            id: parent.id || undefined,
            'data-testid': parent.getAttribute('data-testid') || undefined,
            'data-cy': parent.getAttribute('data-cy') || undefined,
            role: parent.getAttribute('role') || undefined,
            class: (parent.className && typeof parent.className === 'string') ? (parent.className as string).trim().substring(0, 100) : undefined
          };
          // Only include parent if it has meaningful identifiers
          const hasParentIdentifier = Object.values(parentData).some(val => val !== undefined && val !== '');
          if (hasParentIdentifier) {
            data.parent = parentData;
          }
        }

        return data;
      }

      // Get all interactive and identifiable elements
      const interactiveSelectors = [
        'button', 'input:not([type="hidden"])', 'select', 'textarea', 
        '[role="button"]', '[role="link"]', '[role="menuitem"]', '[role="tab"]', 
        '[role="checkbox"]', '[role="radio"]', '[role="option"]', '[role="combobox"]', 
        '[role="slider"]', '[role="spinbutton"]', '[role="switch"]', 
        '[contenteditable="true"]', 'a[href]', '[data-cy]', '[data-testid]', 
        '[toolname]', '[aria-label]', '[title]', 'div[class*="menu"]', 
        'div[class*="dropdown"]', 'div[class*="popup"]'
      ].join(', ');

      const elements = Array.from(document.querySelectorAll(interactiveSelectors) as NodeListOf<HTMLElement>);
      
      for (const element of elements) {
        if (results.length >= limit) break;
        
        // Only include visible elements that are on top or have meaningful content
        if (isVisible(element) && (containsChildOnTop(element) || isInteractiveElement(element))) {
          const elementData = getElementContext(element, elementIndex);
          
          // Filter out elements that don't have enough identifying information
          if (elementData.id || elementData['data-testid'] || elementData['data-cy'] || 
              elementData.role || elementData['aria-label'] || elementData.title || 
              elementData.name || elementData.toolname || elementData.menuItems ||
              (elementData.text && elementData.text.length > 0) || 
              elementData.placeholder || elementData.href || elementData.parent) {
            
            // Remove undefined properties for cleaner JSON
            Object.keys(elementData).forEach(key => {
              if (elementData[key] === undefined) delete elementData[key];
            });
            
            results.push(elementData);
            elementIndex++;
          }
        }
      }

      return results;
    }, maxElements);
  }

  // ... getReferenceImageBase64, generatePlaywrightScreenshotFunction, loadReferenceImages,
  //     interceptScreenshotCommand, applyTimeoutAndClean, extractScreenshotContext,
  //     executeWithScreenshotInterception, findMarkdownContextLines
  //     remain the same as in the previously provided "complete" version.
  //     Make sure to copy them from that version to make this file truly complete.

  /**
   * Generates Playwright screenshot code using an AI model.
   */
  async generatePlaywrightScreenshotFunction(
    base64Screenshot: string,
    codeContext: string, // Original user code or failing AI code
    imgFileName: string | null,
    refinementContext?: RefinementContext
  ): Promise<string> {
    try {
      // Check if required environment variables are set
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
      const apiKey = process.env.AZURE_OPENAI_API_KEY;
      
      if (!endpoint || !apiKey) {
        console.warn('⚠️  AI screenshot generation skipped – missing AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_API_KEY environment variables');
        return codeContext;
      }

      const visibleElements = await this.getVisibleInteractiveElements(); // Uses new parsing
      const identifiableElements = await this.getIdentifiableElements(); // Uses new parsing
      const richHTMLContext = await this.getRichHTMLContext(); // Enhanced HTML parsing with indexed elements

      let markdownContext = '';
      const imgMatchInCodeContext = codeContext.match(/["']([^"']+\.(?:png|jpg|jpeg|gif|bmp|webp))["']/i);
      if (imgMatchInCodeContext?.[1]) {
        const imgFileForMarkdownSearch = path.basename(imgMatchInCodeContext[1]);
        const ctx = this.findMarkdownContextLines(imgFileForMarkdownSearch);
        if (ctx) markdownContext = ctx;
      }

      const targetImgFilenameOrDefault = imgFileName || 'derived-screenshot.png';
      let targetImageFilenameInstruction = `\nThe output screenshot file MUST be named '${targetImgFilenameOrDefault}'. Include this in the 'path' option of the screenshot command.`;
      
      let userPromptIntro = `The goal is to generate a Playwright screenshot command for the specific UI element shown in the 'Reference screenshot' (which will be provided as image data if available).`;

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
`;
      }

      const userTextPrompt = `${userPromptIntro}
${targetImageFilenameInstruction}
    
Use the following DOM information to identify the target element and its selector:
<<VISIBLE_INTERACTIVE_ELEMENTS>>
${JSON.stringify(visibleElements, null, 2)}
<<END_VISIBLE_INTERACTIVE_ELEMENTS>>

<<IDENTIFIABLE_PAGE_ELEMENTS_FOR_CONTEXT>>
${JSON.stringify(identifiableElements, null, 2)}
<<END_IDENTIFIABLE_PAGE_ELEMENTS_FOR_CONTEXT>>

<<RICH_HTML_CONTEXT_WITH_INDEXED_ELEMENTS>>
${JSON.stringify(richHTMLContext, null, 2)}
<<END_RICH_HTML_CONTEXT_WITH_INDEXED_ELEMENTS>>
${markdownContext ? `\n<<NEARBY_DOC_LINES>>\n${markdownContext}\n<<END_NEARBY_DOC_LINES>>` : ''}`;

      const systemPrompt = `You are an expert Playwright automation engineer.
Your goal is to generate a single Playwright 'locator.screenshot()' command.

You will be given:
1.  Possibly a reference screenshot (English locale, provided as image data) showing a specific UI element.
2.  DOM context: 'VISIBLE_INTERACTIVE_ELEMENTS' and 'IDENTIFIABLE_PAGE_ELEMENTS_FOR_CONTEXT'. These now include more attributes and potentially 'menuItems' for elements with role='menu'.
3.  'RICH_HTML_CONTEXT_WITH_INDEXED_ELEMENTS' - Enhanced DOM analysis with indexed elements, position data, visibility status, and full HTML structure for better element identification.
4.  Optional: 'NEARBY_DOC_LINES'.
5.  An instruction for the output screenshot filename.
6.  ${refinementContext ? "Context about a previous failing locator and the conflict it caused." : "Standard generation task."}

Your task is to:
1.  Analyze all provided information, especially the reference screenshot and the DOM context (including 'menuItems' if the target is a menu).
2.  ${refinementContext ? "REFINE the locator to be more specific and avoid the previously reported conflict." : "Identify the most accurate and robust Playwright selector (e.g., page.locator('...'), page.getByRole(...), etc.) for the element in the reference image."}
    The selector must be resilient to language changes. Prioritize 'data-testid', 'data-cy', 'id', 'role' combined with 'aria-label' or 'name', 'title', or unique combinations of classes and text.
    If multiple elements visually match (e.g., multiple menus), use distinguishing features from the DOM lists like 'menuItems' or text content specific to the element in the REFERENCE IMAGE. For example, the target menu might have class 'MuiMenu-list' and its 'menuItems' array would contain 'Burn Study', while another might have different classes or menu items.
    Use the 'RICH_HTML_CONTEXT_WITH_INDEXED_ELEMENTS' to understand element positioning, visibility, and HTML structure for more precise selection.
3.  Generate the 'locator.screenshot()' command. It must capture the *entire* UI element as depicted in the reference screenshot, including expanded parts *if shown as such in the reference image*.
4.  The command MUST include a 'path' option with the specified filename add it to a folder called 'img'.
5.  Assume the UI is already in the state shown in the reference image.
6.  Know that the expected screenshot is never just a single element we want to show the surrounding context. does'nt mean the whole page but if it is targeted towards a element in a dropdown then u take the screenshot of the whole dropdown.
Output ONLY the Playwright JavaScript code for the 'locator.screenshot()' command.
`;


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

      if (process.env.VERBOSE_LLM === 'true') {
        console.log(`🔗 Azure OpenAI request -> ${endpoint}`);
        console.log(`   prompt tokens approx (user text prompt only): ${userTextPrompt.split(/\s+/).length}`);
      }
      
      const response = await axios.post(endpoint, requestPayload, {
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey, 
        },
      });

      if (process.env.VERBOSE_LLM === 'true') console.log(`✅ Azure response status: ${response.status}`);

      const aiContent: string = response.data.choices?.[0]?.message?.content || '';
      const cleaned = aiContent.replace(/^```[a-zA-Z]*\s*/g, '').replace(/```\s*$/g, '').trim();
      
      if (cleaned && !cleaned.endsWith(';') && !cleaned.endsWith('}')) return `${cleaned};`;
      return cleaned || codeContext;

    } catch (error: any) {
      const shortMsg = error?.message || 'unknown error';
      if (error?.response?.data) console.warn('🔍 Azure error body:', JSON.stringify(error.response.data));
      console.warn(`⚠️  AI screenshot generation failed (${shortMsg}); falling back to original/previous code`);
      return codeContext;
    }
  }

  /**
   * Loads reference images from the reference images directory
   */
  private async loadReferenceImages(): Promise<string[]> {
    try {
      if (!fs.existsSync(this.referenceImagesDir)) {
        return [];
      }
      const files = fs.readdirSync(this.referenceImagesDir);
      return files.filter(file =>
        /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(file)
      );
    } catch (error: any) {
      console.error("❌ Error loading reference images:", error.message);
      return [];
    }
  }

  /**
   * Intercepts screenshot commands.
   */
  async interceptScreenshotCommand(
    originalCodeBlock: string, 
    isRefinementCycle: boolean = false, 
    refinementContext?: RefinementContext
  ): Promise<string> {
    const screenshotCommandRegex = /(\bawait\s+)?(page\.screenshot\s*\(.*?\)|[^;]+\.screenshot\s*\(.*?\));?/i;
    const match = originalCodeBlock.match(screenshotCommandRegex);

    if (!match) return originalCodeBlock;

    const originalScreenshotCommand = match[0];
    console.log(isRefinementCycle ? "🎯 Refining screenshot command..." : "🎯 Screenshot command detected! Intercepting...");
    if(process.env.VERBOSE_LLM === 'true' || isRefinementCycle) {
        console.log("   Original screenshot command being processed:", originalScreenshotCommand);
    }

    try {
      let imgFileName: string | null = null;
      const pathMatch = originalScreenshotCommand.match(/path\s*:\s*['"]([^'\"]+\.(?:png|jpg|jpeg|gif|bmp|webp))['"]/i);
      if (pathMatch?.[1]) {
        imgFileName = path.basename(decodeURIComponent(pathMatch[1]));
      } else {
        const argMatch = originalScreenshotCommand.match(/(?:page\.screenshot|\.screenshot)\(\s*['"]([^'\"]+\.(?:png|jpg|jpeg|gif|bmp|webp))['"]/i);
        if (argMatch?.[1]) imgFileName = path.basename(decodeURIComponent(argMatch[1]));
      }

      let base64Screenshot = '';
      if (imgFileName) {
        const imgDir = path.resolve(process.cwd(), 'docs', '6-Image-Viewer', 'img');
        const candidatePath = path.join(imgDir, imgFileName);
        if (fs.existsSync(candidatePath)) {
          base64Screenshot = fs.readFileSync(candidatePath).toString('base64');
        } else {
          base64Screenshot = this.getReferenceImageBase64(imgFileName);
          if (!base64Screenshot) console.warn(`⚠️  Reference image '${imgFileName}' not found.`);
        }
      } else {
        console.warn(`⚠️  Could not extract image filename from: ${originalScreenshotCommand.substring(0, 100)}...`);
      }
      
      const aiGeneratedCommand = await this.generatePlaywrightScreenshotFunction(
        base64Screenshot,
        originalScreenshotCommand, 
        imgFileName,
        refinementContext
      );

      if (aiGeneratedCommand === originalScreenshotCommand || !aiGeneratedCommand.includes('.screenshot')) {
        console.log(isRefinementCycle ? "ℹ️ AI did not refine the command or refinement skipped." : "ℹ️ AI did not provide a different command, or generation was skipped.");
        return this.applyTimeoutAndClean(originalCodeBlock);
      }

      console.log(isRefinementCycle ? '✨ AI provided refined screenshot code.' : '🖼️ Enhanced screenshot code generated by AI.');
      
      const finalCodeBlock = originalCodeBlock.replace(originalScreenshotCommand, aiGeneratedCommand);
      return this.applyTimeoutAndClean(finalCodeBlock);

    } catch (error: any) {
      console.warn(`⚠️ Failed to ${isRefinementCycle ? 'refine' : 'enhance'} screenshot command (${error?.message ?? 'unknown'}).`);
      return this.applyTimeoutAndClean(originalCodeBlock);
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
  async executeWithScreenshotInterception(code: string, isInternalRetry: boolean = false): Promise<void> {
    let currentCodeToExecute = code;
    try {
      if (!isInternalRetry) {
        await this.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {
            console.warn("⚠️ Page did not reach networkidle state within timeout.");
        });
        await this.page.waitForTimeout(500);
        currentCodeToExecute = await this.interceptScreenshotCommand(code, false);
      }
      
      console.log('🚀 Executing code:\n', currentCodeToExecute);
      
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
            const firstAttemptProcessedCode = await this.interceptScreenshotCommand(codeForFirstFix, true);
            await this.executeWithScreenshotInterception(firstAttemptProcessedCode, true); 
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
        
        const aiRefinedCode = await this.interceptScreenshotCommand(code, true, refinementContext);

        if (aiRefinedCode !== code && aiRefinedCode !== currentCodeToExecute && aiRefinedCode.includes('.screenshot')) { 
          console.log('SMV: Re-executing with AI-refined code after strict mode failure:\n', aiRefinedCode);
          await this.executeWithScreenshotInterception(aiRefinedCode, true); 
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
   * Finds markdown context lines for a given image file.
   */
  private findMarkdownContextLines(imageFileName: string, linesBefore = 10): string | null {
    try {
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
}

/**
 * Generates a prompt for replacing a screenshot due to a UI element change.
 */

export function getPromptForUIChange({
  imgFileName,
  visibleElements,
  identifiableElements,
  richHTMLContext,
  markdownContext = '',
}: {
  imgFileName: string;
  visibleElements: any;
  identifiableElements: any;
  richHTMLContext: any;
  markdownContext?: string;
}): string {
  return `You are an expert Playwright automation engineer.
A UI element has changed (selector, appearance, or structure), and the existing screenshot is now outdated.

Your goal is to generate a single Playwright 'locator.screenshot()' command that captures the updated UI element as shown in the new reference screenshot.

You will be given:
1.  A reference screenshot (English locale, provided as image data) showing the updated UI element.
2.  DOM context: 'VISIBLE_INTERACTIVE_ELEMENTS' and 'IDENTIFIABLE_PAGE_ELEMENTS_FOR_CONTEXT'.
3.  'RICH_HTML_CONTEXT_WITH_INDEXED_ELEMENTS' - Enhanced DOM analysis with indexed elements, position data, visibility status, and full HTML structure for better element identification.
4.  Optional: 'NEARBY_DOC_LINES'.
5.  An instruction for the output screenshot filename.

Your task is to:
1.  Analyze all provided information, especially the reference screenshot and the DOM context (including 'menuItems' if the target is a menu).
2.  Identify the most accurate and robust Playwright selector (e.g., page.locator('...'), page.getByRole(...), etc.) for the element in the reference image. The selector must be resilient to language changes. Prioritize 'data-testid', 'data-cy', 'id', 'role' combined with 'aria-label' or 'name', 'title', or unique combinations of classes and text.
3.  Use the 'RICH_HTML_CONTEXT_WITH_INDEXED_ELEMENTS' to understand element positioning, visibility, and HTML structure for more precise selection.
4.  Generate the 'locator.screenshot()' command. It must capture the *entire* UI element as depicted in the reference screenshot, including expanded parts *if shown as such in the reference image*.
5.  The command MUST include a 'path' option with the specified filename and add it to a folder called 'img'.
6.  Assume the UI is already in the state shown in the reference image.
7.  The expected screenshot is never just a single element; show the surrounding context as appropriate.
Output ONLY the Playwright JavaScript code for the 'locator.screenshot()' command.

<<VISIBLE_INTERACTIVE_ELEMENTS>>
${JSON.stringify(visibleElements, null, 2)}
<<END_VISIBLE_INTERACTIVE_ELEMENTS>>

<<IDENTIFIABLE_PAGE_ELEMENTS_FOR_CONTEXT>>
${JSON.stringify(identifiableElements, null, 2)}
<<END_IDENTIFIABLE_PAGE_ELEMENTS_FOR_CONTEXT>>

<<RICH_HTML_CONTEXT_WITH_INDEXED_ELEMENTS>>
${JSON.stringify(richHTMLContext, null, 2)}
<<END_RICH_HTML_CONTEXT_WITH_INDEXED_ELEMENTS>>
${markdownContext ? `\n<<NEARBY_DOC_LINES>>\n${markdownContext}\n<<END_NEARBY_DOC_LINES>>` : ''}`;
}

/**
 * Generates a prompt for filling a screenshot placeholder for a new document or feature.
 */
export function getPromptForNewFeature({
  imgFileName,
  visibleElements,
  identifiableElements,
  richHTMLContext,
  markdownContext = '',
}: {
  imgFileName: string;
  visibleElements: any;
  identifiableElements: any;
  richHTMLContext: any;
  markdownContext?: string;
}): string {
  return `You are an expert Playwright automation engineer.
A new document section or feature has been added, and there is a placeholder for a screenshot that needs to be filled.

Your goal is to generate a single Playwright 'locator.screenshot()' command that captures the relevant UI element or feature as shown in the provided reference screenshot.

You will be given:
1.  A reference screenshot (English locale, provided as image data) showing the new UI element or feature.
2.  DOM context: 'VISIBLE_INTERACTIVE_ELEMENTS' and 'IDENTIFIABLE_PAGE_ELEMENTS_FOR_CONTEXT'.
3.  'RICH_HTML_CONTEXT_WITH_INDEXED_ELEMENTS' - Enhanced DOM analysis with indexed elements, position data, visibility status, and full HTML structure for better element identification.
4.  Optional: 'NEARBY_DOC_LINES'.
5.  An instruction for the output screenshot filename.

Your task is to:
1.  Analyze all provided information, especially the reference screenshot and the DOM context (including 'menuItems' if the target is a menu).
2.  Identify the most accurate and robust Playwright selector (e.g., page.locator('...'), page.getByRole(...), etc.) for the element in the reference image. The selector must be resilient to language changes. Prioritize 'data-testid', 'data-cy', 'id', 'role' combined with 'aria-label' or 'name', 'title', or unique combinations of classes and text.
3.  Use the 'RICH_HTML_CONTEXT_WITH_INDEXED_ELEMENTS' to understand element positioning, visibility, and HTML structure for more precise selection.
4.  Generate the 'locator.screenshot()' command. It must capture the *entire* UI element as depicted in the reference screenshot, including expanded parts *if shown as such in the reference image*.
5.  The command MUST include a 'path' option with the specified filename and add it to a folder called 'img'.
6.  Assume the UI is already in the state shown in the reference image.
7.  The expected screenshot is never just a single element; show the surrounding context as appropriate.
Output ONLY the Playwright JavaScript code for the 'locator.screenshot()' command.

<<VISIBLE_INTERACTIVE_ELEMENTS>>
${JSON.stringify(visibleElements, null, 2)}
<<END_VISIBLE_INTERACTIVE_ELEMENTS>>

<<IDENTIFIABLE_PAGE_ELEMENTS_FOR_CONTEXT>>
${JSON.stringify(identifiableElements, null, 2)}
<<END_IDENTIFIABLE_PAGE_ELEMENTS_FOR_CONTEXT>>

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
  identifiableElements,
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
        identifiableElements,
        richHTMLContext,
        markdownContext
      });
    case 'new_feature':
      return getPromptForNewFeature({
        imgFileName,
        visibleElements,
        identifiableElements,
        richHTMLContext,
        markdownContext
      });
    case 'default':
    default:
      return defaultPromptFn();
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