/**
 * Cytoscape.js adapter.
 *
 * Converts DFA or NFA data structures to Cytoscape-compatible elements
 * (nodes and edges) for visualization.
 */

import type { DFA } from '../engine/dfa/types';
import type { NFA } from '../engine/nfa/types';

// ---------------------------------------------------------------------------
// Cytoscape element types
// ---------------------------------------------------------------------------

export interface CytoscapeNodeData {
  id: string;
  label: string;
  isStart: boolean;
  isAccepting: boolean;
  /** For NFA nodes, a stringified list of state IDs */
  nfaStates?: string;
}

export interface CytoscapeEdgeData {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface CytoscapeNode {
  data: CytoscapeNodeData;
  classes?: string;
}

export interface CytoscapeEdge {
  data: CytoscapeEdgeData;
}

export type CytoscapeElement = CytoscapeNode | CytoscapeEdge;

// ---------------------------------------------------------------------------
// DFA → Cytoscape
// ---------------------------------------------------------------------------

/**
 * Converts a DFA to Cytoscape-compatible nodes and edges.
 *
 * - Multiple symbols on the same (from, to) pair are merged into a single edge
 *   with a comma-separated label, e.g. "a,b".
 * - Start states get the class "start".
 * - Accepting states get the class "accepting".
 * - Start + accepting states get both classes.
 *
 * @param dfa - The DFA to convert
 * @returns An array of Cytoscape element objects
 */
export function dfaToCytoscapeElements(dfa: DFA): CytoscapeElement[] {
  const elements: CytoscapeElement[] = [];

  // Nodes
  for (const state of dfa.states) {
    const classes: string[] = [];
    if (state.isStart) classes.push('start');
    if (state.isAccepting) classes.push('accepting');

    const nfaStatesStr =
      state.nfaStates.size > 0 ? `{${[...state.nfaStates].sort((a, b) => a - b).join(', ')}}` : '';

    elements.push({
      data: {
        id: state.id,
        label: state.id,
        isStart: state.isStart,
        isAccepting: state.isAccepting,
        nfaStates: nfaStatesStr,
      },
      classes: classes.join(' '),
    });
  }

  // Edges — merge multiple symbols on the same (from, to) pair
  const edgeMap = new Map<string, string[]>();

  for (const transition of dfa.transitions) {
    const key = `${transition.from}→${transition.to}`;
    if (!edgeMap.has(key)) {
      edgeMap.set(key, []);
    }
    edgeMap.get(key)!.push(transition.symbol);
  }

  for (const [key, symbols] of edgeMap) {
    const [source, target] = key.split('→');
    const sortedSymbols = [...symbols].sort();
    const label = sortedSymbols.join(', ');
    const edgeId = `${source}-${target}-${sortedSymbols.join('-')}`;

    elements.push({
      data: {
        id: edgeId,
        source,
        target,
        label,
      },
    });
  }

  return elements;
}

// ---------------------------------------------------------------------------
// NFA → Cytoscape
// ---------------------------------------------------------------------------

/**
 * Converts an NFA to Cytoscape-compatible nodes and edges.
 *
 * - ε-transitions are labeled "ε".
 * - Multiple transitions on the same (from, to, symbol) are deduplicated.
 *
 * @param nfa - The NFA to convert
 * @returns An array of Cytoscape element objects
 */
export function nfaToCytoscapeElements(nfa: NFA): CytoscapeElement[] {
  const elements: CytoscapeElement[] = [];

  // Nodes
  for (const state of nfa.states) {
    const isStart = state.id === nfa.startState;
    const isAccepting = nfa.acceptStates.has(state.id);
    const classes: string[] = [];
    if (isStart) classes.push('start');
    if (isAccepting) classes.push('accepting');

    elements.push({
      data: {
        id: String(state.id),
        label: `s${state.id}`,
        isStart,
        isAccepting,
      },
      classes: classes.join(' '),
    });
  }

  // Edges — merge same (from, to) pairs with different symbols
  const edgeMap = new Map<string, string[]>();

  for (const transition of nfa.transitions) {
    const fromStr = String(transition.from);
    const toStr = String(transition.to);
    const symbol = transition.symbol === null ? 'ε' : transition.symbol;
    const key = `${fromStr}→${toStr}`;

    if (!edgeMap.has(key)) {
      edgeMap.set(key, []);
    }
    const symbols = edgeMap.get(key)!;
    if (!symbols.includes(symbol)) {
      symbols.push(symbol);
    }
  }

  for (const [key, symbols] of edgeMap) {
    const [source, target] = key.split('→');
    const sortedSymbols = [...symbols].sort((a, b) => {
      // ε sorts first
      if (a === 'ε') return -1;
      if (b === 'ε') return 1;
      return a.localeCompare(b);
    });
    const label = sortedSymbols.join(', ');
    const edgeId = `nfa-${source}-${target}-${sortedSymbols.join('-')}`;

    elements.push({
      data: {
        id: edgeId,
        source,
        target,
        label,
      },
    });
  }

  return elements;
}
