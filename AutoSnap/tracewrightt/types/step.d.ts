import { Page } from "@playwright/test";
import { GenerateCodeResponse } from "./llm_request";
export declare const generateStep: (page: Page, scenarioText: string, stepCount: number, previouslyExecutedCode: string, currentStepErrorCode: string, previousStepThinking?: string) => Promise<GenerateCodeResponse>;
export declare const performStep: (page: Page, codeResponse: GenerateCodeResponse) => Promise<string | undefined>;
export declare const cleanStepFiles: () => void;
