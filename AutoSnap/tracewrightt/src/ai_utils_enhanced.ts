import { Page } from "@playwright/test";
import fs from "fs";
import path from "path";
import axios from "axios";
import { apiLogger, APILogEntry } from "./llm_providers/api_logger.js";
import { forceScreenshotWithRetries } from "./screenshot_helper.js";

// Environment variables will be used for configuration instead of playwright config

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
    
    // Check multiple locations for the path file created by the Python script
    const possiblePathFiles = [
      path.join(process.cwd(), 'AutoSnap', 'current_md_path.txt'),   // AutoSnap directory (primary location)
      'current_md_path.txt',                                         // Current directory
      '../current_md_path.txt',                                      // Parent directory
    ];
    
    let foundPathFile = false;
    
    for (const pathFile of possiblePathFiles) {
      console.log(`🔍 Checking for path file at: ${pathFile}`);
      
      try {
        if (fs.existsSync(pathFile)) {
          console.log(`✅ Found path file at: ${pathFile}`);
          const fileContent = fs.readFileSync(pathFile, 'utf8').trim();
          
          if (fileContent && fileContent.length > 0) {
            console.log(`✅ Path file contains: ${fileContent}`);
            
            // Check if the file content contains mode information (path|mode format)
            let pathFromFile: string;
            let mode: string = 'default';
            
            if (fileContent.includes('|')) {
              const [filePath, modeInfo] = fileContent.split('|');
              pathFromFile = this.normalizePath(filePath);
              mode = modeInfo.trim();
              console.log(`📝 Detected mode information: ${mode}`);
              // Store mode as an environment variable
              process.env.CURRENT_MD_MODE = mode;
              // Store mode as a class property for use in other methods
              this.currentMode = mode;
            } else {
              // Legacy format - just the path
              pathFromFile = this.normalizePath(fileContent);
            }
            
            this.currentMdPath = pathFromFile;
            
            console.log(`📝 Using path from file: ${this.currentMdPath}`);
            
            // Also set it as an environment variable for other components
            process.env.CURRENT_MD_PATH = pathFromFile;
            
            // Create img folder in the directory where the markdown file is located
            this.ensureImgFolder();
            
            foundPathFile = true;
            return; // Exit early since we found a valid file
          } else {
            console.log(`⚠️ Path file exists but is empty or invalid at: ${pathFile}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error reading path file ${pathFile}: ${error}`);
      }
    }
    
    if (!foundPathFile) {
      console.log(`⚠️ Could not find valid path file in any location`);
    }
    
    // Fallback to the provided path if the file doesn't exist or is invalid
    console.log(`⚠️ Using provided path as fallback: ${mdPath}`);
    
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
    // Check multiple locations for the path file created by the Python script
    const possiblePathFiles = [
      path.join(process.cwd(), 'AutoSnap', 'current_md_path.txt'),   // AutoSnap directory (primary location)
      'current_md_path.txt',                                         // Current directory
      '../current_md_path.txt',                                      // Parent directory
    ];
    
    let foundPathFile = false;
    
    for (const pathFile of possiblePathFiles) {
      console.log(`🔍 Checking for path file at: ${pathFile}`);
      
      try {
        if (fs.existsSync(pathFile)) {
          console.log(`✅ Found path file at: ${pathFile}`);
          const fileContent = fs.readFileSync(pathFile, 'utf8').trim();
          
          if (fileContent && fileContent.length > 0) {
            console.log(`✅ Path file contains: ${fileContent}`);
            
            // Check if the file content contains mode information (path|mode format)
            let pathFromFile: string;
            let mode: string = 'default';
            
            if (fileContent.includes('|')) {
              const [filePath, modeInfo] = fileContent.split('|');
              pathFromFile = this.normalizePath(filePath);
              mode = modeInfo.trim();
              console.log(`📝 Detected mode information: ${mode}`);
              // Store mode as an environment variable
              process.env.CURRENT_MD_MODE = mode;
              // Store mode as a class property for use in other methods
              this.currentMode = mode;
            } else {
              // Legacy format - just the path
              pathFromFile = this.normalizePath(fileContent);
            }
            
            this.currentMdPath = pathFromFile;
            
            console.log(`📝 Using path from file: ${this.currentMdPath}`);
            foundPathFile = true;
            break; // Stop checking once we find a valid file
          } else {
            console.log(`⚠️ Path file exists but is empty or invalid at: ${pathFile}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error reading path file ${pathFile}: ${error}`);
      }
    }
    
    if (!foundPathFile) {
      console.log(`⚠️ Could not find valid path file in any location`);
    }
    
    if (!this.currentMdPath) {
      console.log('⚠️  No current markdown path set, skipping single image path update');
      return;
    }
    
    try {
      // Extract the filename from the image path
      const imageName = path.basename(imagePath);
      console.log(`🔍 Processing image: ${imageName}`);
      
      // Determine the correct markdown file to use based on the image path
      // Extract directory from image path to find the corresponding markdown file
      const imgDir = path.dirname(imagePath);
      const parentDir = path.dirname(imgDir);
      
      console.log(`🔍 Image directory: ${imgDir}`);
      console.log(`🔍 Parent directory: ${parentDir}`);
      
      // Only use the current markdown file being processed
      console.log(`🔍 Using current markdown file: ${this.currentMdPath}`);
      
      // Read the content of the current file
      try {
        // Read the file content
        const content = fs.readFileSync(this.currentMdPath, 'utf8');
        
        // Check if the file contains a placeholder for this image
        const imageBaseName = path.basename(imageName, path.extname(imageName));
        
        // Check for exact matches first
        const exactMatch = content.includes(`<!-- placeholder for screenshot: ${imageName}`);
        const baseNameMatch = content.includes(`<!-- placeholder for screenshot: ${imageBaseName}`);
        
        if (exactMatch || baseNameMatch) {
          console.log(`✅ Found matching placeholder in current file for image: ${imageName}`);
          console.log(`   Match type: ${exactMatch ? 'exact match' : 'base name match'}`);
        } else {
          // If no exact match, search for any placeholder
          const placeholderRegex = /<!--\s*placeholder\s+for\s+screenshot:.*?-->/g;
          const placeholders = content.match(placeholderRegex);
          
          if (placeholders && placeholders.length > 0) {
            console.log(`🔍 Found ${placeholders.length} placeholders in file:`);
            placeholders.forEach((placeholder, index) => {
              console.log(`   ${index + 1}: "${placeholder}"`);
            });
          } else {
            console.log(`ℹ️ No placeholders found in file: ${this.currentMdPath}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error reading file ${this.currentMdPath}: ${error}`);
      }
      
      console.log(`📝 IMMEDIATE UPDATE: Using markdown file: ${this.currentMdPath} for: ${imagePath}`);
      
      // Verify the file exists
      if (!fs.existsSync(this.currentMdPath)) {
        console.error(`❌ ERROR: Markdown file does not exist: ${this.currentMdPath}`);
        return;
      }
      
      // Read the markdown file
      console.log(`📄 Reading markdown file: ${this.currentMdPath}`);
      const mdContent = fs.readFileSync(this.currentMdPath, 'utf8');
      
      // Log the first 200 characters of the markdown content for debugging
      console.log(`📄 Markdown content preview (first 200 chars): ${mdContent.substring(0, 200).replace(/\n/g, '\\n')}`);
      
      // Check if the file contains any placeholders with different patterns
      const placeholderText1 = '<!-- placeholder for screenshot:';
      const placeholderText2 = '<!-- placeholder for screenshot';
      const placeholderText3 = '<!-- placeholder';
      
      // Check for exact strings and log their positions
      const pos1 = mdContent.indexOf(placeholderText1);
      const pos2 = mdContent.indexOf(placeholderText2);
      const pos3 = mdContent.indexOf(placeholderText3);
      
      console.log(`🔍 Placeholder text positions: '${placeholderText1}' at ${pos1}, '${placeholderText2}' at ${pos2}, '${placeholderText3}' at ${pos3}`);
      
      const hasNamedPlaceholders = pos1 !== -1;
      const hasGenericPlaceholders = pos2 !== -1;
      const hasAnyPlaceholders = pos3 !== -1;
      
      console.log(`🔍 File contains named placeholders: ${hasNamedPlaceholders}`);
      console.log(`🔍 File contains generic placeholders: ${hasGenericPlaceholders}`);
      console.log(`🔍 File contains any placeholders: ${hasAnyPlaceholders}`);
      
      // If there's a placeholder in the file, check for specific text
      if (hasAnyPlaceholders) {
        // Extract 20 characters around the placeholder
        const start = Math.max(0, pos3 - 10);
        const end = Math.min(mdContent.length, pos3 + 30);
        const placeholderContext = mdContent.substring(start, end);
        console.log(`🔍 Placeholder context: "${placeholderContext}"`);
      }
      
      // If there are any placeholders, log them for debugging
      if (hasAnyPlaceholders) {
        console.log('🔍 Searching for placeholders in the file:');
        const lines = mdContent.split('\n');
        const placeholderLines = lines.filter(line => line.includes('<!-- placeholder'));
        
        console.log(`📌 Found ${placeholderLines.length} placeholder lines:`);
        placeholderLines.forEach((line, index) => {
          console.log(`   ${index + 1}: "${line}"`);
        });
      }
      
      // Track the generated image
      this.trackGeneratedImage(imagePath);
      
      let updatedContent = mdContent;
      let updatesCount = 0;
      
      // First, check for placeholders and replace them if found - but only in new_feature mode
      if (this.currentMode === 'new_feature') {
        console.log(`🔍 Mode is new_feature - looking for placeholders to replace`);
        console.log(`🔄 Checking for placeholders to replace with image: ${imageName}`);
        const placeholderUpdated = this.replacePlaceholderWithImage(updatedContent, imageName);
        if (placeholderUpdated.updated) {
          console.log(`✅ Successfully replaced ${placeholderUpdated.count} placeholder(s) with image reference`);
          updatedContent = placeholderUpdated.content;
          updatesCount += placeholderUpdated.count;
        } else {
          console.log(`ℹ️ No placeholders were replaced for image: ${imageName}`);
        }
      } else {
        console.log(`🔍 Mode is ${this.currentMode || 'default'} - skipping placeholder replacement`);
      }
      
      // Then, update existing image paths in markdown content for this specific image
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
          
          // Check if suffix removal is disabled
          if (process.env.DISABLE_IMAGE_SUFFIXES !== 'true') {
            if (newBaseName.endsWith('_E') || newBaseName.endsWith('_S')) {
              cleanNewBaseName = newBaseName.replace(/[_][ES]$/, '');
              // If there's still an _S suffix (from stock version), remove that too  
              cleanNewBaseName = cleanNewBaseName.replace(/[_]S$/, '');
            }
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
   * Replace placeholder comments with image references
   * @param content - The markdown content
   * @param imageName - The name of the image file
   * @returns Object with updated content and count of replacements
   */
  private replacePlaceholderWithImage(content: string, imageName: string): { updated: boolean; content: string; count: number } {
    let updatedContent = content;
    let replacementCount = 0;
    
    try {
      // Get the base name without extension for comparison
      const imageBaseName = path.basename(imageName, path.extname(imageName));
      
      // Create the image reference
      const relativePath = `img/${imageName}`;
      const imageReference = `![${imageBaseName}](${relativePath})`;
      
      console.log(`🔍 Looking for placeholder lines containing image name: ${imageName} or ${imageBaseName}`);
      
      // First look for exact match placeholders
      const exactPlaceholderPattern = `<!-- placeholder for screenshot: ${imageName}`;
      const baseNamePlaceholderPattern = `<!-- placeholder for screenshot: ${imageBaseName}`;
      
      // Split content into lines for line-by-line processing
      const lines = content.split('\n');
      let updatedLines = [...lines]; // Create a copy of the lines array
      let lineReplaced = false;
      
      // First try to find exact match placeholders
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.includes(exactPlaceholderPattern) || line.includes(baseNamePlaceholderPattern)) {
          console.log(`✅ Found exact matching placeholder line ${i + 1}: "${line}"`);
          updatedLines[i] = imageReference;
          replacementCount++;
          lineReplaced = true;
          console.log(`✅ Replacing line ${i + 1}: "${line}" with "${imageReference}"`);
          break; // Only replace the first matching placeholder
        }
      }
      
      // If no exact match was found, don't use any fallback
      // Only use exact matches for image names
      
      // If we found and replaced a placeholder, join the lines back together
      if (lineReplaced) {
        updatedContent = updatedLines.join('\n');
        console.log(`✅ Successfully replaced ${replacementCount} placeholder(s) with image reference`);
      } else {
        console.log(`ℹ️ No placeholder specifically matching "${imageName}" or "${imageBaseName}" was found`);
      }
      
      return {
        updated: replacementCount > 0,
        content: updatedContent,
        count: replacementCount
      };
    } catch (error) {
      console.error('❌ Error replacing placeholder with image:', error);
      return { updated: false, content, count: 0 };
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
      
      // Check if suffix removal is disabled
      if (process.env.DISABLE_IMAGE_SUFFIXES !== 'true') {
        // Keep removing _E and _S suffixes until we get the base name
        while (baseName.endsWith('_E') || baseName.endsWith('_S')) {
          baseName = baseName.replace(/[_][ES]$/, '');
        }
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
              // Check if suffix removal is disabled
              if (process.env.DISABLE_IMAGE_SUFFIXES === 'true') {
                // Use the first match if suffix removal is disabled
                matchingImage = potentialMatches[0];
                console.log(`📄 Using first matching image (suffixes disabled): ${matchingImage}`);
              } else {
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
              
              // Check if suffix removal is disabled
              if (process.env.DISABLE_IMAGE_SUFFIXES === 'true') {
                console.log(`📄 Suffix match (suffixes disabled): ${imageName} → ${matchingImage}`);
              } else {
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
    // Build URL from environment variables
    const baseUrl = process.env.AZURE_OPENAI_ENDPOINT ;
    const model ='gpt-5-chat';
    const apiVersion = '2025-01-01-preview';
    const endpoint = `${baseUrl}/openai/deployments/${model}/chat/completions?api-version=${apiVersion}`;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;

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
    1. Elements with [data-testid] that are most specific to the screenshot intent (e.g., if screenshotting a modal, prefer data-testids containing "modal", "dialog"; if screenshotting a table, prefer "table", "grid", "list")
    2. Elements with any [data-testid] attribute (critical for stable automation)
    3. Elements with stable semantic roles using CSS selectors: [role="dialog"], [role="listbox"], [role="menu"], [role="combobox"]
    4. Elements with stable, non-auto-generated IDs
    5. Semantic containers (main, section, article, nav) that contain the target
    6. Elements with CSS classes that clearly indicate their purpose
    7. Container elements with sensible dimensions (width > 100px and height > 50px)
    
    **📸 DOCUMENTATION SCREENSHOT QUALITY VALIDATION:**
    
    Before finalizing your screenshot command, validate that it will produce a DOCUMENTATION-WORTHY screenshot:
    
    **GOOD DOCUMENTATION SCREENSHOTS:**
    - Show complete, meaningful UI components (entire dialogs, panels, forms, tables with headers)
    - Capture 15-75% of viewport - providing focused content WITH sufficient context
    - Have clear visual boundaries (complete panels, not arbitrary cut-offs)
    - Show interactive elements in meaningful states (expanded menus, representative data)
    - Help users understand "where am I" and "what can I do here"
    
    **AVOID THESE (NOT DOCUMENTATION-WORTHY):**
    - Tiny elements in isolation (< 10% of viewport, single icon without context)
    - Overly broad full-page captures (> 85% of viewport) that don't focus on anything specific
    - Containers with minimal visible content or empty states
    - Cut-off or partially visible key elements
    - Random sections that don't convey clear purpose
    
    **SIZE VALIDATION CHECKLIST:**
    Based on the screenshot intent and container dimensions, ask yourself:
    - Is this container too small? (< 10% viewport = likely missing context)
    - Is this container too large? (> 85% viewport = likely not focused enough)
    - Does this show a COMPLETE component? (all dialog buttons visible, table headers included, menu fully shown)
    - Would a documentation reader understand the PURPOSE from this screenshot?
    - Does this match the intent's implied scope?
      * "icon", "button" intents → need 15-40% viewport (element + surrounding context)
      * "dialog", "modal", "panel" intents → need 20-60% viewport (complete component)
      * "overview", "dashboard", "workspace" intents → need 40-75% viewport (broader view with structure)
      * "table", "grid", "list" intents → need 30-70% viewport (multiple rows + headers)
    
    **IF YOUR CHOSEN CONTAINER FAILS VALIDATION:**
    1. Look for a parent container that provides more context
    2. Or look for a child container that's more focused
    3. Prioritize containers with [data-testid] that describe a complete component
    4. Choose containers with nestedContainerUids that show they contain meaningful structure
    
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
    1. **Read the screenshot intent** - Understand what needs to be captured AND the implied scope
    2. **Analyze each numbered container** [1], [2], [3], etc. from the provided data
    3. **Match text content to intent** - Look for relevant phrases in the actual text content displayed
    4. **Consider nested containers** - Containers with many nested elements might provide better context if there are 2 containers with both having required text content find a container that has both these containers inside it.
    5. **Check interactive elements count** - Higher counts may indicate more relevant containers
    6. **Review container dimensions** - Calculate viewport percentage (container width * height / viewport width * viewport height)
    7. **VALIDATE DOCUMENTATION QUALITY** - Does this meet the quality criteria above?
    8. **Extract the exact data-testid** - Use the precise value from the ELEMENT field
    9. **Generate the locator** - Create Playwright code with \`[data-testid="exact-value"]\`

    **TECHNICAL REQUIREMENTS:**
    1. Pick EXACTLY ONE best container that includes the target and shows where the target is located
    2. Always prefer [data-testid] selectors over any other type when available
    3. Use page.locator() with CSS selectors - never use getByRole(), getByText(), or similar methods
    4. ALWAYS add a reasonable timeout (30000ms default, 60000ms for complex UI)
    5. NEVER use .first(), .nth(), or chained filters in screenshot locators - use more specific selectors instead
    6. ALWAYS include a "thinking" section in your response that explains your reasoning process AND validates documentation quality
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
    
    ⚠️ CRITICAL: If selector generation fails or doesn't find the element:
    - NEVER regenerate the exact same selector - it will fail again
    - STOP and ANALYZE: Is the UI element actually visible? Maybe it's in a different state than expected
    - Try a completely different approach: different selector strategy, try parent/child containers, or use different attribute types
    - Consider that the element might not exist in the current UI state - check if alternative containers exist
    - If data-testid selectors fail, try role-based selectors; if those fail, try class-based or text-based selectors
    
    {
      "thinking": "Detailed explanation of your reasoning process, which container you chose and why, how it relates to the screenshot intent, validation that it meets documentation quality standards, and why this selector is the most appropriate choice.",
      "code": "await page.locator('[data-testid=\"example-container\"]', { force: true }).screenshot({ path: './images/example-image-name.png', timeout: 30000 });"
    }

    **THINKING TEMPLATE WITH DOCUMENTATION QUALITY VALIDATION:**
    {
      "thinking": "Intent: [describe the screenshot intent and implied scope]. Viewport: ${JSON.stringify(viewport)}. Candidate containers: 1) Container [X] '[data-testid='a']' (x:64, y:61, w:1176, h:708) = ~60% viewport coverage - contains [describe], has [N] interactive elements; 2) Container [Y] '[data-testid='b']' (x:100, y:100, w:400, h:300) = ~15% viewport coverage - focused on [describe]; 3) Container [Z] '[data-testid='c']' (x:50, y:50, w:1800, h:900) = ~95% viewport coverage - includes entire page. Quality validation: Container [X] is OPTIMAL because it provides complete [component type] with sufficient context (~60% viewport is appropriate for [intent type]), includes all necessary elements ([list key elements visible]), has clear boundaries, and matches the documentation need to show [what users will learn]. Container [Y] is too small and lacks context. Container [Z] is too broad and unfocused. Final choice: Container [X] '[data-testid='a']' meets all documentation quality criteria.",
      "code": "await page.locator('[data-testid=\"a\"]', { force: true }).screenshot({ path: './images/example.png', timeout: 30000 });"
    }

    **NESTED CONTAINERS EXAMPLE:**
    {
      "thinking": "Intent: Capture complete user profile section. Viewport: 1920x1080. Candidates: 1) C1 '[data-testid='dashboard']' (x:0, y:0, w:1920, h:1080) = ~100% viewport - entire dashboard, too broad; 2) C2 '[data-testid='user-profile-section']' (x:400, y:150, w:1100, h:650) = ~35% viewport - focused profile area; 3) C3 '[data-testid='personal-info-card']' (x:420, y:170, w:500, h:300) = ~7% viewport - just one card, too small. Quality validation: C2 is OPTIMAL because: 1) It's specifically named 'user-profile-section' which directly matches the intent, 2) Coverage of ~35% viewport is appropriate for a focused panel/section, 3) It contains nested containers C3 (personal-info-card) and C4 (subscription-details) which provide complete profile information, 4) It includes the profile header with user name and status, 5) It's focused enough to exclude unrelated dashboard elements but comprehensive enough to show all profile-related information in proper context. C1 is too broad (entire dashboard), C3 is too focused (missing subscription details and other profile elements). Final choice: C2 meets all documentation quality criteria and provides the right balance of focus and context.",
      "code": "await page.locator('[data-testid=\"user-profile-section\"]', { force: true }).screenshot({ path: './images/user-profile-complete.png', timeout: 30000 });"
    }
    `;

    // Build user prompt without image descriptions
    const userTextPrompt = `You are supposed to take a screenshot of the container that contains the target element.

Consider the following information:
- The detailed container information provided above with all element attributes and text content
- The screenshot intent: ${screenshotIntent || 'capture the relevant UI element'}
- The image filename: ${imgFileName || 'screenshot.png'}

The following JSON contains the full previous response with all the details:
${fullJsonResponse ? `${fullJsonResponse}` : ''}

Your job is to find the best container that can fit the right elements with enough surrounding context to get the perfect screenshot.

**DOCUMENTATION QUALITY VALIDATION STEPS:**
1. **Identify candidate containers** - Find containers that match the screenshot intent
2. **Calculate viewport coverage** - Estimate container size relative to viewport (w × h / viewport w × viewport h)
3. **Validate completeness** - Ensure the container includes ALL necessary elements (complete dialog, table with headers, etc.)
4. **Check documentation worthiness**:
   - Is it too small? (< 10% viewport) → Look for parent container with more context
   - Is it too large? (> 85% viewport) → Look for child container that's more focused
   - Does it show a complete, meaningful component?
   - Would this help a documentation reader understand the feature?
5. **Verify scope matches intent**:
   - Filename/intent suggests "icon"/"button" → Need 15-40% viewport (element + context)
   - Filename/intent suggests "modal"/"dialog"/"panel" → Need 20-60% viewport (complete component)
   - Filename/intent suggests "overview"/"dashboard" → Need 40-75% viewport (broader view)
   - Filename/intent suggests "table"/"grid"/"list" → Need 30-70% viewport (rows + headers)

**SELECTION RULES:**
- Prefer containers with [data-testid] that describe complete components
- Bigger container is better ONLY if it adds meaningful context (don't just go bigger for the sake of it)
- Smaller container is better if the larger one includes too much irrelevant content
- Pick the container based on the container name if it makes sense for the intent
- Use the intent of the screenshot to pick the container
- VALIDATE that your choice meets documentation quality standards
- Use the same name of the image when you write the playwright command for the screenshot

**IN YOUR THINKING, YOU MUST:**
1. State what the screenshot intent is and what scope it implies
2. List 2-3 candidate containers with their viewport coverage percentages
3. Evaluate each candidate against documentation quality criteria
4. Explain WHY your final choice is documentation-worthy
5. Confirm that the size is appropriate for the intent
6. Generate the screenshot command using the exact container selector`;

    const userMessageContent: Array<{ type: string; text?: string; image_url?: { url: string, detail?: string } }> =
      [{ type: "text", text: userTextPrompt }];

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
      
      // Make sure apiKey is not undefined
      if (!apiKey) {
        throw new Error('API key is required but not provided in environment variables');
      }
      
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
      // apiLogger.logAPICall(logEntry);

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
      console.log('📸 Base screenshot size:', base64Screenshot ? Buffer.from(base64Screenshot, 'base64').length : 'none');
          
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
      // apiLogger.logAPICall(logEntry);

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
   * Get a description of an image using LLM
   */
  private async getImageDescription(base64Image: string): Promise<string> {
    try {
      // Check if we have a valid base64 image
      if (!base64Image || base64Image.length < 100) {
        console.warn('⚠️ Invalid or empty base64 image provided');
        return '';
      }
      
      // Build URL from environment variables
      const baseUrl = process.env.AZURE_OPENAI_ENDPOINT || 'https://dhanu-m7k6n5e0-eastus2.cognitiveservices.azure.com';
      const model = process.env.AZURE_OPENAI_MODEL || 'gpt-5-chat';
      const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2025-01-01-preview';
      const endpoint = `${baseUrl}/openai/deployments/${model}/chat/completions?api-version=${apiVersion}`;
      const apiKey = process.env.AZURE_OPENAI_API_KEY;

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
        
        // Make sure apiKey is not undefined
        if (!apiKey) {
          throw new Error('API key is required but not provided in environment variables');
        }
        
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
      // Log current mode information for debugging
      console.log(`💡 Current mode settings:`);
      console.log(`   - this.currentMode: ${this.currentMode}`);
      console.log(`   - process.env.CURRENT_MD_MODE: ${process.env.CURRENT_MD_MODE || 'not set'}`);
      console.log(`   - File being processed: ${this.currentMdPath || 'not set'}`);
      
      // Only search in the current markdown document directory
      if (!this.currentMdPath) {
        console.log(`⚠️ No current markdown path set, cannot search for image`);
        return { base64: '', sourcePath: null };
      }
      
      // Use the directory containing the current markdown file
      const searchRoot = path.dirname(this.currentMdPath);
      console.log(`🔍 Searching for image '${imageFileName}' in document directory: ${searchRoot}`);
      
      if (!fs.existsSync(searchRoot)) {
        console.log(`⚠️ Document directory does not exist: ${searchRoot}`);
        return { base64: '', sourcePath: null };
      }
      
      // Get the mode from current_md_path.txt (already set in this.currentMode)
      // For translation or default mode, search in docs folder first
      // This ensures images are found in the docs folder regardless of the current mode
      // Check if we should force docs search:
      // 1. If explicitly set via environment variable
      // 2. If in translation or default mode
      const forceDocsSearch = process.env.FORCE_DOCS_SEARCH === 'true' || 
                            this.currentMode === 'translation' || 
                            this.currentMode === 'default' || 
                            process.env.CURRENT_MD_MODE === 'translation' || 
                            process.env.CURRENT_MD_MODE === 'default';
      
      if (forceDocsSearch) {
        console.log(`🔍 Searching for image in docs folder first (mode: ${this.currentMode}, env mode: ${process.env.CURRENT_MD_MODE || 'not set'})`);
        const result = this.findImageInCorrespondingDocsFolder(imageFileName);
        if (result.base64) {
          console.log(`✅ Found image in corresponding docs folder: ${result.sourcePath}`);
          return result;
        } else {
          console.log(`❌ Image not found in docs folder, continuing with local search`);
        }
      }
      
      // Always enable fallback to docs search as a last resort
      const fallbackToDocsSearch = true;
      let docsFallbackResult = null;
      
      // First check if the image exists directly in the img subdirectory (most common case)
      const imgDir = path.join(searchRoot, 'img');
      if (fs.existsSync(imgDir) && fs.lstatSync(imgDir).isDirectory()) {
        const directImagePath = path.join(imgDir, imageFileName);
        if (fs.existsSync(directImagePath)) {
          console.log(`✅ Found image directly in img directory: ${directImagePath}`);
          return {
            base64: fs.readFileSync(directImagePath).toString('base64'),
            sourcePath: imgDir
          };
        }
      }
      
      // Check if the image exists directly in the document directory
      const directPath = path.join(searchRoot, imageFileName);
      if (fs.existsSync(directPath)) {
        console.log(`✅ Found image directly in document directory: ${directPath}`);
        return {
          base64: fs.readFileSync(directPath).toString('base64'),
          sourcePath: searchRoot
        };
      }
      
      // Deep search for all subdirectories within the document directory
      console.log(`🔍 Deep searching all subdirectories in document directory: ${searchRoot}`);
      
      try {
        // Get all items in the document directory
        const items = fs.readdirSync(searchRoot);
        
        // Find all subdirectories, regardless of name
        const allSubdirectories = items.filter(item => {
          const itemPath = path.join(searchRoot, item);
          try {
            // Check if it's a directory
            return fs.existsSync(itemPath) && fs.lstatSync(itemPath).isDirectory();
          } catch (e) {
            return false;
          }
        });
        
        console.log(`🔍 Found ${allSubdirectories.length} subdirectories: ${allSubdirectories.join(', ')}`);
        
        // Check each subdirectory for the image
        for (const folder of allSubdirectories) {
          const folderPath = path.join(searchRoot, folder);
          console.log(`🔍 Checking in subdirectory: ${folderPath}`);
          
          // First check directly in this subdirectory
          const imagePath = path.join(folderPath, imageFileName);
          if (fs.existsSync(imagePath)) {
            console.log(`✅ Found image in folder ${folder}: ${imagePath}`);
            return {
              base64: fs.readFileSync(imagePath).toString('base64'),
              sourcePath: folderPath
            };
          }
          
          // Also check if there's a nested img directory
          const nestedImgDir = path.join(folderPath, 'img');
          if (fs.existsSync(nestedImgDir) && fs.lstatSync(nestedImgDir).isDirectory()) {
            const nestedImagePath = path.join(nestedImgDir, imageFileName);
            if (fs.existsSync(nestedImagePath)) {
              console.log(`✅ Found image in nested img directory: ${nestedImagePath}`);
              return {
                base64: fs.readFileSync(nestedImagePath).toString('base64'),
                sourcePath: nestedImgDir
              };
            }
          }
        }
      } catch (searchError) {
        console.error(`❌ Error during deep search: ${searchError}`);
      }
      
      // If standard search failed but fallback is enabled, try docs folder as last resort
      if (fallbackToDocsSearch) {
        console.log(`🔍 Fallback: Searching for image in docs folder (mode: ${this.currentMode})`);
        docsFallbackResult = this.findImageInCorrespondingDocsFolder(imageFileName);
        if (docsFallbackResult && docsFallbackResult.base64) {
          console.log(`✅ Found image in docs folder (fallback): ${docsFallbackResult.sourcePath}`);
          return docsFallbackResult;
        }
      }
      
      // If all searches failed, return empty
      console.log(`❌ Image '${imageFileName}' not found in any folder within document directory`);
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
  /**
   * Find an image in the corresponding docs folder for translation mode
   * This implements a brute force search across all subdirectories in the docs folder
   * that correspond to the current markdown file's directory structure
   */
  private findImageInCorrespondingDocsFolder(imageFileName: string): { base64: string; sourcePath: string | null } {
    try {
      if (!this.currentMdPath) {
        console.log(`⚠️ No current markdown path set, cannot find corresponding docs folder`);
        return { base64: '', sourcePath: null };
      }

      // Get the current file path and extract the relative path structure
      const currentPath = this.currentMdPath;
      console.log(`🔍 Finding corresponding docs path for: ${currentPath}`);
      
      // Extract the language-specific part to find the corresponding structure in docs
      // Example: if path is 'spanish/6-Image-Viewer/file.md', we want '6-Image-Viewer/file.md'
      const pathParts = currentPath.split(path.sep);
      
      // Find the index where the docs-like structure starts (look for numbered folders like '6-Image-Viewer')
      let startIndex = -1;
      for (let i = 0; i < pathParts.length; i++) {
        if (/^\d+-[A-Za-z0-9-_]+$/.test(pathParts[i])) {
          startIndex = i;
          break;
        }
      }
      
      if (startIndex === -1) {
        console.log(`⚠️ Could not identify docs structure in path: ${currentPath}`);
        return { base64: '', sourcePath: null };
      }
      
      // Extract the relative path from the numbered folder onwards
      const relativePath = pathParts.slice(startIndex, -1).join(path.sep);
      console.log(`📂 Identified relative path structure: ${relativePath}`);
      console.log(`📂 Path parts: ${JSON.stringify(pathParts)}`);
      console.log(`📂 Start index: ${startIndex}, using parts from ${startIndex} to ${pathParts.length - 1}`);
      
      // Construct the corresponding path in the docs folder
      // Use the repository root that's properly set in the constructor
      const docsBasePath = this.getDocsDirectory();
      console.log(`📂 Docs base path: ${docsBasePath}`);
      const correspondingDocsPath = path.join(docsBasePath, relativePath);
      
      console.log(`🔍 Looking for image in corresponding docs path: ${correspondingDocsPath}`);
      
      if (!fs.existsSync(correspondingDocsPath)) {
        console.log(`⚠️ Corresponding docs path does not exist: ${correspondingDocsPath}`);
        return { base64: '', sourcePath: null };
      }
      
      // Perform a brute force search in all subdirectories of the corresponding docs path
      return this.bruteForceImageSearch(correspondingDocsPath, imageFileName);
    } catch (error) {
      console.error(`❌ Error finding image in corresponding docs folder: ${error}`);
      return { base64: '', sourcePath: null };
    }
  }
  
  /**
   * Perform a brute force search for an image in all subdirectories
   */
  private bruteForceImageSearch(searchRoot: string, imageFileName: string): { base64: string; sourcePath: string | null } {
    try {
      console.log(`🔍 Performing brute force search for ${imageFileName} in ${searchRoot}`);
      
      // First check directly in the root directory
      const directPath = path.join(searchRoot, imageFileName);
      if (fs.existsSync(directPath)) {
        console.log(`✅ Found image directly in root: ${directPath}`);
        return {
          base64: fs.readFileSync(directPath).toString('base64'),
          sourcePath: searchRoot
        };
      }
      
      // Check in common image directories first (optimization)
      const commonImageDirs = ['img', 'images', 'Images', 'IMG', 'assets', 'screenshots'];
      for (const imgDir of commonImageDirs) {
        const imgDirPath = path.join(searchRoot, imgDir);
        if (fs.existsSync(imgDirPath) && fs.lstatSync(imgDirPath).isDirectory()) {
          const imgPath = path.join(imgDirPath, imageFileName);
          if (fs.existsSync(imgPath)) {
            console.log(`✅ Found image in ${imgDir} directory: ${imgPath}`);
            return {
              base64: fs.readFileSync(imgPath).toString('base64'),
              sourcePath: imgDirPath
            };
          }
        }
      }
      
      // Recursively search all subdirectories
      const searchResult = this.recursiveImageSearch(searchRoot, imageFileName);
      if (searchResult) {
        console.log(`✅ Found image through recursive search: ${searchResult}`);
        return {
          base64: fs.readFileSync(searchResult).toString('base64'),
          sourcePath: path.dirname(searchResult)
        };
      }
      
      console.log(`❌ Image not found in any subdirectory: ${imageFileName}`);
      return { base64: '', sourcePath: null };
    } catch (error) {
      console.error(`❌ Error in brute force image search: ${error}`);
      return { base64: '', sourcePath: null };
    }
  }
  
  /**
   * Recursively search for an image file in all subdirectories
   */
  private recursiveImageSearch(searchDir: string, imageFileName: string): string | null {
    try {
      if (!fs.existsSync(searchDir) || !fs.lstatSync(searchDir).isDirectory()) {
        return null;
      }
      
      // Check directly in this directory
      const directPath = path.join(searchDir, imageFileName);
      if (fs.existsSync(directPath)) {
        return directPath;
      }
      
      // Get all items in the directory
      const items = fs.readdirSync(searchDir);
      
      // Check each item
      for (const item of items) {
        const itemPath = path.join(searchDir, item);
        
        try {
          if (fs.lstatSync(itemPath).isDirectory()) {
            // Skip common non-content directories
            const skipDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', 'out'];
            if (skipDirs.includes(item)) {
              continue;
            }
            
            // Recursively search this subdirectory
            const foundPath = this.recursiveImageSearch(itemPath, imageFileName);
            if (foundPath) {
              return foundPath;
            }
          }
        } catch (e) {
          // Skip items we can't access
          continue;
        }
      }
      
      return null;
    } catch (error) {
      // Silent error for individual directory access issues
      return null;
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