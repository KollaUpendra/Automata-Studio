/**
 * Complete Regex → Automata conversion pipeline.
 *
 * Orchestrates the full transformation:
 *   regex → validation → concatenation → postfix → AST → NFA → DFA → minimized DFA
 */

import { validateRegex, type ValidationResult } from './validation/validateRegex';
import { parseRegex } from './parser/parser';
import { thompsonConstruct } from './nfa/thompson';
import { nfaToDfa } from './dfa/subsetConstruction';
import { minimizeDfaWithTrace, type MinimizationTrace } from './minimization/hopcroft';
import type { RegexNode } from './parser/ast';
import type { NFA } from './nfa/types';
import type { DFA } from './dfa/types';

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface ConversionStep {
  name: string;
  description: string;
  detail: string;
}

export interface ConversionSuccess {
  readonly success: true;
  readonly regex: string;
  readonly withConcat: string;
  readonly postfix: string;
  readonly ast: RegexNode;
  readonly nfa: NFA;
  readonly dfa: DFA;
  readonly minimizedDfa: DFA;
  /** Partition-refinement history and equivalence classes from minimization */
  readonly minimization: MinimizationTrace;
  readonly steps: ConversionStep[];
  readonly errors: [];
}

export interface ConversionFailure {
  readonly success: false;
  readonly regex: string;
  readonly errors: string[];
  readonly validationResult?: ValidationResult;
}

export type ConversionResult = ConversionSuccess | ConversionFailure;

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

/**
 * Converts a raw regular expression through the full automata pipeline.
 *
 * Returns either a successful result with all intermediate representations,
 * or a failure with human-readable error messages.
 *
 * @param regex - The raw regular expression string entered by the user
 * @returns A `ConversionResult` containing success or failure details
 */
export function convertRegexToAutomata(regex: string): ConversionResult {
  const trimmed = regex.trim();

  // Step 1: Validation
  const validation = validateRegex(trimmed);
  if (!validation.valid) {
    return {
      success: false,
      regex: trimmed,
      errors: validation.errors.map((e) => e.message),
      validationResult: validation,
    };
  }

  // Steps 2-4: Parse (concat insertion + postfix + AST)
  const parseOutcome = parseRegex(trimmed);
  if (!parseOutcome.success) {
    return {
      success: false,
      regex: trimmed,
      errors: [parseOutcome.error.message],
    };
  }

  const { withConcat, postfix, ast } = parseOutcome.result;

  // Step 5: Thompson's Construction (Regex AST → NFA)
  let nfa: NFA;
  try {
    nfa = thompsonConstruct(ast);
  } catch (e) {
    return {
      success: false,
      regex: trimmed,
      errors: [`Thompson's construction failed: ${e instanceof Error ? e.message : String(e)}`],
    };
  }

  // Step 6: Subset Construction (NFA → DFA)
  let dfa: DFA;
  try {
    dfa = nfaToDfa(nfa);
  } catch (e) {
    return {
      success: false,
      regex: trimmed,
      errors: [`Subset construction failed: ${e instanceof Error ? e.message : String(e)}`],
    };
  }

  // Step 7: DFA Minimization (Hopcroft's Algorithm)
  let minimization: MinimizationTrace;
  try {
    minimization = minimizeDfaWithTrace(dfa);
  } catch (e) {
    return {
      success: false,
      regex: trimmed,
      errors: [`DFA minimization failed: ${e instanceof Error ? e.message : String(e)}`],
    };
  }

  const minimizedDfa = minimization.dfa;

  // Build educational steps
  const steps: ConversionStep[] = [
    {
      name: 'Validation',
      description: 'The regular expression was validated.',
      detail: `"${trimmed}" passed all validation checks. No invalid characters, mismatched parentheses, or dangling operators were found.`,
    },
    {
      name: 'Explicit Concatenation',
      description: 'Concatenation operators were made explicit.',
      detail: `Implicit concatenation was converted to explicit form: "${trimmed}" → "${withConcat}"`,
    },
    {
      name: 'Postfix Conversion',
      description: 'The expression was converted to postfix (RPN) notation.',
      detail: `Using the Shunting-yard algorithm: "${withConcat}" → "${postfix}"`,
    },
    {
      name: 'AST Construction',
      description: 'An Abstract Syntax Tree was built from the postfix expression.',
      detail: `The postfix expression was parsed into a tree structure with ${countNodes(ast)} nodes.`,
    },
    {
      name: "Thompson's Construction",
      description: 'The AST was converted to an NFA.',
      detail: `Thompson's construction produced an NFA with ${nfa.states.length} states and ${nfa.transitions.length} transitions (including ε-transitions).`,
    },
    {
      name: 'Subset Construction',
      description: 'The NFA was converted to a DFA.',
      detail: `The powerset construction (subset construction) algorithm produced a DFA with ${dfa.states.length} states and ${dfa.transitions.length} transitions.`,
    },
    {
      name: 'DFA Minimization',
      description: 'Equivalent states were merged.',
      detail: `Partition refinement reduced the DFA from ${dfa.states.length} to ${minimizedDfa.states.length} states in ${minimization.rounds.length - 1} refinement pass${minimization.rounds.length - 1 === 1 ? '' : 'es'}.`,
    },
  ];

  return {
    success: true,
    regex: trimmed,
    withConcat,
    postfix,
    ast,
    nfa,
    dfa,
    minimizedDfa,
    minimization,
    steps,
    errors: [],
  };
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function countNodes(node: RegexNode): number {
  switch (node.type) {
    case 'literal':
      return 1;
    case 'star':
      return 1 + countNodes(node.child);
    case 'concat':
    case 'union':
      return 1 + countNodes(node.left) + countNodes(node.right);
  }
}
