import { Page } from "@playwright/test";
import { TracewrightOptions } from "./types";
export declare const run: (page: Page, options: TracewrightOptions) => Promise<void>;
export default run;
