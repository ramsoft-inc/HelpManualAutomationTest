
                // This is a temporary runner to load TypeScript modules
                import { fileURLToPath } from 'url';
                import { dirname, resolve } from 'path';
                
                const __dirname = dirname(fileURLToPath(import.meta.url));
                const modulePath = resolve(__dirname, 'tracewrightt', 'src', 'run.ts');
                
                // Import and export the module
                export { default } from './tracewrightt/src/run.js';
            