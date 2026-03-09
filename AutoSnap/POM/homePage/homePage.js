const { expect } = require('@playwright/test');
const dayjs = require('dayjs');

const TIMEOUTS = require('../timeouts');
const { Common } = require('../common');
const { Sidebar } = require('../sidebar');

class HomePage {
	constructor(page) {
		this.page = page;
		this.common = new Common(this.page, '');
		this.sidebar = new Sidebar(this.page);
	}

	deleteStudyButton() {
		return this.page.locator('[data-testid="selected-resources-button"]').describe('delete study button');
	}

	worklistLbl() {
		return this.page.locator('.grid-toolbar >> text=Worklist');
	}

	worklistTitle() {
		return this.page.locator('[id="gridTitle"]');
	}

	pagination() {
		return this.page.locator('.grid-toolbar .pagination >> text=of');
	}

	studiesCount() {
		return this.page.locator('.pagination').last();
	}

	worklistTable() {
		return this.page.locator('[data-cy="study-status-table"]');
	}

	worklistTableHeader() {
		return this.worklistTable().locator('th');
	}

	worklistTableRows() {
		return this.worklistTable().locator('tbody > tr');
	}

	worklistPidRow() {
		return this.page.getByTestId('study-status-cell-0_patientID');
	}

	deleteFromFilterCapsule(filterName) {
		return this.page.locator(`[data-cy="${filterName}_capsule-delete"]`);
	}

	filterCapsule(filterName) {
		return this.page.locator(`[data-cy="${filterName}_capsule_filter"]`);
	}

	/** DateTimeRangePicker input that displays the selected range (same format as filter capsule value) */
	dateTimePickerDisplay(labelName) {
		return this.page.getByRole('textbox', { name: labelName });
	}

	clearFilterCapsule() {
		return this.page.getByRole('button', { name: 'Clear All' });
	}

	saveWorklistBtn() {
		return this.page.getByTestId('saveGrid');
	}

	columnFilter(columnName) {
		return this.page.locator(`[data-cy="${columnName}_filter"]`);
	}

	column(columnName) {
		return this.page.locator(`[data-cy="${columnName}_column"]`);
	}

	/**
	 *  Use regex for partial matching because some icon buttons append an aria-label
	 */
	columnHeader(columnName) {
		return this.page.getByRole('columnheader', { name: new RegExp(columnName) });
	}

	columnResizer(columnName) {
		return this.columnHeader(columnName).getByTestId(/-resizer/);
	}

	documentViewerBtn() {
		return this.page.locator('[name="documentviewer"]');
	}

	addNewBtn() {
		return this.page.locator('[aria-label="Add New button"]');
	}

	homePageBtn() {
		return this.page.locator('[data-cy="sidebar-home"]');
	}

	organizationPageBtn() {
		return this.page.locator('[data-cy="sidebar-organization"]');
	}

	importBtn() {
		return this.page.locator('[data-cy="importBtn"]');
	}

	newOrderBtn() {
		return this.page.getByText('Order').first();
	}

	columnGroupingBar() {
		return this.page.getByTestId('worklist-grouping-dropable');
	}

	columnGroupingPill(columnName) {
		return this.columnGroupingBar().getByRole('button', { name: columnName });
	}

	// Can work both in New and Old worklist
	progressBar() {
		return this.page.getByTestId('new-worklist-grid').getByRole('progressbar');
	}

	// Three dots button to show more filter options in case of overflow
	filterShowMoreBtn() {
		return this.page.getByTestId('filter-show-more').getByRole('button');
	}

	refreshWorklistBtn() {
		return this.page.getByRole('button', { name: 'Refresh Grid' });
	}

	async waitForWorklistPageNumberChange() {
		const paginationText = await this.pagination().innerText();
		await this.page.waitForFunction(async () => (await this.pagination().innerText()) !== paginationText, {
			timeout: 5000,
		});
	}

	async getRowText(searchString) {
		const rowData = {};
		const row = await this.worklistTable().locator(`tr:has-text("${searchString}")`);
		const index = await row.evaluate(node => node.rowIndex);
		const cells = await this.page.locator(`#MUIDataTableBodyRow-worklist-${index} td div`);

		for (let i = 0; i < cells.count(); i += 2) {
			const colName = await cells.nth(i).innerText();
			const colVal = await cells.nth(i + 1).innerText();
			rowData[colName] = colVal;
		}

		return rowData;
	}

	async waitForWorklistTableToLoad() {
		await expect(this.progressBar()).toBeHidden({ timeout: TIMEOUTS.TIMEOUT_IN_MSEC3 });
	}

