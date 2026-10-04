/**
 * DFA utility functions.
 */

import type { DFA, DFATransition } from './types';

/**
 * Builds a nested map: from → symbol → to (for fast DFA lookup).
 */
export function buildDFATransitionMap(dfa: DFA): Map<string, Map<string, string>> {
  const map = new Map<string, Map<string, string>>();
  for (const state of dfa.states) {
    map.set(state.id, new Map());
  }
  for (const t of dfa.transitions) {
    const inner = map.get(t.from);
    if (inner) {
      inner.set(t.symbol, t.to);
    }
  }
  return map;
}

/**
 * Simulates the DFA on an input string.
 *
 * @param dfa   - The DFA to simulate
 * @param input - The input string to test
 * @returns true if the DFA accepts the input, false otherwise
 */
export function simulateDFA(dfa: DFA, input: string): boolean {
  const transMap = buildDFATransitionMap(dfa);
  let current = dfa.startState;

  for (const symbol of input) {
    const nextMap = transMap.get(current);
    if (!nextMap) return false;
    const next = nextMap.get(symbol);
    if (!next) return false;
    current = next;
  }

  return dfa.acceptStates.has(current);
}

export interface DFASimulationTrace {
  accepted: boolean;
  input: string;
  path: Array<{ from: string; symbol: string; to: string }>;
  statesVisited: string[];
  finalState: string;
  failureReason?: string;
}

/**
 * Traces the execution of a DFA on an input string, step-by-step.
 */
export function traceDFA(dfa: DFA, input: string): DFASimulationTrace {
  const transMap = buildDFATransitionMap(dfa);
  let current = dfa.startState;
  const statesVisited: string[] = [current];
  const path: Array<{ from: string; symbol: string; to: string }> = [];

  for (let i = 0; i < input.length; i++) {
    const symbol = input[i];
    const nextMap = transMap.get(current);
    if (!nextMap) {
      return {
        accepted: false,
        input,
        path,
        statesVisited,
        finalState: current,
        failureReason: `State "${current}" has no outgoing transitions. Dead end at index ${i} on '${symbol}'.`,
      };
    }
    const next = nextMap.get(symbol);
    if (!next) {
      return {
        accepted: false,
        input,
        path,
        statesVisited,
        finalState: current,
        failureReason: `No transition from state "${current}" on symbol '${symbol}' (index ${i}). String rejected.`,
      };
    }
    path.push({ from: current, symbol, to: next });
    current = next;
    statesVisited.push(current);
  }

  const isAccepting = dfa.acceptStates.has(current);
  return {
    accepted: isAccepting,
    input,
    path,
    statesVisited,
    finalState: current,
    failureReason: isAccepting
      ? undefined
      : `String processing halted at state "${current}", which is not an accepting state.`,
  };
}

/**
 * Returns all states reachable from the start state.
 * (Used to detect and remove unreachable states before minimization.)
 */
export function reachableStates(dfa: DFA): Set<string> {
  const reachable = new Set<string>([dfa.startState]);
  const worklist = [dfa.startState];

  const transMap = buildDFATransitionMap(dfa);

  while (worklist.length > 0) {
    const current = worklist.pop()!;
    const targets = transMap.get(current);
    if (!targets) continue;
    for (const target of targets.values()) {
      if (!reachable.has(target)) {
        reachable.add(target);
        worklist.push(target);
      }
    }
  }

  return reachable;
}

/**
 * Validates a DFA for structural correctness.
 * Returns a list of issues (empty = valid).
 */
export function validateDFA(dfa: DFA): string[] {
  const issues: string[] = [];
  const stateIds = new Set(dfa.states.map((s) => s.id));

  if (!stateIds.has(dfa.startState)) {
    issues.push(`Start state "${dfa.startState}" is not in states.`);
  }

  for (const acceptState of dfa.acceptStates) {
    if (!stateIds.has(acceptState)) {
      issues.push(`Accept state "${acceptState}" is not in states.`);
    }
  }

  // Check determinism: no two transitions from the same state with the same symbol
  const seen = new Set<string>();
  for (const t of dfa.transitions) {
    const key = `${t.from}:${t.symbol}`;
    if (seen.has(key)) {
      issues.push(
        `Non-deterministic transition: state "${t.from}" has multiple transitions on symbol "${t.symbol}".`,
      );
    }
    seen.add(key);

    if (!stateIds.has(t.from)) {
      issues.push(`Transition from unknown state "${t.from}".`);
    }
    if (!stateIds.has(t.to)) {
      issues.push(`Transition to unknown state "${t.to}".`);
    }
  }

  return issues;
}

/**
 * Returns the outgoing transitions from a given DFA state, grouped by symbol.
 */
export function getOutgoingTransitions(
  stateId: string,
  transitions: ReadonlyArray<DFATransition>,
): DFATransition[] {
  return transitions.filter((t) => t.from === stateId);
}
