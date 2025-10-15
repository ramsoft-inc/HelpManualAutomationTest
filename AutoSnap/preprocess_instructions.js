import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ESM modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Run the Python instruction generation script and return the generated instructions
 */
async function generateInstructions(scenarioType = "default", changedFiles = null, currentFile = null) {
    console.log(`🔄 Generating browser automation instructions for mode: ${scenarioType}...`);
    if (currentFile) {
        console.log(`📄 Current file being processed: ${currentFile}`);
    }
    
            // Map 'translation' mode to 'default' for Python script compatibility
            let pythonScenarioType = scenarioType;
            if (scenarioType === 'translation') {
                console.log(`ℹ️ Mapping 'translation' mode to 'default' for Python script compatibility`);
                pythonScenarioType = 'default';
            }
    
    return new Promise((resolve, reject) => {
        // Build the argument list
        const args = [];
        if (changedFiles) {
            console.log(`📁 Passing changed files: ${changedFiles}`);
            args.push('--changed-files', changedFiles);
        }
        if (currentFile) {
            console.log(`📄 Passing current file: ${currentFile}`);
            args.push('--current-file', currentFile);
        }
        // Add scenario type as the first argument
        args.unshift('--scenario-type', pythonScenarioType);
        
        // Run the Python script with scenario type and other arguments
        console.log(`🔄 Running Python script with args: ${args.join(' ')}`);
        // Use __dirname which is already defined at the top of the file
        const pythonProcess = spawn('python', [path.join(__dirname, 'browser_automation_instructions.py'), ...args], {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        // Add a timeout to prevent hanging (configurable, default 120s)
        const PY_TIMEOUT_MS = Number(process.env.PY_TIMEOUT_MS || 120000);
        const timeout = setTimeout(() => {
            console.warn(`⚠️  Python script timeout after ${PY_TIMEOUT_MS} ms, killing process...`);
            pythonProcess.kill('SIGTERM');
        }, PY_TIMEOUT_MS);
        
        let output = '';
        let errorOutput = '';
        
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
            console.log('📝 Python output:', data.toString());
        });
        
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.error('❌ Python error:', data.toString());
        });
        
        pythonProcess.on('close', async (code) => {
            clearTimeout(timeout); // Clear the timeout when process finishes
            
            if (code !== 0) {
                console.error(`❌ Python script exited with code ${code}`);
                console.error(`Error output: ${errorOutput}`);
                
                // If it was killed by timeout or failed, don't use fallback
                if (code === null || code === 1) {
                    console.error('❌ Python script failed or timed out');
                    reject(new Error(`Python script failed with code ${code}`));
                    return;
                }
                
                reject(new Error(`Python script failed with code ${code}`));
                return;
            }
            
            try {
                // Read the generated instructions file
                const instructionsPath = path.join(__dirname, 'generated_instructions.txt');
                const instructions = await fs.readFile(instructionsPath, 'utf8');
                console.log('✅ Instructions generated successfully!');
                resolve(instructions.trim());
            } catch (readError) {
                console.error('❌ Failed to read generated instructions:', readError);
                reject(new Error('Failed to read generated instructions'));
            }
        });
        
        pythonProcess.on('error', (error) => {
            clearTimeout(timeout); // Clear the timeout on error
            console.error('❌ Failed to start Python process:', error);
            reject(new Error('Failed to start Python process'));
        });
    });
}

// Fallback instructions function removed


/**
 * Check if Python dependencies are installed
 */
async function checkPythonDependencies() {
    console.log('🔍 Checking Python dependencies...');
    
    return new Promise((resolve) => {
        const pipCheck = spawn('pip', ['show', 'langchain-openai', 'playwright'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        pipCheck.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Python dependencies are installed');
                resolve(true);
            } else {
                console.log('⚠️  Python dependencies not found. Install with: pip install -r requirements.txt');
                resolve(false);
            }
        });
        
        pipCheck.on('error', () => {
            console.log('⚠️  Python or pip not found. Make sure Python is installed and in PATH');
            resolve(false);
        });
    });
}

export { generateInstructions, checkPythonDependencies }; 