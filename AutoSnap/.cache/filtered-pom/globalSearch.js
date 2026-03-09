export class GlobalSearch {
  constructor(page) {
    this.page = page;
  }

  globalSearchCombo(menu) {
    return this.page.locator('[class="subheader"] div', { hasText: menu });
  }

  globalSearchSelect(menu) {
    return this.page.locator(`[data-cy="${menu}"]`);
  }

  itemsContainer() {
    return this.page.locator('[data-cy="search-items-container"] div');
  }

  searchItemsContainer(datasetType) {
    return this.page.locator(`[data-cy="dataset-${datasetType}"]`);
  }

  topSearchTxt() {
    return this.page.locator('[id="top-search"]');
  }

  searchOptions = {
    All: 'All',
    Study: 'Study',
    DICOM: 'DICOM Query',
    Patient: 'Patient',
    Organization: 'Organization',
    User: 'User',
  };

  viewMoreBtn() {
    return this.page.locator('[class="autosuggest-dialog"] h6:has-text("VIEW MORE")');
  }

  progressIcon() {
    return this.page.locator('[class="subheader"] span [role="progressbar"]');
  }

  clearIcon() {
    return this.page.locator('.font-icon-wrapper');
  }

  async clearData() {
    if (await this.clearIcon().isVisible()) {
      await this.clearIcon().click();
    }
  }

  recentViewedItems() {
    return this.page.locator('[data-cy="recent-viewed-items"]');
  }

  recentSearchedItems() {
    return this.page.locator('[data-cy="recent-searched-items"] span');
  }

  autosuggestList(category) {
    return this.page.locator(`[data-cy="dataset-${category}"] span`);
  }

  resourceTypes = {
    Patient: 'Patient',
    Study: 'Study',
    Order: 'Order',
    Visit: 'Visit',
    Organization: 'Organization',
    User: 'User',
  };

  searchDataSet(type) {
    return this.page.locator(`[data-cy="dataset-${type}"] span`);
  }

  resultTabs = {
    All: 'All',
    Patient: 'Patient',
    Study: 'Study',
    Order: 'Order',
    Visit: 'Visit',
    Organization: 'Organization',
    User: 'User',
  };

  async goToResultPage(tabName) {
    const tabIndex = Object.values(this.resultTabs).indexOf(tabName);
    if (tabIndex !== -1) {
      await this.page.locator(`[id="simple-tab-${tabIndex}"]`).click();
    }
  }

  async searchExecution(searchCriteria, method, category) {
    const fullEncodeURI = `${encodeURI(searchCriteria)}`.replaceAll("'", '%27');
    await this.page.route(`**_content=${fullEncodeURI}*`, route => route.continue());
    await this.topSearchTxt().fill('');
    if (category) {
      this.searchType(category).click();
    }
    await this.topSearchTxt().type(searchCriteria, { delay: 10 });
    await this.page.waitForResponse(response => 
      response.url().includes(fullEncodeURI) && response.status() === 200
    );
  }

  async waitForSearchResultPageToLoad(searchCriteria, method) {
    const fullEncodeURI = `${encodeURI(searchCriteria)}`.replaceAll("'", '%27');
    await this.page.route(`**_content=${fullEncodeURI}*`, route => route.continue());
    await this.topSearchTxt().fill('');
    await this.topSearchTxt().type(searchCriteria, { delay: 10 });
    await this.page.waitForResponse(response => 
      response.url().includes(fullEncodeURI) && response.status() === 200
    );
    await this.page.waitForTimeout(3000);
    await this.topSearchTxt().press('Enter');
  }

  async checkElementThenClickingOn(locator) {
    const element = this.page.locator(locator);
    if (await element.isVisible()) {
      await element.click();
    }
  }

  goToBtn() {
    return this.page.locator('[data-cy="search-items-container"] button:has-text("GO TO ")');
  }

  goToPatientBtnInAllTab() {
    return this.page.locator('[data-cy="dataset-Patient"] button:has-text("GO TO ")');
  }

  openPatientDetails(patientInfo) {
    return this.page.locator(`[data-cy="dataset-Patient"]:has-text("${patientInfo}")`);
  }

  goToStudyBtnInAllTab() {
    return this.page.locator('[data-cy="dataset-Study"] button:has-text("GO TO ")');
  }

  openStudyDetails(studyInfo) {
    return this.page.locator(`[data-cy="dataset-Study"]:has-text("${studyInfo}")`);
  }

  goToOrderBtnInAllTab() {
    return this.page.locator('[data-cy="dataset-Order"] button:has-text("GO TO ")');
  }

  openOrderDetails(orderInfo) {
    return this.page.locator(`[data-cy="dataset-Order"]:has-text("${orderInfo}")`);
  }

  goToVisitBtnInAllTab() {
    return this.page.locator('[data-cy="dataset-Visit"] button:has-text("GO TO ")');
  }

  openVisitDetails(visitInfo) {
    return this.page.locator(`[data-cy="dataset-Visit"]:has-text("${visitInfo}")`);
  }

  goToOrganizationBtnInAllTab() {
    return this.page.locator('[data-cy="dataset-Organization"] button:has-text("GO TO ")');
  }

  openOrganizationDetails(organizationInfo) {
    return this.page.locator(`[data-cy="dataset-Organization"]:has-text("${organizationInfo}")`);
  }

  goToUserBtnInAllTab() {
    return this.page.locator('[data-cy="dataset-User"] button:has-text("GO TO ")');
  }

  openUserDetails(userInfo) {
    return this.page.locator(`[data-cy="dataset-User"]:has-text("${userInfo}")`);
  }

  searchType(category) {
    return this.page.locator('[id="categoriesList"] span', { hasText: category });
  }
}


