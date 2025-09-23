import { GenerateCodeResponse } from "../llm_request.js";
import { ClickableDomResult } from "../page_helpers.js";
import { LLMProvider } from "./base_provider.js";
import 'dotenv/config';
export declare class GeminiProvider implements LLMProvider {
    private gemini;
    constructor();
    generateWithContext(systemInstruction: string, scenarioText: string, domResult: ClickableDomResult, pageUrl: string, screenshot: Buffer, previouslyExecutedCode: string, currentStepErrorCode: string, includeSystemInstruction: boolean, isCodeAnswer: boolean, previousStepThinking?: string): Promise<GenerateCodeResponse>;
    private buildRequest;
    private parseCodeResponse;
}
