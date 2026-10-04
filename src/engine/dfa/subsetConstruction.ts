/**
 * Subset Construction Algorithm (NFA → DFA)
 *
 * Converts an NFA to an equivalent DFA using the subset construction
 * (also known as the powerset construction) algorithm.
 *
 * Algorithm:
 * 1. Start with the ε-closure of the NFA's start state.
 * 2. For each unprocessed DFA state (a set of NFA states):
 *    a. For each symbol in the alphabet:
 *       - Compute move(current, symbol) followed by ε-closure.
 *       - This gives the target DFA state.
 *    b. If the target is new, add it to the worklist.
 * 3. A DFA state is accepting if it contains any NFA accepting state.
 * 4. Name DFA states as q0, q1, q2, ... in BFS discovery order.
 */

import type { NFA } from '../nfa/types';
import type { DFA, DFAState, DFATransition } from './types';
import { epsilonClosure, epsilonClosureAfterMove } from '../nfa/epsilonClosure';
import { setKey, hasAcceptingState } from '../nfa/nfaUtils';

/**
 * Converts an NFA to an equivalent DFA using the subset construction algorithm.
 *
 * @param nfa - The input NFA (typically from Thompson's construction)
 * @returns   An equivalent DFA with deterministic transitions
 */
export function nfaToDfa(nfa: NFA): DFA {
  const alphabet = [...nfa.alphabet].sort(); // Sorted for determinism

  // Map from set-key → DFA state ID (q0, q1, ...)
  const keyToId = new Map<string, string>();
  // Map from DFA state ID → NFA state set
  const stateMap = new Map<string, Set<number>>();
  const dfaStates: DFAState[] = [];
  const dfaTransitions: DFATransition[] = [];

  let stateCounter = 0;

  function getOrCreateState(nfaStateSet: Set<number>): string {
    const key = setKey(nfaStateSet);
    if (keyToId.has(key)) {
      return keyToId.get(key)!;
    }
    const id = `q${stateCounter++}`;
    keyToId.set(key, id);
    stateMap.set(id, nfaStateSet);
    return id;
  }

  // Step 1: Compute the start state (ε-closure of the NFA's start state)
  const startNfaStates = epsilonClosure(new Set([nfa.startState]), nfa);
  const startId = getOrCreateState(startNfaStates);

  const dfaAcceptStates = new Set<string>();
  const worklist: string[] = [startId];
  const processed = new Set<string>();

  // Step 2: BFS over DFA states
  while (worklist.length > 0) {
    const currentId = worklist.shift()!;
    if (processed.has(currentId)) continue;
    processed.add(currentId);

    const currentNfaStates = stateMap.get(currentId)!;

    // Determine if this DFA state is accepting
    const isAccepting = hasAcceptingState(currentNfaStates, nfa.acceptStates);
    const isStart = currentId === startId;

    dfaStates.push({
      id: currentId,
      nfaStates: new Set(currentNfaStates),
      isStart,
      isAccepting,
    });

    if (isAccepting) {
      dfaAcceptStates.add(currentId);
    }

    // Process each symbol in the alphabet
    for (const symbol of alphabet) {
      const targetNfaStates = epsilonClosureAfterMove(currentNfaStates, symbol, nfa);

      if (targetNfaStates.size === 0) {
        // Dead state — no transition (we omit dead/trap states for clarity)
        continue;
      }

      const targetId = getOrCreateState(targetNfaStates);

      dfaTransitions.push({
        from: currentId,
        to: targetId,
        symbol,
      });

      if (!processed.has(targetId)) {
        worklist.push(targetId);
      }
    }
  }

  // Sort states for stable output: q0, q1, q2, ...
  dfaStates.sort((a, b) => {
    const aNum = parseInt(a.id.slice(1));
    const bNum = parseInt(b.id.slice(1));
    return aNum - bNum;
  });

  return {
    states: dfaStates,
    transitions: dfaTransitions,
    startState: startId,
    acceptStates: dfaAcceptStates,
    alphabet: nfa.alphabet,
  };
}
