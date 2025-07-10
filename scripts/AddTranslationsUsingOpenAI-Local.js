const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const OpenAI = require('openai');
const config = require('./translation.config');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: config.openai.apiKey
});

// Content directories configuration
const contentDirs = [
    { src: 'docs', dest: 'docusaurus-plugin-content-docs/current', includeImages: false },
    { src: 'blog', dest: 'docusaurus-plugin-content-blog', includeImages: true }
];

async function main() {
    const locale = process.argv[2];
    if (!locale) {
        console.error('Please provide a locale (e.g., pt-BR)');
        process.exit(1);
    }

    // Parse --include-images flag
    const includeImages = process.argv.includes('--include-images');

    // Update contentDirs configuration based on parameter
    contentDirs[0].includeImages = includeImages;

    try {
        console.log('Starting translation process...');
        console.log(`Images in docs directory will be ${includeImages ? 'included' : 'excluded'}`);
        
        await addLocaleToConfig(locale);
        await runWriteTranslations(locale);
        await copyContentToTranslationDirs(locale);
        await translateContent(locale);

        console.log('Translation process completed successfully!');
    } catch (error) {
        console.error('Error during translation process:', error);
        process.exit(1);
    }
}

async function addLocaleToConfig(locale) {
    console.log('Step 1: Adding locale to config...');
    const configPath = path.join('docusaurus.config.js');
    let configContent = fs.readFileSync(configPath, 'utf8');

    const localesMatch = configContent.match(/locales:\s*\[([\s\S]*?)\]/);
    if (!localesMatch) throw new Error('Could not find locales array in docusaurus.config.js');

    if (!localesMatch[1].includes(locale)) {
        const currentLocales = localesMatch[1].trim();
        const newLocales = currentLocales.endsWith(']') 
            ? currentLocales.slice(0, -1) + `, '${locale}']`
            : currentLocales + `, '${locale}']`;
        configContent = configContent.replace(localesMatch[0], `locales: [${newLocales}`);
        fs.writeFileSync(configPath, configContent);
        console.log(`Added ${locale} to docusaurus.config.js`);
    }
}

async function runWriteTranslations(locale) {
    console.log('Step 2: Running write-translations command...');
    try {
        execSync(`npm run write-translations -- --locale ${locale}`, { stdio: 'inherit' });
    } catch (error) {
        console.log('Write-translations completed (warnings are normal)');
    }
}

async function copyContentToTranslationDirs(locale) {
    console.log('Step 3: Copying content to translation directories...');
    
    for (const { src, dest, includeImages } of contentDirs) {
        console.log(`\nProcessing ${src}...`);
        const targetDir = path.join('i18n', locale, dest);
        const srcPath = path.join(process.cwd(), src);
        
        console.log(`Copying from ${srcPath} to ${targetDir}`);
        copyDirectory(srcPath, targetDir, includeImages, src === 'docs');
    }
}

function copyDirectory(src, dest, includeImages, isDocs) {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    let hasFilesToCopy = false;

    // Check if directory has files to copy
    for (const entry of entries) {
        if (entry.isFile()) {
            if (!isDocs && includeImages) {
                hasFilesToCopy = true;
                break;
            }
            if (isDocs && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
                hasFilesToCopy = true;
                break;
            }
        } else if (entry.isDirectory()) {
            const subPath = path.join(src, entry.name);
            const subEntries = fs.readdirSync(subPath, { withFileTypes: true });
            if (subEntries.some(e => e.isFile() && (e.name.endsWith('.md') || e.name.endsWith('.mdx')))) {
                hasFilesToCopy = true;
                break;
            }
        }
    }

    if (!hasFilesToCopy) return;

    fs.mkdirSync(dest, { recursive: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            if (isDocs && !includeImages && (entry.name.toLowerCase() === 'images' || entry.name.toLowerCase() === 'img')) {
                continue;
            }
            copyDirectory(srcPath, destPath, includeImages, isDocs);
        } else if (entry.isFile()) {
            if (!isDocs && includeImages) {
                fs.copyFileSync(srcPath, destPath);
            } else if (isDocs && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }
}

async function translateContent(locale) {
    console.log('Step 4: Translating content...');
    
    // Get all markdown files in the locale directory
    const localePath = path.join('i18n', locale);
    const allFiles = getAllMarkdownFiles(localePath);
    
    console.log(`Found ${allFiles.length} files to translate`);
    
    for (const file of allFiles) {
        console.log(`Translating ${file}...`);
        if (file.endsWith('.md') || file.endsWith('.mdx')) {
            await translateMarkdownFile(file, locale);
        } else if (file.endsWith('.json')) {
            await translateJsonFile(file, locale);
        }
    }
}

function getAllMarkdownFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...getAllMarkdownFiles(fullPath));
        } else if (entry.isFile() && 
            (entry.name.endsWith('.md') || 
             entry.name.endsWith('.mdx') || 
             entry.name.endsWith('.json'))) {
            files.push(fullPath);
        }
    }

    return files;
}

async function translateMarkdownFile(filePath, locale) {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleanContent = content.replace(/!\[.*?\]\(.*?\)/g, '');
    
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4.1",
            messages: [
                {
                    role: "system",
                    content: `You are a professional translator. Translate the following markdown content to ${locale}. Preserve all markdown formatting, links, and special characters. Maintain the exact same structure and formatting of the original document.`
                },
                {
                    role: "user",
                    content: cleanContent
                }
            ],
            temperature: config.openai.temperature
        });

        fs.writeFileSync(filePath, response.choices[0].message.content);
        console.log(`Successfully translated ${filePath}`);
    } catch (error) {
        console.error(`Error translating ${filePath}:`, error);
        throw error;
    }
}

async function translateJsonFile(filePath, locale) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4.1",
            messages: [
                {
                    role: "system",
                    content: `You are a professional translator. Translate ONLY the string values in the following JSON to ${locale}. Preserve the exact JSON structure, keys, and formatting. Only translate the values, not the keys. Return the complete JSON with translated values.`
                },
                {
                    role: "user",
                    content: content
                }
            ],
            temperature: config.openai.temperature
        });

        const translatedJson = response.choices[0].message.content;
        fs.writeFileSync(filePath, translatedJson);
        console.log(`Successfully translated ${filePath}`);
    } catch (error) {
        console.error(`Error translating ${filePath}:`, error);
        throw error;
    }
}

main(); 