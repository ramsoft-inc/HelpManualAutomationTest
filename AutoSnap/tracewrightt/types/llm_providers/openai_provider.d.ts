import { GenerateCodeResponse } from "../llm_request";
import { ClickableDomResult } from "../page_helpers";
import { LLMProvider } from "./base_provider";
export declare class OpenAIProvider implements LLMProvider {
    private openai;
    constructor(apiKey?: string);
    generateWithContext(systemInstruction: string, scenarioText: string, domResult: ClickableDomResult, pageUrl: string, screenshot: Buffer, previouslyExecutedCode: string, currentStepErrorCode: string, includeSystemInstruction: boolean, isCodeAnswer: boolean, previousStepThinking?: string): Promise<GenerateCodeResponse>;
}
