/**
 * Helper utility functions for Automata Studio.
 */

/**
 * Formats a Set of state numbers into a sorted display string e.g. "{0, 1, 2}".
 */
export function formatStateSet(states: Set<number> | number[]): string {
  const arr = Array.from(states).sort((a, b) => a - b);
  return `{${arr.join(', ')}}`;
}

/**
 * Formats a list of string states into a sorted display string.
 */
export function formatStringStateSet(states: Set<string> | string[]): string {
  const arr = Array.from(states).sort();
  return `{${arr.join(', ')}}`;
}

/**
 * Sanitizes a string for safe usage in file downloads.
 */
export function sanitizeFilename(input: string, maxLen = 30): string {
  return input.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, maxLen);
}

/**
 * Copies text to user clipboard safely.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}
