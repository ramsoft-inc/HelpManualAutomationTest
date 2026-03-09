const fs = require('fs');
const path = require('path');

const POM_DIR = path.resolve(__dirname, 'POM');
const OUTPUT_FILE = path.resolve(__dirname, 'pom_manifest.txt');

function scanDirectory(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(scanDirectory(file));
        } else {
            if (file.endsWith('.js') && !file.includes('utils')) {
                results.push(file);
            }
        }
    });
    return results;
}

function extractMethods(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const methods = [];
    
    // JavaScript keywords and control flow statements to exclude
    const EXCLUDED_KEYWORDS = new Set([
        'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
        'break', 'continue', 'return', 'throw', 'try', 'catch', 'finally',
        'function', 'class', 'const', 'let', 'var', 'new', 'this', 'super',
        'import', 'export', 'from', 'as', 'await', 'yield', 'delete',
        'typeof', 'instanceof', 'void', 'in', 'of', 'with', 'debugger',
        'static', 'async', 'extends', 'implements', 'interface', 'package',
        'private', 'protected', 'public', 'enum', 'abstract', 'boolean',
        'byte', 'char', 'double', 'final', 'float', 'goto', 'int', 'long',
        'native', 'short', 'synchronized', 'throws', 'transient', 'volatile',
        'get', 'set', 'require', 'module', 'exports', 'console', 'window',
        'document', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Date',
        'Math', 'JSON', 'Promise', 'setTimeout', 'setInterval', 'clearTimeout',
        'clearInterval', 'Error', 'TypeError', 'ReferenceError', 'resolve', 'reject'
    ]);
    
    // Regex to find class definition
    const classMatch = content.match(/class\s+(\w+)/);
    const className = classMatch ? classMatch[1] : path.basename(filePath, '.js');

    // Extract class body to avoid matching methods outside the class
    const classBodyMatch = content.match(/class\s+\w+[^{]*\{([\s\S]*)\}/);
    const classBody = classBodyMatch ? classBodyMatch[1] : content;

    // Improved regex to find methods: name() { ... } or async name() { ... }
    // Must be at the start of a line (with optional whitespace) to be a class method
    const methodRegex = /^\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/gm;
    
    let match;
    while ((match = methodRegex.exec(classBody)) !== null) {
        const methodName = match[1];
        
        // Filter out:
        // 1. constructor
        // 2. private methods (starting with _)
        // 3. JavaScript keywords and control flow statements
        // 4. Common global functions
        if (methodName !== 'constructor' && 
            !methodName.startsWith('_') && 
            !EXCLUDED_KEYWORDS.has(methodName) &&
            methodName.length > 1) { // Exclude single-letter names which are likely loop variables
            methods.push(methodName);
        }
    }

    return { className, methods };
}

function generateManifest() {
    const files = scanDirectory(POM_DIR);
    let manifest = "AVAILABLE PAGE OBJECT MODELS AND METHODS:\n\n";

    files.forEach(file => {
        const { className, methods } = extractMethods(file);
        if (methods.length > 0) {
            manifest += `Page: ${className}\n`;
            manifest += `Methods: ${methods.join(', ')}\n\n`;
        }
    });

    fs.writeFileSync(OUTPUT_FILE, manifest);
    console.log(`Manifest generated at ${OUTPUT_FILE}`);
}

generateManifest();
