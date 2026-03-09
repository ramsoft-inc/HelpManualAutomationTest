const fs = require('fs');
const path = require('path');

/**
 * Memory Leak Detection Page Object Model
 * 
 * This class provides comprehensive memory leak detection capabilities for E2E tests.
 * It monitors browser memory usage, DOM nodes, event listeners, and provides detailed
 * analysis and reporting functionality.
 * 
 * Usage:
 * const memoryDetector = new MemoryLeakDetector(page);
 * await memoryDetector.initializeMonitoring('test-name');
 * await memoryDetector.captureMemorySnapshot('checkpoint');
 * const report = memoryDetector.generateReport();
 */
class MemoryLeakDetector {
	/**
	 * Initialize the memory leak detector
	 * @param {Page} page - Playwright page object
	 */
	constructor(page) {
		this.page = page;
		this.memorySnapshots = [];
		this.performanceMetrics = [];
		this.startTime = null;
		this.testName = '';
	}

	/**
	 * Initialize memory monitoring for a test
	 * @param {string} testName - Name of the test being monitored
	 */
	async initializeMonitoring(testName) {
		this.testName = testName;
		this.startTime = Date.now();
		this.memorySnapshots = [];
		this.performanceMetrics = [];
		
		// Enable precise memory info for the current window
		await this.page.addInitScript(() => {
			if (window.performance && window.performance.memory) {
				window.memoryMonitoringEnabled = true;
			}
		});
		
		console.log(`🔍 Memory monitoring initialized for: ${testName}`);
	}

	/**
	 * Capture current memory usage snapshot with the most accurate measurement available
	 * @param {string} label - Label for this snapshot
	 * @returns {Promise<Object|null>} Memory snapshot data or null if failed
	 */
	async captureMemorySnapshot(label = 'snapshot') {
		try {
			const timestamp = Date.now() - this.startTime;
			
			// Always use the most accurate current window heap memory capture
			// This ensures consistent, accurate measurements that match browser snapshots
			const memoryInfo = await this.captureCurrentWindowHeapMemory();

			// Get DOM node count
			const domNodeCount = await this.page.evaluate(() => {
				return document.querySelectorAll('*').length;
			});

			// Get event listener count (approximate)
			const eventListenerCount = await this.page.evaluate(() => {
				let count = 0;
				const elements = document.querySelectorAll('*');
				elements.forEach(element => {
					if (element._events || element.__eventListeners) {
						count++;
					}
				});
				return count;
			});

			const snapshot = {
				label,
				timestamp,
				timestampMs: Date.now(),
				timestampISO: new Date().toISOString(),
				memoryInfo,
				domNodeCount,
				eventListenerCount,
				url: this.page.url()
			};

			this.memorySnapshots.push(snapshot);
			
			// Log current window heap memory (matches browser snapshot JSHeap)
			const jsHeapMB = memoryInfo?.usedJSHeapSizeMB || 0;
			const windowHeapMB = memoryInfo?.windowHeapMemoryMB || memoryInfo?.cdpTotalSizeMB || 0;
			const samples = memoryInfo?.samples || 1;
			const measurementType = memoryInfo?.measurementType || (samples > 1 ? `(avg of ${samples} samples)` : '');
			
			if (windowHeapMB > 0) {
				console.log(`📊 Memory snapshot captured [${label}]: Used JS Heap: ${this.formatBytes(memoryInfo?.usedJSHeapSize || 0)} (${jsHeapMB} MB), Window Heap: ${this.formatBytes(memoryInfo?.windowHeapMemory || memoryInfo?.cdpTotalSize || 0)} (${windowHeapMB} MB) ${measurementType}`);
			} else {
				console.log(`📊 Memory snapshot captured [${label}]: ${this.formatBytes(memoryInfo?.usedJSHeapSize || 0)} (${jsHeapMB} MB) ${measurementType}`);
			}
			
			return snapshot;
		} catch (error) {
			console.warn(`Failed to capture memory snapshot: ${error.message}`);
			return null;
		}
	}

	/**
	 * Perform memory stress test by repeatedly performing actions
	 * @param {Function} actionFn - Async function to execute repeatedly
	 * @param {number} iterations - Number of iterations to perform
	 * @param {string} label - Label for this stress test
	 */
	async performMemoryStressTest(actionFn, iterations = 10, label = 'stress-test') {
		console.log(`🧪 Starting memory stress test: ${label} (${iterations} iterations)`);
		
		await this.captureMemorySnapshot(`${label}-start`);
		
		for (let i = 0; i < iterations; i++) {
			await actionFn();
			
			// Capture memory every few iterations
			if (i % 3 === 0 || i === iterations - 1) {
				await this.captureMemorySnapshot(`${label}-iteration-${i + 1}`);
			}
			
			// Small delay to allow for garbage collection
			await this.page.waitForTimeout(100);
		}
		
		await this.captureMemorySnapshot(`${label}-end`);
		
		// Force garbage collection if possible
		await this.forceGarbageCollection();
		await this.page.waitForTimeout(1000);
		await this.captureMemorySnapshot(`${label}-after-gc`);
	}

