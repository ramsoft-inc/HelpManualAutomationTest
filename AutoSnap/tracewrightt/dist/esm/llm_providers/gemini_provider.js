import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from "@google/genai";
import { apiLogger } from "./api_logger.js";
import 'dotenv/config';
export class GeminiProvider {
    gemini;
    constructor() {
        const vertexai = process.env.GEMINI_API_KEY ? false : true;
        const apiVersion = vertexai ? "v1" : undefined;
        // Gemini
        const apiKey = process.env.GEMINI_API_KEY || undefined;
        // Vertex AI
        const location = process.env.GOOGLE_CLOUD_LOCATION || undefined;
        const project = process.env.GOOGLE_CLOUD_PROJECT || undefined;
        if (!apiKey && (!project || !location)) {
            throw new Error("Either GEMINI_API_KEY or GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION must be set. https://googleapis.github.io/js-genai/release_docs/index.html#initialization");
        }
        this.gemini = new GoogleGenAI({
            apiKey,
            project,
            location,
            vertexai,
            apiVersion,
        });
    }
    async generateWithContext(systemInstruction, scenarioText, domResult, pageUrl, screenshot, previouslyExecutedCode, currentStepErrorCode, includeSystemInstruction, isCodeAnswer, previousStepThinking) {
        const startTime = Date.now();
        const model = process.env.GEMINI_MODEL || "gemini-2.5-pro-preview-05-06";
        const request = this.buildRequest(systemInstruction, scenarioText, domResult, pageUrl, screenshot, previouslyExecutedCode, currentStepErrorCode, previousStepThinking);
        let response;
        let logEntry;
        try {
            // Store the raw request payload
            const rawRequest = JSON.parse(JSON.stringify(request));
            response = await this.gemini.models.generateContent(request);
            // Store the raw response
            const rawResponse = JSON.parse(JSON.stringify(response));
            const answer = response.candidates?.[0]?.content?.parts?.[0]?.text;
            const inputTokenCount = response.usageMetadata?.promptTokenCount || 0;
            const outputTokenCount = response.usageMetadata?.candidatesTokenCount || 0;
            const duration = Date.now() - startTime;
            if (!answer) {
                logEntry = {
                    timestamp: new Date().toISOString(),
                    provider: 'gemini',
                    model,
                    rawRequest,
                    rawResponse,
                    request: {
                        systemInstruction,
                        userPrompt: scenarioText,
                        hasImage: true,
                        imageSize: screenshot.length,
                        pageUrl,
                        visibleElementsLength: domResult.visibleElements.length,
                        previouslyExecutedCode,
                        currentStepErrorCode
                    },
                    response: {
                        status: 200,
                        content: "No response from LLM",
                        inputTokenCount,
                        outputTokenCount,
                        totalTokens: inputTokenCount + outputTokenCount,
                        thinking: "No response from LLM",
                        code: "done"
                    },
                    metadata: {
                        temperature: 0.4,
                        safetySettings: request.config?.safetySettings
                    },
                    duration
                };
                apiLogger.logAPICall(logEntry);
                return {
                    code: "done",
                    thinking: "No response from LLM",
                    inputTokenCount,
                    outputTokenCount,
                };
            }
            const parsedResponse = this.parseCodeResponse(answer);
            logEntry = {
                timestamp: new Date().toISOString(),
                provider: 'gemini',
                model,
                rawRequest,
                rawResponse,
                request: {
                    systemInstruction,
                    userPrompt: scenarioText,
                    hasImage: true,
                    imageSize: screenshot.length,
                    pageUrl,
                    visibleElementsLength: domResult.visibleElements.length,
                    previouslyExecutedCode,
                    currentStepErrorCode
                },
                response: {
                    status: 200,
                    content: answer,
                    inputTokenCount,
                    outputTokenCount,
                    totalTokens: inputTokenCount + outputTokenCount,
                    thinking: parsedResponse.thinking,
                    code: parsedResponse.code
                },
                metadata: {
                    temperature: 0.7,
                    safetySettings: request.config?.safetySettings
                },
                duration
            };
            apiLogger.logAPICall(logEntry);
            return {
                code: parsedResponse.code,
                thinking: parsedResponse.thinking,
                inputTokenCount,
                outputTokenCount,
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            // Create raw request object even in error case
            const rawRequest = JSON.parse(JSON.stringify(request));
            // For errors, create a simplified error response object
            const rawResponse = {
                error: true,
                message: error?.message || "Unknown error",
                status: error?.response?.status || 500
            };
            logEntry = {
                timestamp: new Date().toISOString(),
                provider: 'gemini',
                model,
                rawRequest,
                rawResponse,
                request: {
                    systemInstruction,
                    userPrompt: scenarioText,
                    hasImage: true,
                    imageSize: screenshot.length,
                    pageUrl,
                    visibleElementsLength: domResult.visibleElements.length,
                    previouslyExecutedCode,
                    currentStepErrorCode
                },
                response: {
                    status: error?.response?.status || 500,
                    content: error?.message || "Unknown error",
                    inputTokenCount: 0,
                    outputTokenCount: 0,
                    totalTokens: 0,
                    thinking: "Error occurred",
                    code: "error"
                },
                metadata: {
                    temperature: 0.7,
                    safetySettings: request.config?.safetySettings
                },
                duration
            };
            apiLogger.logAPICall(logEntry);
            throw error;
        }
    }
    buildRequest(systemInstruction, scenarioText, domResult, pageUrl, screenshot, previouslyExecutedCode, currentStepErrorCode, previousStepThinking) {
        const parts = [];
        // 1. FIRST: User's Complete Script/Instructions (What needs to be done)
        parts.push({ text: `User Script (Complete Instructions to Execute):\n${scenarioText}` });
        // 2. SECOND: Previous Context (What has been done and learned)
        if (previousStepThinking) {
            parts.push({
                text: `Previous Step Analysis:\n${previousStepThinking}`,
            });
        }
        if (previouslyExecutedCode !== "") {
            parts.push({ text: `Successfully Executed Code History:\n${previouslyExecutedCode}` });
        }
        // 3. THIRD: Current Error Context (What went wrong, if anything)
        if (currentStepErrorCode !== "") {
            parts.push({
                text: `Previous Step Failed - Do NOT Repeat This Code:\n${currentStepErrorCode}`,
            });
        }
        // 4. FOURTH: Current State Context (Where we are now)
        parts.push({ text: `Current Page URL: ${pageUrl}` });
        // 5. FIFTH: Visual Context (What the user sees)
        parts.push({ text: "Current Page Screenshot:" });
        parts.push({
            inlineData: { data: screenshot.toString("base64"), mimeType: "image/png" },
        });
        // 6. SIXTH: Technical Context (Available elements to interact with)
        parts.push({ text: `Available Interactive Elements:\n${domResult.visibleElements}` });
        // 7. FINAL: Execution Prompt
        parts.push({
            text: `Based on the above context, determine the next single action to execute from the User Script. Follow the instructions in the exact order provided. Generate your response as JSON with "thinking" and "code" fields (add "screenshotIntent" for screenshots).`
        });
        return {
            model: process.env.GEMINI_MODEL || "gemini-2.5-pro-preview-05-06",
            contents: parts,
            config: {
                systemInstruction,
                temperature: 0.7,
                safetySettings: [
                    {
                        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                    },
                ],
            },
        };
    }
    parseCodeResponse(answer) {
        let generatedCode;
        let thinking = "No thinking provided";
        console.log('🔍 [Gemini] Raw answer:', answer);
        // Try to parse as JSON first (for the new format with thinking)
        try {
            // More robust JSON extraction - find balanced braces
            let jsonString = '';
            let braceCount = 0;
            let startFound = false;
            for (let i = 0; i < answer.length; i++) {
                const char = answer[i];
                if (char === '{') {
                    if (!startFound)
                        startFound = true;
                    braceCount++;
                }
                else if (char === '}') {
                    braceCount--;
                }
                if (startFound) {
                    jsonString += char;
                    if (braceCount === 0)
                        break;
                }
            }
            console.log('🔍 [Gemini] Extracted JSON string:', jsonString);
            if (jsonString) {
                const parsed = JSON.parse(jsonString);
                console.log('🔍 [Gemini] Parsed JSON:', parsed);
                if (parsed.code && parsed.thinking) {
                    generatedCode = parsed.code;
                    thinking = parsed.thinking;
                    console.log('🔍 [Gemini] Successfully extracted code and thinking');
                }
                else {
                    console.log('🔍 [Gemini] JSON missing code or thinking properties:', { hasCode: !!parsed.code, hasThinking: !!parsed.thinking });
                    throw new Error("Invalid JSON format");
                }
            }
            else {
                throw new Error("No JSON found");
            }
        }
        catch (e) {
            console.log('🔍 [Gemini] JSON parsing failed, using fallback:', e instanceof Error ? e.message : String(e));
            // Fallback to old format
            if (answer.includes("```")) {
                const regex = /```.*?\n(.*)\n```/gs;
                const matches = regex.exec(answer);
                if (!matches) {
                    console.log('🔍 [Gemini] No code block matches found');
                    throw new Error("No code matches found");
                }
                generatedCode = matches[1];
                console.log('🔍 [Gemini] Extracted code from code block:', generatedCode);
            }
            else {
                // FIXED: Don't use entire answer as code if it looks like JSON
                console.log('🔍 [Gemini] No code blocks found, checking if answer contains JSON...');
                if (answer.trim().startsWith('{') && answer.trim().endsWith('}')) {
                    console.error('❌ [Gemini] Answer appears to be JSON but parsing failed. Cannot extract code.');
                    throw new Error("Failed to parse JSON response and no code blocks found");
                }
                else {
                    console.log('🔍 [Gemini] Using entire answer as code (fallback for non-JSON responses)');
                    generatedCode = answer;
                }
            }
        }
        // Ensure every Playwright click has force:true and timeout without duplicating or creating malformed syntax
        generatedCode = generatedCode.replace(/\.click\(\s*([^)]*)\s*\)/g, (match, args) => {
            // Parse existing args, handling empty case
            const argsStr = args.trim();
            if (!argsStr) {
                // No args at all => add both force and timeout
                return '.click({ force: true, timeout: 20000 })';
            }
            // Check if args are in object literal format
            if (argsStr.startsWith('{') && argsStr.endsWith('}')) {
                const innerArgs = argsStr.slice(1, -1).trim();
                // Parse existing properties
                const hasForce = /\bforce\s*:/.test(innerArgs);
                const hasTimeout = /\btimeout\s*:/.test(innerArgs);
                let properties = [];
                // Add existing properties first
                if (innerArgs) {
                    // Clean up any malformed syntax (extra commas, spaces)
                    const cleanedArgs = innerArgs.replace(/,\s*,/g, ',').replace(/,\s*$/, '').replace(/^\s*,/, '');
                    if (cleanedArgs) {
                        properties.push(cleanedArgs);
                    }
                }
                // Add missing properties
                if (!hasForce) {
                    properties.push('force: true');
                }
                if (!hasTimeout) {
                    properties.push('timeout: 20000');
                }
                return `.click({ ${properties.join(', ')} })`;
            }
            else {
                // Args exist but not in object format, preserve them and add object with force/timeout
                return `.click(${argsStr}, { force: true, timeout: 20000 })`;
            }
        });
        return { code: generatedCode, thinking };
    }
}