	async scrollWorklistToBottom() {
		const rows = this.worklistTableRows();
		const initialRowCount = await rows.count();
		await rows.last().scrollIntoViewIfNeeded();
		await expect.poll(() => rows.count(), { timeout: TIMEOUTS.TIMEOUT_IN_MSEC3 }).toBeGreaterThan(initialRowCount);
	}

	async openHomePage() {
		await this.page.route('**/ImagingStudyWorklist/elk*', route => route.continue());
		await this.sidebar.menuIcon('home').click();
		await this.page.waitForResponse('**/ImagingStudyWorklist/elk*');
	}

	async filterStudiesBySingleColumn(columnName, criteria) {
		await this.common.filterRecordsBySingleColumn(columnName, criteria);
		await this.waitForWorklistTableToLoad();
	}

	async filterStudiesBySuggestionColumn(columnName, criteria) {
		await this.common.filterRecordsBySuggestionColumn(columnName, criteria);
		await this.waitForWorklistTableToLoad();
	}

	async filterStudiesByDynamicFilterColumn(columnName, criteria) {
		await this.common.filterRecordsByDynamicFilterColumn(columnName, criteria);
	}

	async filterStudiesByMultiSelectionColumn(columnName, criteria) {
		await this.common.filterRecordsByMultiSelectionColumn(columnName, criteria);
		await this.waitForWorklistTableToLoad();
	}

	async verifyNumberOfDicomObject(row, columnName, expectedValue) {
		const cellText = await this.page.evaluate(
			(row, colName) => {
				return window.getTableCellText(row, colName);
			},
			row,
			columnName
		);

		expect(cellText).toBe(expectedValue);
	}

	// Filter by dynamic filter by selecting criteria from dropdown
	async filterByDynamicFilter(labelName, criteria) {
		const combo = this.page
			.getByTestId('suggest-infinite-scroll-multiple')
			.filter({ has: this.page.getByRole('combobox', { name: labelName, exact: true }) });
		await combo.getByRole('combobox').click();
		await expect(this.page.locator('li[role="option"]').first()).toBeVisible({
			timeout: TIMEOUTS.TIMEOUT_IN_MSEC3,
		}); // Wait for options to be visible, avoid race condition with next API call
		await combo.getByRole('combobox').fill(criteria);
		await this.page
			.locator('li[role="option"]', { hasText: new RegExp(`^${criteria}$`, 'i') })
			.first()
			.click();
		await this.waitForWorklistTableToLoad();
	}

	/**
	 * Filter by date time range picker
	 * @param {string} labelName - Label name of the date time range picker
	 * @param {dayjs object} start - Start date time
	 * @param {dayjs object} end - End date time
	 */
	async filterByDateTimeRange(labelName, { start, end }) {
		await this.page.getByRole('textbox', { name: labelName }).click();

		await this.page.getByRole('tab', { name: 'dateTab' }).click();

		const now = dayjs();
		await this.navigateToDateIfNeeded({ expectedDate: start, currentDate: now });
		await this.page.getByRole('button', { name: start.format('MMM D, YYYY') }).click(); // e.g., 'Dec 8, 2025'

		await this.navigateToDateIfNeeded({ expectedDate: end, currentDate: start });
		await this.page.getByRole('button', { name: end.format('MMM D, YYYY') }).click(); // e.g., 'Dec 8, 2025'

		await this.page.getByRole('tab', { name: 'timeTab' }).click();

		await this.page.getByRole('tab', { name: 'first date' }).click();
		await this.page.getByRole('button', { name: start.format('A') }).click();
		const startHour = start.format('hh');
		const startMinute = start.format('mm');
		await this.page.locator('div').filter({ hasText: /^H:$/ }).getByRole('textbox').fill(startHour);
		await this.page.locator('div').filter({ hasText: /^M:$/ }).getByRole('textbox').fill(startMinute);

		await this.page.getByRole('tab', { name: 'second date' }).dblclick();
		await this.page.getByRole('button', { name: end.format('A') }).click();
		const endHour = end.format('hh');
		const endMinute = end.format('mm');
		await this.page.locator('div').filter({ hasText: /^H:$/ }).getByRole('textbox').fill(endHour);
		await this.page.locator('div').filter({ hasText: /^M:$/ }).getByRole('textbox').fill(endMinute);

		await this.page.getByTestId('DONE_').dblclick();
		await this.waitForWorklistTableToLoad();
	}

