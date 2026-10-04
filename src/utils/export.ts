/**
 * Export utilities for PNG and JSON export.
 */

import type cytoscape from 'cytoscape';
import type { DFA } from '../engine/dfa/types';
import type { NFA } from '../engine/nfa/types';

// ---------------------------------------------------------------------------
// JSON Export
// ---------------------------------------------------------------------------

interface ExportedDFA {
  type: 'DFA' | 'MinimizedDFA';
  startState: string;
  acceptStates: string[];
  states: Array<{
    id: string;
    isStart: boolean;
    isAccepting: boolean;
    nfaStates: number[];
  }>;
  transitions: Array<{
    from: string;
    to: string;
    symbol: string;
  }>;
  alphabet: string[];
}

interface ExportedNFA {
  type: 'NFA';
  startState: number;
  acceptStates: number[];
  states: Array<{ id: number }>;
  transitions: Array<{
    from: number;
    to: number;
    symbol: string | null;
  }>;
  alphabet: string[];
}

export function exportDFAtoJSON(dfa: DFA, type: 'DFA' | 'MinimizedDFA'): string {
  const data: ExportedDFA = {
    type,
    startState: dfa.startState,
    acceptStates: [...dfa.acceptStates],
    states: dfa.states.map((s) => ({
      id: s.id,
      isStart: s.isStart,
      isAccepting: s.isAccepting,
      nfaStates: [...s.nfaStates].sort((a, b) => a - b),
    })),
    transitions: dfa.transitions.map((t) => ({
      from: t.from,
      to: t.to,
      symbol: t.symbol,
    })),
    alphabet: [...dfa.alphabet].sort(),
  };
  return JSON.stringify(data, null, 2);
}

export function exportNFAtoJSON(nfa: NFA): string {
  const data: ExportedNFA = {
    type: 'NFA',
    startState: nfa.startState,
    acceptStates: [...nfa.acceptStates],
    states: nfa.states.map((s) => ({ id: s.id })),
    transitions: nfa.transitions.map((t) => ({
      from: t.from,
      to: t.to,
      symbol: t.symbol,
    })),
    alphabet: [...nfa.alphabet].sort(),
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Triggers a file download in the browser.
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports a Cytoscape graph as PNG.
 * Requires a reference to the cytoscape core instance.
 */
export function exportGraphAsPNG(
  cy: cytoscape.Core | null,
  filename: string = 'automata.png',
): void {
  if (!cy) return;
  const png = cy.png({ output: 'blob', bg: '#0f1117', full: true, scale: 2 });
  const url = URL.createObjectURL(png);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
