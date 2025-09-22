import { Page } from "@playwright/test";
import fs from "fs";
import { CODE_GENERATION_PROMPT, CODE_SYSTEM_INSTRUCTION, getCodeGenerationPrompt } from "./llm_providers/base_provider.js";
import { GeminiProvider } from "./llm_providers/gemini_provider.js";
import { OpenAIProvider } from "./llm_providers/openai_provider.js";
import { ClaudeProvider } from "./llm_providers/claude_provider.js";
import { GenerateCodeResponse, LLMRequestHandler } from "./llm_request.js";
import { executeCode, getInteractiveHTML } from "./page_helpers.js";
import { filterLongPaths } from "./html_path_filter.js";

// Allow runtime switch: LLM_PROVIDER=openai, gemini, or claude (default: openai)
const providerName = (process.env.LLM_PROVIDER || "openai").toLowerCase();

const provider = providerName === "openai"
  ? new OpenAIProvider()
  : providerName === "gemini"
  ? new GeminiProvider()
  : providerName === "claude"
  ? new ClaudeProvider()
  : new OpenAIProvider(); // fallback to OpenAI

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
  currentStepErrorCode: string,
  previousStepThinking: string = "" // Default to empty string if not provided
): Promise<GenerateCodeResponse> => {
  let stepScreenshotBuffer: Buffer | undefined;

  if (CAPTURE_STEP_SCREENSHOTS) {
    const shotPath = `./steps/${stepCount}-screenshot.png`;
    await page.screenshot({ fullPage: true, path: shotPath, timeout: SCREENSHOT_TIMEOUT });
    stepScreenshotBuffer = await fs.promises.readFile(shotPath);
  }

  const domResult = await getInteractiveHTML(page);
  
  // Apply path filtering to clean up long SVG paths and other verbose attributes
  const filteredDomResult = {
    ...domResult,
    visibleElements: filterLongPaths(domResult.visibleElements),
    hiddenElements: filterLongPaths(domResult.hiddenElements)
  };
  
  fs.writeFileSync(`./steps/${stepCount}-source.html`, filteredDomResult.visibleElements);

  // Get the appropriate prompt based on the current provider
  const currentPrompt = getCodeGenerationPrompt(providerName);

  let screenshot: Buffer;
  if (CAPTURE_STEP_SCREENSHOTS) {
    // Use PNG format for Claude compatibility
    const screenshotFormat = providerName === "claude" ? "png" : "jpeg";
    const screenshotPath = `./steps/${stepCount}-screenshot-mocked.${screenshotFormat}`;
    
    screenshot = await page.screenshot({
      fullPage: true,
      path: screenshotPath,
      type: screenshotFormat as "png" | "jpeg",
      ...(screenshotFormat === "jpeg" && { quality: 100 }),
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
${currentPrompt}

-------- Context --------
Page URL: ${page.url()}

Previously Executed Code:
${previouslyExecutedCode || 'None'}

Current Step Error Code:
${currentStepErrorCode || 'None'}

${previousStepThinking ? `Previous Step Thinking:
${previousStepThinking}` : ''}
`;

  fs.writeFileSync(`./steps/${stepCount}-prompt.txt`, fullPrompt);

  const codeResponse = await llmHandler.generateWithContext(
    CODE_SYSTEM_INSTRUCTION,
    scenarioText + "\n\n" + currentPrompt,
    filteredDomResult,
    page.url(),
    screenshot,
    previouslyExecutedCode,
    currentStepErrorCode,
    true,
    true,
    previousStepThinking // Pass previous step thinking to the LLM handler
  );

  fs.writeFileSync(`./steps/${stepCount}-code.ts`, codeResponse.code);

  // Print the generated Playwright code for visibility (without other metadata)
  console.log(`\n\u2705 Generated Playwright code for step ${stepCount}:\n${codeResponse.code}\n`);

  return codeResponse;
};

export const performStep = async (page: Page, codeResponse: GenerateCodeResponse, aiUtils?: any): Promise<string | undefined> => {
  try {
    await executeCode(page, codeResponse, undefined, undefined, undefined, aiUtils);
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
