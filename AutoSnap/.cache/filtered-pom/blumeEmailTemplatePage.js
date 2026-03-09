import { expect } from '@playwright/test';
export class BlumeEmailTemplatePage {
	constructor(page, apiWaitUtils) {
		this.page = page;
		this.apiWaitUtils = apiWaitUtils;
	}

	createNewEmailTemplateBtn() {
		return this.page.locator('button:has-text("Create New Email")');
	}

	subjectInput() {
		return this.page.locator('input[name="subject"]');
	}

	testEmail() {
		return this.page.locator('input[placeholder="workmail@gmail.com"]');
	}

	saveBtn() {
		return this.page.locator('[data-testid="save-button"]');
	}

	cancelBtn() {
		return this.page.locator('[data-testid="cancel-button"]');
	}

	emailBodyEditor() {
		return this.page.locator('.ProseMirror[contenteditable="true"]');
	}

	confirmTemplateChangePopup() {
		return this.page.locator('button:has-text("Confirm Template Changes")');
	}

	cancelBtnInPopup() {
		return this.page.locator('[data-testid="secondary-btn"]');
	}

	saveNewTemplateBtnInPopup() {
		return this.page.locator('[data-testid="middle-btn"]');
	}

	updateTemplateBtnInPopup() {
		return this.page.locator('[data-testid="proceed-btn"]');
	}

	// adding a new email template
	async addNewEmailTemplate(subject, body, testEmail) {
		await this.createNewEmailTemplateBtn().click();
		await this.subjectInput().fill(subject);
		await this.emailBodyEditor().click();
		await this.emailBodyEditor().fill(body);
		await this.testEmail().fill(testEmail);
		await this.page.route('/fhir/WorkflowAutomationMessageTemplate', route => route.continue());
		await Promise.all([
			this.saveBtn().click(),
			this.apiWaitUtils.waitForAPI('/fhir/WorkflowAutomationMessageTemplate', 'POST'),
		]);
	}
};