	/**
	 * Force garbage collection (Chrome only)
	 */
	async forceGarbageCollection() {
		try {
			await this.page.evaluate(() => {
				if (window.gc) {
					window.gc();
				}
			});
		} catch (error) {
			// GC not available, ignore
		}
	}

	/**
	 * Manually trigger garbage collection and wait for it to complete
	 * Call this before taking memory snapshots for more accurate measurements
	 */
	async triggerGarbageCollection() {
		try {
			console.log('🗑️ Triggering garbage collection...');
			await this.forceGarbageCollection();
			await this.page.waitForTimeout(500); // Wait for GC to complete
			console.log('✅ Garbage collection completed');
		} catch (error) {
			console.warn(`Failed to trigger garbage collection: ${error.message}`);
		}
	}



	/**
	 * Capture heap memory for the current window only
	 * @returns {Promise<Object|null>} Current window heap memory info
	 */
	async captureCurrentWindowHeapMemory() {
		try {
			// Get window-specific heap memory that matches browser snapshot
			const memoryInfo = await this.page.evaluate(() => {
				const result = {
					timestamp: new Date().toISOString(),
					timestampMs: Date.now(),
					measurementType: 'current-window-heap-memory',
					scope: 'current',
					samples: 1
				};

				// Get the exact window heap memory that browser snapshot shows
				if (window.performance && window.performance.memory) {
					const usedJSHeapSize = window.performance.memory.usedJSHeapSize;
					const totalJSHeapSize = window.performance.memory.totalJSHeapSize;
					const jsHeapSizeLimit = window.performance.memory.jsHeapSizeLimit;
					
					// This is the exact memory that browser snapshot shows as "JSHeap"
					result.usedJSHeapSize = usedJSHeapSize;
					result.totalJSHeapSize = totalJSHeapSize;
					result.jsHeapSizeLimit = jsHeapSizeLimit;
					result.usedJSHeapSizeMB = Math.round((usedJSHeapSize / (1024 * 1024)) * 100) / 100;
					result.totalJSHeapSizeMB = Math.round((totalJSHeapSize / (1024 * 1024)) * 100) / 100;
					result.jsHeapSizeLimitMB = Math.round((jsHeapSizeLimit / (1024 * 1024)) * 100) / 100;
					
					// Use totalJSHeapSize as it represents the total heap allocated for this window
					// This should match the browser snapshot's JSHeap value
					result.windowHeapMemory = totalJSHeapSize;
					result.windowHeapMemoryMB = result.totalJSHeapSizeMB;
				}

				// Try to get more detailed memory breakdown if available
				if (window.performance && window.performance.memory) {
					// Get additional memory metrics that might be available
					result.memoryBreakdown = {
						used: window.performance.memory.usedJSHeapSize,
						total: window.performance.memory.totalJSHeapSize,
						limit: window.performance.memory.jsHeapSizeLimit
					};
				}

				return result;
			});

			// Also try to get window-specific memory from CDP if available
			try {
				const client = await this.page.context().newCDPSession(this.page);
				
				// Get heap usage for this specific page/window
				const heapUsage = await client.send('Runtime.getHeapUsage');
				if (heapUsage) {
					memoryInfo.cdpUsedSize = heapUsage.usedSize;
					memoryInfo.cdpTotalSize = heapUsage.totalSize;
					memoryInfo.cdpUsedSizeMB = Math.round((heapUsage.usedSize / (1024 * 1024)) * 100) / 100;
					memoryInfo.cdpTotalSizeMB = Math.round((heapUsage.totalSize / (1024 * 1024)) * 100) / 100;
					
					// Use CDP total size as it's specific to this window's heap
					memoryInfo.windowHeapMemory = heapUsage.totalSize;
					memoryInfo.windowHeapMemoryMB = memoryInfo.cdpTotalSizeMB;
				}
				
				await client.detach();
			} catch (cdpError) {
				// CDP not available, continue with performance.memory
				console.log('CDP memory info not available, using performance.memory');
			}

			return memoryInfo;
		} catch (error) {
			console.warn(`Failed to capture current window heap memory: ${error.message}`);
			return null;
		}
	}



