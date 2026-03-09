import { Page } from '@playwright/test';

/**
 * Tries to execute a screenshot command up to MAX_RETRIES times, with optional AI refinement.
 * If all attempts fail, throws the last error (no full-page fallback).
 *
 * @param {string} cmd The full Playwright command string to execute.
 *   e.g., "await page.getByText('Submit').screenshot({ path: 'submit-button.png' })"
 * @param {any} page The Playwright page object.
 */
export async function forceScreenshotWithRetries(cmd: string, page: Page, aiUtils?: any): Promise<void> {
  const MAX_RETRIES = 1;
  let lastError: Error | null = null;
  const fs = require('fs');
  const path = require('path');

  // Extract the screenshot path from the command string for logging.
  const pathMatch = cmd.match(/path:\s*['"]([^'"]+)['"]/);
  let screenshotPath = pathMatch ? pathMatch[1] : 'screenshot.png';
  
  // Modify the command to use absolute img path if aiUtils is available and has a current markdown file
  let modifiedCmd = cmd;
  if (aiUtils) {
    console.log(`🔍 aiUtils available, checking for current markdown path...`);
    console.log(`🔍 aiUtils.getCurrentMdFilePath exists: ${!!aiUtils.getCurrentMdFilePath}`);
    console.log(`🔍 aiUtils.getImgPath exists: ${!!aiUtils.getImgPath}`);
    
    try {
      const currentMdPath = aiUtils.getCurrentMdFilePath ? aiUtils.getCurrentMdFilePath() : null;
      const imgPath = aiUtils.getImgPath ? aiUtils.getImgPath() : null;
      
      console.log(`🔍 Current MD path: ${currentMdPath}`);
      console.log(`🔍 Img path: ${imgPath}`);
      
      // Respect DISABLE_IMG flag
      const disableImg = process.env.DISABLE_IMG === 'true';
      if (currentMdPath && imgPath && pathMatch && !disableImg) {
        const originalPath = pathMatch[1];
        
        // Only modify if the path is not already absolute
        if (!originalPath.includes(':') && !originalPath.startsWith('/')) {
          // Extract just the filename from the path
          const filename = originalPath.split('/').pop()?.split('\\').pop() || originalPath;
          
          // Create the absolute path to img folder
          const absoluteImgPath = imgPath.replace(/\\/g, '/') + '/' + filename;
          
          // Replace the path in the command
          modifiedCmd = cmd.replace(pathMatch[0], `path: "${absoluteImgPath}"`);
          screenshotPath = absoluteImgPath;
          
          console.log(`📁 Modified screenshot path: ${originalPath} → ${absoluteImgPath}`);
        } else {
          console.log(`🔍 Path not modified - already absolute or starts with /: ${originalPath}`);
        }
      } else {
        console.log(`⚠️ Cannot modify path - missing requirements:`);
        console.log(`   currentMdPath: ${!!currentMdPath}`);
        console.log(`   imgPath: ${!!imgPath}`);
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

      // Append repo-relative screenshot path to a changed files list for CI commit step
      try {
        const repoRoot = process.cwd();
        const isAbsolute = typeof screenshotPath === 'string' && (screenshotPath.startsWith('/') || /:\\|:\//.test(screenshotPath));
        // If path is relative, resolve it against the current markdown file directory when available
        let absolutePath = String(screenshotPath);
        if (!isAbsolute) {
          const currentMdPath = aiUtils && aiUtils.getCurrentMdFilePath ? aiUtils.getCurrentMdFilePath() : null;
          const baseDir = currentMdPath ? path.dirname(currentMdPath) : repoRoot;
          absolutePath = path.resolve(baseDir, absolutePath);
        }
        const relative = path.relative(repoRoot, absolutePath).replace(/\\/g, '/');
        const listPath = path.join(repoRoot, 'changed-files-screenshots.txt');
        fs.appendFileSync(listPath, `${relative}\n`, { encoding: 'utf8' });
        console.log(`📝 Appended screenshot to list: ${relative}`);
      } catch (appendErr) {
        console.warn('⚠️ Could not append screenshot path to list:', appendErr);
      }
      
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
        console.log('⚠️ AI could not generate a better command.');
      }
    } catch (aiError) {
      console.warn('⚠️ Error during AI refinement:', aiError);
    }
  }

  console.error(`🚨 All ${MAX_RETRIES} attempt(s) failed. Throwing last error.`);
  throw lastError ?? new Error('Screenshot command failed');
}