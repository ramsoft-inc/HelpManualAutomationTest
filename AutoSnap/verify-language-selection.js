// ESM script to launch the same browser profile/options as the enhanced flow
// and execute the language selection steps to verify they fire properly.

import { chromium, devices } from 'playwright';

// Minimal language name→code mapping for quick testing
const SIMPLE_LANGS = {
  English: 'en',
  Spanish: 'es',
  French: 'fr',
  Hindi: 'hi',
  Portuguese: 'pt'
};

function resolveLanguage(input) {
  if (!input) return { name: 'Spanish', code: 'es' }; // default for testing
  const lower = String(input).trim().toLowerCase();
  // Match by code
  for (const [name, code] of Object.entries(SIMPLE_LANGS)) {
    if (code.toLowerCase() === lower) return { name, code };
  }
  // Match by name
  for (const name of Object.keys(SIMPLE_LANGS)) {
    if (name.toLowerCase() === lower) return { name, code: SIMPLE_LANGS[name] };
  }
  // Fallback to code
  return { name: input, code: input };
}

async function selectLanguage(page, languageInput) {
  const { name: languageName, code: langCode } = resolveLanguage(languageInput);

  // Stabilize page first
  try {
    await page.waitForLoadState('networkidle', { timeout: 20000 });
  } catch {}
  await page.waitForTimeout(3000);

  // Open avatar/user menu
  try {
    const avatarByTestId = page.locator('[data-testid^="Avatar "]').first();
    await avatarByTestId.waitFor({ state: 'visible', timeout: 15000 });
    await avatarByTestId.click({ force: true });
    console.log('✅ Avatar clicked successfully using Avatar');
  } catch {
    const avatarContainer = page.locator('[aria-label]:has(.MuiAvatar-root)').first();
    await avatarContainer.waitFor({ state: 'visible', timeout: 20000 });
    await avatarContainer.click({ force: true });
    console.log('✅ Avatar clicked successfully using aria-label');
  }

  // Wait for menu and open User Settings
  await page.waitForTimeout(2000);
  const userSettingsButton = page.locator('button.MuiButton-outlinedPrimary').nth(-2);
  await userSettingsButton.waitFor({ state: 'visible', timeout: 15000 });
  await userSettingsButton.click();

  // Wait for settings to load
  try {
    await page.waitForLoadState('networkidle', { timeout: 20000 });
  } catch {}
  await page.waitForTimeout(3000);

  // Open language dropdown
  await page.getByTestId('LanguageIcon').waitFor({ state: 'visible', timeout: 15000 });
  await page.getByTestId('LanguageIcon').click({ force: true });

  // Wait for options and pick by data-value
  await page.locator('li[role="option"][data-value]').first().waitFor({ state: 'visible', timeout: 10000 });
  const languageOption = page.locator(`li[role="option"][data-value="${langCode}"]`);
  const count = await languageOption.count();
  if (count === 0) {
    // Close dropdown and throw
    await page.keyboard.press('Escape');
    throw new Error(`Language option not found for code: ${langCode}`);
  }
  await languageOption.click({ timeout: 15000 });

  // Allow UI to update
  try {
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  } catch {}
  await page.waitForTimeout(3000);

  // Navigate to worklist using provided selector snippet (explicit request)
  try {
    await page.locator('.nav-section a:has(svg[name="home"])').first().click({ timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(3000);
  } catch (e) {
    console.warn('⚠️  Home nav click snippet failed:', e?.message || e);
  }

  console.log(`✅ Language changed to: ${languageName} (${langCode})`);
}

async function main() {
  const isCI = !!process.env.CI;
  const appUrl = process.env.APP_URL || 'https://team-meta-apim.azure-api.net/';
  // CLI: node AutoSnap/verify-language-selection.js [language]
  const langArg = process.argv[2];

  const launchOptions = {
    headless: isCI ? true : false,
    args: [
      '--disable-notifications',
      '--use-fake-ui-for-media-stream',
      '--disable-features=PermissionChip,PermissionPrompt',
      '--disable-gpu',
      '--font-render-hinting=none',
      '--disable-web-security',
      '--disable-site-isolation-trials',
      '--remote-debugging-port=9222',
      '--window-size=1280,800'
    ]
  };
  if (!isCI) {
    // Match enhanced flow: use Chrome channel locally, Chromium in CI
    // @ts-ignore
    launchOptions.channel = 'chrome';
  }

  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({
    ...devices['Desktop Chrome'],
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 800 },
    screen: { width: 1280, height: 800 },
    // Non-standard but present in enhanced flow; harmless if ignored
    timeout: 200000
  });

  await context.grantPermissions([
    'geolocation',
    'notifications',
    'camera',
    'microphone'
  ], { origin: 'https://team-meta-apim.azure-api.net' });

  const page = await context.newPage();
  page.setDefaultTimeout(120000);

  try {
    console.log('🔗 Opening application...');
    await page.goto(appUrl, { timeout: 600000 });

    // Optional: wait a bit for app shell
    try { await page.waitForLoadState('networkidle', { timeout: 30000 }); } catch {}
    await page.waitForTimeout(2000);

    // Perform login (same selectors/flow as enhanced script) unless SKIP_LOGIN is set
    if (!process.env.SKIP_LOGIN) {
      const loginEmail = process.env.LOGIN_EMAIL || 'ramsoftlocalteamprime@gmail.com';
      const loginPassword = process.env.LOGIN_PASSWORD || '225588';

      console.log('📧 Performing login...');
      await page.getByPlaceholder('Enter your email address here').fill(loginEmail, { timeout: 60000 });
      await page.getByRole('button', { name: 'Continue' }).click({ timeout: 60000 });
      try { await page.waitForLoadState('networkidle', { timeout: 30000 }); } catch {}
      await page.getByLabel('Password').fill(loginPassword, { timeout: 60000 });
      await page.getByRole('button', { name: 'Continue' }).click({ timeout: 60000 });
      console.log('⏳ Waiting for application to load after login...');
      try { await page.waitForLoadState('networkidle', { timeout: 60000 }); } catch {}
      try { await page.waitForLoadState('domcontentloaded', { timeout: 60000 }); } catch {}
      await page.waitForTimeout(3000);
    } else {
      console.log('⏭️  SKIP_LOGIN set; continuing without login.');
    }

    // Execute language selection
    await selectLanguage(page, langArg);

    console.log('✅ Verification script completed');
  } catch (err) {
    console.error('❌ Verification failed:', err?.message || err);
    process.exitCode = 1;
  } finally {
    await context.close();
    await browser.close();
  }
}

main();