	/**
	 * Analyze memory snapshots for potential leaks
	 * @returns {Object} Analysis results with leak detection and recommendations
	 */
	analyzeMemoryLeaks() {
		if (this.memorySnapshots.length < 2) {
			return { hasLeak: false, analysis: 'Insufficient data for analysis' };
		}

		const firstSnapshot = this.memorySnapshots[0];
		const lastSnapshot = this.memorySnapshots[this.memorySnapshots.length - 1];
		
		// Debug: Log all snapshots for analysis
		console.log('🔍 Memory Analysis Debug:');
		console.log(`   Total snapshots: ${this.memorySnapshots.length}`);
		this.memorySnapshots.forEach((snapshot, index) => {
			const memoryMB = snapshot.memoryInfo?.usedJSHeapSizeMB || 0;
			console.log(`   Snapshot ${index + 1} [${snapshot.label}]: ${memoryMB} MB`);
		});
		
		// Check if we have valid memory info
		if (!firstSnapshot.memoryInfo || !lastSnapshot.memoryInfo) {
			console.warn('⚠️ Missing memory info in snapshots');
			return { hasLeak: false, analysis: 'Missing memory data' };
		}
		
		// Use window heap memory if available, otherwise fall back to JS heap
		const firstMemorySize = firstSnapshot.memoryInfo.windowHeapMemory || firstSnapshot.memoryInfo.cdpTotalSize || firstSnapshot.memoryInfo.usedJSHeapSize;
		const lastMemorySize = lastSnapshot.memoryInfo.windowHeapMemory || lastSnapshot.memoryInfo.cdpTotalSize || lastSnapshot.memoryInfo.usedJSHeapSize;
		const firstMemoryMB = firstSnapshot.memoryInfo.windowHeapMemoryMB || firstSnapshot.memoryInfo.cdpTotalSizeMB || firstSnapshot.memoryInfo.usedJSHeapSizeMB;
		const lastMemoryMB = lastSnapshot.memoryInfo.windowHeapMemoryMB || lastSnapshot.memoryInfo.cdpTotalSizeMB || lastSnapshot.memoryInfo.usedJSHeapSizeMB;
		
		const memoryGrowth = lastMemorySize - firstMemorySize;
		const domNodeGrowth = lastSnapshot.domNodeCount - firstSnapshot.domNodeCount;
		const eventListenerGrowth = lastSnapshot.eventListenerCount - firstSnapshot.eventListenerCount;
		
		// Calculate growth rates
		const memoryGrowthMB = memoryGrowth / (1024 * 1024);
		const memoryGrowthPercentage = (memoryGrowth / firstMemorySize) * 100;
		
		const memoryType = firstSnapshot.memoryInfo.windowHeapMemory ? 'Window Heap' : 'JS Heap';
		console.log(`   First snapshot memory (${memoryType}): ${firstMemoryMB} MB`);
		console.log(`   Last snapshot memory (${memoryType}): ${lastMemoryMB} MB`);
		console.log(`   Memory growth: ${memoryGrowthMB.toFixed(2)} MB`);
		
		// Define leak thresholds
		const MEMORY_LEAK_THRESHOLD_MB = 10; // 10MB growth
		const MEMORY_LEAK_THRESHOLD_PERCENT = 50; // 50% growth
		const DOM_NODE_LEAK_THRESHOLD = 100; // 100 additional DOM nodes
		const EVENT_LISTENER_LEAK_THRESHOLD = 50; // 50 additional event listeners
		
		// Memory leak detection: only positive growth indicates potential leaks
		// Negative growth means memory is being freed (good!)
		const hasMemoryLeak = memoryGrowthMB > MEMORY_LEAK_THRESHOLD_MB || 
							  memoryGrowthPercentage > MEMORY_LEAK_THRESHOLD_PERCENT;
		const hasDOMNodeLeak = domNodeGrowth > DOM_NODE_LEAK_THRESHOLD;
		const hasEventListenerLeak = eventListenerGrowth > EVENT_LISTENER_LEAK_THRESHOLD;
		
		// Determine memory status
		let memoryStatus = 'stable';
		if (memoryGrowthMB < -5) {
			memoryStatus = 'improving'; // Memory decreased by more than 5MB
		} else if (memoryGrowthMB > MEMORY_LEAK_THRESHOLD_MB) {
			memoryStatus = 'leaking'; // Memory increased significantly
		} else if (memoryGrowthMB > 2) {
			memoryStatus = 'slight_increase'; // Small increase, monitor
		}
		
		const analysis = {
			hasLeak: hasMemoryLeak || hasDOMNodeLeak || hasEventListenerLeak,
			memoryGrowth: {
				bytes: memoryGrowth,
				megabytes: memoryGrowthMB,
				percentage: memoryGrowthPercentage
			},
			memoryStatus: memoryStatus,
			domNodeGrowth,
			eventListenerGrowth,
			snapshots: this.memorySnapshots.length,
			duration: lastSnapshot.timestamp,
			recommendations: []
		};
		
		// Add specific recommendations
		if (hasMemoryLeak) {
			analysis.recommendations.push('Potential JavaScript memory leak detected. Check for unreleased object references.');
		}
		if (hasDOMNodeLeak) {
			analysis.recommendations.push('DOM node count increased significantly. Check for dynamically created elements that are not being removed.');
		}
		if (hasEventListenerLeak) {
			analysis.recommendations.push('Event listener count increased. Ensure event listeners are properly removed when components are destroyed.');
		}
		
		// Add positive feedback for good memory management
		if (memoryStatus === 'improving') {
			analysis.recommendations.push('✅ Memory usage decreased significantly - excellent memory management!');
		} else if (memoryStatus === 'stable') {
			analysis.recommendations.push('✅ Memory usage remained stable - good memory management.');
		} else if (memoryStatus === 'slight_increase') {
			analysis.recommendations.push('⚠️ Small memory increase detected - monitor for potential issues.');
		}
		
		return analysis;
	}

