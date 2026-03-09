const playwrightConfig = require('../../playwright.config');
const { expect } = require('@playwright/test');
const { ApiWaitUtils } = require('../apiWaitUtils');
const { AlertsPopper } = require('./alertsPopper');

class PatientAlertPage {
	constructor(page) {
		this.page = page;
		this.apiWaitUtils = new ApiWaitUtils(this.page);
		this.alertsPopper = new AlertsPopper(this.page);
	}

	//#region Patient Alert view
	addNewAlertIcon() {
		return this.page.getByTestId('CardsViewHeaderV2-add');
	}

	deleteIcon() {
		return this.page.getByTestId('hold-to-delete-tooltip');
	}
	//#endregion Patient Alert view

	//#region Patient Alert form
	formHeader() {
		return this.page.getByTestId('form-header-section').locator('h6');
	}

	alertDescriptionAndNotePreview(content) {
		return this.page
			.getByTestId('form-content-section')
			.locator('div')
			.filter({ hasText: `${content}` })
			.first();
	}

	alertDescriptionTxt() {
		return this.page.getByLabel('Alert Description');
	}

	startDatePicker() {
		return this.page.locator('[name="startDate"]');
	}

	endDatePicker() {
		return this.page.locator('[name="endDate"]');
	}

	datePickerYearSelect() {
		return this.page.getByLabel('calendar view is open, switch');
	}

	yearBtn(year) {
		return this.page.locator(`button.PrivatePickersYear-yearButton:has-text("${year}")`).first();
	}

	noteTxt() {
		return this.page.getByTestId('edit-text-field').first().first();
	}

	createBtn() {
		return this.page.getByTestId('SAVE_');
	}

	updateBtn() {
		return this.page.getByTestId('UPDATE_');
	}

	cancelBtn() {
		return this.page.getByTestId('cancel-btn');
	}
	//#endregion Patient Alert form

	//#region Functions
	/**
	 * Ensures that any visible alert popper is closed before proceeding
	 * This should be called before any critical UI interactions
	 */
	async ensureAlertPopperClosed() {
		try {
			// Try immediate force close first
			await this.alertsPopper.forceCloseAlertPopper();
			// Then ensure it's really closed
			await this.alertsPopper.ensureAlertPopperClosed(2); // Reduced attempts for speed
		} catch (error) {
			console.warn('Error ensuring alert popper is closed:', error.message);
		}
	}

	/**
	 * Performs a critical UI action while actively watching for poppers
	 * @param {Function} action - The action to perform
	 */
	async performActionWithPopperWatch(action) {
		return await this.alertsPopper.executeWithPopperWatch(action, 300); // Check every 300ms
	}

	async openPatientAlertPage(patientId) {
		const url = `${playwrightConfig.baseURL}patient/${patientId}/patient-needs`;
		await this.page.route(`**/fhir/PatientAlert?_count=50&page=1&patientid=${patientId}*`, route =>
			route.continue()
		);
		await this.page.route(`**/fhir/PatientAlert?_count=50&page=1&patientid=${patientId}&rolebased=true*`, route =>
			route.continue()
		);

		await this.page.goto(url);

		await Promise.all([
			this.addNewAlertIcon().waitFor({ state: 'visible' }),
			this.apiWaitUtils.waitForAPI(`/fhir/PatientAlert?_count=50&page=1&patientid=${patientId}`, 'GET'),
			this.apiWaitUtils.waitForAPI(
				`/fhir/PatientAlert?_count=50&page=1&patientid=${patientId}&rolebased=true`,
				'GET'
			),
		]);
		// Wait for heading to be visible
		await this.alertsPopper.handleVisibleAlerts();
	}

	async inputFormData(data, isUpdate) {
		// Ensure alert popper is closed before starting form input
		await this.ensureAlertPopperClosed();

		// Use popper watcher for the entire form input process
		return await this.performActionWithPopperWatch(async () => {
			if (isUpdate) {
				await this.alertDescriptionTxt().click();
				await this.alertDescriptionTxt().press('ControlOrMeta+a');
				await this.alertDescriptionTxt().press('Backspace');
			}
			await this.alertDescriptionTxt().fill(data?.alertDescription);

			if (data?.startYear) {
				await this.startDatePicker().click();
				await this.datePickerYearSelect().click();
				await this.yearBtn(data.startYear).click();
				// select the current date of the selected year and close the date picker
				if (await this.page.getByRole('button', { name: 'OK' }).isVisible()) {
					// When running the tests in headless mode on pipeline, the MUI date picker GUI looks different. It shows Clear, Cancel and OK buttons,
					// and the startDatePicker elelent is not visible. So the step closing the date picker needs to be different for headless and headed modes
					await this.page.getByRole('button', { name: 'OK' }).click();
				} else {
					await this.startDatePicker().click();
				}
			}

			if (data?.endYear) {
				await this.endDatePicker().click();
				await this.datePickerYearSelect().click();
				await this.yearBtn(data.endYear).click();
				if (await this.page.getByRole('button', { name: 'OK' }).isVisible()) {
					await this.page.getByRole('button', { name: 'OK' }).click(); // visible in headless mode
				} else {
					await this.endDatePicker().click();
				}
			}

			await this.noteTxt().click();
			if (isUpdate) {
				await this.noteTxt().press('ControlOrMeta+a');
				await this.noteTxt().press('Backspace');
			}
			await this.noteTxt().pressSequentially(data?.note, { delay: 200 });
		});
	}
	async addPatientAlert(alertData) {
		await this.ensureAlertPopperClosed(); // Ensure popper is closed before starting
		await this.addNewAlertIcon().click();
		expect(this.formHeader()).toHaveText('Alerts');

		// Input data
		await this.inputFormData(alertData);

		await this.ensureAlertPopperClosed(); // Ensure popper is closed before final submission
		await this.page.route('/fhir/PatientAlert', route => route.continue());
		await Promise.all([this.createBtn().click(), this.apiWaitUtils.waitForAPI('/fhir/PatientAlert', 'POST')]);
	}
	//#endregion Functions
}
module.exports = { PatientAlertPage };

