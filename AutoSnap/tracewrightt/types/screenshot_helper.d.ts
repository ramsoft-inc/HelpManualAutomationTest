import { Page } from '@playwright/test';
/**
 * Tries to execute a screenshot command up to MAX_RETRIES times, with optional AI refinement.
 * If all attempts fail, throws (no full-page fallback).
 *
 * @param {string} cmd The full Playwright command string to execute.
 *   e.g., "await page.getByText('Submit').screenshot({ path: 'submit-button.png' })"
 * @param {any} page The Playwright page object.
 */
export declare function forceScreenshotWithRetries(cmd: string, page: Page, aiUtils?: any): Promise<void>;