	/**
	 * Generate comprehensive memory usage report
	 * @returns {Object} Detailed memory report with analysis and snapshots
	 */
	generateReport() {
		const analysis = this.analyzeMemoryLeaks();
		
		const report = {
			testName: this.testName,
			timestamp: new Date().toISOString(),
			analysis,
			snapshots: this.memorySnapshots,
			summary: {
				totalSnapshots: this.memorySnapshots.length,
				testDuration: this.memorySnapshots.length > 0 ? 
					this.memorySnapshots[this.memorySnapshots.length - 1].timestamp : 0,
				testDurationISO: this.memorySnapshots.length > 0 ? 
					this.memorySnapshots[this.memorySnapshots.length - 1].timestampISO : null,
				hasLeak: analysis.hasLeak,
				// Add MB values to summary
				initialMemoryMB: this.memorySnapshots.length > 0 ? 
					this.memorySnapshots[0].memoryInfo?.usedJSHeapSizeMB : null,
				finalMemoryMB: this.memorySnapshots.length > 0 ? 
					this.memorySnapshots[this.memorySnapshots.length - 1].memoryInfo?.usedJSHeapSizeMB : null
			}
		};
		
		console.log(`📋 Memory Report for ${this.testName}:`);
		console.log(`   Duration: ${report.summary.testDuration}ms (${report.summary.testDurationISO})`);
		console.log(`   Snapshots: ${report.summary.totalSnapshots}`);
		console.log(`   Initial Memory: ${report.summary.initialMemoryMB || 'N/A'} MB`);
		console.log(`   Final Memory: ${report.summary.finalMemoryMB || 'N/A'} MB`);
		
		// Show memory growth with appropriate emoji based on status
		const growthMB = analysis.memoryGrowth?.megabytes?.toFixed(2) || 'N/A';
		const growthBytes = this.formatBytes(analysis.memoryGrowth?.bytes || 0);
		let growthEmoji = '📊';
		if (analysis.memoryStatus === 'improving') {
			growthEmoji = '📉';
		} else if (analysis.memoryStatus === 'leaking') {
			growthEmoji = '📈';
		} else if (analysis.memoryStatus === 'slight_increase') {
			growthEmoji = '📊';
		}
		
		console.log(`   Memory Growth: ${growthEmoji} ${growthBytes} (${growthMB} MB) - Status: ${analysis.memoryStatus}`);
		console.log(`   DOM Node Growth: ${analysis.domNodeGrowth || 0}`);
		console.log(`   Has Leak: ${analysis.hasLeak ? '⚠️  YES' : '✅ NO'}`);
		
		if (analysis.recommendations.length > 0) {
			console.log('   Recommendations:');
			analysis.recommendations.forEach(rec => console.log(`     - ${rec}`));
		}
		
		return report;
	}

