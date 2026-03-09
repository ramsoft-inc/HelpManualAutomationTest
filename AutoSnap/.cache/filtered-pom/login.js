import playwrightConfig from './playwright.config.js';

const fs = require('fs');

import { expect } from '@playwright/test';
import { TIMEOUT_IN_MSEC1 } from './timeouts.js';
export class Login {
	constructor(page) {
		this.page = page;
	}

	async loginOmegaAI() {
		await this.page.context().clearCookies(); // Clear all cookies
		await this.page.goto(playwrightConfig.logInOaiUrl, { waitUntil: 'load' });

		// Optionally clear sessionStorage and localStorage too
		await this.page.evaluate(() => {
			sessionStorage.clear();
			localStorage.clear();
		});

		// Now login fresh
		await this.page.locator('[type="email"]').fill(playwrightConfig.userName);
		await this.page.getByRole('button', { name: 'CONTINUE' }).click();
		await this.page.getByLabel('Password').fill(playwrightConfig.password);
		await this.page.locator('[type="submit"]').click();
		await this.page.waitForResponse('**/fhir/ImagingStudyWorklist/elk?**');
	}

	async loginOmegaAiwithMicrosoftAccount() {
		await this.page.goto(playwrightConfig.logInOaiUrl);
		await this.page.locator('[type="email"]').fill(playwrightConfig.userName1);
		await this.page.getByRole('button', { name: 'CONTINUE' }).click();
		await this.page.getByRole('textbox', { name: 'Enter the password for' }).fill(playwrightConfig.password1);
		await this.page.getByRole('button', { name: 'Sign in' }).click();
		await this.page.getByRole('button', { name: 'Yes' }).click();
		await this.page.waitForResponse('**/fhir/ImagingStudyWorklist/elk?**');
	}

	async getAccessTokenForBreezeAccount() {
		await this.page.goto(playwrightConfig.logInOaiUrl);
		await this.page.locator('[type="email"]').fill(playwrightConfig.breezeUser);
		await this.page.getByRole('button', { name: 'CONTINUE' }).click();
		await this.page.getByRole('textbox', { name: 'Enter the password for' }).fill(playwrightConfig.breezePassword);
		await this.page.getByRole('button', { name: 'Sign in' }).click();
		await this.page.getByRole('button', { name: 'Yes' }).click();
		// Wait for the ValueSet API call that includes the Authorization token
		const tokenRequest = await this.page.waitForRequest(
			req => req.url().includes('/fhir/ValueSet') && req.headers()['authorization']
		);
		// Extract Bearer token from Authorization header
		const accessToken = tokenRequest.headers()['authorization'].replace(/^Bearer\s+/i, ''); // e.g., "Bearer eyJ..."
		return accessToken;
	}

	async loginBlume() {
		await this.page.goto(playwrightConfig.baseBlumeURL);

		// await this.page.locator('[data-testid="EmailOutlinedIcon"]').click();
		await this.page.locator('[type="email"]').fill(playwrightConfig.userName);
		await this.page.locator('[id="loginButton"]').click();
		await this.page.getByLabel('Password').fill(playwrightConfig.password);
		// Intercept API requests
		await this.page.route('**/blume-api/User/SignalRConnect*', route => route.continue());
		await this.page.route('**/blume-api/User/loggeduser*', route => route.continue());
		await this.page.locator('[type="submit"]').click();

		// Wait for API calls to be successful
		await this.page.waitForResponse(
			response => response.url().includes('blume-api/User/loggeduser') && response.status() === 200
		);
		await this.page.waitForResponse(
			response => response.url().includes('blume-api/User/SignalRConnect') && response.status() === 200
		);

		// Verify the profileIcon is visible with timeout
		const profileIcon = this.page.locator('[data-cy="sidebar-profile"]');
		await expect(profileIcon).toBeVisible({ timeout: TIMEOUT_IN_MSEC1 });

		// Wait for a while (not recommended in real tests, replace with a proper wait condition if possible)
		await this.page.waitForTimeout(6000);
	}

	// Login Blume with email and password
	async loginBlumeWithEmailAndPassword(email, password) {
		await this.page.goto(playwrightConfig.baseBlumeURL);
		await this.page.locator('[type="email"]').fill(email);
		await this.page.locator('[id="loginButton"]').click();
		await this.page.getByLabel('Password').fill(password);
		await this.page.locator('[type="submit"]').click();

		// Wait for API calls to be successful
		await this.page.waitForResponse(
			response => response.url().includes('blume-api/User/loggeduser') && response.status() === 200
		);
		await this.page.waitForResponse(
			response => response.url().includes('blume-api/User/SignalRConnect') && response.status() === 200
		);

		// Wait for the profile icon to be visible
		const profileIcon = this.page.locator('[data-cy="sidebar-profile"]');
		await expect(profileIcon).toBeVisible({ timeout: TIMEOUT_IN_MSEC1 });
		await this.page.waitForTimeout(6000);
	}

	async loginOmegaAIUser04() {
		await this.page.goto(playwrightConfig.logInOaiUrl);
		await this.page.locator('[type="email"]').fill(playwrightConfig.userName2);
		await this.page.getByRole('button', { name: 'CONTINUE' }).click();
		await this.page.getByLabel('Password').fill(playwrightConfig.password2);
		await this.page.locator('[type="submit"]').click();
		await this.page.waitForResponse('**/fhir/ImagingStudyWorklist/elk?**');
	}

	async loginOmegaAIUserReferring01() {
		await this.page.goto(playwrightConfig.logInOaiUrl);
		await this.page.locator('[type="email"]').fill(playwrightConfig.userName3);
		await this.page.getByRole('button', { name: 'CONTINUE' }).click();
		await this.page.getByLabel('Password').fill(playwrightConfig.password3);
		await this.page.locator('[type="submit"]').click();
		await this.page.waitForResponse('**/fhir/ImagingStudyWorklist/elk?**');
	}

	async logoutOmegaAI() {
		await this.page.locator('[data-cy="sidebar-profile"]').click();
		await this.page.getByRole('button', { name: 'LOGOUT' }).click();
	}

	async logoutBlume() {
		const profileIcon = this.page.locator('[data-cy="sidebar-profile"]');
		await profileIcon.waitFor({ state: 'visible', timeout: 10000 });
		await profileIcon.scrollIntoViewIfNeeded();

		await profileIcon.hover({ force: true });

		const logoutOption = this.page.getByRole('menuitem', { name: 'Logout' });
		await logoutOption.waitFor({ state: 'visible', timeout: 5000 });
		await logoutOption.click();

		const logoutButton = this.page.getByRole('button', { name: 'Log out' });
		await logoutButton.waitFor({ state: 'visible', timeout: 5000 });
		await logoutButton.click();
	}
};
