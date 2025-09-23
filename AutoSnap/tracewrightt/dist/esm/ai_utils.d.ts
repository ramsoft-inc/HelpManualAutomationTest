import { Page } from "@playwright/test";
interface RefinementContext {
    failingLocator: string;
    errorMessage: string;
    conflictingElementsHTML: string;
}
export declare class AIUtils {
    private page;
    private referenceImagesDir;
    constructor(page: Page, referenceImagesDir?: string);
    /**
     * Enhanced helper function to extract visible, interactive elements.
     * This list is meant to be concise and focused on direct interaction points.
     */
    private getVisibleInteractiveElements;
    private getIdentifiableElements;
    /**
     * Enhanced HTML parser that provides rich context with indexed elements and full HTML structure.
     */
    private getRichHTMLContext;
    /**
     * Intercepts screenshot commands and processes them through AI generation.
     */
    interceptScreenshotCommand(originalCodeBlock: string, isRefinementCycle?: boolean, refinementContext?: RefinementContext, thinking?: string): Promise<string>;
    /**
     * Generates Playwright screenshot code using an AI model.
     */
    generatePlaywrightScreenshotFunction(base64Screenshot: string, codeContext: string, // Original user code or failing AI code
    imgFileName: string | null, refinementContext?: RefinementContext, thinking?: string): Promise<string>;
    private getReferenceImageBase64;
    /**
     * Finds markdown context lines for a given image file, optionally searching only specified files (PR-diff aware).
     * @param imageFileName The image filename to search for (e.g., 'access.png')
     * @param linesBefore Number of lines before the match to include as context
     * @param filePaths Optional array of markdown file paths to restrict the search (PR-diff aware)
     */
    private findMarkdownContextLines;
    private applyTimeoutAndClean;
    /**
     * Extracts a natural language command from the Playwright screenshot code.
     */
    private extractScreenshotContext;
    /**
     * Executes Playwright code with stabilization, interception, and retries.
     */
    executeWithScreenshotInterception(code: string, isInternalRetry?: boolean, logger?: any, stepNumber?: number, thinking?: string): Promise<void>;
}
/**
 * Generates a prompt for replacing a screenshot due to a UI element change.
 * UPDATED: Removed identifiableElements from arguments and prompt structure.
 */
export declare function getPromptForUIChange({ imgFileName, visibleElements, richHTMLContext, markdownContext, }: {
    imgFileName: string;
    visibleElements: any;
    richHTMLContext: any;
    markdownContext?: string;
}): string;
/**
 * Generates a prompt for filling a screenshot placeholder for a new document or feature.
 * UPDATED: Removed identifiableElements from arguments and prompt structure.
 */
export declare function getPromptForNewFeature({ imgFileName, visibleElements, richHTMLContext, markdownContext, }: {
    imgFileName: string;
    visibleElements: any;
    richHTMLContext: any;
    markdownContext?: string;
}): string;
export type ScenarioType = 'ui_change' | 'new_feature' | 'default';
export declare function getPromptByScenario({ scenarioType, imgFileName, visibleElements, identifiableElements, // Keep for signature, but argument for prompt is removed
richHTMLContext, markdownContext, defaultPromptFn }: {
    scenarioType: ScenarioType;
    imgFileName: string;
    visibleElements: any;
    identifiableElements: any;
    richHTMLContext: any;
    markdownContext?: string;
    defaultPromptFn: () => string;
}): string;
/**
 * Get mode-specific description for better UX
 */
export declare function getModeDescription(scenarioType: ScenarioType): string;
/**
 * Validate if a scenario type is supported
 */
export declare function isValidScenarioType(scenarioType: string): scenarioType is ScenarioType;
export {};
