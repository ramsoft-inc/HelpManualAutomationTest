import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * POM File Filtering Utility
 * 
 * Filters POM files to include only methods that are actually used in tests.
 * This significantly reduces file size and improves token usage for LLM context.
 */
export class POMFilter {
  constructor(pomDir, usedMethodsPath, outputDir) {
    this.pomDir = pomDir;
    this.usedMethodsPath = usedMethodsPath;
    this.outputDir = outputDir;
  }

  /**
   * Load used methods from JSON file
   */
  loadUsedMethods() {
    try {
      const content = fs.readFileSync(this.usedMethodsPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`❌ Failed to load used methods from ${this.usedMethodsPath}:`, error.message);
      throw error;
    }
  }

  /**
   * Parse POM file and extract method definitions
   */
  parsePOMFile(content) {
    const methods = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Match method definitions (various patterns)
      const methodPatterns = [
        /^\s*(async\s+)?([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{/,  // async methodName() {
        /^\s*this\.([a-zA-Z0-9_]+)\s*=\s*async\s*\([^)]*\)\s*=>/,  // this.methodName = async () =>
        /^\s*([a-zA-Z0-9_]+)\s*:\s*async\s*function/  // methodName: async function
      ];
      
      for (const pattern of methodPatterns) {
        const match = line.match(pattern);
        if (match) {
          const methodName = match[2] || match[1];
          if (methodName && methodName !== 'constructor' && methodName !== 'class') {
            methods.push({
              name: methodName,
              startLine: i,
              line: line
            });
          }
          break;
        }
      }
    }
    
    return methods;
  }

  /**
   * Extract specific method from POM content
   */
  extractMethod(lines, startLine) {
    const extracted = [lines[startLine]];
    let braceCount = (lines[startLine].match(/\{/g) || []).length;
    braceCount -= (lines[startLine].match(/\}/g) || []).length;
    
    let i = startLine + 1;
    while (i < lines.length && braceCount > 0) {
      extracted.push(lines[i]);
      braceCount += (lines[i].match(/\{/g) || []).length;
      braceCount -= (lines[i].match(/\}/g) || []).length;
      i++;
    }
    
    return extracted.join('\n');
  }

  /**
   * Filter POM file to only include used methods
   */
  filterPOMFile(pomPath, usedMethods, pageName) {
    try {
      const content = fs.readFileSync(pomPath, 'utf8');
      const lines = content.split('\n');
      const filteredLines = [];
      
      // Get list of methods to keep for this page
      const methodsToKeep = usedMethods[pageName] || [];
      
      if (methodsToKeep.length === 0) {
        console.warn(`⚠️  No used methods for ${pageName}, keeping full file`);
        return content;
      }
      
      // Track which lines we're keeping
      let inMethod = false;
      let inTargetMethod = false;
      let braceCount = 0;
      let currentMethodName = null;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Always keep: imports, requires, class declaration, constructor, exports
        if (this.isStructuralLine(line)) {
          filteredLines.push(line);
          continue;
        }
        
        // Check if we're starting a method
        if (!inMethod) {
          const methodMatch = line.match(/^\s*(async\s+)?([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{?/);
          if (methodMatch) {
            currentMethodName = methodMatch[2];
            
            if (currentMethodName === 'constructor' || methodsToKeep.includes(currentMethodName)) {
              inMethod = true;
              inTargetMethod = true;
              braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
              filteredLines.push(line);
            } else {
              inMethod = true;
              inTargetMethod = false;
              braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
            }
            continue;
          }
        }
        
        // If we're in a method we want to keep, include all lines
        if (inMethod && inTargetMethod) {
          filteredLines.push(line);
          braceCount += (line.match(/\{/g) || []).length;
          braceCount -= (line.match(/\}/g) || []).length;
          
          if (braceCount <= 0) {
            inMethod = false;
            inTargetMethod = false;
            currentMethodName = null;
          }
        } else if (inMethod && !inTargetMethod) {
          // Track braces but don't include lines
          braceCount += (line.match(/\{/g) || []).length;
          braceCount -= (line.match(/\}/g) || []).length;
          
          if (braceCount <= 0) {
            inMethod = false;
            inTargetMethod = false;
            currentMethodName = null;
          }
        }
      }
      
      return filteredLines.join('\n');
    } catch (error) {
      console.error(`❌ Failed to filter ${pomPath}:`, error.message);
      throw error;
    }
  }

  /**
   * Check if a line is structural (should always be kept)
   */
  isStructuralLine(line) {
    const trimmed = line.trim();
    
    return (
      trimmed.startsWith('import ') ||
      trimmed.startsWith('const ') && trimmed.includes('require(') ||
      trimmed.startsWith('class ') ||
      trimmed.startsWith('module.exports') ||
      trimmed.startsWith('exports.') ||
      trimmed === '}' ||
      trimmed === '' ||
      trimmed.startsWith('//')
    );
  }

  /**
   * Filter all POM files
   */
  async filterAllPOMs() {
    console.log('\n🔍 Filtering POM files...\n');
    
    // Load used methods
    const usedMethods = this.loadUsedMethods();
    console.log(`📋 Loaded method usage for ${Object.keys(usedMethods).length} pages`);
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    // Get all POM files
    const pomFiles = fs.readdirSync(this.pomDir)
      .filter(file => file.endsWith('.js'));
    
    console.log(`📂 Found ${pomFiles.length} POM files in ${this.pomDir}\n`);
    
    let processedCount = 0;
    let totalOriginalSize = 0;
    let totalFilteredSize = 0;
    
    for (const file of pomFiles) {
      const pageName = file.replace('.js', '');
      const pomPath = path.join(this.pomDir, file);
      const outputPath = path.join(this.outputDir, file);
      
      // Skip if not used
      if (!usedMethods[pageName] || usedMethods[pageName].length === 0) {
        console.log(`  ⏭️  Skipping ${file} (not used)`);
        continue;
      }
      
      try {
        const originalContent = fs.readFileSync(pomPath, 'utf8');
        const filteredContent = this.filterPOMFile(pomPath, usedMethods, pageName);
        
        fs.writeFileSync(outputPath, filteredContent, 'utf8');
        
        const originalSize = originalContent.length;
        const filteredSize = filteredContent.length;
        const savings = ((1 - filteredSize / originalSize) * 100).toFixed(1);
        
        totalOriginalSize += originalSize;
        totalFilteredSize += filteredSize;
        
        console.log(`  ✅ ${file}`);
        console.log(`     Methods: ${usedMethods[pageName].length}`);
        console.log(`     Size: ${(originalSize / 1024).toFixed(1)}KB → ${(filteredSize / 1024).toFixed(1)}KB (${savings}% reduction)`);
        
        processedCount++;
      } catch (error) {
        console.error(`  ❌ Failed to filter ${file}:`, error.message);
      }
    }
    
    const totalSavings = ((1 - totalFilteredSize / totalOriginalSize) * 100).toFixed(1);
    
    console.log(`\n✅ Filtered ${processedCount} POM files`);
    console.log(`📊 Total size: ${(totalOriginalSize / 1024).toFixed(1)}KB → ${(totalFilteredSize / 1024).toFixed(1)}KB`);
    console.log(`💾 Total savings: ${totalSavings}%\n`);
    
    return {
      processed: processedCount,
      originalSize: totalOriginalSize,
      filteredSize: totalFilteredSize,
      savings: totalSavings
    };
  }
}

// CLI support
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || 
    import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const pomDir = process.argv[2] || path.join(__dirname, 'POM');
  const usedMethodsPath = process.argv[3] || path.join(__dirname, 'used_pom_methods.json');
  const outputDir = process.argv[4] || path.join(__dirname, '.cache', 'filtered-pom');
  
  const filter = new POMFilter(pomDir, usedMethodsPath, outputDir);
  
  (async () => {
    try {
      await filter.filterAllPOMs();
    } catch (error) {
      console.error('❌ Filtering failed:', error.message);
      if (error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  })();
}
