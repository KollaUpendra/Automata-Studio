/**
 * Automata Studio — Unified Type Definitions
 */

export type { RegexNode } from '../engine/parser/ast';
export type { NFA, NFAState, NFATransition } from '../engine/nfa/types';
export type { DFA, DFAState, DFATransition } from '../engine/dfa/types';
export type { ConversionResult, ConversionStep } from '../engine/pipeline';
export type { ValidationResult } from '../engine/validation/validateRegex';
export type { CytoscapeElement, CytoscapeNode, CytoscapeEdge } from '../adapters/cytoscapeAdapter';
export type { ActiveTab, AutomataState, AutomataActions } from '../hooks/useAutomata';

export interface StateInfo {
  id: string;
  label: string;
  isStart: boolean;
  isAccepting: boolean;
  nfaStates: string;
  transitions: Array<{ symbol: string; target: string }>;
}

export type RightPanelView = 'graph' | 'table' | 'steps' | 'simulator';
