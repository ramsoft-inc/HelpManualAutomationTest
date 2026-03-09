// Playwright config stub
const env = process.env;

module.exports = {
	logInOaiUrl: env.APPLICATION_URL || 'https://pre-us01.omegaai.com/',
	baseURL: env.APPLICATION_URL || 'https://pre-us01.omegaai.com/',
	baseBlumeURL: env.BASE_BLUME_URL || 'https://blume-pre-us01.omegaai.com/',
	userName: env.LOGIN_EMAIL || 'testuser@example.com',
	password: env.LOGIN_PASSWORD || 'password123',
	userName1: env.USER_NAME_1 || env.LOGIN_EMAIL,
	password1: env.PASSWORD_1 || env.LOGIN_PASSWORD,
	userName2: env.USER_NAME_2 || 'user2@example.com',
	password2: env.PASSWORD_2 || 'password123',
	userName3: env.USER_NAME_3 || 'user3@example.com',
	password3: env.PASSWORD_3 || 'password123',
	breezeUser: env.BREEZE_USER || 'breeze@example.com',
	breezePassword: env.BREEZE_PASSWORD || 'password123',
	userFullName: env.USER_FULL_NAME || 'Test User',
	userFullName2: env.USER_FULL_NAME_2 || 'Test User 2',
	managingOrg: {
		organizationId: env.MANAGING_ORG_ID || '20739',
	},
	aiConfig: {},
};
