import { Page } from "@playwright/test";
import chalk from "chalk";
import { GenerateCodeResponse } from "./llm_request";
import { clearElementHighlights } from "./page_helpers";
import { cleanStepFiles, generateStep, performStep } from "./step";
import { TracewrightOptions } from "./types";

export const run = async (page: Page, options: TracewrightOptions) => {
  const { script, alternateDoneString, beforeEach } = options;
  const doneString = alternateDoneString || "done";

  let stepCounter = 1;
  let inputTokenTotalCount = 0;
  let outputTokenTotalCount = 0;
  const allExecutedStepCode: string[] = [];
  let currentStepCodeResponse: GenerateCodeResponse;
  let currentStepErroredCode: string[] = [];

  cleanStepFiles();

  while (true) {
    console.info(chalk.green("*** step"), stepCounter);
    console.info("waiting for page to settle...");

    if (beforeEach) {
      console.info("running beforeEach...");
      await beforeEach(page);
    } else {
      await page.waitForTimeout(30000); // Increased from 5 seconds to 30 seconds
    }

    if (allExecutedStepCode.length > 0) {
      console.info("successfully executed code:");
      console.info(chalk.gray(allExecutedStepCode.join("\n")));
    }

    if (currentStepErroredCode.length > 0) {
      console.info("current errors:");
      console.info(chalk.gray(currentStepErroredCode.join("\n")));
    }

    console.info("generating code...");
    currentStepCodeResponse = await generateStep(
      page,
      script,
      stepCounter,
      allExecutedStepCode.join("\n"),
      currentStepErroredCode.join("\n\n")
    );
    console.info(chalk.gray(currentStepCodeResponse.code));

    await clearElementHighlights(page);

    inputTokenTotalCount += currentStepCodeResponse.inputTokenCount;
    outputTokenTotalCount += currentStepCodeResponse.outputTokenCount;

    if (currentStepCodeResponse.code === doneString) {
      break;
    }

    const stepErrorStack = await performStep(page, currentStepCodeResponse);
    if (stepErrorStack) {
      console.error(chalk.red("error executing step"), stepCounter);
      console.error(stepErrorStack);
      currentStepErroredCode.push(stepErrorStack);
      continue;
    }

    allExecutedStepCode.push(currentStepCodeResponse.code);
    currentStepErroredCode = [];

    console.info(chalk.green("*** end of step"), stepCounter);

    stepCounter++;
  }

  console.info(chalk.green("*** script completed"));
  console.info(chalk.green("steps executed:\t"), stepCounter);
  console.info(chalk.green("\t"), inputTokenTotalCount);
  console.info(chalk.green("output tokens:\t"), outputTokenTotalCount);

};

export default run;
