import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Helper script to convert GitHub App private key (.pem) to .env format
 * 
 * Usage:
 *   node convert-pem-to-env.mjs path/to/your-key.pem
 * 
 * This will output the key in the correct format for .env file
 */

const pemFile = process.argv[2];

if (!pemFile) {
  console.error('❌ Usage: node convert-pem-to-env.mjs <path-to-pem-file>');
  console.error('');
  console.error('Example:');
  console.error('  node convert-pem-to-env.mjs ~/Downloads/your-app.2024-02-24.private-key.pem');
  process.exit(1);
}

if (!fs.existsSync(pemFile)) {
  console.error(`❌ File not found: ${pemFile}`);
  process.exit(1);
}

try {
  // Read the PEM file
  const pemContent = fs.readFileSync(pemFile, 'utf8');
  
  // Convert newlines to \n for .env format
  const envFormat = pemContent.replace(/\n/g, '\\n');
  
  console.log('✅ Successfully converted private key!');
  console.log('');
  console.log('📋 Copy this line to your .env file:');
  console.log('');
  console.log(`GITHUB_PRIVATE_KEY=${envFormat}`);
  console.log('');
  console.log('📝 Your .env file should look like:');
  console.log('');
  console.log('GITHUB_APP_ID=your_app_id');
  console.log(`GITHUB_PRIVATE_KEY=${envFormat}`);
  console.log('GITHUB_INSTALLATION_ID=your_installation_id');
  console.log('');
  console.log('⚠️  Make sure .env is in your .gitignore!');
  
} catch (error) {
  console.error('❌ Failed to read PEM file:', error.message);
  process.exit(1);
}
