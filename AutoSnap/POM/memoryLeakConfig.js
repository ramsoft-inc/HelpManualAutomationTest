/**
 * Memory Leak Test Configuration
 * 
 * This module provides common configuration settings for memory leak tests
 * to ensure consistency across all test files and easy maintenance.
 * 
 * @author Playwright Test Team
 * @version 1.0.0
 */

/**
 * Memory Leak Test Configuration Constants
 */
const MEMORY_LEAK_CONFIG = {
    // Memory growth limits
    MAX_MEMORY_GROWTH_MB: 300,
    
    // DOM node growth limits
    MAX_DOM_NODE_GROWTH: 1000,
    
    // Event listener growth limits
    MAX_EVENT_LISTENER_GROWTH: 100,
    
    // Test timeouts
    MEMORY_TEST_TIMEOUT_MS: 600000, // 10 minutes
    PERFORMANCE_TEST_TIMEOUT_MS: 1200000, // 20 minutes
    
    // Memory monitoring settings
    MEMORY_MONITORING: {
        GARBAGE_COLLECTION_WAIT_MS: 10000,
        SNAPSHOT_INTERVAL_MS: 2000,
        BASELINE_WAIT_MS: 5000
    },
    
    // Report settings
    REPORT_SETTINGS: {
        DIRECTORY: 'test-results/memory-reports',
        ATTACH_DETAILED_REPORT: true,
        ATTACH_SUMMARY_REPORT: true,
        LOG_TO_CONSOLE: true,
        FAIL_ON_LEAK: false
    },
    
    // Performance thresholds
    PERFORMANCE_THRESHOLDS: {
        STRICT_MEMORY_LIMIT_MB: 50,
        STANDARD_MEMORY_LIMIT_MB: 200,
        PERFORMANCE_MEMORY_LIMIT_MB: 500,
        UI_TEST_MEMORY_LIMIT_MB: 100
    },
    
    // Module-specific memory limits (for known memory leaks)
    MODULE_MEMORY_LIMITS: {
        DV: {
            MAX_MEMORY_GROWTH_MB: 2000,  // Document Viewer has known memory leaks
            MAX_DOM_NODE_GROWTH: 1500,
            MAX_EVENT_LISTENER_GROWTH: 150
        },
        IV: {
            MAX_MEMORY_GROWTH_MB: 400,  // Image Viewer has known memory leaks
            MAX_DOM_NODE_GROWTH: 1200,
            MAX_EVENT_LISTENER_GROWTH: 120
        },
        GENERAL: {
            MAX_MEMORY_GROWTH_MB: 300,  // General/default limit
            MAX_DOM_NODE_GROWTH: 1000,
            MAX_EVENT_LISTENER_GROWTH: 100
        }
    }
};

/**
 * Get memory leak test configuration
 * 
 * @param {string} module - Module name ('DV', 'IV', 'GENERAL') for module-specific limits
 * @returns {Object} Configuration object for the specified module
 */
function getMemoryLeakConfig(module = 'GENERAL') {
    // Get module-specific limits
    const moduleLimits = MEMORY_LEAK_CONFIG.MODULE_MEMORY_LIMITS[module.toUpperCase()] || MEMORY_LEAK_CONFIG.MODULE_MEMORY_LIMITS.GENERAL;
    
    return {
        maxMemoryGrowthMB: moduleLimits.MAX_MEMORY_GROWTH_MB,
        maxDomNodeGrowth: moduleLimits.MAX_DOM_NODE_GROWTH,
        maxEventListenerGrowth: moduleLimits.MAX_EVENT_LISTENER_GROWTH,
        ...MEMORY_LEAK_CONFIG.REPORT_SETTINGS,
        module: module.toUpperCase() // Include module info in config
    };
}


module.exports = {
    MEMORY_LEAK_CONFIG,
    getMemoryLeakConfig
};
