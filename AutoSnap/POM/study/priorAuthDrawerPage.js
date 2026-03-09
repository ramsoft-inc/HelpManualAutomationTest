const { ApiWaitUtils } = require('../apiWaitUtils');
const { TIMEOUT_IN_MSEC1, TIMEOUT_IN_MSEC2 } = require('../timeouts');

const { expect } = require('@playwright/test');

/**
 * Page Object for Prior Authorization Drawer/Panel
 *
 * IMPORTANT: The Prior Auth UI can be presented in TWO different modes:
 *
 * 1. DRAWER MODE (from Worklist):
 *    - Opens as a MUI Drawer with data-testid="pre-authorization-drawer"
 *    - Has full drawer container wrapping the FormPanel
 *
 * 2. PANEL MODE (from Study Page):
 *    - Opens as a side panel embedded in the layout
 *    - NO drawer wrapper - renders FormPanel directly with data-testid="form-panel"
 *    - Uses FormPanel header with data-testid="form-panel-header"
 *
 * Use the appropriate constructor option or methods based on where you're testing.
 */
class PriorAuthDrawerPage {
	/**
	 * @param {import('@playwright/test').Page} page - Playwright page object
	 * @param {Object} options - Configuration options
	 * @param {boolean} options.isDrawerMode - Set to true when opening from Worklist (drawer),
	 *                                          false when opening from Study page (panel). Default: true
	 */
	constructor(page, options = { isDrawerMode: true }) {
		this.page = page;
		this.apiWaitUtils = new ApiWaitUtils(this.page);
		this.isDrawerMode = options.isDrawerMode ?? true;
	}

	//#region Container elements
	/**
	 * Gets the Prior Auth container based on the presentation mode
	 * - Drawer mode: <Drawer data-testid="pre-authorization-drawer">
	 * - Panel mode: <Box data-testid="form-panel">
	 */
	getContainer() {
		if (this.isDrawerMode) {
			return this.page.getByTestId('pre-authorization-drawer');
		}
		// Panel mode - use form-panel within the layout
		return this.page.getByTestId('form-panel');
	}

	/**
	 * Gets the Prior Auth drawer container (only works in drawer mode)
	 * Based on: <Drawer data-testid="pre-authorization-drawer">
	 * @deprecated Use getContainer() instead for cross-mode compatibility
	 */
	getDrawer() {
		return this.page.getByTestId('pre-authorization-drawer');
	}

	/**
	 * Gets the form panel (works in both modes, may be nested in drawer)
	 * Based on: <Box data-testid="form-panel">
	 */
	getFormPanel() {
		return this.page.getByTestId('form-panel');
	}

	/**
	 * Gets the drawer/panel title heading
	 * Based on: FormPanel -> PanelHeader renders title in Typography inside form-panel-header
	 * The title text is "Prior Authorization"
	 */
	getDrawerTitle() {
		return this.page.getByTestId('form-panel-header').getByText('Prior Authorization');
	}

	/**
	 * Alternative way to get title by role
	 */
	getDrawerTitleByRole() {
		return this.page.getByRole('heading', { name: 'Prior Authorization' });
	}

	/**
	 * Gets the close button for the drawer/panel
	 * Based on: PanelHeader -> <IconButton data-testid="form-panel-icon-button">
	 */
	getCloseButton() {
		return this.page.getByTestId('form-panel-icon-button');
	}

	/**
	 * Gets the Submit button in the drawer/panel
	 * Based on: CancelSaveButtons -> <PrimaryButton testId="save-btn"> with label 'Submit'
	 */
	getSubmitButton() {
		return this.page.getByTestId('save-btn');
	}

	/**
	 * Gets the Cancel button in the drawer/panel
	 * Based on: CancelSaveButtons -> <SecondaryButton testId="cancel-btn">
	 */
	getCancelButton() {
		return this.page.getByTestId('cancel-btn');
	}
	//#endregion Container elements

