const { DetailedTablePopper } = require('../../patientInformation/detailedTablePopper');
const { ReferringOrganizationPage } = require('./addNewReferringOrg');
const { ApiWaitUtils } = require('../../apiWaitUtils');
const faker = require('community-faker');
const { expect } = require('@playwright/test');
const { generateTestEmail } = require('../../../cypress/support/testUtils');
class ReferringPhysicianPage {
	constructor(page) {
		this.page = page;
		this.referringOrganizationPage = new ReferringOrganizationPage(page);
		this.detailedTablePopper = new DetailedTablePopper(page);
		this.apiWaitUtils = new ApiWaitUtils(this.page);
	}

	// Field locators moved outside constructor
	getFamilyNameInput() {
		return this.page.locator('input[name="familyName"]');
	}

	getGivenNamesInput() {
		return this.page.locator('input[name="givenNames"]');
	}

	getNamePrefixInput() {
		return this.page.locator('#autocomplete-field-Name\\ Prefix');
	}

	getNameSuffixInput() {
		return this.page.locator('#autocomplete-field-Name\\ Suffix');
	}

	getReferringOrgInput() {
		return this.page.locator('#autocomplete-field-Referring\\ Organization');
	}

	getLoginEmailInput() {
		return this.page.getByLabel('Login Email');
	}

	async fillLoginEmail(email) {
		await this.getLoginEmailInput().fill(email);
	}

	async fillFamilyName(name) {
		await this.getFamilyNameInput().fill(name);
	}

	async fillGivenNames(name) {
		await this.getGivenNamesInput().fill(name);
	}

	async fillNamePrefix(prefix) {
		await this.getNamePrefixInput().fill(prefix);
		await this.page.keyboard.press('Enter');
	}

	async fillNameSuffix(suffix) {
		await this.getNameSuffixInput().fill(suffix);
		await this.page.keyboard.press('Enter');
	}

	async fillReferringOrganization(org) {
		await this.getReferringOrgInput().fill(org);
		await this.page.keyboard.press('Enter');
	}

	async saveReferringPhysicianForm(wrapperIndex = 1) {
		const familyName = faker.name.lastName().toUpperCase();
		const givenName = faker.name.firstName().toUpperCase();
		const loginEmail = generateTestEmail();

		// First create the referring organization
		await this.getReferringOrgInput().click();
		await this.detailedTablePopper.getAddNewButton().byLabel.click();
		const refOrgData = await this.referringOrganizationPage.fillAllFields({}, wrapperIndex + 1);

		await this.page.route('**/PractitionerRole**', route => route.continue());

		// Build physician data with actual organization name from created org
		const physicianData = {
			familyName: familyName,
			givenName: givenName,
			prefix: 'DR',
			suffix: 'MD',
			organization: refOrgData?.orgName || 'TEST ORGANIZATION',
			loginEmail: loginEmail,
			dicomName: `${familyName}^${givenName}`,
			displayName: `DR ${familyName} ${givenName} MD`,
		};

		await this.fillAllFields({
			familyName: physicianData.familyName,
			givenNames: physicianData.givenName,
			namePrefix: physicianData.prefix,
			nameSuffix: physicianData.suffix,
			loginEmail: physicianData.loginEmail,
		});

		// Wait for save operation
		await this.page.getByTestId(`panel-wrapper-${wrapperIndex}`).getByTestId('CREATE_').click({ force: true });
		await expect(this.page.getByText('Successfully created new user')).toBeVisible();
		return physicianData;
	}

	async fillAllFields({ familyName, givenNames, namePrefix, nameSuffix, loginEmail, referringOrganization }) {
		await this.fillFamilyName(familyName);
		await this.fillGivenNames(givenNames);
		await this.fillNamePrefix(namePrefix);
		await this.fillNameSuffix(nameSuffix);
		await this.fillLoginEmail(loginEmail);
	}
}
module.exports = { ReferringPhysicianPage };

