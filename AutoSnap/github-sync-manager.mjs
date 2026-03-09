import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * GitHub Sync Manager
 * 
 * Smart sync system that:
 * 1. Checks GitHub commit SHAs to detect changes
 * 2. Downloads test files in memory, extracts POM methods, discards tests
 * 3. Downloads and filters only required POM files
 * 4. Caches filtered POMs locally
 * 5. Only re-syncs when GitHub files change
 * 6. Supports both Personal Access Tokens and GitHub App authentication
 */
export class GitHubSyncManager {
  constructor(configPath = null) {
    this.configPath = configPath || path.join(__dirname, 'repo_config.json');
    this.config = this.loadConfig();
    this.cacheDir = path.join(__dirname, '.cache');
    this.filteredPOMDir = path.join(this.cacheDir, 'filtered-pom');
    this.metadataPath = path.join(this.cacheDir, 'sync-metadata.json');
    this.usedMethodsPath = path.join(__dirname, 'used_pom_methods.json');
    
    // Support both Personal Access Token and GitHub App authentication
    this.githubToken = null;
    this.useGitHubApp = false;
    
    // Ensure cache directories exist
    this.ensureDirectories();
  }

  /**
   * Generate JWT for GitHub App authentication
   *
   * We support both:
   * - GITHUB_APP_ID + GITHUB_PRIVATE_KEY    (AutoSnap default)
   * - GITHUB_APP_ID_DEV + GITHUB_PRIVATE_KEY1 (same as Azure Function setup)
   */
  generateJWT() {
    // Prefer DEV-style envs (same pattern as Azure Function), then fall back
    const appId =
      process.env.GITHUB_APP_ID_DEV ||
      process.env.GITHUB_APP_ID;

    let rawPrivateKey =
      process.env.GITHUB_PRIVATE_KEY1 ||
      process.env.GITHUB_PRIVATE_KEY ||
      '';

    // Trim and strip surrounding quotes if present (e.g. when stored as \"-----BEGIN...\")
    rawPrivateKey = rawPrivateKey.trim();
    if (rawPrivateKey.startsWith('"') && rawPrivateKey.endsWith('"')) {
      rawPrivateKey = rawPrivateKey.slice(1, -1);
    }
    // Some configs (copied from JSON) may end with a comma
    if (rawPrivateKey.endsWith(',')) {
      rawPrivateKey = rawPrivateKey.slice(0, -1);
    }

    const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
    
    if (!appId || !privateKey) {
      console.error('❌ Missing GitHub App credentials. Set GITHUB_APP_ID/GITHUB_APP_ID_DEV and GITHUB_PRIVATE_KEY/GITHUB_PRIVATE_KEY1.');
      return null;
    }
    
    const payload = {
      iat: Math.floor(Date.now() / 1000) - 60,
      exp: Math.floor(Date.now() / 1000) + 540,
      iss: appId
    };
    
    try {
      return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
    } catch (error) {
      console.error('❌ Failed to generate JWT:', error.message);
      return null;
    }
  }

  /**
   * Get installation token from GitHub App
   *
   * Strategy:
   * 1. Use the repo-specific installation for targetRepo (same as Azure Function).
   * 2. Fallback to GITHUB_INSTALLATION_ID env if set.
   */
  async getInstallationToken() {
    const jwtToken = this.generateJWT();
    if (!jwtToken) {
      return null;
    }

    const owner = this.config?.targetRepo?.owner;
    const repo = this.config?.targetRepo?.repo;

    let installationId = null;

    // Prefer the installation that is actually installed on the target repo
    if (owner && repo) {
      try {
        const url = `https://api.github.com/repos/${owner}/${repo}/installation`;
        const response = await axios.get(url, {
          headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'RamSoft-AutoSnap-Sync'
          }
        });

        installationId = response.data?.id;
        if (installationId) {
          console.log(`✅ Using installation ${installationId} for ${owner}/${repo}`);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          console.error(`❌ GitHub App is not installed on ${owner}/${repo} (404 from /repos/:owner/:repo/installation).`);
        } else {
          console.error('❌ Error while resolving repo installation:', error.response?.data || error.message);
        }
      }
    }

    // Fallback: explicit installation ID from env (e.g., user-level install)
    if (!installationId && process.env.GITHUB_INSTALLATION_ID) {
      installationId = process.env.GITHUB_INSTALLATION_ID;
      console.log(`⚠️ Falling back to GITHUB_INSTALLATION_ID=${installationId} from environment.`);
    }
    
    if (!installationId) {
      console.error('❌ No GitHub App installation found. Ensure the app is installed on the target repo or set GITHUB_INSTALLATION_ID.');
      return null;
    }
    
    try {
      const url = `https://api.github.com/app/installations/${installationId}/access_tokens`;
      const response = await axios.post(url, {}, {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'RamSoft-AutoSnap-Sync'
        }
      });
      
