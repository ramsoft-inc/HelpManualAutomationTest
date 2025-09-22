/**
 * Filters long path attributes from HTML text and replaces them with [path]
 * This function can be applied to any HTML text to clean up long path attributes
 * that don't add value to the HTML analysis.
 */
export function filterLongPaths(htmlText: string): string {
  // Regex to find SVG path data attributes and other long path-like attributes and replace them with [path]
  // This includes d=, path=, data=, coords=, points, clip-path, and shape attributes
  return htmlText.replace(/\s(d|path|data|coords|points|clip-path|shape)="[^"]{10,}"/g, function(match, attrName) {
    return ' ' + attrName + '="[path]"';
  });
}

/**
 * Alternative version that filters paths more aggressively by also catching attributes 
 * with single quotes and other variations
 */
export function filterLongPathsAggressive(htmlText: string): string {
  // Handle both double and single quotes, and catch more attribute variations
  return htmlText
    .replace(/\s(d|path|data|coords|points|clip-path|shape)="[^"]{10,}"/g, ' $1="[path]"')
    .replace(/\s(d|path|data|coords|points|clip-path|shape)='[^']{10,}'/g, " $1='[path]'")
    .replace(/\s(viewBox|transform|style)="[^"]{50,}"/g, ' $1="[long]"')
    .replace(/\s(viewBox|transform|style)='[^']{50,}'/g, " $1='[long]'");
}
