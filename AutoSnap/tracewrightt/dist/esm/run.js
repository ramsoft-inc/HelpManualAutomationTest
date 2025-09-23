import chalk from "chalk";
import { clearElementHighlights } from "./page_helpers.js";
import { cleanStepFiles, generateStep, performStep } from "./step.js";
export const run = async (page, options) => {
    const { script, alternateDoneString, beforeEach, aiUtils, currentFile } = options;
    const doneString = alternateDoneString || "done";
    let stepCounter = 1;
    let inputTokenTotalCount = 0;
    let outputTokenTotalCount = 0;
    const allExecutedStepCode = [];
    let currentStepCodeResponse;
    let currentStepErroredCode = [];
    let previousStepThinking = ""; // Track previous step's thinking
    const previousStepsThinking = []; // Store all steps' thinking for logging
    cleanStepFiles();
    while (true) {
        console.info(chalk.green("*** step"), stepCounter);
        console.info("waiting for page to settle...");
        if (beforeEach) {
            console.info("running beforeEach...");
            await beforeEach(page);
        }
        else {
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
        currentStepCodeResponse = await generateStep(page, script, stepCounter, allExecutedStepCode.join("\n"), currentStepErroredCode.join("\n\n"), previousStepThinking);
        console.info(chalk.gray(currentStepCodeResponse.code));
        await clearElementHighlights(page);
        inputTokenTotalCount += currentStepCodeResponse.inputTokenCount;
        outputTokenTotalCount += currentStepCodeResponse.outputTokenCount;
        if (currentStepCodeResponse.code === doneString) {
            // Print the thinking associated with the done command
            console.info(chalk.green("*** script completion reason:"));
            console.info(chalk.blue(currentStepCodeResponse.thinking || "No completion reasoning provided"));
            // Store the done command thinking as well
            if (currentStepCodeResponse.thinking) {
                previousStepsThinking.push(`DONE COMMAND: ${currentStepCodeResponse.thinking}`);
            }
            break;
        }
        const stepErrorStack = await performStep(page, currentStepCodeResponse, aiUtils);
        if (stepErrorStack) {
            console.error(chalk.red("error executing step"), stepCounter);
            console.error(stepErrorStack);
            currentStepErroredCode.push(stepErrorStack);
            continue;
        }
        allExecutedStepCode.push(currentStepCodeResponse.code);
        currentStepErroredCode = [];
        // Store the current step's thinking for the next step
        previousStepThinking = currentStepCodeResponse.thinking || "";
        // Also store this step's thinking in the array for later logging
        previousStepsThinking.push(`Step ${stepCounter}: ${previousStepThinking}`);
        console.info(chalk.green("*** end of step"), stepCounter);
        console.info(chalk.blue("*** thinking for next step: "), previousStepThinking.substring(0, 100) + (previousStepThinking.length > 100 ? "..." : ""));
        stepCounter++;
    }
    console.info(chalk.green("\n==============================================="));
    console.info(chalk.green("🏁 EXECUTION COMPLETE - FINAL TOKEN REPORT 🏁"));
    console.info(chalk.green("==============================================="));
    console.info(chalk.green("Total Steps Executed:\t\t"), chalk.yellow(stepCounter));
    console.info(chalk.green("Total Input Tokens:\t\t"), chalk.yellow(inputTokenTotalCount.toLocaleString()));
    console.info(chalk.green("Total Output Tokens:\t\t"), chalk.yellow(outputTokenTotalCount.toLocaleString()));
    console.info(chalk.green("Total Tokens Used:\t\t"), chalk.yellow((inputTokenTotalCount + outputTokenTotalCount).toLocaleString()));
    console.info(chalk.green("Average Tokens Per Step:\t"), chalk.yellow(Math.round((inputTokenTotalCount + outputTokenTotalCount) / stepCounter).toLocaleString()));
    console.info(chalk.green("==============================================="));
    // Display comprehensive token usage statistics at the end
    try {
        // Write detailed token usage statistics to file
        const tokenLogPath = 'token_usage_summary.txt';
        const thinkingLogPath = 'ai_thinking_log.txt';
        // Create a comprehensive token usage summary
        const timestamp = new Date().toISOString();
        const tokenSummary = [
            `\n===== Comprehensive Token Usage Summary (${timestamp}) =====`,
            `Script completed with ${stepCounter} steps`,
            `Input tokens: ${inputTokenTotalCount}`,
            `Output tokens: ${outputTokenTotalCount}`,
            `Total tokens: ${inputTokenTotalCount + outputTokenTotalCount}`,
            `Average tokens per step: ${Math.round((inputTokenTotalCount + outputTokenTotalCount) / stepCounter)}`,
            '====================================================='
        ].join('\n');
        // Write the summary to file
        const fs = await import('fs');
        fs.appendFileSync(tokenLogPath, tokenSummary + '\n\n');
        // Don't write thinking logs at the end, they're now written in real-time
        console.info(chalk.blue("*** AI thinking logs are written in real-time to:"), thinkingLogPath);
        console.info(chalk.blue("*** Token usage statistics written to:"), tokenLogPath);
    }
    catch (e) {
        console.warn(chalk.yellow("Could not write token usage statistics:"), e instanceof Error ? e.message : String(e));
    }
};
export default run;
