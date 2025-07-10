import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Run the Python instruction generation script and return the generated instructions
 */
async function generateInstructions(scenarioType = "default") {
    console.log(`🔄 Generating browser automation instructions for mode: ${scenarioType}...`);
    
    return new Promise((resolve, reject) => {
        // Run the Python script with scenarioType as an argument
        const pythonProcess = spawn('python', ['browser_automation_instructions.py', scenarioType], {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
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
            if (code !== 0) {
                console.error(`❌ Python script exited with code ${code}`);
                console.error(`Error output: ${errorOutput}`);
                reject(new Error(`Python script failed with code ${code}`));
                return;
            }
            
            try {
                // Read the generated instructions file
                const instructionsPath = path.join(process.cwd(), 'generated_instructions.txt');
                const instructions = await fs.readFile(instructionsPath, 'utf8');
                console.log('✅ Instructions generated successfully!');
                resolve(instructions.trim());
            } catch (readError) {
                console.error('❌ Failed to read generated instructions:', readError);
                // Mode-specific fallback instructions if file reading fails
                const fallbackInstructions = getFallbackInstructions(scenarioType);
                resolve(fallbackInstructions.trim());
            }
        });
        
        pythonProcess.on('error', (error) => {
            console.error('❌ Failed to start Python process:', error);
            // Mode-specific fallback instructions if Python fails to start
            const fallbackInstructions = getFallbackInstructions(scenarioType);
            resolve(fallbackInstructions.trim());
        });
    });
}

/**
 * Get mode-specific fallback instructions
 */
function getFallbackInstructions(scenarioType) {
    const fallbackInstructions = {
        "ui_change": `
            - find the Pin place holder and enter the pin 145948
            - find the continue button and click on it
            - find any record in the worklist with a patient name and click on it
            - wait for any loading overlays or spinners to disappear completely
            - find the document viewer icon, which looks like a document or page icon, it may be in a circular wheel or toolbar, and click on it
            - take screenshots of any visible UI elements that need updating
            - if you see dropdowns or menus, take screenshots without clicking them
            Done
        `,
        "new_feature": `
            - find the Pin place holder and enter the pin 145948
            - find the continue button and click on it
            - find any record in the worklist with a patient name and click on it
            - wait for any loading overlays or spinners to disappear completely
            - navigate to the new feature area
            - take screenshots of the new feature elements
            - look for placeholder areas in the documentation and capture those screenshots
            Done
        `,
        "default": `
            - find the Pin place holder and enter the pin 145948
            - find the continue button and click on it
            - find any record in the worklist with a patient name and click on it
            - wait for any loading overlays or spinners to disappear completely
            - find the document viewer icon, which looks like a document or page icon, it may be in a circular wheel or toolbar, and click on it
            Done
        `
    };
    
    return fallbackInstructions[scenarioType] || fallbackInstructions["default"];
}

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