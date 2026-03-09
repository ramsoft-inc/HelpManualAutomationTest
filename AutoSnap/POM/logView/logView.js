const { Sidebar } = require('../sidebar');
const { Common } = require('../common');
const { ApiWaitUtils } = require('../apiWaitUtils');

const LOG_API_ENDPOINTS = {
	DICOM: 'Task',
	AUDIT: 'AuditEvent',
	ACTIVITY_HISTORY: 'AuditEvent',
};

class LogView {
	constructor(page) {
		this.page = page;
		this.common = new Common(this.page, '');
		this.sidebar = new Sidebar(this.page);
		this.apiWaitUtils = new ApiWaitUtils(this.page);
	}

	speedDialBtn() {
		return this.page.locator('button[aria-label="SpeedDial Menu"]');
	}

	auditLogActionBtn() {
		return this.page.getByTestId('Avatar Audit Log');
	}

	activityHistoryActionBtn() {
		return this.page.getByTestId('Avatar Activity History');
	}

	filterDropdown(filterName) {
		return this.page.locator(
			`.MuiAutocomplete-root:has(legend:has-text("${filterName}")) button[aria-label="Open"]`
		);
	}

	dateFilterPresetsBtn(filterName) {
		return this.page.locator(`[data-cy="${filterName}_filter"] button[aria-label="Presets"]`);
	}

	// Select a date preset from date filter
	async selectDatePreset(filterName, presetName) {
		await this.dateFilterPresetsBtn(filterName).click();
		await this.page.locator('#pill-popper').getByText(presetName, { exact: true }).click();
	}

	// Select an option from a dropdown filter
	async selectDropdownOption(filterName, menuItem) {
		await this.filterDropdown(filterName).click();
		await this.page.getByRole('option', { name: menuItem, exact: true }).click();
	}

	// Navigate to Audit Logs page
	async openAuditLogs() {
		await this.sidebar.menuIcon('log').click();
		await this.page.waitForURL('**/log');
		await this.speedDialBtn().click();
		await this.auditLogActionBtn().click();
	}

	// Navigate to Activity History page
	async openActivityHistory() {
		await this.sidebar.menuIcon('log').click();
		await this.page.waitForURL('**/log');
		await this.speedDialBtn().click();
		await this.activityHistoryActionBtn().click();
	}

	// Navigate to DICOM Log page
	async openDICOMLog() {
		await this.sidebar.menuIcon('log').click();
		await this.page.waitForURL('**/log');
	}

	async filterBySingleColumn(columnName, criteria, apiEndpoint) {
		await this.page.route(`**/${apiEndpoint}/elk*`, route => route.continue());
		await Promise.all([this.common.filterRecordsBySingleColumn(columnName, criteria),
		this.apiWaitUtils.waitForAPI(`/${apiEndpoint}/elk`, 'GET')]);
	}

	async filterBySuggestionColumn(columnName, criteria, apiEndpoint) {
		await this.page.route(`**/${apiEndpoint}/elk*`, route => route.continue());
		await Promise.all([this.common.filterRecordsBySuggestionColumn(columnName, criteria),
		this.apiWaitUtils.waitForAPI(`/${apiEndpoint}/elk`, 'GET')]);
	}

	async filterByMultiSelectionColumn(columnName, criteria, apiEndpoint) {
		await this.page.route(`**/${apiEndpoint}/elk*`, route => route.continue());
		await Promise.all([this.common.filterRecordsByMultiSelectionColumn(columnName, criteria),
		this.apiWaitUtils.waitForAPI(`/${apiEndpoint}/elk`, 'GET')]);
	}
}

module.exports = { LogView };