/**
 * Hopcroft's Algorithm for DFA Minimization
 *
 * Minimizes a DFA by merging equivalent (indistinguishable) states.
 *
 * Algorithm overview:
 * 1. Remove unreachable states.
 * 2. Initialize partitions: {accepting states} and {non-accepting states}.
 * 3. Repeatedly refine partitions:
 *    - For each partition P and each symbol a:
 *      - Split P into states whose transition on 'a' lands in the same partition
 *        vs. those that land in a different partition (or have no transition).
 * 4. Merge states within the same partition.
 * 5. Rebuild the DFA with canonical state IDs (m0, m1, ...).
 */

import type { DFA, DFAState, DFATransition } from '../dfa/types';
import { reachableStates } from '../dfa/dfaUtils';

// ---------------------------------------------------------------------------
// Partition refinement helpers
// ---------------------------------------------------------------------------

/**
 * Returns the partition index that contains the given state ID.
 * Returns -1 if the state is not found (e.g., dead state / missing transition).
 */
function findPartition(partitions: ReadonlyArray<ReadonlySet<string>>, stateId: string): number {
  for (let i = 0; i < partitions.length; i++) {
    if (partitions[i].has(stateId)) return i;
  }
  return -1;
}

/**
 * Splits a partition based on where each state transitions to on a given symbol.
 * States that go to the same partition are kept together; others are split.
 *
 * @param partition  - The partition (set of state IDs) to split
 * @param symbol     - The alphabet symbol to test
 * @param transMap   - Map from (from, symbol) → to
 * @param partitions - Current list of all partitions
 * @returns An array of sub-partitions (splits of the original partition)
 */
function splitPartition(
  partition: ReadonlySet<string>,
  symbol: string,
  transMap: Map<string, Map<string, string>>,
  partitions: ReadonlyArray<ReadonlySet<string>>,
): Array<Set<string>> {
  // Group states by the partition index of their target state
  const groups = new Map<number, Set<string>>();

  for (const stateId of partition) {
    const targetId = transMap.get(stateId)?.get(symbol);
    const targetPartition = targetId !== undefined ? findPartition(partitions, targetId) : -1; // No transition (dead / omitted)

    if (!groups.has(targetPartition)) {
      groups.set(targetPartition, new Set());
    }
    groups.get(targetPartition)!.add(stateId);
  }

  return [...groups.values()];
}

// ---------------------------------------------------------------------------
// Main minimization function
// ---------------------------------------------------------------------------

/**
 * Minimizes a DFA using Hopcroft's Algorithm.
 *
 * The minimized DFA:
 * - Has no unreachable states
 * - Has no equivalent (indistinguishable) states merged
 * - Uses canonical state IDs: m0, m1, m2, ... (m = minimized)
 * - Preserves the original language exactly
 *
 * @param dfa - The input DFA to minimize
 * @returns   A new, equivalent, minimized DFA
 */
