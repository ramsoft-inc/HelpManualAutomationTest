import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { AIUtilsEnhanced } from '../dist/esm/tracewrightt/src/ai_utils_enhanced.js';

test('Smart visible containers summary for a local HTML page', async ({ page }) => {
  const htmlPath = process.env.TEST_HTML_PATH;
  if (!htmlPath) {
    test.skip(true, 'Set TEST_HTML_PATH to the absolute path of the local HTML file to test.');
    return;
  }

  const absolutePath = path.isAbsolute(htmlPath) ? htmlPath : path.resolve(process.cwd(), htmlPath);
  const fileUrl = pathToFileURL(absolutePath).toString();

  await page.goto(fileUrl);

  const utils = new AIUtilsEnhanced(page);
  const summary = await utils.getSmartVisibleContainersSummary();

  // Print to console for immediate inspection
  // eslint-disable-next-line no-console
  console.log('\n===== Smart Containers Summary =====\n' + JSON.stringify(summary, null, 2));

  // Persist to disk for deeper analysis
  const outDir = path.resolve(process.cwd(), 'smart-summary');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'summary.json');
  fs.writeFileSync(outFile, JSON.stringify(summary, null, 2), 'utf-8');
});