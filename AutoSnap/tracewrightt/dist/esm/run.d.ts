import { Page } from "@playwright/test";
import { TracewrightOptions } from "./types.js";
export declare const run: (page: Page, options: TracewrightOptions) => Promise<void>;
export default run;