	/**
	 * Filter by date range only (no time) - filterCapsule shows e.g. "Mon 1/19/2026 - Wed 1/21/2026"
	 * Uses same path as filterByDateTimeRange (time tab then Done) so the same Done button is used; leaves default times (whole day).
	 * @param {string} labelName - Label name of the date time range picker (e.g. 'Study Date/Time')
	 * @param {{ start: dayjs.Dayjs, end: dayjs.Dayjs }} range - Start and end dates
	 */
	async filterByDateRangeOnly(labelName, { start, end }) {
		await this.page.getByRole('textbox', { name: labelName }).click();
		await this.page.getByRole('tab', { name: 'dateTab' }).click();

		const now = dayjs();
		await this.navigateToDateIfNeeded({ expectedDate: start, currentDate: now });
		await this.page.getByRole('button', { name: start.format('MMM D, YYYY') }).click();
		await this.navigateToDateIfNeeded({ expectedDate: end, currentDate: start });
		await this.page.getByRole('button', { name: end.format('MMM D, YYYY') }).click();

		// Time tab then Done (same as filterByDateTimeRange) so filter applies; default times = whole day → date-only capsule
		await this.page.getByRole('tab', { name: 'timeTab' }).click();
		await this.page.getByTestId('DONE_').dblclick();
		await this.waitForWorklistTableToLoad();
	}

	/**
	 * Filter by single date (whole day) - filterCapsule shows e.g. "Mon 1/19/2026 - Mon 1/19/2026"
	 * Selects same date as start and end, then time tab + Done (same path as filterByDateTimeRange).
	 * @param {string} labelName - Label name of the date time range picker
	 * @param {dayjs.Dayjs} date - The single date to select
	 */
	async filterBySingleDate(labelName, date) {
		await this.page.getByRole('textbox', { name: labelName }).click();
		await this.page.getByRole('tab', { name: 'dateTab' }).click();

		const now = dayjs();
		await this.navigateToDateIfNeeded({ expectedDate: date, currentDate: now });
		const dateButton = this.page.getByRole('button', { name: date.format('MMM D, YYYY') });
		await dateButton.click();
		await dateButton.click(); // same date as end = whole day
		// Time tab then Done (same as filterByDateTimeRange) so filter applies
		await this.page.getByRole('tab', { name: 'timeTab' }).click();
		await this.page.getByTestId('DONE_').dblclick();
		await this.waitForWorklistTableToLoad();
	}

	/**
	 * Navigate to expected date in date picker if needed
	 * @param {dayjs object} expectedDate - The date to navigate to in the date picker
	 * @param {dayjs object} currentDate - The date currently displayed in the date picker
	 * @param {number} timeout - Timeout in milliseconds for polling
	 */
	async navigateToDateIfNeeded({ expectedDate, currentDate, timeout = TIMEOUTS.TIMEOUT_IN_MSEC3 }) {
		const isExpectedDateTitleVisible = await this.page.getByText(expectedDate.format('MMMM YYYY')).isVisible(); // e.g., 'December 2025'
		if (isExpectedDateTitleVisible) return;

		if (expectedDate.isBefore(currentDate, 'month')) {
			await expect
				.poll(
					async () => {
						await this.page.getByRole('button', { name: 'Previous month' }).click();
						return await this.page.getByText(expectedDate.format('MMMM YYYY')).isVisible();
					},
					{ timeout }
				)
				.toBe(true);
		} else if (expectedDate.isAfter(currentDate, 'month')) {
			await expect
				.poll(
					async () => {
						await this.page.getByRole('button', { name: 'Next month' }).click();
						return await this.page.getByText(expectedDate.format('MMMM YYYY')).isVisible();
					},
					{ timeout }
				)
				.toBe(true);
		}
	}

	/**
	 * Filter by dynamic filter by selecting blank value
	 * Note: Only relevant in New Worklist
	 * @param {*} labelName Label name of the dynamic filter
	 */
	async filterByDynamicFilterBlankValue(labelName) {
		const combo = this.page
			.getByTestId('suggest-infinite-scroll-multiple')
			.filter({ has: this.page.getByRole('combobox', { name: labelName, exact: true }) });
		await combo.getByRole('combobox').click();

		await this.page.getByRole('option', { name: '(Blank)' }).click();

		// Wait for loading to complete
		await this.waitForWorklistTableToLoad();
	}

	// Clear all filters by clicking on clear filter button
	async clearAllFilters() {
		await this.clearFilterCapsule().click();
		await this.waitForWorklistTableToLoad();
	}

	// Change filter operator of advance filter
	async changeFilterOperator(labelName, operator) {
		const advanceFilterPills = this.page.locator(`[data-cy="${labelName}_capsule_filter"]`);
		await advanceFilterPills.click();
		const operatorSelector = this.page.getByTestId('filter-capsule-operator');
		await operatorSelector.click();
		await this.page.getByText(operator, { exact: true }).click();
		await advanceFilterPills.click();
	}

	// Filter by free text in dynamic filter
	async filterByDynamicFreeText(labelName, criteria) {
		const combo = this.page.getByRole('combobox', { name: labelName });
		await combo.click();
		await combo.fill(criteria);
		await combo.press('Enter');
		await this.page.waitForResponse(
			resp => resp.url().includes('/ImagingStudyWorklist/elk') && resp.request().method() === 'POST'
		);
	}

