const TIMEOUTS = require('./timeouts');

// Common utility class for shared functionality across Page Objects
class Common {
	constructor(page, apiContext, testInfo) {
		this.page = page;
		this.apiContext = apiContext;
		this.testInfo = testInfo;
	}

	/**
	 * Generic single column filter - works with text input filters
	 * @param {string} columnName - The column name (e.g., 'Patient Name')
	 * @param {string} criteria - The search text
	 */
	async filterRecordsBySingleColumn(columnName, criteria) {
		const filterLocator = this.page.locator(`[data-cy="${columnName}_filter"]`);
		await filterLocator.click({ force: true });
		
		const inputField = filterLocator.locator('input[type="text"], input:not([type])').first();
		await inputField.clear();
		await inputField.fill(criteria);
		
		// Wait for options to appear and select the matching one
		await this.page.waitForTimeout(1000); // Brief wait for autocomplete
		
		// Try to find and click the exact match in dropdown if it appears
		const optionLocator = this.page.locator(`li[role="option"]`).filter({ hasText: new RegExp(`^${criteria}$`, 'i') });
		const optionCount = await optionLocator.count();
		
		if (optionCount > 0) {
			await optionLocator.first().click({ force: true });
		} else {
			// If no dropdown, just press Enter
			await inputField.press('Enter');
		}
	}

	/**
	 * Generic suggestion/autocomplete column filter
	 * @param {string} columnName - The column name (e.g., 'Managing Organization')
	 * @param {string} criteria - The search text
	 */
	async filterRecordsBySuggestionColumn(columnName, criteria) {
		const filterLocator = this.page.locator(`[data-cy="${columnName}_filter"]`);
		await filterLocator.click({ force: true });
		
		const inputField = filterLocator.locator('input[type="text"], input:not([type])').first();
		await inputField.clear();
		await inputField.fill(criteria);
		
		// Wait for suggestions to load
		await this.page.waitForTimeout(1500);
		
		// Click the matching suggestion from autocomplete dropdown
		try {
			await this.page
				.locator(`li[role="option"]`)
				.filter({ hasText: new RegExp(`^${criteria}$`, 'i') })
				.first()
				.click({ timeout: 5000 });
		} catch (error) {
			console.warn(`Could not find exact match for "${criteria}", trying contains match`);
			await this.page
				.locator(`li[role="option"]`)
				.filter({ hasText: new RegExp(criteria, 'i') })
				.first()
				.click();
		}
	}

	/**
	 * Generic dynamic filter column (similar to suggestion but may have different behavior)
	 * @param {string} columnName - The column name
	 * @param {string} criteria - The search text
	 */
	async filterRecordsByDynamicFilterColumn(columnName, criteria) {
		const filterLocator = this.page.locator(`[data-cy="${columnName}_filter"]`);
		await filterLocator.click({ force: true });
		
		const inputField = filterLocator.locator('input').first();
		await inputField.clear();
		await inputField.fill(criteria);
		
		// Wait for dynamic options to load
		await this.page.waitForTimeout(1500);
		
		// Select from dropdown
		await this.page
			.locator(`li[role="option"]`)
			.filter({ hasText: new RegExp(`^${criteria}$`, 'i') })
			.first()
			.click();
	}

	/**
	 * Generic multi-selection column filter (dropdown with checkboxes)
	 * @param {string} columnName - The column name (e.g., 'Study Status')
	 * @param {string|string[]} criteria - Single value or array of values to select
	 */
	async filterRecordsByMultiSelectionColumn(columnName, criteria) {
		const filterLocator = this.page.locator(`[data-cy="${columnName}_filter"]`);
		
		// Click to open the dropdown
		await filterLocator.click({ force: true });
		
		// Wait for dropdown to open
		await this.page.waitForTimeout(1000);
		
		// Convert single value to array for consistent handling
		const criteriaArray = Array.isArray(criteria) ? criteria : [criteria];
		
		// Select each option from the dropdown
		for (const value of criteriaArray) {
			try {
				// Look for the option in the dropdown
				const optionLocator = this.page
					.locator(`li[role="option"]`)
					.filter({ hasText: new RegExp(`^${value}$`, 'i') });
				
				// Wait for the option to be available
				await optionLocator.first().waitFor({ state: 'visible', timeout: 5000 });
				
				// Click the option
				await optionLocator.first().click({ force: true });
				
				// Brief wait between selections for multi-select
				await this.page.waitForTimeout(500);
			} catch (error) {
				console.error(`Failed to select option "${value}" from "${columnName}" filter:`, error.message);
				throw error;
			}
		}
		
		// Close the dropdown by pressing Escape or clicking outside
		await this.page.keyboard.press('Escape');
		await this.page.waitForTimeout(500);
	}

	/**
	 * Generic date range filter (for date/time columns)
	 * @param {string} columnName - The column name (e.g., 'Study Date/Time')
	 * @param {Object} dateRange - Object with 'start' and 'end' date strings or Date objects
	 */
	async filterRecordsByDateRange(columnName, dateRange) {
		const filterLocator = this.page.locator(`[data-cy="${columnName}_filter"]`);
		await filterLocator.click({ force: true });
		
		// Wait for date picker to open
		await this.page.waitForTimeout(1000);
		
		// Implementation would depend on your specific date picker component
		// This is a placeholder for date range filtering
		console.warn('Date range filtering not fully implemented - needs app-specific logic');
	}

	/**
	 * Clear all filters in the current grid/table
	 */
	async clearAllFilters() {
		const clearButton = this.page.getByRole('button', { name: 'Clear All' });
		const isVisible = await clearButton.isVisible();
		
		if (isVisible) {
			await clearButton.click({ force: true });
			await this.page.waitForTimeout(1000);
		}
	}

	/**
	 * Generic method to get table cell text by row and column
	 * @param {number} rowIndex - Zero-based row index
	 * @param {string} columnName - Column name
	 * @returns {Promise<string>} Cell text content
	 */
	async getTableCellText(rowIndex, columnName) {
		const cell = this.page.locator(`[data-cy="study-status-table"] tbody tr`).nth(rowIndex).locator(`td[data-cy*="${columnName}"]`);
		return await cell.textContent();
	}
}

exports.Common = Common;
