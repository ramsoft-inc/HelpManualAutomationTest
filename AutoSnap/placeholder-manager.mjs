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
        

        
        // Process placeholders
        const { updatedContent, placeholderCount } = await assignPlaceholderNames(content);
        
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
 * Assign structured names to placeholders
 * @param {string} content - MD file content
 * @param {Array<string>} existingImages - List of existing image files
 * @returns {Object} - Updated content and placeholder count
 */
async function assignPlaceholderNames(content, existingImages) {
    // Find all placeholder patterns - both unnamed and named
    const unnamedPlaceholderRegex = /<!--\s*placeholder\s+for\s+(?:a\s+)?screenshot\s*-->/gi;
    const namedPlaceholderRegex = /<!--\s*placeholder\s+for\s+screenshot:\s*([^-\s]+)\s*-->/gi;
    
    // Check for already named placeholders
    const namedPlaceholders = [...content.matchAll(namedPlaceholderRegex)];
    
    // Find unnamed placeholders
    const unnamedPlaceholders = [...content.matchAll(unnamedPlaceholderRegex)];
    
    if (unnamedPlaceholders.length === 0) {
        // If no unnamed placeholders, just count the named ones
        return { 
            updatedContent: content, 
            placeholderCount: namedPlaceholders.length 
        };
    }
    
    console.log(`🔍 Found ${unnamedPlaceholders.length} unnamed placeholders and ${namedPlaceholders.length} named placeholders`);
    
    // Get context from the surrounding content to generate meaningful names
    let updatedContent = content;
    
    // Process each placeholder
    for (let i = 0; i < unnamedPlaceholders.length; i++) {
        const placeholder = unnamedPlaceholders[i];
        const originalText = placeholder[0];
        
        // Get context from surrounding content (100 chars before)
        const contextStart = Math.max(0, placeholder.index - 100);
        const context = content.substring(contextStart, placeholder.index);
        
        // Extract heading or section name for naming
        let imageName = '';
        
        // Try to find the nearest heading
        const headingMatch = context.match(/###\s+([^#\n]+)$/);
        if (headingMatch) {
            // Convert heading to kebab case
            imageName = headingMatch[1].trim()
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-');
        }
        
        // If no heading found, use a structured name with counter (img-as-#)
        if (!imageName) {
            // Find a unique name with counter
            let counter = 1;
            while (existingImages?.includes(`img-as-${counter}.png`) || 
                  content.includes(`img-as-${counter}.png`)) {
                counter++;
            }
            imageName = `img-as-${counter}`;
        }
        
        // Add .png extension if not present
        if (!imageName.endsWith('.png')) {
            imageName = `${imageName}.png`;
        }
        
        const newPlaceholder = `<!-- placeholder for screenshot: ${imageName} -->`;
        
        console.log(`📝 Placeholder ${i + 1}: ${originalText} → ${newPlaceholder}`);
        
        // Replace only the first occurrence to maintain order
        updatedContent = updatedContent.replace(originalText, newPlaceholder);
    }
    
    return { 
        updatedContent, 
        placeholderCount: unnamedPlaceholders.length + namedPlaceholders.length 
    };
}

/**
 * Replace placeholder with actual image reference
 * @param {string} mdFilePath - Path to the MD file
 * @param {string} imageName - Name of the generated image
 * @param {string} [altText] - Optional alt text for the image
 */
async function replacePlaceholderWithImage(mdFilePath, imageName, altText) {
    try {
        console.log(`🔄 Replacing placeholder with image: ${imageName}`);
        
        const content = await fs.readFile(mdFilePath, 'utf8');
        
        // Escape special characters in the image name for regex
        const escapedImageName = imageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const placeholderPattern = new RegExp(`<!--\\s*placeholder\\s+for\\s+screenshot:\\s*${escapedImageName}\\s*-->`, 'gi');
        
        // Use the image name without extension as alt text, or use provided alt text
        const imageAltText = altText || imageName.replace(/\.(png|jpg|jpeg|gif|webp)$/i, '');
        const imageReference = `![${imageAltText}](./img/${imageName})`;
        
        const updatedContent = content.replace(placeholderPattern, imageReference);
        
        if (updatedContent !== content) {
            await fs.writeFile(mdFilePath, updatedContent, 'utf8');
            console.log(`✅ Replaced placeholder with image reference: ${imageName}`);
            return true;
        } else {
            // Try a more relaxed pattern if exact match fails
            console.log(`⚠️  Exact placeholder not found, trying relaxed pattern...`);
            
            // Get all placeholders
            const placeholders = extractImageNamesFromPlaceholders(content);
            
            // Find a placeholder with similar name (ignoring extension)
            const baseImageName = imageName.replace(/\.(png|jpg|jpeg|gif|webp)$/i, '');
            const similarPlaceholder = placeholders.find(p => 
                p.imageName.replace(/\.(png|jpg|jpeg|gif|webp)$/i, '') === baseImageName
            );
            
            if (similarPlaceholder) {
                // Replace this specific placeholder
                const exactPattern = new RegExp(similarPlaceholder.fullMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                const newContent = content.replace(exactPattern, imageReference);
                
                await fs.writeFile(mdFilePath, newContent, 'utf8');
                console.log(`✅ Replaced similar placeholder with image reference: ${imageName}`);
                return true;
            } else {
                console.warn(`⚠️  No matching placeholder found for image: ${imageName}`);
                return false;
            }
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
 * @returns {Array<Object>} - List of objects with imageName and position
 */
function extractImageNamesFromPlaceholders(content) {
    // Updated regex to capture image names that may contain hyphens
    const placeholderRegex = /<!--\s*placeholder\s+for\s+screenshot:\s*([^>]+?)\s*-->/gi;
    const matches = [...content.matchAll(placeholderRegex)];
    
    return matches.map(match => {
        return {
            imageName: match[1].trim(),
            position: match.index,
            fullMatch: match[0]
        };
    });
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