	/**
	 * Group by a column
	 * @param {string} columnName: Name of the column to be grouped
	 */
	async groupByColumn(columnName) {
		const MOUSE_MOVE_STEPS = 100; // Relatively high number of steps for slow mouse movement

		const combo = this.columnHeader(columnName);
		await combo.scrollIntoViewIfNeeded();

		const columnGroupingBarBox = await this.columnGroupingBar().boundingBox();
		const endX = columnGroupingBarBox.x + columnGroupingBarBox.width / 2;
		const endY = columnGroupingBarBox.y + columnGroupingBarBox.height / 2;

		await combo.hover();
		await this.page.mouse.down();
		await this.page.mouse.move(endX, endY, { steps: MOUSE_MOVE_STEPS });
		await this.page.mouse.up();

		// Wait for loading to complete
		await this.waitForWorklistTableToLoad();
	}

	/**
	 * Resize a column to a specified width
	 * @param {string} columnName: Name of the column to be resized
	 * @param {number} width: The target width of the column in pixels
	 */
	async resizeColumn(columnName, width) {
		const MOUSE_MOVE_STEPS_FOR_RESIZE = 100; // Relatively high number of steps for slow mouse movement
		const columnResizerBox = await this.columnResizer(columnName).boundingBox();
		const columnHeaderBox = await this.columnHeader(columnName).boundingBox();

		const startX = columnResizerBox.x + columnResizerBox.width / 2;
		const startY = columnResizerBox.y + columnResizerBox.height / 2;

		const endX = startX + (width - columnHeaderBox.width);
		const endY = startY;

		await this.columnResizer(columnName).hover();
		await this.page.mouse.down();
		await this.page.mouse.move(endX, endY, { steps: MOUSE_MOVE_STEPS_FOR_RESIZE });
		await this.page.mouse.up();

		const actualWidth = (await this.columnHeader(columnName).boundingBox()).width;
		expect(actualWidth).toBeCloseTo(width);
	}

	/**
	 * Reorder column to the position based on offset index
	 * @param {string} columnName: Name of the column to be reordered
	 * @param {number} offsetIndex: The target position index (0-based)
	 */
	async reorderColumn(columnName, offsetIndex) {
		const sourceColumnHeader = this.columnHeader(columnName);
		const targetColumnHeader = this.page.getByRole('columnheader').nth(offsetIndex);
		const targetColumnBox = await targetColumnHeader.boundingBox();

		await sourceColumnHeader.dragTo(targetColumnHeader, {
			targetPosition: {
				x: targetColumnBox.width * 0.75, // Drag to 75% of the target column width (right part)
				y: targetColumnBox.height / 2,
			},
		});
	}

	/**
	 * Sort a column by specified order
	 * @param {string} columnId Id of the column to be sorted
	 * @param {'Ascending' | 'Descending' | 'Remove'} sortDirection Sort direction.
	 * 'Ascending' for ascending order, 'Descending' for descending order, 'Remove' to clear sorting
	 */
	async sortByColumnId(columnId, sortDirection) {
		// Maximum number of attempts to achieve the desired sort direction
		// e.g. ASC -> DESC -> Remove (3 states) -> Maximum of 2 attempts
		const MAX_SORT_ATTEMPTS = 2;

		// Use arrow function to retain 'this' context
		const attemptToSort = async (attempts = MAX_SORT_ATTEMPTS) => {
			const sortButton = this.page.getByTestId(`headcol-${columnId}`);
			const currentSortDirection = await sortButton.getAttribute('aria-label');

			if (currentSortDirection === sortDirection) {
				return;
			}

			if (attempts <= 0) {
				throw new Error(
					`Failed to sort columnId ${columnId} by ${sortDirection} after multiple attempts. Please check if input parameters are correct. Current sort direction is ${currentSortDirection}.`
				);
			}

			await sortButton.click();
			await this.waitForWorklistTableToLoad();

			// Recursive call to attempt sorting again if needed
			await attemptToSort(attempts - 1);
		};

		await attemptToSort();
	}

	async switchToNewWorklist() {
		const tryNewWorklistToggle = this.page.getByRole('checkbox', { name: 'Try New Worklist' });
		const isNewWorklist = await tryNewWorklistToggle.isChecked();

		if (!isNewWorklist) {
			await tryNewWorklistToggle.click();
			await expect(tryNewWorklistToggle).toBeChecked();
		}

		const rows = this.worklistTableRows();
		await expect(rows.first()).toBeVisible({ timeout: TIMEOUTS.TIMEOUT_IN_MSEC3 }); // Increased timeout for slow environments
	}
}

module.exports = { HomePage };