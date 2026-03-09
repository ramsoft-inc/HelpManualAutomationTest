const faker = require('community-faker');
const { ApiWaitUtils } = require('../../apiWaitUtils');
const { expect } = require('@playwright/test');
const { generateTestEmail } = require('../../../cypress/support/testUtils');
const { Common } = require('../../common');
class ReferringOrganizationPage {
	constructor(page) {
		this.page = page;
		this.apiWaitUtils = new ApiWaitUtils(this.page);
	}

	// Field locators moved outside constructor
	getOrganizationNameField() {
		return this.page.getByLabel('Organization Name');
	}

	getPracticeTypeField() {
		return this.page.getByLabel('Practice Type');
	}

	getTimeZoneField() {
		return this.page.getByLabel('Time Zone');
	}

	getCorporateWebsiteField() {
		return this.page.getByLabel('Corporate Website');
	}

	// Tab locators
	getAddressTab() {
		return this.page.getByRole('tab', { name: 'ADDRESS' });
	}

	getContactDetailsTab() {
		return this.page.getByRole('tab', { name: 'CONTACT DETAILS' });
	}

	// Address field locators
	getAddressLineField() {
		return this.page.getByLabel('Address Line');
	}

	getCityField() {
		return this.page.getByLabel('City');
	}

	getSaveButton(wrapperIndex = 2) {
		return this.page.getByTestId(`panel-wrapper-${wrapperIndex}`).getByTestId('CREATE_');
	}

	getAddressSearchField(wrapperIndex = 1) {
		// More specific locator using panel-wrapper-1
		return this.page.getByTestId(`panel-wrapper-${wrapperIndex}`).getByTestId('autocomplete-field-Address Line');
	}

	getAddressAutoFillInput() {
		return this.page.getByRole('combobox', { name: 'Search an address to auto-' });
	}

	getAddressSearchInput(wrapperIndex = 1) {
		// More specific locator using panel-wrapper-1
		return this.page.getByTestId(`panel-wrapper-${wrapperIndex}`).getByRole('combobox', {
			name: 'Address Line',
		});
	}

	async searchAndSelectAddress(address) {
		const searchInput = this.getAddressAutoFillInput();
		await searchInput.click();
		await searchInput.fill('tesla road');

		// Wait for MUI Autocomplete dropdown
		const muiAutocomplete = this.page.locator('.MuiAutocomplete-popper');
		await muiAutocomplete.waitFor({ state: 'visible' });

		// Wait for suggestions to load
		const suggestions = this.page.locator('.MuiAutocomplete-option');
		await suggestions.first().waitFor({ state: 'visible' });

		// Get first suggestion text to verify
		const firstSuggestion = await suggestions.first().textContent();
		console.log('First suggestion:', firstSuggestion);

		// Select first suggestion using keyboard
		await this.page.keyboard.press('ArrowDown');
		await this.page.keyboard.press('Enter');

		// Wait for address field to be populated
		await this.page.waitForTimeout(5000);
	}

	// Actions using locators
	async fillOrganizationName(name) {
		await this.getOrganizationNameField().fill(name);
	}

	async selectTimeZone(option) {
		await this.getTimeZoneField().selectOption({ label: option });
	}

	async switchToAddressTab() {
		await this.getAddressTab().click();
	}

	async fillCity(city) {
		await this.getCityField().fill(city);
	}

	generateOrganizationData() {
		// Add unique identifier to ensure organization name is unique across all test runs
		const uniqueId = Common.generate7DigitRandNum();
		return {
			orgName: `E2E TEST ${faker.company.companyName()} ${uniqueId}`,
			practiceType: 'Medical Practice',
			timeZone: '(UTC-05:00) Eastern Time (US & Canada)',
			website: faker.internet.url(),
			address: {
				line: faker.address.streetAddress(),
				city: faker.address.city(),
				state: faker.address.state(),
				zipCode: faker.address.zipCode(),
				country: faker.address.country(),
			},
			contact: {
				email: generateTestEmail(),
				phone: faker.phone.phoneNumber('###-###-####'),
			},
		};
	}

	async fillAllFields(customData = {}, wrapperIndex = 2) {
		const defaultData = this.generateOrganizationData();
		const data = { ...defaultData, ...customData };

		// Fill organization details
		await this.fillOrganizationName(data.orgName);
		await this.getCorporateWebsiteField().fill(data.website);

		// Switch to Address tab and fill address details
		await this.searchAndSelectAddress(data.address.line);

		// Switch to Contact Details and fill contact info
		await this.getContactDetailsTab().click();
		await this.page.getByRole('textbox', { name: 'Business Email' }).fill(data.contact.email);
		await this.page.route('/fhir/', route => route.continue());
		// Save the form
		await Promise.all([this.getSaveButton(wrapperIndex).click(), this.apiWaitUtils.waitForAPI('/fhir/', 'POST')]);
		await expect(this.page.getByText('Org has been successfully created')).toBeVisible();

		// Return the organization data for reference
		return data;
	}
}
module.exports = { ReferringOrganizationPage };

