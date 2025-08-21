// ESM script to fix TypeScript configuration
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function fixTsConfig() {
  try {
    console.log('🔄 Fixing TypeScript configuration...');
    
    // Update tsconfig.json
    const tsConfigPath = join(__dirname, 'tsconfig.json');
    let tsConfig = JSON.parse(await readFile(tsConfigPath, 'utf8'));
    
    // Update moduleResolution to Node
    tsConfig.compilerOptions.moduleResolution = "Node";
    
    // Add useUnknownInCatchVariables to false
    tsConfig.compilerOptions.useUnknownInCatchVariables = false;
    
    await writeFile(tsConfigPath, JSON.stringify(tsConfig, null, 2), 'utf8');
    console.log('✅ Fixed tsconfig.json');
    
    // Create a permanent tsconfig.temp.json
    const tsConfigTempPath = join(__dirname, 'tsconfig.temp.json');
    const tsConfigTemp = {
      "compilerOptions": {
        "target": "ESNext",
        "module": "ESNext",
        "moduleResolution": "Node",
        "esModuleInterop": true,
        "allowSyntheticDefaultImports": true,
        "strict": false,
        "skipLibCheck": true,
        "resolveJsonModule": true,
        "isolatedModules": true,
        "outDir": "./dist/js",
        "rootDir": "./src",
        "declaration": true,
        "declarationDir": "./dist/types",
        "lib": [
          "DOM",
          "DOM.Iterable",
          "ESNext"
        ],
        "allowJs": true,
        "useDefineForClassFields": true,
        "noImplicitAny": false,
        "strictNullChecks": false,
        "useUnknownInCatchVariables": false
      },
      "include": [
        "src/**/*.ts"
      ],
      "exclude": [
        "node_modules",
        "dist",
        "types"
      ]
    };
    
    await writeFile(tsConfigTempPath, JSON.stringify(tsConfigTemp, null, 2), 'utf8');
    console.log('✅ Created permanent tsconfig.temp.json');
    
    // Update tsconfig.node.json
    const tsConfigNodePath = join(__dirname, 'tsconfig.node.json');
    let tsConfigNode = JSON.parse(await readFile(tsConfigNodePath, 'utf8'));
    
    // Update moduleResolution to Node
    tsConfigNode.compilerOptions.moduleResolution = "Node";
    
    await writeFile(tsConfigNodePath, JSON.stringify(tsConfigNode, null, 2), 'utf8');
    console.log('✅ Fixed tsconfig.node.json');
    
    console.log('✅ All TypeScript configurations fixed successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to fix TypeScript configuration:', error);
    return false;
  }
}

// Run the fix
fixTsConfig()
  .then(success => {
    if (success) {
      console.log('✅ TypeScript configuration has been updated successfully');
    } else {
      console.error('❌ Failed to update TypeScript configuration');
      process.exit(1);
    }
  });
