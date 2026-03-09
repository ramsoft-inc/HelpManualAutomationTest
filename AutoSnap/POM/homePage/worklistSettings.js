const { expect } = require('@playwright/test');

const { TIMEOUT_IN_MSEC3 } = require('../timeouts');
const { HomePage } = require('./homePage');
const { Common } = require('../common');
const { ApiWaitUtils } = require('../apiWaitUtils');

class WorklistSettings {
	constructor(page) {
		this.page = page;
		this.common = new Common(page);
		this.apiWaitUtils = new ApiWaitUtils(this.page);
		this.homePage = new HomePage(this.page);
	}

	roleModeToggleBtn() {
		return this.page.locator('[data-testid="rolesModeToggleButton"]');
	}

	cancelBtn() {
		return this.page.locator('[data-cy="CancelSettings"]');
	}

	saveNewWorklistBtn() {
		return this.page.locator('[data-cy="Save_"]');
	}

	saveExistingWorklistBtn() {
		return this.page.locator('[data-cy="Save_SAVE AS NEW WORKLIST"]');
	}

	saveEditWorklistBtn() {
		return this.page.locator('[data-cy="Save_DUPLICATE FOR A NEW WORKLIST"]');
	}

	saveExistingWorklistArrowIcon() {
		return this.page.locator('[data-cy="PrimaryExpand"]');
	}

	saveAsNewWorklistMenu() {
		return this.page.locator('[aria-labelledby="Primary Button Menu"]').locator('li');
	}

	//#region - User worklist settings elements
	userWorklistBtn() {
		return this.roleModeToggleBtn().locator('[aria-label="Worklist Settings"]');
	}

	closeUserWorklistDrawerBtn(isNew) {
		return isNew
			? this.page.locator('[data-cy="New Worklist_close"]')
			: this.page.locator('[data-cy="Worklist Settings_close"]');
	}

	userWorklistHeader(isNew) {
		return isNew
			? this.page.locator('.css-1j6jpvb').getByText('New Worklist')
			: this.page.locator('.css-1j6jpvb').getByText('Worklist Settings');
	}

	userSelectorLbl() {
		return this.page.locator('[data-cy="WLSettingsUserSelector"]');
	}

	userSelectorSearchBox() {
		return this.page.locator('[data-cy="WLSettingsUserSelector"]').locator('input');
	}

	userWorklistNameLbl() {
		return this.page.locator('[data-cy="SettingWLName"]');
	}

	userWorklistNameCombo() {
		return this.page.locator('[data-cy="SettingWLName"]').locator('div').locator('input');
	}

	userWorklistNameTxt() {
		return this.page.locator('[testid="worklistNameField"]').locator('input');
	}

	closeSaveNewWorklistDrawerBtn() {
		return this.page.locator('[data-cy="Save for a New Worklist_close"]');
	}

	saveAsNewWorklistHeader() {
		return this.page.locator('[data-cy="Save for a New Worklist_close"]').locator('h6');
	}

	typeWorklistName() {
		return this.page.locator('text=Type Worklist Name').locator('input');
	}
	//#endregion - User worklist settings elements

	//#region - Role worklist settings elements
	roleWorklistBtn() {
		return this.roleModeToggleBtn().locator('[aria-label="Role Worklist Settings"]');
	}

	closeRoleWlDrawerBtn() {
		return this.page.locator('[data-cy="Role Worklist Settings_close"]');
	}

	roleWorklistHeader(isNew) {
		return isNew ? this.page.locator('text=New Role Worklist') : this.page.locator('text=Role Worklist Settings');
	}

	organizationLbl() {
		return this.page.locator('#autocomplete-field-Organization-label');
	}

	organizationCombo() {
		return this.page.locator('#autocomplete-field-Organization');
	}

	roleLbl() {
		return this.page.locator('#autocomplete-field-Role-label');
	}

	roleCombo() {
		return this.page.locator('#autocomplete-field-Role');
	}

