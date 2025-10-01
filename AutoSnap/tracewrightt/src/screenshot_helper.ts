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
  let screenshotPath = pathMatch ? pathMatch[1] : 'final_fallback.png';
  
  // Modify the command to use absolute img_as path if aiUtils is available and has a current markdown file
  let modifiedCmd = cmd;
  if (aiUtils) {
    console.log(`🔍 aiUtils available, checking for current markdown path...`);
    console.log(`🔍 aiUtils.getCurrentMdFilePath exists: ${!!aiUtils.getCurrentMdFilePath}`);
    console.log(`🔍 aiUtils.getImgAsPath exists: ${!!aiUtils.getImgAsPath}`);
    
    try {
      const currentMdPath = aiUtils.getCurrentMdFilePath ? aiUtils.getCurrentMdFilePath() : null;
      const imgAsPath = aiUtils.getImgAsPath ? aiUtils.getImgAsPath() : null;
      
      console.log(`🔍 Current MD path: ${currentMdPath}`);
      console.log(`🔍 Img_as path: ${imgAsPath}`);
      
      // Respect DISABLE_IMG_AS flag
      const disableImgAs = process.env.DISABLE_IMG_AS === 'true';
      if (currentMdPath && imgAsPath && pathMatch && !disableImgAs) {
        const originalPath = pathMatch[1];
        
        // Only modify if the path is not already absolute
        if (!originalPath.includes(':') && !originalPath.startsWith('/')) {
          // Extract just the filename from the path
          const filename = originalPath.split('/').pop()?.split('\\').pop() || originalPath;
          
          // Create the absolute path to img_as folder
          const absoluteImgAsPath = imgAsPath.replace(/\\/g, '/') + '/' + filename;
          
          // Replace the path in the command
          modifiedCmd = cmd.replace(pathMatch[0], `path: "${absoluteImgAsPath}"`);
          screenshotPath = absoluteImgAsPath;
          
          console.log(`📁 Modified screenshot path: ${originalPath} → ${absoluteImgAsPath}`);
        } else {
          console.log(`🔍 Path not modified - already absolute or starts with /: ${originalPath}`);
        }
      } else {
        console.log(`⚠️ Cannot modify path - missing requirements:`);
        console.log(`   currentMdPath: ${!!currentMdPath}`);
        console.log(`   imgAsPath: ${!!imgAsPath}`);
        console.log(`   pathMatch: ${!!pathMatch}`);
      }
    } catch (error) {
      console.warn('⚠️ Could not modify screenshot path:', error);
      // Continue with original command
    }
  } else {
    console.log(`⚠️ No aiUtils available for path modification`);
  }

  // Ensure { force: true } is added to all screenshot commands to prevent timeouts
  if (!modifiedCmd.includes('force:') && !modifiedCmd.includes('force=')) {
    // Add force: true to screenshot commands that don't already have it
    modifiedCmd = modifiedCmd.replace(
      /\.screenshot\(\s*{\s*([^}]*?)\s*}\s*\)/g,
      (match, inner) => {
        // Add force: true to the options
        const trimmedInner = inner.trim();
        const forceOption = trimmedInner ? ', force: true' : 'force: true';
        return `.screenshot({ ${trimmedInner}${forceOption} })`;
      }
    );
    
    // Handle cases where screenshot has no options object
    modifiedCmd = modifiedCmd.replace(
      /\.screenshot\(\s*\)/g,
      '.screenshot({ force: true })'
    );
    
    console.log(`🔧 Added force: true to screenshot command`);
  }

  // Loop to try the command up to MAX_RETRIES times.
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🎬 Attempt ${attempt} of ${MAX_RETRIES} to take element screenshot: ${screenshotPath}`);
      
      // Create and run the function from the command string.
      // This is the most direct way to "force" the command to execute.
      const commandRunner = new Function('page', `return (async () => { ${modifiedCmd} })()`);
      await commandRunner(page);

      // If the command succeeds, we log it and update markdown immediately
      console.log(`✅ Success on attempt ${attempt}! Screenshot saved to ${screenshotPath}`);
      
      // Update markdown file path immediately after successful screenshot
      if (aiUtils && aiUtils.updateSingleImagePath) {
        try {
          console.log(`📝 TRIGGERING IMMEDIATE MARKDOWN UPDATE for successful screenshot: ${screenshotPath}`);
          await aiUtils.updateSingleImagePath(screenshotPath);
          console.log(`✅ IMMEDIATE MARKDOWN UPDATE COMPLETED for: ${screenshotPath}`);
        } catch (updateError) {
          console.warn(`❌ IMMEDIATE MARKDOWN UPDATE FAILED for ${screenshotPath}:`, updateError instanceof Error ? updateError.message : String(updateError));
          // Don't fail the screenshot operation due to markdown update errors
        }
      } else {
        console.warn(`⚠️  No aiUtils or updateSingleImagePath method available for immediate update`);
      }
      
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
          
          // Update markdown file path immediately after successful refined screenshot
          if (aiUtils && aiUtils.updateSingleImagePath) {
            try {
              console.log(`📝 TRIGGERING IMMEDIATE MARKDOWN UPDATE for refined screenshot: ${screenshotPath}`);
              await aiUtils.updateSingleImagePath(screenshotPath);
              console.log(`✅ IMMEDIATE MARKDOWN UPDATE COMPLETED for refined screenshot: ${screenshotPath}`);
            } catch (updateError) {
              console.warn(`❌ IMMEDIATE MARKDOWN UPDATE FAILED for refined screenshot ${screenshotPath}:`, updateError instanceof Error ? updateError.message : String(updateError));
            }
          }
          
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
    
    // Update markdown file path immediately after successful fallback screenshot
    if (aiUtils && aiUtils.updateSingleImagePath) {
      try {
        console.log(`📝 TRIGGERING IMMEDIATE MARKDOWN UPDATE for fallback screenshot: ${screenshotPath}`);
        await aiUtils.updateSingleImagePath(screenshotPath);
        console.log(`✅ IMMEDIATE MARKDOWN UPDATE COMPLETED for fallback screenshot: ${screenshotPath}`);
      } catch (updateError) {
        console.warn(`❌ IMMEDIATE MARKDOWN UPDATE FAILED for fallback screenshot ${screenshotPath}:`, updateError instanceof Error ? updateError.message : String(updateError));
      }
    }
  } catch (fallbackError) {
    // This is the absolute worst-case scenario.
    console.error(`💥 CRITICAL: The final fallback screenshot also failed!`, fallbackError);
    // Throw the last known error from the element screenshot attempt.
    throw lastError;
  }
}