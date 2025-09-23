import { Page } from "@playwright/test";
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
export declare class AIUtilsEnhanced {
    private page;
    private referenceImagesDir;
    private currentMdPath;
    thinkingHistory: ThinkingEntry[];
    private generatedImages;
    private currentMode;
    private referenceImageSourcePath;
    private isGitHubActions;
    private repositoryRoot;
    constructor(page: Page, referenceImagesDir?: string);
    /**
     * Set the current markdown file path
     * This should be called by the page helper when processing a markdown file
     * Handles path resolution for both local and GitHub Actions environments
     */
    setCurrentMdFilePath(mdPath: string): void;
    /**
     * Normalize a path for the current environment
     * Converts between local absolute paths and repository-relative paths
     */
    private normalizePath;
    /**
     * Ensure img_as folder exists in the current markdown file directory
     */
    private ensureImgAsFolder;
    /**
     * Get the img_as folder path for the current markdown file
     */
    getImgAsPath(): string | null;
    /**
     * Get the current markdown file path
     */
    getCurrentMdFilePath(): string | null;
    /**
     * Update the current file path during processing
     * This can be called by external components to change the active file
     */
    updateCurrentFile(newFilePath: string): void;
    /**
     * Set the current mode (ui_change, translation, etc.)
     */
    setCurrentMode(mode: string): void;
    /**
     * Get the current mode
     */
    getCurrentMode(): string;
    /**
     * Find the repository root in local development
     */
    private findRepositoryRoot;
    /**
     * Get the docs directory path (environment-aware)
     */
    private getDocsDirectory;
    /**
     * Convert a relative path from the docs directory to an absolute path
     */
    private resolveFromDocsDir;
    /**
     * Get the relative path from docs directory to a given path
     */
    private getRelativeToDocsDir;
    /**
     * Get environment information for debugging
     */
    getEnvironmentInfo(): object;
    /**
     * Get the appropriate save path for screenshots based on mode
     */
    getScreenshotSavePath(): string | null;
    /**
     * Find the best directory to save screenshots when no reference image is found
     * Priority: existing folders under document directory > create img folder
     */
    private findBestSaveDirectory;
    /**
     * Track a generated image file
     */
    trackGeneratedImage(imagePath: string): void;
    /**
     * Get list of generated images
     */
    getGeneratedImages(): string[];
    /**
     * Update a single image path in the markdown file immediately after it's saved
     * This is called from screenshot_helper.ts after each successful screenshot
     */
    updateSingleImagePath(imagePath: string): Promise<void>;
    /**
     * Choose the best image version between Enhanced (_E) and Stock (_S) based on image resolution (pixels)
     * Returns the filename of the higher resolution image
     */
    private chooseBestImageVersion;
    /**
     * Get image resolution (width x height in pixels) from image file
     * Returns object with width, height, and total pixels
     */
    private getImageResolution;
    /**
     * Post-process markdown file to update image paths
     * Only for ui_change and translation modes
     */
    postProcessMarkdownImagePaths(mode: string): Promise<void>;
    /**
     * Write comprehensive token usage summary to a log file
     * This is called at the end of execution
     */
    writeTokenUsageSummary(outputPath?: string, thinkingLogPath?: string): void;
    /**
     * Build a rich, hierarchical summary of visible containers and their interactive elements.
     * This is designed to give the LLM a high-fidelity mental model of the page structure.
     */
    getSmartVisibleContainersSummary(): Promise<{
        url: string;
        viewport: {
            width: number;
            height: number;
        };
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
            bbox: {
                x: number;
                y: number;
                width: number;
                height: number;
            };
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
            bbox: {
                x: number;
                y: number;
                width: number;
                height: number;
            };
            ancestorTestIds?: string[];
        }>;
        landmarks: number[];
    }>;
    /**
     * Enhanced container extraction - finds screenshot-worthy containers
     */
    private getScreenshotContainers;
    /**
       * Enhanced prompt generation with container information
       */
    generateEnhancedPrompt(base64Screenshot: string, codeContext: string, imgFileName: string | null, refinementContext?: RefinementContext, thinking?: string, screenshotIntent?: string, fullJsonResponse?: string): Promise<string>;
    /**
     * Extract image path and directory from a screenshot command
     */
    private extractImagePathInfo;
    /**
     * Enhanced screenshot command interception
     */
    interceptScreenshotCommandEnhanced(originalCodeBlock: string, isRefinementCycle?: boolean, refinementContext?: RefinementContext, thinking?: string, screenshotIntent?: string, fullJsonResponse?: string): Promise<string>;
    /**
     * Highlight container elements on the page for better AI understanding
     */
    private highlightContainers;
    /**
     * Take a screenshot with container highlighting
     */
    /**
     * Get a description of an image using LLM
     */
    private getImageDescription;
    private takeHighlightedScreenshot;
    /**
     * Execute code with enhanced screenshot interception
     */
    executeWithEnhancedScreenshotInterception(code: string, isInternalRetry?: boolean, logger?: any, stepNumber?: number, thinking?: string, mdFilePath?: string, screenshotIntent?: string, fullJsonResponse?: string, // Add parameter for the full JSON response
    mode?: string): Promise<void>;
    private applyTimeoutAndClean;
    /**
     * Modify screenshot command to use appropriate directory based on mode
     */
    private modifyPathForImgAs;
    /**
     * Fallback method for relative path modification (when absolute path is not available)
     */
    private modifyPathForImgAsRelative;
    /**
     * Executes screenshot code with simplified retry logic
     * @param code The screenshot code to execute
     * @returns The result of the execution
     */
    executeScreenshotWithStability(code: string): Promise<any>;
    private getReferenceImageBase64;
    private getReferenceImageBase64WithPath;
    /**
     * Search for an image file in all subdirectories under the document directory
     * This focuses on the specific document's folder structure
     */
    private findImageInAllSubdirectories;
    /**
     * Recursively search for an image file in a directory structure
     */
    private findImageInDirectory;
}
export {};
