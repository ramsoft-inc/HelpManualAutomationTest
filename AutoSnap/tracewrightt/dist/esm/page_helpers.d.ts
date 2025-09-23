import { Page } from "@playwright/test";
import { GenerateCodeResponse } from "./llm_request.js";
export type ClickableDomResult = {
    visibleElements: string;
    hiddenElements: string;
};
export declare const getInteractiveHTML: (page: Page) => Promise<ClickableDomResult>;
/**
 * Set the current markdown file path for image reference
 * This should be called when processing a markdown file
 */
export declare const setCurrentMarkdownPath: (page: Page, mdFilePath: string) => Promise<boolean>;
export declare const executeCode: (page: Page, codeResponse: GenerateCodeResponse, logger?: any, stepNumber?: number, mdFilePath?: string, aiUtils?: any) => Promise<void>;
export declare const clearElementHighlights: (page: Page) => Promise<void>;