export function minimizeDfa(dfa: DFA): DFA {
  // Step 1: Remove unreachable states
  const reachable = reachableStates(dfa);
  const reachableStateList = dfa.states.filter((s) => reachable.has(s.id));
  const reachableTransitions = dfa.transitions.filter(
    (t) => reachable.has(t.from) && reachable.has(t.to),
  );

  // Build transition map for quick lookup
  const transMap = new Map<string, Map<string, string>>();
  for (const state of reachableStateList) {
    transMap.set(state.id, new Map());
  }
  for (const t of reachableTransitions) {
    transMap.get(t.from)?.set(t.symbol, t.to);
  }

  const alphabet = [...dfa.alphabet].sort();

  // Step 2: Initialize partitions
  const accepting = new Set<string>();
  const nonAccepting = new Set<string>();

  for (const state of reachableStateList) {
    if (state.isAccepting) {
      accepting.add(state.id);
    } else {
      nonAccepting.add(state.id);
    }
  }

  let partitions: Array<Set<string>> = [];
  if (accepting.size > 0) partitions.push(accepting);
  if (nonAccepting.size > 0) partitions.push(nonAccepting);

  // Edge case: all states accepting or none
  if (partitions.length === 0) {
    partitions = [new Set(reachableStateList.map((s) => s.id))];
  }

  // Step 3: Refine partitions using Hopcroft's algorithm
  let changed = true;
  while (changed) {
    changed = false;
    const newPartitions: Array<Set<string>> = [];

    for (const partition of partitions) {
      // Try to split this partition on each symbol
      let currentSplits: Array<Set<string>> = [new Set(partition)];

      for (const symbol of alphabet) {
        const nextSplits: Array<Set<string>> = [];
        for (const part of currentSplits) {
          const splits = splitPartition(part, symbol, transMap, partitions);
          nextSplits.push(...splits);
        }
        if (nextSplits.length !== currentSplits.length) {
          changed = true;
        }
        currentSplits = nextSplits;
      }

      newPartitions.push(...currentSplits);
    }

    if (newPartitions.length !== partitions.length) {
      changed = true;
    }
    partitions = newPartitions;
  }

  // Step 4: Build the minimized DFA
  // Assign canonical IDs to each partition, with the start partition getting m0
  const startPartitionIndex = partitions.findIndex((p) => p.has(dfa.startState));

  // Reorder so start partition is first
  if (startPartitionIndex > 0) {
    const tmp = partitions[0];
    partitions[0] = partitions[startPartitionIndex];
    partitions[startPartitionIndex] = tmp;
  }

  // Map each original state to its new minimized state ID
  const stateToMinId = new Map<string, string>();
  for (let i = 0; i < partitions.length; i++) {
    for (const stateId of partitions[i]) {
      stateToMinId.set(stateId, `m${i}`);
    }
  }

  // Build minimized DFA states
  const minStateMap = new Map<string, DFAState>();
  for (let i = 0; i < partitions.length; i++) {
    const partition = partitions[i];
    const minId = `m${i}`;

    // Pick a representative state from the partition
    const representative = [...partition][0];
    const originalState = reachableStateList.find((s) => s.id === representative)!;

    // Determine if accepting: any state in partition is accepting
    const isAccepting = [...partition].some((id) => dfa.acceptStates.has(id));
    const isStart = partition.has(dfa.startState);

    // Preserve NFA states from all merged states (union)
    const mergedNfaStates = new Set<number>();
    for (const id of partition) {
      const original = reachableStateList.find((s) => s.id === id);
      if (original) {
        for (const ns of original.nfaStates) {
          mergedNfaStates.add(ns);
        }
      }
    }

    minStateMap.set(minId, {
      id: minId,
      nfaStates: mergedNfaStates,
      isStart,
      isAccepting,
    });

    void originalState; // referenced for clarity, not strictly needed
  }

  // Build minimized transitions (deduplicated)
  const minTransitionSet = new Set<string>();
  const minTransitions: DFATransition[] = [];

  for (const t of reachableTransitions) {
    const fromMin = stateToMinId.get(t.from);
    const toMin = stateToMinId.get(t.to);
    if (fromMin === undefined || toMin === undefined) continue;

    const key = `${fromMin}:${t.symbol}:${toMin}`;
    if (!minTransitionSet.has(key)) {
      minTransitionSet.add(key);
      minTransitions.push({ from: fromMin, to: toMin, symbol: t.symbol });
    }
  }

  // Build accept states set for minimized DFA
  const minAcceptStates = new Set<string>();
  for (const [id, state] of minStateMap) {
    if (state.isAccepting) {
      minAcceptStates.add(id);
    }
  }

  // Sort states for stable output
  const minStateList = [...minStateMap.values()].sort((a, b) => {
    const aNum = parseInt(a.id.slice(1));
    const bNum = parseInt(b.id.slice(1));
    return aNum - bNum;
  });

  return {
    states: minStateList,
    transitions: minTransitions,
    startState: `m0`,
    acceptStates: minAcceptStates,
    alphabet: dfa.alphabet,
  };
}
