import { LLMProvider, GenerateCodeResponse } from "./llm_providers/base_provider.js";
import { ClickableDomResult } from "./page_helpers.js";
export type { GenerateCodeResponse };
export declare class LLMRequestHandler {
    private provider;
    constructor(provider: LLMProvider);
    generateWithContext(systemInstruction: string, scenarioText: string, domResult: ClickableDomResult, pageUrl: string, screenshot: Buffer, previouslyExecutedCode: string, currentStepErrorCode: string, includeSystemInstruction: boolean, isCodeAnswer: boolean, previousStepThinking?: string): Promise<GenerateCodeResponse>;
}
