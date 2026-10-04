/**
 * Tokenizer for regular expressions.
 * Converts a regex string into a sequence of typed tokens.
 */

export type TokenType = 'LITERAL' | 'UNION' | 'CONCAT' | 'STAR' | 'LPAREN' | 'RPAREN';

export interface Token {
  type: TokenType;
  value: string;
}

/** Characters that are treated as operators */
const OPERATORS = new Set(['|', '.', '*', '(', ')']);

/** Valid literal characters in a regex */
const VALID_LITERAL = /^[a-zA-Z0-9_\-]$/;

/**
 * Determine whether a character is a valid regex literal symbol.
 */
export function isLiteral(ch: string): boolean {
  return VALID_LITERAL.test(ch) && !OPERATORS.has(ch);
}

/**
 * Tokenize a preprocessed (explicit-concatenation) regex string.
 * Assumes `.` is the explicit concatenation operator.
 *
 * @param regex - The regex string (with explicit concatenation `.`)
 * @returns An array of typed tokens
 * @throws {Error} if an invalid character is encountered
 */
export function tokenize(regex: string): Token[] {
  const tokens: Token[] = [];

  for (let i = 0; i < regex.length; i++) {
    const ch = regex[i];

    switch (ch) {
      case '(':
        tokens.push({ type: 'LPAREN', value: ch });
        break;
      case ')':
        tokens.push({ type: 'RPAREN', value: ch });
        break;
      case '|':
        tokens.push({ type: 'UNION', value: ch });
        break;
      case '.':
        tokens.push({ type: 'CONCAT', value: ch });
        break;
      case '*':
        tokens.push({ type: 'STAR', value: ch });
        break;
      default:
        if (isLiteral(ch)) {
          tokens.push({ type: 'LITERAL', value: ch });
        } else {
          throw new Error(`Invalid character '${ch}' at position ${i} in regex.`);
        }
    }
  }

  return tokens;
}
