const fs = require('fs');
const path = require('path');

/**
 * Extracts all POM method calls from Playwright test files
 * Looks for patterns like: poManager.pageName.methodName()
 */
function extractPOMUsage(testDirectory) {
  const usedMethods = new Map(); // Map<pageName, Set<methodName>>
  
  // Recursively find all .spec.js files
  function findTestFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...findTestFiles(fullPath));
      } else if (entry.name.endsWith('.spec.js')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }
  
  const testFiles = findTestFiles(testDirectory);
  console.log(`Found ${testFiles.length} test files`);
  
  // Regular expression to match poManager.pageName.methodName() patterns
  // This will match things like: poManager.homePage.worklistTable()
  const pomMethodPattern = /poManager\.([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*\(/g;
  
  for (const testFile of testFiles) {
    try {
      const content = fs.readFileSync(testFile, 'utf8');
      let match;
      
      while ((match = pomMethodPattern.exec(content)) !== null) {
        const pageName = match[1];
        const methodName = match[2];
        
        if (!usedMethods.has(pageName)) {
          usedMethods.set(pageName, new Set());
        }
        usedMethods.get(pageName).add(methodName);
      }
    } catch (error) {
      console.error(`Error reading ${testFile}:`, error.message);
    }
  }
  
  return usedMethods;
}

// Load configuration
let testDirectory;
let pomDirectory;
let useGitHubSync = false;

try {
  const configPath = path.join(__dirname, 'repo_config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Check if GitHub sync is configured
    if (config.targetRepo.owner && config.targetRepo.repo) {
      useGitHubSync = true;
      console.log('📋 GitHub sync configuration detected');
      console.log(`   Target repo: ${config.targetRepo.owner}/${config.targetRepo.repo}`);
      console.log(`   Use 'npm run sync-pom' to sync from GitHub\n`);
      console.log('⚠️  This script is deprecated for GitHub-based configs.');
      console.log('   It will only work if you have local filesystem access.\n');
    }
    
    // Try to use legacy local paths if available
    if (config.legacy && config.legacy.localPath) {
      testDirectory = path.join(config.legacy.localPath, config.paths.playwrightTests);
      pomDirectory = path.join(config.legacy.localPath, config.paths.pomDirectory);
      console.log('📋 Using legacy local filesystem paths');
    } else {
      // Fallback: try to construct from old config format
      testDirectory = config.paths.playwrightTests;
      pomDirectory = config.paths.pomDirectory;
      
      // Check if these are absolute paths
      if (!path.isAbsolute(testDirectory)) {
        console.error('❌ Relative paths require GitHub sync. Run: npm run sync-pom');
        process.exit(1);
      }
    }
    
    console.log(`   Tests: ${testDirectory}`);
    console.log(`   POM: ${pomDirectory}\n`);
  } else {
    // Fallback to hardcoded path
    testDirectory = 'C:\\OmegaAI-Mono\\Worklist-2\\playwright';
    pomDirectory = 'C:\\OmegaAI-Mono\\Worklist-2\\AutoSnap\\POM';
    console.log('⚠️  No repo_config.json found, using default paths\n');
  }
} catch (error) {
  console.error('❌ Error loading config:', error.message);
  testDirectory = 'C:\\OmegaAI-Mono\\Worklist-2\\playwright';
  pomDirectory = 'C:\\OmegaAI-Mono\\Worklist-2\\AutoSnap\\POM';
}

// Check if directory exists
if (!fs.existsSync(testDirectory)) {
  console.error(`❌ Test directory not found: ${testDirectory}`);
  if (useGitHubSync) {
    console.error('\n💡 Tip: Run "npm run sync-pom" to fetch files from GitHub');
  }
  process.exit(1);
}

console.log(`Scanning test directory: ${testDirectory}\n`);

const usedMethods = extractPOMUsage(testDirectory);

console.log('\n=== POM USAGE SUMMARY ===\n');

// Sort by page name for better readability
const sortedPages = Array.from(usedMethods.keys()).sort();

let totalMethods = 0;
for (const pageName of sortedPages) {
  const methods = Array.from(usedMethods.get(pageName)).sort();
  totalMethods += methods.length;
  console.log(`${pageName}: ${methods.length} methods`);
  methods.forEach(method => console.log(`  - ${method}`));
  console.log();
}

console.log(`\nTotal: ${sortedPages.length} pages, ${totalMethods} unique methods used\n`);

// Save to JSON file for easy reuse
const outputPath = path.join(__dirname, 'used_pom_methods.json');
const output = {};
usedMethods.forEach((methods, pageName) => {
  output[pageName] = Array.from(methods).sort();
});

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
console.log(`Saved to: ${outputPath}`);
