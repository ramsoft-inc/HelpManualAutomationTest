export class LLMRequestHandler {
    provider;
    constructor(provider) {
        this.provider = provider;
    }
    async generateWithContext(systemInstruction, scenarioText, domResult, pageUrl, screenshot, previouslyExecutedCode, currentStepErrorCode, includeSystemInstruction, isCodeAnswer, previousStepThinking // Added optional parameter
    ) {
        return this.provider.generateWithContext(systemInstruction, scenarioText, domResult, pageUrl, screenshot, previouslyExecutedCode, currentStepErrorCode, includeSystemInstruction, isCodeAnswer, previousStepThinking // Pass to provider
        );
    }
}
