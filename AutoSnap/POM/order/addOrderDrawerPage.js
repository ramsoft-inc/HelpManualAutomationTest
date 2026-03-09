const { expect } = require('@playwright/test');
const { ApiWaitUtils } = require('../apiWaitUtils');
const { PatientRegistration } = require('../patientInformation/patientRegistrationForm');
const { OrganizationOrderSet } = require('../organization/organizationOrderSet');
const { ReferringPhysicianPage } = require('../visits/order/addNewReferringPhysician');
const { OrderInformationPage } = require('../visits/order/orderInformationPage');
const { TIMEOUT_IN_MSEC1 } = require('../timeouts');
const getUserFullName = require('@rs-core/fhir/resource/columnMapping/utils/getUserFullName');

const { DetailedTablePopper } = require('../patientInformation/detailedTablePopper');

/**
 * Page Object Model for Add Order Drawer
 */
class AddOrderDrawerPage {
	constructor(page) {
		this.page = page;
		this.apiWaitUtils = new ApiWaitUtils(this.page);
		this.patientRegistration = new PatientRegistration(this.page);
		this.organizationOrderSet = new OrganizationOrderSet(this.page);
		this.detailedTablePopper = new DetailedTablePopper(this.page);
		this.referringPhysicianPage = new ReferringPhysicianPage(this.page);
		this.orderInformationPage = new OrderInformationPage(this.page);
	}

	// ==================== DRAWER HEADER ELEMENTS ====================

	/**
	 * Returns the drawer header element
	 */
	getDrawerHeader() {
		return this.page.getByTestId('form-panel-header').getByText('Create New Order');
	}

	/**
	 * Returns the drawer close button
	 */
	getCloseButton() {
		return this.page.locator('[data-cy="Create New Order_close"]');
	}

	// ==================== FORM FIELD ELEMENTS ====================

	/**
	 * Returns the Managing Organization autocomplete field
	 */
	getManagingOrganizationField() {
		// return this.page.locator('#autocomplete-field-Managing\\ Organization');
		return this.page
			.getByTestId('autocomplete-field-Managing Organization')
			.getByRole('combobox', { name: 'Managing Organization' });
	}

	/**
	 * Returns the Imaging Organization autocomplete field
	 */
	getImagingOrganizationField() {
		return this.page.locator('#autocomplete-field-Imaging\\ Organization');
	}

	/**
	 * Returns the Patient Name autocomplete field
	 */
	getPatientNameField() {
		return this.page.locator('#autocomplete-field-Patient\\ Name');
	}

	/**
	 * Returns the Add New Patient button
	 */
	getAddNewPatientButton() {
		return this.page.getByText('ADD NEW', { exact: true });
	}

	/**
	 * Returns the Referring Physician autocomplete field
	 */
	getReferringPhysicianField() {
		return this.page.locator('#autocomplete-field-Referring\\ Physician');
	}

	/**
	 * Returns the Referring Organization select field
	 */
	getReferringOrganizationField() {
		return this.page.locator('#form-field-Referring\\ Organization');
	}

	/**
	 * Returns the Consulting Physician autocomplete field
	 */
	getConsultingPhysicianField() {
		return this.page.locator('#autocomplete-multiple-field-Consulting\\ Physician');
	}

	/**
	 * Returns the Priority select field
	 */
	getPriorityField() {
		return this.page.locator('#form-field-Order\\ Priority');
	}

	/**
	 * Returns the Priority field label
	 */
	getPriorityFieldLabel() {
		return this.page.locator('label[for="form-field-Order Priority"]');
	}

	/**
	 * Returns the currently selected value of the Priority field
	 * Waits for the label to appear first to ensure the field is loaded
	 * @returns {Promise<string>} The current priority value text
	 */
	async getPriorityFieldValue() {
		await this.getPriorityFieldLabel().waitFor({ state: 'visible' });
		await this.getPriorityField().waitFor({ state: 'visible' });
		return await this.getPriorityField().textContent();
	}

	/**
	 * Returns the currently selected value of the Managing Organization field
	 * @returns {Promise<string>} The current managing organization value
	 */
	async getManagingOrganizationFieldValue() {
		return await this.getManagingOrganizationField().inputValue();
	}

	/**
	 * Returns the Order Notes textarea field
	 */
	getOrderNotesField() {
		return this.page.locator('textarea[name="orderNotes"]');
	}

