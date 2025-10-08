import { Page } from "@playwright/test";
import fs from "fs";
import path from "path";
import axios from "axios";
import { apiLogger, APILogEntry } from "./llm_providers/api_logger.js";
import { forceScreenshotWithRetries } from "./screenshot_helper.js";

// ---------------------------------------------------------------------------
// Robustly load the root-level Playwright config regardless of whether we are
// running from the source tree (ts-node) or a deeply nested compiled file in
// dist/esm/… .  We obtain an absolute path from the project root (assumed to be
// the current working directory when the consumer script is launched).
// ---------------------------------------------------------------------------
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Resolve to <cwd>/playwright.config.cjs (or .js if the CJS variant is absent).
let configPath = path.resolve(process.cwd(), "playwright.config.cjs");
if (!fs.existsSync(configPath)) {
  configPath = path.resolve(process.cwd(), "playwright.config.js");
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const playwrightConfig = fs.existsSync(configPath) ? require(configPath) : { aiConfig: {} };

// Create a global object to track token usage
// This avoids TypeScript errors with the global object
interface TokenStats {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalApiCalls: number;
}

// Create a global variable in a type-safe way
const globalStats: TokenStats = {
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalApiCalls: 0
};

interface RefinementContext {
  failingLocator: string;
  errorMessage: string;
  conflictingElementsHTML: string;
}

interface ContainerInfo {
  selector: string;
  type: 'card' | 'section' | 'panel' | 'container' | 'element';
  containsTarget: boolean;
  screenshotWorthy: boolean;
  description: string;
  children: string[];
  // Internal ranking fields (not sent verbatim to LLM)
  area?: number;
  hasTestId?: boolean;
  interactiveChildCount?: number;
}

interface ThinkingEntry {
  step?: number;
  code: string;
  thinking?: string;
  timestamp: string;
  url?: string;
}

export class AIUtilsEnhanced {
  private page: Page;
  private referenceImagesDir: string;
  private currentMdPath: string | null = null;
  public thinkingHistory: ThinkingEntry[] = [];
  private generatedImages: string[] = []; // Track generated image files
  private currentMode: string = 'default'; // Track current mode (ui_change, translation, etc.)
  private referenceImageSourcePath: string | null = null; // Track where reference image was found
  private isGitHubActions: boolean = false; // Track if running in GitHub Actions
  private repositoryRoot: string; // Track repository root path

  constructor(page: Page, referenceImagesDir: string = "./reference_images") {
    this.page = page;
    this.referenceImagesDir = referenceImagesDir;
    this.thinkingHistory = [];
    this.generatedImages = [];
    
    // Detect GitHub Actions environment
    this.isGitHubActions = !!(process.env.GITHUB_ACTIONS || process.env.CI);
    
    // Set repository root based on environment
    if (this.isGitHubActions) {
      // In GitHub Actions, GITHUB_WORKSPACE points to the repository root
      this.repositoryRoot = process.env.GITHUB_WORKSPACE || process.cwd();
      console.log(`🤖 GitHub Actions detected. Repository root: ${this.repositoryRoot}`);
    } else {
      // Local development - try to detect repository root or use current working directory
      this.repositoryRoot = this.findRepositoryRoot();
      console.log(`💻 Local environment detected. Repository root: ${this.repositoryRoot}`);
    }
    
    // Token statistics will be shown at the end of execution
  }
  
  /**
   * Set the current markdown file path
   * This should be called by the page helper when processing a markdown file
   * Handles path resolution for both local and GitHub Actions environments
   */
  public setCurrentMdFilePath(mdPath: string): void {
    console.log(`📝 AIUtilsEnhanced: Setting current markdown file path: ${mdPath}`);
    
    // Normalize the path for the current environment
    const normalizedPath = this.normalizePath(mdPath);
    this.currentMdPath = normalizedPath;
    
    console.log(`📝 AIUtilsEnhanced: Confirmed currentMdPath set to: ${this.currentMdPath}`);
    console.log(`🌍 Environment: ${this.isGitHubActions ? 'GitHub Actions' : 'Local'}`);
    
    // Also set it as an environment variable for other components
    process.env.CURRENT_MD_PATH = normalizedPath;
    
    // Create img folder in the directory where the markdown file is located
    this.ensureImgFolder();
  }

  /**
   * Normalize a path for the current environment
   * Converts between local absolute paths and repository-relative paths
   */
  private normalizePath(inputPath: string): string {
    if (this.isGitHubActions) {
      // In GitHub Actions, ensure we're working with absolute paths from GITHUB_WORKSPACE
      if (path.isAbsolute(inputPath)) {
        // If already absolute, check if it's within the workspace
        if (inputPath.startsWith(this.repositoryRoot)) {
          return inputPath;
        } else {
          // Convert to workspace-relative
          const relativePath = path.relative(this.getDocsDirectory(), inputPath);
          return path.join(this.getDocsDirectory(), relativePath);
        }
      } else {
        // Convert relative path to absolute within workspace
        return path.resolve(this.repositoryRoot, inputPath);
      }
    } else {
      // Local development - handle various path formats
      if (path.isAbsolute(inputPath)) {
        return inputPath;
      } else {
        // Convert relative path to absolute
        // Try relative to docs directory first
        const docsRelativePath = path.resolve(this.getDocsDirectory(), inputPath);
        if (fs.existsSync(docsRelativePath)) {
          return docsRelativePath;
        }
        
        // Fallback to current working directory
        return path.resolve(process.cwd(), inputPath);
      }
    }
  }
  
  /**
   * Ensure img folder exists in the current markdown file directory
   */
  private ensureImgFolder(): void {
    console.log(`🔍 ensureImgFolder called, currentMdPath: ${this.currentMdPath}`);
    if (!this.currentMdPath) {
      console.log('⚠️  No current markdown path set, cannot create img folder');
      return;
    }
    
    try {
      const mdDir = path.dirname(this.currentMdPath);
      const imgDir = path.join(mdDir, 'img');
      
      if (!fs.existsSync(imgDir)) {
        fs.mkdirSync(imgDir, { recursive: true });
        console.log(`📁 Created img directory: ${imgDir}`);
      } else {
        console.log(`📁 img directory already exists: ${imgDir}`);
      }
      
      // Store the img path for use in screenshot operations
      process.env.IMG_PATH = imgDir;
    } catch (error) {
      console.error('❌ Error creating img folder:', error);
    }
  }
  
  /**
   * Get the img folder path for the current markdown file
   */
  public getImgPath(): string | null {
    // Allow disabling img behavior entirely via env flag
    if (process.env.DISABLE_IMG === 'true') {
      return null;
    }
    if (!this.currentMdPath) {
      return null;
    }
    
    const mdDir = path.dirname(this.currentMdPath);
    return path.join(mdDir, 'img');
  }
  
  /**
   * Get the current markdown file path
   */
  public getCurrentMdFilePath(): string | null {
    return this.currentMdPath;
  }
  
  /**
   * Update the current file path during processing
   * This can be called by external components to change the active file
   */
  public updateCurrentFile(newFilePath: string): void {
    console.log(`🔄 AIUtilsEnhanced: Updating current file from ${this.currentMdPath} to ${newFilePath}`);
    this.setCurrentMdFilePath(newFilePath);
  }
  
  /**
   * Set the current mode (ui_change, translation, etc.)
   */
  public setCurrentMode(mode: string): void {
    console.log(`🔧 AIUtilsEnhanced: Setting current mode to: ${mode}`);
    this.currentMode = mode;
  }
  
  /**
   * Get the current mode
   */
  public getCurrentMode(): string {
    return this.currentMode;
  }

  /**
   * Find the repository root in local development
   */
  private findRepositoryRoot(): string {
    let currentDir = process.cwd();
    
    // Walk up the directory tree looking for common repository indicators
    const repoIndicators = ['.git', 'package.json', 'docs', 'AutoSnap'];
    
    while (currentDir !== path.dirname(currentDir)) { // Until we reach root
      const hasIndicator = repoIndicators.some(indicator => {
        const indicatorPath = path.join(currentDir, indicator);
        return fs.existsSync(indicatorPath);
      });
      
      if (hasIndicator) {
        console.log(`📂 Found repository root: ${currentDir}`);
        return currentDir;
      }
      
      currentDir = path.dirname(currentDir);
    }
    
    // If no repository root found, use current working directory
    console.log(`⚠️ Repository root not detected, using current directory: ${process.cwd()}`);
    return process.cwd();
  }

  /**
   * Get the docs directory path (environment-aware)
   */
  private getDocsDirectory(): string {
    if (this.isGitHubActions) {
      // In GitHub Actions, use repository root + docs
      const docsPath = path.join(this.repositoryRoot, 'docs');
      console.log(`🤖 GitHub Actions docs path: ${docsPath}`);
      return docsPath;
    } else {
      // Local development - try multiple detection strategies
      
      // Strategy 1: Repository root + docs
      const repoDocsPath = path.join(this.repositoryRoot, 'docs');
      if (fs.existsSync(repoDocsPath)) {
        console.log(`💻 Local docs path (repo root): ${repoDocsPath}`);
        return repoDocsPath;
      }
      
      // Strategy 2: Look for docs directory in common locations
      const commonPaths = [
        'C:/Users/Rohith.MR/test/HelpManualAutomationTest/docs',
        path.join(process.cwd(), 'docs'),
        path.join(process.cwd(), '..', 'docs'),
        path.join(process.cwd(), 'HelpManualAutomationTest', 'docs')
      ];
      
      for (const docsPath of commonPaths) {
        if (fs.existsSync(docsPath)) {
          console.log(`💻 Local docs path (fallback): ${docsPath}`);
          return docsPath;
        }
      }
      
      // Strategy 3: Use repository root + docs as fallback (even if it doesn't exist)
      console.log(`⚠️ Docs directory not found, using fallback: ${repoDocsPath}`);
      return repoDocsPath;
    }
  }

  /**
   * Convert a relative path from the docs directory to an absolute path
   */
  private resolveFromDocsDir(relativePath: string): string {
    const docsDir = this.getDocsDirectory();
    return path.join(docsDir, relativePath);
  }

  /**
   * Get the relative path from docs directory to a given path
   */
  private getRelativeToDocsDir(absolutePath: string): string {
    const docsDir = this.getDocsDirectory();
    return path.relative(docsDir, absolutePath);
  }

  /**
   * Get environment information for debugging
   */
  public getEnvironmentInfo(): object {
    return {
      isGitHubActions: this.isGitHubActions,
      repositoryRoot: this.repositoryRoot,
      docsDirectory: this.getDocsDirectory(),
      currentMdPath: this.currentMdPath,
      currentMode: this.currentMode,
      workingDirectory: process.cwd(),
      env: {
        GITHUB_WORKSPACE: process.env.GITHUB_WORKSPACE,
        GITHUB_ACTIONS: process.env.GITHUB_ACTIONS,
        CI: process.env.CI
      }
    };
  }
  
  /**
   * Get the appropriate save path for screenshots based on mode
   */
  public getScreenshotSavePath(): string | null {
    if (this.currentMode === 'ui_change') {
      if (this.referenceImageSourcePath) {
        console.log(`📁 Using reference image source path for ui_change mode: ${this.referenceImageSourcePath}`);
        return this.referenceImageSourcePath;
      } else {
        // When no reference image found, find best folder in document directory structure
        if (this.currentMdPath) {
          const currentDocDir = path.dirname(this.currentMdPath);
          const bestSaveDir = this.findBestSaveDirectory(currentDocDir);
          
          console.log(`📁 No reference image found, using best save directory for ui_change mode: ${bestSaveDir}`);
          return bestSaveDir;
        } else {
          console.log(`📁 No reference image and no current document path, falling back to img`);
          return this.getImgPath();
        }
      }
    }
    
    // For other modes, use img folder
    return this.getImgPath();
  }
  
  /**
   * Find the best directory to save screenshots when no reference image is found
   * Priority: existing folders under document directory > create img folder
   */
  private findBestSaveDirectory(currentDocDir: string): string {
    try {
      console.log(`🔍 Finding best save directory under: ${currentDocDir}`);
      
      if (!fs.existsSync(currentDocDir)) {
        console.log(`⚠️ Document directory does not exist: ${currentDocDir}`);
        return currentDocDir;
      }
      
      // Get all subdirectories in the current document directory
      const items = fs.readdirSync(currentDocDir);
      const subdirectories = items.filter(item => {
        const itemPath = path.join(currentDocDir, item);
        try {
          return fs.existsSync(itemPath) && fs.lstatSync(itemPath).isDirectory();
        } catch (e) {
          return false;
        }
      }).filter(dir => {
        // Skip common non-content directories
        const skipDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', 'out', 'img'];
        return !skipDirs.includes(dir);
      });
      
      console.log(`📂 Found ${subdirectories.length} subdirectories: ${subdirectories.join(', ')}`);
      
      if (subdirectories.length > 0) {
        // Check if any subdirectory already has an img or images folder
        for (const subdir of subdirectories) {
          const subdirPath = path.join(currentDocDir, subdir);
          const commonImageDirs = ['img', 'images', 'Images', 'IMG', 'assets', 'screenshots'];
          
          for (const imgDirName of commonImageDirs) {
            const imgDir = path.join(subdirPath, imgDirName);
            if (fs.existsSync(imgDir) && fs.lstatSync(imgDir).isDirectory()) {
              console.log(`✅ Found existing image directory: ${imgDir}`);
              return imgDir;
            }
          }
        }
        
        // No image directories found, use the first available subdirectory
        const targetSubdir = subdirectories[0];
        const targetSubdirPath = path.join(currentDocDir, targetSubdir);
        
        console.log(`📁 Using existing subdirectory: ${targetSubdirPath}`);
        return targetSubdirPath;
      } else {
        // No subdirectories found, create img folder in root document directory
        const imgDir = path.join(currentDocDir, 'img');
        
        if (!fs.existsSync(imgDir)) {
          try {
            fs.mkdirSync(imgDir, { recursive: true });
            console.log(`📁 Created img directory: ${imgDir}`);
          } catch (error) {
            console.error(`❌ Failed to create img directory: ${error}`);
            // Return document directory as fallback
            return currentDocDir;
          }
        } else {
          console.log(`📁 Using existing img directory: ${imgDir}`);
        }
        
        return imgDir;
      }
      
    } catch (error) {
      console.error(`❌ Error finding best save directory: ${error}`);
      // Return document directory as ultimate fallback
      return currentDocDir;
    }
  }

  /**
   * Track a generated image file
   */
  public trackGeneratedImage(imagePath: string): void {
    if (!this.generatedImages.includes(imagePath)) {
      this.generatedImages.push(imagePath);
      console.log(`📸 Tracked generated image: ${imagePath}`);
    }
  }
  
  /**
   * Get list of generated images
   */
  public getGeneratedImages(): string[] {
    return [...this.generatedImages];
  }
  
  /**
   * Update a single image path in the markdown file immediately after it's saved
   * This is called from screenshot_helper.ts after each successful screenshot
   */
  public async updateSingleImagePath(imagePath: string): Promise<void> {
    if (!this.currentMdPath) {
      console.log('⚠️  No current markdown path set, skipping single image path update');
      return;
    }
    
    try {
      console.log(`📝 IMMEDIATE UPDATE: Updating single image path in ${this.currentMdPath} for: ${imagePath}`);
      
      // Extract the filename from the image path
      const imageName = path.basename(imagePath);
      console.log(`🔍 Processing image: ${imageName}`);
      
      // Read the markdown file
      const mdContent = fs.readFileSync(this.currentMdPath, 'utf8');
      
      // Track the generated image
      this.trackGeneratedImage(imagePath);
      
      let updatedContent = mdContent;
      let updatesCount = 0;
      
      // Update image paths in markdown content for this specific image
      const imagePatterns = [
        // Markdown image syntax: ![alt](path/to/image.ext)
        /!\[([^\]]*)\]\(([^)]+\.(png|jpg|jpeg|gif|bmp|webp|svg))\)/gi,
        // HTML img tags: <img src="path/to/image.ext">
        /<img[^>]+src=["']([^"']+\.(png|jpg|jpeg|gif|bmp|webp|svg))["'][^>]*>/gi,
        // HTML img tags with self-closing syntax
        /<img[^>]+src=["']([^"']+\.(png|jpg|jpeg|gif|bmp|webp|svg))["'][^>]*\/?>/gi
      ];
      
      for (const pattern of imagePatterns) {
        updatedContent = updatedContent.replace(pattern, (match, ...groups) => {
          // Extract the full image path from the match
          const fullImagePath = groups.find(group => group && group.includes('.'));
          if (!fullImagePath) return match;
          
          // Extract just the filename from the path (last part after /)
          const foundImageName = path.basename(fullImagePath);
          
          // Get the base names without extensions for comparison
          const foundBaseName = path.basename(foundImageName, path.extname(foundImageName));
          const newBaseName = path.basename(imageName, path.extname(imageName));
          
          // Remove any _E or _S suffixes from the new image name to get the clean base name
          let cleanNewBaseName = newBaseName;
          if (newBaseName.endsWith('_E') || newBaseName.endsWith('_S')) {
            cleanNewBaseName = newBaseName.replace(/[_][ES]$/, '');
            // If there's still an _S suffix (from stock version), remove that too  
            cleanNewBaseName = cleanNewBaseName.replace(/[_]S$/, '');
          }
          
          // Check if this image should be updated - only if it's an exact match
          const shouldUpdate = foundImageName === imageName || 
                              foundImageName.toLowerCase() === imageName.toLowerCase() ||
                              foundBaseName === cleanNewBaseName;
          
          console.log(`🔍 Image comparison: Found=${foundBaseName}, New=${cleanNewBaseName}, Match=${shouldUpdate}`);
          
          if (shouldUpdate) {
            // Check if the image already exists at the target location
            const imgDir = this.getImgPath();
            if (!imgDir) {
              console.log(`⚠️  No img directory available, skipping image path update`);
              return match; // No change if no img directory
            }
            const targetImagePath = path.join(imgDir, imageName);
            
            // Only update if the image exists at the same location or doesn't exist yet
            if (fs.existsSync(targetImagePath) || !fs.existsSync(path.join(imgDir, foundImageName))) {
              // Use the original image name without any _E or _S suffixes
              const newPath = `img/${imageName}`;
              
              // Check if the path is already pointing to img with the same filename
              if (fullImagePath === newPath) {
                console.log(`ℹ️  Image path already correct: ${fullImagePath}`);
                return match; // No change needed
              }
              
              // Replace the original path with the new img path
              const updatedMatch = match.replace(fullImagePath, newPath);
              console.log(`🔄 Updated single image path: ${fullImagePath} → ${newPath}`);
              updatesCount++;
              return updatedMatch;
            } else {
              console.log(`ℹ️  Skipping update - image exists at target location and doesn't match: ${foundImageName}`);
              return match; // No change if image exists but doesn't match
            }
          }
          
          return match; // No change if not our target image
        });
      }
      
      // Write back the updated content if changes were made
      if (updatesCount > 0) {
        fs.writeFileSync(this.currentMdPath, updatedContent, 'utf8');
        console.log(`✅ IMMEDIATE UPDATE COMPLETE: Updated ${updatesCount} references for ${imageName} in ${this.currentMdPath}`);
      } else {
        console.log(`ℹ️  IMMEDIATE UPDATE: No image path references found for ${imageName} in markdown file`);
      }
      
    } catch (error) {
      console.error('❌ Error during single image path update:', error);
    }
  }

  /**
   * Check if an image already exists and return the original image name
   * No longer uses _E or _S versions as per requirements
   */
  private chooseBestImageVersion(currentImageName: string): string {
    try {
      const currentBaseName = path.basename(currentImageName, path.extname(currentImageName));
      const extension = path.extname(currentImageName);
      const imgDir = this.getImgPath();
      
      if (!imgDir) {
        console.log(`⚠️  No img directory available, using current image: ${currentImageName}`);
        return currentImageName;
      }
      
      // Extract the true base name by removing all _E and _S suffixes
      let baseName = currentBaseName;
      // Keep removing _E and _S suffixes until we get the base name
      while (baseName.endsWith('_E') || baseName.endsWith('_S')) {
        baseName = baseName.replace(/[_][ES]$/, '');
      }
      
      console.log(`🔍 Extracted base name: ${currentBaseName} → ${baseName}`);
      
      // Check if the base image exists (without _E or _S suffixes)
      const baseImageName = `${baseName}${extension}`;
      const baseImagePath = path.join(imgDir, baseImageName);
      
      // Check if the current image (possibly with _E or _S) exists
      const currentImagePath = path.join(imgDir, currentImageName);
      
      console.log(`🔍 Checking for base image: ${baseImageName}`);
      console.log(`🔍 Checking for current image: ${currentImageName}`);
      
      // If the base image exists, use it
      if (fs.existsSync(baseImagePath)) {
        console.log(`✅ Found base image: ${baseImageName} - using it`);
        return baseImageName;
      }
      
      // If the current image exists, use it
      if (fs.existsSync(currentImagePath)) {
        console.log(`✅ Found current image: ${currentImageName} - using it`);
        return currentImageName;
      }
      
      // If neither exists, use the base image name (without suffixes)
      console.log(`⚠️  Neither base nor current image found in img, using base name: ${baseImageName}`);
      return baseImageName;
      
    } catch (error) {
      console.warn(`⚠️  Error checking image version for ${currentImageName}:`, error);
      return currentImageName;
    }
  }

  /**
   * Get image resolution (width x height in pixels) from image file
   * Returns object with width, height, and total pixels
   */
  private getImageResolution(imagePath: string): { width: number; height: number; pixels: number } {
    try {
      // Try to read PNG image dimensions from file header
      const buffer = fs.readFileSync(imagePath);
      
      if (imagePath.toLowerCase().endsWith('.png')) {
        // PNG format: width and height are at bytes 16-19 and 20-23 respectively
        if (buffer.length >= 24 && buffer.toString('ascii', 1, 4) === 'PNG') {
          const width = buffer.readUInt32BE(16);
          const height = buffer.readUInt32BE(20);
          const pixels = width * height;
          return { width, height, pixels };
        }
      } else if (imagePath.toLowerCase().endsWith('.jpg') || imagePath.toLowerCase().endsWith('.jpeg')) {
        // For JPEG, we'll use file size as a proxy for resolution (since parsing JPEG headers is complex)
        const stats = fs.statSync(imagePath);
        const fileSize = stats.size;
        // Estimate pixels based on file size (rough approximation)
        const estimatedPixels = Math.floor(fileSize / 3); // Rough estimate: 3 bytes per pixel
        return { width: 0, height: 0, pixels: estimatedPixels };
      }
      
      // Fallback: use file size as approximation
      const stats = fs.statSync(imagePath);
      const fileSize = stats.size;
      const estimatedPixels = Math.floor(fileSize / 3);
      console.log(`⚠️  Could not parse image dimensions for ${imagePath}, using file size approximation`);
      return { width: 0, height: 0, pixels: estimatedPixels };
      
    } catch (error) {
      console.warn(`⚠️  Error reading image resolution for ${imagePath}:`, error);
      // Return minimal values as fallback
      return { width: 0, height: 0, pixels: 1 };
    }
  }

  /**
   * Post-process markdown file to update image paths
   * Only for ui_change and translation modes
   */
  public async postProcessMarkdownImagePaths(mode: string): Promise<void> {
    if (!this.currentMdPath) {
      console.log('⚠️  No current markdown path set, skipping post-processing');
      return;
    }
    
    // Only process for ui_change and translation modes
    if (mode !== 'ui_change' && mode !== 'translation') {
      console.log(`ℹ️  Skipping image path post-processing for mode: ${mode}`);
      return;
    }
    
    try {
      console.log(`🔄 Post-processing image paths in ${this.currentMdPath} for mode: ${mode}`);
      
      // Read the markdown file
      const mdContent = fs.readFileSync(this.currentMdPath, 'utf8');
      
      // Get the img directory
      const imgPath = this.getImgPath();
      if (!imgPath || !fs.existsSync(imgPath)) {
        console.log('⚠️  img directory not found, skipping post-processing');
        return;
      }
      
      // Get all images in img directory
      const imageFiles = fs.readdirSync(imgPath)
        .filter(file => /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(file));
      
      console.log(`📁 Found ${imageFiles.length} images in img directory:`, imageFiles);
      
      if (imageFiles.length === 0) {
        console.log('ℹ️  No images found in img directory, nothing to update');
        return;
      }
      
      let updatedContent = mdContent;
      let updatesCount = 0;
      
      // Update image paths in markdown content
      // Look for ALL image reference patterns (any folder structure, including existing img)
      const imagePatterns = [
        // Markdown image syntax: ![alt](path/to/image.ext) - includes img and any other folder
        /!\[([^\]]*)\]\(([^)]+\.(png|jpg|jpeg|gif|bmp|webp|svg))\)/gi,
        // HTML img tags: <img src="path/to/image.ext"> - includes img and any other folder
        /<img[^>]+src=["']([^"']+\.(png|jpg|jpeg|gif|bmp|webp|svg))["'][^>]*>/gi,
        // HTML img tags with self-closing syntax - includes img and any other folder
        /<img[^>]+src=["']([^"']+\.(png|jpg|jpeg|gif|bmp|webp|svg))["'][^>]*\/?>/gi
      ];
      
      for (const pattern of imagePatterns) {
        updatedContent = updatedContent.replace(pattern, (match, ...groups) => {
          // Extract the full image path from the match
          const fullImagePath = groups.find(group => group && group.includes('.'));
          if (!fullImagePath) return match;
          
          // Extract just the filename from the path (last part after /)
          const imageName = path.basename(fullImagePath);
          
          console.log(`🔍 Found image reference: ${fullImagePath} → filename: ${imageName}`);
          
          // Check if this image filename exists in img directory
          // Priority: exact match > case-insensitive match > base name match > similar name match
          let matchingImage = imageFiles.find(file => {
            const fileName = path.basename(file);
            return fileName === imageName; // Exact match first
          });
          
          if (!matchingImage) {
            // Try case-insensitive match
            matchingImage = imageFiles.find(file => {
              const fileName = path.basename(file);
              return fileName.toLowerCase() === imageName.toLowerCase();
            });
          }
          
          if (!matchingImage) {
            // Try base name match (without extension)
            matchingImage = imageFiles.find(file => {
              const fileName = path.basename(file);
              return path.basename(fileName, path.extname(fileName)) === path.basename(imageName, path.extname(imageName));
            });
          }
          
          if (!matchingImage) {
            // Try finding similar names (for retaken screenshots with timestamps/versions)
            const baseImageName = path.basename(imageName, path.extname(imageName));
            const baseImageNameClean = baseImageName.replace(/[_-][ES]$/i, '');
            
            // Find all potential matches - focus on _E/_S suffix matching only
            const potentialMatches = imageFiles.filter(file => {
              const fileName = path.basename(file);
              const baseFileName = path.basename(fileName, path.extname(fileName));
              const baseFileNameClean = baseFileName.replace(/[_-][ES]$/i, '');
              
              // Only match if base names are exactly the same after removing _E/_S suffixes
              return baseImageNameClean === baseFileNameClean;
            });
            
            if (potentialMatches.length > 0) {
              // ALWAYS prefer Enhanced (_E) over Stock (_S) - Enhanced is the target
              const enhancedMatch = potentialMatches.find(file => file.includes('_E'));
              const stockMatch = potentialMatches.find(file => file.includes('_S'));
              
              if (enhancedMatch) {
                matchingImage = enhancedMatch;
                console.log(`🎯 Using Enhanced version: ${enhancedMatch}`);
              } else if (stockMatch) {
                matchingImage = stockMatch;
                console.log(`📸 Using Stock version (Enhanced not available): ${stockMatch}`);
              } else {
                // Use the first match if no _E/_S suffixes
                matchingImage = potentialMatches[0];
                console.log(`📄 Using available version: ${potentialMatches[0]}`);
              }
            }
          }
          
          if (matchingImage) {
            const newPath = `img/${matchingImage}`;
            
            // Log the type of match found
            if (matchingImage === imageName) {
              console.log(`✅ Exact match found: ${imageName} → ${matchingImage}`);
            } else if (matchingImage.toLowerCase() === imageName.toLowerCase()) {
              console.log(`📝 Case-insensitive match found: ${imageName} → ${matchingImage}`);
            } else if (path.basename(matchingImage, path.extname(matchingImage)) === path.basename(imageName, path.extname(imageName))) {
              console.log(`🔄 Base name match found: ${imageName} → ${matchingImage}`);
            } else {
              // Check if it's an _E/_S suffix match
              const baseImageName = path.basename(imageName, path.extname(imageName));
              const baseFileName = path.basename(matchingImage, path.extname(matchingImage));
              const baseImageNameClean = baseImageName.replace(/[_-][ES]$/i, '');
              const baseFileNameClean = baseFileName.replace(/[_-][ES]$/i, '');
              
              if (baseImageNameClean === baseFileNameClean) {
                if (matchingImage.includes('_E')) {
                  console.log(`🎯 Enhanced suffix match: ${imageName} → ${matchingImage}`);
                } else if (matchingImage.includes('_S')) {
                  console.log(`📸 Stock suffix match: ${imageName} → ${matchingImage}`);
                } else {
                  console.log(`🔄 Base name suffix match: ${imageName} → ${matchingImage}`);
                }
              } else {
                console.log(`🔍 Similar name match found: ${imageName} → ${matchingImage}`);
              }
            }
            
            // Check if the path is already pointing to img with the same filename
            if (fullImagePath === newPath) {
              console.log(`ℹ️  Image path already correct: ${fullImagePath}`);
              return match; // No change needed
            }
            
            // Replace the original path with the new img path
            const updatedMatch = match.replace(fullImagePath, newPath);
            console.log(`🔄 Updated image path: ${fullImagePath} → ${newPath}`);
            updatesCount++;
            return updatedMatch;
          } else {
            console.log(`⚠️  No matching image found for: ${imageName}`);
          }
          
          return match; // No change if image not found
        });
      }
      
      // Write back the updated content if changes were made
      if (updatesCount > 0) {
        fs.writeFileSync(this.currentMdPath, updatedContent, 'utf8');
        console.log(`✅ Post-processing complete: Updated ${updatesCount} image paths in ${this.currentMdPath}`);
      } else {
        console.log('ℹ️  No image paths needed updating');
      }
      
    } catch (error) {
      console.error('❌ Error during markdown post-processing:', error);
    }
  }
  
  /**
   * Write comprehensive token usage summary to a log file
   * This is called at the end of execution
   */
  public writeTokenUsageSummary(outputPath: string = 'token_usage_summary.txt', thinkingLogPath: string = 'ai_thinking_log.txt'): void {
    try {
      // Write token usage summary
      const timestamp = new Date().toISOString();
      
      // Format numbers with commas for readability
      const formatNumber = (num: number): string => num.toLocaleString();
      
      const summary = [
        `\n=============================================`,
        `        COMPREHENSIVE TOKEN USAGE REPORT`,
        `             ${timestamp}`,
        `=============================================`,
        `Total Input Tokens:        ${formatNumber(globalStats.totalInputTokens)}`,
        `Total Output Tokens:       ${formatNumber(globalStats.totalOutputTokens)}`,
        `TOTAL TOKENS USED:         ${formatNumber(globalStats.totalInputTokens + globalStats.totalOutputTokens)}`,
        `---------------------------------------------`,
        `Total API Calls:           ${formatNumber(globalStats.totalApiCalls)}`,
        `Average Tokens Per Call:   ${formatNumber(Math.round((globalStats.totalInputTokens + globalStats.totalOutputTokens) / (globalStats.totalApiCalls || 1)))}`,
        `---------------------------------------------`,
        `Estimated Cost ($0.0005/1K tokens): $${((globalStats.totalInputTokens + globalStats.totalOutputTokens) * 0.0005 / 1000).toFixed(4)}`,
        `=============================================`
      ].join('\n');
      
      fs.appendFileSync(outputPath, summary + '\n\n');
      
      // Print the final report to console as well
      
      // Write AI thinking logs if we have any stored
      if (this.thinkingHistory && this.thinkingHistory.length > 0) {
        const thinkingLog = [
          `\n===== AI Thinking Log (${timestamp}) =====`,
          ...this.thinkingHistory.map((entry, index) => 
            `\n--- Step ${index + 1} ---\n${entry.thinking || 'No thinking provided'}`
          ),
          '\n=========================================='
        ].join('\n');
        
        fs.appendFileSync(thinkingLogPath, thinkingLog + '\n\n');
        console.log(`🧠 AI thinking log written to ${thinkingLogPath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to write logs: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Build a rich, hierarchical summary of visible containers and their interactive elements.
   * This is designed to give the LLM a high-fidelity mental model of the page structure.
   */
  public async getSmartVisibleContainersSummary(): Promise<{
    url: string;
    viewport: { width: number; height: number };
    containers: Array<{
      uid: number;
      selector: string;
      type: string;
      semanticTag?: string;
      testId?: string;
      id?: string;
      role?: string;
      ariaLabel?: string;
      classes?: string;
      bbox: { x: number; y: number; width: number; height: number };
      area: number;
      zIndex: number;
      scrollable: boolean;
      isLandmark: boolean;
      isModalLike: boolean;
      headerText?: string;
      textChunks?: string[];
      elementCount: number;
      interactiveCount: number;
      parentUid?: number;
      childrenUids: number[];
      nestedContainerUids?: number[];
    }>;
    elements: Array<{
      uid: number;
      containerUid?: number;
      tag: string;
      role?: string;
      testId?: string;
      id?: string;
      name?: string;
      ariaLabel?: string;
      title?: string;
      text?: string;
      bbox: { x: number; y: number; width: number; height: number };
      ancestorTestIds?: string[];
    }>;
    landmarks: number[]; // container uids with landmark semantics
  }> {
    return await this.page.evaluate(() => {
      function isVisible(el: HTMLElement): boolean {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity || '1') === 0) return false;
        return true;
      }

      function isScrollable(el: HTMLElement): boolean {
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        return (overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
      }

      function getZIndex(el: HTMLElement): number {
        const z = window.getComputedStyle(el).zIndex;
        const n = Number(z);
        return Number.isFinite(n) ? n : 0;
      }

      function getUniqueSelector(el: HTMLElement, maxDepth = 5): string {
        if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
        if (el.id && !/^mui-|^id\d+|.*-\d+$/.test(el.id)) return `#${el.id}`;
        const classes = (el.className && typeof el.className === 'string') ? el.className.trim().split(/\s+/).filter(Boolean) : [];
        if (classes.length > 0) {
          const clsSel = '.' + classes.slice(0, 3).join('.');
          if (document.querySelectorAll(clsSel).length === 1) return clsSel;
        }
        let current: HTMLElement | null = el;
        let depth = 0;
        const parts: string[] = [];
        while (current && depth < maxDepth) {
          let part = current.tagName.toLowerCase();
          if (current.id && !/^mui-|^id\d+|.*-\d+$/.test(current.id)) {
            part += `#${current.id}`;
            parts.unshift(part);
            break;
          } else if (current.getAttribute('data-testid')) {
            part += `[data-testid="${current.getAttribute('data-testid')}" ]`;
            parts.unshift(part);
            break;
          } else {
            const parent = current.parentElement;
            if (!parent) { parts.unshift(part); break; }
            const index = Array.from(parent.children).indexOf(current) + 1;
            part += `:nth-child(${index})`;
            parts.unshift(part);
          }
          current = current.parentElement;
          depth++;
        }
        return parts.join(' > ');
      }

      function collectTextContent(root: HTMLElement): {
        textChunks: string[];
      } {
        const text = (root.innerText || '').trim();
        
        // Split text into paragraphs/sentences and truncate each to 20 words
        const paragraphs = text.split(/\n\s*\n|\.\s+/).filter(p => p.trim().length > 0);
        const textChunks = paragraphs.map(paragraph => {
          const words = paragraph.trim().split(/\s+/);
          if (words.length <= 20) {
            return paragraph.trim();
          }
          return words.slice(0, 20).join(' ') + '...';
        }).slice(0, 5); // Limit to 5 chunks to avoid overwhelming the prompt
        
        return {
          textChunks
        };
      }

      const candidateSelectors = [
        'main', 'section', 'article', 'aside', 'nav', 'header', 'footer',
        '[role="main"]', '[role="navigation"]', '[role="dialog"]', '[role="menu"]', '[role="toolbar"]', '[role="region"]',
        '[data-testid]', '.MuiCard-root', '.MuiPaper-root', '.MuiAccordion-root', '.MuiDialog-root', '.modal', '.dialog',
        'form', 'fieldset', 'div[class*="container"], div[class*="panel"], div[class*="card"], div[class*="section"]'
      ];

      const allCandidates = new Set<HTMLElement>();
      for (const sel of candidateSelectors) {
        document.querySelectorAll(sel).forEach(el => { if (el instanceof HTMLElement) allCandidates.add(el); });
      }

      const containersRaw: Array<any> = [];
      let uidCounter = 1;
      for (const el of allCandidates) {
        if (!isVisible(el)) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width < 100 || rect.height < 60) continue;
        const role = el.getAttribute('role') || undefined;
        const testId = el.getAttribute('data-testid') || undefined;
        const semanticTag = el.tagName.toLowerCase();
        const classes = (el.className && typeof el.className === 'string') ? el.className.split(' ').filter(Boolean).slice(0, 8).join(' ') : undefined;
        const ariaLabel = el.getAttribute('aria-label') || undefined;
        const id = el.id || undefined;
        const header = el.querySelector('h1,h2,h3,h4,h5,h6');
        const headerText = header && isVisible(header as HTMLElement) ? (header as HTMLElement).innerText.trim().substring(0, 120) : undefined;
        const textInfo = collectTextContent(el);
        const container = {
          uid: uidCounter++,
          el,
          selector: getUniqueSelector(el),
          type: (classes || '').includes('Card') || (classes || '').toLowerCase().includes('card') ? 'card'
                : (classes || '').toLowerCase().includes('panel') ? 'panel'
                : (classes || '').toLowerCase().includes('container') ? 'container'
                : ['main','section','article','aside','nav','header','footer'].includes(semanticTag) ? 'section'
                : 'element',
          semanticTag,
          testId,
          id,
          role,
          ariaLabel,
          classes,
          bbox: { x: Math.round(rect.left), y: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) },
          area: Math.round(rect.width * rect.height),
          zIndex: getZIndex(el),
          scrollable: isScrollable(el),
          isLandmark: ['main','nav','header','footer'].includes(semanticTag) || ['main','navigation','dialog','menu','region','toolbar'].includes(role || ''),
          isModalLike: (role === 'dialog') || el.getAttribute('aria-modal') === 'true' || (classes || '').toLowerCase().includes('modal') || (classes || '').toLowerCase().includes('dialog'),
          headerText,
          textChunks: textInfo.textChunks,
          elementCount: 0,
          interactiveCount: 0,
          parentUid: undefined as number | undefined,
          childrenUids: [] as number[],
          nestedContainerUids: [] as number[], // Track containers inside this container
        };
        containersRaw.push(container);
      }

      // Establish parent-child relationships among containers
      for (const c of containersRaw) {
        let closestParent: any | null = null;
        for (const p of containersRaw) {
          if (p === c) continue;
          if (p.el.contains(c.el)) {
            if (!closestParent || closestParent.el.contains(p.el)) {
              closestParent = p;
            }
          }
        }
        if (closestParent) {
          c.parentUid = closestParent.uid;
          closestParent.childrenUids.push(c.uid);
          closestParent.nestedContainerUids.push(c.uid);
        }
      }

      const interactiveSel = 'button, input:not([type="hidden"]), select, textarea, a[href], [role], [data-testid], [data-cy], [contenteditable="true"]';
      const elements: Array<any> = [];
      let elemUid = 1;
      document.querySelectorAll(interactiveSel).forEach(el => {
        if (!(el instanceof HTMLElement)) return;
        if (!isVisible(el)) return;
        const rect = el.getBoundingClientRect();
        const role = el.getAttribute('role') || undefined;
        const e = {
          uid: elemUid++,
          el,
          tag: el.tagName.toLowerCase(),
          role,
          testId: el.getAttribute('data-testid') || undefined,
          id: el.id || undefined,
          name: el.getAttribute('name') || undefined,
          ariaLabel: el.getAttribute('aria-label') || undefined,
          title: el.getAttribute('title') || undefined,
          text: (el.innerText || el.textContent || '').trim().substring(0, 120) || undefined,
          bbox: { x: Math.round(rect.left), y: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) },
          ancestorTestIds: Array.from(el.closest('[data-testid]') ? [el.closest('[data-testid]') as HTMLElement] : [])
            .map(e => e.getAttribute('data-testid') || '')
            .filter(Boolean)
            .slice(0, 3),
          containerUid: undefined as number | undefined,
        };
        // assign to nearest containing container
        let candidate: any | null = null;
        for (const c of containersRaw) {
          if (c.el.contains(el)) {
            if (!candidate) candidate = c;
            else if (candidate.el.contains(c.el)) candidate = c; // choose the deepest container
          }
        }
        if (candidate) {
          e.containerUid = candidate.uid;
          candidate.elementCount += 1;
          candidate.interactiveCount += 1;
        }
        elements.push(e);
      });

      // Finalize output by dropping node references
      const containers = containersRaw.map((c: any) => ({
        uid: c.uid,
        selector: c.selector,
        type: c.type,
        semanticTag: c.semanticTag,
        testId: c.testId,
        id: c.id,
        role: c.role,
        ariaLabel: c.ariaLabel,
        classes: c.classes,
        bbox: c.bbox,
        area: c.area,
        zIndex: c.zIndex,
        scrollable: c.scrollable,
        isLandmark: c.isLandmark,
        isModalLike: c.isModalLike,
        headerText: c.headerText,
        textChunks: c.textChunks,
        elementCount: c.elementCount,
        interactiveCount: c.interactiveCount,
        parentUid: c.parentUid,
        childrenUids: c.childrenUids,
        nestedContainerUids: c.nestedContainerUids,
      }));

      const cleanElements = elements.map(e => ({
        uid: e.uid,
        containerUid: e.containerUid,
        tag: e.tag,
        role: e.role,
        testId: e.testId,
        id: e.id,
        name: e.name,
        ariaLabel: e.ariaLabel,
        title: e.title,
        text: e.text,
        bbox: e.bbox,
        ancestorTestIds: e.ancestorTestIds,
      }));

      const landmarks = containers.filter(c => c.isLandmark).map(c => c.uid);

      return {
        url: window.location.href,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        containers,
        elements: cleanElements,
        landmarks,
      };
    });
  }

  /**
   * Enhanced container extraction - finds screenshot-worthy containers
   */
  private async getScreenshotContainers(hints?: { texts?: string[]; testIds?: string[]; roles?: string[] }): Promise<ContainerInfo[]> {
    return await this.page.evaluate((hintsIn: { texts?: string[]; testIds?: string[]; roles?: string[] } | undefined) => {
      function isVisible(el: HTMLElement): boolean {
        if (!el || !el.offsetParent) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }

      function getUniqueSelector(element: HTMLElement, maxDepth = 5): string {
        // First try data-testid, data-cy, role, aria-label, name
        if (element.getAttribute('data-testid'))
          return `[data-testid="${element.getAttribute('data-testid')}"]`;
        if (element.getAttribute('data-cy')) 
          return `[data-cy="${element.getAttribute('data-cy')}"]`;
        if (element.getAttribute('role')) 
          return `[role="${element.getAttribute('role')}"]`;
        if (element.getAttribute('aria-label'))
          return `[aria-label="${element.getAttribute('aria-label')}"]`;
        if (element.getAttribute('name')) 
          return `[name="${element.getAttribute('name')}"]`;

        // Only use ID if it's not auto-generated
        if (element.id) {
          const { id } = element;
          if (!/^(mui-|id\d+|.*-\d+)$/.test(id)) {
            return `#${id}`;
          }
        }

        // Try class-based selector if available
        if (element.classList && element.classList.length) {
          const classSelector = '.' + Array.from(element.classList).join('.');
          if (document.querySelectorAll(classSelector).length === 1) return classSelector;
        }

        // Enhanced parent traversal: Look for parents with identifiers
        let current = element.parentElement;
        let depth = 0;
        
        while (current && depth < maxDepth) {
          const parentTestId = current.getAttribute('data-testid');
          const parentDataCy = current.getAttribute('data-cy');
          const parentRole = current.getAttribute('role');
          const parentAriaLabel = current.getAttribute('aria-label');
          const parentName = current.getAttribute('name');
          const parentId = current.id && !/^(mui-|id\d+|.*-\d+)$/.test(current.id) ? current.id : null;
          
          let parentSelector = null;
          if (parentTestId) {
            parentSelector = `[data-testid="${parentTestId}"]`;
          } else if (parentDataCy) {
            parentSelector = `[data-cy="${parentDataCy}"]`;
          } else if (parentRole) {
            parentSelector = `[role="${parentRole}"]`;
          } else if (parentAriaLabel) {
            parentSelector = `[aria-label="${parentAriaLabel}"]`;
          } else if (parentName) {
            parentSelector = `[name="${parentName}"]`;
          } else if (parentId) {
            parentSelector = `#${parentId}`;
          }
          
          if (parentSelector) {
            const siblings = Array.from(current.children);
            const index = siblings.indexOf(element) + 1;
            const combinedSelector = `${parentSelector} > :nth-child(${index})`;
            
            if (document.querySelectorAll(combinedSelector).length === 1) {
              return combinedSelector;
            }
          }
          
          current = current.parentElement;
          depth += 1;
        }

        return element.tagName.toLowerCase();
      }

      function isScreenshotWorthy(element: HTMLElement): boolean {
        const rect = element.getBoundingClientRect();
        
        // Size check - relaxed thresholds
        const minWidth = 100;  // Reduced from 200px
        const minHeight = 50;  // Reduced from 100px
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Skip tiny elements
        if (rect.width < minWidth || rect.height < minHeight) return false;
        
        // Skip elements that are larger than the viewport
        if (rect.width > viewportWidth * 1.1 || rect.height > viewportHeight * 1.1) return false;
        
        // Check element attributes (prioritize elements with these attributes)
        if (element.hasAttribute('data-testid')) return true;
        if (element.hasAttribute('data-test')) return true;
        if (element.hasAttribute('data-cy')) return true;
        if (element.hasAttribute('data-e2e')) return true;
        if (element.hasAttribute('data-automation-id')) return true;
        if (element.hasAttribute('role')) return true;
        if (element.id && element.id.length > 0) return true;
        
        // Check for container-like classes (much more comprehensive)
        const className = element.className || '';
        if (typeof className !== 'string') return false;
        
        const classStr = className.toLowerCase();
        const containerPatterns = [
          'card', 'panel', 'section', 'container', 'box', 'wrapper', 
          'content', 'main', 'sidebar', 'dialog', 'modal', 'popup', 
          'drawer', 'menu', 'dropdown', 'popover', 'result', 'list',
          'table', 'grid', 'view', 'form', 'widget', 'component',
          'root', 'paper', 'sheet', 'body', 'frame', 'search'
        ];
        
        const hasContainerClass = containerPatterns.some(pattern => 
          classStr.includes(pattern)
        );
        
        // Check for semantic elements (expanded list)
        const semanticTags = [
          'main', 'section', 'article', 'aside', 'header', 'footer',
          'nav', 'form', 'dialog', 'table', 'figure', 'details'
        ];
        const isSemantic = semanticTags.includes(element.tagName.toLowerCase());
        
        // Check for ARIA attributes that suggest important containers
        const hasAriaAttributes = element.hasAttribute('aria-label') || 
                                  element.hasAttribute('aria-labelledby') || 
                                  element.hasAttribute('aria-describedby');
        
        // Final check: either has container class, is semantic element, or has ARIA attributes
        return hasContainerClass || isSemantic || hasAriaAttributes;
      }

      function getContainerType(element: HTMLElement): 'card' | 'section' | 'panel' | 'container' | 'element' {
        const className = element.className || '';
        const testId = element.getAttribute('data-testid') || '';
        
        if (className.includes('card') || className.includes('Card') || testId.includes('card')) {
          return 'card';
        }
        if (className.includes('panel') || className.includes('Panel') || testId.includes('panel')) {
          return 'panel';
        }
        if (className.includes('section') || className.includes('Section') || testId.includes('section')) {
          return 'section';
        }
        if (className.includes('container') || className.includes('Container')) {
          return 'container';
        }
        return 'element';
      }

      function getContainerDescription(element: HTMLElement): string {
        // Basic element information
        const text = element.textContent?.trim().substring(0, 100) || '';
        const testId = element.getAttribute('data-testid') || '';
        const role = element.getAttribute('role') || '';
        const ariaLabel = element.getAttribute('aria-label') || '';
        const id = element.id || '';
        const className = element.className || '';
        
        // Count interactive elements
        const buttons = element.querySelectorAll('button, [role="button"]').length;
        const inputs = element.querySelectorAll('input, select, textarea').length;
        const links = element.querySelectorAll('a, [role="link"]').length;
        
        // Get important child elements
        const headings = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          .map(h => h.textContent?.trim())
          .filter(Boolean)
          .slice(0, 2)
          .join(', ');
        
        // Check for common UI patterns
        const hasTable = element.querySelector('table, [role="table"], [role="grid"]') !== null;
        const hasList = element.querySelector('ul, ol, [role="list"]') !== null;
        const hasForm = element.querySelector('form, [role="form"]') !== null;
        const hasImage = element.querySelector('img') !== null;
        
        // Build a comprehensive description
        let description = `${element.tagName.toLowerCase()}`;
        
        if (testId) description += ` (testId="${testId}")`;
        if (id) description += ` (id="${id}")`;
        if (role) description += ` role="${role}"`;
        if (ariaLabel) description += ` aria-label="${ariaLabel}"`;
        
        // Add UI pattern information
        const patterns = [];
        if (hasTable) patterns.push('table');
        if (hasList) patterns.push('list');
        if (hasForm) patterns.push('form');
        if (hasImage) patterns.push('image');
        
        if (patterns.length > 0) {
          description += ` [contains: ${patterns.join(', ')}]`;
        }
        
        // Add interactive element counts
        const interactives = [];
        if (buttons > 0) interactives.push(`${buttons} buttons`);
        if (inputs > 0) interactives.push(`${inputs} inputs`);
        if (links > 0) interactives.push(`${links} links`);
        
        if (interactives.length > 0) {
          description += ` [interactive: ${interactives.join(', ')}]`;
        }
        
        // Add headings if available
        if (headings) {
          description += ` [heading: ${headings}]`;
        }
        
        // Add text sample if available
        if (text) {
          description += ` - ${text}`;
        }
        
        return description;
      }

      function getChildrenInfo(element: HTMLElement): string[] {
        // Get direct children
        const children = Array.from(element.children);
        
        // Get the most important children first (up to 8)
        return children.slice(0, 8).map(child => {
          if (!(child instanceof HTMLElement)) return '';
          
          const tag = child.tagName.toLowerCase();
          const testId = child.getAttribute('data-testid');
          const role = child.getAttribute('role');
          const ariaLabel = child.getAttribute('aria-label');
          const id = child.id;
          const className = child.className?.toString().split(' ')[0]; // Get first class only
          const text = child.textContent?.trim().substring(0, 40);
          
          // Determine if this is an interactive element
          const isButton = tag === 'button' || role === 'button';
          const isInput = tag === 'input' || tag === 'select' || tag === 'textarea';
          const isLink = tag === 'a' || role === 'link';
          
          // Build a descriptive string
          let info = tag;
          
          // Add most important attributes
          if (testId) info += `[data-testid="${testId}"]`;
          else if (id) info += `#${id}`;
          else if (className) info += `.${className}`;
          
          // Add role if available
          if (role) info += `[role="${role}"]`;
          
          // Add aria-label if available
          if (ariaLabel) info += `[aria-label="${ariaLabel}"]`;
          
          // Add type information for interactive elements
          if (isButton) info += ' (button)';
          else if (isInput) {
            const inputType = child instanceof HTMLInputElement ? child.type : 'input';
            info += ` (${inputType})`;
          }
          else if (isLink) info += ' (link)';
          
          // Add text content if available
          if (text) info += `: "${text}"`;
          
          return info;
        }).filter(Boolean);
      }

      function getInteractiveChildCount(element: HTMLElement): number {
        const interactiveSelector = 'button, input:not([type="hidden"]), select, textarea, [role], a[href], [data-testid], [data-cy]';
        return element.querySelectorAll(interactiveSelector).length;
      }

      function elementContainsHints(element: HTMLElement, hintsLocal?: { texts?: string[]; testIds?: string[]; roles?: string[] }): boolean {
        if (!hintsLocal) return false;
        const { texts = [], testIds = [], roles = [] } = hintsLocal;
        const lcText = (element.textContent || '').toLowerCase();
        if (texts.some(t => t && lcText.includes(t.toLowerCase()))) return true;
        if (testIds.length > 0) {
          const anyTestId = element.closest('[data-testid]') as HTMLElement | null;
          if (anyTestId && testIds.includes(anyTestId.getAttribute('data-testid') || '')) return true;
          const directMatch = Array.from(element.querySelectorAll('[data-testid]')).some(el => testIds.includes((el as HTMLElement).getAttribute('data-testid') || ''));
          if (directMatch) return true;
        }
        if (roles.length > 0) {
          const anyRole = element.closest('[role]') as HTMLElement | null;
          if (anyRole && roles.includes(anyRole.getAttribute('role') || '')) return true;
          const roleMatch = Array.from(element.querySelectorAll('[role]')).some(el => roles.includes((el as HTMLElement).getAttribute('role') || ''));
          if (roleMatch) return true;
        }
        return false;
      }

      // Find all potential screenshot containers
      const containers: ContainerInfo[] = [];
      
      // Look for common container selectors - expanded to find more relevant UI elements
      const containerSelectors = [
        // Data attribute selectors (most stable)
        '[data-testid]',
        '[data-test]',
        '[data-cy]',
        '[data-e2e]',
        '[data-automation-id]',
        '[data-qa]',
        '[data-ref]',
        '[data-target]',
        '[data-id]',
        
        // Specific data-testid patterns
        '[data-testid*="card"]',
        '[data-testid*="panel"]', 
        '[data-testid*="section"]',
        '[data-testid*="container"]',
        '[data-testid*="list"]',
        '[data-testid*="table"]',
        '[data-testid*="grid"]',
        '[data-testid*="dialog"]',
        '[data-testid*="modal"]',
        '[data-testid*="drawer"]',
        '[data-testid*="menu"]',
        '[data-testid*="form"]',
        '[data-testid*="view"]',
        '[data-testid*="page"]',
        '[data-testid*="screen"]',
        '[data-testid*="result"]',
        '[data-testid*="search"]',
        '[data-testid*="dropdown"]',
        '[data-testid*="popup"]',
        
        // UI Framework components (not just Material UI)
        // Material UI
        '[class*="MuiCard"]',
        '[class*="MuiPaper"]',
        '[class*="MuiDialog"]',
        '[class*="MuiPopover"]',
        '[class*="MuiMenu"]',
        '[class*="MuiDrawer"]',
        
        // Bootstrap
        '.card',
        '.modal',
        '.dropdown',
        '.container',
        '.panel',
        
        // Generic UI components
        '[class*="card"]',
        '[class*="panel"]',
        '[class*="modal"]',
        '[class*="dialog"]',
        '[class*="popup"]',
        '[class*="container"]',
        '[class*="drawer"]',
        '[class*="menu"]',
        '[class*="dropdown"]',
        '[class*="popover"]',
        '[class*="result"]',
        '[class*="list"]',
        '[class*="table"]',
        '[class*="grid"]',
        '[class*="view"]',
        '[class*="wrapper"]',
        '[class*="search-result"]',
        
        // Semantic HTML elements
        'main',
        'section',
        'article',
        'aside',
        'header',
        'footer',
        'nav',
        'form',
        'dialog',
        'table',
        
        // Role-based selectors (broader set)
        '[role]',  // Any element with a role
        '[role="dialog"]',
        '[role="tabpanel"]',
        '[role="menu"]',
        '[role="listbox"]',
        '[role="grid"]',
        '[role="table"]',
        '[role="region"]',
        '[role="complementary"]',
        '[role="navigation"]',
        '[role="search"]',
        '[role="alert"]',
        '[role="alertdialog"]',
        '[role="banner"]',
        '[role="combobox"]',
        '[role="feed"]',
        '[role="form"]',
        '[role="main"]',
        '[role="presentation"]',
        '[role="tooltip"]',
        
        // Elements with specific attributes that suggest they're important containers
        '[aria-label]',
        '[aria-labelledby]',
        '[aria-describedby]',
        '[aria-controls]',
        '[aria-expanded="true"]',
        
        // ID-based selectors for common container naming patterns
        '[id*="container"]',
        '[id*="panel"]',
        '[id*="dialog"]',
        '[id*="modal"]',
        '[id*="popup"]',
        '[id*="menu"]',
        '[id*="drawer"]',
        '[id*="results"]',
        '[id*="search"]'
      ];

      containerSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          if (el instanceof HTMLElement && isVisible(el) && isScreenshotWorthy(el)) {
            const rect = el.getBoundingClientRect();
            containers.push({
              selector: getUniqueSelector(el),
              type: getContainerType(el),
              containsTarget: elementContainsHints(el, hintsIn),
              screenshotWorthy: true,
              description: getContainerDescription(el),
              children: getChildrenInfo(el),
              area: Math.round(rect.width * rect.height),
              hasTestId: !!el.getAttribute('data-testid'),
              interactiveChildCount: getInteractiveChildCount(el)
            });
          }
        });
      });

      // Also look for any div with container-like classes
      const allDivs = document.querySelectorAll('div');
      allDivs.forEach((el) => {
        if (el instanceof HTMLElement && isVisible(el) && isScreenshotWorthy(el)) {
          const selector = getUniqueSelector(el);
          // Avoid duplicates
          if (!containers.some(c => c.selector === selector)) {
            const rect = (el as HTMLElement).getBoundingClientRect();
            containers.push({
              selector,
              type: getContainerType(el as HTMLElement),
              containsTarget: elementContainsHints(el as HTMLElement, hintsIn),
              screenshotWorthy: true,
              description: getContainerDescription(el as HTMLElement),
              children: getChildrenInfo(el as HTMLElement),
              area: Math.round(rect.width * rect.height),
              hasTestId: !!(el as HTMLElement).getAttribute('data-testid'),
              interactiveChildCount: getInteractiveChildCount(el as HTMLElement)
            });
          }
        }
      });

      // Rank & dedupe to reduce tokens
      const viewportArea = Math.max(1, window.innerWidth * window.innerHeight);
      const idealAreaMin = viewportArea * 0.10;
      const idealAreaMax = viewportArea * 0.85;

      // Enhanced scoring algorithm to prioritize the most relevant containers
      const scored = containers.map((c) => {
        let score = 0;
        
        // Target relevance - highest priority
        if (c.containsTarget) score += 50;
        
        // Selector quality - prefer data-testid and semantic elements
        if (c.hasTestId) score += 25; // Increased from 15
        if (c.selector.startsWith('[data-testid')) score += 15;
        if (c.selector.startsWith('[role=')) score += 10;
        if (c.selector.startsWith('#')) score += 8;
        if (c.selector.startsWith('.')) score += 5;
        
        // Container type - prefer semantic containers
        if (c.type === 'card') score += 15;
        if (c.type === 'panel') score += 12;
        if (c.type === 'section') score += 10;
        if (c.type === 'container') score += 8;
        
        // Size appropriateness - not too small, not too big
        const area = c.area || 0;
        const viewportArea = window.innerWidth * window.innerHeight;
        const areaRatio = area / viewportArea;
        
        // Perfect size: between 10% and 85% of viewport
        if (area >= idealAreaMin && area <= idealAreaMax) score += 15;
        // Too small: less than 5% of viewport
        if (area > 0 && area < idealAreaMin * 0.5) score -= 10;
        // Too large: more than 90% of viewport
        if (area > idealAreaMax * 1.2) score -= 15;
        // Ideal size is around 30-60% of viewport
        if (areaRatio >= 0.3 && areaRatio <= 0.6) score += 10;
        
        // Interactive elements - containers with interactive elements are likely important
        const interactiveCount = c.interactiveChildCount || 0;
        if (interactiveCount > 0) {
          // Add points for interactive elements, but cap at 20
          score += Math.min(20, interactiveCount * 2);
        }
        
        // Depth in DOM - prefer containers that aren't too deeply nested
        const depthMatch = c.selector.match(/>/g);
        const depth = depthMatch ? depthMatch.length + 1 : 1;
        if (depth <= 3) score += 5; // Prefer shallower containers
        if (depth > 5) score -= 5; // Penalize deeply nested containers
        
        return { ...(c as any), score };
      }) as Array<ContainerInfo & { score: number }>;

      scored.sort((a, b) => b.score - a.score);
      const seen = new Set<string>();
      const uniqueRanked: ContainerInfo[] = [];
      for (const c of scored) {
        const key = `${c.type}|${c.selector.replace(/:nth-child\(\d+\)/g, ':nth-child(*)')}`;
        if (seen.has(key)) continue;
        seen.add(key);
        uniqueRanked.push(c);
      }

      return uniqueRanked;
    }, hints);
  }
