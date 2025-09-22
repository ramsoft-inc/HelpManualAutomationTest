import { Page } from "@playwright/test";

export type TracewrightOptions = {
  script: string;
  alternateDoneString?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  beforeEach?: (page: Page) => Promise<any> | any;
  changedMarkdownFiles?: string[]; // PR-diff aware: restrict markdown context search
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aiUtils?: any; // AI utils instance for enhanced screenshot processing
  currentFile?: string; // Current markdown file being processed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  processedFiles?: any[]; // Processed file results
};
