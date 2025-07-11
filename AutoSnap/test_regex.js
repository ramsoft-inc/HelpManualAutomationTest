const testFiles = [
    "docs/1-Getting-Started/Login.md",
    "docs/6-Image-Viewer/1_Accessing_the_Image_Viewer_in_OmegaAI.md",
    "docs/2-OmegaAI-Homepage/omegaai_homepage.mdx",
    "src/components/Button.jsx",
    "package.json"
];

console.log('Testing regex patterns...');

testFiles.forEach(file => {
    const isMd = file.match(/^docs\/.*\.md$/);
    const isMdx = file.match(/^docs\/.*\.mdx$/);
    const isOther = !file.match(/^docs\/.*\.(md|mdx)$/);
    
    console.log(`File: ${file}`);
    console.log(`  Is MD: ${isMd ? 'YES' : 'NO'}`);
    console.log(`  Is MDX: ${isMdx ? 'YES' : 'NO'}`);
    console.log(`  Is Other: ${isOther ? 'YES' : 'NO'}`);
    console.log('');
}); 