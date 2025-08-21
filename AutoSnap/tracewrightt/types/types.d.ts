import { Page } from "@playwright/test";
export type TracewrightOptions = {
    script: string;
    alternateDoneString?: string;
    beforeEach?: (page: Page) => Promise<any> | any;
    changedMarkdownFiles?: string[];
};