      return response.data.token;
    } catch (error) {
      console.error('❌ Failed to get installation token:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Initialize GitHub authentication (Personal Token or GitHub App)
   */
  async initializeAuth() {
    // Try Personal Access Token first
    this.githubToken = process.env.REPO_ACCESS_TOKEN || process.env.GITHUB_TOKEN || process.env[this.config.github?.tokenEnv || 'REPO_ACCESS_TOKEN'];
    
    if (this.githubToken) {
      console.log('✅ Using Personal Access Token authentication');
      this.useGitHubApp = false;
      return true;
    }
    
    // Try GitHub App authentication
    console.log('🔄 Attempting GitHub App authentication...');
    this.githubToken = await this.getInstallationToken();
    
    if (this.githubToken) {
      console.log('✅ Using GitHub App authentication');
      this.useGitHubApp = true;
      return true;
    }
    
    console.warn('⚠️  No authentication configured. API rate limits will be very restrictive (60/hour).');
    console.warn('    Set REPO_ACCESS_TOKEN (or GITHUB_TOKEN) or configure GitHub App (GITHUB_APP_ID, GITHUB_PRIVATE_KEY, GITHUB_INSTALLATION_ID)');
    return false;
  }

  /**
   * Load configuration from repo_config.json
   */
  loadConfig() {
    try {
      const configContent = fs.readFileSync(this.configPath, 'utf8');
      return JSON.parse(configContent);
    } catch (error) {
      console.error(`❌ Failed to load config from ${this.configPath}:`, error.message);
      throw error;
    }
  }

  /**
   * Ensure cache directories exist
   */
  ensureDirectories() {
    const dirs = [this.cacheDir, this.filteredPOMDir];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    }
  }

  /**
   * Get GitHub API headers with authentication
   */
  async getHeaders() {
    // Initialize auth if not already done
    if (this.githubToken === null) {
      await this.initializeAuth();
    }
    
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'RamSoft-AutoSnap-Sync'
    };
    
    if (this.githubToken) {
      headers['Authorization'] = `token ${this.githubToken}`;
    }
    
    return headers;
  }

  /**
   * Get the latest commit SHA for a specific path in the repository
   */
  async getCommitSHA(owner, repo, branch, filePath) {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/commits`;
      const headers = await this.getHeaders();
      const response = await axios.get(url, {
        headers,
        params: {
          sha: branch,
          path: filePath,
          per_page: 1
        }
      });
      
      if (response.data && response.data.length > 0) {
        return response.data[0].sha;
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Failed to get commit SHA for ${filePath}:`, error.message);
      if (error.response?.status === 403) {
        console.warn('⚠️  Rate limit may be exceeded. Consider using REPO_ACCESS_TOKEN (or GITHUB_TOKEN) or GitHub App.');
      }
      throw error;
    }
  }

  /**
   * Get cache metadata
   */
  getCacheMetadata() {
    try {
      if (fs.existsSync(this.metadataPath)) {
        return JSON.parse(fs.readFileSync(this.metadataPath, 'utf8'));
      }
    } catch (error) {
      console.warn('⚠️  Failed to read cache metadata:', error.message);
    }
    
    return {
      playwrightSHA: null,
      pomSHA: null,
      lastSync: null,
      methodsHash: null
    };
  }

  /**
   * Save cache metadata
   */
  saveCacheMetadata(metadata) {
    try {
      fs.writeFileSync(this.metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
      console.log('✅ Saved cache metadata');
    } catch (error) {
      console.error('❌ Failed to save cache metadata:', error.message);
    }
  }

  /**
   * Fetch file list from GitHub API (recursive for directories)
   */
  async fetchFileList(owner, repo, dirPath, branch) {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}`;
      const headers = await this.getHeaders();
      const response = await axios.get(url, {
        headers,
        params: { ref: branch }
      });
      
      const files = [];
      
      for (const item of response.data) {
        if (item.type === 'file' && item.name.endsWith('.spec.js')) {
          files.push({
            name: item.name,
            path: item.path,
            download_url: item.download_url,
            sha: item.sha
          });
        } else if (item.type === 'dir') {
          // Recursively fetch files from subdirectories
          const subFiles = await this.fetchFileList(owner, repo, item.path, branch);
          files.push(...subFiles);
        }
      }
      
      return files;
    } catch (error) {
      console.error(`❌ Failed to fetch file list from ${dirPath}:`, error.message);
      throw error;
    }
  }

  /**
   * Download file content from GitHub
   */
  async downloadFileContent(downloadUrl) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(downloadUrl, {
        headers
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to download file from ${downloadUrl}:`, error.message);
      throw error;
    }
  }

  /**
   * Stream-process test files in memory and extract POM method usage
   * Test files are never saved to disk!
   */
  async streamProcessTests(fileList) {
    console.log(`🔍 Processing ${fileList.length} test files in memory...`);
    const usedMethods = new Map();
    let processedCount = 0;
    
    for (const file of fileList) {
      try {
        // Download test content (stream, don't save)
        const content = await this.downloadFileContent(file.download_url);
        
        // Parse POM usage patterns on-the-fly
        const pomMethodPattern = /poManager\.([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*\(/g;
        let match;
        
        while ((match = pomMethodPattern.exec(content)) !== null) {
          const pageName = match[1];
          const methodName = match[2];
          
          if (!usedMethods.has(pageName)) {
            usedMethods.set(pageName, new Set());
          }
          usedMethods.get(pageName).add(methodName);
        }
        
        processedCount++;
        if (processedCount % 10 === 0) {
          console.log(`  Processed ${processedCount}/${fileList.length} test files...`);
        }
        
        // Content is garbage collected here - never written to disk!
      } catch (error) {
        console.warn(`⚠️  Failed to process ${file.name}:`, error.message);
      }
    }
    
    console.log(`✅ Processed ${processedCount} test files (in memory, discarded)`);
    return usedMethods;
  }

  /**
   * Calculate hash of method usage for change detection
   */
  calculateMethodsHash(usedMethods) {
    const methodsObj = {};
    usedMethods.forEach((methods, pageName) => {
      methodsObj[pageName] = Array.from(methods).sort();
    });
    
    const str = JSON.stringify(methodsObj);
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }

  /**
   * Save used methods to JSON file
   */
  saveUsedMethods(usedMethods) {
    const output = {};
    usedMethods.forEach((methods, pageName) => {
      output[pageName] = Array.from(methods).sort();
    });
    
    fs.writeFileSync(this.usedMethodsPath, JSON.stringify(output, null, 2), 'utf8');
    console.log(`✅ Saved used methods to: ${this.usedMethodsPath}`);
    
    return output;
  }

  /**
   * Load used methods from JSON file
   */
  loadUsedMethods() {
    try {
      if (fs.existsSync(this.usedMethodsPath)) {
        const content = fs.readFileSync(this.usedMethodsPath, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.warn('⚠️  Failed to load used methods:', error.message);
    }
    return null;
  }

  /**
   * Recursively fetch POM files from GitHub (including subdirectories)
   */
  async fetchPOMFileListRecursive(owner, repo, pomPath, branch, files = []) {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${pomPath}`;
      const headers = await this.getHeaders();
      const response = await axios.get(url, {
        headers,
        params: { ref: branch }
      });
      
      for (const item of response.data) {
        if (item.type === 'file' && item.name.endsWith('.js')) {
          // Flatten subdirectory paths: blumePage/blume.js -> blume.js
          const flattenedName = item.path.split('/').pop();
          
          files.push({
            name: flattenedName, // Use flattened name for storage
            originalPath: item.path, // Keep original path for download
            path: item.path,
            download_url: item.download_url,
            sha: item.sha
          });
        } else if (item.type === 'dir') {
          // Recursively fetch from subdirectories
          await this.fetchPOMFileListRecursive(owner, repo, item.path, branch, files);
        }
      }
      
      return files;
    } catch (error) {
      console.error(`❌ Failed to fetch POM file list from ${pomPath}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch POM file list from GitHub (wrapper for recursive function)
   */
  async fetchPOMFileList(owner, repo, pomPath, branch) {
    return await this.fetchPOMFileListRecursive(owner, repo, pomPath, branch);
  }

  /**
   * Filter POM content to only include used methods
   */
  filterPOMContent(content, pageName, usedMethods) {
    if (!usedMethods[pageName]) {
      console.warn(`⚠️  No used methods found for ${pageName}, keeping full POM`);
      return content;
    }
    
    const methods = usedMethods[pageName];
    const lines = content.split('\n');
    const filteredLines = [];
    let inTargetMethod = false;
    let braceCount = 0;
    let methodStartLine = -1;
    
    // Simple filtering: include class structure and only used methods
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Always include imports, class declaration, constructor
      if (line.includes('require(') || line.includes('import ') || 
          line.includes('class ') || line.includes('constructor(')) {
        filteredLines.push(line);
        continue;
      }
      
      // Check if this line starts a method we want to keep
      if (!inTargetMethod) {
        const methodMatch = line.match(/^\s*(async\s+)?([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{?/);
        if (methodMatch) {
          const methodName = methodMatch[2];
          if (methods.includes(methodName)) {
            inTargetMethod = true;
            methodStartLine = i;
            braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
            filteredLines.push(line);
            continue;
          }
        }
      }
      
      // If we're in a target method, track braces and include lines
      if (inTargetMethod) {
        filteredLines.push(line);
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;
        
        if (braceCount <= 0) {
          inTargetMethod = false;
        }
      }
      
      // Include closing brace and exports
      if (line.match(/^\s*\}\s*$/) || line.includes('module.exports') || line.includes('exports.')) {
        filteredLines.push(line);
      }
    }
    
    return filteredLines.join('\n');
  }

  /**
   * Convert CommonJS to ES modules for compatibility
   * Handles: module.exports, exports.X, require() -> import
   */
  convertCommonJSToESM(content, filename) {
    let converted = content;
    let hasChanges = false;
    
    // First, ensure we process ALL require statements, even in files that already have some ES module syntax
    // This handles mixed CommonJS/ES module files like common.js
    
    // Check if file has require statements - if it does, we need to convert them even if it has export statements
    const hasRequireStatements = /(?:const|let|var)\s+.*=\s*require\(/.test(converted);
    
    // Only skip if already pure ES modules (has export statements AND no require statements AND no module.exports)
    if (converted.includes('export ') && !hasRequireStatements && !converted.includes('module.exports') && !converted.includes('exports.')) {
      return converted;
    }
    
    // Convert exports.X = ... to export const X = ... or export class X
    // Match: exports.ClassName = class ClassName { or exports.functionName = function() {
    const exportsPattern = /exports\.(\w+)\s*=\s*(class|function|const|let|var)\s*(\w+)?/g;
    converted = converted.replace(exportsPattern, (match, exportName, keyword, className) => {
      hasChanges = true;
      if (keyword === 'class') {
        // exports.ApiWaitUtils = class ApiWaitUtils -> export class ApiWaitUtils
        return `export ${keyword} ${exportName}`;
      } else if (keyword === 'function') {
        return `export ${keyword} ${exportName}`;
      } else {
        return `export ${keyword} ${exportName}`;
      }
    });
    
    // Handle exports.X = ... without keyword (e.g., exports.X = Y)
    const exportsAssignmentPattern = /exports\.(\w+)\s*=\s*([^;,\n]+);?/g;
    converted = converted.replace(exportsAssignmentPattern, (match, exportName, value) => {
      // Skip if already handled by previous pattern or if it's module.exports
      if (match.includes('module.exports') || match.includes('class ') || match.includes('function ')) {
        return match;
      }
      hasChanges = true;
      const trimmed = value.trim();
      // If it's a class/function expression, convert to export
      if (trimmed.startsWith('class ') || trimmed.startsWith('function ')) {
        return `export ${trimmed}`;
      }
      // Otherwise, export const
      return `export const ${exportName} = ${trimmed};`;
    });
    
    // Convert module.exports = { X, Y } to export { X, Y }
    // But exclude items that are already exported as classes/functions
    const moduleExportsObjectPattern = /module\.exports\s*=\s*\{([^}]+)\}/s;
    const moduleExportsMatch = converted.match(moduleExportsObjectPattern);
    if (moduleExportsMatch) {
      hasChanges = true;
      // Find all exported class/function names that are already exported
      const alreadyExported = new Set();
      const classExportPattern = /export\s+(?:class|function|const|let|var)\s+(\w+)/g;
      let classMatch;
      while ((classMatch = classExportPattern.exec(converted)) !== null) {
        alreadyExported.add(classMatch[1]);
      }
      
      const exports = moduleExportsMatch[1]
        .split(',')
        .map(e => e.trim())
        .filter(e => e)
        .map(e => {
          // Handle X: Y or just X
          const parts = e.split(':').map(p => p.trim());
          const exportName = parts.length === 2 ? parts[0] : parts[0];
          // Skip if already exported as class/function
          if (alreadyExported.has(exportName)) {
            return null;
          }
          if (parts.length === 2) {
            return parts[0] === parts[1] ? parts[0] : `${parts[1]} as ${parts[0]}`;
          }
          return parts[0];
        })
        .filter(e => e !== null)
        .join(', ');
      
      if (exports) {
        converted = converted.replace(moduleExportsObjectPattern, `export { ${exports} }`);
      } else {
        // All exports are already exported, remove the module.exports line
        converted = converted.replace(moduleExportsObjectPattern, '');
      }
    }
    
    // Convert module.exports = ClassName to export default ClassName
    const moduleExportsDefaultPattern = /module\.exports\s*=\s*([^;,\n]+);?/g;
    converted = converted.replace(moduleExportsDefaultPattern, (match, exportValue) => {
      // Skip if it's already an object export (handled above)
      if (match.includes('{')) return match;
      hasChanges = true;
      const trimmed = exportValue.trim();
      // Check if it's a class/function name or a new expression
      if (/^[A-Z][a-zA-Z0-9_]*$/.test(trimmed) || trimmed.startsWith('new ')) {
        return `export default ${trimmed};`;
      }
      return `export default ${trimmed};`;
    });
    
    // Convert require() to import statements (at the top of the file)
    // First, collect all require statements from the converted content
    // (after exports conversion, as some requires might be in converted code)
    // Also check original content to ensure we don't miss any
    const requirePattern = /(?:const|let|var)\s+(\{?[^}]+\}?|\w+)\s*=\s*require\(['"]([^'"]+)['"]\)/g;
    const allRequires = [];
    
    // Reset regex lastIndex to ensure we check from the beginning
    requirePattern.lastIndex = 0;
    let requireMatch;
    // Use converted instead of content to catch requires after exports conversion
    while ((requireMatch = requirePattern.exec(converted)) !== null) {
      allRequires.push(requireMatch);
    }
    
    // Also check original content in case some requires weren't in converted yet
    requirePattern.lastIndex = 0;
    while ((requireMatch = requirePattern.exec(content)) !== null) {
      // Only add if not already in allRequires (avoid duplicates)
      const alreadyFound = allRequires.some(r => 
        r[1] === requireMatch[1] && r[2] === requireMatch[2]
      );
      if (!alreadyFound) {
        allRequires.push(requireMatch);
      }
    }
    
    const importMap = new Map();
    const problematicPackages = ['cypress', '@rs-core/fhir'];
    
    // Process all requires and build import map
    for (const requireMatch of allRequires) {
      const [fullMatch, importSpec, modulePath] = requireMatch;
      // Skip problematic packages
      if (problematicPackages.some(pkg => modulePath === pkg || modulePath.startsWith(pkg + '/'))) {
        continue; // These are handled by fixESModuleImports
      }
      
      // Extract variable names from destructured imports
      const isDestructured = importSpec.includes('{');
      let importNames = [];
      if (isDestructured) {
        const destructured = importSpec.match(/\{([^}]+)\}/);
        if (destructured) {
          importNames = destructured[1].split(',').map(n => {
            const parts = n.trim().split(':').map(p => p.trim());
            return parts.length === 2 ? parts[1] : parts[0];
          });
        }
      } else {
        importNames = [importSpec.trim()];
      }
      
      // Store import info - keep the original importSpec for the import statement
      if (!importMap.has(modulePath)) {
        importMap.set(modulePath, { names: new Set(), importSpec: importSpec });
      }
      importNames.forEach(name => importMap.get(modulePath).names.add(name));
      // Update importSpec if we have a better one (destructured vs simple)
      if (isDestructured && !importMap.get(modulePath).importSpec.includes('{')) {
        importMap.get(modulePath).importSpec = importSpec;
      }
      
      hasChanges = true;
    }
    
    // Remove require statements FIRST, then build and add import statements
    if (importMap.size > 0) {
      // Remove all require statements that we're converting using robust regex replacement
      const problematicPackages = ['cypress', '@rs-core/fhir'];
      
      // Build a regex pattern that matches all require statements we're converting
      // This handles single-line requires with proper escaping
      // Use a more aggressive pattern that matches requires even if they're on separate lines or have different spacing
      const requireRemovalPattern = /(?:const|let|var)\s+(\{?[^}]+\}?|\w+)\s*=\s*require\(['"]([^'"]+)['"]\)\s*;?\s*/g;
      
      // First pass: remove requires that are in our importMap
      converted = converted.replace(requireRemovalPattern, (match, importSpec, modulePath) => {
        // Skip problematic packages - these are handled by fixESModuleImports
        if (problematicPackages.some(pkg => modulePath === pkg || modulePath.startsWith(pkg + '/'))) {
          return match; // Keep problematic packages as-is
        }
        // Check if this require is in our importMap (meaning we're converting it)
        if (importMap.has(modulePath)) {
          return ''; // Remove the entire require statement
        }
        return match; // Keep if not in our conversion list
      });
      
      // Second pass: remove any remaining require statements for common Node.js modules
      // This catches requires that might have been missed in the first pass or added later
      // Remove requires for fs, path, faker, playwright.config if imports exist or will be added
      const commonModules = ['fs', 'path', 'faker', 'playwright.config', '../../playwright.config'];
      const remainingRequirePattern = /(?:const|let|var)\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\)\s*;?\s*/g;
      converted = converted.replace(remainingRequirePattern, (match, varName, modulePath) => {
        // Check if this is a common module that should be imported
        const isCommonModule = commonModules.some(mod => 
          modulePath === mod || modulePath.includes(mod) || modulePath.endsWith('/' + mod)
        );
        if (isCommonModule) {
          // Remove if we already have an import, or if it's a common Node.js module (fs, path)
          if (converted.match(new RegExp(`import.*\\b${varName}\\b.*from`, 'i')) || 
              modulePath === 'fs' || modulePath === 'path') {
            return ''; // Remove duplicate or redundant require
          }
        }
        return match; // Keep if not a common module or no import exists
      });
      
      // Now build import statements
      const importStatements = [];
      for (const [modulePath, importInfo] of importMap.entries()) {
        const names = importInfo.names;
        const importSpec = importInfo.importSpec;
        
        // Debug: Log what we're processing
        if (filename === 'common.js') {
          console.log(`  🔍 Processing ${modulePath} with importSpec: ${importSpec}, names: ${Array.from(names).join(', ')}`);
        }
        // Add .js extension to relative imports (required for ES modules)
        let normalizedPath = modulePath;
        if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
          // Remove existing extension if any, then add .js
          normalizedPath = modulePath.replace(/\.(js|ts|jsx|tsx)$/, '') + '.js';
          
          // Detect external config files that go outside the cache directory
          // These need to be stubbed (e.g., ../../playwright.config.js)
          const isExternalConfig = normalizedPath.startsWith('../') && 
                                   (normalizedPath.includes('playwright.config') || 
                                    normalizedPath.includes('config.'));
          
          if (isExternalConfig) {
            // Extract just the filename for external configs
            // These will be stubbed in copyStubFiles()
            const pathParts = normalizedPath.split('/');
            const filename = pathParts[pathParts.length - 1];
            normalizedPath = './' + filename;
          } else {
            // Flatten subdirectory paths (e.g., ./blumePage/blume.js -> ./blume.js)
            // Since we store all files flat in filtered-pom/, we need to extract just the filename
            if (normalizedPath.includes('/')) {
              const pathParts = normalizedPath.split('/');
              const filename = pathParts[pathParts.length - 1];
              normalizedPath = './' + filename;
            }
            
            // Handle external dependencies (../APIutils/APIRequests -> ../APIutils/APIRequests.js)
            // These should point to the stub files we created
            if (normalizedPath.startsWith('../')) {
              // Keep the path as-is but ensure .js extension
              // The stub files are in .cache/APIutils/ and .cache/generators/
            }
          }
        }
        
        // Use the original importSpec if it was destructured, otherwise build from names
        if (importSpec.includes('{')) {
          // Destructured: const { x, y } = require(...) -> import { x, y } from ...
          importStatements.push(`import ${importSpec} from '${normalizedPath}';`);
        } else {
          // Simple import: const x = require(...) -> import x from ...
          // Use the original importSpec (variable name) directly as default import
          importStatements.push(`import ${importSpec} from '${normalizedPath}';`);
        }
      }
      
      // Find the insertion point and check for existing imports to avoid duplicates
      const finalLines = converted.split('\n');
      let insertIndex = 0;
      const existingImports = new Set();
      
      // First pass: find existing imports and their insertion point
      for (let i = 0; i < finalLines.length; i++) {
        const line = finalLines[i].trim();
        
        // Track existing imports to avoid duplicates
        if (line.startsWith('import ')) {
          // Extract the import path to check for duplicates
          const importMatch = line.match(/import\s+[^'"]*from\s+['"]([^'"]+)['"]/);
          if (importMatch) {
            existingImports.add(importMatch[1]);
          }
          // Continue past imports to find where to insert new ones
          continue;
        }
        
        // Skip comments and empty lines
        if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
          continue;
        }
        
        // Found the first non-comment, non-import line - insert before this
        insertIndex = i;
        break;
      }
      
      // Filter out imports that already exist
      const newImportStatements = importStatements.filter(importStmt => {
        const importMatch = importStmt.match(/from\s+['"]([^'"]+)['"]/);
        if (importMatch) {
          const importPath = importMatch[1];
          if (existingImports.has(importPath)) {
            return false; // Skip duplicate
          }
          existingImports.add(importPath); // Track as added
        }
        return true;
      });
      
      // Insert new imports if any
      if (newImportStatements.length > 0) {
        finalLines.splice(insertIndex, 0, ...newImportStatements);
        converted = finalLines.join('\n');
      }
    }
    
    // Clean up malformed imports and orphaned strings (leftover from previous broken conversions)
    // Remove malformed import statements with require
    converted = converted.replace(/import\s+\w+\s*=\s*require\([^)]+\)/g, '');
    converted = converted.replace(/import\s+\{[^}]*=\s*require\([^)]+\)/g, '');
    // Remove incomplete const/let/var statements with from (malformed imports)
    converted = converted.replace(/const\s+\{[^}]*\}\s+from\s+[^;]+;?/g, '');
    converted = converted.replace(/const\s+\w+\s*\}\s+from\s+[^;]+;?/g, '');
    converted = converted.replace(/const\s+\w+\s+from\s+[^;]+;?/g, ''); // Remove "const x from ..." (malformed)
    converted = converted.replace(/let\s+\w+\s+from\s+[^;]+;?/g, ''); // Remove "let x from ..." (malformed)
    converted = converted.replace(/var\s+\w+\s+from\s+[^;]+;?/g, ''); // Remove "var x from ..." (malformed)
    
    // Aggressive cleanup: Remove any remaining require statements for common modules if imports exist
    // This catches requires that weren't removed in the main conversion step
    // Remove requires for fs if import fs exists
    if (converted.match(/import.*\bfs\b.*from/i)) {
      converted = converted.replace(/(?:const|let|var)\s+\w+\s*=\s*require\(['"]fs['"]\)\s*;?\s*/g, '');
    }
    // Remove requires for path if import path exists
    if (converted.match(/import.*\bpath\b.*from/i)) {
      converted = converted.replace(/(?:const|let|var)\s+\w+\s*=\s*require\(['"]path['"]\)\s*;?\s*/g, '');
    }
    // Remove requires for faker if import faker exists
    if (converted.match(/import.*\bfaker\b.*from/i)) {
      converted = converted.replace(/(?:const|let|var)\s+\w+\s*=\s*require\(['"]@?faker[^'"]*['"]\)\s*;?\s*/g, '');
    }
    
    // Remove orphaned string literals that are module paths (standalone module path strings)
    converted = converted.replace(/^['"]@[^'"]+['"];?\s*$/gm, '');
    converted = converted.replace(/^['"][./][^'"]+['"];?\s*$/gm, '');
    
    // Remove lines with just = or = ; (orphaned assignment operators)
    converted = converted.replace(/^\s*=\s*;?\s*$/gm, '');
    converted = converted.replace(/^\s*=\s*require\([^)]+\)\s*;?\s*$/gm, '');
    
    // Remove orphaned variable declarations (const/let/var x = ; or const/let/var x =)
    // Handle various whitespace patterns
    converted = converted.replace(/^\s*(const|let|var)\s+\w+\s*=\s*;?\s*$/gm, '');
    converted = converted.replace(/^\s*(const|let|var)\s+\{[^}]*\}\s*=\s*;?\s*$/gm, '');
    // Handle cases with trailing semicolons or whitespace
    converted = converted.replace(/^\s*(const|let|var)\s+\w+\s*=\s*;?\s*;?\s*$/gm, '');
    
    // Clean up empty lines, trailing semicolons, and orphaned semicolons from removed requires
    converted = converted.replace(/\n\s*\n\s*\n/g, '\n\n');
    // Remove lines that are just semicolons (leftover from require removal)
    converted = converted.replace(/^\s*;\s*$/gm, '');
    // Clean up multiple consecutive empty lines
    converted = converted.replace(/\n{3,}/g, '\n\n');
    
    // Fix ALL ES module imports to ensure they have .js extensions
    // This runs after CommonJS conversion to catch all imports (including import *, import { }, import default)
    converted = converted.replace(/import\s+[^'"]*from\s+['"](\.\.?\/[^'"]+?)['"]/g, (match, importPath) => {
      // Remove any existing extension
      let normalizedPath = importPath.replace(/\.(js|ts|jsx|tsx)$/, '');
      
      // Add .js extension
      normalizedPath = normalizedPath + '.js';
      
      // Flatten subdirectory paths: ./subdir/file.js -> ./file.js
      if (normalizedPath.includes('/') && !normalizedPath.startsWith('../')) {
        const pathParts = normalizedPath.split('/');
        normalizedPath = './' + pathParts[pathParts.length - 1];
      } 
      // Handle ../ paths - flatten to ./ for POM files
      else if (normalizedPath.startsWith('../')) {
        // ../timeouts.js or ../something.js -> ./something.js
        normalizedPath = normalizedPath.replace(/^\.\.\//, './');
        // If still has subdirectory, flatten
        if (normalizedPath.includes('/') && normalizedPath !== './') {
          const pathParts = normalizedPath.split('/');
          normalizedPath = './' + pathParts[pathParts.length - 1];
        }
      }
      
      return match.replace(importPath, normalizedPath);
    });
    
    // Also mark as changed if we fixed any imports (even if no CommonJS conversion happened)
    if (converted !== content && !hasChanges) {
      // Check if we actually made import changes
      const originalImports = content.match(/import\s+[^'"]*from\s+['"](\.\.?\/[^'"]+?)['"]/g) || [];
      const fixedImports = converted.match(/import\s+[^'"]*from\s+['"](\.\.?\/[^'"]+?\.js)['"]/g) || [];
      if (fixedImports.length > 0 && fixedImports.length >= originalImports.length) {
        console.log(`  🔄 Fixed ES module imports in ${filename}`);
      }
    }
    
    if (hasChanges) {
      console.log(`  🔄 Converted ${filename} from CommonJS to ES modules`);
    }
    
    // Post-processing: Detect and add missing imports for commonly used variables
    // This handles cases where require statements might have been in a different format
    const missingImports = [];
    const lines = converted.split('\n');
    
    // Get all existing import statements to avoid duplicates - check actual import variable names
    const hasImport = (varName) => {
      // Check for default imports: import varName from ...
      if (converted.match(new RegExp(`import\\s+${varName}\\s+from`, 'i'))) return true;
      // Check for named imports: import { varName } from ... or import { ... as varName } from ...
      if (converted.match(new RegExp(`import\\s+[^'"]*\\b${varName}\\b[^'"]*from`, 'i'))) return true;
      // Check for namespace imports: import * as varName from ...
      if (converted.match(new RegExp(`import\\s+\\*\\s+as\\s+${varName}\\s+from`, 'i'))) return true;
      return false;
    };
    
    // Check for common Node.js/POM dependencies that are used but not imported
    if (converted.includes('playwrightConfig') && !hasImport('playwrightConfig') && converted.match(/playwrightConfig\./)) {
      missingImports.push("import playwrightConfig from './playwright.config.js';");
    }
    if (converted.includes('faker.') && !hasImport('faker')) {
      missingImports.push("import { faker } from '@faker-js/faker';");
    }
    if ((converted.includes('fs.writeFileSync') || converted.includes('fs.readFileSync') || converted.includes('fs.existsSync') || converted.match(/\bfs\s*\./)) && !hasImport('fs')) {
      missingImports.push("import fs from 'fs';");
    }
    if ((converted.includes('path.join') || converted.includes('path.resolve') || converted.includes('path.dirname') || converted.match(/\bpath\s*\./)) && !hasImport('path')) {
      missingImports.push("import path from 'path';");
    }
    
    // Add missing imports if any were detected
    if (missingImports.length > 0) {
      // Find insertion point (after existing imports, before other code)
      let insertIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('import ')) {
          insertIndex = i + 1;
          continue;
        }
        if (line && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*')) {
          break;
        }
      }
      lines.splice(insertIndex, 0, ...missingImports);
      converted = lines.join('\n');
      hasChanges = true;
      console.log(`  🔧 Added ${missingImports.length} missing import(s) to ${filename}`);
    }
    
    // Final cleanup pass: Remove ALL remaining require() statements for common modules
    // This runs AFTER post-processing to catch any requires that were missed
    // Remove requires if: (1) import exists, OR (2) variable is used, OR (3) it's a common module (fs/path)
    const finalCleanupPatterns = [
      // fs and path: always remove if import exists (they're Node.js built-ins)
      { requirePattern: /(?:const|let|var)\s+fs\s*=\s*require\s*\(\s*['"]fs['"]\s*\)\s*;?\s*/g, shouldRemove: () => converted.match(/import.*\bfs\b.*from/i) },
      { requirePattern: /(?:const|let|var)\s+path\s*=\s*require\s*\(\s*['"]path['"]\s*\)\s*;?\s*/g, shouldRemove: () => converted.match(/import.*\bpath\b.*from/i) },
      // faker: remove if import exists or variable is used
      { requirePattern: /(?:const|let|var)\s+\w+\s*=\s*require\s*\(\s*['"]@?faker[^'"]*['"]\s*\)\s*;?\s*/g, shouldRemove: () => converted.match(/import.*\bfaker\b.*from/i) || converted.match(/\bfaker\s*\./) },
      // playwrightConfig: remove if import exists, variable is used, OR if it's the variable name
      { requirePattern: /(?:const|let|var)\s+playwrightConfig\s*=\s*require\s*\([^)]+\)\s*;?\s*/g, shouldRemove: () => converted.match(/import.*\bplaywrightConfig\b.*from/i) || converted.match(/\bplaywrightConfig\s*\./) || true } // Always remove unused playwrightConfig requires
    ];
    
    for (const { requirePattern, shouldRemove } of finalCleanupPatterns) {
      if (shouldRemove()) {
        const before = converted;
        converted = converted.replace(requirePattern, '');
        if (converted !== before) {
          hasChanges = true;
        }
      }
    }
    
    // Final validation: check for any remaining require() patterns
    const remainingRequires = converted.match(/(?:const|let|var)\s+.*=\s*require\(/g);
    if (remainingRequires && remainingRequires.length > 0) {
      // Filter out problematic packages that are intentionally left as require
      const problematicPackages = ['cypress', '@rs-core/fhir'];
      const problematicRequires = remainingRequires.filter(req => {
        const match = converted.match(new RegExp(req.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "['\"]([^'\"]+)['\"]"));
        if (match) {
          const modulePath = match[1];
          return problematicPackages.some(pkg => modulePath === pkg || modulePath.startsWith(pkg + '/'));
        }
        return false;
      });
      
      const unconvertedRequires = remainingRequires.length - problematicRequires.length;
      if (unconvertedRequires > 0) {
        console.warn(`  ⚠️  Warning: ${filename} still contains ${unconvertedRequires} require() statement(s) that were not converted`);
      }
    }
    
    return converted;
  }
  
  /**
   * Fix ES module imports to ensure they all have .js extensions
   * This runs on ALL files, regardless of whether they were converted from CommonJS
   */
  fixESModuleImports(content, filename) {
    let fixed = content;
    let hasChanges = false;
    
    // First, handle external package imports that should be commented out or removed
    // Known problematic packages: cypress, @rs-core/fhir (not available in this environment)
    const externalPackagesToRemove = ['cypress', '@rs-core/fhir'];
    for (const pkg of externalPackagesToRemove) {
      const externalImportPattern = new RegExp(`import\\s+[^'"]*from\\s+['"]${pkg}[^'"]*['"];?`, 'g');
      if (externalImportPattern.test(fixed)) {
        hasChanges = true;
        fixed = fixed.replace(externalImportPattern, (match) => {
          // Comment out the import and add a stub function if needed
          const importMatch = match.match(/import\s+\{([^}]+)\}\s+from/);
          if (importMatch) {
            const imports = importMatch[1].split(',').map(i => i.trim());
            const stubs = imports.map(imp => {
              const name = imp.split(' as ')[0].trim();
              return `// Stub for ${name} (external package ${pkg} not available)\nfunction ${name}() { return null; }`;
            }).join('\n');
            return `// ${match.trim()}\n${stubs}`;
          }
          return `// ${match.trim()}`;
        });
      }
    }
    
    // Fix ALL ES module imports (import *, import { }, import default)
    fixed = fixed.replace(/import\s+[^'"]*from\s+['"](\.\.?\/[^'"]+?)['"]/g, (match, importPath) => {
      // Skip if already has .js extension
      if (importPath.endsWith('.js')) {
        return match;
      }
      
      hasChanges = true;
      
      // Remove any existing extension and add .js
      let normalizedPath = importPath.replace(/\.(ts|jsx|tsx)$/, '') + '.js';
      
      // Flatten subdirectory paths: ./subdir/file.js -> ./file.js
      if (normalizedPath.includes('/') && !normalizedPath.startsWith('../')) {
        const pathParts = normalizedPath.split('/');
        normalizedPath = './' + pathParts[pathParts.length - 1];
      } 
      // Handle ../ paths - flatten to ./ for POM files
      else if (normalizedPath.startsWith('../')) {
        normalizedPath = normalizedPath.replace(/^\.\.\//, './');
        // If still has subdirectory, flatten
        if (normalizedPath.includes('/') && normalizedPath !== './') {
          const pathParts = normalizedPath.split('/');
          normalizedPath = './' + pathParts[pathParts.length - 1];
        }
      }
      
      return match.replace(importPath, normalizedPath);
    });
    
    if (hasChanges) {
      console.log(`  🔧 Fixed ES module imports in ${filename}`);
    }
    
    return fixed;
  }

  /**
   * Extract required files from POM content (recursively finds all dependencies)
   * Handles both subdirectory paths (flattened) and same-directory imports
   */
  extractPOMDependencies(content, baseDir = '') {
    const dependencies = new Set();
    
    // Match require('./filename') or require('./path/filename') or require('../path/filename')
    const requireRegex = /require\(['"](\.\.?\/[^'"]+)['"]\)/g;
    let match;
    while ((match = requireRegex.exec(content)) !== null) {
      let depPath = match[1];
      // Handle relative paths
      if (depPath.startsWith('./')) {
        depPath = depPath.replace(/^\.\//, '');
        const normalized = depPath.replace(/\\/g, '/');
        const parts = normalized.split('/');
        // Extract filename (last part) - this handles both ./file.js and ./subdir/file.js
        const filename = parts[parts.length - 1].replace(/\.(js|ts|jsx|tsx)$/, '');
        // Add the flattened filename (subdirectory files are stored with just filename)
        dependencies.add(filename);
      } else if (depPath.startsWith('../')) {
        // External dependency (like ../APIutils/...)
        // We'll handle these separately with stubs
      }
    }
    
    // Also match import statements
    const importRegex = /import\s+.*from\s+['"](\.\.?\/[^'"]+)['"]/g;
    while ((match = importRegex.exec(content)) !== null) {
      let depPath = match[1];
      if (depPath.startsWith('./')) {
        depPath = depPath.replace(/^\.\//, '');
        const normalized = depPath.replace(/\\/g, '/');
        const parts = normalized.split('/');
        // Extract filename (last part) and remove extension
        const filename = parts[parts.length - 1].replace(/\.(js|ts|jsx|tsx)$/, '');
        dependencies.add(filename);
      }
    }
    
    return dependencies;
  }

  /**
   * Extract required files from POManager.js and all POM files (recursive)
   */
  async extractAllPOMDependencies(pomFiles, usedMethods) {
    const allDependencies = new Set();
    const processedFiles = new Set();
    
    // Start with POManager.js
    const pomManagerFile = pomFiles.find(f => f.name === 'POManager.js');
    if (pomManagerFile) {
      try {
        const content = await this.downloadFileContent(pomManagerFile.download_url);
        const deps = this.extractPOMDependencies(content);
        deps.forEach(dep => allDependencies.add(dep));
        processedFiles.add('POManager.js');
      } catch (error) {
        console.warn(`⚠️  Failed to analyze POManager.js:`, error.message);
      }
    }
    
    // Recursively process all dependencies
    let changed = true;
    while (changed) {
      changed = false;
      for (const file of pomFiles) {
        const pageName = file.name.replace('.js', '');
        // If this file is a dependency or used, process it
        if (allDependencies.has(pageName) || allDependencies.has(file.name) || usedMethods[pageName]) {
          if (!processedFiles.has(file.name)) {
            try {
              const content = await this.downloadFileContent(file.download_url);
              const deps = this.extractPOMDependencies(content);
              const beforeSize = allDependencies.size;
              deps.forEach(dep => allDependencies.add(dep));
              if (allDependencies.size > beforeSize) {
                changed = true;
              }
              processedFiles.add(file.name);
            } catch (error) {
              console.warn(`⚠️  Failed to analyze ${file.name}:`, error.message);
            }
          }
        }
      }
    }
    
    return allDependencies;
  }

  /**
   * Download and filter POM files
   */
  async downloadAndFilterPOMs(pomFiles, usedMethods) {
    console.log(`📥 Downloading and filtering ${pomFiles.length} POM files...`);
    let processedCount = 0;
    
    // Extract all dependencies recursively (POM files that other POM files require)
    console.log(`  🔍 Analyzing POM dependencies...`);
    const allDependencies = await this.extractAllPOMDependencies(pomFiles, usedMethods);
    console.log(`  📋 Found ${allDependencies.size} POM file dependencies: ${Array.from(allDependencies).slice(0, 10).join(', ')}${allDependencies.size > 10 ? '...' : ''}`);
    
    for (const file of pomFiles) {
      try {
        const pageName = file.name.replace('.js', '');
        
        // POManager.js is always required (main entry point)
        const isPOManager = file.name === 'POManager.js';
        
        // Also include files required by other POM files (even if not used in tests)
        const isPOMDependency = allDependencies.has(pageName) || 
                               allDependencies.has(file.name.replace('.js', ''));
        
        // Only download if this page is used, is POManager.js, or is required by other POM files
        if (!isPOManager && !isPOMDependency && !usedMethods[pageName]) {
          console.log(`  ⏭️  Skipping ${file.name} (not used in tests)`);
          continue;
        }
        
        const content = await this.downloadFileContent(file.download_url);
        
        // POManager.js and its dependencies are not filtered (they're required for the class to work)
        let finalContent = content;
        if (!isPOManager && !isPOMDependency && usedMethods[pageName]) {
          finalContent = this.filterPOMContent(content, pageName, usedMethods);
        }
        
        // Convert CommonJS to ES modules for compatibility
        // This also fixes existing ES module imports to have .js extensions
        finalContent = this.convertCommonJSToESM(finalContent, file.name);
        
        // Always ensure all imports have .js extensions (even if file wasn't converted)
        finalContent = this.fixESModuleImports(finalContent, file.name);
        
        const outputPath = path.join(this.filteredPOMDir, file.name);
        fs.writeFileSync(outputPath, finalContent, 'utf8');
        
        processedCount++;
        if (isPOManager) {
          console.log(`  ✅ Saved ${file.name} (required entry point)`);
        } else if (isPOMDependency) {
          console.log(`  ✅ Saved ${file.name} (required by other POM files)`);
        } else {
          console.log(`  ✅ Filtered ${file.name} (${usedMethods[pageName].length} methods)`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to process ${file.name}:`, error.message);
      }
    }
    
    console.log(`✅ Saved ${processedCount} filtered POM files to: ${this.filteredPOMDir}`);
    
    // Copy stub files for external dependencies to filtered-pom directory
    // (since imports are flattened to ./filename.js)
    this.copyStubFiles();
    
    // Post-process files to fix common syntax issues
    this.postProcessPOMFiles();
  }
  
  /**
   * Copy stub files for external dependencies to filtered-pom directory
   */
  copyStubFiles() {
    const stubFiles = [
      { src: path.join(this.cacheDir, 'APIutils', 'APIRequests.js'), dest: 'APIRequests.js' },
      { src: path.join(this.cacheDir, 'APIutils', 'postStudyNGetToken.js'), dest: 'postStudyNGetToken.js' },
      { src: path.join(this.cacheDir, 'generators', 'coverageGenerator.js'), dest: 'coverageGenerator.js' },
      { src: path.join(this.cacheDir, 'generators', 'organizationGenerator.js'), dest: 'organizationGenerator.js' },
      { src: path.join(this.cacheDir, 'dataObjects', 'patientDO.js'), dest: 'patientDO.js' }
    ];
    
    for (const stub of stubFiles) {
      if (fs.existsSync(stub.src)) {
        const destPath = path.join(this.filteredPOMDir, stub.dest);
        fs.copyFileSync(stub.src, destPath);
        console.log(`  📋 Copied stub: ${stub.dest}`);
      }
    }
    
    // Create stub for playwright.config.js if it doesn't exist
    // This is needed for files that import ../../playwright.config.js
    const playwrightConfigStub = path.join(this.filteredPOMDir, 'playwright.config.js');
    if (!fs.existsSync(playwrightConfigStub)) {
      const stubContent = `// Stub for playwright.config.js (external config file)
// This file is auto-generated to support POM files that import the Playwright config
export default {
  mailsacAPIKey1: process.env.MAILSAC_API_KEY_1 || '',
  mailsacAPIKey2: process.env.MAILSAC_API_KEY_2 || '',
  mailsacAPIKey3: process.env.MAILSAC_API_KEY_3 || '',
  mailsacAPIKey4: process.env.MAILSAC_API_KEY_4 || '',
  mailsacAPIKey5: process.env.MAILSAC_API_KEY_5 || '',
  mailsacAPIKey6: process.env.MAILSAC_API_KEY_6 || '',
  baseApiUrl: process.env.BASE_API_URL || process.env.APPLICATION_URL || 'https://pre-us01.omegaai.com/',
  aiConfig: {}
};
`;
      fs.writeFileSync(playwrightConfigStub, stubContent, 'utf8');
      console.log(`  📋 Created stub: playwright.config.js`);
    }
    
    // Always update playwright.config.js stub to ensure baseApiUrl is present
    if (fs.existsSync(playwrightConfigStub)) {
      let existingContent = fs.readFileSync(playwrightConfigStub, 'utf8');
      if (!existingContent.includes('baseApiUrl')) {
        // Update existing stub to include baseApiUrl
        existingContent = existingContent.replace(
          /(mailsacAPIKey6: process\.env\.MAILSAC_API_KEY_6 \|\| '',)/,
          `$1\n  baseApiUrl: process.env.BASE_API_URL || process.env.APPLICATION_URL || 'https://pre-us01.omegaai.com/',`
        );
        fs.writeFileSync(playwrightConfigStub, existingContent, 'utf8');
        console.log(`  🔧 Updated stub: playwright.config.js (added baseApiUrl)`);
      }
    }
  }

  /**
   * Post-process POM files to fix common syntax issues and import errors
   */
  postProcessPOMFiles() {
    console.log(`\n🔧 Post-processing POM files to fix syntax issues...`);
    
    const files = fs.readdirSync(this.filteredPOMDir).filter(f => f.endsWith('.js'));
    let fixedCount = 0;
    
    for (const filename of files) {
      const filePath = path.join(this.filteredPOMDir, filename);
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      let hasChanges = false;
      
      // Fix 1: Malformed import statements (e.g., "import months = [" -> "const months = [")
      const malformedImportPattern = /^(\s*)import\s+(\w+)\s*=\s*\[/gm;
      if (malformedImportPattern.test(content)) {
        content = content.replace(malformedImportPattern, '$1const $2 = [');
        hasChanges = true;
      }
      
      // Fix 2: Convert arrow function class methods to regular methods
      // Pattern: methodName = (params) => { ... };
      const arrowMethodPattern = /^(\s+)(\w+)\s*=\s*\(([^)]*)\)\s*=>\s*\{/gm;
      if (arrowMethodPattern.test(content)) {
        content = content.replace(arrowMethodPattern, '$1$2($3) {');
        // Also fix the closing semicolon
        content = content.replace(/^(\s+)\};\s*$/gm, '$1}');
        hasChanges = true;
      }
      
      // Fix 2b: Remove trailing semicolon after class closing brace (e.g., "};" -> "}")
      // This fixes classes that end with }; instead of }
      if (content.match(/^export class \w+[\s\S]*\};\s*$/m)) {
        content = content.replace(/^(\s*export class \w+[\s\S]*?)\};\s*$/m, '$1}');
        hasChanges = true;
      }
      
      // Fix 3: Fix incorrect timeout imports from common.js
      // Change imports like "import { TIMEOUT_IN_MSEC2 } from './common.js';" to timeouts.js
      if (content.includes("TIMEOUT_IN_MSEC") && content.includes("from './common.js'")) {
        content = content.replace(
          /import\s+\{([^}]*TIMEOUT_IN_MSEC[^}]*)\}\s+from\s+['"]\.\/common\.js['"];?/g,
          (match, imports) => {
            // Remove TIMEOUT constants from common.js import and add separate timeouts.js import
            const timeoutImports = imports.split(',').filter(i => i.includes('TIMEOUT')).map(i => i.trim()).join(', ');
            const otherImports = imports.split(',').filter(i => !i.includes('TIMEOUT')).map(i => i.trim()).join(', ');
            let result = '';
            if (timeoutImports) {
              result += `import { ${timeoutImports} } from './timeouts.js';\n`;
            }
            if (otherImports) {
              result += `import { ${otherImports} } from './common.js';`;
            }
            return result.trim();
          }
        );
        hasChanges = true;
      }
      
      // Fix 4: Fix incorrect imports of 'common' from timeouts.js
      // Change "import { TIMEOUT_IN_MSEC1, TIMEOUT_IN_MSEC2, common } from './timeouts.js';"
      // to separate imports
      if (content.includes("common") && content.includes("from './timeouts.js'")) {
        content = content.replace(
          /import\s+\{([^}]*),\s*common\s*([^}]*)\}\s+from\s+['"]\.\/timeouts\.js['"];?/g,
          (match, before, after) => {
            const timeoutImports = (before + after).split(',').filter(i => i.includes('TIMEOUT')).map(i => i.trim()).join(', ');
            return `import { ${timeoutImports} } from './timeouts.js';\nimport { Common } from './common.js';`;
          }
        );
        // Also handle case where common is first
        content = content.replace(
          /import\s+\{\s*common\s*,([^}]*)\}\s+from\s+['"]\.\/timeouts\.js['"];?/g,
          (match, rest) => {
            const timeoutImports = rest.split(',').filter(i => i.includes('TIMEOUT')).map(i => i.trim()).join(', ');
            return `import { ${timeoutImports} } from './timeouts.js';\nimport { Common } from './common.js';`;
          }
        );
        hasChanges = true;
      }
      
      // Fix 5: Add missing ApiWaitUtils import if used but not imported
      // Check if ApiWaitUtils is used (new ApiWaitUtils or this.apiWaitUtils) but not imported
      const usesApiWaitUtils = content.includes('new ApiWaitUtils') || 
                               content.includes('this.apiWaitUtils') ||
                               content.match(/\bApiWaitUtils\b/);
      const hasApiWaitUtilsImport = content.match(/import.*ApiWaitUtils.*from/i);
      
      if (usesApiWaitUtils && !hasApiWaitUtilsImport) {
        // Find the import section and add ApiWaitUtils import
        const lines = content.split('\n');
        let lastImportIndex = -1;
        let foundImportSection = false;
        
        // Find the last import statement
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('import ')) {
            lastImportIndex = i;
            foundImportSection = true;
          } else if (foundImportSection && line && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*')) {
            // We've passed the import section
            break;
          }
        }
        
        if (lastImportIndex >= 0) {
          // Check if apiWaitUtils.js is already imported (to avoid duplicates)
          const hasApiWaitUtilsFileImport = lines.slice(0, lastImportIndex + 1).some(l => 
            l.includes("from './apiWaitUtils.js'") || l.includes('from "./apiWaitUtils.js"')
          );
          
          if (!hasApiWaitUtilsFileImport) {
            // Add import after the last import statement
            lines.splice(lastImportIndex + 1, 0, "import { ApiWaitUtils } from './apiWaitUtils.js';");
            content = lines.join('\n');
            hasChanges = true;
          }
        } else {
          // No imports found, add at the beginning (after any comments/blank lines)
          let insertIndex = 0;
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*')) {
              insertIndex = i;
              break;
            }
          }
          lines.splice(insertIndex, 0, "import { ApiWaitUtils } from './apiWaitUtils.js';");
          content = lines.join('\n');
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        fs.writeFileSync(filePath, content, 'utf8');
        fixedCount++;
        console.log(`  ✅ Fixed syntax issues in: ${filename}`);
      }
    }
    
    // Create missing stub files
    this.createMissingStubs();
    
    if (fixedCount > 0) {
      console.log(`\n✅ Post-processed ${fixedCount} file(s) with syntax fixes`);
    } else {
      console.log(`\n✅ No syntax issues found in POM files`);
    }
  }

  /**
   * Create missing stub files for dependencies
   */
  createMissingStubs() {
    const missingStubs = [
      {
        filename: 'organizationPayer.js',
        content: `// Stub for organizationPayer.js (missing dependency)
// This file is auto-generated to support POM files that import OrganizationPayer
export class OrganizationPayer {
	constructor(page) {
		this.page = page;
	}
}
`
      }
    ];
    
    for (const stub of missingStubs) {
      const stubPath = path.join(this.filteredPOMDir, stub.filename);
      if (!fs.existsSync(stubPath)) {
        fs.writeFileSync(stubPath, stub.content, 'utf8');
        console.log(`  📋 Created missing stub: ${stub.filename}`);
      }
    }
  }

  /**
   * Main smart sync function
   * Only downloads when GitHub files have changed
   */
  async smartSync(force = false) {
    console.log('\n🔄 Starting smart sync...\n');
    
    const { targetRepo, paths } = this.config;
    const owner = targetRepo.owner;
    const repo = targetRepo.repo;
    const branch = targetRepo.branch || 'main';
    
    // Get current SHAs from GitHub
    console.log('📡 Checking GitHub for changes...');
    const currentPlaywrightSHA = await this.getCommitSHA(owner, repo, branch, paths.playwrightTests);
    const currentPOMSHA = await this.getCommitSHA(owner, repo, branch, paths.pomDirectory);
    
    console.log(`  Playwright SHA: ${currentPlaywrightSHA?.substring(0, 8)}...`);
    console.log(`  POM SHA: ${currentPOMSHA?.substring(0, 8)}...`);
    
    // Get cached metadata
    const cachedMetadata = this.getCacheMetadata();
    
    // Check if sync is needed
    const playwrightChanged = force || cachedMetadata.playwrightSHA !== currentPlaywrightSHA;
    const pomChanged = force || cachedMetadata.pomSHA !== currentPOMSHA;
    
    if (!playwrightChanged && !pomChanged) {
      console.log('\n✅ Cache is up-to-date! No sync needed.');
      console.log(`   Last sync: ${cachedMetadata.lastSync || 'unknown'}`);
      return {
        synced: false,
        cached: true,
        message: 'Cache is valid'
      };
    }
    
    console.log('\n🔄 Changes detected, syncing...');
    if (playwrightChanged) console.log('  📝 Playwright tests changed');
    if (pomChanged) console.log('  📝 POM files changed');
    
    let usedMethods = this.loadUsedMethods();
    let methodsHash = cachedMetadata.methodsHash;
    
    // If playwright changed, re-scan tests
    if (playwrightChanged) {
      console.log('\n📥 Fetching test file list...');
      const testFiles = await this.fetchFileList(owner, repo, paths.playwrightTests, branch);
      console.log(`  Found ${testFiles.length} test files`);
      
      const usedMethodsMap = await this.streamProcessTests(testFiles);
      usedMethods = this.saveUsedMethods(usedMethodsMap);
      methodsHash = this.calculateMethodsHash(usedMethodsMap);
      
      console.log(`\n📊 Extracted ${Object.keys(usedMethods).length} POM pages with methods`);
    }
    
    // If POM changed or methods changed, download and filter POMs
    const methodsChanged = methodsHash !== cachedMetadata.methodsHash;
    
    if (pomChanged || methodsChanged || force) {
      console.log('\n📥 Fetching POM file list...');
      const pomFiles = await this.fetchPOMFileList(owner, repo, paths.pomDirectory, branch);
      console.log(`  Found ${pomFiles.length} POM files`);
      
      await this.downloadAndFilterPOMs(pomFiles, usedMethods);
    }
    
    // Update metadata
    const newMetadata = {
      playwrightSHA: currentPlaywrightSHA,
      pomSHA: currentPOMSHA,
      lastSync: new Date().toISOString(),
      methodsHash: methodsHash
    };
    
    this.saveCacheMetadata(newMetadata);
    
    console.log('\n✅ Sync complete!\n');
    
    return {
      synced: true,
      playwrightChanged,
      pomChanged,
      methodsChanged,
      message: 'Sync successful'
    };
  }

  /**
   * Check what would be synced without actually syncing
   */
  async checkSync() {
    console.log('\n🔍 Checking sync status...\n');
    
    const { targetRepo, paths } = this.config;
    const owner = targetRepo.owner;
    const repo = targetRepo.repo;
    const branch = targetRepo.branch || 'main';
    
    const currentPlaywrightSHA = await this.getCommitSHA(owner, repo, branch, paths.playwrightTests);
    const currentPOMSHA = await this.getCommitSHA(owner, repo, branch, paths.pomDirectory);
    const cachedMetadata = this.getCacheMetadata();
    
    console.log('GitHub:');
    console.log(`  Playwright SHA: ${currentPlaywrightSHA?.substring(0, 8)}...`);
    console.log(`  POM SHA: ${currentPOMSHA?.substring(0, 8)}...`);
    console.log('\nCache:');
    console.log(`  Playwright SHA: ${cachedMetadata.playwrightSHA?.substring(0, 8) || 'none'}...`);
    console.log(`  POM SHA: ${cachedMetadata.pomSHA?.substring(0, 8) || 'none'}...`);
    console.log(`  Last sync: ${cachedMetadata.lastSync || 'never'}`);
    
    const playwrightChanged = cachedMetadata.playwrightSHA !== currentPlaywrightSHA;
    const pomChanged = cachedMetadata.pomSHA !== currentPOMSHA;
    
    console.log('\nStatus:');
    if (!playwrightChanged && !pomChanged) {
      console.log('  ✅ Cache is up-to-date');
    } else {
      console.log('  🔄 Sync needed:');
      if (playwrightChanged) console.log('    - Playwright tests changed');
      if (pomChanged) console.log('    - POM files changed');
    }
    
    return {
      needsSync: playwrightChanged || pomChanged,
      playwrightChanged,
      pomChanged
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    console.log('🗑️  Clearing cache...');
    
    if (fs.existsSync(this.filteredPOMDir)) {
      fs.rmSync(this.filteredPOMDir, { recursive: true, force: true });
      console.log('  ✅ Deleted filtered POM cache');
    }
    
    if (fs.existsSync(this.metadataPath)) {
      fs.unlinkSync(this.metadataPath);
      console.log('  ✅ Deleted metadata');
    }
    
    this.ensureDirectories();
    console.log('✅ Cache cleared');
  }
}

// CLI support
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || 
    import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const command = process.argv[2] || 'sync';
  const force = process.argv.includes('--force');
  
  const manager = new GitHubSyncManager();
  
  (async () => {
    try {
      switch (command) {
        case 'sync':
          await manager.smartSync(force);
          break;
        case 'check':
          await manager.checkSync();
          break;
        case 'clear':
          manager.clearCache();
          break;
        default:
          console.log('Usage: node github-sync-manager.mjs [sync|check|clear] [--force]');
          process.exit(1);
      }
    } catch (error) {
      console.error('❌ Sync failed:', error.message);
      if (error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  })();
}