/**
   * Enhanced prompt generation with container information
   */
async generateEnhancedPrompt(
  base64Screenshot: string,
  codeContext: string,
  imgFileName: string | null,
  refinementContext?: RefinementContext,
  thinking?: string,
  screenshotIntent?: string,
  fullJsonResponse?: string
): Promise<string> {
  try {
    const { aiConfig } = playwrightConfig;
    // Prefer explicit override via env or hardcoded endpoint provided by user
    const overrideEndpoint = process.env.AZURE_OPENAI_ENDPOINT || 'https://dhanu-m7k6n5e0-eastus2.cognitiveservices.azure.com/openai/deployments/gpt-5-chat/chat/completions?api-version=2025-01-01-preview';
    const endpoint = overrideEndpoint || `${aiConfig.apiUrl}/openai/deployments/${aiConfig.ivModel}/chat/completions?api-version=${aiConfig.apiVersion}`;
    const apiKey = process.env.AZURE_OPENAI_API_KEY || aiConfig.apiKey;

    // Take a screenshot with container highlighting
    let enhancedScreenshotBase64 = '';
    try {
      console.log('📸 Taking screenshot with highlighted containers...');
      enhancedScreenshotBase64 = await this.takeHighlightedScreenshot();
      console.log('✅ Container-highlighted screenshot captured successfully');
    } catch (error) {
      console.warn('⚠️ Failed to take highlighted screenshot:', error);
      // If we failed to take a highlighted screenshot, use the provided screenshot
      enhancedScreenshotBase64 = base64Screenshot;
    }

    // Build a rich, hierarchical summary of containers and elements
    const smartSummary = await this.getSmartVisibleContainersSummary();
    const pageUrl = smartSummary.url;
    const condensedContainers = smartSummary.containers
      .slice(0, 50) // Increased from 30 to 50 for more comprehensive container information
      .map(c => ({
        uid: c.uid,
        type: c.type,
        selector: c.selector,
        role: c.role,
        testId: c.testId,
        bbox: c.bbox,
        textChunks: c.textChunks?.slice(0, 3) || [], // Show up to 3 text chunks for better context
        headerText: c.headerText,
        interactiveCount: c.interactiveCount,
        isLandmark: c.isLandmark,
        isModalLike: c.isModalLike,
        nestedContainerUids: c.nestedContainerUids || []
      }));

    // Also collect a compact element listing grouped by container
    const compactElements = smartSummary.elements
      .slice(0, 500) // Increased from 300 to 500 for even more comprehensive element information
      .map(e => ({
        uid: e.uid,
        containerUid: e.containerUid,
        tag: e.tag,
        role: e.role,
        testId: e.testId,
        id: e.id,
        text: e.text?.substring(0, 80),
      }));

    // Keep page-level compact context
    const viewport = smartSummary.viewport;
    
    // Get page content with better element extraction (for minimal compatibility info)
    const pageContent = await this.page.evaluate(() => {
      function isVisible(el: HTMLElement): boolean {
        if (!el || !el.offsetParent) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }

      function getAttrs(el: HTMLElement) {
        const parent = el.parentElement;
        const parentIdentifier = parent ? {
          id: parent.id || undefined,
          'data-testid': parent.getAttribute('data-testid') || undefined,
          'data-cy': parent.getAttribute('data-cy') || undefined,
          role: parent.getAttribute('role') || undefined,
        } : undefined;

        const hasParentIdentifier = parentIdentifier && 
          (Object.values(parentIdentifier).some(val => val !== undefined));

        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || undefined,
          'data-testid': el.getAttribute('data-testid') || undefined,
          'data-cy': el.getAttribute('data-cy') || undefined,
          role: el.getAttribute('role') || undefined,
          name: el.getAttribute('name') || undefined,
          text: el.textContent?.trim()?.substring(0, 30) || undefined,
          parent: hasParentIdentifier ? parentIdentifier : undefined
        };
      }

      const elements = Array.from(
        document.querySelectorAll(
          'button, input, select, [role="button"], [role="link"], [role="menuitem"], [data-cy], [data-testid], [contenteditable="true"]'
        )
      )
      .filter((el): el is HTMLElement => el instanceof HTMLElement && isVisible(el))
      .map(el => getAttrs(el))
      .filter(attrs => 
        attrs.id || 
        attrs['data-testid'] || 
        attrs['data-cy'] || 
        attrs.text || 
        attrs.parent
      );

      return { elements, url: window.location.href };
    });

    // Reduce and dedupe element list for compatibility section
    const seenElemKeys = new Set<string>();
    const minimalElements: Array<{ id?: string; testId?: string; role?: string; text?: string; parent?: { testId?: string; role?: string; id?: string } }> = [];
    for (const e of (pageContent.elements as any[])) {
      const key = `${e.id || ''}|${e['data-testid'] || ''}|${e.role || ''}|${(e.text || '').toLowerCase()}`;
      if (seenElemKeys.has(key)) continue;
      seenElemKeys.add(key);
      minimalElements.push({
        id: e.id,
        testId: e['data-testid'],
        role: e.role,
        text: e.text ? String(e.text).substring(0, 24) : undefined,
        parent: e.parent ? { testId: e.parent['data-testid'], role: e.parent.role, id: e.parent.id } : undefined,
      });
      if (minimalElements.length >= 40) break;
    }
    const systemPrompt = `You generate Playwright code to take screenshots of the correct UI container.

    Choose a single, meaningful container that contains the target element based on the following strict priority order:
    
    **PRIORITY ORDER:**
    1. HIGHEST: Elements with [data-testid] that are most specific to the screenshot intent (e.g., if screenshotting a modal, prefer data-testids containing "modal", "dialog"; if screenshotting a table, prefer "table", "grid", "list")
    2. Elements with any [data-testid] attribute (critical for stable automation)daniel 
    3. Elements with stable semantic roles using CSS selectors: [role="dialog"], [role="listbox"], [role="menu"], [role="combobox"]
    4. Elements with stable, non-auto-generated IDs
    5. Semantic containers (main, section, article, nav) that contain the target
    6. Elements with CSS classes that clearly indicate their purpose
    7. Container elements with sensible dimensions (width > 100px and height > 50px)
    
    **USING THE PROVIDED CONTAINER INFORMATION:**
    You will receive detailed container information in this format:
    \`\`\`
    DETAILED CONTAINER INFORMATION:
    1. [1] ELEMENT: [data-testid="layout-view-root"]
      Attributes: no role, data-testid="layout-view-root"
      Position: x:64, y:61, w:1176, h:708
      Interactive elements: 1
      Text content: "Welcome to the application dashboard" | "Navigate using the menu options..." | "Current status: active"
      Nested containers: [2, 3, 4] (3 containers inside this one)
      Elements: div[data-testid="layout-view-root"]: "Omega.ai Default..."
    \`\`\`
    
    **NEW TEXT CONTENT FORMAT:**
    - **Text content**: Shows actual readable text from the container, split into meaningful chunks (max 20 words each)
    - **Nested containers**: Lists container UIDs that are inside this container for better hierarchy understanding
    
    **DECISION PROCESS:**
    1. **Read the screenshot intent** - Understand what needs to be captured
    2. **Analyze each numbered container** [1], [2], [3], etc. from the provided data
    3. **Match text content to intent** - Look for relevant phrases in the actual text content displayed
    4. **Consider nested containers** - Containers with many nested elements might provide better context if there are 2 containers with both having required text content find a container that has both these containers inside it.
    5. **Check interactive elements count** - Higher counts may indicate more relevant containers
    6. **Review container dimensions** - Prefer containers that provide spatial context (bigger is better for context)
    7. **Extract the exact data-testid** - Use the precise value from the ELEMENT field
    8. **Generate the locator** - Create Playwright code with \`[data-testid="exact-value"]\`

    **TECHNICAL REQUIREMENTS:**
    1. Pick EXACTLY ONE best container that includes the target and shows where the target is located
    2. Always prefer [data-testid] selectors over any other type when available
    3. Use page.locator() with CSS selectors - never use getByRole(), getByText(), or similar methods
    4. ALWAYS add a reasonable timeout (30000ms default, 60000ms for complex UI)
    5. NEVER use .first(), .nth(), or chained filters in screenshot locators - use more specific selectors instead
    6. ALWAYS include a "thinking" section in your response that explains your reasoning process
    7. Return the exact Playwright screenshot command after your thinking section
    8. **FORCE ALL SCREENSHOT COMMANDS by adding { force: true } to all locators**
    
    **RECOMMENDED SELECTOR PATTERNS (in order of preference):**
    - Data attributes: \`[data-testid="element-name"]\`
    - Compound selectors with parent-child: \`div:has([data-testid="child-element"])\`
    - Specific classes: \`.unique-container-class\`
    - Text content with data attributes: \`div:has-text("Title"):has([data-testid="content"])\`
    - Parent with multiple identifiers: \`div:has(.title):has(.content)\`
    - Elements with ARIA attributes: \`[aria-label="Description"]\`
    - Elements with semantic roles: \`[role="dialog"]\`
    
    **EXAMPLES USING PROVIDED CONTAINER DATA:**
    
    Given this container information:
    \`\`\`
    5. [5] CONTAINER: [data-testid="data-grid-table-container"]
      Position: x:88, y:129, w:1152, h:640
      Interactive elements: 1
    \`\`\`
    
    Good response:
    \`\`\`
    await page.locator('[data-testid="data-grid-table-container"]', { force: true }).screenshot({ path: './images/container.png', timeout: 30000 });
    \`\`\`
    
    Given this container information:
    \`\`\`
    7. [7] ELEMENT: [data-testid="worklist-data-grid-table-header"]
      Position: x:88, y:129, w:1990, h:93
      Interactive elements: 36
    \`\`\`
    
    Good response:
    \`\`\`
    await page.locator('[data-testid="worklist-data-grid-table-header"]', { force: true }).screenshot({ path: './images/header.png', timeout: 30000 });
    \`\`\`
    
    **BAD RESPONSES (DO NOT DO THESE):**
    - Using getBy methods: \`await page.getByRole('listbox').screenshot()\`
    - Using .first() on locators: \`await page.locator('.container').first().screenshot()\`
    - Using generic text locators: \`await page.getByText('Some text').screenshot()\`
    - Using complex chained locators: \`await page.locator('div').filter({ has: page.getByText('text') }).screenshot()\`
    - Missing timeout: \`await page.locator('.selector').screenshot({ path: 'file.png' })\`
    - Missing force option: \`await page.locator('.selector').screenshot({ path: 'file.png', timeout: 30000 })\`
    - Returning JSON objects, markdown code blocks, or explanations
    
    **TIMEOUT GUIDELINES:**
    - Use 30000ms (30 seconds) for standard UI elements
    - Use 60000ms (60 seconds) for:
    - Complex data grids with many rows
    - Dynamic content that loads asynchronously
    - Elements that require network requests to render
    - Containers with heavy JavaScript interactions
    
    DETAILED CONTAINER INFORMATION:
    ${condensedContainers.map((c, i) => {
    // Format bbox to be more readable
    const bbox = c.bbox ? `x:${c.bbox.x}, y:${c.bbox.y}, w:${c.bbox.width}, h:${c.bbox.height}` : 'unknown';
    
    // Get container elements if available
    const containerElements = compactElements.filter(e => e.containerUid === c.uid).slice(0, 10);
    const elementsList = containerElements.length > 0 
      ? `\n    Elements: ${containerElements.map(e => 
          `${e.tag}${e.testId ? `[data-testid="${e.testId}"]` : ''}${e.role ? `[role="${e.role}"]` : ''}${e.text ? `: "${e.text}"` : ''}`
        ).join(', ')}`
      : '';
    
    // Format nested containers information
    const nestedContainers = c.nestedContainerUids && c.nestedContainerUids.length > 0 
      ? `\n    Nested containers: [${c.nestedContainerUids.join(', ')}] (${c.nestedContainerUids.length} container${c.nestedContainerUids.length !== 1 ? 's' : ''} inside this one)`
      : '';
    
    // Format text content chunks
    const textContent = c.textChunks && c.textChunks.length > 0
      ? `\n    Text content: ${c.textChunks.map(chunk => `"${chunk}"`).join(' | ')}`
      : '';
    
    return `${i + 1}. [${c.uid}] ${c.type.toUpperCase()}: ${c.selector}
      Attributes: ${c.role ? `role="${c.role}"` : 'no role'}${c.testId ? `, data-testid="${c.testId}"` : ''}
      Position: ${bbox}
      Interactive elements: ${c.interactiveCount || 0}${textContent}${c.headerText ? `\n    Header: "${c.headerText}"` : ''}${c.isModalLike ? '\n    Type: modal-like container' : ''}${nestedContainers}${elementsList}`;
    }).join('\n\n')}
    
    URL: ${pageUrl}, Viewport: ${JSON.stringify(viewport)}
    
    **RESPONSE FORMAT:**
    Your response should be a strict JSON format with a thinking field and a code field and the name of the screenshot has to be exactly like in the code previously generated:
    
    {
      "thinking": "Detailed explanation of your reasoning process, which container you chose and why, how it relates to the screenshot intent, and why this selector is the most appropriate choice.",
      "code": "await page.locator('[data-testid=\"example-container\"]', { force: true }).screenshot({ path: './images/example-image-name.png', timeout: 30000 });"
    }

    **NESTED CONTAINERS EXAMPLE:**
    {
      "thinking": "I need to capture the complete user profile section including personal info, subscription details, and account settings. Container C2 [data-testid='user-profile-section'] is the optimal choice because: 1) It's specifically named 'user-profile-section' which directly matches the intent, 2) It contains nested containers C3 (personal-info-card) and C4 (subscription-details) which provide the required personal info and subscription details, 3) It includes the profile header with user name 'John Doe' and 'Premium Member' status, 4) It's focused enough to exclude unrelated dashboard elements from C1 but comprehensive enough to include all profile-related information in one cohesive screenshot. The nested structure ensures I capture all required information in their proper context.",
      "code": "await page.locator('[data-testid=\"user-profile-section\"]', { force: true }).screenshot({ path: './images/user-profile-complete.png', timeout: 30000 });"
    }
    `;

    // Get image description from LLM and add context
    let imageDescription = '';
    if (imgFileName && base64Screenshot) {
      // Extract image path information
      const imgDir = imgFileName.includes('/') ? imgFileName.substring(0, imgFileName.lastIndexOf('/')) : 
                    (imgFileName.includes('\\') ? imgFileName.substring(0, imgFileName.lastIndexOf('\\')) : '');
      const baseName = imgFileName.split('/').pop()?.split('\\').pop() || imgFileName;
      
      // Set up image description section
      imageDescription = `This is how the image should look\n`;
      
      // Try to get AI description of the image
      try {
        console.log(`🔍 Getting AI description for image: ${baseName}`);
        const aiDescription = await this.getImageDescription(base64Screenshot);
        
        if (aiDescription) {
          // Format the description nicely
          imageDescription += `\nThis is the description of how the screenshot looks:\n\n${aiDescription}\n`;
          console.log(`✅ Successfully added AI description for image: ${baseName}`);
        } else {
          console.warn(`⚠️ No AI description was generated for image: ${baseName}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to get AI description of the image: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    const userTextPrompt = `You are supposed to take a screenshot of the container that contains the target element and to do that consider the image description, the screenshot intent and the container highlighted image shared with you.

The following JSON contains the full previous response with all the details:
use the same name of the image when you write the playwright command for the screenshot.
the command might be right but it not always is your job is to find the best container that can fit the right elements with enough surrounding context to get the perfect screenshot.
bigger container is always better to get the right context.
pick the container based on the container name if it makes sense for the intent.
use the intent of the screenshot to pick the container.
${fullJsonResponse ? `${fullJsonResponse}` : ''}
this is the description of the ideal screenshot
you have to find a container to capture the screenshot of that can make it look like this:
${imageDescription ? `\n\n${imageDescription}` : ''}`;

    const userMessageContent: Array<{ type: string; text?: string; image_url?: { url: string, detail?: string } }> =
      [{ type: "text", text: userTextPrompt }];
    

    
    // Add container-highlighted screenshot if available
    if (enhancedScreenshotBase64 && enhancedScreenshotBase64 !== base64Screenshot) {
      // Send the container-highlighted screenshot without additional description
      userMessageContent.push({
        type: "image_url",
        image_url: { url: `data:image/png;base64,${enhancedScreenshotBase64}`, detail: "auto" }
      });
    }

    const requestPayload = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessageContent }
      ],
      temperature: 0.4,
      top_p: 0.8,
    };

    // Log the actual API call payload

    const startTime = Date.now();

    if (process.env.VERBOSE_LLM === 'true') {
      console.log(`🔗 Azure OpenAI request -> ${endpoint}`);
      console.log(`   prompt tokens approx (user text prompt only): ${userTextPrompt.split(/\s+/).length}`);
    }
    
    let response;

    try {
      // Increment API call counter
      globalStats.totalApiCalls++;
      console.log(`📡 Making API call #${globalStats.totalApiCalls} to model`);
      
      response = await axios.post(endpoint, requestPayload, {
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey, 
        },
      });
      console.log('🔍 Response from ai utils enhanced: ' + response.data);
      const duration = Date.now() - startTime;
      const aiContent: string = response.data.choices?.[0]?.message?.content || '';
/* The above code is written in TypeScript and it is checking the `response.data.usage` object for the
existence of the `prompt_tokens` property. If the `prompt_tokens` property exists, it assigns its
value to the `inputTokenCount` variable. If the `prompt_tokens` property does not exist or is `null`
or `undefined`, it assigns the value `0` to the `inputTokenCount` variable. */
      const inputTokenCount = response.data.usage?.prompt_tokens || 0;
      const outputTokenCount = response.data.usage?.completion_tokens || 0;
      
      // Log token usage (excluding image tokens)
      
      // Declare variables for extracted content
      let cleaned = '';
      let parsedResponse;
      let extractedCode = '';
      let extractedThinking = '';
      
      // Store raw response for thinking extraction
      const rawResponse = aiContent;

      // Minimal debug logging
      if (process.env.VERBOSE_LLM === 'true') {
        console.log('🔍 AI response received, length:', aiContent.length);
      }
    
      // Try to extract thinking from the response
      try {
        // Look for JSON structure with thinking field
        const thinkingMatch = aiContent.match(/\{[\s\S]*?"thinking"\s*:\s*"([^"]+)"[\s\S]*?\}/);
        if (thinkingMatch && thinkingMatch[1]) {
          extractedThinking = thinkingMatch[1];
          console.log('\n💭 THINKING: ' + extractedThinking + '\n');
        } else {
          // Try to find thinking section with markdown-style formatting
          const markdownThinkingMatch = aiContent.match(/(?:thinking|reasoning|analysis):\s*([^\n]+(?:\n(?!\n)[^\n]+)*)/i);
          if (markdownThinkingMatch && markdownThinkingMatch[1]) {
            extractedThinking = markdownThinkingMatch[1].trim();
            console.log('\n💭 THINKING: ' + extractedThinking + '\n');
          }
        }
      } catch (thinkingError) {
        console.warn('⚠️ Error extracting thinking:', thinkingError instanceof Error ? thinkingError.message : String(thinkingError));
      }
    
      // Update global token counters silently (without logging)
      globalStats.totalInputTokens += inputTokenCount;
      globalStats.totalOutputTokens += outputTokenCount;

    // Create log entry
    const logEntry: APILogEntry = {
        timestamp: new Date().toISOString(),
        provider: 'openai',
        model: 'gpt-5-chat',
        rawRequest: requestPayload || {}, // Add missing field
        rawResponse: response || {}, // Add missing field
        request: {
          systemInstruction: systemPrompt,
          userPrompt: userTextPrompt,
          hasImage: !!base64Screenshot,
          imageSize: base64Screenshot ? Buffer.from(base64Screenshot, 'base64').length : undefined,
          hasHighlightedImage: !!(enhancedScreenshotBase64 && enhancedScreenshotBase64 !== base64Screenshot),
          highlightedImageSize: (enhancedScreenshotBase64 && enhancedScreenshotBase64 !== base64Screenshot) 
            ? Buffer.from(enhancedScreenshotBase64, 'base64').length 
            : undefined,
          pageUrl: await this.page.url(),
          visibleElementsLength: userTextPrompt.length,
          previouslyExecutedCode: codeContext,
          currentStepErrorCode: refinementContext?.errorMessage || ''
        },
        response: {
          status: response.status,
          content: aiContent,
          inputTokenCount,
          outputTokenCount,
          totalTokens: inputTokenCount + outputTokenCount,
          thinking: extractedThinking || 'Enhanced container-based screenshot generation',
          code: extractedCode || aiContent,
        },
        metadata: {
          temperature: refinementContext ? 0.2 : 0.3,
          maxTokens: 1000,
          topP: 1,
        },
        duration,
      };
      apiLogger.logAPICall(logEntry);

      if (process.env.VERBOSE_LLM === 'true') {
        console.log(`✅ Azure response status: ${response.status}`);
      }

      // Clean potential fenced code and try to parse as JSON
      cleaned = aiContent
        .replace(/^```(?:json|javascript|typescript|js|ts)?\s*/g, '')  // Handle various code block language tags
        .replace(/```\s*$/g, '')
        .trim();

      // Default to using cleaned content as code
      extractedCode = cleaned;
      
        
        // Fallback: Look for Playwright code pattern directly
        console.log('💭 Response from ai utils enhanced: ' + aiContent);
        const playwrightCodePattern = /(await\s+page\s*\.\s*\w+\s*\([^)]*\)\s*\.\s*screenshot\s*\([^;]*\)\s*;|page\s*\.\s*\w+\s*\([^)]*\)\s*\.\s*screenshot\s*\([^;]*\)\s*;)/;
      const codeMatch = cleaned.match(playwrightCodePattern);
      
      if (codeMatch && codeMatch[0]) {
        extractedCode = codeMatch[0].trim();
        console.log('✅ Extracted Playwright screenshot code directly from response');
      } else {
        // Try to find code blocks
        const codeBlockMatch = cleaned.match(/```[a-z]*\s*([\s\S]*?)```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
          extractedCode = codeBlockMatch[1].trim();
          console.log('📝 Extracted code from markdown code block');
          
          // Check if the extracted code contains a Playwright screenshot command
          const codeMatch = extractedCode.match(playwrightCodePattern);
          if (codeMatch && codeMatch[0]) {
            extractedCode = codeMatch[0].trim();
            console.log('✅ Found Playwright screenshot code in code block');
          }
        }
      }
      
      // Try to extract thinking from markdown format
      const thinkingMatch = cleaned.match(/(?:THINKING|thinking|Thinking|THOUGHT|thought|Thought|ANALYSIS|analysis|Analysis)[:|\n]([\s\S]*?)(?:```|INSTRUCTIONS|instructions|Instructions|STEPS|steps|Steps)/i);
      if (thinkingMatch && thinkingMatch[1]) {
        extractedThinking = thinkingMatch[1].trim();
        console.log('💭 THINKING from markdown: ' + extractedThinking );
      }
      
      
      // Final validation - make sure it contains a screenshot command
      if (!extractedCode.includes('screenshot')) {
        console.warn('⚠️ Extracted code does not contain a screenshot command');
        // Try one more time to find a screenshot command in the raw response
        const screenshotMatch = cleaned.match(/await\s+page.*\.screenshot\s*\(.*\)/s);
        if (screenshotMatch) {
          extractedCode = screenshotMatch[0].trim();
          if (!extractedCode.endsWith(';')) extractedCode += ';';
          console.log('🔧 Extracted screenshot command from raw response');
        }
      }
      
      // If we still don't have thinking, try to extract it from the raw response
      if (!extractedThinking && rawResponse) {
        // Try to extract thinking from raw response using various patterns
        const thinkingPatterns = [
          // Common thinking section markers
          /(?:THINKING|thinking|Thinking|THOUGHT|thought|Thought|ANALYSIS|analysis|Analysis)[:|\n]([\s\S]*?)(?:```|INSTRUCTIONS|instructions|Instructions|STEPS|steps|Steps|CODE|code|Code)/i,
          // Current instruction pattern from the terminal output
          /Current instruction:.*?(?=Previous instruction:|$)/s,
          // Look for text that explains what the user wants to capture
          /The user wants to capture.*?(?=\.)/s,
          // Look for text that describes what's being captured
          /This ensures.*?(?=\.)/s,
          // Look for any explanatory text before code blocks
          /.*?(?=```)/s
        ];
        
        for (const pattern of thinkingPatterns) {
          const match = rawResponse.match(pattern);
          if (match && match[0]) {
            // If the pattern has a capture group, use that, otherwise use the whole match
            const thinkingText = match[1] || match[0];
            if (thinkingText && thinkingText.trim().length > 10) { // Ensure it's not just a few characters
              extractedThinking = thinkingText.trim();
              console.log('💭 Extracted thinking from raw response using pattern:', pattern);
              console.log('💭 THINKING from raw response:', extractedThinking);
              break;
            }
          }
        }
      }

      // Debug logging
      console.log('🔍 CLEANED AI RESPONSE:', JSON.stringify(extractedCode));

      // Add semicolon if needed for proper JS/TS syntax
      return (!extractedCode || extractedCode.endsWith(';') || extractedCode.endsWith('}')) 
        ? (extractedCode || codeContext) 
        : `${extractedCode};`;
    } catch (err: any) {
      const duration = Date.now() - startTime;
      
      // Log image information even in error case
      console.log('📸 Base screenshot size:', base64Screenshot ? Buffer.from(base64Screenshot, 'base64').length : 'none');
      console.log('📸 Highlighted screenshot size:', 
        (enhancedScreenshotBase64 && enhancedScreenshotBase64 !== base64Screenshot) 
          ? Buffer.from(enhancedScreenshotBase64, 'base64').length 
          : 'none');
          
      const logEntry: APILogEntry = {
        timestamp: new Date().toISOString(),
        provider: 'openai',
        model: 'gpt-5-chat',
        rawRequest: requestPayload || {}, // Add missing field
        rawResponse: err?.response || {}, // Add missing field for error case
        request: {
          systemInstruction: systemPrompt,
          userPrompt: userTextPrompt,
          hasImage: !!base64Screenshot,
          imageSize: base64Screenshot ? Buffer.from(base64Screenshot, 'base64').length : undefined,
          hasHighlightedImage: !!(enhancedScreenshotBase64 && enhancedScreenshotBase64 !== base64Screenshot),
          highlightedImageSize: (enhancedScreenshotBase64 && enhancedScreenshotBase64 !== base64Screenshot) 
            ? Buffer.from(enhancedScreenshotBase64, 'base64').length 
            : undefined,
          pageUrl: await this.page.url(),
          visibleElementsLength: userTextPrompt.length,
          previouslyExecutedCode: codeContext,
          currentStepErrorCode: refinementContext?.errorMessage || ''
        },
        response: {
          status: err?.response?.status || 500,
          content: err?.message || 'Unknown error',
          inputTokenCount: 0,
          outputTokenCount: 0,
          totalTokens: 0,
          thinking: 'Error occurred',
          code: 'error',
        },
        metadata: {
          temperature: refinementContext ? 0.2 : 0.3,
          maxTokens: 1000,
          topP: 1,
        },
        duration,
      };
      apiLogger.logAPICall(logEntry);

      // Surface error and fall back
      throw err;
    }
  } catch (error: any) {
    const reason = error?.message || 'unknown error';
    if (error?.response?.data) {
      console.warn('🔍 Azure error body:', JSON.stringify(error.response.data));
    }
    console.warn(`⚠️  Enhanced AI screenshot generation failed (${reason}); falling back to original/previous code`);
    return codeContext;
  }
}

  /**
   * Extract image path and directory from a screenshot command
   */
  private extractImagePathInfo(screenshotCommand: string): { 
    imgFileName: string | null;
    imgPath: string | null;
    imgDir: string | null;
  } {
    let imgFileName: string | null = null;
    let imgPath: string | null = null;
    let imgDir: string | null = null;
    
    // Try to extract path from screenshot command
    const pathMatch = screenshotCommand.match(/path\s*:\s*['"]([^'\"]+\.(?:png|jpg|jpeg|gif|bmp|webp))['"]/i);
    if (pathMatch?.[1]) {
      imgPath = decodeURIComponent(pathMatch[1]);
      imgFileName = path.basename(imgPath);
      imgDir = path.dirname(imgPath);
    } else {
      // Try to extract from direct argument
      const argMatch = screenshotCommand.match(/(?:page\.screenshot|\.screenshot)\(\s*['"]([^'\"]+\.(?:png|jpg|jpeg|gif|bmp|webp))['"]/i);
      if (argMatch?.[1]) {
        imgPath = decodeURIComponent(argMatch[1]);
        imgFileName = path.basename(imgPath);
        imgDir = path.dirname(imgPath);
      }
    }
    
    return { imgFileName, imgPath, imgDir };
  }

  /**
   * Enhanced screenshot command interception
   */
  async interceptScreenshotCommandEnhanced(
    originalCodeBlock: string, 
    isRefinementCycle: boolean = false, 
    refinementContext?: RefinementContext,
    thinking?: string,
    screenshotIntent?: string,
    fullJsonResponse?: string
  ): Promise<string> {
    const screenshotCommandRegex = /(\bawait\s+)?(page\.screenshot\s*\(.*?\)|[^;]+\.screenshot\s*\(.*?\));?/i;
    const match = originalCodeBlock.match(screenshotCommandRegex);

    if (!match) return originalCodeBlock;

    const originalScreenshotCommand = match[0];
    console.log(isRefinementCycle ? "🎯 Enhanced refining screenshot command..." : "🎯 Enhanced screenshot command detected! Intercepting...");
    if(process.env.VERBOSE_LLM === 'true' || isRefinementCycle) {
        console.log("   Original screenshot command being processed:", originalScreenshotCommand);
    }

    try {
      // Extract image file details from screenshot command
      const origImageInfo = this.extractImagePathInfo(originalScreenshotCommand);
      const origFileName = origImageInfo.imgFileName;
      const origPath = origImageInfo.imgPath;
      const origDir = origImageInfo.imgDir;
      
      // Try to find reference image in markdown-related directories first
      let base64Screenshot = '';
      if (origFileName) {
        console.log(`🔍 Looking for reference image: '${origFileName}'`);
        
        // If we have an image directory from the command path, check there first
        if (origDir && origDir !== '.') {
          console.log(`📂 Checking command-specified image directory: ${origDir}`);
          try {
            const cmdDirPath = path.resolve(process.cwd(), origDir);
            if (fs.existsSync(cmdDirPath)) {
              const candidatePath = path.join(cmdDirPath, origFileName);
              if (fs.existsSync(candidatePath)) {
                console.log(`✅ Found reference image in command-specified directory: ${cmdDirPath}`);
                base64Screenshot = fs.readFileSync(candidatePath).toString('base64');
              }
            }
          } catch (e) {
            console.warn(`⚠️ Error checking command-specified directory: ${e}`);
          }
        }
        
        // If not found in command directory, use our enhanced image finder
        if (!base64Screenshot) {
          const referenceResult = this.getReferenceImageBase64WithPath(origFileName);
          base64Screenshot = referenceResult.base64;
          this.referenceImageSourcePath = referenceResult.sourcePath;
          
          if (!base64Screenshot) {
            console.warn(`⚠️ Reference image '${origFileName}' not found.`);
          } else if (this.referenceImageSourcePath) {
            console.log(`📍 Found reference image at: ${this.referenceImageSourcePath}`);
          }
        }
      } else {
        console.warn(`⚠️ Could not extract image filename from: ${originalScreenshotCommand.substring(0, 100)}...`);
      }


          
      // Generate enhanced prompt with all available context
      const aiGeneratedCommand = await this.generateEnhancedPrompt(
        base64Screenshot,
        originalScreenshotCommand, 
        origFileName,
        refinementContext,
        thinking,
        fullJsonResponse // Pass the full JSON response
      );

      if (aiGeneratedCommand === originalScreenshotCommand || !aiGeneratedCommand.includes('.screenshot')) {
        console.log(isRefinementCycle ? "ℹ️ Enhanced AI did not refine the command or refinement skipped." : "ℹ️ Enhanced AI did not provide a different command, or generation was skipped.");
        return this.applyTimeoutAndClean(originalCodeBlock);
      }

      console.log(isRefinementCycle ? '✨ Enhanced AI provided refined screenshot code.' : '🖼️ Enhanced screenshot code generated by AI.');
      
      // Extract the path information to modify filenames
      const origImgInfo = this.extractImagePathInfo(originalScreenshotCommand);
      const enhancedImgInfo = this.extractImagePathInfo(aiGeneratedCommand);
      const fileName = origImgInfo.imgFileName;
      const filePath = origImgInfo.imgPath;
      const fileDir = origImgInfo.imgDir;
      
      // Use the same filename for both stock and enhanced versions (no _S or _E suffixes)
      let stockCommand = originalScreenshotCommand;
      let enhancedCommand = aiGeneratedCommand;
      
      // Note: Path modification to img is now handled in screenshot_helper.ts
      // This ensures the images are saved to the correct img folder automatically
      
      if (fileName && filePath) {
        // Check if the filename has an extension
        const lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex <= 0) {
          console.warn('⚠️ No valid extension found in filename. Using default extension.');
          // Add default extension if none exists
          const baseFileName = `${fileName}.png`;
          
          // More robust replacement for stock command
          const escapedFileName = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const fileNameRegex = new RegExp(`(['\"])([^'\"]*?)${escapedFileName}(['\"])`, 'i');
          stockCommand = originalScreenshotCommand.replace(fileNameRegex, (match, p1, p2, p3) => {
            return `${p1}${p2}${baseFileName}${p3}`;
          });
          console.log(`📄 Modified stock filename from '${fileName}' to '${baseFileName}'`);
          
          // More robust replacement for enhanced command
          const enhancedFileNameToReplace = enhancedImgInfo.imgFileName || fileName;
          const escapedEnhancedFileName = enhancedFileNameToReplace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const enhancedRegex = new RegExp(`(['\"])([^'\"]*?)${escapedEnhancedFileName}(['\"])`, 'i');
          enhancedCommand = aiGeneratedCommand.replace(enhancedRegex, (match, p1, p2, p3) => {
            return `${p1}${p2}${baseFileName}${p3}`;
          });
          console.log(`📄 Modified enhanced filename from '${enhancedFileNameToReplace}' to '${baseFileName}'`);
        } else {
          // Use the original filename without adding suffixes
          const baseFileName = fileName;
          
          // Replace the path in the original command in a more robust way
          if (filePath && fileDir) {
            // Use appropriate save directory based on mode
            const saveDir = this.getScreenshotSavePath() || fileDir;
            const basePath = path.join(saveDir, baseFileName);
            
            // Check if the file already exists at the target location
            const imgDir = this.getImgPath();
            if (!imgDir) {
              console.log(`⚠️  No img directory available, skipping path update`);
              enhancedCommand = aiGeneratedCommand; // Keep original command
              console.log(`📄 Using original enhanced command: ${enhancedCommand}`);
              return enhancedCommand; // Return original command to fix TypeScript error
            }
            const targetImagePath = path.join(imgDir, baseFileName);
            const shouldReplace = fs.existsSync(targetImagePath);
            
            if (shouldReplace || !fs.existsSync(path.join(imgDir, baseFileName))) {
              // More robust path replacement using regex with word boundaries
              const escapedFilePath = filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const pathRegex = new RegExp(`(path\\s*:\\s*['\"])${escapedFilePath}(['\"])`, 'i');
              stockCommand = originalScreenshotCommand.replace(pathRegex, `$1${basePath.replace(/\\/g, '/')}$2`);
              
              // If no replacement occurred (no path: syntax), try direct replacement
              if (stockCommand === originalScreenshotCommand) {
                const directRegex = new RegExp(`(['\"])${escapedFilePath}(['\"])`, 'i');
                stockCommand = originalScreenshotCommand.replace(directRegex, `$1${basePath.replace(/\\/g, '/')}$2`);
              }
              
              console.log(`📂 Modified stock path from '${filePath}' to '${basePath}' (${this.currentMode} mode)`);
            } else {
              console.log(`ℹ️  Skipping stock path update - image exists at target location: ${targetImagePath}`);
            }
          } else {
            // If we only have a filename, use a more precise replacement
            const escapedFileName = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const fileNameRegex = new RegExp(`(['\"])([^'\"]*?)${escapedFileName}(['\"])`, 'i');
            stockCommand = originalScreenshotCommand.replace(fileNameRegex, (match, p1, p2, p3) => {
              return `${p1}${p2}${baseFileName}${p3}`;
            });
            console.log(`📄 Modified stock filename from '${fileName}' to '${baseFileName}'`);
          }
          
          // Replace the path in the enhanced command using the same robust approach
          if (enhancedImgInfo.imgPath && enhancedImgInfo.imgDir) {
            // Use appropriate save directory based on mode
            const saveDir = this.getScreenshotSavePath() || enhancedImgInfo.imgDir;
            const basePath = path.join(saveDir, baseFileName);
            
            // Check if the file already exists at the target location
            const imgDir = this.getImgPath();
            if (!imgDir) {
              console.log(`⚠️  No img directory available, skipping path update`);
              enhancedCommand = aiGeneratedCommand; // Keep original command
              console.log(`📄 Using original enhanced command: ${enhancedCommand}`);
              return enhancedCommand; // Return original command to fix TypeScript error
            }
            const targetImagePath = path.join(imgDir, baseFileName);
            const shouldReplace = fs.existsSync(targetImagePath);
            
            if (shouldReplace || !fs.existsSync(path.join(imgDir, baseFileName))) {
              // More robust path replacement
              const escapedPath = enhancedImgInfo.imgPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const pathRegex = new RegExp(`(path\\s*:\\s*['\"])${escapedPath}(['\"])`, 'i');
              enhancedCommand = aiGeneratedCommand.replace(pathRegex, `$1${basePath.replace(/\\/g, '/')}$2`);
              
              // If no replacement occurred, try direct replacement
              if (enhancedCommand === aiGeneratedCommand) {
                const directRegex = new RegExp(`(['\"])${escapedPath}(['\"])`, 'i');
                enhancedCommand = aiGeneratedCommand.replace(directRegex, `$1${basePath.replace(/\\/g, '/')}$2`);
              }
              
              console.log(`📂 Modified enhanced path from '${enhancedImgInfo.imgPath}' to '${basePath}' (${this.currentMode} mode)`);
            } else {
              console.log(`ℹ️  Skipping enhanced path update - image exists at target location: ${targetImagePath}`);
            }
          } else {
            // If we only have a filename, use a more precise replacement
            const enhancedFileName = enhancedImgInfo.imgFileName || fileName;
            const escapedFileName = enhancedFileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const fileNameRegex = new RegExp(`(['\"])([^'\"]*?)${escapedFileName}(['\"])`, 'i');
            enhancedCommand = aiGeneratedCommand.replace(fileNameRegex, (match, p1, p2, p3) => {
              return `${p1}${p2}${baseFileName}${p3}`;
            });
            console.log(`📄 Modified enhanced filename from '${enhancedFileName}' to '${baseFileName}'`);
          }
        }
      }
      
      // Check if stock screenshots are disabled
      const disableStockScreenshots = process.env.DISABLE_STOCK_SCREENSHOTS === 'true';
      
      if (disableStockScreenshots) {
        console.log('📸 Stock screenshots disabled - will only take enhanced screenshot');
        console.log('📸 Enhanced command:', enhancedCommand);
      } else {
        console.log('📸 Will take both stock and enhanced screenshots:');
        console.log('📸 Stock command:', stockCommand);
        console.log('📸 Enhanced command:', enhancedCommand);
      }
      
      // Ensure target directories exist before taking screenshots
      let ensureDirCode = '';
      
      // Extract directories from both commands
      const stockPathMatch = stockCommand.match(/path\s*:\s*['"]([^'"]+)['"]/i);
      const enhancedPathMatch = enhancedCommand.match(/path\s*:\s*['"]([^'"]+)['"]/i);
      
      // If paths were found, ensure their directories exist
      if (stockPathMatch || enhancedPathMatch) {
        ensureDirCode = `
// Ensure screenshot directories exist
const fs = require('fs');
const path = require('path');

`;
        
        if (stockPathMatch) {
          const stockPath = stockPathMatch[1].replace(/\\/g, '/');
          ensureDirCode += `
// Ensure stock screenshot directory exists
const stockPath = "${stockPath}";
const stockDir = path.dirname(stockPath);
if (!fs.existsSync(stockDir)) {
  fs.mkdirSync(stockDir, { recursive: true });
  console.log('📁 Created directory for stock screenshot:', stockDir);
}
`;
        }
        
        if (enhancedPathMatch) {
          const enhancedPath = enhancedPathMatch[1].replace(/\\/g, '/');
          ensureDirCode += `
// Ensure enhanced screenshot directory exists
const enhancedPath = "${enhancedPath}";
const enhancedDir = path.dirname(enhancedPath);
if (!fs.existsSync(enhancedDir)) {
  fs.mkdirSync(enhancedDir, { recursive: true });
  console.log('📁 Created directory for enhanced screenshot:', enhancedDir);
}
`;
        }
      }
      
      // Add force: true to stock command if not present
      let finalStockCommand = stockCommand;
      if (!finalStockCommand.includes('force:') && !finalStockCommand.includes('force :')) {
        // Find the locator part and add force: true as parameter
        finalStockCommand = finalStockCommand.replace(
          /(page\.locator\([^,)]+)\)/,
          '$1, { force: true })'
        );
        // If that didn't work (locator already has options), try adding force to existing options
        if (finalStockCommand === stockCommand) {
          finalStockCommand = finalStockCommand.replace(
            /(page\.locator\([^,)]+,\s*{)([^}]*)(}\))/,
            (match, p1, p2, p3) => {
              const hasOptions = p2.trim().length > 0;
              return `${p1}${hasOptions ? p2 + ', ' : ''}force: true${p3}`;
            }
          );
        }
      }

      // Generate a code block that executes both commands with directory creation
      const finalCodeBlock = originalCodeBlock.replace(
        originalScreenshotCommand, 
        `${ensureDirCode}

// Stock version
${finalStockCommand.replace(/path\s*:\s*(['"])(.*?\.(?:png|jpg|jpeg|gif|bmp|webp))(['"])/gi, (match, p1, p2, p3) => 
  `path: ${p1}${p2.replace(/\\/g, '/')}${p3}`)}

// Enhanced version
${enhancedCommand.replace(/path\s*:\s*(['"])(.*?\.(?:png|jpg|jpeg|gif|bmp|webp))(['"])/gi, (match, p1, p2, p3) => 
  `path: ${p1}${p2.replace(/\\/g, '/')}${p3}`)}`
      );
      
      return this.applyTimeoutAndClean(finalCodeBlock);

    } catch (error: any) {
      console.warn(`⚠️ Failed to ${isRefinementCycle ? 'refine' : 'enhance'} screenshot command (${error?.message ?? 'unknown'}).`);
      return this.applyTimeoutAndClean(originalCodeBlock);
    }
  }

  /**
   * Highlight container elements on the page for better AI understanding
   */
  private async highlightContainers(containers: ContainerInfo[]): Promise<string> {
    // Highlight a focused set of containers to avoid visual clutter
    const topContainers = containers.slice(0, 8); // Reduced back to 8 for cleaner visualization
    
    return await this.page.evaluate((containersToHighlight) => {
      // Clean up any previous highlights
      document.querySelectorAll('.container-highlight-overlay, .container-highlight-badge, .container-highlight-legend').forEach(el => el.remove());
      
      // Use a consistent color palette for better visibility
      function getContainerColor(index: number): string {
        const colors = [
          '#E63946', // bright red
          '#1D3557', // dark blue
          '#2A9D8F', // teal
          '#E9C46A', // gold
          '#8338EC', // purple
          '#FF6B35', // orange
          '#2B9348', // green
          '#7B2CBF', // violet
          '#F94144', // coral
          '#073B4C'  // navy
        ];
        return colors[index % colors.length];
      }
      
      // Sort containers by size (largest first) to prevent small containers from being obscured
      const sortedContainers = [...containersToHighlight].sort((a, b) => {
        // Try to get elements
        const elemA = document.querySelector(a.selector);
        const elemB = document.querySelector(b.selector);
        
        if (!elemA || !elemB) return 0;
        
        const rectA = elemA.getBoundingClientRect();
        const rectB = elemB.getBoundingClientRect();
        
        // Calculate area
        const areaA = rectA.width * rectA.height;
        const areaB = rectB.width * rectB.height;
        
        // Sort by area (largest first)
        return areaB - areaA;
      });
      
      // Store badge positions to prevent overlap
      const usedPositions = new Set();
      
      // Create a highlight overlay for each container
      sortedContainers.forEach((container, index) => {
        try {
          const element = document.querySelector(container.selector);
          if (!element) return;
          
          const rect = element.getBoundingClientRect();
          
          // Skip tiny elements
          if (rect.width < 10 || rect.height < 10) return;
          
          // Create highlight element
          const highlight = document.createElement('div');
          highlight.className = 'container-highlight-overlay';
          highlight.style.position = 'absolute';
          highlight.style.top = rect.top + 'px';
          highlight.style.left = rect.left + 'px';
          highlight.style.width = rect.width + 'px';
          highlight.style.height = rect.height + 'px';
          
          const color = getContainerColor(index);
          highlight.style.border = `3px solid ${color}`;
          highlight.style.boxSizing = 'border-box';
          highlight.style.backgroundColor = 'transparent';
          highlight.style.zIndex = (10000 - index).toString(); // Larger containers get lower z-index
          highlight.style.pointerEvents = 'none';
          
          // Find a good position for the badge that doesn't overlap with others
          // Define position types
          type BadgePosition = {
            top?: number;
            right?: number;
            bottom?: number;
            left?: number;
          };
          
          let badgePosition: BadgePosition = { top: -15, right: -15 }; // Default position
          
          // Try different positions if the default is already used
          const positions: BadgePosition[] = [
            { top: -15, right: -15 }, // Top right (default)
            { top: -15, right: 15 },  // Top middle-right
            { top: -15, right: 45 },  // Top far-right
            { top: 15, right: -15 },  // Middle right
            { top: 45, right: -15 },  // Far right
            { top: rect.height - 15, right: -15 }, // Bottom right
            { top: rect.height - 15, left: -15 },  // Bottom left
            { top: -15, left: -15 }     // Top left
          ];
          
          // Find first unused position
          for (const pos of positions) {
            const posKey = JSON.stringify(pos);
            if (!usedPositions.has(posKey)) {
              badgePosition = pos;
              usedPositions.add(posKey);
              break;
            }
          }
          
          // Add container number badge
          const badge = document.createElement('div');
          badge.className = 'container-highlight-badge';
          badge.style.position = 'absolute';
          
          // Apply the position
          if (badgePosition.top !== undefined) badge.style.top = `${badgePosition.top}px`;
          if (badgePosition.right !== undefined) badge.style.right = `${badgePosition.right}px`;
          if (badgePosition.bottom !== undefined) badge.style.bottom = `${badgePosition.bottom}px`;
          if (badgePosition.left !== undefined) badge.style.left = `${badgePosition.left}px`;
          
          badge.style.backgroundColor = color;
          badge.style.color = 'white';
          badge.style.borderRadius = '50%';
          badge.style.width = '26px';
          badge.style.height = '26px';
          badge.style.display = 'flex';
          badge.style.alignItems = 'center';
          badge.style.justifyContent = 'center';
          badge.style.fontSize = '14px';
          badge.style.fontWeight = 'bold';
          badge.style.boxShadow = '0 0 0 2px white';
          badge.textContent = `${index + 1}`;
          highlight.appendChild(badge);
          
          document.body.appendChild(highlight);
        } catch (e) {
          console.error('Error highlighting container:', e);
        }
      });
      
      return 'Containers highlighted for screenshot';
    }, topContainers);
  }

  /**
   * Take a screenshot with container highlighting
   */
  /**
   * Get a description of an image using LLM
   */
  private async getImageDescription(base64Image: string): Promise<string> {
    try {
      const { aiConfig } = playwrightConfig;
      
      // Check if we have a valid base64 image
      if (!base64Image || base64Image.length < 100) {
        console.warn('⚠️ Invalid or empty base64 image provided');
        return '';
      }
      
      // Prefer explicit override via env or hardcoded endpoint provided by user
      const overrideEndpoint = process.env.AZURE_OPENAI_ENDPOINT || 'https://dhanu-m7k6n5e0-eastus2.cognitiveservices.azure.com/openai/deployments/gpt-5-chat/chat/completions?api-version=2025-01-01-preview';
      const endpoint = overrideEndpoint || `${aiConfig.apiUrl}/openai/deployments/${aiConfig.ivModel}/chat/completions?api-version=${aiConfig.apiVersion}`;
      const apiKey = process.env.AZURE_OPENAI_API_KEY || aiConfig.apiKey;

      console.log('🖼️ Getting image description from LLM...');
      
      // Enhanced prompt for better UI descriptions
      const userMessageContent = [
        {
          type: "text",
          text: "Analyze this website screenshot and describe what portion of the interface it represents. Specifically:\n\nDoes it show the entire webpage/application window, or just a specific section/panel/component? Clearly state this.\n\nIf it is a part, describe which container/section it seems to belong to (e.g., sidebar panel, modal dialog, content area, toolbar, footer, etc.).\n\nBriefly outline the main visible elements (toolbars, panels, text, buttons) to support the classification.\n\nKeep the output compact, structured, and focused on identifying the correct container scope for screenshotting."
        },
        {
          type: "image_url",
          image_url: { url: `data:image/png;base64,${base64Image}`, detail: "high" }
        }
      ];
      
      const requestPayload = {
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert UI analyst that provides clear, structured descriptions of user interface screenshots. Focus on identifying key UI elements, their arrangement, and the purpose of the screen. Be precise and thorough but concise. Organize your description logically.' 
          },
          { role: 'user', content: userMessageContent }
        ],
        temperature: 0.6,
        max_tokens: 1000
      };

      const startTime = Date.now();
      try {
        console.log(`📤 Sending API request to ${endpoint.split('/').slice(0, 3).join('/')}...`);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey,
          },
          body: JSON.stringify(requestPayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`LLM API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        const description = data.choices?.[0]?.message?.content?.trim();
        
        if (!description) {
          throw new Error('No description returned from API');
        }
        
        console.log(`✅ Got image description (${Date.now() - startTime}ms)`);
        console.log(`📝 Description preview: ${description.substring(0, 100)}...`);
        
        return description;
      } catch (apiError) {
        console.error(`❌ API error: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
        
        // Return a basic fallback description so the process can continue
        return "The image shows a user interface screen from the application.";
      }
    } catch (error) {
      console.error('❌ Error getting image description:', error);
      return '';
    }
  }

  private async takeHighlightedScreenshot(): Promise<string> {
    // Get container info based on the current page content
    const containers = await this.getScreenshotContainers();
    
    // Highlight containers and take screenshot
    await this.highlightContainers(containers);
    
    // Take screenshot with highlights
    const buffer = await this.page.screenshot({ fullPage: false });
    
          // Save the highlighted container screenshot to a special folder
    try {
      // Create container-images directory if it doesn't exist
      const containerImagesDir = path.join(process.cwd(), 'container-images').replace(/\\/g, '/');
      if (!fs.existsSync(containerImagesDir)) {
        fs.mkdirSync(containerImagesDir, { recursive: true });
        console.log('📁 Created directory for container screenshots:', containerImagesDir);
      }
      
      // Generate a filename with timestamp to avoid overwriting
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const pageUrl = new URL(await this.page.url());
      const pathSegment = pageUrl.pathname.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
      const filename = `container-highlights-${pathSegment}-${timestamp}.png`;
      const filePath = path.join(containerImagesDir, filename).replace(/\\/g, '/');
      
      // Save the screenshot
      fs.writeFileSync(filePath, buffer);
      console.log('📸 Saved highlighted container screenshot to:', filePath);
    } catch (error) {
      console.error('⚠️ Failed to save highlighted container screenshot:', error instanceof Error ? error.message : String(error));
    }
    
    // Remove highlights
    await this.page.evaluate(() => {
      document.querySelectorAll('.container-highlight-overlay').forEach(el => el.remove());
    });
    
    return buffer.toString('base64');
  }

  /**
   * Execute code with enhanced screenshot interception
   */
  async executeWithEnhancedScreenshotInterception(
    code: string, 
    isInternalRetry: boolean = false, 
    logger?: any, 
    stepNumber?: number, 
    thinking?: string,
    mdFilePath?: string,
    screenshotIntent?: string,
    fullJsonResponse?: string, // Add parameter for the full JSON response
    mode?: string // Add parameter for current mode
  ): Promise<void> {
    console.log('🚀 Starting enhanced code execution...');
    console.log('📍 Page URL:', this.page.url());
    console.log('📝 Code to execute:', code);
    console.log('🧠 LLM thinking:', thinking);
    if (screenshotIntent) {
      console.log('📸 Screenshot intent:', screenshotIntent);
    }
    if (fullJsonResponse) {
      console.log('📋 Full JSON response:', fullJsonResponse);
    }
    console.log('📊 Step number:', stepNumber);
    
    // Set mode if provided
    if (mode) {
      this.setCurrentMode(mode);
    }
    
    // Store and log thinking immediately
    try {
      const pageUrl = await this.page.url();
      const timestamp = new Date().toISOString();
      const thinkingEntry = {
        step: stepNumber,
        code: code,
        thinking: thinking || 'No thinking provided',
        timestamp,
        url: pageUrl
      };
      
      this.thinkingHistory.push(thinkingEntry);
      
      // Write thinking to file immediately
      try {
        const thinkingLogPath = 'ai_thinking_log.txt';
        const thinkingLog = `\n--- Step ${stepNumber || this.thinkingHistory.length} (${timestamp}) ---\n${thinking || 'No thinking provided'}\n`;
        fs.appendFileSync(thinkingLogPath, thinkingLog);
      } catch (writeError) {
        console.warn('⚠️ Could not write thinking to log file:', writeError instanceof Error ? writeError.message : String(writeError));
      }
    } catch (e) {
      console.warn('⚠️ Failed to process thinking:', e instanceof Error ? e.message : String(e));
    }
    console.log('📋 Logger available:', !!logger);
    
    try {
      // If a markdown file path is provided, set it
      if (mdFilePath && !this.currentMdPath) {
        console.log('📄 Setting markdown path from execution context:', mdFilePath);
        this.setCurrentMdFilePath(mdFilePath);
      }
      
      // Check if we have a current markdown path
      if (this.currentMdPath) {
        console.log('📄 Using current markdown path for image reference:', this.currentMdPath);
      }
      
      // Look for screenshot commands in the code
      const hasScreenshotCommand = /\.screenshot\s*\(/i.test(code);
      if (hasScreenshotCommand) {
        console.log('📸 Detected screenshot command in code - will apply enhanced interception');
        if (screenshotIntent) {
          console.log('🎯 Using provided screenshot intent: ' + screenshotIntent);
        }
      }
      
      // Intercept screenshot commands with enhanced logic
      const enhancedCode = await this.interceptScreenshotCommandEnhanced(
        code, 
        isInternalRetry, 
        undefined, 
        thinking,
        screenshotIntent,
        fullJsonResponse
      );
      
      // Execute the enhanced code using Function constructor
      // Log the code that will be executed
      console.log('🧪 Executing code:', enhancedCode);

      try {
        // Check if this is a screenshot command that can benefit from stabilization
        if (hasScreenshotCommand) {
          console.log('🛡️ Using screenshot stabilization for execution');
          await this.executeScreenshotWithStability(enhancedCode);
          console.log('✅ Enhanced stable screenshot execution completed successfully');
        } else {
          // Standard execution for non-screenshot code
          const func = new Function('page', `return (async () => { ${enhancedCode} })()`);
          await func(this.page);
          console.log('✅ Enhanced code execution completed successfully');
        }
      } catch (execError) {
        console.error('⚠️ Error during code execution:', execError instanceof Error ? execError.message : String(execError));
        console.error('⚠️ Problem with code:', enhancedCode);
        
        // If execution failed and it's a screenshot command, try with standard execution
        if (hasScreenshotCommand) {
          console.log('🔄 Attempting fallback to standard execution without stabilization');
          try {
            const func = new Function('page', `return (async () => { ${enhancedCode} })()`);
            await func(this.page);
            console.log('✅ Standard execution succeeded as fallback');
          } catch (fallbackError) {
            console.error('💥 Both stabilized and standard execution failed');
            throw execError; // Throw the original error
          }
        } else {
          throw execError;
        }
      }
      
    } catch (error: any) {
      console.error('❌ Enhanced code execution failed:', error.message);
      console.error('📍 Error occurred on page:', this.page.url());
      console.error('📝 Failed code:', code);
      throw error;
    }
  }

  private applyTimeoutAndClean(code: string): string {
    // Add timeout to screenshot commands if not present
    return code.replace(
      /\.screenshot\(\s*{([^}]*)}\s*\)/g,
      (match, inner) => {
        if (inner.includes('timeout')) {
          return match; // Already has timeout
        }
        return `.screenshot({ ${inner}, timeout: 30000 })`;
      }
    ).replace(
      /\.screenshot\(\s*\)/g,
      '.screenshot({ timeout: 30000 })'
    );
  }

  /**
   * Modify screenshot command to use appropriate directory based on mode
   */
  private modifyPathForImgAs(command: string): string {
    let modifiedCommand = command;
    
    // Get the appropriate save path based on current mode
    const savePath = this.getScreenshotSavePath();
    if (!savePath) {
      console.warn('⚠️  No save path available, using relative path');
      return this.modifyPathForImgAsRelative(command);
    }
    
    const savePathNormalized = savePath.replace(/\\/g, '/');
    const isUiChangeMode = this.currentMode === 'ui_change';
    
    console.log(`📁 Using ${isUiChangeMode ? 'reference image source' : 'img'} path for ${this.currentMode} mode: ${savePathNormalized}`);
    
    // Replace 'img/' with appropriate save path in screenshot paths
    modifiedCommand = modifiedCommand.replace(/(['"`])img\//g, `$1${savePathNormalized}/`);
    
    // Also handle cases where the path doesn't include a folder (just filename)
    // Replace patterns like { path: './filename.png' } with { path: 'absolute_path/filename.png' }
    modifiedCommand = modifiedCommand.replace(
      /(path\s*:\s*['"`])\.\/([^'"\/\\]+\.(?:png|jpg|jpeg|gif|bmp|webp))(['"`])/gi,
      `$1${savePathNormalized}/$2$3`
    );
    
    // Replace patterns like { path: 'filename.png' } with { path: 'absolute_path/filename.png' }
    modifiedCommand = modifiedCommand.replace(
      /(path\s*:\s*['"`])([^'"\/\\:]+\.(?:png|jpg|jpeg|gif|bmp|webp))(['"`])/gi,
      (match, p1, filename, p3) => {
        // Don't modify if it already contains the save path or starts with a path or is already absolute
        if (filename.includes(path.basename(savePath)) || filename.includes('/') || filename.includes('\\') || filename.includes(':')) {
          return match;
        }
        return `${p1}${savePathNormalized}/${filename}${p3}`;
      }
    );
    
    return modifiedCommand;
  }

  /**
   * Fallback method for relative path modification (when absolute path is not available)
   */
  private modifyPathForImgAsRelative(command: string): string {
    let modifiedCommand = command;
    
    // Use different folder based on mode
    const relativeFolder = this.currentMode === 'ui_change' ? 'img' : 'img';
    console.log(`📁 Using relative ${relativeFolder} folder for ${this.currentMode} mode`);
    
    // Replace 'img/' with appropriate folder in screenshot paths
    modifiedCommand = modifiedCommand.replace(/(['"`])img\//g, `$1${relativeFolder}/`);
    
    // Also handle cases where the path doesn't include a folder (just filename)
    // Replace patterns like { path: './filename.png' } with { path: './folder/filename.png' }
    modifiedCommand = modifiedCommand.replace(
      /(path\s*:\s*['"`])\.\/([^'"\/\\]+\.(?:png|jpg|jpeg|gif|bmp|webp))(['"`])/gi,
      `$1./${relativeFolder}/$2$3`
    );
    
    // Replace patterns like { path: 'filename.png' } with { path: 'folder/filename.png' }
    modifiedCommand = modifiedCommand.replace(
      /(path\s*:\s*['"`])([^'"\/\\:]+\.(?:png|jpg|jpeg|gif|bmp|webp))(['"`])/gi,
      (match, p1, filename, p3) => {
        // Don't modify if it already contains the folder or starts with a path
        if (filename.includes(relativeFolder) || filename.includes('/') || filename.includes('\\')) {
          return match;
        }
        return `${p1}${relativeFolder}/${filename}${p3}`;
      }
    );
    
    return modifiedCommand;
  }

  /**
   * Executes screenshot code with simplified retry logic
   * @param code The screenshot code to execute
   * @returns The result of the execution
   */
  async executeScreenshotWithStability(code: string): Promise<any> {
    // Ensure img directory exists
    this.ensureImgFolder();
    
    // Note: Path modification to img is now handled automatically in screenshot_helper.ts
    // The screenshot helper will modify paths to use the correct img folder before execution
    let modifiedCode = code;
    
    // Ensure directories exist first (extract and run that part safely)
    if (modifiedCode.includes('fs.mkdirSync')) {
      try {
        // Execute just the directory creation part
        const dirSetupCode = modifiedCode.split(/\/\/\s*(Stock|Enhanced)\s*version/)[0];
        const dirSetupFunc = new Function('page', `return (async () => { ${dirSetupCode} })()`);
        await dirSetupFunc(this.page);
        console.log('✅ Directory setup completed');
      } catch (e) {
        console.log('⚠️ Directory setup failed, will continue anyway:', e instanceof Error ? e.message : String(e));
      }
    }
    
    // Check if this is a complex multi-statement screenshot block
    if (modifiedCode.includes('// Stock version') || modifiedCode.includes('// Enhanced version')) {
      console.log('📦 Detected complex multi-statement screenshot block, executing both stock and enhanced versions');
      
      const lines = modifiedCode.split('\n');
      let stockCmd = '';
      let enhancedCmd = '';
      
      // Find the stock command (if not disabled)
      const disableStockScreenshots = process.env.DISABLE_STOCK_SCREENSHOTS === 'true';
      
      if (!disableStockScreenshots) {
        for (const line of lines) {
          if (line.includes('// Stock version') && lines.indexOf(line) + 1 < lines.length) {
            stockCmd = lines[lines.indexOf(line) + 1].trim();
            break;
          }
        }
      } else {
        console.log('📸 Stock screenshots disabled - skipping stock version');
      }
      
      // Find the enhanced command
      for (const line of lines) {
        if (line.includes('// Enhanced version') && lines.indexOf(line) + 1 < lines.length) {
          enhancedCmd = lines[lines.indexOf(line) + 1].trim();
          break;
        }
      }
      
      // Path modification to img is handled automatically in screenshot_helper.ts
      if (stockCmd && !disableStockScreenshots) {
        console.log('🔍 Executing stock screenshot command with retries:', stockCmd);
        
        // Extract image filename for tracking (just the filename, not full path)
        const pathMatch = stockCmd.match(/path:\s*['"]([^'"]+)['"]/);
        if (pathMatch) {
          const filename = path.basename(pathMatch[1]);
          this.trackGeneratedImage(filename);
        }
        
        await forceScreenshotWithRetries(stockCmd, this.page, this);
      }
      
      if (enhancedCmd) {
        console.log('🔍 Executing enhanced screenshot command with retries:', enhancedCmd);
        
        // Extract image filename for tracking (just the filename, not full path)
        const pathMatch = enhancedCmd.match(/path:\s*['"]([^'"]+)['"]/);
        if (pathMatch) {
          const filename = path.basename(pathMatch[1]);
          this.trackGeneratedImage(filename);
        }
        
        await forceScreenshotWithRetries(enhancedCmd, this.page, this);
      }
      
      return;
    }
    
    // For simple screenshot commands, just execute directly with retries
    console.log('🔍 Executing simple screenshot command with retries');
    
    // Extract image filename for tracking (just the filename, not full path)
    const pathMatch = modifiedCode.match(/path:\s*['"]([^'"]+)['"]/);
    if (pathMatch) {
      const filename = path.basename(pathMatch[1]);
      this.trackGeneratedImage(filename);
    }
    
    await forceScreenshotWithRetries(modifiedCode, this.page, this);
    return;
  }

  private getReferenceImageBase64(imageFileName: string): string {
    const result = this.getReferenceImageBase64WithPath(imageFileName);
    return result.base64;
  }

  private getReferenceImageBase64WithPath(imageFileName: string): { base64: string; sourcePath: string | null } {
    try {
      // Start from current markdown document directory if available
      let searchRoot: string;
      
      if (this.currentMdPath) {
        // Use the directory containing the current markdown file
        searchRoot = path.dirname(this.currentMdPath);
        console.log(`🔍 Searching for image '${imageFileName}' in all subdirectories under: ${searchRoot}`);
      } else {
        // Fallback to environment-aware docs directory
        searchRoot = this.getDocsDirectory();
        console.log(`🔍 Searching for image '${imageFileName}' in fallback docs directory: ${searchRoot}`);
      }
      
      if (!fs.existsSync(searchRoot)) {
        console.log(`⚠️ Search root directory does not exist: ${searchRoot}`);
        return { base64: '', sourcePath: null };
      }
      
      // Search in all subdirectories under the document directory first
      const foundImagePath = this.findImageInAllSubdirectories(searchRoot, imageFileName);
      
      if (foundImagePath) {
        console.log(`✅ Found reference image at: ${foundImagePath}`);
        return {
          base64: fs.readFileSync(foundImagePath).toString('base64'),
          sourcePath: path.dirname(foundImagePath)
        };
      }
      
      // If not found in current document directory tree, try the docs directory as fallback
      const docsDir = this.getDocsDirectory();
      if (this.currentMdPath && searchRoot !== docsDir) {
        console.log(`🔍 Image not found in document directory tree, trying docs directory fallback...`);
        
        if (fs.existsSync(docsDir)) {
          const fallbackImagePath = this.findImageInAllSubdirectories(docsDir, imageFileName);
          
          if (fallbackImagePath) {
            console.log(`✅ Found reference image in docs fallback at: ${fallbackImagePath}`);
            return {
              base64: fs.readFileSync(fallbackImagePath).toString('base64'),
              sourcePath: path.dirname(fallbackImagePath)
            };
          }
        }
      }
      
      console.log(`❌ Image '${imageFileName}' not found in any directory`);
      return { base64: '', sourcePath: null };
      
    } catch (error: any) {
      console.error(`❌ Error searching for image '${imageFileName}':`, error.message);
      return { base64: '', sourcePath: null };
    }
  }

  /**
   * Search for an image file in all subdirectories under the document directory
   * This focuses on the specific document's folder structure
   */
  private findImageInAllSubdirectories(searchRoot: string, imageFileName: string): string | null {
    try {
      if (!fs.existsSync(searchRoot) || !fs.lstatSync(searchRoot).isDirectory()) {
        return null;
      }
      
      console.log(`🔍 Searching in document directory: ${searchRoot}`);
      
      // First check directly in the root directory
      const directPath = path.join(searchRoot, imageFileName);
      if (fs.existsSync(directPath)) {
        console.log(`✅ Found image directly in root: ${directPath}`);
        return directPath;
      }
      
      // Get all subdirectories under the document directory
      const items = fs.readdirSync(searchRoot);
      const subdirectories = items.filter(item => {
        const itemPath = path.join(searchRoot, item);
        try {
          return fs.existsSync(itemPath) && fs.lstatSync(itemPath).isDirectory();
        } catch (e) {
          return false;
        }
      }).filter(dir => {
        // Skip common non-content directories
        const skipDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', 'out', 'img'];
        return !skipDirs.includes(dir);
      });
      
      console.log(`📂 Searching in ${subdirectories.length} subdirectories: ${subdirectories.join(', ')}`);
      
      // Search in each subdirectory using deep recursive search
      for (const subdir of subdirectories) {
        const subdirPath = path.join(searchRoot, subdir);
        console.log(`🔍 Deep searching in: ${subdirPath}`);
        
        const foundPath = this.findImageInDirectory(subdirPath, imageFileName);
        if (foundPath) {
          console.log(`✅ Found image in subdirectory: ${foundPath}`);
          return foundPath;
        }
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Error searching subdirectories in ${searchRoot}:`, error);
      return null;
    }
  }

  /**
   * Recursively search for an image file in a directory structure
   */
  private findImageInDirectory(searchDir: string, imageFileName: string): string | null {
    try {
      if (!fs.existsSync(searchDir) || !fs.lstatSync(searchDir).isDirectory()) {
        return null;
      }
      
      // Check directly in this directory
      const directPath = path.join(searchDir, imageFileName);
      if (fs.existsSync(directPath)) {
        return directPath;
      }
      
      // Check in common image directories
      const commonImageDirs = ['img', 'images', 'Images', 'IMG', 'assets', 'screenshots'];
      
      for (const imgDirName of commonImageDirs) {
        const imgDir = path.join(searchDir, imgDirName);
        if (fs.existsSync(imgDir) && fs.lstatSync(imgDir).isDirectory()) {
          const imgPath = path.join(imgDir, imageFileName);
          if (fs.existsSync(imgPath)) {
            return imgPath;
          }
        }
      }
      
      // Recursively search subdirectories
      const items = fs.readdirSync(searchDir);
      
      for (const item of items) {
        const itemPath = path.join(searchDir, item);
        
        try {
          if (fs.lstatSync(itemPath).isDirectory()) {
            // Skip common directories that typically don't contain reference images
            const skipDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', 'out'];
            if (skipDirs.includes(item)) {
              continue;
            }
            
            const foundPath = this.findImageInDirectory(itemPath, imageFileName);
            if (foundPath) {
              return foundPath;
            }
          }
        } catch (e) {
          // Skip directories we can't access
          continue;
        }
      }
      
      return null;
    } catch (error) {
      // Silent error for individual directory access issues
      return null;
    }
  }


} 