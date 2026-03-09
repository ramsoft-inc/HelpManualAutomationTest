/**
 * Token Optimization Utilities
 * 
 * This module provides utilities to optimize API calls by reusing authentication tokens
 * across multiple operations, reducing execution time and API load.
 * 
 * @author Playwright Test Team
 * @version 1.0.0
 */

/**
 * Optimizes DICOM import operations by getting token once and reusing it
 * 
 * @param {Object} api - The postStudyNGetToken API instance
 * @param {Array} studies - Array of study objects with studyId
 * @param {Array} filePaths - Array of DICOM file paths to import
 * @param {Object} options - Configuration options
 * @param {string} options.organizationId - Organization ID (optional)
 * @param {boolean} options.logProgress - Whether to log progress (default: true)
 * @returns {Promise<Object>} Import results and timing information
 */
async function optimizeDicomImports(api, studies, filePaths, options = {}) {
    const {
        organizationId = null,
        logProgress = true
    } = options;

    const startTime = Date.now();
    
    if (logProgress) {
        console.log('🔑 Getting authentication token for optimized DICOM imports...');
    }
    
    // Get token once and reuse for all imports
    const tokenAndSessionId = await api.getTokenAndSessionId();
    
    if (logProgress) {
        console.log('✅ Authentication token obtained successfully');
        console.log(`Starting optimized DICOM import for ${studies.length} studies with ${filePaths.length} files each...`);
    }
    
    const importPromises = [];
    const totalOperations = studies.length * filePaths.length;
    
    // Create all import promises using the shared token
    studies.forEach((study, studyIndex) => {
        filePaths.forEach((filePath, fileIndex) => {
            importPromises.push(
                api.importDICOM(filePath, study.studyId, organizationId, tokenAndSessionId)
                    .then(() => {
                        if (logProgress) {
                            console.log(`✅ Imported file ${fileIndex + 1} for study ${studyIndex + 1}: ${study.accessionNum || study.studyId}`);
                        }
                    })
                    .catch(error => {
                        console.error(`❌ Failed to import file ${fileIndex + 1} for study ${studyIndex + 1}: ${study.accessionNum || study.studyId}`, error);
                        throw error;
                    })
            );
        });
    });
    
    if (logProgress) {
        console.log(`Executing ${totalOperations} DICOM import operations in parallel with shared token...`);
    }
    
    // Execute all imports in parallel
    const results = await Promise.allSettled(importPromises);
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Calculate success/failure statistics
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;
    
    if (logProgress) {
        console.log(`🎉 DICOM imports completed in ${duration} seconds`);
        console.log(`📊 Results: ${successful} successful, ${failed} failed out of ${totalOperations} operations`);
    }
    
    return {
        duration: parseFloat(duration),
        totalOperations,
        successful,
        failed,
        results,
        tokenReused: true
    };
}

/**
 * Optimizes multiple API calls by getting token once and reusing it
 * 
 * @param {Object} api - The postStudyNGetToken API instance
 * @param {Array} operations - Array of operation objects
 * @param {Function} operations[].method - The API method to call
 * @param {Array} operations[].args - Arguments to pass to the method
 * @param {string} operations[].name - Name of the operation for logging
 * @param {Object} options - Configuration options
 * @param {boolean} options.logProgress - Whether to log progress (default: true)
 * @returns {Promise<Object>} Operation results and timing information
 */
async function optimizeApiCalls(api, operations, options = {}) {
    const {
        logProgress = true
    } = options;

    const startTime = Date.now();
    
    if (logProgress) {
        console.log('🔑 Getting authentication token for optimized API calls...');
    }
    
    // Get token once and reuse for all operations
    const tokenAndSessionId = await api.getTokenAndSessionId();
    
    if (logProgress) {
        console.log('✅ Authentication token obtained successfully');
        console.log(`Starting ${operations.length} optimized API operations...`);
    }
    
    const operationPromises = operations.map((operation, index) => {
        const { method, args = [], name = `Operation ${index + 1}` } = operation;
        
        // Add token as the last parameter if the method supports it
        const optimizedArgs = [...args, tokenAndSessionId];
        
        return method.apply(api, optimizedArgs)
            .then(result => {
                if (logProgress) {
                    console.log(`✅ Completed: ${name}`);
                }
                return { name, result, success: true };
            })
            .catch(error => {
                console.error(`❌ Failed: ${name}`, error);
                return { name, error, success: false };
            });
    });
    
    if (logProgress) {
        console.log(`Executing ${operations.length} API operations in parallel with shared token...`);
    }
    
    // Execute all operations in parallel
    const results = await Promise.allSettled(operationPromises);
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Calculate success/failure statistics
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;
    
    if (logProgress) {
        console.log(`🎉 API operations completed in ${duration} seconds`);
        console.log(`📊 Results: ${successful} successful, ${failed} failed out of ${operations.length} operations`);
    }
    
    return {
        duration: parseFloat(duration),
        totalOperations: operations.length,
        successful,
        failed,
        results,
        tokenReused: true
    };
}

