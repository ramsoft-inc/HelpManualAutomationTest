import test from "@playwright/test";
import pkg from "../src/ai_utils_enhanced";
const { AIUtilsEnhanced } = pkg;
import pkg2 from "../src/page_helpers_enhanced";
const { executeCodeEnhanced, getHierarchicalElements, takeElementScreenshot } = pkg2;

test("Enhanced Flow Test", async ({ page }) => {
  console.log("🚀 Starting Enhanced Flow Test...");
  
  // Navigate to a test page
  await page.goto("https://example.com");
  console.log("📍 Navigated to:", page.url());
  
  try {
    // Test 1: Get hierarchical elements
    console.log("\n🔍 Getting hierarchical elements...");
    const hierarchy = await getHierarchicalElements(page);
    console.log("✅ Hierarchical structure created:");
    console.log(`   - Total elements: ${hierarchy.totalElements}`);
    console.log(`   - Clickable elements: ${hierarchy.clickableElements}`);
    console.log(`   - Visible elements: ${hierarchy.visibleElements}`);
    console.log(`   - Top-level containers: ${hierarchy.elements.length}`);
    
    // Show some sample elements
    if (hierarchy.elements.length > 0) {
      console.log("\n📋 Sample elements from hierarchy:");
      hierarchy.elements.slice(0, 3).forEach((element, index) => {
        console.log(`   ${index + 1}. ${element.tag} (${element.id})`);
        console.log(`      - Clickable: ${element.isClickable}`);
        console.log(`      - Children: ${element.children.length}`);
        console.log(`      - Text: ${element.text?.substring(0, 50) || 'N/A'}`);
      });
    }
    
    // Test 2: Take screenshots of clickable elements
    console.log("\n📸 Taking screenshots of clickable elements...");
    for (const element of hierarchy.elements.slice(0, 2)) { // Test first 2 elements
      if (element.isClickable) {
        try {
          console.log(`   📸 Taking screenshot for: ${element.id}`);
          const screenshotPath = await takeElementScreenshot(page, element.id, true);
          console.log(`   ✅ Screenshot saved: ${screenshotPath}`);
        } catch (error) {
          console.warn(`   ⚠️ Failed to screenshot ${element.id}:`, error);
        }
      }
    }
    
    // Test 3: Enhanced AI Utils
    console.log("\n🤖 Testing enhanced AI Utils...");
    const aiUtils = new AIUtilsEnhanced(page);
    console.log("✅ Enhanced AI Utils instance created");
    
    // Test 4: Generate enhanced prompt
    console.log("\n🧠 Testing enhanced prompt generation...");
    const testCode = `await page.locator('h1').screenshot({ path: 'img/test-heading.png' });`;
    const enhancedPrompt = await aiUtils.generateEnhancedPrompt(
      "", // No base64 screenshot
      testCode,
      "test-enhanced.png",
      undefined, // No refinement context
      "This is a test thinking context to demonstrate the enhanced AI capabilities with hierarchical structure"
    );
    console.log("✅ Enhanced prompt generated");
    console.log("   - Prompt length:", enhancedPrompt.length);
    
    // Test 5: Execute code with enhanced interception
    console.log("\n⚡ Testing enhanced code execution...");
    const testCodeResponse = {
      code: `await page.locator('h1').screenshot({ path: 'img/test-heading.png' });`,
      thinking: "Take a screenshot of the main heading to demonstrate the enhanced screenshot capabilities with hierarchical understanding"
    };
    
    await executeCodeEnhanced(page, testCodeResponse);
    console.log("✅ Enhanced code execution completed");
    
    // Test 6: Compare with original AI Utils
    console.log("\n🔄 Comparing with original AI Utils...");
    const originalPrompt = await aiUtils.generatePlaywrightScreenshotFunction(
      "",
      testCode,
      "test-original.png",
      undefined,
      "This is a test thinking context for original AI Utils"
    );
    console.log("✅ Original AI Utils prompt generated");
    console.log("   - Original prompt length:", originalPrompt.length);
    console.log("   - Enhanced prompt length:", enhancedPrompt.length);
    
    console.log("\n🎉 Enhanced flow test completed successfully!");
    console.log("📁 Check the generated files:");
    console.log("   - ./screenshots/ - Element screenshots");
    console.log("   - ./highlighted_screenshots/ - Highlighted versions");
    console.log("   - ./img/ - Generated test images");
    
  } catch (error) {
    console.error("❌ Enhanced flow test failed:", error);
    throw error;
  }
}); 