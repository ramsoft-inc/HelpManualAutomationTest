// Run this script instead of test-enhanced-flow.js to use the improved container highlighting
import fs from 'fs';
import path from 'path';

// First, apply the highlighting fix
console.log('🔧 Applying container highlighting fixes...');

// Function to modify the transpiled JavaScript directly
function applyFixToJsFile() {
  try {
    // Path to the compiled ai_utils_enhanced.js file (adjust if needed)
    const filePaths = [
      './tracewrightt/dist/esm/ai_utils_enhanced.js',
      './tracewrightt/dist/cjs/ai_utils_enhanced.js'
    ];
    
    filePaths.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        // Read the file
        let fileContent = fs.readFileSync(filePath, 'utf8');
        
        // Replace the backgroundColor assignment with 'transparent'
        fileContent = fileContent.replace(
          /highlight\.style\.backgroundColor\s*=\s*color\.replace\([^)]+\)\.replace\([^)]+\)/g,
          "highlight.style.backgroundColor = 'transparent'"
        );
        
        // Write the modified content back
        fs.writeFileSync(filePath, fileContent);
        console.log(`✅ Fixed container highlighting in ${filePath}`);
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error applying fix to JS file:', error);
    return false;
  }
}

// Apply the fix
const fixApplied = applyFixToJsFile();

if (fixApplied) {
  console.log('🚀 Running enhanced flow test with improved container highlighting...');
  
  // Now run the original test script
  import('./test-enhanced-flow.js')
    .catch(err => {
      console.error('❌ Error running test script:', err);
      process.exit(1);
    });
} else {
  console.error('❌ Failed to apply container highlighting fix. Please check the paths and try again.');
  process.exit(1);
}