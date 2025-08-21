import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Process an MD file to manage image placeholders
 * @param {string} mdFilePath - Path to the MD file to process
 */
async function processMarkdownFile(mdFilePath) {
    try {
        console.log(`📄 Processing MD file: ${mdFilePath}`);
        
        // Read the MD file
        const content = await fs.readFile(mdFilePath, 'utf8');
        
        // Get the directory where the MD file is located
        const mdDir = path.dirname(mdFilePath);
        const imgDir = path.join(mdDir, 'img');
        
        // Ensure img directory exists
        try {
            await fs.access(imgDir);
        } catch {
            console.log(`📁 Creating img directory: ${imgDir}`);
            await fs.mkdir(imgDir, { recursive: true });
        }
        
        // Get existing images in the img folder
        const existingImages = await getExistingImages(imgDir);
        console.log(`🖼️  Found ${existingImages.length} existing images:`, existingImages);
        
        // Process placeholders
        const { updatedContent, placeholderCount } = await assignPlaceholderNames(content, existingImages);
        
        if (placeholderCount > 0) {
            // Write the updated content back to the file
            await fs.writeFile(mdFilePath, updatedContent, 'utf8');
            console.log(`✅ Updated ${placeholderCount} placeholders in ${mdFilePath}`);
        } else {
            console.log(`ℹ️  No placeholders found in ${mdFilePath}`);
        }
        
        return { placeholderCount, updatedContent };
        
    } catch (error) {
        console.error(`❌ Error processing ${mdFilePath}:`, error.message);
        throw error;
    }
}

/**
 * Get existing images in the img directory
 * @param {string} imgDir - Path to the img directory
 * @returns {Array<string>} - List of existing image filenames
 */
async function getExistingImages(imgDir) {
    try {
        const files = await fs.readdir(imgDir);
        return files.filter(file => /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(file));
    } catch {
        return [];
    }
}

/**
 * Assign sequential names to placeholders
 * @param {string} content - MD file content
 * @param {Array<string>} existingImages - List of existing image files
 * @returns {Object} - Updated content and placeholder count
 */
async function assignPlaceholderNames(content, existingImages) {
    // Find all placeholder patterns
    const placeholderRegex = /<!--\s*placeholder\s+for\s+a\s+screenshot\s*-->/gi;
    const placeholders = [...content.matchAll(placeholderRegex)];
    
    if (placeholders.length === 0) {
        return { updatedContent: content, placeholderCount: 0 };
    }
    
    console.log(`🔍 Found ${placeholders.length} placeholders`);
    
    let updatedContent = content;
    let imageCounter = 1;
    
    // Process each placeholder
    for (let i = 0; i < placeholders.length; i++) {
        const placeholder = placeholders[i];
        const originalText = placeholder[0];
        
        // Find next available image number
        while (existingImages.includes(`image${imageCounter}.png`) || 
               content.includes(`image${imageCounter}.png`)) {
            imageCounter++;
        }
        
        const imageName = `image${imageCounter}.png`;
        const newPlaceholder = `<!-- placeholder for screenshot: ${imageName} -->`;
        
        console.log(`📝 Placeholder ${i + 1}: ${imageName}`);
        
        // Replace only the first occurrence to maintain order
        updatedContent = updatedContent.replace(originalText, newPlaceholder);
        imageCounter++;
    }
    
    return { updatedContent, placeholderCount: placeholders.length };
}

/**
 * Replace placeholder with actual image reference
 * @param {string} mdFilePath - Path to the MD file
 * @param {string} imageName - Name of the generated image
 */
async function replacePlaceholderWithImage(mdFilePath, imageName) {
    try {
        console.log(`🔄 Replacing placeholder with image: ${imageName}`);
        
        const content = await fs.readFile(mdFilePath, 'utf8');
        const placeholderPattern = new RegExp(`<!--\\s*placeholder\\s+for\\s+screenshot:\\s*${imageName.replace('.', '\\.')}\\s*-->`, 'gi');
        
        const imageReference = `![${imageName.replace('.png', '')}](./img/${imageName})`;
        const updatedContent = content.replace(placeholderPattern, imageReference);
        
        if (updatedContent !== content) {
            await fs.writeFile(mdFilePath, updatedContent, 'utf8');
            console.log(`✅ Replaced placeholder with image reference: ${imageName}`);
            return true;
        } else {
            console.warn(`⚠️  Placeholder not found for image: ${imageName}`);
            return false;
        }
        
    } catch (error) {
        console.error(`❌ Error replacing placeholder for ${imageName}:`, error.message);
        return false;
    }
}

/**
 * Process all placeholders in a directory
 * @param {string} dirPath - Path to directory containing MD files
 */
async function processDirectory(dirPath) {
    try {
        console.log(`📂 Processing directory: ${dirPath}`);
        
        const files = await fs.readdir(dirPath, { withFileTypes: true });
        const mdFiles = files
            .filter(file => file.isFile() && file.name.endsWith('.md'))
            .map(file => path.join(dirPath, file.name));
        
        console.log(`📄 Found ${mdFiles.length} MD files`);
        
        for (const mdFile of mdFiles) {
            await processMarkdownFile(mdFile);
        }
        
    } catch (error) {
        console.error(`❌ Error processing directory ${dirPath}:`, error.message);
        throw error;
    }
}

/**
 * Extract image names from placeholders in content
 * @param {string} content - MD file content
 * @returns {Array<string>} - List of image names from placeholders
 */
function extractImageNamesFromPlaceholders(content) {
    const placeholderRegex = /<!--\s*placeholder\s+for\s+screenshot:\s*([^-\s]+)\s*-->/gi;
    const matches = [...content.matchAll(placeholderRegex)];
    return matches.map(match => match[1].trim());
}

/**
 * Command line interface
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {

        process.exit(1);
    }
    
    try {
        if (args[0] === '--replace' && args.length === 3) {
            // Replace mode
            const [, mdFile, imageName] = args;
            await replacePlaceholderWithImage(mdFile, imageName);
        } else {
            // Process mode
            const targetPath = args[0];
            const stats = await fs.stat(targetPath);
            
            if (stats.isFile() && targetPath.endsWith('.md')) {
                await processMarkdownFile(targetPath);
            } else if (stats.isDirectory()) {
                await processDirectory(targetPath);
            } else {
                console.error('❌ Please provide a valid MD file or directory path');
                process.exit(1);
            }
        }
        
        console.log('🎉 Processing completed successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Export functions for use in other scripts
export {
    processMarkdownFile,
    replacePlaceholderWithImage,
    processDirectory,
    extractImageNamesFromPlaceholders
};

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('placeholder-manager.js')) {
    main();
} 