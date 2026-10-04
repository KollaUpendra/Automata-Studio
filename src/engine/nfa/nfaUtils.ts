/**
 * NFA utility functions.
 */

import type { NFA, NFATransition } from './types';

/**
 * Builds a map from state ID to its outgoing transitions.
 * Useful for fast lookups during subset construction.
 */
export function buildTransitionIndex(nfa: NFA): Map<number, NFATransition[]> {
  const index = new Map<number, NFATransition[]>();
  for (const state of nfa.states) {
    index.set(state.id, []);
  }
  for (const t of nfa.transitions) {
    const list = index.get(t.from);
    if (list) {
      list.push(t);
    }
  }
  return index;
}

/**
 * Returns a sorted, comma-separated string key for a set of state IDs.
 * Used to uniquely identify DFA states during subset construction.
 */
export function setKey(states: ReadonlySet<number>): string {
  return [...states].sort((a, b) => a - b).join(',');
}

/**
 * Returns true if any state in `stateSet` is an NFA accepting state.
 */
export function hasAcceptingState(
  stateSet: ReadonlySet<number>,
  acceptStates: ReadonlySet<number>,
): boolean {
  for (const s of stateSet) {
    if (acceptStates.has(s)) return true;
  }
  return false;
}

/**
 * Validates an NFA's structural integrity.
 * Returns a list of issues found (empty = valid).
 */
export function validateNFA(nfa: NFA): string[] {
  const issues: string[] = [];
  const stateIds = new Set(nfa.states.map((s) => s.id));

  if (!stateIds.has(nfa.startState)) {
    issues.push(`Start state ${nfa.startState} is not in states.`);
  }

  for (const acceptState of nfa.acceptStates) {
    if (!stateIds.has(acceptState)) {
      issues.push(`Accept state ${acceptState} is not in states.`);
    }
  }

  for (const t of nfa.transitions) {
    if (!stateIds.has(t.from)) {
      issues.push(`Transition from unknown state ${t.from}.`);
    }
    if (!stateIds.has(t.to)) {
      issues.push(`Transition to unknown state ${t.to}.`);
    }
  }

  return issues;
}
