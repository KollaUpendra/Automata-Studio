/**
 * Converts a regex infix expression (with explicit concatenation operators)
 * to postfix notation using the Shunting-yard algorithm.
 *
 * Operator precedence (higher = binds tighter):
 *   *   → 3  (unary, right-to-left conceptually but applied immediately)
 *   .   → 2  (binary, left-associative)
 *   |   → 1  (binary, left-associative)
 *
 * Parentheses override precedence in the standard way.
 */

/** Operator precedence table */
const PRECEDENCE: Record<string, number> = {
  '*': 3,
  '.': 2,
  '|': 1,
};

/** Returns the precedence of an operator, or 0 if not an operator */
function precedence(op: string): number {
  return PRECEDENCE[op] ?? 0;
}

/** Returns true if the character is a binary or unary operator */
function isOperator(ch: string): boolean {
  return ch === '*' || ch === '.' || ch === '|';
}

/**
 * Converts a regex string in infix notation (with explicit concatenation `.`)
 * to postfix (Reverse Polish Notation) using the Shunting-yard algorithm.
 *
 * @param infix - The regex in infix form (with explicit `.` concatenation)
 * @returns The regex in postfix form
 * @throws {Error} on mismatched parentheses or malformed input
 *
 * @example
 * infixToPostfix("a.b")       // "ab."
 * infixToPostfix("a|b")       // "ab|"
 * infixToPostfix("a.(b|c)")   // "abc|."
 * infixToPostfix("a*")        // "a*"
 * infixToPostfix("(a|b)*")    // "ab|*"
 */
export function infixToPostfix(infix: string): string {
  const output: string[] = [];
  const operatorStack: string[] = [];

  for (let i = 0; i < infix.length; i++) {
    const ch = infix[i];

    if (ch === '(') {
      operatorStack.push(ch);
    } else if (ch === ')') {
      // Pop until matching '('
      let foundLeft = false;
      while (operatorStack.length > 0) {
        const top = operatorStack.pop()!;
        if (top === '(') {
          foundLeft = true;
          break;
        }
        output.push(top);
      }
      if (!foundLeft) {
        throw new Error('Mismatched parentheses: unexpected ")".');
      }
    } else if (isOperator(ch)) {
      // Pop operators with higher or equal precedence (left-associative)
      // For *, it is unary and right-associative, so we only pop strictly greater
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1] !== '(' &&
        (ch === '*'
          ? precedence(operatorStack[operatorStack.length - 1]) > precedence(ch)
          : precedence(operatorStack[operatorStack.length - 1]) >= precedence(ch))
      ) {
        output.push(operatorStack.pop()!);
      }
      operatorStack.push(ch);
    } else {
      // Literal — goes straight to output
      output.push(ch);
    }
  }

  // Drain remaining operators
  while (operatorStack.length > 0) {
    const op = operatorStack.pop()!;
    if (op === '(' || op === ')') {
      throw new Error('Mismatched parentheses: unclosed "(".');
    }
    output.push(op);
  }

  return output.join('');
}
