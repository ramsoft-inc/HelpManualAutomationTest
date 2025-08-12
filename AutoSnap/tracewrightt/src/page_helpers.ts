import { Page } from "@playwright/test";
import { AIUtilsEnhanced } from "./ai_utils_enhanced";
import { GenerateCodeResponse } from "./llm_request";

export type ClickableDomResult = {
  visibleElements: string;
  hiddenElements: string;
};

export const getInteractiveHTML = async (page: Page): Promise<ClickableDomResult> => {
  const elementIndex = 1;
  return await getClickableElements(page, elementIndex);
};

/**
 * Set the current markdown file path for image reference
 * This should be called when processing a markdown file
 */
export const setCurrentMarkdownPath = async (page: Page, mdFilePath: string) => {
  console.log('📄 Setting current markdown file path:', mdFilePath);
  
  try {
    // Create AIUtilsEnhanced instance
    const aiUtils = new AIUtilsEnhanced(page);
    
    // Pass the markdown file path to AIUtilsEnhanced
    aiUtils.setCurrentMdFilePath(mdFilePath);
    console.log('✅ Markdown path set successfully for image reference');
    
    return true;
  } catch (error: any) {
    console.error('❌ Failed to set markdown file path:', error.message);
    return false;
  }
};

export const executeCode = async (
  page: Page, 
  codeResponse: GenerateCodeResponse, 
  logger?: any, 
  stepNumber?: number,
  mdFilePath?: string
) => {
  console.log('🚀 Starting code execution...');
  console.log('📍 Page URL:', page.url());
  console.log('📝 Code to execute:', codeResponse.code);
  console.log('🧠 LLM thinking:', codeResponse.thinking);
  
  // Check if we have a screenshot intent from the LLM
  if (codeResponse.screenshotIntent) {
    console.log('📸 Screenshot intent provided by LLM:', codeResponse.screenshotIntent);
  }
  
  console.log('📊 Step number:', stepNumber);
  console.log('📋 Logger available:', !!logger);
  
  try {
    // Create AIUtilsEnhanced instance for screenshot interception
    console.log('🤖 Creating AIUtilsEnhanced instance...');
    const aiUtils = new AIUtilsEnhanced(page);
    
    // If a markdown file path is provided, set it
    if (mdFilePath) {
      console.log('📄 Using markdown path for image reference:', mdFilePath);
      aiUtils.setCurrentMdFilePath(mdFilePath);
    }
    
    console.log('✅ AIUtilsEnhanced instance created successfully');
    
    // Check if the code is a screenshot command to add special handling
    const isScreenshotCommand = /\.screenshot\s*\(/i.test(codeResponse.code);
    if (isScreenshotCommand && codeResponse.screenshotIntent) {
      console.log('🎯 Special handling for screenshot command with intent');
    }
    
    // Use AIUtilsEnhanced to execute code with screenshot interception (pass thinking, markdown path, and screenshot intent)
    console.log('⚡ Executing code with AIUtilsEnhanced...');
    await aiUtils.executeWithEnhancedScreenshotInterception(
      codeResponse.code, 
      false, 
      logger, 
      stepNumber, 
      codeResponse.thinking,
      mdFilePath,
      codeResponse.screenshotIntent
    );
    console.log('✅ Code execution completed successfully');
    
  } catch (error: any) {
    console.error('❌ Code execution failed:', error.message);
    console.error('📍 Error occurred on page:', page.url());
    console.error('📝 Failed code:', codeResponse.code);
    
    // Handle strict mode violations by automatically retrying with .first()
    if (error.message && error.message.includes('strict mode violation')) {
      console.log('🔄 Strict mode violation detected, retrying with .first()...');
      
      // Log the retry attempt
      if (logger && stepNumber) {
        console.log('📋 Logging retry attempt to logger...');
        // logger.logRetryAttempt(stepNumber, codeResponse.code, '', error.message, 1, page.url());
      }
      
      // Automatically add .first() to the locator call
      let modifiedCode = codeResponse.code;
      
      // Pattern to match locator calls without .first()
      const locatorPattern = /(page\.locator\([^)]+\))(?!\.first\(\))(?=\.(click|fill|hover|screenshot))/g;
      modifiedCode = modifiedCode.replace(locatorPattern, '$1.first()');
      
      // Pattern to match getByRole, getByText, etc. calls without .first()
      const getByPattern = /(page\.(getBy\w+\([^)]+\)))(?!\.first\(\))(?=\.(click|fill|hover|screenshot))/g;
      modifiedCode = modifiedCode.replace(getByPattern, '$1.first()');
      
      console.log('🔄 Modified code for retry:', modifiedCode);
      
      // Update the retry log with the modified code
      if (logger && stepNumber) {
        console.log('📋 Updating retry log with modified code...');
        // logger.logRetryAttempt(stepNumber, codeResponse.code, modifiedCode, error.message, 1, page.url());
      }
      
      // Use AIUtilsEnhanced for the retry as well
      console.log('🤖 Creating AIUtilsEnhanced instance for retry...');
      const retryAiUtils = new AIUtilsEnhanced(page);
      
      // Reuse the markdown path if available
      if (mdFilePath) {
        console.log('📄 Using markdown path for retry:', mdFilePath);
        retryAiUtils.setCurrentMdFilePath(mdFilePath);
      }
      
      console.log('⚡ Executing retry with AIUtilsEnhanced...');
      await retryAiUtils.executeWithEnhancedScreenshotInterception(
        modifiedCode, 
        true, 
        logger, 
        stepNumber, 
        codeResponse.thinking,
        mdFilePath,
        codeResponse.screenshotIntent
      );
      console.log('✅ Retry execution completed successfully');
    } else {
      console.error('❌ Non-retryable error, re-throwing:', error.message);
      throw error;
    }
  }
};

