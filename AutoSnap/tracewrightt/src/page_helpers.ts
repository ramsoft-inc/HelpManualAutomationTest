import { Page } from "@playwright/test";
import { AIUtilsEnhanced } from "./ai_utils_enhanced.js";
import { GenerateCodeResponse } from "./llm_request.js";

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
  mdFilePath?: string,
  aiUtils?: any,
  poManager?: any
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
    // Check if the code is a screenshot command to add special handling
    const isScreenshotCommand = /\.screenshot\s*\(/i.test(codeResponse.code);
    if (isScreenshotCommand && codeResponse.screenshotIntent) {
      console.log('🎯 Special handling for screenshot command with intent');
    }

    if (isScreenshotCommand) {
      let currentAiUtils = aiUtils;
      
      if (!currentAiUtils) {
        // Fallback: Create AIUtilsEnhanced instance only for screenshot interception
        console.log('🤖 Creating AIUtilsEnhanced instance (screenshot detected)...');
        currentAiUtils = new AIUtilsEnhanced(page);

        // If a markdown file path is provided, set it
        if (mdFilePath) {
          console.log('📄 Using markdown path for image reference:', mdFilePath);
          currentAiUtils.setCurrentMdFilePath(mdFilePath);
        }

        console.log('✅ AIUtilsEnhanced instance created successfully');
      } else {
        console.log('⚡ Using provided AIUtilsEnhanced instance...');
      }

      // Use AIUtilsEnhanced to execute code with screenshot interception (pass thinking, markdown path, and screenshot intent)
      console.log('⚡ Executing code with AIUtilsEnhanced...');
      // Pass the entire codeResponse JSON object instead of extracting individual fields
      await currentAiUtils.executeWithEnhancedScreenshotInterception(
        codeResponse.code,
        false,
        logger,
        stepNumber,
        codeResponse.thinking,
        mdFilePath,
        codeResponse.screenshotIntent,
        JSON.stringify(codeResponse) // Pass the whole JSON response
      );
      console.log('✅ Code execution completed successfully');
    } else {
      // Execute non-screenshot code directly without AIUtilsEnhanced wrapper
      console.log('⚡ Executing code without AIUtilsEnhanced (no screenshot detected)...');
      const func = new Function('page', 'po', `return (async () => { ${codeResponse.code} })()`);
      await func(page, poManager);
      console.log('✅ Code execution completed successfully');
    }
    
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
      
    // Decide retry path based on whether the modified code contains screenshot
    const isRetryScreenshotCommand = /\.screenshot\s*\(/i.test(modifiedCode);
    if (isRetryScreenshotCommand) {
      console.log('🤖 Creating AIUtilsEnhanced instance for retry (screenshot detected)...');
      const retryAiUtils = new AIUtilsEnhanced(page);
      // Reuse the markdown path if available
      if (mdFilePath) {
        console.log('📄 Using markdown path for retry:', mdFilePath);
        retryAiUtils.setCurrentMdFilePath(mdFilePath);
      }
      console.log('⚡ Executing retry with AIUtilsEnhanced...');
      // Pass the entire codeResponse JSON object for retry as well
      await retryAiUtils.executeWithEnhancedScreenshotInterception(
        modifiedCode,
        true,
        logger,
        stepNumber,
        codeResponse.thinking,
        mdFilePath,
        codeResponse.screenshotIntent,
        JSON.stringify(codeResponse) // Pass the whole JSON response
      );
      console.log('✅ Retry execution completed successfully');
    } else {
      console.log('⚡ Executing retry without AIUtilsEnhanced (no screenshot detected)...');
      const retryFunc = new Function('page', 'po', `return (async () => { ${modifiedCode} })()`);
      await retryFunc(page, poManager);
      console.log('✅ Retry execution completed successfully');
    }
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
    console.log('⚡ Evaluating DOM elements in browser context...');
    const result = await page.evaluate(`
      (function() {
        var initialElementIndex = ${elementIndex}; // Use the passed elementIndex
        var highlightSettings = { outlineWidth: 3, labelTextColor: "white", labelPosition: "top-left", zIndex: 10000 };
        
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
          draggableDetected: 0,
          checkedElements: 0,
          selectedElements: 0,
          expandedElements: 0,
          collapsedElements: 0,
          // Removed disabledElements: 0,
          menuOpenedElements: 0,
          currentPageElements: 0,
          focusedElements: 0,        
          // Removed readonlyElements: 0,      
          requiredElements: 0,       
          invalidElements: 0,        
          pressedElements: 0,        
          // Removed loadingElements: 0,        
          indeterminateElements: 0   
        };
        
        // Empty log function to remove console.log calls from browser context
        function log(message) { /* No logging in browser context */ }
        
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
          
          return visible;
        }

        function isTopElement(element) {
          var rect = element.getBoundingClientRect();
          var elementX = rect.left + rect.width / 2;
          var elementY = rect.top + rect.height / 2;

          var topElement = document.elementFromPoint(elementX, elementY);
          var isTop = !topElement ? false : (topElement === element || element.contains(topElement));
          
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
              stats.smartBypasses++;
              return true;
            } else if (coveredByChild) {
              stats.smartBypasses++;
              return true;
            }
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
        }
        
        // Helper to add state if not already present
        function addState(statesArray, stateString) {
          if (!statesArray.includes(stateString)) {
            statesArray.push(stateString);
          }
        }

        // Update stats helper
        function updateStat(statName) {
          if (stats[statName] !== undefined) {
            stats[statName]++;
          }
        }

        function getInteractiveState(element) {
          var currentElementStates = [];

          // Removed: 1. Disabled state (general)
          // Removed: if (element.disabled || element.getAttribute("aria-disabled") === "true" || element.classList.contains("Mui-disabled")) { ... }

          // 2. Checked/Unchecked/Indeterminate state (checkboxes, radios, switches)
          var inputElement = element.tagName === "INPUT" ? element : element.querySelector("input[type='checkbox'], input[type='radio']");
          if (!inputElement && element.classList.contains("MuiSwitch-switchBase")) { // For MuiSwitch's root part
             inputElement = element.querySelector("input");
          }
          if (inputElement) {
            if (inputElement.indeterminate || inputElement.getAttribute("aria-checked") === "mixed") {
              addState(currentElementStates, "indeterminate");
              updateStat("indeterminateElements");
            } else if (inputElement.checked || inputElement.getAttribute("aria-checked") === "true") {
              addState(currentElementStates, "checked");
              updateStat("checkedElements");
            } else if (inputElement.checked === false || inputElement.getAttribute("aria-checked") === "false") {
              addState(currentElementStates, "unchecked");
            }
          } else if (element.getAttribute("aria-checked") === "mixed") { // For elements with aria-checked directly
            addState(currentElementStates, "indeterminate");
            updateStat("indeterminateElements");
          } else if (element.getAttribute("aria-checked") === "true") { 
            addState(currentElementStates, "checked");
            updateStat("checkedElements");
          } else if (element.getAttribute("aria-checked") === "false") {
            addState(currentElementStates, "unchecked");
          }
          // Also check for Mui-checked class on the main element or its children
          if (element.classList.contains("Mui-checked") || (element.querySelector(".Mui-checked"))) {
             addState(currentElementStates, "checked");
          }
          
          // 3. Selected/Unselected state (tabs, list items, dropdowns, generic selected items)
          // Priority 1: ARIA selected attribute
          if (element.getAttribute("aria-selected") === "true") {
            addState(currentElementStates, "selected");
            updateStat("selectedElements");
          } else if (element.getAttribute("aria-selected") === "false") {
            addState(currentElementStates, "unselected");
          }
          // Priority 2: Standard HTML <option> selected attribute
          if (element.tagName === "OPTION" && element.selected) {
            addState(currentElementStates, "selected");
            updateStat("selectedElements");
          }
          // Priority 3: Common UI Framework/Generic 'selected' or 'Mui-selected' classes
          if (element.classList.contains("Mui-selected") || element.classList.contains("selected")) { 
             addState(currentElementStates, "selected");
             updateStat("selectedElements");
          }

          // --- 4. Current Page/Navigation Active State (Only assert positive 'current-page') ---
          var ariaCurrent = element.getAttribute("aria-current");
          if (ariaCurrent && ariaCurrent !== "false") { // Check if aria-current is set and not explicitly false
              addState(currentElementStates, "current-page");
              updateStat("currentPageElements");
          }
          if (element.classList.contains("nav-link-active")) { // Check for the specific class
              addState(currentElementStates, "current-page"); // Use same state for consistency
              updateStat("currentPageElements");
          }
          // --- END Current Page/Navigation Active State ---

          // 5. Expanded/Collapsed state (accordions, tree views, menus, etc.)
          var isDirectlyExpanded = element.getAttribute("aria-expanded") === "true" || element.classList.contains("Mui-expanded");
          var isDirectlyCollapsed = element.getAttribute("aria-expanded") === "false" || element.classList.contains("Mui-collapsed");

          if (isDirectlyExpanded) {
            addState(currentElementStates, "expanded");
            updateStat("expandedElements");
          } else if (isDirectlyCollapsed) {
            addState(currentElementStates, "collapsed");
            updateStat("collapsedElements");
          }

          // Check for MuiAccordion-root (itself might not have aria-expanded)
          var accordionRoot = element.closest(".MuiAccordion-root");
          if (accordionRoot) {
            if (accordionRoot.classList.contains("Mui-expanded")) {
              addState(currentElementStates, "expanded");
              updateStat("expandedElements");
            } else { // Assume collapsed if not explicitly expanded
              addState(currentElementStates, "collapsed");
              updateStat("collapsedElements");
            }
          }

          // Submenu/Disclosure Pattern (e.g., in MuiMenuItem followed by MuiCollapse)
          if (element.tagName === "LI" && element.classList.contains("MuiMenuItem-root")) {
              var nextSibling = element.nextElementSibling;
              if (nextSibling && nextSibling.classList.contains("MuiCollapse-root")) {
                  if (nextSibling.classList.contains("MuiCollapse-entered")) {
                      addState(currentElementStates, "expanded");
                      updateStat("expandedElements");
                  } else if (nextSibling.classList.contains("MuiCollapse-exited") || nextSibling.classList.contains("MuiCollapse-hidden")) {
                      addState(currentElementStates, "collapsed");
                      updateStat("collapsedElements");
                  } else {
                       addState(currentElementStates, "collapsed"); // Default if not entered
                       updateStat("collapsedElements");
                  }
              }
              var arrowIcon = element.querySelector('[data-testid^="ArrowDrop"]');
              if (arrowIcon) {
                  var isUpArrow = arrowIcon.getAttribute("data-testid") === "ArrowDropUpIcon";
                  var isDownArrow = arrowIcon.getAttribute("data-testid") === "ArrowDropDownIcon";
                  if (isUpArrow) { addState(currentElementStates, "expanded"); updateStat("expandedElements"); }
                  else if (isDownArrow) { addState(currentElementStates, "collapsed"); updateStat("collapsedElements"); }
              }
          }

          // Inferring state of a controlled menu/popup/dialog by a button (e.g., MoreVertOutlinedIcon)
          if (element.tagName === "BUTTON") { // Consider any button as a potential menu trigger
              var isMoreVertButton = element.getAttribute("data-testid") === "MoreVertOutlinedIcon";
              var isMenuButton = element.getAttribute("aria-haspopup") === "true" || element.getAttribute("role") === "menuitem";

              if (isMoreVertButton || isMenuButton) {
                  // Strategy 1: Look for common Material-UI popups/menus/dialogs in the document
                  var potentialMenu = document.querySelector('.MuiPopover-root[role="presentation"], .MuiDialog-root, .MuiMenu-list[role="menu"]');
                  
                  if (potentialMenu) {
                      var style = window.getComputedStyle(potentialMenu);
                      var isMenuVisible = style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
                      
                      var isMuiMenuOrPopoverOpen = potentialMenu.classList.contains("MuiPopover-paper") || potentialMenu.classList.contains("MuiMenu-list");
                      var isMuiDialogOpen = potentialMenu.classList.contains("MuiDialog-paper");
                      
                      if ((isMuiMenuOrPopoverOpen && isMenuVisible) || (isMuiDialogOpen && isMenuVisible)) {
                          addState(currentElementStates, "menu-open");
                          updateStat("menuOpenedElements");
                      } else {
                          addState(currentElementStates, "menu-closed");
                      }
                  } else {
                      addState(currentElementStates, "menu-closed");
                  }

                  // Strategy 2: Look for aria-controls and check state of controlled element
                  var controlsId = element.getAttribute("aria-controls");
                  if (controlsId) {
                      var controlledElement = document.getElementById(controlsId);
                      if (controlledElement) {
                          var controlledAriaExpanded = controlledElement.getAttribute("aria-expanded");
                          if (controlledAriaExpanded === "true") {
                              addState(currentElementStates, "controls-expanded");
                              updateStat("expandedElements");
                          } else if (controlledAriaExpanded === "false") {
                              addState(currentElementStates, "controls-collapsed");
                              updateStat("collapsedElements");
                          }
                      }
                  }
              }

              // --- NEW: Inferring Toggle/Expansion State for Buttons with Arrow Icons (General Purpose) ---
              // This covers buttons like "ExpandableSectionButton" that control a panel
              if (element.classList.contains("ExpandableSectionButton")) {
                  var arrowIcon = element.querySelector('[data-testid^="KeyboardArrow"]'); // Find any KeyboardArrow icon
                  if (arrowIcon) {
                      var iconTestId = arrowIcon.getAttribute("data-testid");
                      if (iconTestId === "KeyboardArrowRightOutlinedIcon") {
                          // Right arrow usually means the associated section is currently collapsed
                          addState(currentElementStates, "controls-collapsed-panel");
                          updateStat("collapsedElements"); // Use general collapsed stat
                      } else if (iconTestId === "KeyboardArrowDownOutlinedIcon" || iconTestId === "KeyboardArrowLeftOutlinedIcon") {
                          // Down or Left arrow usually means the associated section is currently expanded
                          addState(currentElementStates, "controls-expanded-panel");
                          updateStat("expandedElements"); // Use general expanded stat
                      }
                  }
              }
              // --- END NEW ---
          }

          // 6. Value (for inputs, selects, textareas)
          if (element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.tagName === "SELECT") {
            var value = element.value.trim();
            if (value.length > 0 && element.type !== "password") {
              addState(currentElementStates, "value: '" + value + "'");
            } else if (element.type === "password" && value.length > 0) {
              addState(currentElementStates, "value: '[password]'");
            }

            // --- REMOVED FORM FIELD STATES (readonly) ---
            // Removed: if (element.readOnly) { ... }
            if (element.required) {
              addState(currentElementStates, "required");
              updateStat("requiredElements");
            }
            if (element.getAttribute("aria-invalid") === "true" || element.classList.contains("Mui-error") || element.classList.contains("is-invalid")) {
              addState(currentElementStates, "invalid");
              updateStat("invalidElements");
            }
            // --- END REMOVED FORM FIELD STATES ---
          }

          // --- NEW GENERAL STATES (removed focused, pressed) ---
          if (document.activeElement === element) {
              addState(currentElementStates, "focused");
              updateStat("focusedElements");
          }
          if (element.getAttribute("aria-pressed") === "true") {
            addState(currentElementStates, "pressed");
            updateStat("pressedElements");
          } else if (element.getAttribute("aria-pressed") === "false") {
            addState(currentElementStates, "not-pressed");
          }
          // Removed: Loading/Busy state
          // Removed: if (element.getAttribute("aria-busy") === "true" || element.classList.contains("Mui-loading") || element.classList.contains("loading") || element.classList.contains("is-loading")) { ... }
          // --- END NEW GENERAL STATES ---


          if (currentElementStates.length > 0) {
            return " (" + currentElementStates.join(", ") + ")";
          }
          return ""; // No specific state found
        }

        function truncateSvgPaths(html) {
          // Regex to find SVG path data attributes and other long path-like attributes and replace them with [path]
          // This includes d=, path=, data=, coords=, and other attributes that might contain long paths
          return html.replace(/\s(d|path|data|coords|points|clip-path|shape)="[^"]{10,}"/g, function(match, attrName) {
            return ' ' + attrName + '="[path]"';
          });
        }

        function elementHtmlWithIndex(element, index) {
          var stateInfo = getInteractiveState(element);
          var html = element.outerHTML;
          var truncatedHtml = truncateSvgPaths(html);
          return index + ": " + truncatedHtml + stateInfo;
        }

        function getAllInputs() {
          var inputs = Array.from(document.querySelectorAll("input"));
          var textareas = Array.from(document.querySelectorAll("textarea"));
          var combined = [];
          for (var i = 0; i < inputs.length; i++) combined.push(inputs[i]);
          for (var j = 0; j < textareas.length; j++) combined.push(textareas[j]);
          return combined;
        }

        function isClickableElement(element) {
          var style = window.getComputedStyle(element);
          var isButton = element.tagName === "BUTTON";
          var hasPointerCursor = style.cursor === "pointer" && element.tagName !== "INPUT";
          
          var hasInteractiveAttributes = false;
          
          if (element.tagName === "DIV") {
            var hasButtonChildren = element.querySelector("button");
            var hasChipChildren = element.querySelector(".MuiChip-clickable, .MuiChip-root");
            var hasTestId = element.getAttribute("data-test-id") || element.getAttribute("data-testid");
            
            var isExpandablePattern = hasTestId && (
              hasTestId.toLowerCase().includes("expandable") || 
              hasTestId.toLowerCase().includes("section") ||
              hasTestId.toLowerCase().includes("accordion")
            );
            
            if (hasChipChildren && !element.className.includes("MuiChip-")) {
              return false;
            }
            
            var isAccordionContainer = element.className && element.className.includes("MuiAccordion-root");
            
            if (hasButtonChildren && !isExpandablePattern && !isAccordionContainer) {
              return false;
            }
            
            var hasRole = element.getAttribute("role");
            var hasDraggable = element.getAttribute("draggable") === "true";
            var hasTabIndex = element.getAttribute("tabindex") && element.getAttribute("tabindex") !== "-1";
            var hasButtonBase = element.className && element.className.includes("MuiButtonBase-root");
            
            var isMuiChip = element.className && (
              element.className.includes("MuiChip-clickable") || 
              (element.className.includes("MuiChip-root") && element.className.includes("MuiButtonBase-root"))
            );
            
            var isMuiAccordionSummary = element.className && element.className.includes("MuiAccordionSummary-root");
            
            var strongEvidence = (hasRole === "button") || (hasButtonBase && hasTabIndex) || hasDraggable || isExpandablePattern || isMuiChip || isMuiAccordionSummary;
            
            if (strongEvidence) {
              hasInteractiveAttributes = true;
            }
          }
          
          else if (element.tagName === "SPAN") {
            var hasRole = element.getAttribute("role");
            var hasTabIndex = element.getAttribute("tabindex") && element.getAttribute("tabindex") !== "-1";
            var hasButtonBase = element.className && element.className.includes("MuiButtonBase-root");
            var hasTableSort = element.className && element.className.includes("MuiTableSortLabel-root");
            
            var strongEvidence = (hasRole === "button" && hasTabIndex) || hasTableSort || (hasButtonBase && hasTabIndex);
            
            if (strongEvidence) {
              hasInteractiveAttributes = true;
            }
          }
          
          else if (element.tagName === "LI") {
            var hasRole = element.getAttribute("role");
            var hasTabIndex = element.getAttribute("tabindex") && element.getAttribute("tabindex") !== "-1";
            var hasButtonBase = element.className && element.className.includes("MuiButtonBase-root");
            var hasMenuItem = element.className && element.className.includes("MuiMenuItem-root");
            
            var strongEvidence = (hasRole === "menuitem") || (hasRole === "button") || hasMenuItem || (hasButtonBase && hasTabIndex);
            
            if (strongEvidence) {
              hasInteractiveAttributes = true;
            }
          }
          
          else if (element.tagName === "A") {
            var hasHref = element.getAttribute("href");
            var hasRole = element.getAttribute("role");
            var hasButtonBase = element.className && element.className.includes("MuiButtonBase-root");
            
            if (hasHref || (hasRole === "button") || hasButtonBase) {
              hasInteractiveAttributes = true;
            }
          }
          
          else if (element.tagName === "IMG" || element.tagName === "TR" || element.tagName === "TD") {
            var hasClick = element.getAttribute("onclick");
            var hasRole = element.getAttribute("role");
            var hasButtonBase = element.className && element.className.includes("MuiButtonBase-root");
            var hasTableRow = element.className && element.className.includes("MuiTableRow-root");
            var hasDataCy = element.getAttribute("data-cy");
            var hasDataTestId = element.getAttribute("data-testid");
            
            var strongEvidence = hasClick || (hasRole === "button") || (hasButtonBase && (hasDataCy || hasDataTestId));
            
            if (strongEvidence) {
              hasInteractiveAttributes = true;
            }
          }
          
          var clickable = isButton || hasPointerCursor || hasInteractiveAttributes;
          
          if (clickable) {
            if (element.tagName === "DIV") stats.divsDetected++;
            else if (element.tagName === "SPAN") stats.spansDetected++;
            else if (element.tagName === "LI") stats.lisDetected++;
            else if (element.tagName === "A") stats.linksDetected++;
            else if (element.tagName === "IMG" || element.tagName === "TR" || element.tagName === "TD") stats.tableElementsDetected++;
            
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
          
          return clickable;
        }


        function containsChildOnTop(element) {
          var children = element.children;
          if (element.children.length === 0) {
            var result = isTopElement(element);
            return result;
          }
          
          if (isMeaningfulClickable(element)) {
            stats.smartBypasses++;
            return true;
          }
          
          for (var i = 0; i < children.length; i++) {
            var child = children[i];
            var isChildTop = containsChildOnTop(child);
            if (isChildTop) {
              return true;
            }
          }
          return false;
        }

        function findIntendedClickTarget(element) {
          
          if (isMeaningfulClickable(element)) {
            return element;
          }
          
          var current = element.parentElement;
          var depth = 0;
          var maxDepth = 5;
          
          while (current && depth < maxDepth) {
            depth++;
            
            if (isMeaningfulClickable(current)) {
              return current;
            }
            
            current = current.parentElement;
          }
          
          return element;
        }
        
        function isMeaningfulClickable(element) {
          var hasTestId = element.getAttribute("data-test-id") || element.getAttribute("data-testid");
          var hasAriaLabel = element.getAttribute("aria-label");
          var hasRole = element.getAttribute("role");
          var hasOnClick = element.onclick || element.getAttribute("onclick");
          var hasTabIndex = element.getAttribute("tabindex");
          
          var meaningfulTags = ["BUTTON", "A", "INPUT", "TEXTAREA", "SELECT"];
          var isMeaningfulTag = meaningfulTags.indexOf(element.tagName) !== -1;
          
          var hasMeaningfulAttributes = hasTestId || hasAriaLabel || hasRole || hasOnClick || hasTabIndex;
          
          var style = window.getComputedStyle(element);
          var hasPointerCursor = style.cursor === "pointer";
          
          var meaningful = isMeaningfulTag || hasMeaningfulAttributes || hasPointerCursor;
          
          return meaningful;
        }

        var clickableVisibleElements = [];
        var clickableHiddenElements = [];
        var elementIndex = initialElementIndex;
        var processedIntendedTargets = [];

        var allElements = document.querySelectorAll("div, span, a, button, input, textarea, li");
        
        for (var i = 0; i < allElements.length; i++) {
          var element = allElements[i];
          stats.totalScanned++;

          var truncatedOuterHTML = truncateSvgPaths(element.outerHTML);
          var previousVisibleHtml = clickableVisibleElements.length > 0 ? clickableVisibleElements[clickableVisibleElements.length - 1] : '';
          if (previousVisibleHtml && previousVisibleHtml.includes(truncatedOuterHTML)) {
            stats.duplicatesSkipped++;
            continue;
          }

          var previousHiddenHtml = clickableHiddenElements.length > 0 ? clickableHiddenElements[clickableHiddenElements.length - 1] : '';
          if (previousHiddenHtml && previousHiddenHtml.includes(truncatedOuterHTML)) {
            stats.duplicatesSkipped++;
            continue;
          }
          
          if (isClickableElement(element)) {
            if (isVisible(element)) {
              if (containsChildOnTop(element)) {
                var intendedTarget = findIntendedClickTarget(element);
                
                var alreadyProcessed = false;
                for (var j = 0; j < processedIntendedTargets.length; j++) {
                  if (processedIntendedTargets[j] === intendedTarget) {
                    alreadyProcessed = true;
                    break;
                  }
                }
                
                if (alreadyProcessed) {
                  stats.duplicatesSkipped++;
                  continue;
                }
                
                processedIntendedTargets.push(intendedTarget);
                
                if (intendedTarget !== element) {
                  stats.elementsPromoted++;
                }
                
                stats.intendedTargetsProcessed++;
                
                highlightElement(intendedTarget, elementIndex);
                clickableVisibleElements.push(elementHtmlWithIndex(intendedTarget, elementIndex));
                elementIndex++;
                stats.successfullyProcessed++;
              } else {
                clickableHiddenElements.push(truncatedOuterHTML);
                stats.notOnTopSkipped++;
              }
            } else {
              clickableHiddenElements.push(truncatedOuterHTML);
              stats.hiddenSkipped++;
            }
          } else {
            stats.nonClickableSkipped++;
          }
        }

        var inputElements = getAllInputs();
        for (var i = 0; i < inputElements.length; i++) {
          var elem = inputElements[i];
          
          if (isVisible(elem)) {
            highlightElement(elem, elementIndex);
            clickableVisibleElements.push(elementHtmlWithIndex(elem, elementIndex));
            elementIndex++;
            stats.inputsProcessed++;
          } else {
            clickableHiddenElements.push(truncateSvgPaths(elem.outerHTML));
            stats.inputsHidden++;
          }
        }
      
        return {
          visibleElements: clickableVisibleElements.join('\\n'),
          hiddenElements: clickableHiddenElements.join('\\n'),
          debugInfo: { 
            totalElements: allElements.length,
            visibleClickable: clickableVisibleElements.length,
            hiddenClickable: clickableHiddenElements.length,
            stats: stats
          }
        };
      })()
    `);
    
    console.log('✅ DOM evaluation completed successfully');
    
    return result as ClickableDomResult;
  } catch (error: any) {
    console.error('❌ Failed to get clickable elements:', error.message);
    console.error('📍 Error occurred on page:', page.url());
    throw error;
  }
};