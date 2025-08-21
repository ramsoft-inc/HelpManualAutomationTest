// ESM script to fix import paths in compiled JavaScript files
import { readdir, readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, 'dist', 'js');

async function fixImports(dir) {
  try {
    const files = await readdir(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = join(dir, file.name);
      
      if (file.isDirectory()) {
        await fixImports(fullPath);
      } else if (file.name.endsWith('.js')) {
        console.log(`Processing ${fullPath}`);
        let content = await readFile(fullPath, 'utf8');
        
        // Fix relative imports without extensions
        content = content.replace(/from\s+["'](\.[^"']*?)["']/g, (match, importPath) => {
          // Skip if already has extension
          if (importPath.endsWith('.js')) {
            return match;
          }
          return `from "${importPath}.js"`;
        });
        
        await writeFile(fullPath, content, 'utf8');
        console.log(`✅ Fixed imports in ${fullPath}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error processing directory ${dir}:`, error);
  }
}

console.log('🔄 Fixing import paths in compiled JavaScript files...');
fixImports(distDir)
  .then(() => console.log('✅ All import paths fixed successfully'))
  .catch(err => console.error('❌ Failed to fix import paths:', err));
