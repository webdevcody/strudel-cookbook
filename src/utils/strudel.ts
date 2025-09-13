/**
 * Utility functions for working with Strudel code
 */

/**
 * Opens Strudel code in a new browser tab
 * @param strudelCode - The Strudel code to open
 */
export function openInStrudel(strudelCode: string): void {
  if (!strudelCode) return;

  const base64Code = btoa(strudelCode);
  const strudelUrl = `https://strudel.cc/#${base64Code}`;
  window.open(strudelUrl, '_blank');
}

/**
 * Generates a Strudel URL for the given code
 * @param strudelCode - The Strudel code to encode
 * @returns The complete Strudel URL
 */
export function generateStrudelUrl(strudelCode: string): string {
  if (!strudelCode) return '';

  const base64Code = btoa(strudelCode);
  return `https://strudel.cc/#${base64Code}`;
}