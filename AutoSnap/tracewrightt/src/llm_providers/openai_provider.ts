import axios from "axios";
import * as fs from 'fs';
import * as path from 'path';
import { GenerateCodeResponse } from "../llm_request.js";
import { ClickableDomResult } from "../page_helpers.js";
import { LLMProvider } from "./base_provider.js";
import { apiLogger, APILogEntry } from "./api_logger.js";
import 'dotenv/config';

// Load playwright config for aiConfig
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Resolve to <cwd>/playwright.config.cjs (or .js if the CJS variant is absent).
let configPath = path.resolve(process.cwd(), "playwright.config.cjs");
if (!fs.existsSync(configPath)) {
  configPath = path.resolve(process.cwd(), "playwright.config.js");
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const playwrightConfig = fs.existsSync(configPath) ? require(configPath) : { aiConfig: {} };

export class OpenAIProvider implements LLMProvider {
  private endpoint: string;
  private apiKey: string;

  constructor() {
    const { aiConfig } = playwrightConfig;
    
    // Prefer explicit override via env or hardcoded endpoint provided by user
    const overrideEndpoint = process.env.AZURE_OPENAI_ENDPOINT || 'https://dhanu-m7k6n5e0-eastus2.cognitiveservices.azure.com/openai/deployments/gpt-4.1chat/completions?api-version=2025-01-01-preview';
    this.endpoint = overrideEndpoint || `${aiConfig.apiUrl}/openai/deployments/${aiConfig.ivModel}/chat/completions?api-version=${aiConfig.apiVersion}`;
    this.apiKey = process.env.AZURE_OPENAI_API_KEY || aiConfig.apiKey;

    if (!this.apiKey) {
      throw new Error(
        "AZURE_OPENAI_API_KEY must be set."
      );
    }
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
    const model = process.env.OPENAI_MODEL || "gpt-5-chat";

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
      // Store the raw request payload
      const rawRequest = JSON.parse(JSON.stringify(request));
      
      if (process.env.VERBOSE_LLM === 'true') {
        console.log(`🔗 Azure OpenAI request -> ${this.endpoint}`);
        console.log(`   prompt tokens approx: ${JSON.stringify(request).length / 4}`);
      }
      
      response = await axios.post(this.endpoint, request, {
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
      });
      
      // Store the raw response
      const rawResponse = JSON.parse(JSON.stringify(response.data));
      
      const answer = response.data.choices?.[0]?.message?.content;
      const inputTokenCount = response.data.usage?.prompt_tokens || 0;
      const outputTokenCount = response.data.usage?.completion_tokens || 0;
      const duration = Date.now() - startTime;

      if (!answer) {
              logEntry = {
        timestamp: new Date().toISOString(),
        provider: 'openai',
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
          topP: 0.8
        },
        duration
      };

        // apiLogger.logAPICall(logEntry);

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
        provider: 'openai',
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
          temperature: 0.4,
          topP: 0.8
        },
        duration
      };

      // apiLogger.logAPICall(logEntry);

      return {
        code: parsedResponse.code,
        thinking: parsedResponse.thinking,
        inputTokenCount,
        outputTokenCount,
      };
    } catch (error: any) {
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
        provider: 'openai',
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
          temperature: 0.4,
          topP: 0.8
        },
        duration
      };

      // apiLogger.logAPICall(logEntry);
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
  ): any {
    const userContent: any[] = [];

    userContent.push({ type: "text", text: `Current Page URL: ${pageUrl}` });

    userContent.push({ type: "text", text: "Current Page Screenshot:" });
    userContent.push({
      type: "image_url",
      image_url: {
        url: `data:image/png;base64,${screenshot.toString("base64")}`,
      },
    });

    userContent.push({ type: "text", text: `Current Page Visible HTML: ${domResult.visibleElements}` });

    if (previouslyExecutedCode !== "") {
      userContent.push({ type: "text", text: `Already Executed Code:\n${previouslyExecutedCode}` });
    }

    if (currentStepErrorCode !== "") {
      userContent.push({
        type: "text",
        text: `Failed Code:\n${currentStepErrorCode}`,
      });
    }

    // Add previous step thinking if available
    if (previousStepThinking) {
      userContent.push({
        type: "text",
        text: `Based on the information of the previous step gauge which step to do next following the order of the instructions. Thought behind the previous step:\n${previousStepThinking}`,
      });
    }

    userContent.push({ type: "text", text: scenarioText });

    return {
      messages: [
        {
          role: "system",
          content: systemInstruction,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
      temperature: 0.4,
      top_p: 0.8,
    };
  }

  private parseCodeResponse(answer: string): { code: string; thinking: string } {
    let generatedCode: string;
    let thinking: string = "No thinking provided";
    
    console.log('🔍 [OpenAI] Raw answer:', answer);
    
    // Try to parse as JSON first (for the new format with thinking)
    try {
      // More robust JSON extraction - find balanced braces
      let jsonString = '';
      let braceCount = 0;
      let startFound = false;
      
      for (let i = 0; i < answer.length; i++) {
        const char = answer[i];
        if (char === '{') {
          if (!startFound) startFound = true;
          braceCount++;
        } else if (char === '}') {
          braceCount--;
        }
        
        if (startFound) {
          jsonString += char;
          if (braceCount === 0) break;
        }
      }
      
      console.log('🔍 [OpenAI] Extracted JSON string:', jsonString);
      
      if (jsonString) {
        const parsed = JSON.parse(jsonString);
        console.log('🔍 [OpenAI] Parsed JSON:', parsed);
        
        if (parsed.code && parsed.thinking) {
          generatedCode = parsed.code;
          thinking = parsed.thinking;
          console.log('🔍 [OpenAI] Successfully extracted code and thinking');
        } else {
          console.log('🔍 [OpenAI] JSON missing code or thinking properties:', { hasCode: !!parsed.code, hasThinking: !!parsed.thinking });
          throw new Error("Invalid JSON format");
        }
      } else {
        throw new Error("No JSON found");
      }
    } catch (e) {
      console.log('🔍 [OpenAI] JSON parsing failed, using fallback:', e instanceof Error ? e.message : String(e));
      
      // Fallback to old format
      if (answer.includes("```")) {
        const regex = /```.*?\n(.*)\n```/gs;
        const matches = regex.exec(answer);
        if (!matches) {
          console.log('🔍 [OpenAI] No code block matches found');
          throw new Error("No code matches found");
        }
        generatedCode = matches[1];
        console.log('🔍 [OpenAI] Extracted code from code block:', generatedCode);
      } else {
        // FIXED: Don't use entire answer as code if it looks like JSON
        console.log('🔍 [OpenAI] No code blocks found, checking if answer contains JSON...');
        if (answer.trim().startsWith('{') && answer.trim().endsWith('}')) {
          console.error('❌ [OpenAI] Answer appears to be JSON but parsing failed. Cannot extract code.');
          throw new Error("Failed to parse JSON response and no code blocks found");
        } else {
          console.log('🔍 [OpenAI] Using entire answer as code (fallback for non-JSON responses)');
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
      } else {
        // Args exist but not in object format, preserve them and add object with force/timeout
        return `.click(${argsStr}, { force: true, timeout: 20000 })`;
      }
    });

    return { code: generatedCode, thinking };
  }
}
