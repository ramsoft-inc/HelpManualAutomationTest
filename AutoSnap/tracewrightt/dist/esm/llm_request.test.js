import { beforeEach, describe, expect, it, vi } from "vitest";
import { LLMRequestHandler } from "./llm_request.js";
// Mock the LLMProvider
const mockGenerateWithContext = vi.fn();
vi.mock("./llm_providers/base_provider", () => {
    return {
        LLMProvider: vi.fn().mockImplementation(() => {
            return {
                generateWithContext: mockGenerateWithContext,
            };
        }),
    };
});
export class TestProvider {
    constructor() { }
    async generateWithContext(systemInstruction, scenarioText, domResult, pageUrl, screenshot, previouslyExecutedCode, currentStepErrorCode) {
        return mockGenerateWithContext(systemInstruction, scenarioText, domResult, pageUrl, screenshot, previouslyExecutedCode, currentStepErrorCode);
    }
}
describe("LLMRequestHandler", () => {
    let mockProvider;
    let handler;
    let systemInstruction;
    let scenarioText;
    let domResult;
    let pageUrl;
    let screenshot;
    let previouslyExecutedCode;
    let currentStepErrorCode;
    let includeSystemInstruction;
    let isCodeAnswer;
    beforeEach(() => {
        vi.clearAllMocks();
        mockProvider = new TestProvider();
        handler = new LLMRequestHandler(mockProvider);
        systemInstruction = "Test System Instruction";
        scenarioText = "Test Scenario";
        domResult = { visibleElements: "<button>Click Me</button>", hiddenElements: "" };
        pageUrl = "http://example.com";
        screenshot = Buffer.from("test-screenshot");
        previouslyExecutedCode = "console.log('previous');";
        currentStepErrorCode = "Error: something went wrong";
        includeSystemInstruction = true;
        isCodeAnswer = true;
    });
    describe("constructor", () => {
        it("should correctly assign the provider", () => {
            expect(handler["provider"]).toBe(mockProvider);
        });
    });
    describe("generateWithContext", () => {
        it("should call the provider's generateWithContext method with all arguments", async () => {
            const expectedResponse = {
                code: "console.log('test');",
                thinking: "Test thinking",
                inputTokenCount: 10,
                outputTokenCount: 5
            };
            mockGenerateWithContext.mockResolvedValue(expectedResponse);
            const result = await handler.generateWithContext(systemInstruction, scenarioText, domResult, pageUrl, screenshot, previouslyExecutedCode, currentStepErrorCode, includeSystemInstruction, isCodeAnswer);
            expect(mockGenerateWithContext).toHaveBeenCalledTimes(1);
            expect(mockGenerateWithContext).toHaveBeenCalledWith(systemInstruction, scenarioText, domResult, pageUrl, screenshot, previouslyExecutedCode, currentStepErrorCode);
            expect(result).toEqual(expectedResponse);
        });
        it("should return the response from the provider's method", async () => {
            const expectedResponse = {
                code: "await click('#id');",
                thinking: "Clicking on element with id",
                inputTokenCount: 20,
                outputTokenCount: 10
            };
            mockGenerateWithContext.mockResolvedValue(expectedResponse);
            const result = await handler.generateWithContext(systemInstruction, scenarioText, domResult, pageUrl, screenshot, previouslyExecutedCode, currentStepErrorCode, includeSystemInstruction, isCodeAnswer);
            expect(result).toBe(expectedResponse);
        });
        it("should handle errors from the provider's method", async () => {
            const expectedError = new Error("Provider error");
            mockGenerateWithContext.mockRejectedValue(expectedError);
            await expect(handler.generateWithContext(systemInstruction, scenarioText, domResult, pageUrl, screenshot, previouslyExecutedCode, currentStepErrorCode, includeSystemInstruction, isCodeAnswer)).rejects.toThrow(expectedError);
        });
    });
});
