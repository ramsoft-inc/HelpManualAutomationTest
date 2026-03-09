const playwrightConfig = require('../../playwright.config');
const { expect } = require('@playwright/test');
const { ApiWaitUtils } = require('../apiWaitUtils');
const { PageHelper } = require('../utils/pageHelper');
const { TIMEOUT_IN_MSEC1, TIMEOUT_IN_MSEC2 } = require('../timeouts');

class OrganizationProcedureCode {
	constructor(page) {
		this.page = page;
		this.apiWaitUtils = new ApiWaitUtils(this.page);
		this.pageHelper = new PageHelper(this.page);
	}

	//#region Procedure Code list view
	addProcedureCodeIcon() {
		return this.page.getByLabel('Add Procedure code');
	}

	activeColHeader() {
		return this.page.getByLabel('Active');
	}

	activeOption(option) {
		return this.page.getByRole('option', { name: option, exact: true });
	}

	procedureCodeColHeader() {
		return this.page.getByRole('columnheader', { name: 'Procedure Code' }).getByPlaceholder('Search');
	}

	descriptionColHeader() {
		return this.page.getByRole('columnheader', { name: 'Description' }).getByPlaceholder('Search');
	}

	workRvuColHeader() {
		return this.page.getByRole('columnheader', { name: 'Work RVU' }).getByPlaceholder('Search');
	}

	practiceRvuColHeader() {
		return this.page.locator('[data-cy="Practice RVU_filter"]').getByPlaceholder('Search');
	}

	malpracticeRvuColHeader() {
		return this.page.locator('[data-cy="Malpractice RVU_filter"]').getByPlaceholder('Search');
	}

	billableCheckboxColHeader() {
		return this.page.getByLabel('Billable');
	}

	billableOption(option) {
		return this.page.getByRole('option', { name: option, exact: true });
	}

	priorAuthorizationColHeader() {
		return this.page.getByLabel('Prior Authorization');
	}

	priorAuthorizationOption(option) {
		return this.page.getByRole('option', { name: option, exact: true });
	}

	orderSetsColHeader() {
		return this.page.getByRole('columnheader', { name: 'Order Sets' }).getByPlaceholder('Search');
	}

	procedureCodeRow0() {
		return this.page.getByTestId('study-status-cell-0_code').locator('p');
	}

	orderSetRow0() {
		return this.page.getByTestId('study-status-cell-0_studySets').locator('p');
	}

	orderSetNumberRow0() {
		return this.page.getByTestId('study-status-cell-0_studySets').locator('button');
	}

	numOfHiddenOrderSetsRow0() {
		return this.page.getByTestId('study-status-cell-0_studySets').locator('button').innerText();
	}

	editIcon() {
		return this.page.getByTestId('edit-tooltip');
	}

	deleteIcon(rowNum) {
		return this.page.getByTestId(`study-status-cell-${rowNum}_icons`).getByTestId('hold-to-delete-tooltip');
	}

	alertDialogDescription() {
		return this.page.locator('#alert-dialog-description');
	}

	proceedBtn() {
		return this.page.getByTestId('Proceed_');
	}
	//#endregion Procedure Code list view

	//#region Procedure Code form
	activeBtn() {
		return this.page.getByRole('button', { name: 'ACTIVE' }).nth(1);
	}

	inactiveBtn() {
		return this.page.getByRole('button', { name: 'INACTIVE' }).nth(1);
	}

	selectedStatusBtn() {
		return this.page.getByTestId('form-content-section').locator('button[aria-pressed="true"]');
	}

	procedureCodeCombo() {
		return this.page.getByTestId('autocomplete-field-Procedure Code').locator('input');
	}

	descriptionTxt() {
		return this.page.getByTestId('form-field-procedure-code-description');
	}

	workRvuTxt() {
		return this.page.getByTestId('form-field-work-rvu');
	}

	practiceRvuTxt() {
		return this.page.getByTestId('form-field-practice-rvu');
	}

	malpracticeRvuTxt() {
		return this.page.getByTestId('form-field-malpractice-rvu');
	}

	rvuTechnicalTxt() {
		return this.page.getByTestId('form-field-rvuTechnical');
	}

	rvuProfessionalTxt() {
		return this.page.getByTestId('form-field-rvuProfessional');
	}

	billableCheckbox() {
		return this.page.getByTestId('form-field-billable').locator('input[type="checkbox"]');
	}

	priorAuthorizationCheckbox() {
		return this.page.getByTestId('form-field-priorAuthorization').locator('input[type="checkbox"]');
	}

	createBtn() {
		return this.page.getByTestId('save-btn').getByTestId('CREATE_');
	}

	updateBtn() {
		return this.page.getByTestId('UPDATE_');
	}

	cancelBtn() {
		return this.page.getByTestId('cancel-btn');
	}
	//#endregion Procedure Code form

