// Test script to check if the path file can be read
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cwd = process.cwd();

console.log(`Current working directory: ${cwd}`);
console.log(`Script directory: ${__dirname}`);

// Check multiple locations for the path file
const possiblePathFiles = [
  path.join(cwd, 'current_md_path.txt'),               // Project root
  path.join(cwd, '..', 'current_md_path.txt'),         // Parent of AutoSnap
  path.join(cwd, 'current_md_path.txt'),               // Current directory
  '../current_md_path.txt',                            // Parent directory
];

console.log('Checking for path file in multiple locations:');

for (const pathFile of possiblePathFiles) {
  console.log(`\nChecking for path file at: ${pathFile}`);
  
  try {
    if (fs.existsSync(pathFile)) {
      console.log(`✅ Found path file at: ${pathFile}`);
      const fileContent = fs.readFileSync(pathFile, 'utf8').trim();
      
      if (fileContent && fileContent.length > 0) {
        console.log(`✅ Path file contains: ${fileContent}`);
        
        // Check if the file exists
        const mdPath = path.resolve(cwd, '..', fileContent);
        console.log(`Resolved path: ${mdPath}`);
        
        if (fs.existsSync(mdPath)) {
          console.log(`✅ Markdown file exists at: ${mdPath}`);
          
          // Read the first few lines of the file
          const content = fs.readFileSync(mdPath, 'utf8').substring(0, 100);
          console.log(`File content preview: ${content}`);
        } else {
          console.log(`❌ Markdown file does not exist at: ${mdPath}`);
        }
      } else {
        console.log(`⚠️ Path file exists but is empty or invalid at: ${pathFile}`);
      }
    } else {
      console.log(`⚠️ Path file not found at: ${pathFile}`);
    }
  } catch (error) {
    console.error(`❌ Error reading path file ${pathFile}: ${error}`);
  }
}