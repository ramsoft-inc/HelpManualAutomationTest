import { Page } from '@playwright/test';

/**
 * Tries to execute a screenshot command up to 3 times.
 * If all attempts fail, it takes a full-page screenshot as a final fallback.
 *
 * @param {string} cmd The full Playwright command string to execute.
 *   e.g., "await page.getByText('Submit').screenshot({ path: 'submit-button.png' })"
 * @param {any} page The Playwright page object.
 */
export async function forceScreenshotWithRetries(cmd: string, page: Page, aiUtils?: any): Promise<void> {
  const MAX_RETRIES = 1;
  let lastError: Error | null = null;

  // Extract the screenshot path from the command string for logging and fallback use.
  const pathMatch = cmd.match(/path:\s*['"]([^'"]+)['"]/);
  const screenshotPath = pathMatch ? pathMatch[1] : 'final_fallback.png';

  // Loop to try the command up to MAX_RETRIES times.
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🎬 Attempt ${attempt} of ${MAX_RETRIES} to take element screenshot: ${screenshotPath}`);
      
      // Create and run the function from the command string.
      // This is the most direct way to "force" the command to execute.
      const commandRunner = new Function('page', `return (async () => { ${cmd} })()`);
      await commandRunner(page);

      // If the command succeeds, we log it and exit the function immediately.
      console.log(`✅ Success on attempt ${attempt}! Screenshot saved to ${screenshotPath}`);
      return; 

    } catch (error: any) {
      // If it fails, we store the error and log the failed attempt.
      lastError = error;
      console.warn(`❌ Attempt ${attempt} failed: ${error.message}`);

      // Optional: Wait for a moment before the next retry, but not after the last attempt.
      if (attempt < MAX_RETRIES) {
        await page.waitForTimeout(500); // Wait 0.5 seconds before trying again.
      }
    }
  }

  // If all attempts failed, try to refine the command with AI if aiUtils is provided
  if (aiUtils) {
    try {
      console.log('🔄 Attempting to refine screenshot command with AI...');
      
      // Create a refinement context with the error information
      const refinementContext = {
        errorMessage: lastError?.message || 'Unknown error',
        originalCommand: cmd,
        screenshotPath: screenshotPath
      };
      
      // Generate a refined command using AI
      const refinedCommand = await aiUtils.generateEnhancedPrompt(
        '', // No base64 screenshot needed for refinement
        cmd, 
        screenshotPath,
        refinementContext
      );
      
      // Check if we got a valid refined command
      if (refinedCommand && refinedCommand !== cmd && refinedCommand.includes('screenshot')) {
        console.log('✨ AI generated a refined screenshot command. Trying it...');
        
        // Try the refined command
        try {
          const refinedRunner = new Function('page', `return (async () => { ${refinedCommand} })()`);
          await refinedRunner(page);
          console.log(`✅ Refined command succeeded! Screenshot saved to ${screenshotPath}`);
          return;
        } catch (refinedError: any) {
          console.warn(`❌ Refined command failed: ${refinedError.message}`);
          // Continue to fallback
        }
      } else {
        console.log('⚠️ AI could not generate a better command. Falling back to full page screenshot.');
      }
    } catch (aiError) {
      console.warn('⚠️ Error during AI refinement:', aiError);
      // Continue to fallback
    }
  }

  // If all attempts and refinement failed, execute the final fallback plan.
  console.error(`🚨 All ${MAX_RETRIES} attempts failed. Taking a full-page screenshot as a fallback.`);

  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`👍 Fallback full-page screenshot saved to: ${screenshotPath}`);
  } catch (fallbackError) {
    // This is the absolute worst-case scenario.
    console.error(`💥 CRITICAL: The final fallback screenshot also failed!`, fallbackError);
    // Throw the last known error from the element screenshot attempt.
    throw lastError;
  }
}