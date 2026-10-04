/**
 * Inserts explicit concatenation operators (`.`) into a regex string.
 *
 * The concatenation operator is inserted between two adjacent tokens
 * when concatenation is implied. Specifically, `.` is inserted between:
 *   - literal followed by literal
 *   - literal followed by `(`
 *   - literal followed by nothing (end covered elsewhere)
 *   - `)` followed by literal
 *   - `)` followed by `(`
 *   - `*` followed by literal
 *   - `*` followed by `(`
 *
 * `.` is NOT inserted:
 *   - before `)`
 *   - after `(`
 *   - before `|`
 *   - after `|`
 *   - between two operators where it does not make sense
 */

type CharClass = 'LITERAL' | 'STAR' | 'RPAREN' | 'LPAREN' | 'UNION' | 'CONCAT';

function classifyChar(ch: string): CharClass {
  if (ch === '*') return 'STAR';
  if (ch === '(') return 'LPAREN';
  if (ch === ')') return 'RPAREN';
  if (ch === '|') return 'UNION';
  if (ch === '.') return 'CONCAT';
  return 'LITERAL';
}

/**
 * Returns true if a concatenation operator should be inserted
 * between the current character (left) and the next character (right).
 */
function shouldInsertConcat(left: CharClass, right: CharClass): boolean {
  // Left side can produce output: literal, *, )
  const leftProducesOutput = left === 'LITERAL' || left === 'STAR' || left === 'RPAREN';
  // Right side can accept input: literal, (
  const rightAcceptsInput = right === 'LITERAL' || right === 'LPAREN';

  return leftProducesOutput && rightAcceptsInput;
}

/**
 * Inserts explicit concatenation operators (`.`) into a regex string
 * wherever concatenation is implied.
 *
 * @param regex - The raw regex string (without explicit concatenation)
 * @returns The regex string with explicit `.` concatenation operators inserted
 *
 * @example
 * insertConcatenationOperators("ab")    // "a.b"
 * insertConcatenationOperators("a(b|c)") // "a.(b|c)"
 * insertConcatenationOperators("a*b")   // "a*.b"
 */
export function insertConcatenationOperators(regex: string): string {
  if (regex.length === 0) return regex;

  let result = '';

  for (let i = 0; i < regex.length; i++) {
    const current = regex[i];
    result += current;

    if (i + 1 < regex.length) {
      const next = regex[i + 1];
      const leftClass = classifyChar(current);
      const rightClass = classifyChar(next);

      if (shouldInsertConcat(leftClass, rightClass)) {
        result += '.';
      }
    }
  }

  return result;
}