export const clearElementHighlights = async (page: Page) => {
  await page.evaluate(() => {
    const elements = document.querySelectorAll<HTMLElement>(".dynamic-element-highlight");
    elements.forEach((element) => element.remove());
  });
};

type HighlightSettings = {
  outlineWidth: number;
  labelTextColor: string;
  labelPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  zIndex: number;
};

const highlightSettings: HighlightSettings = {
  outlineWidth: 3,
  labelTextColor: "white",
  labelPosition: "top-left",
  zIndex: 10000,
};

const getClickableElements = async (page: Page, elementIndex: number): Promise<ClickableDomResult> => {
  console.log('🔍 Starting getClickableElements...');
  console.log('📍 Page URL:', page.url());
  console.log('📊 Element index:', elementIndex);
  
  try {
    // Enhanced version with intelligent promotion and smart bypasses
    console.log('⚡ Evaluating DOM elements in browser context...');
    const result = await page.evaluate(`
      (function() {
        console.log('🔍 Starting DOM evaluation in browser context...');
        var initialElementIndex = ${elementIndex};
        var highlightSettings = { outlineWidth: 3, labelTextColor: "white", labelPosition: "top-left", zIndex: 10000 };
        
        // Enhanced debug counters and logs
        var debugLog = [];
        var stats = {
          totalScanned: 0,
          duplicatesSkipped: 0,
          nonClickableSkipped: 0,
          hiddenSkipped: 0,
          notOnTopSkipped: 0,
          successfullyProcessed: 0,
          inputsProcessed: 0,
          inputsHidden: 0,
          elementsPromoted: 0,
          intendedTargetsProcessed: 0,
          smartBypasses: 0,
          // Enhanced tracking for new element types
          divsDetected: 0,
          spansDetected: 0,
          lisDetected: 0,
          linksDetected: 0,
          tableElementsDetected: 0,
          muiButtonBaseDetected: 0,
          muiMenuItemDetected: 0,
          muiTableSortDetected: 0,
          muiAccordionDetected: 0,
          muiChipDetected: 0,
          dataTestIdDetected: 0,
          dataCyDetected: 0,
          roleBasedDetected: 0,
          draggableDetected: 0
        };
        
        function log(message) {
          debugLog.push(message);
          console.log("🔍 DEBUG: " + message);
        }
        
        function getElementId(element) {
          var id = element.id ? "#" + element.id : "";
          var testId = element.getAttribute("data-test-id") || element.getAttribute("data-testid");
          var dataTestId = testId ? "[data-test-id=" + testId + "]" : "";
          var className = "";
          if (element.className && typeof element.className === "string" && element.className.length > 0) {
            className = "." + element.className.split(" ")[0];
          } else if (element.className && element.className.toString) {
            var classStr = element.className.toString();
            if (classStr && classStr.length > 0) {
              className = "." + classStr.split(" ")[0];
            }
          }
          return element.tagName + id + dataTestId + className;
        }
        
        function isVisible(element) {
          var style = window.getComputedStyle(element);
          var isDisplayed = style.display !== "none";
          var isVisibilityVisible = style.visibility !== "hidden";
          var isOpaque = style.opacity !== "0";
          var hasDimensions = element.offsetWidth > 0 && element.offsetHeight > 0;
          
          var visible = isDisplayed && isVisibilityVisible && isOpaque && hasDimensions;
          
          if (!visible) {
            var reasons = [];
            if (!isDisplayed) reasons.push("display:none");
            if (!isVisibilityVisible) reasons.push("visibility:hidden");
            if (!isOpaque) reasons.push("opacity:0");
            if (!hasDimensions) reasons.push("no dimensions");
            log("❌ Element invisible: " + getElementId(element) + " (" + reasons.join(", ") + ")");
          }
          
          return visible;
        }

        function isTopElement(element) {
          var rect = element.getBoundingClientRect();
          var elementX = rect.left + rect.width / 2;
          var elementY = rect.top + rect.height / 2;

          var topElement = document.elementFromPoint(elementX, elementY);
          var isTop = !topElement ? false : (topElement === element || element.contains(topElement));
          
          // Smart bypass: Allow meaningful elements even if covered by their own children
          if (!isTop && isMeaningfulClickable(element)) {
            var coveredByChild = topElement && element.contains(topElement);
            var coveredByIcon = topElement && (
              topElement.tagName === "SVG" || 
              topElement.tagName === "PATH" ||
              topElement.tagName === "I" ||
              (topElement.className && typeof topElement.className === "string" && 
               (topElement.className.includes("icon") || topElement.className.includes("Icon") || 
                topElement.className.includes("ripple") || topElement.className.includes("Ripple"))) ||
              (topElement.className && topElement.className.toString && 
               (topElement.className.toString().includes("icon") || topElement.className.toString().includes("Icon") || 
                topElement.className.toString().includes("ripple") || topElement.className.toString().includes("Ripple")))
            );
            
            if (coveredByChild && coveredByIcon) {
              log("✅ SMART BYPASS: Meaningful element covered by child icon - " + getElementId(element) + " (covered by child: " + getElementId(topElement) + ")");
              stats.smartBypasses++;
              return true;
            } else if (coveredByChild) {
              log("✅ SMART BYPASS: Meaningful element covered by child - " + getElementId(element) + " (covered by child: " + getElementId(topElement) + ")");
              stats.smartBypasses++;
              return true;
            }
          }
          
          if (!isTop) {
            log("❌ Element not on top: " + getElementId(element) + " (covered by: " + (topElement ? getElementId(topElement) : "unknown") + ")");
          }
          
          return isTop;
        }

        function getHighlightColorHex(index) {
          var highlightColorsHex = [
            "#E63946", "#1D3557", "#2A9D8F", "#E9C46A", "#8338EC",
            "#FF6B35", "#2B9348", "#7B2CBF", "#F94144", "#073B4C"
          ];
          return highlightColorsHex[index % highlightColorsHex.length];
        }

        function highlightElement(element, index) {
          var rect = element.getBoundingClientRect();
          var scrollTop = window.scrollY || document.documentElement.scrollTop;
          var scrollLeft = window.scrollX || document.documentElement.scrollLeft;

          var color = getHighlightColorHex(index);
          var highlight = document.createElement("div");
          highlight.className = "dynamic-element-highlight";
          highlight.style.position = "absolute";
          highlight.style.top = (rect.top + scrollTop) + "px";
          highlight.style.left = (rect.left + scrollLeft) + "px";
          highlight.style.width = (rect.width - highlightSettings.outlineWidth) + "px";
          highlight.style.height = (rect.height - highlightSettings.outlineWidth) + "px";
          highlight.style.outline = highlightSettings.outlineWidth + "px solid " + color;
          highlight.style.pointerEvents = "none";
          highlight.style.boxSizing = "border-box";
          highlight.style.zIndex = highlightSettings.zIndex.toString();

          var label = document.createElement("div");
          label.textContent = String(index);
          label.style.position = "absolute";
          label.style.backgroundColor = color;
          label.style.color = highlightSettings.labelTextColor;
          label.style.padding = "2px 6px";
          label.style.borderRadius = "3px";
          label.style.fontSize = "12px";
          label.style.fontWeight = "bold";
          label.style.zIndex = (highlightSettings.zIndex + 1).toString();

          switch (highlightSettings.labelPosition) {
            case "top-left":
              label.style.top = "0";
              label.style.left = "0";
              label.style.transform = "translate(-75%, -75%)";
              break;
            case "top-right":
              label.style.top = "0";
              label.style.right = "0";
              label.style.transform = "translate(75%, -75%)";
              break;
            case "bottom-left":
              label.style.bottom = "0";
              label.style.left = "0";
              label.style.transform = "translate(-75%, 75%)";
              break;
            case "bottom-right":
              label.style.bottom = "0";
              label.style.right = "0";
              label.style.transform = "translate(75%, 75%)";
              break;
            default:
              label.style.top = "0";
              label.style.left = "0";
              label.style.transform = "translate(-75%, -75%)";
          }

          highlight.appendChild(label);
          document.body.appendChild(highlight);
          
          log("✅ Highlighted element #" + index + ": " + getElementId(element));
        }

        function elementHtmlWithIndex(element, index) {
          return index + ": " + element.outerHTML;
        }

        function getAllInputs() {
          var inputs = Array.from(document.querySelectorAll("input"));
          var textareas = Array.from(document.querySelectorAll("textarea"));
          var combined = [];
          for (var i = 0; i < inputs.length; i++) combined.push(inputs[i]);
          for (var j = 0; j < textareas.length; j++) combined.push(textareas[j]);
          log("📋 Found " + inputs.length + " inputs and " + textareas.length + " textareas");
          return combined;
        }

        function isClickableElement(element) {
          var style = window.getComputedStyle(element);
          var isButton = element.tagName === "BUTTON";
          var hasPointerCursor = style.cursor === "pointer" && element.tagName !== "INPUT";
          
          // Enhanced: Check for meaningful interactive attributes (DIVs, SPANs, LIs)
          var hasInteractiveAttributes = false;
          var attributeReasons = [];
          
          // Conservative: Only detect DIVs if they don't contain buttons
          if (element.tagName === "DIV") {
            var hasButtonChildren = element.querySelector("button");
            var hasChipChildren = element.querySelector(".MuiChip-clickable, .MuiChip-root");
            var hasTestId = element.getAttribute("data-test-id") || element.getAttribute("data-testid");
            
            // Exception: Allow expandable sections even if they contain buttons
            var isExpandablePattern = hasTestId && (
              hasTestId.toLowerCase().includes("expandable") || 
              hasTestId.toLowerCase().includes("section") ||
              hasTestId.toLowerCase().includes("accordion")
            );
            
            // Priority: Skip DIVs that contain MuiChip children (to avoid selecting containers)
            if (hasChipChildren && !element.className.includes("MuiChip-")) {
              log("🎯 PRIORITY: Skipping DIV container that contains MuiChip children: " + getElementId(element));
              return false;
            }
            
            // Exception: Allow MuiAccordion containers even if they contain buttons (the summary IS the clickable part)
            var isAccordionContainer = element.className && element.className.includes("MuiAccordion-root");
            
            if (hasButtonChildren && !isExpandablePattern && !isAccordionContainer) {
              log("🛡️ CONSERVATIVE: Skipping DIV that contains buttons: " + getElementId(element));
              return false;
            }
            
            if (isExpandablePattern) {
              log("🆕 EXCEPTION: Allowing expandable section DIV: " + getElementId(element));
            }
            
            var hasRole = element.getAttribute("role");
            var hasDraggable = element.getAttribute("draggable") === "true";
            var hasTabIndex = element.getAttribute("tabindex") && element.getAttribute("tabindex") !== "-1";
            var hasButtonBase = element.className && element.className.includes("MuiButtonBase-root");
            
            // Priority: MuiChip elements are always clickable if they have clickable class
            var isMuiChip = element.className && (
              element.className.includes("MuiChip-clickable") || 
              (element.className.includes("MuiChip-root") && element.className.includes("MuiButtonBase-root"))
            );
            
            // Priority: MuiAccordionSummary elements are always clickable
            var isMuiAccordionSummary = element.className && element.className.includes("MuiAccordionSummary-root");
            
            // Conservative: Require stronger evidence for DIV detection, OR expandable pattern, OR MuiChip, OR accordion summary
            var strongEvidence = (hasRole === "button") || (hasButtonBase && hasTabIndex) || hasDraggable || isExpandablePattern || isMuiChip || isMuiAccordionSummary;
            
            if (strongEvidence) {
              if (hasTestId) attributeReasons.push("data-testid");
              if (hasRole === "button") attributeReasons.push("role=button");
              if (hasRole === "tab") attributeReasons.push("role=tab");
              if (hasDraggable) attributeReasons.push("draggable");
              if (hasTabIndex) attributeReasons.push("tabindex");
              if (hasButtonBase) attributeReasons.push("MuiButtonBase");
              if (isExpandablePattern) attributeReasons.push("expandable-pattern");
              if (isMuiChip) attributeReasons.push("MuiChip-clickable");
              if (isMuiAccordionSummary) attributeReasons.push("MuiAccordionSummary");
              
              hasInteractiveAttributes = true;
            }
          }
          
          // SPAN elements - Conservative detection for table sort headers, etc.
          else if (element.tagName === "SPAN") {
            var hasRole = element.getAttribute("role");
            var hasTabIndex = element.getAttribute("tabindex") && element.getAttribute("tabindex") !== "-1";
            var hasButtonBase = element.className && element.className.includes("MuiButtonBase-root");
            var hasTableSort = element.className && element.className.includes("MuiTableSortLabel-root");
            
            // Conservative: Require strong evidence for SPAN detection
            var strongEvidence = (hasRole === "button" && hasTabIndex) || hasTableSort || (hasButtonBase && hasTabIndex);
            
            if (strongEvidence) {
              if (hasRole === "button") attributeReasons.push("role=button");
              if (hasTabIndex) attributeReasons.push("tabindex");
              if (hasButtonBase) attributeReasons.push("MuiButtonBase");
              if (hasTableSort) attributeReasons.push("MuiTableSort");
              
              hasInteractiveAttributes = true;
            }
          }
          
          // LI elements - Conservative detection for menu items
          else if (element.tagName === "LI") {
            var hasRole = element.getAttribute("role");
            var hasTabIndex = element.getAttribute("tabindex") && element.getAttribute("tabindex") !== "-1";
            var hasButtonBase = element.className && element.className.includes("MuiButtonBase-root");
            var hasMenuItem = element.className && element.className.includes("MuiMenuItem-root");
            
            // Conservative: Require role-based or Material-UI class evidence
            var strongEvidence = (hasRole === "menuitem") || (hasRole === "button") || hasMenuItem || (hasButtonBase && hasTabIndex);
            
            if (strongEvidence) {
              if (hasRole === "menuitem") attributeReasons.push("role=menuitem");
              if (hasRole === "button") attributeReasons.push("role=button");
              if (hasTabIndex) attributeReasons.push("tabindex");
              if (hasButtonBase) attributeReasons.push("MuiButtonBase");
              if (hasMenuItem) attributeReasons.push("MuiMenuItem");
              
              hasInteractiveAttributes = true;
            }
          }
          
          // A elements - Conservative link detection  
          else if (element.tagName === "A") {
            var hasHref = element.getAttribute("href");
            var hasRole = element.getAttribute("role");
            var hasButtonBase = element.className && element.className.includes("MuiButtonBase-root");
            
            // Conservative: Standard links are usually fine, only enhance detection
            if (hasHref || (hasRole === "button") || hasButtonBase) {
              if (hasHref) attributeReasons.push("href");
              if (hasRole === "button") attributeReasons.push("role=button");
              if (hasButtonBase) attributeReasons.push("MuiButtonBase");
              
              hasInteractiveAttributes = true;
            }
          }
          
          // Table elements - Very conservative detection
          else if (element.tagName === "IMG" || element.tagName === "TR" || element.tagName === "TD") {
            var hasClick = element.getAttribute("onclick");
            var hasRole = element.getAttribute("role");
            var hasButtonBase = element.className && element.className.includes("MuiButtonBase-root");
            var hasTableRow = element.className && element.className.includes("MuiTableRow-root");
            var hasDataCy = element.getAttribute("data-cy");
            var hasDataTestId = element.getAttribute("data-testid");
            
            // Very conservative: Only detect with explicit click handlers or strong evidence
            var strongEvidence = hasClick || (hasRole === "button") || (hasButtonBase && (hasDataCy || hasDataTestId));
            
            if (strongEvidence) {
              if (hasClick) attributeReasons.push("onclick");
              if (hasRole === "button") attributeReasons.push("role=button");
              if (hasButtonBase) attributeReasons.push("MuiButtonBase");
              if (hasTableRow) attributeReasons.push("MuiTableRow");
              if (hasDataCy) attributeReasons.push("data-cy");
              if (hasDataTestId) attributeReasons.push("data-testid");
              
              hasInteractiveAttributes = true;
            }
          }
          
          var clickable = isButton || hasPointerCursor || hasInteractiveAttributes;
          
          // Track enhanced detection statistics for ALL clickable elements
          if (clickable) {
            // Track by element type
            if (element.tagName === "DIV") stats.divsDetected++;
            else if (element.tagName === "SPAN") stats.spansDetected++;
            else if (element.tagName === "LI") stats.lisDetected++;
            else if (element.tagName === "A") stats.linksDetected++;
            else if (element.tagName === "IMG" || element.tagName === "TR" || element.tagName === "TD") stats.tableElementsDetected++;
            
            // Track specific patterns for ALL clickable elements
            if (element.className && element.className.includes("MuiButtonBase-root")) stats.muiButtonBaseDetected++;
            if (element.className && element.className.includes("MuiMenuItem-root")) stats.muiMenuItemDetected++;
            if (element.className && element.className.includes("MuiTableSortLabel-root")) stats.muiTableSortDetected++;
            if (element.className && element.className.includes("MuiAccordionSummary-root")) stats.muiAccordionDetected++;
            if (element.className && (element.className.includes("MuiChip-clickable") || element.className.includes("MuiChip-root"))) stats.muiChipDetected++;
            if (element.getAttribute("data-testid")) stats.dataTestIdDetected++;
            if (element.getAttribute("data-cy")) stats.dataCyDetected++;
            if (element.getAttribute("role")) stats.roleBasedDetected++;
            if (element.getAttribute("draggable") === "true") stats.draggableDetected++;
          }
          
          if (!clickable) {
            log("❌ Not clickable: " + getElementId(element) + " (cursor: " + style.cursor + ")");
          } else {
            var reason = isButton ? "button" : 
                       hasPointerCursor ? "pointer cursor" : 
                       "interactive (" + attributeReasons.join(", ") + ")";
            log("✅ Clickable element: " + getElementId(element) + " (" + reason + ")");
          }
          
          return clickable;
        }

        function containsChildOnTop(element) {
          var children = element.children;
          if (element.children.length === 0) {
            var result = isTopElement(element);
            log("🔍 Leaf element top check: " + getElementId(element) + " -> " + (result ? "✅" : "❌"));
            return result;
          }
          
          // Smart bypass for meaningful elements: If this is a meaningful clickable element,
          // don't require children to be on top
          if (isMeaningfulClickable(element)) {
            log("🧠 SMART BYPASS: Meaningful element - skipping child top check for: " + getElementId(element));
            stats.smartBypasses++;
            return true;
          }
          
          log("🔍 Checking children of: " + getElementId(element) + " (" + children.length + " children)");
          for (var i = 0; i < children.length; i++) {
            var child = children[i];
            var isChildTop = containsChildOnTop(child);
            if (isChildTop) {
              log("✅ Child on top found in: " + getElementId(element));
              return true;
            }
          }
          log("❌ No child on top in: " + getElementId(element));
          return false;
        }

        function findIntendedClickTarget(element) {
          log("🎯 INTELLIGENT PROMOTION: Analyzing " + getElementId(element));
          
          // If element is already a meaningful clickable, return it
          if (isMeaningfulClickable(element)) {
            log("✅ Element is already meaningful: " + getElementId(element));
            return element;
          }
          
          // Travel up the DOM tree to find a meaningful parent
          var current = element.parentElement;
          var depth = 0;
          var maxDepth = 5; // Prevent infinite loops
          
          while (current && depth < maxDepth) {
            depth++;
            log("🔍 Checking parent level " + depth + ": " + getElementId(current));
            
            if (isMeaningfulClickable(current)) {
              log("🚀 PROMOTED: " + getElementId(element) + " -> " + getElementId(current));
              return current;
            }
            
            current = current.parentElement;
          }
          
          log("❌ No meaningful parent found for: " + getElementId(element));
          return element; // Return original if no meaningful parent found
        }
        
        function isMeaningfulClickable(element) {
          // Check if element has meaningful attributes or is a meaningful tag
          var hasTestId = element.getAttribute("data-test-id") || element.getAttribute("data-testid");
          var hasAriaLabel = element.getAttribute("aria-label");
          var hasRole = element.getAttribute("role");
          var hasOnClick = element.onclick || element.getAttribute("onclick");
          var hasTabIndex = element.getAttribute("tabindex");
          
          // Meaningful tags
          var meaningfulTags = ["BUTTON", "A", "INPUT", "TEXTAREA", "SELECT"];
          var isMeaningfulTag = meaningfulTags.indexOf(element.tagName) !== -1;
          
          // Meaningful attributes
          var hasMeaningfulAttributes = hasTestId || hasAriaLabel || hasRole || hasOnClick || hasTabIndex;
          
          // Check for clickable styling
          var style = window.getComputedStyle(element);
          var hasPointerCursor = style.cursor === "pointer";
          
          var meaningful = isMeaningfulTag || hasMeaningfulAttributes || hasPointerCursor;
          
          if (meaningful) {
            var reasons = [];
            if (isMeaningfulTag) reasons.push("meaningful tag");
            if (hasTestId) reasons.push("has data-test-id");
            if (hasAriaLabel) reasons.push("has aria-label");
            if (hasRole) reasons.push("has role");
            if (hasOnClick) reasons.push("has onclick");
            if (hasTabIndex) reasons.push("has tabindex");
            if (hasPointerCursor) reasons.push("pointer cursor");
            
            log("✅ Meaningful clickable: " + getElementId(element) + " (" + reasons.join(", ") + ")");
          } else {
            log("❌ Not meaningful: " + getElementId(element) + " (generic element without context)");
          }
          
          return meaningful;
        }

        var clickableVisibleElements = [];
        var clickableHiddenElements = [];
        var elementIndex = initialElementIndex;
        var processedIntendedTargets = []; // Track already processed intended targets to prevent duplicates

        log("🚀 Starting element detection...");
        var allElements = document.querySelectorAll("div, span, a, button, input, textarea");
        log("📊 Total elements to scan: " + allElements.length);
        
        for (var i = 0; i < allElements.length; i++) {
          var element = allElements[i];
          stats.totalScanned++;

          log("\\n🔍 Processing element " + (i + 1) + "/" + allElements.length + ": " + getElementId(element));

          // Check for duplicates in visible elements
          var previousVisibleHtml = clickableVisibleElements.length > 0 ? clickableVisibleElements[clickableVisibleElements.length - 1] : '';
          if (previousVisibleHtml && previousVisibleHtml.includes(element.outerHTML)) {
            log("⏭️ Skipping duplicate (found in visible): " + getElementId(element));
            stats.duplicatesSkipped++;
            continue;
          }

          // Check for duplicates in hidden elements
          var previousHiddenHtml = clickableHiddenElements.length > 0 ? clickableHiddenElements[clickableHiddenElements.length - 1] : '';
          if (previousHiddenHtml && previousHiddenHtml.includes(element.outerHTML)) {
            log("⏭️ Skipping duplicate (found in hidden): " + getElementId(element));
            stats.duplicatesSkipped++;
            continue;
          }
          
          if (isClickableElement(element)) {
            if (isVisible(element)) {
              if (containsChildOnTop(element)) {
                // Apply intelligent promotion
                var intendedTarget = findIntendedClickTarget(element);
                
                // Check if we've already processed this intended target
                var alreadyProcessed = false;
                for (var j = 0; j < processedIntendedTargets.length; j++) {
                  if (processedIntendedTargets[j] === intendedTarget) {
                    alreadyProcessed = true;
                    break;
                  }
                }
                
                if (alreadyProcessed) {
                  log("⏭️ Skipping: Intended target already processed - " + getElementId(intendedTarget));
                  stats.duplicatesSkipped++;
                  continue;
                }
                
                // Mark intended target as processed
                processedIntendedTargets.push(intendedTarget);
                
                // Track promotion if element was promoted
                if (intendedTarget !== element) {
                  stats.elementsPromoted++;
                }
                
                stats.intendedTargetsProcessed++;
                
                // Highlight and record the intended target
                highlightElement(intendedTarget, elementIndex);
                clickableVisibleElements.push(elementHtmlWithIndex(intendedTarget, elementIndex));
                elementIndex++;
                stats.successfullyProcessed++;
                log("🎯 SUCCESS: Added intended target #" + (elementIndex - 1) + ": " + getElementId(intendedTarget));
              } else {
                clickableHiddenElements.push(element.outerHTML);
                stats.notOnTopSkipped++;
                log("❌ FAILED: Element not on top (added to hidden)");
              }
            } else {
              clickableHiddenElements.push(element.outerHTML);
              stats.hiddenSkipped++;
              log("❌ FAILED: Element not visible (added to hidden)");
            }
          } else {
            stats.nonClickableSkipped++;
            log("❌ FAILED: Element not clickable");
          }
        }

        log("\\n🔍 Processing input elements...");
        var inputElements = getAllInputs();
        for (var i = 0; i < inputElements.length; i++) {
          var elem = inputElements[i];
          log("🔍 Processing input " + (i + 1) + "/" + inputElements.length + ": " + getElementId(elem) + " type=" + (elem.type || "text"));
          
          if (isVisible(elem)) {
            highlightElement(elem, elementIndex);
            clickableVisibleElements.push(elementHtmlWithIndex(elem, elementIndex));
            elementIndex++;
            stats.inputsProcessed++;
            log("✅ SUCCESS: Added visible input element #" + (elementIndex - 1));
          } else {
            clickableHiddenElements.push(elem.outerHTML);
            stats.inputsHidden++;
            log("❌ FAILED: Input not visible (added to hidden)");
          }
        }

        log("\\n🏁 Detection completed!");
        log("📊 FINAL STATS:");
        log("   Total scanned: " + stats.totalScanned);
        log("   Duplicates skipped: " + stats.duplicatesSkipped);
        log("   Non-clickable skipped: " + stats.nonClickableSkipped);
        log("   Hidden/invisible skipped: " + stats.hiddenSkipped);
        log("   Not on top skipped: " + stats.notOnTopSkipped);
        log("   Successfully processed: " + stats.successfullyProcessed);
        log("   Inputs processed: " + stats.inputsProcessed);
        log("   Inputs hidden: " + stats.inputsHidden);
        log("🚀 INTELLIGENT PROMOTION STATS:");
        log("   Elements promoted: " + stats.elementsPromoted);
        log("   Intended targets processed: " + stats.intendedTargetsProcessed);
        log("   Smart bypasses (covered by children): " + stats.smartBypasses);
      
        return {
          visibleElements: clickableVisibleElements.join('\\n'),
          hiddenElements: clickableHiddenElements.join('\\n'),
          debugInfo: { 
            totalElements: allElements.length,
            visibleClickable: clickableVisibleElements.length,
            hiddenClickable: clickableHiddenElements.length,
            stats: stats,
            debugLog: debugLog
          }
        };
      })()
    `);
    
    console.log('✅ DOM evaluation completed successfully');
    // console.log('📊 Browser-side stats:', (result as any).debugInfo?.stats);
    
    return result as ClickableDomResult;
  } catch (error: any) {
    console.error('❌ Failed to get clickable elements:', error.message);
    console.error('📍 Error occurred on page:', page.url());
    throw error;
  }
};
