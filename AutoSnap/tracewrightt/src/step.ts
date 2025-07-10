import { Page } from "@playwright/test";
import fs from "fs";
import { CODE_GENERATION_PROMPT, CODE_SYSTEM_INSTRUCTION } from "./llm_providers/base_provider";
import { GeminiProvider } from "./llm_providers/gemini_provider";
import { OpenAIProvider } from "./llm_providers/openai_provider";
import { GenerateCodeResponse, LLMRequestHandler } from "./llm_request";
import { executeCode, getInteractiveHTML } from "./page_helpers";

// Allow runtime switch:  LLM_PROVIDER=openai  or gemini (default)
const providerName = (process.env.LLM_PROVIDER || "gemini").toLowerCase();

const provider = providerName === "openai"
  ? new OpenAIProvider()
  : new GeminiProvider();

const llmHandler = new LLMRequestHandler(provider);

// Allow overriding the screenshot timeout via env; default to 0 (no timeout)
const SCREENSHOT_TIMEOUT = process.env.SCREENSHOT_TIMEOUT ? Number(process.env.SCREENSHOT_TIMEOUT) : 0;

// Optionally disable the page-level screenshots Tracewright takes before each step.
// Set ENV: CAPTURE_STEP_SCREENSHOTS=false to skip them (useful when they time-out on heavy pages).
const CAPTURE_STEP_SCREENSHOTS = process.env.CAPTURE_STEP_SCREENSHOTS !== 'false';

export const generateStep = async (
  page: Page,
  scenarioText: string,
  stepCount: number,
  previouslyExecutedCode: string,
  currentStepErrorCode: string
): Promise<GenerateCodeResponse> => {
  let stepScreenshotBuffer: Buffer | undefined;

  if (CAPTURE_STEP_SCREENSHOTS) {
    const shotPath = `./steps/${stepCount}-screenshot.png`;
    await page.screenshot({ fullPage: true, path: shotPath, timeout: SCREENSHOT_TIMEOUT });
    stepScreenshotBuffer = await fs.promises.readFile(shotPath);
  }

  const domResult = await getInteractiveHTML(page);
  fs.writeFileSync(`./steps/${stepCount}-source.html`, domResult.visibleElements);

  let screenshot: Buffer;
  if (CAPTURE_STEP_SCREENSHOTS) {
    screenshot = await page.screenshot({
      fullPage: true,
      path: `./steps/${stepCount}-screenshot-mocked.jpeg`,
      type: "jpeg",
      quality: 100,
      timeout: SCREENSHOT_TIMEOUT,
    });
  } else {
    // Provide empty buffer when screenshots are disabled
    screenshot = Buffer.from('');
  }

  const fullPrompt = `
=====================
Full Prompt for Step ${stepCount}
=====================

-------- System Instruction --------
${CODE_SYSTEM_INSTRUCTION}

-------- Scenario Text --------
${scenarioText}

-------- Code Generation Prompt --------
${CODE_GENERATION_PROMPT}

-------- Context --------
Page URL: ${page.url()}

Previously Executed Code:
${previouslyExecutedCode || 'None'}

Current Step Error Code:
${currentStepErrorCode || 'None'}
`;

  fs.writeFileSync(`./steps/${stepCount}-prompt.txt`, fullPrompt);

  const codeResponse = await llmHandler.generateWithContext(
    CODE_SYSTEM_INSTRUCTION,
    scenarioText + "\n\n" + CODE_GENERATION_PROMPT,
    domResult,
    page.url(),
    screenshot,
    previouslyExecutedCode,
    currentStepErrorCode,
    true,
    true
  );

  fs.writeFileSync(`./steps/${stepCount}-code.ts`, codeResponse.code);

  // Print the generated Playwright code for visibility (without other metadata)
  console.log(`\n\u2705 Generated Playwright code for step ${stepCount}:\n${codeResponse.code}\n`);

  return codeResponse;
};

export const performStep = async (page: Page, codeResponse: GenerateCodeResponse): Promise<string | undefined> => {
  try {
    await executeCode(page, codeResponse);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return error.stack;
  }

  return undefined
};

export const cleanStepFiles = () => {
  if (!fs.existsSync("./steps")) {
    fs.mkdirSync("./steps");
  }

  fs.rmSync("./steps/*", { recursive: true, force: true });
};
