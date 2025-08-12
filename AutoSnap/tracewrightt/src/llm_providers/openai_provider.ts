import OpenAI from "openai";
import { ChatCompletionCreateParamsNonStreaming } from "openai/resources";
import { GenerateCodeResponse } from "../llm_request";
import { ClickableDomResult } from "../page_helpers";
import { LLMProvider } from "./base_provider";
import { apiLogger, APILogEntry } from "./api_logger";

export class OpenAIProvider implements LLMProvider {
  private openai: OpenAI;

  constructor(apiKey: string = process.env.OPENAI_API_KEY || "") {
    this.openai = new OpenAI({ apiKey });
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
    const model = "gpt-4.1";

    const requestPayload = {
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: systemInstruction,
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Current Page URL: ${pageUrl}` },
            { type: "text", text: `Current Page Screenshot:` },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${screenshot.toString("base64")}`,
              },
            },
            { type: "text", text: `Current Page HTML:\n${domResult.visibleElements}` },
            { type: "text", text: `Already Executed Code:\n${previouslyExecutedCode}` },
            ...(currentStepErrorCode
              ? [
                  {
                    type: "text",
                    text: `The current step failed and encountered these errors:\n${currentStepErrorCode}`,
                  },
                ]
              : []),
            ...(previousStepThinking
              ? [
                  {
                    type: "text",
                    text: `Previous Step Thinking:\n${previousStepThinking}`,
                  },
                ]
              : []),
            { type: "text", text: `User Script:\n${scenarioText}` },
          ],
        },
      ],
      max_completion_tokens: 4096,
      temperature: 0.6,
    } as ChatCompletionCreateParamsNonStreaming;

    let response;
    let logEntry: APILogEntry;

    try {
      response = await this.openai.chat.completions.create(requestPayload);

      const answer = response.choices[0]?.message?.content;
      const inputTokenCount = response.usage?.prompt_tokens || 0;
      const outputTokenCount = response.usage?.completion_tokens || 0;
      const duration = Date.now() - startTime;

      if (!answer) {
        logEntry = {
          timestamp: new Date().toISOString(),
          provider: 'openai',
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
            temperature: 0.6,
            maxTokens: 4096
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
          const regex = /```typescript\n(.*)\n```/gs;
          const matches = regex.exec(answer);
          if (!matches) {
            throw new Error("No code matches found");
          }
          generatedCode = matches[1];
        } else {
          generatedCode = answer;
        }
      }

      logEntry = {
        timestamp: new Date().toISOString(),
        provider: 'openai',
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
          thinking,
          code: generatedCode.trim()
        },
        metadata: {
          temperature: 0.6,
          maxTokens: 4096
        },
        duration
      };

      apiLogger.logAPICall(logEntry);

      return { 
        code: generatedCode.trim(), 
        thinking, 
        inputTokenCount, 
        outputTokenCount
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      logEntry = {
        timestamp: new Date().toISOString(),
        provider: 'openai',
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
          temperature: 0.6,
          maxTokens: 4096
        },
        duration
      };

      apiLogger.logAPICall(logEntry);
      throw error;
    }
  }
}