	/**
	 * Save memory report to file
	 * @param {string} outputDir - Directory to save reports (default: 'test-results/memory-reports')
	 * @returns {Promise<Object>} Paths to saved files
	 */
	async saveReport(outputDir = 'test-results/memory-reports') {
		const report = this.generateReport();
		
		// Ensure output directory exists
		const fullOutputDir = path.resolve(outputDir);
		if (!fs.existsSync(fullOutputDir)) {
			fs.mkdirSync(fullOutputDir, { recursive: true });
		}
		
		// Save JSON report
		const reportPath = path.join(fullOutputDir, `${this.testName}-${Date.now()}.json`);
		fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
		
		console.log(`💾 Memory report saved: ${reportPath}`);
		
		return { reportPath };
	}

	/**
	 * Generate CSV data for memory snapshots
	 * @returns {string} CSV formatted data
	 */
	generateCSVData() {
		const headers = [
			'Label',
			'Timestamp(ISO)',
			'Timestamp(ms)',
			'UsedJSHeapSize(bytes)',
			'UsedJSHeapSize(MB)',
			'TotalJSHeapSize(bytes)',
			'TotalJSHeapSize(MB)',
			'JSHeapSizeLimit(bytes)',
			'JSHeapSizeLimit(MB)',
			'DOMNodeCount',
			'EventListenerCount',
			'URL'
		];
		
		const rows = this.memorySnapshots.map(snapshot => [
			snapshot.label,
			snapshot.timestampISO || snapshot.timestamp,
			snapshot.timestampMs || snapshot.timestamp,
			snapshot.memoryInfo?.usedJSHeapSize || 0,
			snapshot.memoryInfo?.usedJSHeapSizeMB || 0,
			snapshot.memoryInfo?.totalJSHeapSize || 0,
			snapshot.memoryInfo?.totalJSHeapSizeMB || 0,
			snapshot.memoryInfo?.jsHeapSizeLimit || 0,
			snapshot.memoryInfo?.jsHeapSizeLimitMB || 0,
			snapshot.domNodeCount,
			snapshot.eventListenerCount,
			snapshot.url
		]);
		
		return [headers, ...rows].map(row => row.join(',')).join('\n');
	}

	/**
	 * Format bytes to human readable format
	 * @param {number} bytes - Number of bytes
	 * @returns {string} Human readable format (e.g., "1.5 MB")
	 */
	formatBytes(bytes) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	/**
	 * Get current memory usage as a formatted string
	 * @returns {Promise<string>} Formatted memory usage
	 */
	async getCurrentMemoryUsage() {
		try {
			const memoryInfo = await this.page.evaluate(() => {
				if (window.performance && window.performance.memory) {
					return {
						used: window.performance.memory.usedJSHeapSize,
						total: window.performance.memory.totalJSHeapSize
					};
				}
				return null;
			});
			
			if (memoryInfo) {
				return `${this.formatBytes(memoryInfo.used)} / ${this.formatBytes(memoryInfo.total)}`;
			}
			return 'Memory info not available';
		} catch (error) {
			return `Error getting memory info: ${error.message}`;
		}
	}

	/**
	 * Check if current memory usage exceeds threshold
	 * @param {number} thresholdMB - Threshold in megabytes
	 * @returns {Promise<boolean>} True if threshold exceeded
	 */
	async isMemoryThresholdExceeded(thresholdMB = 100) {
		try {
			const memoryInfo = await this.page.evaluate(() => {
				if (window.performance && window.performance.memory) {
					return window.performance.memory.usedJSHeapSize;
				}
				return 0;
			});
			
			const usedMB = memoryInfo / (1024 * 1024);
			return usedMB > thresholdMB;
		} catch (error) {
			console.warn(`Error checking memory threshold: ${error.message}`);
			return false;
		}
	}

	/**
	 * Reset all monitoring data
	 */
	reset() {
		this.memorySnapshots = [];
		this.performanceMetrics = [];
		this.startTime = null;
		this.testName = '';
		console.log('🔄 Memory detector reset');
	}

	/**
	 * Clear all snapshots and start fresh
	 * Useful when you want to restart monitoring mid-test
	 */
	clearSnapshots() {
		this.memorySnapshots = [];
		console.log('🗑️ Memory snapshots cleared');
	}

	/**
	 * Get summary of current monitoring session
	 * @returns {Object} Summary information
	 */
	getSummary() {
		const analysis = this.analyzeMemoryLeaks();
		return {
			testName: this.testName,
			snapshots: this.memorySnapshots.length,
			duration: this.memorySnapshots.length > 0 ? 
				this.memorySnapshots[this.memorySnapshots.length - 1].timestamp : 0,
			memoryGrowth: analysis.memoryGrowth,
			hasLeak: analysis.hasLeak,
			recommendations: analysis.recommendations
		};
	}
}

module.exports = { MemoryLeakDetector };
