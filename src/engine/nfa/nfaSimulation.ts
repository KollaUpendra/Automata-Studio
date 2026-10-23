/**
 * NFA simulation — tracks the set of active states while reading input.
 */

import type { NFA } from './types';
import { epsilonClosure, epsilonClosureAfterMove } from './epsilonClosure';

export interface NFASimulationTrace {
  accepted: boolean;
  input: string;
  /** statesVisited[i] is the sorted active state set after reading i symbols. */
  statesVisited: number[][];
  /** Index of the symbol at which the active set became empty, if it did. */
  stuckAt?: number;
}

/**
 * Simulates an NFA on `input`, starting from ε-closure({start}).
 * Stops early when the active set becomes empty.
 */
export function traceNFA(nfa: NFA, input: string): NFASimulationTrace {
  const sorted = (s: ReadonlySet<number>) => [...s].sort((a, b) => a - b);
  let current: Set<number> = epsilonClosure(new Set([nfa.startState]), nfa);
  const statesVisited: number[][] = [sorted(current)];

  for (let i = 0; i < input.length; i++) {
    current = epsilonClosureAfterMove(current, input[i], nfa);
    if (current.size === 0) {
      return { accepted: false, input, statesVisited, stuckAt: i };
    }
    statesVisited.push(sorted(current));
  }

  const accepted = [...current].some((s) => nfa.acceptStates.has(s));
  return { accepted, input, statesVisited };
}
