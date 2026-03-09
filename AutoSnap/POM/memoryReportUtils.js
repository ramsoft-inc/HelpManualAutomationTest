/**
 * Memory Report Utilities
 * 
 * This module provides reusable functions for generating and attaching memory reports
 * in Playwright tests. It standardizes memory leak detection reporting across
 * multiple test files.
 * 
 * @author Playwright Test Team
 * @version 1.0.0
 */

// const { getMemoryLeakConfig } = require('./memoryLeakConfig');

/**
 * Generates and attaches memory reports to test results
 * 
 * @param {Object} memoryDetector - The memory leak detector instance
 * @param {Object} testInfo - Playwright test info object
 * @param {Object} options - Configuration options
 * @param {string} options.reportDirectory - Directory to save reports (default: 'test-results/memory-reports')
 * @param {boolean} options.attachDetailedReport - Whether to attach detailed JSON report (default: true)
 * @param {boolean} options.attachSummaryReport - Whether to attach summary report (default: true)
 * @param {boolean} options.logToConsole - Whether to log results to console (default: true)
 * @param {boolean} options.failOnLeak - Whether to fail test if memory leak detected (default: false)
 * @param {number} options.maxMemoryGrowthMB - Maximum allowed memory growth in MB (default: 300)
 * @returns {Promise<Object>} Analysis results and report paths
 */
async function generateAndAttachMemoryReport(memoryDetector, testInfo, options = {}) {
    // Simple default configuration
    const {
        reportDirectory = 'test-results/memory-reports',
        attachDetailedReport = true,
        attachSummaryReport = true,
        logToConsole = true,
        failOnLeak = false,
        maxMemoryGrowthMB = 300
    } = options;

    // Early return if no memory detector
    if (!memoryDetector) {
        console.warn('⚠️ Memory detector not available - skipping memory report');
        return null;
    }

    try {
        console.log('📊 Generating memory report...');
        
        // Get analysis results
        const analysis = memoryDetector.analyzeMemoryLeaks();
        
        // Extract memory growth data safely
        const memoryGrowthBytes = analysis?.memoryGrowth?.bytes;
        const memoryGrowthMB = analysis?.memoryGrowth?.megabytes;
        const memoryGrowthPercentage = analysis?.memoryGrowth?.percentage;
        
        // Log results to console
        if (logToConsole) {
            console.log(`📊 Memory Analysis for ${testInfo.title}:`);
            
            if (isNaN(memoryGrowthBytes) || memoryGrowthBytes === undefined) {
                console.log('   Memory Growth: Unable to calculate (insufficient data)');
            } else {
                console.log(`   Memory Growth: ${memoryDetector.formatBytes(memoryGrowthBytes)} (${memoryGrowthMB?.toFixed(2) || 'N/A'} MB, ${memoryGrowthPercentage?.toFixed(2) || 'N/A'}%)`);
            }
            
            console.log(`   DOM Node Growth: ${analysis?.domNodeGrowth || 0}`);
            console.log(`   Event Listener Growth: ${analysis?.eventListenerGrowth || 0}`);
            console.log(`   Has Leak: ${analysis?.hasLeak ? '⚠️  YES' : '✅ NO'}`);
            
            if (analysis?.recommendations?.length > 0) {
                console.log('   Recommendations:');
                analysis.recommendations.forEach(rec => console.log(`     - ${rec}`));
            }
        }

        // Try to save detailed report
        let reportPaths = null;
        if (attachDetailedReport) {
            try {
                reportPaths = await memoryDetector.saveReport(reportDirectory);
                if (reportPaths?.reportPath) {
                    await testInfo.attach('Memory Report', {
                        path: reportPaths.reportPath,
                        contentType: 'application/json'
                    });
                    console.log(`📎 Memory report attached: ${reportPaths.reportPath}`);
                }
            } catch (saveError) {
                console.warn('⚠️ Failed to save detailed report:', saveError.message);
            }
        }

        // Create and attach summary report
        if (attachSummaryReport) {
            const summaryReport = {
                testName: testInfo.title,
                timestamp: new Date().toISOString(),
                summary: {
                    memoryGrowth: isNaN(memoryGrowthBytes) || memoryGrowthBytes === undefined 
                        ? 'Unable to calculate' 
                        : `${memoryDetector.formatBytes(memoryGrowthBytes)} (${memoryGrowthMB?.toFixed(2) || 'N/A'} MB)`,
                    domNodeGrowth: analysis?.domNodeGrowth || 0,
                    eventListenerGrowth: analysis?.eventListenerGrowth || 0,
                    hasLeak: analysis?.hasLeak || false,
                    recommendations: analysis?.recommendations || []
                }
            };

            await testInfo.attach('Memory Summary', {
                body: JSON.stringify(summaryReport, null, 2),
                contentType: 'application/json'
            });
            console.log('📋 Memory summary attached');
        }

        // Check limits and optionally fail
        if (!isNaN(memoryGrowthBytes) && memoryGrowthBytes !== undefined && memoryGrowthMB > maxMemoryGrowthMB) {
            const errorMessage = `Memory growth exceeded ${maxMemoryGrowthMB}MB limit. Actual: ${memoryGrowthMB?.toFixed(2)}MB`;
            if (failOnLeak) {
                throw new Error(errorMessage);
            } else {
                console.warn(`⚠️ ${errorMessage}`);
            }
        }

        console.log('✅ Memory report generation completed');
        return {
            analysis,
            reportPaths,
            summary: {
                memoryGrowthBytes,
                memoryGrowthMB,
                memoryGrowthPercentage,
                domNodeGrowth: analysis?.domNodeGrowth || 0,
                eventListenerGrowth: analysis?.eventListenerGrowth || 0,
                hasLeak: analysis?.hasLeak || false,
                recommendations: analysis?.recommendations || []
            }
        };

    } catch (error) {
        console.error('❌ Memory report generation failed:', error.message);
        
        // Attach error information
        await testInfo.attach('Memory Report Error', {
            body: `Memory report generation failed: ${error.message}\nStack: ${error.stack}`,
            contentType: 'text/plain'
        });

        // Re-throw if configured to fail on errors
        if (failOnLeak) {
            throw error;
        }

        return null;
    }
}

