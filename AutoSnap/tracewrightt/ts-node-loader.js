// Custom loader for ts-node to handle .ts extensions in ESM
import { resolve as resolveTs } from 'ts-node/esm';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// Resolve TypeScript files
export function resolve(specifier, context, nextResolve) {
  const { parentURL = null } = context;

  // Check if the specifier ends with .ts
  if (specifier.endsWith('.ts')) {
    const resolved = new URL(specifier, parentURL);
    return {
      url: resolved.href,
      format: 'module'
    };
  }

  // Let ts-node handle the resolution for other cases
  return resolveTs(specifier, context, nextResolve);
}

// Load TypeScript files
export function load(url, context, nextLoad) {
  // Handle TypeScript files
  if (url.endsWith('.ts')) {
    const filePath = fileURLToPath(url);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return {
        format: 'module',
        source: content,
      };
    }
  }

  // Let ts-node handle loading for other cases
  return nextLoad(url);
}

// Get source for TypeScript files
export function getSource(url, context, nextGetSource) {
  if (url.endsWith('.ts')) {
    const filePath = fileURLToPath(url);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return { source: content };
    }
  }
  return nextGetSource(url);
}

// Transform TypeScript files
export function transformSource(source, context, nextTransformSource) {
  const { url } = context;
  
  if (url.endsWith('.ts')) {
    // Let ts-node handle the transformation
    return nextTransformSource(source, { ...context, format: 'module' });
  }
  
  return nextTransformSource(source, context);
}