	//#region Coverage Card elements
	/**
	 * Gets the coverage card container
	 * Based on: CoverageCard -> <Box data-testid="coverage-card-box-container">
	 */
	getCoverageCard() {
		return this.getContainer().getByTestId('coverage-card-box-container').first();
	}

	/**
	 * Gets the coverage card inner box
	 * Based on: CoverageCard -> <Box data-testid="coverage-card-box">
	 */
	getCoverageCardBox() {
		return this.getContainer().getByTestId('coverage-card-box').first();
	}

	/**
	 * Gets payer name from coverage card
	 * Based on: Grid item with label "Payer Name"
	 */
	getPayerName() {
		return this.getCoverageCard().getByTestId('Payer Name').locator('p').last();
	}

	/**
	 * Gets member ID from coverage card
	 * Based on: Grid item with label "Member ID"
	 */
	getMemberId() {
		return this.getCoverageCard().getByTestId('Member ID').locator('p').last();
	}

	/**
	 * Gets group number from coverage card
	 */
	getGroupNumber() {
		return this.getCoverageCard().getByTestId('Group Number').locator('p').last();
	}
	//#endregion Coverage Card elements

	//#region Status buttons
	/**
	 * Gets all status toggle buttons in the authorization request section
	 * Based on: StatusButtonGroup -> ToggleButtonGroup with ToggleButton children
	 */
	getStatusButtons() {
		return this.getContainer().locator('button[class*="MuiToggleButton"]');
	}

	/**
	 * Gets a specific status button by status name
	 * @param {string} status - Status name (e.g., 'APPROVED', 'DENIED', 'PENDING', 'UNKNOWN', 'NOT REQUIRED')
	 * Note: Status labels are uppercased in the UI
	 */
	getStatusButton(status) {
		return this.getContainer()
			.locator('button[class*="MuiToggleButton"]')
			.filter({ hasText: status.toUpperCase() });
	}

	/**
	 * Gets the currently selected status button
	 * Based on: ToggleButton with aria-pressed="true"
	 */
	getSelectedStatus() {
		return this.getContainer().locator('button[class*="MuiToggleButton"][aria-pressed="true"]');
	}

	/**
	 * Gets the selected status text
	 */
	async getSelectedStatusText() {
		const selectedButton = this.getSelectedStatus();
		if (await selectedButton.isVisible().catch(() => false)) {
			return selectedButton.textContent();
		}
		return '';
	}
	//#endregion Status buttons

	//#region Form fields
	/**
	 * Gets the Authorization Number field
	 * Based on: FormFieldVariants with label "Authorization Number"
	 */
	getAuthorizationNumberField() {
		return this.getContainer().getByLabel('Authorization Number');
	}

	/**
	 * Gets the Authorization Start Date field
	 * Based on: FormFieldVariants datePicker with name containing "effectiveDate"
	 */
	getAuthorizationStartDateField() {
		return this.getContainer().getByLabel('Authorization Start Date');
	}

	/**
	 * Gets the Authorization End Date field
	 * Based on: FormFieldVariants datePicker with name containing "expirationDate"
	 */
	getAuthorizationEndDateField() {
		return this.getContainer().getByLabel('Authorization End Date');
	}

	/**
	 * Gets the Total Amount Due field
	 * Based on: FormFieldVariants with label "Total Amount Due"
	 */
	getTotalAmountDueField() {
		return this.getContainer().getByLabel('Total Amount Due');
	}

	/**
	 * Gets the Payer Notes text area
	 * Based on: Note component - textarea element
	 */
	getPayerNotesField() {
		return this.getContainer().locator('textarea').first();
	}

	/**
	 * Gets the Status dropdown field (if visible when hideStatusField is false)
	 * Based on: FormFieldVariants select with label "Preauthorization Status"
	 */
	getStatusDropdown() {
		return this.getContainer().getByLabel('Preauthorization Status');
	}
	//#endregion Form fields

