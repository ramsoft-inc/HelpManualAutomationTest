// ESM script to transpile TypeScript files to JavaScript
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

async function transpileTypeScript() {
  try {
    console.log('🔄 Transpiling TypeScript files to JavaScript...');
    
    // Create a temporary tsconfig for transpilation
    const tempTsConfigPath = resolve(__dirname, 'tsconfig.transpile.json');
    const tsConfig = {
      compilerOptions: {
        target: "ESNext",
        module: "ESNext",
        moduleResolution: "Node",
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        skipLibCheck: true,
        resolveJsonModule: true,
        isolatedModules: true,
        outDir: "./dist/js",
        rootDir: "./src",
        declaration: false
      },
      include: ["src/**/*.ts"],
      exclude: ["node_modules", "dist"]
    };
    
    fs.writeFileSync(tempTsConfigPath, JSON.stringify(tsConfig, null, 2));
    console.log('✅ Created temporary tsconfig for transpilation');
    
    // Run tsc to transpile files
    const tscPath = resolve(__dirname, 'node_modules', '.bin', 'tsc');
    const command = `"${tscPath}" --project ${tempTsConfigPath}`;
    console.log(`🔄 Executing: ${command}`);
    
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('✅ TypeScript files transpiled successfully');
    
    // Clean up temporary tsconfig
    fs.unlinkSync(tempTsConfigPath);
    console.log('✅ Temporary tsconfig removed');
    
    return true;
  } catch (error) {
    console.error('❌ Transpilation failed:', error.message);
    return false;
  }
}

// Run the transpilation
transpileTypeScript().then(success => {
  if (success) {
    console.log('✅ Ready to import JavaScript files from dist/js directory');
  } else {
    console.error('❌ Failed to prepare JavaScript files');
    process.exit(1);
  }
});
