/**
 * Filters long path attributes from HTML text and replaces them with [path]
 * This function can be applied to any HTML text to clean up long path attributes
 * that don't add value to the HTML analysis.
 */
export declare function filterLongPaths(htmlText: string): string;
/**
 * Alternative version that filters paths more aggressively by also catching attributes
 * with single quotes and other variations
 */
export declare function filterLongPathsAggressive(htmlText: string): string;