	/**
	 * Returns the Order Set Code autocomplete field
	 */
	getOrderSetCodeField() {
		return this.page.locator('[data-testid="orderSetSearchTextField"] input[type="text"]');
	}

	// ==================== FORM ACTION BUTTONS ====================

	/**
	 * Returns the Create button
	 */
	getCreateButton() {
		return this.page.locator('[data-cy="CREATE_"]');
	}

	/**
	 * Returns the Cancel button
	 */
	getCancelButton() {
		return this.page.locator('[data-testid="cancel-btn"]');
	}

	// ==================== SUCCESS PAGE ELEMENTS ====================

	/**
	 * Returns the success page title
	 */
	getSuccessPageTitle() {
		return this.page.getByText('Successfully created order!');
	}

	/**
	 * Returns the success page close button
	 */
	getSuccessPageCloseButton() {
		return this.page.getByTestId('Done_');
	}

	/**
	 * Returns the side drawer close button
	 */
	getSideDrawerCloseButton() {
		return this.page.locator('[data-cy="_close"]');
	}

	/**
	 * Returns the View Order button on success page
	 */
	getViewAllOrdersButton() {
		return this.page.getByTestId('view-all-orders-btn');
	}

	// ==================== HELPER METHODS ====================

	/**
	 * Opens the Add Order Drawer from the worklist page via speed dial
	 */
	async openAddOrderDrawer() {
		// Click the speed dial button
		const speedDialButton = this.page.locator('[aria-label="Add New button"]');
		await speedDialButton.click();

		// Click the Order option
		const orderOption = this.page.getByText('Order').first();
		await orderOption.click();

		// Wait for drawer to open
		await this.getDrawerHeader().waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC1 });
	}

	/**
	 * Selects a managing organization by typing and selecting from dropdown
	 * @param {string} organizationName - The organization name to select
	 */
	async selectManagingOrganization(organizationName) {
		await this.getManagingOrganizationField().click();
		await this.getManagingOrganizationField().fill(organizationName);
		await this.apiWaitUtils.waitForAPI('/fhir/organization', 'GET');

		// Select the first option that matches
		await this.page
			.locator('li[role="option"]')
			.filter({ hasText: new RegExp(organizationName, 'i') })
			.first()
			.click();
	}

	/**
	 * Selects an imaging organization by typing and selecting from dropdown
	 * @param {string} organizationName - The organization name to select
	 */
	async selectImagingOrganization(organizationName) {
		await this.getImagingOrganizationField().click();
		await this.getImagingOrganizationField().fill(organizationName);
		await this.apiWaitUtils.waitForAPI('/fhir/organization', 'GET');

		// Select the first option that matches
		await this.page
			.locator('li[role="option"]')
			.filter({ hasText: new RegExp(organizationName, 'i') })
			.first()
			.click();
	}

	/**
	 * Selects an existing patient by typing and selecting from dropdown
	 * @param {string} patientName - The patient name to select
	 */
	async selectPatient(patientName) {
		await this.getPatientNameField().click();
		await this.getPatientNameField().pressSequentially(patientName, { delay: 300 });
		await this.apiWaitUtils.waitForAPI('/fhir/Patient', 'GET');

		// Select the first option
		await this.detailedTablePopper.clickFirstRow();
	}

	/**
	 * Creates a new patient by clicking Add New and filling the patient registration form
	 * @returns {Object} Created patient details {familyName, givenName, ssn, birthDate, email, prefix, suffix}
	 */
	async createNewPatient() {
		await this.getPatientNameField().click();

		// Check if Add New button is visible
		const addNewButton = this.detailedTablePopper.getAddNewButton().byLabel;
		await expect(addNewButton).toBeVisible();
		await addNewButton.click();

		// Capture the patient data returned from savePatientForm
		const patientData = await this.patientRegistration.savePatientForm(false, false);

		// Return the patient data for assertions
		return patientData;
	}

	/**
	 * Selects a referring physician by typing and selecting from dropdown
	 * @param {string} physicianName - The physician name to select
	 */
	async selectReferringPhysician(physicianName) {
		await this.getReferringPhysicianField().click();
		await this.getReferringPhysicianField().pressSequentially(physicianName, { delay: 300 });
		await this.apiWaitUtils.waitForAPI('/fhir/PractitionerRole', 'GET');

		// Select the first option
		await this.detailedTablePopper.clickFirstRow();
	}

	/**
	 * Creates a new referring physician by clicking Add New and filling the referring physician registration form
	 * @returns {Object} Created referring physician details {familyName, givenName, prefix, suffix, organization, loginEmail}
	 */
	async createNewReferringPhysician() {
		await this.getReferringPhysicianField().click();

		await this.detailedTablePopper.getAddNewButton().byLabel.click();
		const physicianData = await this.referringPhysicianPage.saveReferringPhysicianForm(0);

		// Return the physician data for assertions
		return physicianData;
	}

	/**
	 * Selects a consulting physician by typing and selecting from dropdown
	 * @param {string} physicianName - The physician name to select
	 */
	async selectConsultingPhysician(physicianName) {
		await this.getConsultingPhysicianField().click();
		await this.getConsultingPhysicianField().pressSequentially(physicianName, { delay: 300 });
		await this.apiWaitUtils.waitForAPI('/fhir/PractitionerRole', 'GET');

		// Select the first option
		await this.detailedTablePopper.clickFirstRow();
	}

	/**
	 * Selects multiple consulting physicians by searching and selecting each one from dropdown
	 * Supports MUI multi-select autocomplete - searches and selects each physician one by one
	 * @param {Array<string>} physicianNames - Array of physician names to select
	 */
	async selectMultipleConsultingPhysicians(physicianNames) {
		for (const physicianName of physicianNames) {
			await this.getConsultingPhysicianField().click();
			await this.getConsultingPhysicianField().pressSequentially(physicianName, { delay: 300 });
			await this.apiWaitUtils.waitForAPI('/fhir/PractitionerRole', 'GET');

			// Select the first option that matches
			await this.detailedTablePopper.clickFirstRow();
		}
	}
	/**
	 * Creates a new consulting physician by clicking Add New and filling the consulting physician registration form
	 * @returns {Object} Created consulting physician details {familyName, givenName, prefix, suffix, organization, loginEmail}
	 */
	async createNewConsultingPhysician() {
		await this.getConsultingPhysicianField().click();
		await this.detailedTablePopper.getAddNewButton().byLabel.click();
		const physicianData = await this.referringPhysicianPage.saveReferringPhysicianForm(0);

		// Return the physician data for assertions
		return physicianData;
	}

	/**
	 * Selects priority from dropdown
	 * @param {string} priority - The priority value (e.g., 'ROUTINE', 'URGENT', 'CRITICAL')
	 */
	async selectPriority(priority) {
		await this.getPriorityField().click();

		// Select the priority from dropdown
		await this.page
			.locator('li[role="option"]')
			.filter({ hasText: new RegExp(priority, 'i') })
			.first()
			.click();
	}

	/**
	 * Fills the order notes field
	 * @param {string} notes - The order notes text
	 */
	async fillOrderNotes(notes) {
		await this.getOrderNotesField().fill(notes);
	}

	/**
	 * Selects an order set by typing and selecting from dropdown
	 * @param {string} orderSetCode - The order set code to select
	 */
	async selectOrderSet(orderSetCode) {
		await this.getOrderSetCodeField().click();
		await this.getOrderSetCodeField().fill(orderSetCode);
		await this.apiWaitUtils.waitForAPI('/fhir/StudyType', 'GET');

		// Select the first option that matches
		await this.page
			.locator('li[role="option"]')
			.filter({ hasText: new RegExp(orderSetCode, 'i') })
			.first()
			.click();
	}

	/**
	 * Fills the complete order form with provided data
	 * @param {Object} orderData - The order data object
	 * @param {string} orderData.managingOrganization - Managing organization name
	 * @param {string} orderData.imagingOrganization - Imaging organization name
	 * @param {string} orderData.patientName - Patient name (optional if creating new)
	 * @param {boolean} orderData.createNewPatient - Whether to create a new patient
	 * @param {boolean} orderData.createNewReferringPhysician - Whether to create a new referring physician
	 * @param {boolean} orderData.createNewConsultingPhysician - Whether to create a new consulting physician
	 * @param {string} orderData.referringPhysician - Referring physician name (optional)
	 * @param {string} orderData.consultingPhysician - Single consulting physician name (optional, for backward compatibility)
	 * @param {Array<string>} orderData.consultingPhysicians - Array of consulting physician names (optional, for multi-select)
	 * @param {string} orderData.priority - Priority value (optional, defaults to ROUTINE)
	 * @param {string} orderData.orderSetCode - Order set code (optional)
	 * @param {string} orderData.orderNotes - Order notes (optional)
	 * @param {Object} orderData.createdReferringPhysician - Created referring physician details (optional)
	 * @param {Object} orderData.createdConsultingPhysician - Created consulting physician details (optional)
	 * @param {Object} orderData.createdPatient - Created patient details (optional)
	 * @returns {Object} The filled form data including created patient details if applicable
	 */
	async fillOrderForm(orderData) {
		// Managing Organization (Required)
		if (orderData.managingOrganization) {
			await this.selectManagingOrganization(orderData.managingOrganization);
		}

		// Imaging Organization (Required)
		if (orderData.imagingOrganization) {
			await this.selectImagingOrganization(orderData.imagingOrganization);
		}

		// Patient (Required) - Either select existing or create new
		if (orderData.createNewPatient) {
			const patientDetails = await this.createNewPatient();
			// Store the created patient details for assertions
			orderData.createdPatient = patientDetails;
		} else if (orderData.patientName) {
			await this.selectPatient(orderData.patientName);
		}

		// Referring Physician (Optional)
		if (orderData.createNewReferringPhysician) {
			const referringPhysicianDetails = await this.createNewReferringPhysician();
			// Store the created referring physician details for assertions
			orderData.createdReferringPhysician = referringPhysicianDetails;
		} else if (orderData.referringPhysician) {
			await this.selectReferringPhysician(orderData.referringPhysician);
		}
		// Consulting Physician(s) (Optional) - Supports both single and multiple selection
		if (orderData.createNewConsultingPhysician) {
			const consultingPhysicianDetails = await this.createNewConsultingPhysician();
			// Store the created consulting physician details for assertions
			orderData.createdConsultingPhysician = consultingPhysicianDetails;
		} else if (orderData.consultingPhysicians && Array.isArray(orderData.consultingPhysicians)) {
			// Multiple consulting physicians - use multi-select method
			await this.selectMultipleConsultingPhysicians(orderData.consultingPhysicians);
		} else if (orderData.consultingPhysician) {
			// Single consulting physician - backward compatible
			await this.selectConsultingPhysician(orderData.consultingPhysician);
		}

		// Priority (Optional - defaults to ROUTINE if not specified)
		if (orderData.priority) {
			await this.selectPriority(orderData.priority);
		}

		// Order Set Code (Optional)
		if (orderData.orderSetCode) {
			await this.selectOrderSet(orderData.orderSetCode);
		}

		// Order Notes (Optional)
		if (orderData.orderNotes) {
			await this.fillOrderNotes(orderData.orderNotes);
		}

		return orderData;
	}

	/**
	 * Submits the order form by clicking the Create button
	 * @returns {Promise<Object>} The API response from the bundle creation
	 */
	async submitOrderForm() {
		// Set up API listener before clicking create
		await this.page.route('**/fhir', route => route.continue());

		const createButton = this.getCreateButton();
		await expect(createButton).toBeEnabled();

		const [bundleResponse] = await Promise.all([
			this.apiWaitUtils.waitForAPI('/fhir', 'POST'),
			createButton.click(),
		]);

		// Wait for success page to appear
		await this.getSuccessPageTitle().waitFor({ state: 'visible', timeout: TIMEOUT_IN_MSEC1 });

		return bundleResponse;
	}

	/**
	 * Closes the success page after order creation
	 */
	async closeSuccessPage() {
		const closeButton = this.getSuccessPageCloseButton();
		await closeButton.click();
		await this.getSideDrawerCloseButton().click();
	}

	/**
	 * Complete flow to create a new order from worklist
	 * @param {Object} orderData - The order data object
	 * @returns {Promise<Object>} Object containing filled data and API response
	 */
	async createNewOrderFromWorklist(orderData) {
		// Open the order drawer
		await this.openAddOrderDrawer();

		// Fill the form
		const filledData = await this.fillOrderForm(orderData);

		// Submit the form
		const bundleResponse = await this.submitOrderForm();

		return {
			filledData,
			bundleResponse,
		};
	}

	/**
	 * Verifies the order was created successfully by checking the success page
	 */
	async verifyOrderCreatedSuccessfully() {
		await expect(this.getSuccessPageTitle()).toBeVisible();
		await expect(this.getViewAllOrdersButton()).toBeVisible();
	}

	async getOrderDetails(orderId) {
		await this.page.route(`**/ServiceRequest**`, async route => {
			route.continue();
		});
		const serviceRequestResponse = await this.orderInformationPage.openOrderDetailsPageByURLWithResponse(
			orderId,
			`/ServiceRequest/`
		);
		return serviceRequestResponse;
	}

	/**
	 * Asserts patient data from UI matches the data used to create the patient
	 * @param {Object} createdPatientData - The patient data used to create the patient
	 * @param {Object} patientInfoFromUI - The patient info retrieved from the UI
	 * @param {string} expectedManagingOrg - The expected managing organization name
	 */
	assertPatientDataMatchesUI(createdPatientData, patientInfoFromUI, expectedManagingOrg) {
		// Helper function to normalize strings for comparison (uppercase, trim)
		const normalize = str => (str ? str.toString().toUpperCase().trim() : '');

		// Helper function to remove non-digits from SSN
		const normalizeSSN = ssn => (ssn ? ssn.toString().replace(/\D/g, '') : '');

		// Assert Family Name
		expect(normalize(createdPatientData.familyName)).toEqual(normalize(patientInfoFromUI['Family Name']));

		// Assert Given Names
		expect(normalize(createdPatientData.givenName)).toEqual(normalize(patientInfoFromUI['Given Names']));

		// Assert Prefix
		expect(normalize(createdPatientData.prefix)).toEqual(normalize(patientInfoFromUI.Prefix));

		// Assert Suffix
		expect(normalize(createdPatientData.suffix)).toEqual(normalize(patientInfoFromUI.Suffix));

		// Assert SSN (remove dashes for comparison)
		expect(normalizeSSN(createdPatientData.ssn)).toEqual(normalizeSSN(patientInfoFromUI.SSN));

		// Assert Managing Organization
		expect(normalize(expectedManagingOrg)).toEqual(normalize(patientInfoFromUI['Managing Organization']));
	}

	/**
	 * Formats physician name for assertion based on available properties
	 * Uses the common getUserFullName utility for consistent name formatting with the UI.
	 * @param {Object} physician - Physician object with displayName, dicomName, or familyName/givenName
	 * @returns {string} Formatted physician name matching UI display format
	 */
	formatPhysicianNameForAssertion(physician) {
		if (!physician) return '';

		// If displayName is available, use it directly (matches UI format)
		if (physician.displayName) {
			return physician.displayName;
		}

		// Use common getUserFullName utility to parse DICOM name (e.g., "LASTNAME^FIRSTNAME" -> "FIRSTNAME LASTNAME")
		// This matches how the UI formats physician names in OrderDetailCard.jsx
		if (physician.dicomName) {
			return getUserFullName(physician.dicomName, false);
		}

		return '';
	}

	/**
	 * Asserts order details from UI against expected values
	 * @param {Object} orderDetailsFromUI - Order details retrieved from the UI
	 * @param {Object} expectedValues - Expected values object containing:
	 *   - priority: Expected priority (e.g., 'ASAP', 'ROUTINE')
	 *   - status: Expected status (e.g., 'ACTIVE')
	 *   - referringPhysician: Expected referring physician data object {dicomName} or {familyName, givenName}
	 *   - consultingPhysician: Single consulting physician object (backward compatible)
	 *   - consultingPhysicians: Array of consulting physician objects (for multi-select verification)
	 */
	assertOrderDetailsFromUI(orderDetailsFromUI, expectedValues) {
		const normalize = str => (str ? str.toString().toUpperCase().trim() : '');

		// Assert Priority
		if (expectedValues.priority) {
			expect(normalize(orderDetailsFromUI.priority)).toEqual(normalize(expectedValues.priority));
		}
		// Assert Status
		if (expectedValues.status) {
			expect(normalize(orderDetailsFromUI.status)).toEqual(normalize(expectedValues.status));
		}
		// Assert Referring Physician
		if (expectedValues.referringPhysician) {
			const expectedRefPhysician = this.formatPhysicianNameForAssertion(expectedValues.referringPhysician);
			expect(normalize(orderDetailsFromUI.referringPhysician)).toEqual(normalize(expectedRefPhysician));
		}
		// Assert Consulting Physician(s)
		if (expectedValues.consultingPhysicians && Array.isArray(expectedValues.consultingPhysicians)) {
			// Multiple consulting physicians expected
			const expectedConsPhysicianNames = expectedValues.consultingPhysicians
				.map(physician => normalize(this.formatPhysicianNameForAssertion(physician)))
				.sort();

			// Check if UI returned multiple physicians (from hover popup)
			if (orderDetailsFromUI.consultingPhysicians && Array.isArray(orderDetailsFromUI.consultingPhysicians)) {
				// Compare all physicians - UI returned array from popup
				const actualConsPhysicianNames = orderDetailsFromUI.consultingPhysicians
					.map(name => normalize(name))
					.sort();
				expect(actualConsPhysicianNames).toEqual(expectedConsPhysicianNames);
			} else {
				// Fallback: UI only returned first physician, verify it's in expected list
				const actualConsPhysician = normalize(orderDetailsFromUI.consultingPhysician);
				expect(expectedConsPhysicianNames).toContain(actualConsPhysician);
			}
		} else if (expectedValues.consultingPhysician) {
			// Single consulting physician - backward compatible
			const expectedConsPhysician = this.formatPhysicianNameForAssertion(expectedValues.consultingPhysician);
			expect(normalize(orderDetailsFromUI.consultingPhysician)).toEqual(normalize(expectedConsPhysician));
		}
	}

	/**
	 * Asserts study details from UI against the order set payload used to create the study
	 * @param {Object} studyDetailsFromUI - Study details retrieved from the UI (full form values object)
	 * @param {Object} orderSetPayload - The order set payload used to create the study
	 * @param {Object} procedureCode - The procedure code object used (with code and display)
	 * @param {string} imagingOrgName - The imaging organization name
	 */
	assertStudyDetailsFromUI(studyDetailsFromUI, orderSetPayload, procedureCode, imagingOrgName) {
		const normalize = str => (str ? str.toString().toUpperCase().trim() : '');

		// === GENERAL SECTION ===
		const general = studyDetailsFromUI.general;

		// Assert Study Set Code
		if (orderSetPayload.studyType) {
			expect(normalize(general['Study Set Code'])).toEqual(normalize(orderSetPayload.studyType));
		}

		// Assert Study Description
		if (orderSetPayload.description) {
			expect(normalize(general['Study Description'])).toEqual(normalize(orderSetPayload.description));
		}

		// Assert Modality
		if (orderSetPayload.modality?.code) {
			expect(normalize(general.Modality)).toEqual(normalize(orderSetPayload.modality.code));
		}

		// Assert Imaging Organization
		if (imagingOrgName) {
			expect(normalize(general['Imaging Organization'])).toEqual(normalize(imagingOrgName));
		}

		// === CLINICAL SECTION - SCAN DETAILS ===
		const scanDetails = studyDetailsFromUI.clinical?.scanDetails;

		// Assert Laterality
		if (orderSetPayload.laterality?.display) {
			expect(normalize(scanDetails?.Laterality)).toEqual(normalize(orderSetPayload.laterality.display));
		}

		// Assert Body Part (from bodyPart array or extension)
		if (orderSetPayload.bodyPart?.display) {
			expect(normalize(scanDetails?.['Body Part'])).toEqual(normalize(orderSetPayload.bodyPart.display));
		}

		// Assert Duration (format: "00:15" for 15 minutes)
		if (orderSetPayload.duration) {
			const expectedDuration = `00:${String(orderSetPayload.duration).padStart(2, '0')}`;
			expect(scanDetails?.['Duration (HH: MM)']).toEqual(expectedDuration);
		}

		// === PROCEDURE CODE SECTION ===
		const procedureCodeSection = studyDetailsFromUI.procedureCode;

		// Assert Procedure Code
		if (procedureCode?.code) {
			expect(normalize(procedureCodeSection['PROCEDURE CODE'])).toEqual(normalize(procedureCode.code));
		}

		// Assert Procedure Code Description
		if (procedureCode?.display) {
			expect(normalize(procedureCodeSection.DESCRIPTION)).toEqual(normalize(procedureCode.display));
		}

		// Assert Procedure Code count
		expect(procedureCodeSection.count).toBeGreaterThanOrEqual(1);
	}
}
module.exports = { AddOrderDrawerPage };

