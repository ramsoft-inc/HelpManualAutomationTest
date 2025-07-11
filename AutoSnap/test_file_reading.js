import { readFileSync } from 'node:fs';

console.log('Testing file reading...');

try {
    const changedFilesContent = readFileSync('test_changed_files.txt', 'utf8');
    const fileList = changedFilesContent.split('\n').filter(line => line.trim());
    
    console.log('File content:');
    console.log(changedFilesContent);
    
    console.log('\n=== File Analysis ===');
    console.log(`Total files: ${fileList.length}`);
    
    // Categorize files
    const docsMdFiles = fileList.filter(file => file.match(/^docs\/.*\.md$/));
    const docsMdxFiles = fileList.filter(file => file.match(/^docs\/.*\.mdx$/));
    const otherFiles = fileList.filter(file => !file.match(/^docs\/.*\.(md|mdx)$/));
    
    console.log(`Docs MD files: ${docsMdFiles.length}`);
    docsMdFiles.forEach(file => console.log(`  - ${file}`));
    
    console.log(`Docs MDX files: ${docsMdxFiles.length}`);
    docsMdxFiles.forEach(file => console.log(`  - ${file}`));
    
    console.log(`Other files: ${otherFiles.length}`);
    otherFiles.forEach(file => console.log(`  - ${file}`));
    
} catch (error) {
    console.log(`Error reading file: ${error.message}`);
} 