	roleWorklistNameTxt() {
		return this.page.locator('[name="roleWorklistName"]');
	}
	//#endregion - Role worklist settings elements

	//#region - Columns tab
	addColumnBtn() {
		return this.page.locator('[data-cy="add-new-btn"]');
	}

	columnNameSearchBoxOnColumnsTab(index) {
		return this.page.locator(`[data-cy="SearchableSingleSelect${index}"]`).locator('input');
	}
	//#endregion - Columns tab

	//#region - Filters tab
	filtersTab() {
		return this.page.locator('[data-cy="FILTERS_WorklistSpeedDial"]');
	}

	columnNameSearchBoxOnFiltersTab(colName) {
		return this.page.locator(`form [data-cy="${colName}_filter"]`);
	}

	async addColumnSort(columntTitle) {
		await this.page.locator('[data-testid="searchable-user-selector-textfield"]').click();
		await this.page.locator('[role="option"]', { hasText: columntTitle }).click();
	}

	async addColumnTextFilter(columnName, criteria) {
		const inputField = await this.page.locator(`[data-cy="${columnName}_filter"]`, { timeout: 10000 });

		inputField.click({ force: true });
		await this.page.waitForTimeout(2000);
		await inputField.locator('input').clear();
		await inputField.locator('input').pressSequentially(criteria);
	}

	//#endregion - Filters tab

	// Use this method to create a new worklist
	async createNewWorklist(worklistName, columns) {
		await this.userWorklistNameTxt().fill(worklistName);

		for (const column of columns) {
			await this.addColumnBtn().click();
			await this.common.selectOptionFromSingleSelectionSuggestion(
				this.columnNameSearchBoxOnColumnsTab(0),
				column
			);
		}

		const responsePromise = this.apiWaitUtils.waitForAPI('/fhir/WorklistLayout', 'POST');
		await this.saveNewWorklistBtn().click();
		const response = await responsePromise;

		await expect(this.homePage.worklistTitle()).toHaveText(worklistName, { timeout: TIMEOUT_IN_MSEC3 });

		return response;
	}

	// Use this method to delete a worklist
	async deleteWorklist(worklistName) {
		// Wait for input to be loaded with current value
		await this.page.waitForTimeout(2000);
		await this.userWorklistNameCombo().fill('');
		await this.userWorklistNameCombo().pressSequentially(worklistName);

		// Wait for and hover the menu item
		const menuItem = this.page.locator('li[role="menuitem"]', { hasText: worklistName });
		await menuItem.waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC3 });
		await menuItem.hover();

		// Perform the click actions to set as default
		await this.page.locator('[id="more-button"]').click();
		await this.page.locator('li', { hasText: 'Delete' }).click();

		return this.apiWaitUtils.waitForAPI('/fhir/WorklistLayout', 'DELETE');
	}

	// Use this method to switch between worklists
	async switchWorklist(worklistName) {
		await this.userWorklistNameCombo().fill(worklistName);
		await this.page.waitForTimeout(4000);
		this.page.locator('[id="composition-menu"]').locator(`text=${worklistName}`).click();
		await this.page.waitForTimeout(4000);
		await this.saveExistingWorklistBtn().click();
	}

	// Use this method to set a worklist as default
	// IMPORTANT: Use with care - this will change the default worklist, we must reset it back after test
	async setDefaultWorklist(worklistName) {
		// Wait for input to be loaded with current value
		await this.page.waitForTimeout(2000);
		await this.userWorklistNameCombo().fill('');
		await this.userWorklistNameCombo().pressSequentially(worklistName);

		// Wait for and hover the menu item
		const menuItem = this.page.locator('li[role="menuitem"]', { hasText: worklistName });
		await menuItem.waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC3 });
		await menuItem.hover();

		// Perform the click actions to set as default
		await this.page.locator('[id="more-button"]').click();
		await this.page.locator('li', { hasText: 'Set Default' }).click();

		await expect(this.homePage.worklistTitle()).toHaveText(worklistName);
	}
}

module.exports = { WorklistSettings };