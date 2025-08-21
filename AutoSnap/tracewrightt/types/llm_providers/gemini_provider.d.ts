import { GenerateCodeResponse } from "../llm_request";
import { ClickableDomResult } from "../page_helpers";
import { LLMProvider } from "./base_provider";
import 'dotenv/config';
export declare class GeminiProvider implements LLMProvider {
    private gemini;
    constructor();
    generateWithContext(systemInstruction: string, scenarioText: string, domResult: ClickableDomResult, pageUrl: string, screenshot: Buffer, previouslyExecutedCode: string, currentStepErrorCode: string, includeSystemInstruction: boolean, isCodeAnswer: boolean, previousStepThinking?: string): Promise<GenerateCodeResponse>;
    private buildRequest;
    private parseCodeResponse;
}
