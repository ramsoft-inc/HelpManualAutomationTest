import { TIMEOUT_IN_MSEC2 } from './timeouts.js';
import fs from 'fs';

export class PageHelper {
	constructor(page) {
		this.page = page;
	}

	async selectDateFromDatePicker(datePickerLocator, date) {
		const dateValue = new Date(date);
		const year = dateValue?.getFullYear();
		const month = dateValue?.toLocaleString('en-US', { month: 'short' });
		const day = dateValue?.getDate();

		await datePickerLocator?.click({ force: true });

		// Date pickers may have different aria-labels
		const switchBtn = this.page.locator('[aria-label="calendar view is open, switch"]');
		const switchToYearViewBtn = this.page.locator('[aria-label="calendar view is open, switch to year view"]');

		// Check which one exists and is visible, click the first available
		if (await switchBtn.isVisible().catch(() => false)) {
			console.log(
				`PageHelpers - selectDateFromDatePicker - found the year view by 'calendar view is open, switch' aria-label`
			);
			await switchBtn.click();
		} else if (await switchToYearViewBtn.isVisible().catch(() => false)) {
			console.log(
				`PageHelpers - selectDateFromDatePicker - found the year view by 'calendar view is open, switch to year view' aria-label`
			);
			await switchToYearViewBtn.click();
		} else {
			await this.page.getByText(`${month} ${year}`).click({ force: true });
			console.log(
				`PageHelpers - selectDateFromDatePicker - opened the year view by clicking on ${month} ${year} text`
			);
		}

		await this.page
			.locator('div')
			.filter({ hasText: new RegExp(`^${year}$`) })
			.getByRole('button')
			.click();
		await this.page.getByRole('button', { name: month, exact: true }).click();

		await this.page.getByRole('button', { name: `${month} ${day}, ${year}`, exact: true }).click();

		// Close the date picker
		if (await this.page.getByRole('button', { name: 'OK' }).isVisible()) {
			// When running the tests in headless mode on pipeline, the MUI date picker GUI looks different. It shows Clear, Cancel and OK buttons,
			// and the startDatePicker elelent is not visible. So the step closing the date picker needs to be different for headless and headed modes
			await this.page.getByRole('button', { name: 'OK' }).click({ force: true });
		}
	}

	async clearTextFieldValue(fieldLocator) {
		await fieldLocator?.click();
		await fieldLocator?.press('ControlOrMeta+a');
		await fieldLocator?.press('Backspace');
	}

	async selectComboBoxOption(optionName, isExactMatch) {
		await this.page
			.getByRole('option', { name: optionName, exact: isExactMatch ?? true })
			.first()
			.click({ force: true });
	}

	//#region functions for form fields that can be edited by hovering on the fields, and have different IDs in view and edit mode
	async selectOptionFromCombo(fieldInView, fieldInEdit, optionName, isMultiSelect) {
		await this.hoverOnFieldIfVisible(fieldInView);
		await fieldInEdit?.click({ force: true });

		await this.selectComboBoxOption(optionName);
		if (isMultiSelect) {
			await this.page.keyboard.press('Escape');
		}
	}