/**
 * Logs memory analysis results to console in a formatted way
 * 
 * @param {string} testTitle - The test title
 * @param {Object} analysis - Memory analysis results
 * @param {Object} memoryDetector - Memory detector instance
 * @param {Object} memoryGrowth - Memory growth data
 */
function logMemoryAnalysisToConsole(testTitle, analysis, memoryDetector, memoryGrowth) {
    const { memoryGrowthBytes, memoryGrowthMB, memoryGrowthPercentage } = memoryGrowth;
    
    console.log(`📊 Memory Analysis for ${testTitle}:`);
    
    if (isNaN(memoryGrowthBytes) || memoryGrowthBytes === undefined) {
        console.log(`   Memory Growth: Unable to calculate (insufficient memory data)`);
    } else {
        console.log(`   Memory Growth: ${memoryDetector.formatBytes(memoryGrowthBytes)} (${memoryGrowthMB?.toFixed(2) || 'N/A'} MB, ${memoryGrowthPercentage?.toFixed(2) || 'N/A'}%)`);
    }
    
    console.log(`   DOM Node Growth: ${analysis.domNodeGrowth || 0}`);
    console.log(`   Event Listener Growth: ${analysis.eventListenerGrowth || 0}`);
    console.log(`   Has Leak: ${analysis.hasLeak ? '⚠️  YES' : '✅ NO'}`);

    if (analysis.recommendations && analysis.recommendations.length > 0) {
        console.log('   Recommendations:');
        analysis.recommendations.forEach(rec => console.log(`     - ${rec}`));
    }
}

