/**
 * Thompson's Construction Algorithm
 *
 * Converts a RegexNode AST into an NFA using Thompson's construction.
 *
 * Each sub-expression produces a "fragment" with:
 *   - A start state
 *   - A single accept state
 *   - A set of transitions
 *
 * The constructions are:
 *
 * LITERAL (symbol 'a'):
 *   s0 --a--> s1
 *
 * CONCATENATION (A.B):
 *   A_accept --ε--> B_start
 *   Result: A_start ... A_accept --ε--> B_start ... B_accept
 *
 * UNION (A|B):
 *   new_start --ε--> A_start
 *   new_start --ε--> B_start
 *   A_accept --ε--> new_accept
 *   B_accept --ε--> new_accept
 *
 * KLEENE STAR (A*):
 *   new_start --ε--> A_start
 *   new_start --ε--> new_accept   (accept empty string)
 *   A_accept --ε--> A_start       (loop back)
 *   A_accept --ε--> new_accept    (exit loop)
 */

import type { RegexNode } from '../parser/ast';
import type { NFA, NFAState, NFATransition } from './types';

// ---------------------------------------------------------------------------
// Internal fragment type used during construction
// ---------------------------------------------------------------------------

interface NFAFragment {
  start: number;
  accept: number;
  states: NFAState[];
  transitions: NFATransition[];
}

// ---------------------------------------------------------------------------
// State ID counter (module-level, reset per construction)
// ---------------------------------------------------------------------------

let stateCounter = 0;

function nextId(): number {
  return stateCounter++;
}

function newState(): NFAState {
  return { id: nextId() };
}

function epsilonTransition(from: number, to: number): NFATransition {
  return { from, to, symbol: null };
}

function symbolTransition(from: number, to: number, symbol: string): NFATransition {
  return { from, to, symbol };
}

// ---------------------------------------------------------------------------
// Thompson construction helpers
// ---------------------------------------------------------------------------

function buildLiteral(value: string): NFAFragment {
  const s0 = newState();
  const s1 = newState();
  return {
    start: s0.id,
    accept: s1.id,
    states: [s0, s1],
    transitions: [symbolTransition(s0.id, s1.id, value)],
  };
}

function buildConcat(left: NFAFragment, right: NFAFragment): NFAFragment {
  // Connect left accept -> right start via ε
  const connectTransition = epsilonTransition(left.accept, right.start);
  return {
    start: left.start,
    accept: right.accept,
    states: [...left.states, ...right.states],
    transitions: [...left.transitions, connectTransition, ...right.transitions],
  };
}

function buildUnion(left: NFAFragment, right: NFAFragment): NFAFragment {
  const newStart = newState();
  const newAccept = newState();

  return {
    start: newStart.id,
    accept: newAccept.id,
    states: [newStart, ...left.states, ...right.states, newAccept],
    transitions: [
      // ε from new start to both sub-NFAs
      epsilonTransition(newStart.id, left.start),
      epsilonTransition(newStart.id, right.start),
      ...left.transitions,
      ...right.transitions,
      // ε from both sub-NFA accepts to new accept
      epsilonTransition(left.accept, newAccept.id),
      epsilonTransition(right.accept, newAccept.id),
    ],
  };
}

function buildStar(inner: NFAFragment): NFAFragment {
  const newStart = newState();
  const newAccept = newState();

  return {
    start: newStart.id,
    accept: newAccept.id,
    states: [newStart, ...inner.states, newAccept],
    transitions: [
      // ε: new start -> inner start (enter loop)
      epsilonTransition(newStart.id, inner.start),
      // ε: new start -> new accept (skip entire expression)
      epsilonTransition(newStart.id, newAccept.id),
      ...inner.transitions,
      // ε: inner accept -> inner start (loop back)
      epsilonTransition(inner.accept, inner.start),
      // ε: inner accept -> new accept (exit loop)
      epsilonTransition(inner.accept, newAccept.id),
    ],
  };
}

// ---------------------------------------------------------------------------
// Recursive AST → NFA Fragment builder
// ---------------------------------------------------------------------------

function buildFragment(node: RegexNode): NFAFragment {
  switch (node.type) {
    case 'literal':
      return buildLiteral(node.value);

    case 'concat':
      return buildConcat(buildFragment(node.left), buildFragment(node.right));

    case 'union':
      return buildUnion(buildFragment(node.left), buildFragment(node.right));

    case 'star':
      return buildStar(buildFragment(node.child));
  }
}

// ---------------------------------------------------------------------------
// Collect alphabet from transitions
// ---------------------------------------------------------------------------

function collectAlphabet(transitions: ReadonlyArray<NFATransition>): Set<string> {
  const alphabet = new Set<string>();
  for (const t of transitions) {
    if (t.symbol !== null) {
      alphabet.add(t.symbol);
    }
  }
  return alphabet;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Converts a RegexNode AST to an NFA using Thompson's Construction.
 *
 * State IDs are integers starting from 0. Each call to `thompsonConstruct`
 * resets the state counter, so IDs are consistent for a given regex.
 *
 * @param ast - The root AST node from the parser
 * @returns A complete NFA
 */
export function thompsonConstruct(ast: RegexNode): NFA {
  // Reset state counter for consistent IDs
  stateCounter = 0;

  const fragment = buildFragment(ast);

  return {
    states: fragment.states,
    transitions: fragment.transitions,
    startState: fragment.start,
    acceptStates: new Set([fragment.accept]),
    alphabet: collectAlphabet(fragment.transitions),
  };
}
