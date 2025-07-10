import OpenAI from "openai";
import { ChatCompletionCreateParamsNonStreaming } from "openai/resources";
import { GenerateCodeResponse } from "../llm_request";
import { ClickableDomResult } from "../page_helpers";
import { LLMProvider } from "./base_provider";

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
    currentStepErrorCode: string
  ): Promise<GenerateCodeResponse> {
    // console.log('🔍 Using prompt for code generation:', scenarioText);
    // console.log('🔍 System instruction:', systemInstruction);

    const response = await this.openai.chat.completions.create({
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
            { type: "text", text: `User Script:\n${scenarioText}` },
          ],
        },
      ],
      max_completion_tokens: 4096,
      temperature: 0.6,
    } as ChatCompletionCreateParamsNonStreaming);

    const answer = response.choices[0]?.message?.content;
    const inputTokenCount = response.usage?.prompt_tokens || 0;
    const outputTokenCount = response.usage?.completion_tokens || 0;

    if (!answer) {
      return {
        code: "done",
        inputTokenCount,
        outputTokenCount,
      };
    }

    let generatedCode: string;
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

    return { code: generatedCode.trim(), inputTokenCount, outputTokenCount};
  }
}
