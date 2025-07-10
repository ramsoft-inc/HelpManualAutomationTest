import { Content, GenerateContentParameters, GoogleGenAI, HarmBlockThreshold, HarmCategory } from "@google/genai";
import * as fs from 'fs';
import * as path from 'path';
import { GenerateCodeResponse } from "../llm_request";
import { ClickableDomResult } from "../page_helpers";
import { LLMProvider } from "./base_provider";
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
    currentStepErrorCode: string
  ): Promise<GenerateCodeResponse> {
    // if (process.env.VERBOSE_LLM) {
    //   console.log('🔍 Using prompt for code generation:', scenarioText);
    //   console.log('🔍 System instruction:', systemInstruction);
    // }

    const request = this.buildRequest(
      systemInstruction,
      scenarioText,
      domResult,
      pageUrl,
      screenshot,
      previouslyExecutedCode,
      currentStepErrorCode
    );

    // Disable verbose Gemini API request logging to keep console output focused on generated code
    const shouldLogGemini = false;
    let originalFetch: typeof global.fetch | undefined;
    if (shouldLogGemini) {
      originalFetch = global.fetch;
      global.fetch = async (url, options) => {
        const defaultOptions = { method: 'GET', headers: {}, body: null, ...options } as any;

        const logFilePath = path.join(process.cwd(), 'gemini_api_requests.log');

        let logContent = `\n\n==================================================\n`;
        logContent += `🔍 Intercepted Gemini API Request at ${new Date().toISOString()}\n`;
        logContent += `==================================================\n`;
        logContent += `URL: ${url}\n`;
        logContent += `METHOD: ${defaultOptions.method}\n`;
        logContent += `HEADERS: ${JSON.stringify(defaultOptions.headers, null, 2)}\n`;
        logContent += `BODY: ${defaultOptions.body}\n`;
        logContent += `--------------------------------------------------\n\n`;

        // To reconstruct as a curl command:
        const headers = defaultOptions.headers || {};
        const headersString = Object.entries(headers).map(([key, value]) => `  -H '${key}: ${String(value)}'`).join(' \\\n');
        const curlCommand = `curl -X ${defaultOptions.method} '${url}' \\\n${headersString} ${defaultOptions.body ? `\\\n  -d '${defaultOptions.body}'` : ''}`;
        
        logContent += `Equivalent curl command:\n${curlCommand}\n`;
        logContent += `==================================================\n\n`;

        fs.appendFileSync(logFilePath, logContent);

        return originalFetch!(url, defaultOptions);
      };
    }

    const response = await this.gemini.models.generateContent(request);

    // Restore original fetch if we overwrote it
    if (shouldLogGemini && originalFetch) {
      global.fetch = originalFetch;
    }
    
    const answer = response.candidates?.[0]?.content?.parts?.[0]?.text;
    const inputTokenCount = response.usageMetadata?.promptTokenCount || 0;
    const outputTokenCount = response.usageMetadata?.candidatesTokenCount || 0;

    if (!answer) {
      return {
        code: "done",
        inputTokenCount: inputTokenCount,
        outputTokenCount: outputTokenCount,
      };
    }


    return {
      code: this.parseCodeResponse(answer),
      inputTokenCount,
      outputTokenCount,
    }
  }

  private buildRequest(
    systemInstruction: string,
    scenarioText: string,
    domResult: ClickableDomResult,
    pageUrl: string,
    screenshot: Buffer,
    previouslyExecutedCode: string,
    currentStepErrorCode: string
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

  private parseCodeResponse(answer: string): string {
    let generatedCode: string;
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

    // Ensure every Playwright click has force:true without duplicating or nesting objects
    // 1) no args  => .click({ force:true })
    generatedCode = generatedCode.replace(/\.click\(\s*\)/g, '.click({ force: true })');

    // 2) existing object literal but missing force => append it
    generatedCode = generatedCode.replace(/\.click\(\s*{([^}]*)}\s*\)/g, (match, inner) => {
      return /force\s*:\s*/.test(inner)
        ? match // already has force
        : `.click({ ${inner.trim()}${inner.trim() ? ', ' : ''}force: true })`;
    });

    return generatedCode.trim();
  }
}
