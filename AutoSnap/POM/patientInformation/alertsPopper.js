const { ApiWaitUtils } = require('../apiWaitUtils');

class AlertsPopper {
	constructor(page) {
		this.page = page;
		this.apiWaitUtils = new ApiWaitUtils(this.page);
	}

	getAlertPopper() {
		return {
			// More specific selectors for the patient alerts popper
			container: this.page.locator('.MuiPopover-paper').filter({ hasText: 'Patient Alerts' }),
			closeButton: this.page.getByTestId('PatientAlertPopoverClose'),
			alertCount: this.page.locator('.MuiTypography-body1').filter({ hasText: /Patient Alerts \(\d+\)/ }),
			// Alternative selectors in case the main ones fail
			anyPopover: this.page.locator('.MuiPopover-paper'),
			closeIcon: this.page.locator('[data-testid="PatientAlertPopoverClose"], [aria-label="close"]'),
		};
	}

	/**
	 * Immediately closes any visible alert popper without waiting
	 * This is designed for emergency popper closing during test execution
	 */
	async forceCloseAlertPopper() {
		try {
			const alertPopper = this.getAlertPopper();

			// Try multiple approaches to close the popper
			const closeAttempts = [
				() => alertPopper.closeButton.click({ timeout: 500 }),
				() => alertPopper.closeIcon.first().click({ timeout: 500 }),
				() => this.page.keyboard.press('Escape'),
				() => this.page.click('body', { position: { x: 10, y: 10 } }), // Click outside popper
			];

			for (const attempt of closeAttempts) {
				try {
					await attempt();
					// Check if popper is gone
					const isGone = await alertPopper.container
						.waitFor({ state: 'hidden', timeout: 1000 })
						.then(() => true)
						.catch(() => false);
					if (isGone) {
						console.log('Alert popper force closed successfully');
						return true;
					}
				} catch (error) {
					// Continue to next attempt
					continue;
				}
			}

			return false;
		} catch (error) {
			console.warn('Force close alert popper failed:', error.message);
			return false;
		}
	}

	/**
	 * Handles the alert popper by attempting to close it if visible
	 * @returns {Promise<boolean>} Returns true if popper was found and handled, false otherwise
	 */
	async handleAlertPopper() {
		try {
			// Create a promise to wait for the response
			// Setup route handler for the specific PatientAlert endpoint
			await this.page.route(`**/PatientAlert**`, route => route.continue());
			const alertResponse = await this.apiWaitUtils.waitForAPI('/fhir/PatientAlert', 'GET');
			console.log('alertResponse', alertResponse);

			// Check if we have any alerts to handle
			return alertResponse;
		} catch (error) {
			console.warn('Error handling alert popper:', error.message);
			return false;
		}
	}

	async handleVisibleAlerts() {
		try {
			const alertPopper = this.getAlertPopper();

			// Quick check with minimal timeout
			const isVisible = await alertPopper.container.isVisible({ timeout: 500 });

			if (isVisible) {
				console.log('Alert popper detected, attempting immediate dismissal...');

				// Try force close first for immediate results
				const forceCloseResult = await this.forceCloseAlertPopper();
				if (forceCloseResult) {
					return true;
				}

				// Fallback to original method with shorter timeouts
				await alertPopper.closeButton.waitFor({ state: 'visible', timeout: 2000 });

				const alertCountText = (await alertPopper.alertCount.textContent()) || '';
				console.log(`Alert count: ${alertCountText}`);

				await alertPopper.closeButton.click();
				await alertPopper.container.waitFor({ state: 'hidden', timeout: 2000 });
				console.log('Alert popper successfully dismissed');

				await this.page.waitForTimeout(200); // Reduced wait time
				return true;
			}
			return false;
		} catch (error) {
			console.warn('Error handling alert popper, trying force close:', error.message);
			// Last resort: try force close
			return await this.forceCloseAlertPopper();
		}
	}

	/**
	 * More aggressive approach to handle alert poppers that may appear multiple times
	 * Will attempt to close the popper multiple times if needed
	 */
	async ensureAlertPopperClosed(maxAttempts = 3) {
		let attempts = 0;
		let popperFound = false;

		while (attempts < maxAttempts) {
			try {
				const result = await this.handleVisibleAlerts();
				if (result) {
					popperFound = true;
					console.log(`Alert popper closed on attempt ${attempts + 1}`);
				}

				// Check if there's still a popper visible after a short wait
				await this.page.waitForTimeout(300);
				const alertPopper = this.getAlertPopper();
				const stillVisible = await alertPopper.container.isVisible({ timeout: 1000 });

				if (!stillVisible) {
					break; // Successfully closed or no popper present
				}

				attempts++;
			} catch (error) {
				console.warn(`Attempt ${attempts + 1} to close alert popper failed:`, error.message);
				attempts++;
			}
		}

		if (popperFound && attempts >= maxAttempts) {
			console.warn(`Alert popper may still be visible after ${maxAttempts} attempts`);
		}

		return popperFound;
	}

	/**
	 * Sets up a continuous popper watcher that automatically closes poppers as they appear
	 * Use this during critical test phases where poppers cannot be tolerated
	 */
	async startPopperWatcher(intervalMs = 1000) {
		if (this.popperWatcherInterval) {
			this.stopPopperWatcher(); // Stop existing watcher
		}
		const apiResponse = await this.handleAlertPopper();
		if (!apiResponse) {
			// If no alerts from API, don't continue with the watcher
			return null;
		}
		console.log('Starting alert popper watcher...');
		this.popperWatcherInterval = setInterval(async () => {
			try {
				const alertPopper = this.getAlertPopper();
				const isVisible = await alertPopper.container.isVisible({ timeout: 100 });
				if (isVisible) {
					console.log('Popper watcher detected alert popper, force closing...');
					await this.forceCloseAlertPopper();
				}
			} catch (error) {
				// Silently continue watching
			}
		}, intervalMs);

		return this.popperWatcherInterval;
	}

	/**
	 * Stops the continuous popper watcher
	 */
	stopPopperWatcher() {
		if (this.popperWatcherInterval) {
			console.log('Stopping alert popper watcher...');
			clearInterval(this.popperWatcherInterval);
			this.popperWatcherInterval = null;
		}
	}

	/**
	 * Executes a function while actively watching for and closing poppers
	 * @param {Function} fn - The function to execute
	 * @param {number} watcherInterval - How often to check for poppers (ms)
	 */
	async executeWithPopperWatch(fn, watcherInterval = 500) {
		await this.startPopperWatcher(watcherInterval);
		try {
			const result = await fn();
			return result;
		} finally {
			this.stopPopperWatcher();
		}
	}
}

module.exports = { AlertsPopper };