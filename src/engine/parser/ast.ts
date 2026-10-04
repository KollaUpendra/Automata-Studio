/**
 * Abstract Syntax Tree (AST) types and postfix-to-AST builder
 * for regular expressions.
 */

// ---------------------------------------------------------------------------
// AST Node Types
// ---------------------------------------------------------------------------

export interface LiteralNode {
  readonly type: 'literal';
  readonly value: string;
}

export interface UnionNode {
  readonly type: 'union';
  readonly left: RegexNode;
  readonly right: RegexNode;
}

export interface ConcatNode {
  readonly type: 'concat';
  readonly left: RegexNode;
  readonly right: RegexNode;
}

export interface StarNode {
  readonly type: 'star';
  readonly child: RegexNode;
}

/** Discriminated union of all AST node types */
export type RegexNode = LiteralNode | UnionNode | ConcatNode | StarNode;

// ---------------------------------------------------------------------------
// Postfix to AST
// ---------------------------------------------------------------------------

/**
 * Builds an Abstract Syntax Tree from a postfix regex string.
 *
 * The postfix string must use:
 *   - single-character literals (a-z, A-Z, 0-9, _, -)
 *   - `*` for Kleene star (unary, pops 1)
 *   - `.` for concatenation (binary, pops 2)
 *   - `|` for union (binary, pops 2)
 *
 * @param postfix - The regex in postfix form
 * @returns The root AST node
 * @throws {Error} on malformed postfix input
 *
 * @example
 * postfixToAst("ab.")  // concat(a, b)
 * postfixToAst("ab|")  // union(a, b)
 * postfixToAst("a*")   // star(a)
 */
export function postfixToAst(postfix: string): RegexNode {
  if (postfix.length === 0) {
    throw new Error('Cannot build AST from empty postfix expression.');
  }

  const stack: RegexNode[] = [];

  for (let i = 0; i < postfix.length; i++) {
    const ch = postfix[i];

    switch (ch) {
      case '*': {
        if (stack.length < 1) {
          throw new Error(`Invalid postfix expression: "${ch}" at position ${i} has no operand.`);
        }
        const child = stack.pop()!;
        stack.push({ type: 'star', child });
        break;
      }

      case '.': {
        if (stack.length < 2) {
          throw new Error(
            `Invalid postfix expression: concatenation "." at position ${i} requires two operands.`,
          );
        }
        const right = stack.pop()!;
        const left = stack.pop()!;
        stack.push({ type: 'concat', left, right });
        break;
      }

      case '|': {
        if (stack.length < 2) {
          throw new Error(
            `Invalid postfix expression: union "|" at position ${i} requires two operands.`,
          );
        }
        const right = stack.pop()!;
        const left = stack.pop()!;
        stack.push({ type: 'union', left, right });
        break;
      }

      default: {
        // Assume literal
        stack.push({ type: 'literal', value: ch });
        break;
      }
    }
  }

  if (stack.length !== 1) {
    throw new Error(
      `Invalid postfix expression: expected exactly one root node, got ${stack.length}. ` +
        `The expression may have missing operators.`,
    );
  }

  return stack[0];
}

// ---------------------------------------------------------------------------
// AST Utilities
// ---------------------------------------------------------------------------

/**
 * Pretty-prints an AST node as a human-readable string (for debugging).
 */
export function astToString(node: RegexNode): string {
  switch (node.type) {
    case 'literal':
      return node.value;
    case 'star':
      return `(${astToString(node.child)})*`;
    case 'concat':
      return `(${astToString(node.left)}.${astToString(node.right)})`;
    case 'union':
      return `(${astToString(node.left)}|${astToString(node.right)})`;
  }
}
