const { expect } = require('@playwright/test');
const { faker } = require('@faker-js/faker');
const TIMEOUTS = require('../timeouts');

class OrganizationBlumeFormPage {
	constructor(page) {
		this.page = page;
	}

	async closeOrganizationBlumeFormPage() {
		await this.page.locator('[data-testid="CloseIcon"]').nth(1).click();
	}

	async unselectOrganization() {
		const orgInput = await this.page
			.locator('[data-testid="blume-org-autocomplete"]')
			.locator('[data-testid="blume-form-org-input"]');
		await orgInput.focus();
		const closeIcon = this.page.locator('[data-testid="CloseIcon"]').first();
		await expect(closeIcon).toBeVisible({ timeout: 20000 });
		await closeIcon.click();
	}

	async selectOrganization(orgName) {
		const orgInput = await this.page
			.locator('[data-testid="blume-org-autocomplete"]')
			.locator('[data-testid="blume-form-org-input"]');
		await orgInput.focus();
		await orgInput.click({ force: true });
		await orgInput.type(orgName, { delay: 100 });
		await this.page.waitForTimeout(10000);
		await orgInput.press('ArrowDown'); // Use 'ArrowDown' instead
		await orgInput.press('Enter');
	}

	async uploadFiles(filesPath) {
		const input = this.page.locator('[data-testid="upload-pdf-input"]');
		await input.setInputFiles(filesPath);
	}

	addBox() {
		return this.page.locator('[data-testid="add-box"]');
	}

	formTitle() {
		return this.page.locator('[data-cy="header-title"]');
	}

	editTitleBtn() {
		return this.page.locator('[data-testid="EditOutlinedIcon"]');
	}

	inputPdfTitle() {
		return this.page.locator('[data-cy="title-input"] input');
	}

	saveTitleBtn() {
		return this.page.locator('[data-testid="CheckCircleOutlineOutlinedIcon"]');
	}

	publishButton() {
		return this.page.locator('button:has-text("Publish")');
	}

	async selectFormType(formType) {
		await this.page.locator('#formType').click();
		await this.page.locator('li', { hasText: formType }).click();
	}

	async selectCodeType(codeType) {
		await this.page.locator('#codeType').click();
		await this.page.locator('#codeType-option-0').click();
	}

	async selectModality() {
		const codeInput = this.page.locator('#select-code');
		await codeInput.click();
		await codeInput.type('CT');
		await codeInput.press('Enter');
		await this.page.locator('text=CT-Computed Tomography').click();
	}

	async publishForm() {
		const btn = this.page.locator('[data-testid="publish-form"]');
		await expect(btn).not.toBeDisabled();
		await btn.click();
	}

	async openOrganizationBlumeForm(sidebar) {
		await sidebar.menuIcon('apps').click();
		const gearIcon = this.page.getByRole('tooltip', { name: 'Root Blume' }).getByRole('button').nth(2);
		await expect(gearIcon).toBeVisible({ timeout: 10000 });
		await gearIcon.click();
	}

	async createPDFBlumeForm(formType) {
		let randomNum = faker.number.int({ min: 1111111111, max: 9999999999 });
		let formName = `${formType} PDF Form ${randomNum}`;
		await this.addBox().hover();
		await this.uploadFiles('./cypress/fixtures/form/BlumeFormOrder.pdf');
		await this.formTitle().hover();
		await this.page.waitForTimeout(1000);
		await this.editTitleBtn().click({ force: true });
		await this.inputPdfTitle().fill(formName);
		await this.saveTitleBtn().click();
		await this.publishButton().click();
		await this.page.waitForTimeout(1000);
		if (formType.includes('Clinical')) {
			await this.page.locator('#formType').waitFor({ state: 'visible' });
			await this.selectFormType('Clinical Form');
			await this.page.locator('#codeType').waitFor({ state: 'visible' });
			await this.selectCodeType('Modality');
			await this.page.locator('#select-code').waitFor({ state: 'visible' });
			await this.selectModality();
		} else {
			await this.page.locator('#formType').waitFor({ state: 'visible' });
			await this.selectFormType('Registration Form');
		}
		await this.publishForm();
		await this.page.waitForSelector('text=The Form has been published', { timeout: 10000 });
		// Optionally, return some form info if needed
		return { name: formName };
	}

	addNewFormButton() {
		return this.page.locator('[data-cy="add-form-button"]');
	}

	switchEditMode() {
		return this.page.locator('[data-cy="switch-edit"]');
	}

	inputTitle() {
		return this.page.locator('[data-cy="title-input"]').locator('textarea.MuiInputBase-inputMultiline').nth(0);
	}

	inputQuestionText(inputValue) {
		return this.page
			.locator('[data-testid="question-description"]')
			.locator('textarea.MuiInputBase-inputMultiline')
			.nth(0)
			.fill(inputValue);
	}

	addOption() {
		return this.page.locator('[data-testid="add_option"]');
	}

	addButton() {
		return this.page.locator('[data-testid="AddIcon"]').nth(1);
	}

	async publishOrder() {
		await this.page.locator('[data-cy="publish-container"] button').click();
	}

	async selectOrderFormType() {
		await this.page.locator('[id="formType"]').click();
		await this.page.locator('li').filter({ hasText: 'Order Form' }).click();
	}

	async selectTechnologistForm() {
		await this.page.locator('[id="formType"]').click();
		await this.page.locator('li').filter({ hasText: 'Technologist Form' }).click();
	}

	async inputAnswerText(text, inputValue) {
		const input = this.page.locator(`[placeholder="${text}"]`);
		await input.click();
		await input.fill(inputValue);
	}

	async answerForm() {
		await this.page.locator('label:has-text("Answer 1")').click();
		await this.page.waitForTimeout(TIMEOUTS.TIMEOUT_IN_1SEC);
		await this.page.locator('button:has-text("SUBMIT")').click();
	}
}

module.exports = { OrganizationBlumeFormPage };