	//#region Insurance tabs
	/**
	 * Gets the insurance tab by payer name
	 * @param {string} payerName - The payer/insurance name
	 * Based on: GenericDrawerTabs with tab id "auth-tab"
	 */
	getInsuranceTab(payerName) {
		return this.getContainer().getByRole('tab', { name: payerName });
	}

	/**
	 * Gets all insurance tabs
	 */
	getAllInsuranceTabs() {
		return this.getContainer().getByRole('tablist').getByRole('tab');
	}

	/**
	 * Gets the insurance tab by index (0-based)
	 * @param {number} index - The tab index (0-based)
	 */
	getInsuranceTabByIndex(index) {
		return this.getContainer().locator(`[role="tab"][id="auth-tab-${index}"]`);
	}

	/**
	 * Gets the count of insurance tabs
	 * Waits for at least one tab to be visible before counting
	 * @returns {Promise<number>} The number of insurance tabs
	 */
	async getInsuranceTabCount() {
		// Wait for at least one tab to be visible before counting
		const firstTab = this.getInsuranceTabByIndex(0);
		await firstTab.waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC2 });
		const tabs = this.getAllInsuranceTabs();
		return tabs.count();
	}
	//#endregion Insurance tabs

	//#region Toast messages
	/**
	 * Gets the success toast message
	 * Based on: Toast with message from t('preauthorizationDrawer:toastMessages.saveSuccessfully')
	 */
	getSuccessToast() {
		return this.page.getByText(/saved successfully/i);
	}

	/**
	 * Gets the failure toast message
	 * Based on: Toast with message from t('preauthorizationDrawer:toastMessages.failedToSave')
	 */
	getFailureToast() {
		return this.page.getByText(/failed to save/i);
	}

	/**
	 * Gets the no coverage info message
	 * Based on: renderContent returns t('preauthorizationDrawer:noCoverageInfo')
	 */
	getNoCoverageMessage() {
		return this.getContainer().getByText(/no coverage info/i);
	}
	//#endregion Toast messages

	//#region Actions
	/**
	 * Waits for the Prior Auth drawer/panel to be visible
	 */
	async waitForDrawerVisible() {
		await this.getContainer().waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC2 });
	}

	/**
	 * Waits for the Prior Auth drawer/panel to be hidden
	 */
	async waitForDrawerHidden() {
		await this.getContainer().waitFor({ state: 'hidden', timeout: TIMEOUT_IN_MSEC2 });
	}

	/**
	 * Waits for the form to load with data (waits for API and form fields to be populated)
	 * Call this after opening the drawer to ensure data is loaded before interacting
	 */
	async waitForFormDataLoaded() {
		// Wait for the Prior Authorization API call to complete
		await this.page
			.waitForResponse(
				res => res.url().includes('/fhir/PriorAuthorization') && res.request().method() === 'GET',
				{ timeout: TIMEOUT_IN_MSEC2 }
			)
			.catch(() => {
				// API might have already completed, continue
			});

		// Wait for the Authorization Number field to be visible
		const authNumberField = this.getAuthorizationNumberField();
		await authNumberField.waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC2 });
	}

	/**
	 * Waits for the authorization number field to have a specific value
	 * @param {string} expectedValue - The expected value
	 * @param {number} timeout - Timeout in milliseconds
	 */
	async waitForAuthorizationNumber(expectedValue, timeout = TIMEOUT_IN_MSEC2) {
		const field = this.getAuthorizationNumberField();
		await expect(field).toHaveValue(expectedValue, { timeout });
	}

	/**
	 * Sets the mode for this page object
	 * @param {boolean} isDrawerMode - true for drawer mode (from Worklist), false for panel mode (from Study page)
	 */
	setMode(isDrawerMode) {
		this.isDrawerMode = isDrawerMode;
	}

	/**
	 * Closes the Prior Auth drawer using the close button
	 */
	async closeDrawer() {
		await this.getCloseButton().click();
		await this.waitForDrawerHidden();
	}

	/**
	 * Cancels and closes the Prior Auth drawer using the Cancel button
	 */
	async cancelDrawer() {
		await this.getCancelButton().click();
		await this.waitForDrawerHidden();
	}

	/**
	 * Selects an authorization status
	 * @param {string} status - Status to select (e.g., 'Approved', 'Denied', 'Pending', 'Unknown', 'NotRequired')
	 */
	async selectStatus(status) {
		const statusButton = this.getStatusButton(status);
		await statusButton.waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC1 });
		await statusButton.click();
	}

	/**
	 * Fills in the Authorization Number
	 * @param {string} authNumber - The authorization number to enter
	 */
	async fillAuthorizationNumber(authNumber) {
		const field = this.getAuthorizationNumberField();
		await field.fill('');
		await field.fill(authNumber);
	}

	/**
	 * Selects a date from the date picker
	 * @param {number} dayOfMonth - The day of the month to select
	 * @param {boolean} navigateToNextMonth - Whether to navigate to next month before selecting
	 */
	async selectDateFromPicker(dayOfMonth, navigateToNextMonth = false) {
		// Wait for the date picker to appear
		// Use the Paper element that wraps the calendar (the popper dialog)
		const datePickerPopper = this.page.locator('.MuiPaper-root:has(.MuiCalendarPicker-root)').last();
		await expect(datePickerPopper).toBeVisible();

		// If we need to navigate to next month
		if (navigateToNextMonth) {
			// Target the "Next month" button within the visible picker
			await datePickerPopper.getByRole('button', { name: 'Next month' }).click();
		}

		// Find and click the date button within the visible picker
		// Day buttons are: button.MuiPickersDay-root.MuiPickersDay-dayWithMargin (not hidden filler divs)
		const dateButton = datePickerPopper
			.locator('button.MuiPickersDay-root.MuiPickersDay-dayWithMargin')
			.filter({ hasText: new RegExp(`^${dayOfMonth}$`) })
			.first();
		await dateButton.click();
	}

	/**
	 * Fills in the Authorization Start Date by selecting today's date from the picker
	 * Opens the date picker, selects today's date
	 */
	async fillAuthorizationStartDate() {
		const field = this.getAuthorizationStartDateField();
		await field.click();

		// Get today's date
		const today = new Date();
		const dayOfMonth = today.getDate();

		// Select today's date from the picker
		await this.selectDateFromPicker(dayOfMonth);
	}

	/**
	 * Fills in the Authorization End Date by selecting a date 6 days from today
	 * Opens the date picker, navigates if needed, and selects the date
	 */
	async fillAuthorizationEndDate() {
		const field = this.getAuthorizationEndDateField();
		await field.click();

		// Calculate end date (6 days from today)
		const today = new Date();
		const endDate = new Date(today);
		endDate.setDate(today.getDate() + 6);

		const dayOfMonth = endDate.getDate();
		const needsNextMonth = endDate.getMonth() !== today.getMonth();

		// Select the end date from the picker
		await this.selectDateFromPicker(dayOfMonth, needsNextMonth);
	}

	/**
	 * Fills in the Authorization Start Date with a specific date string (manual input)
	 * @param {string} date - Date in MM/DD/YYYY format
	 */
	async fillAuthorizationStartDateManual(date) {
		const field = this.getAuthorizationStartDateField();
		await field.click();
		await field.fill('');
		await field.fill(date);
	}

	/**
	 * Fills in the Authorization End Date with a specific date string (manual input)
	 * @param {string} date - Date in MM/DD/YYYY format
	 */
	async fillAuthorizationEndDateManual(date) {
		const field = this.getAuthorizationEndDateField();
		await field.click();
		await field.fill('');
		await field.fill(date);
	}

	/**
	 * Selects authorization dates using the date picker
	 * Start date: Today
	 * End date: 6 days from start day
	 */
	async selectAuthorizationDateRange() {
		await this.fillAuthorizationStartDate();
		await this.fillAuthorizationEndDate();
	}

	/**
	 * Fills in the Total Amount Due
	 * @param {string|number} amount - The amount to enter
	 */
	async fillTotalAmountDue(amount) {
		const field = this.getTotalAmountDueField();
		await field.fill('');
		await field.fill(String(amount));
	}

	/**
	 * Fills in the Payer Notes
	 * @param {string} notes - The notes to enter
	 */
	async fillPayerNotes(notes) {
		const field = this.getPayerNotesField();
		await field.fill('');
		await field.fill(notes);
	}

	/**
	 * Switches to a different insurance tab by payer name
	 * @param {string} payerName - The payer/insurance name
	 */
	async switchToInsuranceTab(payerName) {
		await this.getInsuranceTab(payerName).click();
	}

	/**
	 * Switches to an insurance tab by index (0-based)
	 * @param {number} index - The tab index (0-based)
	 */
	async switchToInsuranceTabByIndex(index) {
		const tab = this.getInsuranceTabByIndex(index);
		await tab.waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC1 });
		await tab.click();
	}

	/**
	 * Fills the Prior Auth form for a specific coverage/insurance tab
	 * @param {number} tabIndex - The tab index (0-based)
	 * @param {Object} formData - The form data to fill
	 */
	async fillPriorAuthFormForTab(tabIndex, formData) {
		// Switch to the specified tab first
		await this.switchToInsuranceTabByIndex(tabIndex);
		// Then fill the form
		await this.fillPriorAuthForm(formData);
	}

	/**
	 * Extracts form values for a specific coverage/insurance tab
	 * @param {number} tabIndex - The tab index (0-based)
	 * @returns {Promise<Object>} The extracted form values
	 */
	async extractPriorAuthFormValuesForTab(tabIndex) {
		// Switch to the specified tab first
		await this.switchToInsuranceTabByIndex(tabIndex);
		// Then extract the form values
		return this.extractPriorAuthFormValues();
	}

	/**
	 * Submits the Prior Auth form and waits for API response (for existing records - PUT)
	 */
	async submitFormAndWaitForPUT() {
		const [response] = await Promise.all([
			this.page.waitForResponse(
				res => res.url().includes('/fhir/PriorAuthorization') && res.request().method() === 'PUT'
			),
			this.getSubmitButton().click(),
		]);

		return response;
	}

	/**
	 * Submits the Prior Auth form and waits for API response (for new records - POST)
	 */
	async submitFormAndWaitForPOST() {
		const [response] = await Promise.all([
			this.page.waitForResponse(
				res => res.url().includes('/fhir/PriorAuthorization') && res.request().method() === 'POST'
			),
			this.getSubmitButton().click(),
		]);

		return response;
	}

	/**
	 * Submits the Prior Auth form and waits for API response (handles both POST and PUT)
	 * Use this when you're not sure if it's a new or existing record
	 */
	async submitFormAndWaitForAPI() {
		const [response] = await Promise.all([
			this.page.waitForResponse(
				res =>
					res.url().includes('/fhir/PriorAuthorization') &&
					(res.request().method() === 'POST' || res.request().method() === 'PUT')
			),
			this.getSubmitButton().click(),
		]);

		return response;
	}

	/**
	 * Submits the Prior Auth form without waiting for API (just clicks submit)
	 * Useful when you want to handle the response separately
	 */
	async submitForm() {
		await this.getSubmitButton().click();
	}

	/**
	 * Fills the Prior Auth form with provided data
	 * @param {Object} formData - The form data to fill
	 * @param {string} formData.authorizationNumber - Authorization number
	 * @param {string} formData.status - Status (Approved, Denied, Pending, Unknown, NotRequired)
	 * @param {string} formData.startDate - Start date in MM/DD/YYYY format (for manual input)
	 * @param {string} formData.endDate - End date in MM/DD/YYYY format (for manual input)
	 * @param {boolean} formData.selectDatesFromPicker - If true, uses date picker to select today and today+6 days
	 * @param {string|number} formData.totalAmountDue - Total amount due
	 * @param {string} formData.payerNotes - Payer notes
	 */
	async fillPriorAuthForm(formData) {
		if (formData.status) {
			await this.selectStatus(formData.status);
		}

		if (formData.authorizationNumber) {
			await this.fillAuthorizationNumber(formData.authorizationNumber);
		}

		// Handle date selection - either from picker or manual input
		if (formData.selectDatesFromPicker) {
			// Use date picker: start date = today end date = start + 6 days
			await this.selectAuthorizationDateRange();
		} else {
			// Use manual date input if specific dates provided
			if (formData.startDate) {
				await this.fillAuthorizationStartDateManual(formData.startDate);
			}

			if (formData.endDate) {
				await this.fillAuthorizationEndDateManual(formData.endDate);
			}
		}

		if (formData.totalAmountDue !== undefined) {
			await this.fillTotalAmountDue(formData.totalAmountDue);
		}

		if (formData.payerNotes) {
			await this.fillPayerNotes(formData.payerNotes);
		}
	}

	/**
	 * Extracts the current Prior Auth form values
	 * @returns {Promise<Object>} The extracted form values
	 */
	async extractPriorAuthFormValues() {
		const formValues = {
			authorizationNumber: '',
			startDate: '',
			endDate: '',
			totalAmountDue: '',
			payerNotes: '',
			status: '',
		};

		// Get Authorization Number
		const authNumberField = this.getAuthorizationNumberField();
		if (await authNumberField.isVisible().catch(() => false)) {
			formValues.authorizationNumber = await authNumberField.inputValue();
		}

		// Get Start Date
		const startDateField = this.getAuthorizationStartDateField();
		if (await startDateField.isVisible().catch(() => false)) {
			formValues.startDate = await startDateField.inputValue();
		}

		// Get End Date
		const endDateField = this.getAuthorizationEndDateField();
		if (await endDateField.isVisible().catch(() => false)) {
			formValues.endDate = await endDateField.inputValue();
		}

		// Get Total Amount Due
		const amountField = this.getTotalAmountDueField();
		if (await amountField.isVisible().catch(() => false)) {
			formValues.totalAmountDue = await amountField.inputValue();
		}

		// Get Payer Notes
		const notesField = this.getPayerNotesField();
		if (await notesField.isVisible().catch(() => false)) {
			formValues.payerNotes = await notesField.inputValue();
		}

		// Get selected status from pressed button
		formValues.status = await this.getSelectedStatusText();

		return formValues;
	}

	/**
	 * Verifies that the drawer displays the expected coverage information
	 * @param {Object} expectedCoverage - Expected coverage data
	 */
	async verifyCoverageCardInfo(expectedCoverage) {
		if (expectedCoverage.payerName) {
			await expect(this.getPayerName()).toContainText(expectedCoverage.payerName);
		}
		if (expectedCoverage.memberId) {
			await expect(this.getMemberId()).toContainText(expectedCoverage.memberId);
		}
	}

	/**
	 * Verifies the drawer/panel is visible and contains key elements
	 */
	async verifyDrawerIsOpen() {
		await expect(this.getContainer()).toBeVisible();
		await expect(this.getCloseButton()).toBeVisible();
	}

	/**
	 * Checks if the drawer has coverage information available
	 * @returns {Promise<boolean>} True if coverage info exists, false otherwise
	 */
	async hasCoverageInfo() {
		const noCoverageMessage = this.getNoCoverageMessage();
		const isNoCoverageVisible = await noCoverageMessage.isVisible().catch(() => false);
		return !isNoCoverageVisible;
	}
	//#endregion Actions
}
module.exports = { PriorAuthDrawerPage };

