// Test script to debug placeholder detection and replacement
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name and filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Test function to find and replace placeholders in a markdown file
 * @param {string} filePath - Path to the markdown file
 * @param {string} imageName - Name of the image file
 */
function testPlaceholderReplacement(filePath, imageName) {
  console.log(`🔍 Testing placeholder replacement for file: ${filePath}`);
  console.log(`🔍 Looking for image name: ${imageName}`);
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      return;
    }
    
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Log file content for debugging
    console.log('\n📄 File content:');
    console.log('---START CONTENT---');
    console.log(content);
    console.log('---END CONTENT---\n');
    
    // Get the base name without extension
    const imageBaseName = path.basename(imageName, path.extname(imageName));
    
    // Create the image reference
    const relativePath = `img/${imageName}`;
    const imageReference = `![${imageBaseName}](${relativePath})`;
    
    // Log all lines containing placeholders
    console.log('🔍 Looking for placeholder comments:');
    const lines = content.split('\n');
    const placeholderLines = lines.filter(line => line.includes('<!-- placeholder'));
    
    if (placeholderLines.length === 0) {
      console.log('❌ No placeholder comments found in file');
    } else {
      console.log(`✅ Found ${placeholderLines.length} placeholder lines:`);
      placeholderLines.forEach((line, index) => {
        console.log(`${index + 1}: ${line}`);
      });
    }
    
    // Check for lines containing the image name
    console.log(`\n🔍 Looking for lines containing image name "${imageName}" or "${imageBaseName}":`);
    const imageNameLines = lines.filter(line => 
      line.toLowerCase().includes(imageName.toLowerCase()) || 
      line.toLowerCase().includes(imageBaseName.toLowerCase())
    );
    
    if (imageNameLines.length === 0) {
      console.log(`❌ No lines containing "${imageName}" or "${imageBaseName}" found`);
    } else {
      console.log(`✅ Found ${imageNameLines.length} lines containing the image name:`);
      imageNameLines.forEach((line, index) => {
        console.log(`${index + 1}: ${line}`);
      });
    }
    
    // Find lines that are both placeholders and contain the image name
    const matchingLines = lines.filter(line => 
      line.includes('<!-- placeholder') && 
      (line.toLowerCase().includes(imageName.toLowerCase()) || 
       line.toLowerCase().includes(imageBaseName.toLowerCase()))
    );
    
    console.log('\n🔍 Looking for lines that are both placeholders and contain the image name:');
    if (matchingLines.length === 0) {
      console.log('❌ No matching placeholder lines found');
    } else {
      console.log(`✅ Found ${matchingLines.length} matching placeholder lines:`);
      matchingLines.forEach((line, index) => {
        console.log(`${index + 1}: ${line}`);
      });
      
      // Simulate replacement
      console.log('\n📝 Simulating replacement:');
      let updatedContent = content;
      let replacementCount = 0;
      
      for (const line of matchingLines) {
        const lineIndex = lines.indexOf(line);
        console.log(`Replacing line ${lineIndex + 1}: "${line}" with "${imageReference}"`);
        lines[lineIndex] = imageReference;
        replacementCount++;
      }
      
      if (replacementCount > 0) {
        updatedContent = lines.join('\n');
        console.log(`✅ Successfully replaced ${replacementCount} placeholder(s) with image reference`);
      }
    }
    
    // Test a more general approach - find any placeholder and check its content
    console.log('\n🔍 Testing alternative approach - extract placeholders and check content:');
    const placeholderPattern = /<!--\s*placeholder[^>]*-->/g;
    const placeholders = content.match(placeholderPattern);
    
    if (!placeholders || placeholders.length === 0) {
      console.log('❌ No placeholders found using regex pattern');
    } else {
      console.log(`✅ Found ${placeholders.length} placeholders using regex pattern:`);
      placeholders.forEach((placeholder, index) => {
        console.log(`${index + 1}: "${placeholder}"`);
        
        // Extract the content of the placeholder
        const placeholderContent = placeholder
          .replace(/<!--\s*placeholder\s+for\s+screenshot:?\s*/, '')
          .replace(/\s*-->/, '')
          .trim();
        
        console.log(`   Content: "${placeholderContent}"`);
        console.log(`   Contains image name: ${placeholderContent.toLowerCase().includes(imageName.toLowerCase()) || 
                                             placeholderContent.toLowerCase().includes(imageBaseName.toLowerCase())}`);
      });
    }
  } catch (error) {
    console.error(`❌ Error testing placeholder replacement: ${error.message}`);
  }
}

// Main function to run the test
const main = async () => {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: node placeholder-test.js <file-path> <image-name>');
    console.log('Example: node placeholder-test.js ../docs/6-Image-Viewer/4_MoreOptionsToolbarMenu.md img-as-1.png');
    process.exit(1);
  }
  
  const filePath = args[0];
  const imageName = args[1];
  testPlaceholderReplacement(filePath, imageName);
};

// Run the main function
main().catch(error => {
  console.error('Error in main execution:', error);
  process.exit(1);
});

// Export the test function
export { testPlaceholderReplacement };
