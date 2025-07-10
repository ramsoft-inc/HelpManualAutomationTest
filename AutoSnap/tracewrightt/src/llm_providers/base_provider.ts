import { GenerateCodeResponse } from "../llm_request";
import { ClickableDomResult } from "../page_helpers";

export const CODE_SYSTEM_INSTRUCTION =
  "You are a code-generation assistant. Your only task is to output Playwright executable code in Typescript for each and every step defined in the user script in the exact order as defined in the user script.";
export const CODE_GENERATION_PROMPT = `Prompt:\nGiven that Playwright has already navigated to the Current Page URL, the website consists of the Current Page HTML, current screen is the Current Page Screenshot, and the User Script, create a script that will the perform the next step in the User Script.
output code to perform one action. Do not use a "page.goto" in the answer.
Do not use comments in the answer. Ignore help menus.
When clicking on a button, return only one line of code that includes the click command.
When filling out a form, output all the code needed to fill out the form.
When you are done the plan in the User Script, create a script that only returns "done".
Do not use import statements in the code. When calling an async function, use await. 
If there is a modal on the screen, close it before continuing the script.
Force all the clicks.
add a 20000ms timeout to all the clicks.
When clicking any element, append .first() so the locator is unique.
DO NOT SKIP ANY STEP EVER.
DO NOT FINISH THE JOB WITHOUT COMPLETING ALL THE STEPS.
Use the step number to keep track of which step to perform next and match the order of the steps in the user script.
`;



export interface LLMProvider {
  generateWithContext(
    systemInstruction: string,
    scenarioText: string,
    domResult: ClickableDomResult,
    pageUrl: string,
    screenshot: Buffer,
    previouslyExecutedCode: string,
    currentStepErrorCode: string,
    includeSystemInstruction: boolean,
    isCodeAnswer: boolean
  ): Promise<GenerateCodeResponse>;
}