	//#region Functions
	async openOrganizationRisProcedureCodePage(organizationId) {
		const url = `${playwrightConfig.baseURL}organization/${organizationId ?? playwrightConfig.managingOrg.organizationId
			}/ris/procedure`;
		await Promise.all([this.page.goto(url.toString()), this.apiWaitUtils.waitForAPI('/fhir/ProcedureCode', 'GET')]);
		await this.addProcedureCodeIcon().waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC1 });
	}

	async openNewProcedureCodeForm() {
		await this.addProcedureCodeIcon().click();
		expect(await this.createBtn()).toBeEnabled({ timeout: TIMEOUT_IN_MSEC1 });
	}

	async openEditProcedureCodeForm(procedureCode, description, skipFilter = false) {
		if (!skipFilter) {
			// Filter the existing procedure code. Clear the existing filter and set the new procedure code
			await this.procedureCodeColHeader().click();
			await this.procedureCodeColHeader().press('ControlOrMeta+a');
			await this.procedureCodeColHeader().fill('');
			await this.procedureCodeColHeader().pressSequentially(procedureCode, { delay: 300 });

			await this.descriptionColHeader().click();
			await this.descriptionColHeader().press('ControlOrMeta+a');
			await this.descriptionColHeader().fill('');
			await this.descriptionColHeader().pressSequentially(description, { delay: 100 });
		}

		// Hover on the first matching row and click Edit icon
		await this.procedureCodeRow0().hover();
		await this.page.route('/fhir/ProcedureCode/', route => route.continue());
		await Promise.all([this.editIcon().click(), this.apiWaitUtils.waitForAPI('/fhir/ProcedureCode/', 'GET')]);
		expect(await this.updateBtn()).toBeEnabled({ timeout: TIMEOUT_IN_MSEC1 });
	}

	async getProcedureCodeStatus() {
		const selectedButtonText = await this.selectedStatusBtn().innerText();
		let status = true;
		if (selectedButtonText === 'INACTIVE') {
			status = false;
		}

		return status;
	}

	async getFormValues() {
		const formValues = {};

		formValues.active = await this.getProcedureCodeStatus();
		formValues.procedureCode = await this.procedureCodeCombo().inputValue();
		formValues.description = await this.descriptionTxt().inputValue();
		formValues.workRvu = await this.workRvuTxt().inputValue();
		formValues.practiceRvu = await this.practiceRvuTxt().inputValue();
		formValues.malpracticeRvu = await this.malpracticeRvuTxt().inputValue();
		formValues.billable = await this.billableCheckbox().isChecked();
		formValues.priorAuthorization = await this.priorAuthorizationCheckbox().isChecked();

		return formValues;
	}

	async inputFormData(procedureCodeData) {
		const selectedStatus = await this.getProcedureCodeStatus();
		const selectedStatusText = await this.selectedStatusBtn().innerText();
		if (selectedStatus !== procedureCodeData?.active) {
			if (procedureCodeData?.active && selectedStatusText === 'INACTIVE') {
				await this.activeBtn().click();
			} else if (!procedureCodeData?.active && selectedStatusText === 'ACTIVE') {
				await this.inactiveBtn().click();
			}
		}

		await this.procedureCodeCombo().dblclick(); // In case of edit, select the value and type, so it delete the old value
		await this.procedureCodeCombo().pressSequentially(procedureCodeData?.procedureCode, { delay: 500 });
		await this.page.waitForTimeout(3000); // Need this explicit wait to workaround the debounceDelayTime on FormAPIAutocompleteVariant component
		await this.pageHelper.inputValueForTextField(null, this.descriptionTxt(), procedureCodeData?.description);
		await this.pageHelper.inputValueForTextField(null, this.workRvuTxt(), procedureCodeData?.workRvu);
		await this.pageHelper.inputValueForTextField(null, this.practiceRvuTxt(), procedureCodeData?.practiceRvu);
		await this.pageHelper.inputValueForTextField(null, this.malpracticeRvuTxt(), procedureCodeData?.malpracticeRvu);

		const billable = await this.billableCheckbox().isChecked();
		const priorAuthorization = await this.priorAuthorizationCheckbox().isChecked();

		if (procedureCodeData?.billable !== billable) {
			if (procedureCodeData?.billable) {
				await this.billableCheckbox().check();
			} else {
				await this.billableCheckbox().uncheck();
			}
		}

		if (procedureCodeData?.priorAuthorization !== priorAuthorization) {
			if (procedureCodeData?.priorAuthorization) {
				await this.priorAuthorizationCheckbox().check();
			} else {
				await this.priorAuthorizationCheckbox().uncheck();
			}
		}
	}

	async addProcedureCode(data) {
		await this.openNewProcedureCodeForm();

		// Input form data
		await this.inputFormData(data);

		await this.page.route('/fhir/ProcedureCode', route => route.continue());
		await Promise.all([this.createBtn().click(), this.apiWaitUtils.waitForAPI('/fhir/ProcedureCode', 'POST')]);
		await this.page
			.locator('text=New Procedure Code created successfully')
			.waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC2 });
	}

	async updateProcedureCode(newProcedureCodeInfo) {
		// Input form data
		await this.inputFormData(newProcedureCodeInfo);

		// Click Update button
		await this.page.route('/fhir/ProcedureCode', route => route.continue());
		await Promise.all([this.updateBtn().click(), this.apiWaitUtils.waitForAPI('/fhir/ProcedureCode', 'PUT')]);
		await this.page
			.locator('text=Procedure Code updated successfully')
			.waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC2 });
	}

	async waitForApiComplete(urlPattern, methodName, waitTimeInMs) {
		await this.apiWaitUtils.waitForAPI(urlPattern, methodName, waitTimeInMs);
	}

	async deleteProcedureCode(rowNum) {
		await this.deleteIcon(rowNum).click();
		await this.page.mouse.down();
		await this.page.waitForTimeout(3000);
		await this.page.mouse.up();

		await this.alertDialogDescription().waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC1 });
		await expect(this.page.getByText('You are about to delete a Procedure code.')).toBeVisible();
		await expect(this.page.getByText('Do you really want to proceed with this action?')).toBeVisible();

		await this.proceedBtn().click();

		const toastMsg = this.page.getByText('Procedure Code deleted Successfully');
		await toastMsg.waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC1 });
		await expect(toastMsg).toBeVisible();
	}
	//#endregion Functions
}
module.exports = { OrganizationProcedureCode };