/**
 * Creates a summary report object
 * 
 * @param {string} testTitle - The test title
 * @param {Object} analysis - Memory analysis results
 * @param {Object} memoryDetector - Memory detector instance
 * @param {Object} memoryGrowth - Memory growth data
 * @returns {Object} Summary report object
 */
function createSummaryReport(testTitle, analysis, memoryDetector, memoryGrowth) {
    const { memoryGrowthBytes, memoryGrowthMB, memoryGrowthPercentage } = memoryGrowth;
    
    return {
        testName: testTitle,
        timestamp: new Date().toISOString(),
        summary: {
            memoryGrowth: isNaN(memoryGrowthBytes) || memoryGrowthBytes === undefined 
                ? 'Unable to calculate' 
                : `${memoryDetector.formatBytes(memoryGrowthBytes)} (${memoryGrowthMB?.toFixed(2) || 'N/A'} MB)`,
            domNodeGrowth: analysis.domNodeGrowth || 0,
            eventListenerGrowth: analysis.eventListenerGrowth || 0,
            hasLeak: analysis.hasLeak,
            recommendations: analysis.recommendations || []
        }
    };
}

/**
 * Creates a standardized afterEach hook for memory reporting
 * 
 * @param {Object} options - Configuration options
 * @returns {Function} afterEach hook function
 */
function createMemoryReportAfterEach(options = {}) {
    return async function afterEach({ page }, testInfo) {
        // Get memory detector from page context or global scope
        const memoryDetector = page.memoryDetector || global.memoryDetector;
        
        if (!memoryDetector) {
            console.warn('⚠️ Memory detector not found. Make sure to initialize it in beforeEach hook.');
            return;
        }

        await generateAndAttachMemoryReport(memoryDetector, testInfo, options);
    };
}

/**
 * Validates memory growth against specified limits
 * 
 * @param {Object} analysis - Memory analysis results
 * @param {Object} limits - Memory growth limits
 * @param {number} limits.maxMemoryGrowthMB - Maximum allowed memory growth in MB (default: 200)
 * @param {number} limits.maxDomNodeGrowth - Maximum allowed DOM node growth (default: 1000)
 * @param {number} limits.maxEventListenerGrowth - Maximum allowed event listener growth (default: 100)
 * @returns {Object} Validation results
 */
function validateMemoryLimits(analysis, limits = {}) {
    const {
        maxMemoryGrowthMB = 200,
        maxDomNodeGrowth = 1000,
        maxEventListenerGrowth = 100
    } = limits;

    const memoryGrowthMB = analysis.memoryGrowth?.megabytes;
    const domNodeGrowth = analysis.domNodeGrowth || 0;
    const eventListenerGrowth = analysis.eventListenerGrowth || 0;

    const violations = [];

    if (!isNaN(memoryGrowthMB) && memoryGrowthMB > maxMemoryGrowthMB) {
        violations.push(`Memory growth (${memoryGrowthMB?.toFixed(2)}MB) exceeds limit (${maxMemoryGrowthMB}MB)`);
    }

    if (domNodeGrowth > maxDomNodeGrowth) {
        violations.push(`DOM node growth (${domNodeGrowth}) exceeds limit (${maxDomNodeGrowth})`);
    }

    if (eventListenerGrowth > maxEventListenerGrowth) {
        violations.push(`Event listener growth (${eventListenerGrowth}) exceeds limit (${maxEventListenerGrowth})`);
    }

    return {
        isValid: violations.length === 0,
        violations,
        limits: { maxMemoryGrowthMB, maxDomNodeGrowth, maxEventListenerGrowth },
        actual: { memoryGrowthMB, domNodeGrowth, eventListenerGrowth }
    };
}

module.exports = {
    generateAndAttachMemoryReport,
    logMemoryAnalysisToConsole,
    createSummaryReport,
    createMemoryReportAfterEach,
    validateMemoryLimits
};
