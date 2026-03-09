// Stub file for cypress testUtils
// This is a placeholder to prevent import errors
function generateTestEmail(prefix = 'test') {
	const timestamp = Date.now();
	return `${prefix}-${timestamp}@example.com`;
}

module.exports = { generateTestEmail };
