import { LLMProvider, GenerateCodeResponse } from "./llm_providers/base_provider.js";
import { ClickableDomResult } from "./page_helpers.js";

export type { GenerateCodeResponse };

export class LLMRequestHandler {
  private provider: LLMProvider;

  constructor(provider: LLMProvider) {
    this.provider = provider;
  }

  async generateWithContext(
    systemInstruction: string,
    scenarioText: string,
    domResult: ClickableDomResult,
    pageUrl: string,
    screenshot: Buffer,
    previouslyExecutedCode: string,
    currentStepErrorCode: string,
    includeSystemInstruction: boolean,
    isCodeAnswer: boolean,
    previousStepThinking?: string, // Added optional parameter
    availableActions?: string // Added optional parameter for POM actions
  ): Promise<GenerateCodeResponse> {
    return this.provider.generateWithContext(
      systemInstruction,
      scenarioText,
      domResult,
      pageUrl,
      screenshot,
      previouslyExecutedCode,
      currentStepErrorCode,
      includeSystemInstruction,
      isCodeAnswer,
      previousStepThinking, // Pass to provider
      availableActions // Pass to provider
    );
  }
}
