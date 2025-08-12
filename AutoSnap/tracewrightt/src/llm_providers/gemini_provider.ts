import { Content, GenerateContentParameters, GoogleGenAI, HarmBlockThreshold, HarmCategory } from "@google/genai";
import * as fs from 'fs';
import * as path from 'path';
import { GenerateCodeResponse } from "../llm_request";
import { ClickableDomResult } from "../page_helpers";
import { LLMProvider } from "./base_provider";
import { apiLogger, APILogEntry } from "./api_logger";
import 'dotenv/config';
export class GeminiProvider implements LLMProvider {
  private gemini: GoogleGenAI;

  constructor() {
    const vertexai = process.env.GEMINI_API_KEY ? false : true;
    const apiVersion = vertexai ? "v1" : undefined

    // Gemini
    const apiKey = process.env.GEMINI_API_KEY || undefined

    // Vertex AI
    const location = process.env.GOOGLE_CLOUD_LOCATION || undefined
    const project = process.env.GOOGLE_CLOUD_PROJECT || undefined

    if (!apiKey && (!project || !location)) {
      throw new Error(
        "Either GEMINI_API_KEY or GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION must be set. https://googleapis.github.io/js-genai/release_docs/index.html#initialization"
      );
    }

    this.gemini = new GoogleGenAI({
      apiKey,
      project,
      location,
      vertexai,
      apiVersion,
    });
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
    previousStepThinking?: string
  ): Promise<GenerateCodeResponse> {
    const startTime = Date.now();
    const model = process.env.GEMINI_MODEL || "gemini-2.5-pro-preview-05-06";

    const request = this.buildRequest(
      systemInstruction,
      scenarioText,
      domResult,
      pageUrl,
      screenshot,
      previouslyExecutedCode,
      currentStepErrorCode,
      previousStepThinking
    );

    let response;
    let logEntry: APILogEntry;

    try {
      response = await this.gemini.models.generateContent(request);
      
      const answer = response.candidates?.[0]?.content?.parts?.[0]?.text;
      const inputTokenCount = response.usageMetadata?.promptTokenCount || 0;
      const outputTokenCount = response.usageMetadata?.candidatesTokenCount || 0;
      const duration = Date.now() - startTime;

      if (!answer) {
        logEntry = {
          timestamp: new Date().toISOString(),
          provider: 'gemini',
          model,
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
            temperature: 0.7,
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
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      logEntry = {
        timestamp: new Date().toISOString(),
        provider: 'gemini',
        model,
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

  private buildRequest(
    systemInstruction: string,
    scenarioText: string,
    domResult: ClickableDomResult,
    pageUrl: string,
    screenshot: Buffer,
    previouslyExecutedCode: string,
    currentStepErrorCode: string,
    previousStepThinking?: string
  ): GenerateContentParameters {
    const parts: Content[] = [];

    parts.push({ text: `Current Page URL: ${pageUrl}` } as Content);

    parts.push({ text: "Current Page Screenshot:" } as Content);
    parts.push({
      inlineData: { data: screenshot.toString("base64"), mimeType: "image/png" },
    } as Content);

    parts.push({ text: `Current Page Visible HTML: ${domResult.visibleElements}` } as Content);

    if (previouslyExecutedCode !== "") {
      parts.push({ text: `Already Executed Code:\n${previouslyExecutedCode}` } as Content);
    }

    if (currentStepErrorCode !== "") {
      parts.push({
        text: `Failed Code:\n${currentStepErrorCode}`,
      } as Content);
    }

    // Add previous step thinking if available
    if (previousStepThinking) {
      parts.push({
        text: `Based on the information of the previous step gauge which step to do next following the order of the instructions. Thought behind the previous step:\n${previousStepThinking}`,
      } as Content);
    }

    parts.push({ text: scenarioText } as Content);

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

  private parseCodeResponse(answer: string): { code: string; thinking: string } {
    let generatedCode: string;
    let thinking: string = "No thinking provided";
    
    // Try to parse as JSON first (for the new format with thinking)
    try {
      const jsonMatch = answer.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.code && parsed.thinking) {
          generatedCode = parsed.code;
          thinking = parsed.thinking;
        } else {
          throw new Error("Invalid JSON format");
        }
      } else {
        throw new Error("No JSON found");
      }
    } catch (e) {
      // Fallback to old format
      if (answer.includes("```")) {
        const regex = /```.*?\n(.*)\n```/gs;
        const matches = regex.exec(answer);
        if (!matches) {
          throw new Error("No code matches found");
        }
        generatedCode = matches[1];
      } else {
        generatedCode = answer;
      }
    }

    // Ensure every Playwright click has force:true without duplicating or nesting objects
    // 1) no args  => .click({ force:true })
    generatedCode = generatedCode.replace(/\.click\(\s*\)/g, '.click({ force: true })');

    // 2) existing object literal but missing force => append it
    generatedCode = generatedCode.replace(/\.click\(\s*{([^}]*)}\s*\)/g, (match, inner) => {
      if (inner.includes('force')) {
        return match; // Already has force
      }
      return `.click({ ${inner}, force: true })`;
    });

    // 3) existing object literal with force but missing timeout => append it
    generatedCode = generatedCode.replace(/\.click\(\s*{([^}]*)}\s*\)/g, (match, inner) => {
      if (inner.includes('timeout')) {
        return match; // Already has timeout
      }
      return `.click({ ${inner}, timeout: 20000 })`;
    });

    // 4) no object literal at all => add both
    generatedCode = generatedCode.replace(/\.click\(\s*\)/g, '.click({ force: true, timeout: 20000 })');

    return { code: generatedCode, thinking };
  }
}
