/**
 * Epsilon-closure computation for NFA subset construction.
 *
 * The ε-closure of a set of states S is the set of all states reachable
 * from any state in S via zero or more ε-transitions.
 */

import type { NFA } from './types';

/**
 * Computes the ε-closure of a set of NFA states.
 *
 * Uses BFS/DFS to follow all ε-transitions reachable from any state
 * in the given set.
 *
 * @param states - The initial set of NFA state IDs
 * @param nfa    - The NFA containing the transition function
 * @returns      The ε-closure: a set of all reachable states via ε-transitions
 */
export function epsilonClosure(states: ReadonlySet<number>, nfa: NFA): Set<number> {
  const closure = new Set<number>(states);
  const worklist: number[] = [...states];

  // Build an index for fast lookup: state -> epsilon targets
  // (computed once per closure call — acceptable for our NFA sizes)
  while (worklist.length > 0) {
    const current = worklist.pop()!;
    for (const transition of nfa.transitions) {
      if (transition.from === current && transition.symbol === null) {
        if (!closure.has(transition.to)) {
          closure.add(transition.to);
          worklist.push(transition.to);
        }
      }
    }
  }

  return closure;
}

/**
 * Computes the set of states reachable from a given set of NFA states
 * by consuming a single symbol, then taking the ε-closure.
 *
 * This is the "move" operation: move(states, symbol) ∪ ε-closure
 *
 * @param states - The current set of NFA state IDs
 * @param symbol - The input symbol to consume
 * @param nfa    - The NFA
 * @returns      The new set of NFA states after consuming the symbol
 */
export function epsilonClosureAfterMove(
  states: ReadonlySet<number>,
  symbol: string,
  nfa: NFA,
): Set<number> {
  // Move: all states reachable by consuming `symbol` from `states`
  const moved = new Set<number>();
  for (const stateId of states) {
    for (const transition of nfa.transitions) {
      if (transition.from === stateId && transition.symbol === symbol) {
        moved.add(transition.to);
      }
    }
  }

  // Then take ε-closure of the moved set
  if (moved.size === 0) return moved;
  return epsilonClosure(moved, nfa);
}
