import { Login } from './login.js';
import { DocumentViewer } from './documentViewer.js';
import { ImageViewer } from './imageViewer.js';
import { Blume } from './blume.js';
import { ApiWaitUtils } from './apiWaitUtils.js';
import { WorkflowAutomationPage } from './workflowAutomationPage.js';
import { HomePage } from './homePage.js';
import { OrganizationDirectoryPage } from './organizationDirectoryPage.js';
import { OrganizationDetailPage } from './organizationDetailPage.js';
import { OrganizationAffiliationPage } from './organizationAffiliationPage.js';
import { OrganizationUserRolePage } from './organizationUserRolePage.js';
import { Sidebar } from './sidebar.js';
import { Scheduler } from './scheduler.js';
import { Common } from './common.js';
import { ClickWheel } from './clickWheel.js';
import { WorklistSettings } from './worklistSettings.js';
import { WorklistSpeedDial } from './worklistSpeedDial.js';
import { APIRequests } from './APIRequests.js';
import { WorklistStudyStatus } from './worklistStudyStatus.js';
import { PatientInformationPage } from './patientInformationPage.js';
import { FaxPage } from './faxPage.js';
import { OAISignUpPage } from './oaiSignUpPage.js';
import { OrderDrawer } from './orderDrawer.js';
import { AIUtils } from './aiUtils.js';
import { GlobalSearch } from './globalSearch.js';
import { CoverageInformationPage } from './coverageInformationPage.js';
import { CoverageGenerator } from './coverageGenerator.js';
import { TeachingFolderPage } from './teachingFolderPage.js';
import { MemoryLeakDetector } from './memoryLeakDetector.js';
import { LogView } from './logView.js';
import { OrganizationBlumeFormPage } from './organizationBlumeFormPage.js';
import { RightClickMenu } from './rightClickMenu.js';
class POManager {
	constructor(page, apiContext, testInfo) {
		this.page = page;
		this.apiContext = apiContext;
		this.testInfo = testInfo;
		this.documentViewer = new DocumentViewer(this.page, this.testInfo);
		this.imageViewer = new ImageViewer(this.page);
		this.loginPage = new Login(this.page);
		this.blume = new Blume(this.page);
		this.apiWaitUtils = new ApiWaitUtils(this.page);
		this.workflowAutomationPage = new WorkflowAutomationPage(this.page);
		this.organizationDirectoryPage = new OrganizationDirectoryPage(this.page);
		this.organizationDetailPage = new OrganizationDetailPage(this.page);
		this.organizationUserRolePage = new OrganizationUserRolePage(this.page);
		this.organizationAffiliationPage = new OrganizationAffiliationPage(this.page);
		this.sidebar = new Sidebar(this.page);
		this.homePage = new HomePage(this.page);
		this.scheduler = new Scheduler(this.page);
		this.common = new Common(this.page, this.apiContext, this.testInfo);
		this.clickWheel = new ClickWheel(this.page);
		this.worklistSettings = new WorklistSettings(this.page);
		this.worklistSpeedDial = new WorklistSpeedDial(this.page);
		this.apiRequests = new APIRequests(this.apiContext);
		this.worklistStudyStatus = new WorklistStudyStatus(this.page);
		this.patientInformationPage = new PatientInformationPage(this.page);
		this.faxPage = new FaxPage(this.page);
		this.oaiSignUpPage = new OAISignUpPage(this.page);
		this.orderDrawer = new OrderDrawer(this.page);
		this.aiUtils = new AIUtils(this.page, this.apiContext, this.testInfo);
		this.globalSearch = new GlobalSearch(this.page);
		this.coverageInformationPage = new CoverageInformationPage(this.page);
		this.coverageGenerator = new CoverageGenerator();
		this.teachingFolderPage = new TeachingFolderPage(this.page);
		this.memoryLeakDetector = new MemoryLeakDetector(this.page);
		this.logView = new LogView(this.page);
		this.organizationBlumeForm = new OrganizationBlumeFormPage(this.page);
		this.rightClickMenu = new RightClickMenu(this.page);
	}

	login() {
		return this.login;
	}

	documentViewer() {
		return this.documentViewer;
	}

	blume() {
		return this.blume;
	}

	apiWaitUtils() {
		return this.apiWaitUtils;
	}

	imageViewer() {
		return this.imageViewer;
	}

	workflowAutomationPage() {
		return this.workflowAutomationPage;
	}

	organizationDirectoryPage() {
		return this.organizationDirectoryPage;
	}

	organizationDetailPage() {
		return this.organizationDetailPage;
	}

	organizationUserRolePage() {
		return this.organizationUserRolePage;
	}

	sidebar() {
		return this.sidebar;
	}

	scheduler() {
		return this.scheduler;
	}

	clickWheel() {
		return this.clickWheel;
	}

	worklistSpeedDial() {
		return this.worklistSpeedDial;
	}

	apiRequests() {
		return this.apiRequests;
	}

	worklistStudyStatus() {
		return this.WorklistStudyStatus;
	}

	patientInformationPage() {
		return this.patientInformationPage;
	}

	faxPage() {
		return this.faxPage;
	}

	oaiSignUpPage() {
		return this.oaiSignUpPage;
	}

	orderDrawer() {
		return this.orderDrawer;
	}

	aiUtils() {
		return this.aiUtils;
	}

	globalSearch() {
		return this.globalSearch;
	}

	coverageInformationPage() {
		return this.coverageInformationPage;
	}

	coverageGenerator() {
		return this.coverageGenerator;
	}

	teachingFolderPage() {
		return this.teachingFolderPage;
	}

	memoryLeakDetector() {
		return this.memoryLeakDetector;
	}

	logView() {
		return this.logView;
	}

	organizationBlumeForm() {
		return this.organizationBlumeForm;
	}
}
export { POManager };
