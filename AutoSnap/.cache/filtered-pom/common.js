// import { fhirExtensionUrls } from '@rs-core/fhir';
// Stub for fhirExtensionUrls (external package @rs-core/fhir not available)
function fhirExtensionUrls() { return null; }
import { ApiWaitUtils } from './apiWaitUtils.js';

// import { menuItems, sidebar } from './sidebar.js';

import { expect, request } from '@playwright/test';
import playwrightConfig from './playwright.config.js';
import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';

export class Common {
	static mailsacAPIKey1 = playwrightConfig.mailsacAPIKey1;
	static mailsacAPIKey2 = playwrightConfig.mailsacAPIKey2;
	static mailsacAPIKey3 = playwrightConfig.mailsacAPIKey3;
	static mailsacAPIKey4 = playwrightConfig.mailsacAPIKey4;
	static mailsacAPIKey5 = playwrightConfig.mailsacAPIKey5;
	static mailsacAPIKey6 = playwrightConfig.mailsacAPIKey6;

	static generateAdultDOB(minAge = 16, maxAge = 90) {
		const today = new Date();
		const maxDOB = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
		const minDOB = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());

		return faker.date.between({ from: minDOB, to: maxDOB }).toISOString().split('T')[0];
	}

	static convertToMMDDYYYY(dateString) {
		const [year, month, day] = dateString.split('-');
		return `${month}/${day}/${year}`;
	}

	/**
	 * Generates a random number within a specified range
	 * @param {number} minValue - Minimum value (inclusive)
	 * @param {number} maxValue - Maximum value (inclusive)
	 * @returns {number} Random integer between minValue and maxValue
	 */
	static generateRandomNumber(minValue, maxValue) {
		return faker.number.int({
			min: minValue,
			max: maxValue,
		});
	}

	/**
	 * Generates a 9-digit random number (useful for SSN, patient IDs)
	 * @returns {number} 9-digit random number
	 */
	static generate9DigitRandNum() {
		return Common.generateRandomNumber(100000000, 999999999);
	}

	/**
	 * Generates a 7-digit random number
	 * @returns {number} 7-digit random number
	 */
	static generate7DigitRandNum() {
		return Common.generateRandomNumber(1111111, 9999999);
	}

	constructor(page, apiContext, testInfo) {
		this.page = page;
		this.apiContext = apiContext;
		this.apiWaitUtils = new ApiWaitUtils(this.page);
		this.testInfo = testInfo;
	}

	async selectOptionFromSingleSelection(comboField, option) {
		await comboField.click();
		await this.page
			.locator(`ul > li`)
			.filter({ hasText: new RegExp(option) })
			.click();
	}

	async selectOptionFromSingleSelectionSuggestion(comboField, option) {
		await comboField.click();
		await comboField.clear();
		await comboField.pressSequentially(option);
		await this.page.getByRole('option', { name: option }).first().click();
	}

	buildSearchPattern(searchText, flag = 'g') {
		return new RegExp(`^${searchText}$`, flag);
	}

	async postResource(resourceName, payload, tokenObj, isBundle) {
		if (!tokenObj || !resourceName || !payload) {
			return;
		}

		const randomNum = Math.floor(Math.random() * (9999 - 1111 + 1)) + 1111;
		fs.writeFileSync(`${resourceName}PostPayload${randomNum}.json`, JSON.stringify(payload, null, 2));

		const urlLastPart = isBundle ? 'fhir/' : `fhir/${resourceName}/`;
		const apiContext = await this.apiContext({
			baseURL: process.env.BASE_API_URL,
			extraHTTPHeaders: {
				Authorization: `Bearer ${tokenObj.accessToken}`,
				SessionID: tokenObj.sessionID,
			},
		});

		const response = await apiContext.post(urlLastPart, {
			data: payload,
		});

		const responseBody = await response.json();
		fs.writeFileSync(`${resourceName}PostRes${randomNum}.json`, JSON.stringify(responseBody, null, 2));

		return responseBody;
	}

	async filterRecordsBySingleColumn(columnName, criteria) {
		await this.page.locator(`[data-cy="${columnName}_filter"]`, { timeout: 10000 }).click({ force: true });
		await this.page.waitForTimeout(2000);
		await this.page.locator(`[data-cy="${columnName}_filter"] input`).clear();
		await this.page.locator(`[data-cy="${columnName}_filter"] input`).pressSequentially(criteria);
		await this.page.keyboard.press('ArrowDown');
		await this.page.keyboard.press('Enter');
		await this.page.keyboard.press('Escape');
	}

	async filterRecordsBySuggestionColumn(columnName, criteria) {
		const criteriaFullEncode = `${encodeURI(criteria)}`.replace(/\'/g, `%27`);
		await this.page.route(`**${criteriaFullEncode}*`, route => route.continue());
		await this.page.locator(`[data-cy="${columnName}_filter"]`, { timeout: 10000 }).click({ force: true });
		await this.page.waitForTimeout(2000);
		await this.page.locator(`[data-cy="${columnName}_filter"] input`).clear();
		await this.page.waitForTimeout(10000);
		await this.page.locator(`[data-cy="${columnName}_filter"] input`).pressSequentially(criteria, { delay: 0 });
		await this.apiWaitUtils.waitForAPI(`${criteriaFullEncode}`, 'GET');
		await this.page
			.locator(`[aria-labelledby="search-as-you-type-label"] :has-text("${String(criteria).toUpperCase()}")`)
			.first()
			.click();
	}

	async filterRecordsByDynamicFilterColumn(columnName, criteria) {
		await this.page.locator(`[data-testid="${columnName}_filter"]`, { timeout: 10000 }).click({ force: true });
		await this.page.waitForTimeout(2000);
		await this.page.locator(`[data-testid="${columnName}_filter"] input`).clear();
		await this.page.waitForTimeout(5000);
		await this.page.locator(`[data-testid="${columnName}_filter"] input`).pressSequentially(criteria, { delay: 0 });
		await this.page.waitForTimeout(5000);
		await Promise.all([
			this.page
				.locator(
					`[data-testid="${columnName}-dynamic-option-filter"] :has-text("${String(criteria).toUpperCase()}")`
				)
				.first()
				.click(),
			await this.page.waitForResponse(`**/ImagingStudyWorklist/elk*`),
		]);
	}

	async updateResourceById(resourceName, internalId, payload, tokenObj) {
		if (!tokenObj || !internalId || !resourceName || !payload) {
			console.error('Missing required parameters.');
			return;
		}

		try {
			// Generate a random number
			const randomNum = Math.floor(Math.random() * (9999 - 1111 + 1)) + 1111;

			// Write payload to a file
			// const payloadFilePath = path.join(__dirname, `${resourceName}PutPayload${randomNum}.json`);
			// fs.writeFileSync(payloadFilePath, JSON.stringify(payload, null, 2));

			// Perform the PUT request
			const requestPayload = await this.apiContext.put(
				`${playwrightConfig.baseApiUrl}/fhir/${resourceName}/${internalId}`,
				{
					headers: {
						Authorization: `bearer ${tokenObj.accessToken}`,
						SessionID: tokenObj.sessionID,
					},
					data: payload,
				}
			);
			// const response = await this.apiContext.post( `${playwrightConfig.baseApiUrl}/fhir/${resourceName}/${internalId}`,requestPayload);
			const responseBody = await requestPayload.json();

			// // Write response body to a file
			// const responseFilePath = path.join(__dirname, `${resourceName}PutRes${randomNum}.json`);
			// fs.writeFileSync(responseFilePath, JSON.stringify(responseBody, null, 2));

			return responseBody;
		} catch (error) {
			console.error('Error updating resource:', error);
		}
	}

	async getResourceById(resourceName, internalId, tokenObj) {
		if (!tokenObj || !internalId || !resourceName) {
			return;
		}
		const response = await this.apiContext.get(
			`${playwrightConfig.baseApiUrl}/fhir/${resourceName}/${internalId}`,
			{
				headers: {
					Authorization: `bearer ${tokenObj.accessToken}`,
					SessionID: tokenObj.sessionID,
				},
			}
		);
		const responseBody = await response.json();
		return responseBody;
	}

	async patchResourceByInternalId(resourceName, internalId, payload, tokenObj) {
		if (!tokenObj || !internalId || !resourceName || !payload) {
			console.error('Missing required parameters.');
			return;
		}

		try {
			const randomNum = Math.floor(Math.random() * (9999 - 1111 + 1)) + 1111;
			const payloadFilePath = `${resourceName}PatchPayload${randomNum}.json`;
			fs.writeFileSync(payloadFilePath, JSON.stringify(payload, null, 2));

			const response = await this.apiContext.patch(
				`${playwrightConfig.baseApiUrl}/fhir/${resourceName}/${internalId}`,
				{
					headers: {
						Authorization: `bearer ${tokenObj.accessToken}`,
						SessionID: tokenObj.sessionID,
						'Content-Type': 'application/json-patch+json',
					},
					data: payload,
				}
			);

			const responseBody = await response.json();
			const responseFilePath = `${resourceName}PatchRes${randomNum}.json`;
			fs.writeFileSync(responseFilePath, JSON.stringify(responseBody, null, 2));

			return responseBody;
		} catch (error) {
			console.error('Error patching resource:', error);
		}
	}

	async filterRecordsByMultiSelectionColumn(columnName, criteria) {
		await this.page.click(`[data-cy="${columnName}_filter"]`);
		for (const element of criteria) {
			const listItem = await this.page
				.locator('[role="listbox"]')
				.getByText(new RegExp(`^${element}$`, 'g'))
				.first();
			await listItem.scrollIntoViewIfNeeded();
			await listItem.click({ force: true });
		}
		await this.page.keyboard.press('Escape');
	}

	getExtensionIndex(extArr, url) {
		return extArr?.findIndex(item => item?.url === url);
	}

	addNewExtensionObject(extArr, value, url, type) {
		switch (type) {
			case 'string':
				extArr.push({
					url: url,
					valueString: value ?? '',
				});
				break;
			case 'integer':
				extArr.push({
					url: url,
					valueInteger: value ?? 0,
				});
				break;
			case 'reference':
				extArr.push({
					url: url,
					valueReference: value ?? {
						id: '',
						reference: '',
						display: '',
					},
				});
				break;
			case 'coding':
				extArr.push({
					url: url,
					valueCoding: value ?? {
						code: '',
						display: '',
					},
				});
				break;
			case 'array': {
				extArr.push({
					url: url,
					extension: value ?? [],
				});
			}
		}

		return extArr;
	}

	updateExtensionValue(extArr, value, extIndex, type) {
		if (extIndex >= 0) {
			switch (type) {
				case 'string':
					extArr[extIndex].valueString = value;
					break;
				case 'integer':
					extArr[extIndex].valueInteger = value;
					break;
				case 'reference':
					extArr[extIndex].valueReference = value;
					break;
				case 'coding':
					extArr[extIndex].valueCoding = value;
					break;
				case 'array': {
					extArr[extIndex].extension = value;
				}
			}
		}

		return extArr;
	}

	updateResourceExtension(extArr, value, url, valueType) {
		let newExtArr = Array.isArray(extArr) ? [...extArr] : [];
		const index = this.getExtensionIndex(newExtArr, url);
		if (index === -1) {
			newExtArr = this.addNewExtensionObject(newExtArr, value, url, valueType);
		} else {
			newExtArr = this.updateExtensionValue(newExtArr, value, index, valueType);
		}

		return newExtArr;
	}
}

export const TEAM_PREFIX = {
	phoenix: 'team-phoenix',
	proact: 'team-proact',
	galaxy: 'team-galaxy',
	cross: 'team-cross',
	won: 'team-won',
	maven: 'team-maven',
	sprinter: 'team-sprinter',
};
