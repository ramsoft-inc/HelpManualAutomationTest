import { LLMProvider } from "./llm_providers/base_provider";
import { GenerateCodeResponse } from "./llm_request";
import { ClickableDomResult } from "./page_helpers";
export declare class TestProvider implements LLMProvider {
    constructor();
    generateWithContext(systemInstruction: string, scenarioText: string, domResult: ClickableDomResult, pageUrl: string, screenshot: Buffer, previouslyExecutedCode: string, currentStepErrorCode: string): Promise<GenerateCodeResponse>;
}
