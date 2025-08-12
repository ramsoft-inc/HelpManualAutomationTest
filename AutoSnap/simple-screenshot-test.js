
// Simple test script to verify screenshot functionality
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Helper function to ensure forward slashes in paths
function fixPath(filePath) {
  return filePath.replace(/\\/g, '/');
}

// A function that takes screenshots with proper path handling
async function takeScreenshots(page, baseName) {
  console.log('Taking screenshots...');
  
  // Create Images directory if it doesn't exist
  const imagesDir = path.join(process.cwd(), 'Images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log('📁 Created Images directory');
  }
  
  try {
    // Stock version - full page screenshot
    const stockPath = fixPath(path.join('Images', `${baseName}_S.png`));
    console.log('📸 Taking stock screenshot:', stockPath);
    await page.screenshot({ path: stockPath, fullPage: true });
    
    // Enhanced version - focused screenshot 
    const enhancedPath = fixPath(path.join('Images', `${baseName}_E.png`));
    console.log('📸 Taking enhanced screenshot:', enhancedPath);
    
    // Find a good container to screenshot - search box or main content
    const selectors = [
      '[data-testid="search-dialog"]',
      '.search-items-container',
      'main',
      'article',
      '.MuiContainer-root'
    ];
    
    // Try each selector and use the first one that works
    let screenshotTaken = false;
    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`Found element with selector: ${selector}`);
          await element.screenshot({ path: enhancedPath });
          screenshotTaken = true;
          break;
        }
      } catch (err) {
        console.log(`Selector ${selector} not found or error: ${err.message}`);
      }
    }
    
    // If no container was found, fall back to full page screenshot
    if (!screenshotTaken) {
      console.log('No suitable container found, using full page screenshot');
      await page.screenshot({ path: enhancedPath });
    }
    
    console.log('✅ Screenshots taken successfully!');
  } catch (error) {
    console.error('❌ Error taking screenshots:', error.message);
  }
}

// Main script
(async () => {
  console.log('🚀 Starting screenshot test...');
  
  // Launch browser
  const browser = await chromium.launch({
    headless: false
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to a page
    await page.goto('https://team-meta-apim.azure-api.net/');
    console.log('📄 Page loaded');
    
    // Login
    try {
      await page.getByPlaceholder('Enter your email address here').fill('ramsoftlocalteamprime@gmail.com', { timeout: 30000 });
      await page.getByRole('button', { name: 'Continue' }).click({ timeout: 30000 });
      await page.waitForTimeout(2000);
      await page.getByLabel('Password').fill('225588', { timeout: 30000 });
      await page.getByRole('button', { name: 'Continue' }).click({ timeout: 30000 });
      await page.waitForTimeout(5000);
      console.log('✅ Login successful');
    } catch (error) {
      console.warn('⚠️ Login may have failed:', error.message);
    }
    
    // Take screenshots of the main page
    await takeScreenshots(page, 'main-page');
    
    // Click the search box
    try {
      await page.locator('#top-search').click({ timeout: 20000 });
      await page.waitForTimeout(1000);
      await takeScreenshots(page, 'search-dropdown');
    } catch (error) {
      console.warn('⚠️ Search click failed:', error.message);
    }
    
    // Type a search term
    try {
      await page.locator('#top-search').fill('John');
      await page.waitForTimeout(1000);
      await takeScreenshots(page, 'search-results');
    } catch (error) {
      console.warn('⚠️ Search typing failed:', error.message);
    }
    
    // Press Enter to search
    try {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
      await takeScreenshots(page, 'search-page');
    } catch (error) {
      console.warn('⚠️ Search Enter press failed:', error.message);
    }
    
    console.log('✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    console.log('Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
})();
