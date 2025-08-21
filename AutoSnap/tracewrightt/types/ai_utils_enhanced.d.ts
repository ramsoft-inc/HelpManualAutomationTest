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
    constructor(page: Page, referenceImagesDir?: string);
    /**
     * Set the current markdown file path
     * This should be called by the page helper when processing a markdown file
     */
    setCurrentMdFilePath(mdPath: string): void;
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
            keywords?: string[];
            elementCount: number;
            interactiveCount: number;
            parentUid?: number;
            childrenUids: number[];
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
    executeWithEnhancedScreenshotInterception(code: string, isInternalRetry?: boolean, logger?: any, stepNumber?: number, thinking?: string, mdFilePath?: string, screenshotIntent?: string, fullJsonResponse?: string): Promise<void>;
    private applyTimeoutAndClean;
    /**
     * Executes screenshot code with simplified retry logic
     * @param code The screenshot code to execute
     * @returns The result of the execution
     */
    executeScreenshotWithStability(code: string): Promise<any>;
    private getReferenceImageBase64;
}
export {};