/**
 * Creates a token manager for batch operations
 * 
 * @param {Object} api - The postStudyNGetToken API instance
 * @returns {Object} Token manager with methods for batch operations
 */
function createTokenManager(api) {
    let cachedToken = null;
    let tokenExpiry = null;
    const TOKEN_LIFETIME_MS = 30 * 60 * 1000; // 30 minutes
    
    return {
        /**
         * Gets a valid token, using cached token if available and not expired
         */
        async getToken() {
            const now = Date.now();
            
            if (cachedToken && tokenExpiry && now < tokenExpiry) {
                console.log('🔄 Using cached authentication token');
                return cachedToken;
            }
            
            console.log('🔑 Getting new authentication token...');
            cachedToken = await api.getTokenAndSessionId();
            tokenExpiry = now + TOKEN_LIFETIME_MS;
            console.log('✅ New authentication token obtained and cached');
            
            return cachedToken;
        },
        
        /**
         * Clears the cached token
         */
        clearToken() {
            cachedToken = null;
            tokenExpiry = null;
            console.log('🗑️ Cached authentication token cleared');
        },
        
        /**
         * Checks if the cached token is still valid
         */
        isTokenValid() {
            const now = Date.now();
            return cachedToken && tokenExpiry && now < tokenExpiry;
        },
        
        /**
         * Gets token info for debugging
         */
        getTokenInfo() {
            return {
                hasToken: !!cachedToken,
                isExpired: tokenExpiry ? Date.now() >= tokenExpiry : true,
                expiresAt: tokenExpiry ? new Date(tokenExpiry).toISOString() : null
            };
        }
    };
}

/**
 * Performance comparison utility
 * 
 * @param {Function} optimizedFunction - Function that uses optimized token approach
 * @param {Function} standardFunction - Function that uses standard token approach
 * @param {string} testName - Name of the test for logging
 * @returns {Promise<Object>} Performance comparison results
 */
async function comparePerformance(optimizedFunction, standardFunction, testName = 'Performance Test') {
    console.log(`🏁 Starting performance comparison: ${testName}`);
    
    // Run optimized version
    console.log('⚡ Running optimized version...');
    const optimizedStart = Date.now();
    const optimizedResult = await optimizedFunction();
    const optimizedDuration = Date.now() - optimizedStart;
    
    // Run standard version
    console.log('🐌 Running standard version...');
    const standardStart = Date.now();
    const standardResult = await standardFunction();
    const standardDuration = Date.now() - standardStart;
    
    // Calculate improvement
    const improvement = ((standardDuration - optimizedDuration) / standardDuration * 100).toFixed(2);
    const timeSaved = ((standardDuration - optimizedDuration) / 1000).toFixed(2);
    
    console.log(`📊 Performance Comparison Results for ${testName}:`);
    console.log(`   Optimized: ${(optimizedDuration / 1000).toFixed(2)}s`);
    console.log(`   Standard:  ${(standardDuration / 1000).toFixed(2)}s`);
    console.log(`   Improvement: ${improvement}% faster`);
    console.log(`   Time Saved: ${timeSaved}s`);
    
    return {
        testName,
        optimized: {
            duration: optimizedDuration,
            result: optimizedResult
        },
        standard: {
            duration: standardDuration,
            result: standardResult
        },
        improvement: parseFloat(improvement),
        timeSaved: parseFloat(timeSaved)
    };
}

module.exports = {
    optimizeDicomImports,
    optimizeApiCalls,
    createTokenManager,
    comparePerformance
};
