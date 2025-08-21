export interface APILogEntry {
    timestamp: string;
    provider: 'gemini' | 'openai';
    model: string;
    rawRequest: any;
    rawResponse: any;
    request: {
        systemInstruction: string;
        userPrompt: string;
        hasImage: boolean;
        imageSize?: number;
        hasHighlightedImage?: boolean;
        highlightedImageSize?: number;
        pageUrl?: string;
        visibleElementsLength?: number;
        previouslyExecutedCode?: string;
        currentStepErrorCode?: string;
    };
    response: {
        status: number;
        content: string;
        inputTokenCount: number;
        outputTokenCount: number;
        totalTokens: number;
        thinking?: string;
        code?: string;
    };
    metadata: {
        temperature?: number;
        maxTokens?: number;
        topP?: number;
        safetySettings?: any[];
    };
    duration: number;
}
export declare class APILogger {
    private logDir;
    private logFile;
    private geminiLogFile;
    private openaiLogFile;
    constructor();
    private logToFile;
    logAPICall(entry: APILogEntry): void;
    getLogs(provider?: 'gemini' | 'openai'): APILogEntry[];
    clearLogs(provider?: 'gemini' | 'openai'): void;
}
export declare const apiLogger: APILogger;
