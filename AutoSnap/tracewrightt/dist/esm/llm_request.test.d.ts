import { LLMProvider } from "./llm_providers/base_provider.js";
import { GenerateCodeResponse } from "./llm_request.js";
import { ClickableDomResult } from "./page_helpers.js";
export declare class TestProvider implements LLMProvider {
    constructor();
    generateWithContext(systemInstruction: string, scenarioText: string, domResult: ClickableDomResult, pageUrl: string, screenshot: Buffer, previouslyExecutedCode: string, currentStepErrorCode: string): Promise<GenerateCodeResponse>;
}
