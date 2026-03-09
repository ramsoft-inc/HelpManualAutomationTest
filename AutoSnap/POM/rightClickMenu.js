const { expect } = require('@playwright/test');
const TIMEOUTS = require('./timeouts');

class RightClickMenu {
	constructor(page) {
		this.page = page;
	}

	navigationToolbar() {
		return this.page.getByTestId('worklist-context-menu');
	}

	navigationButton(topMenuItem) {
		return this.navigationToolbar().getByRole('button', { name: topMenuItem, exact: true });
	}

	async navigateTo(topMenuItem) {
		await expect(async () => {
			await this.navigationButton(topMenuItem).click();
			await expect(this.navigationToolbar()).not.toBeVisible({ timeout: TIMEOUTS.TIMEOUT_IN_1SEC });
		}).toPass({ timeout: TIMEOUTS.TIMEOUT_IN_MSEC3 });
	}

	firstLevelMenu() {
		return this.page.locator('#worklist-context-popper0');
	}

	firstLevelMenuItem(name) {
		return this.firstLevelMenu().getByRole('menuitem', { name, exact: true });
	}

	secondLevelMenu() {
		return this.page.locator('#worklist-context-popper1');
	}

	secondLevelMenuItem(name) {
		return this.secondLevelMenu().getByRole('menuitem', { name, exact: true });
	}

	studyPlayerSearch() {
		return this.page.getByTestId('custom-popper-worklist-context-study-player-search');
	}

	async assignStudyPlayer(studyPlayerName, searchTerm) {
		await this.firstLevelMenuItem(studyPlayerName).hover();
		await expect(this.studyPlayerSearch().getByRole('option').first()).toBeVisible();
		await this.secondLevelMenu()
			.getByRole('combobox', { name: `Assign ${studyPlayerName}` })
			.fill(searchTerm);
		await this.studyPlayerSearch()
			.getByRole('option')
			.filter({ hasText: new RegExp(`${searchTerm}`, 'i') })
			.click();
		await expect(this.page.getByRole('alert').filter({ hasText: 'Successfully updated study.' })).toBeVisible();
	}
}
module.exports = { RightClickMenu };

