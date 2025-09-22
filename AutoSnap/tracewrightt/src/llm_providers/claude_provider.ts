import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { GenerateCodeResponse } from "../llm_request.js";
import { ClickableDomResult } from "../page_helpers.js";
import { LLMProvider } from "./base_provider.js";
import { apiLogger, APILogEntry } from "./api_logger.js";
import 'dotenv/config';

export class ClaudeProvider implements LLMProvider {
  private anthropic: Anthropic;

  constructor() {
    const apiKey = process.env.CLAUDE_API_KEY;

    if (!apiKey) {
      throw new Error(
        "CLAUDE_API_KEY environment variable must be set. Get your API key from https://console.anthropic.com/"
      );
    }

    this.anthropic = new Anthropic({
      apiKey: apiKey,
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
    const model = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";

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
      
      response = await this.anthropic.messages.create(request);
      
      // Store the raw response
      const rawResponse = JSON.parse(JSON.stringify(response));
      
      // Type guard to ensure we have a Message response
      if (!('content' in response) || !('usage' in response)) {
        throw new Error('Invalid response format from Claude API');
      }
      
      const answer = response.content[0]?.type === 'text' ? response.content[0].text : '';
      const inputTokenCount = response.usage.input_tokens || 0;
      const outputTokenCount = response.usage.output_tokens || 0;
      const duration = Date.now() - startTime;

      if (!answer) {
        logEntry = {
          timestamp: new Date().toISOString(),
          provider: 'claude',
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
            temperature: 0.7,
            maxTokens: request.max_tokens
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
        provider: 'claude',
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
          maxTokens: request.max_tokens
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
      
      // Create raw request object even in error case
      const rawRequest = JSON.parse(JSON.stringify(request));
      // For errors, create a simplified error response object
      const rawResponse = {
        error: true,
        message: error?.message || "Unknown error",
        status: error?.status || 500
      };
      
      logEntry = {
        timestamp: new Date().toISOString(),
        provider: 'claude',
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
          status: error?.status || 500,
          content: error?.message || "Unknown error",
          inputTokenCount: 0,
          outputTokenCount: 0,
          totalTokens: 0,
          thinking: "Error occurred",
          code: "error"
        },
        metadata: {
          temperature: 0.7,
          maxTokens: 4096
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
  ): Anthropic.Messages.MessageCreateParams {
    const messages: Anthropic.Messages.MessageCreateParams['messages'] = [];

    // Build the user message content
    const content: Anthropic.Messages.MessageParam['content'] = [];

    content.push({
      type: 'text',
      text: `Current Page URL: ${pageUrl}`
    });

    content.push({
      type: 'text', 
      text: "Current Page Screenshot:"
    });

    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/png',
        data: screenshot.toString('base64')
      }
    });

    content.push({
      type: 'text',
      text: `Current Page Visible HTML: ${domResult.visibleElements}`
    });

    if (previouslyExecutedCode !== "") {
      content.push({
        type: 'text',
        text: `Already Executed Code:\n${previouslyExecutedCode}`
      });
    }

    if (currentStepErrorCode !== "") {
      content.push({
        type: 'text',
        text: `Failed Code:\n${currentStepErrorCode}`
      });
    }

    // Add previous step thinking if available
    if (previousStepThinking) {
      content.push({
        type: 'text',
        text: `Based on the information of the previous step gauge which step to do next following the order of the instructions. Thought behind the previous step:\n${previousStepThinking}`
      });
    }

    content.push({
      type: 'text',
      text: scenarioText
    });

    messages.push({
      role: 'user',
      content: content
    });

    return {
      model: process.env.CLAUDE_MODEL || "claude-opus-4-20250514",
      max_tokens: 4096,
      temperature: 0.7,
      system: systemInstruction,
      messages: messages
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
