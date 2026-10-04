/**
 * Main parser module.
 * Orchestrates tokenization → concatenation insertion → infix-to-postfix → AST.
 */

import { insertConcatenationOperators } from './concatenate';
import { infixToPostfix } from './infixToPostfix';
import { postfixToAst, type RegexNode } from './ast';
import { validateRegex, type ValidationResult } from '../validation/validateRegex';

export interface ParseResult {
  readonly raw: string;
  readonly withConcat: string;
  readonly postfix: string;
  readonly ast: RegexNode;
}

export interface ParseError {
  readonly message: string;
  readonly stage: 'validation' | 'concatenation' | 'postfix' | 'ast';
  readonly validationResult?: ValidationResult;
}

export type ParseOutcome =
  { success: true; result: ParseResult } | { success: false; error: ParseError };

/**
 * Parses a raw regular expression through the full pipeline:
 *   validation → concat insertion → postfix → AST
 *
 * @param regex - The raw regex string entered by the user
 * @returns A `ParseOutcome` indicating success or failure with details
 */
export function parseRegex(regex: string): ParseOutcome {
  // Stage 1: Validation
  const validation = validateRegex(regex);
  if (!validation.valid) {
    return {
      success: false,
      error: {
        message: validation.errors[0]?.message ?? 'Invalid regular expression.',
        stage: 'validation',
        validationResult: validation,
      },
    };
  }

  // Stage 2: Insert explicit concatenation operators
  let withConcat: string;
  try {
    withConcat = insertConcatenationOperators(regex);
  } catch (e) {
    return {
      success: false,
      error: {
        message: `Failed to process concatenation: ${e instanceof Error ? e.message : String(e)}`,
        stage: 'concatenation',
      },
    };
  }

  // Stage 3: Convert to postfix
  let postfix: string;
  try {
    postfix = infixToPostfix(withConcat);
  } catch (e) {
    return {
      success: false,
      error: {
        message: `Failed to convert to postfix: ${e instanceof Error ? e.message : String(e)}`,
        stage: 'postfix',
      },
    };
  }

  // Stage 4: Build AST
  let ast: RegexNode;
  try {
    ast = postfixToAst(postfix);
  } catch (e) {
    return {
      success: false,
      error: {
        message: `Failed to build syntax tree: ${e instanceof Error ? e.message : String(e)}`,
        stage: 'ast',
      },
    };
  }

  return {
    success: true,
    result: {
      raw: regex,
      withConcat,
      postfix,
      ast,
    },
  };
}