	async searchAndSelectOptionFromAutocompleteCombo(
		fieldInView,
		fieldInEdit,
		optionName,
		seachKey,
		isExactMatch,
		delayInMsec
	) {
		await this.hoverOnFieldIfVisible(fieldInView);
		await fieldInEdit?.click({ force: true });
		await fieldInEdit?.pressSequentially(seachKey ?? optionName, {
			delay: delayInMsec ?? 500,
		});
		await this.page
			.getByRole('option', { name: optionName })
			.waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC2 });
		await this.selectComboBoxOption(optionName, isExactMatch);
	}

	async inputValueForTextField(fieldInView, fieldInEdit, value) {
		await this.hoverOnFieldIfVisible(fieldInView);
		await fieldInEdit?.click({ force: true });
		await this.clearTextFieldValue(fieldInEdit);
		await fieldInEdit?.fill(value);
	}

	async hoverOnFieldIfVisible(field) {
		if (field && (await field.isVisible().catch(() => false))) {
			await field?.hover({ force: true });
		}
	}
	//#endregion functions for form fields that can be edited by hovering on the fields, and have differnt IDs in view and edit mode

	//#region Multi-select dropdown verification functions

	/**
	 * Verify that specific options are selected in a multi-select dropdown.
	 * Opens the dropdown, checks aria-selected attribute for each expected value, then closes the dropdown.
	 *
	 * @param {Locator} fieldLocator - The multi-select field locator to click and open dropdown
	 * @param {string[]} expectedSelectedValues - Array of option names that should be selected
	 * @param {Object} options - Optional configuration
	 * @param {boolean} options.closeAfter - Whether to close the dropdown after verification (default: true)
	 * @param {boolean} options.exactMatch - Whether to use exact matching for option names (default: true)
	 * @returns {Promise<{success: boolean, selected: string[], notSelected: string[]}>} - Result object with details
	 *
	 * @example
	 * // Verify selections in a Body Part dropdown
	 * const result = await pageHelper.verifyMultiSelectSelections(
	 *   page.locator('[id="form-field-Body Part"]'),
	 *   ['Abdomen', 'Abdominal aorta']
	 * );
	 * expect(result.success).toBe(true);
	 *
	 * @example
	 * // Verify and keep dropdown open for further interaction
	 * const result = await pageHelper.verifyMultiSelectSelections(
	 *   bodyPartField,
	 *   ['Abdomen'],
	 *   { closeAfter: false }
	 * );
	 */
	async verifyMultiSelectSelections(fieldLocator, expectedSelectedValues, options = {}) {
		const { closeAfter = true, exactMatch = true } = options;
		const result = {
			success: true,
			selected: [],
			notSelected: [],
		};

		// Open the dropdown
		await fieldLocator?.click();

		// Wait for listbox to be visible
		await this.page.getByRole('listbox').waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC2 });

		// Check each expected value
		for (const value of expectedSelectedValues) {
			const option = this.page.getByRole('option', { name: value, exact: exactMatch }).first();
			const isSelected = await option.getAttribute('aria-selected');

			if (isSelected === 'true') {
				result.selected.push(value);
			} else {
				result.notSelected.push(value);
				result.success = false;
			}
		}

		// Close dropdown if requested
		if (closeAfter) {
			await this.page.keyboard.press('Escape');
		}

		return result;
	}

	/**
	 * Assert that all expected options are selected in a multi-select dropdown.
	 * This is a convenience wrapper around verifyMultiSelectSelections that throws an assertion error on failure.
	 *
	 * @param {Locator} fieldLocator - The multi-select field locator
	 * @param {string[]} expectedSelectedValues - Array of option names that should be selected
	 * @param {string} fieldName - Name of the field for error messages (optional)
	 * @returns {Promise<void>}
	 * @throws {Error} If any expected values are not selected
	 *
	 * @example
	 * await pageHelper.assertMultiSelectSelections(
	 *   page.locator('[id="form-field-Body Part"]'),
	 *   ['Abdomen', 'Abdominal aorta'],
	 *   'Body Part'
	 * );
	 */
	async assertMultiSelectSelections(fieldLocator, expectedSelectedValues, fieldName = 'Multi-select field') {
		const result = await this.verifyMultiSelectSelections(fieldLocator, expectedSelectedValues);

		if (!result.success) {
			throw new Error(
				`${fieldName}: Expected values not selected. ` +
					`Selected: [${result.selected.join(', ')}], ` +
					`Not selected: [${result.notSelected.join(', ')}]`
			);
		}
	}

	//#endregion Multi-select dropdown verification functions

	/**
	 * Intercepts and modifies the feature flag API response.
	 *
	 * @param {Array<{ name: string, variationName?: string, variationKey?: string, value?: any }>} featureFlagArr
	 *   An array of feature flag objects to override in the API response.
	 *   - name: The feature flag name.
	 *   - variationName: variationName of the feature flag.
	 *   - variationKey: variationKey of the feature flag.
	 *   - value: variationKey of the feature flag.
	 *
	 * @example
	 * await pageHelper.modifyFeatureFlagApiResponse([
	 *   { name: 'sample-feature-flag-1', variationName: 'Variation On', variationKey: 'variation-on', value: true },
	 *   { name: 'sample-feature-flag-2', variationName: 'Variation 1', variationKey: 'variation-1', value: true },
	 *   { name: 'sample-feature-flag-3', variationName: 'Enabled', variationKey: 'enabled', value: true },
	 * ]); 	// Check the feature flag configration on DevCycle for the feature flag properties' values
	 */
	async modifyFeatureFlagApiResponse(featureFlagArr) {
		if (Array.isArray(featureFlagArr) && featureFlagArr.length > 0) {
			// Modify network request response
			await this.page.route('**/sdkConfig?sdkKey=dvc_client*', async route => {
				const response = await route.fetch();
				const bodyJson = await response.json(); // Parse response JSON

				// Modify JSON data
				featureFlagArr.forEach(featureFlag => {
					if (bodyJson.features && bodyJson.features[featureFlag?.name]) {
						bodyJson.features[featureFlag?.name].variationName = featureFlag?.variationName;
						bodyJson.features[featureFlag?.name].variationKey = featureFlag?.variationKey;
					}

					if (bodyJson.variables && bodyJson.variables[featureFlag?.name]) {
						bodyJson.variables[featureFlag?.name].value = featureFlag?.value;
					}
				});

				// Fulfill request with modified data
				await route.fulfill({
					status: response.status(),
					headers: response.headers(),
					body: JSON.stringify(bodyJson),
				});
			});
		}
	}
}

function resolveTestDataPath(primaryPath, fallbackPath) {
	if (fs.existsSync(primaryPath)) {
		return primaryPath;
	} else if (fs.existsSync(fallbackPath)) {
		return fallbackPath;
	} else {
		throw new Error(`Test data file not found in either location: ${primaryPath} or ${fallbackPath}`);
	}
}

export { resolveTestDataPath };
