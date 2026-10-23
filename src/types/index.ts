/**
 * Automata Studio — Unified Production Type Definitions
 * Formal models for Theory of Computation pipeline and interactive workbench.
 */

import type { RegexNode } from '../engine/parser/ast';
import type { NFA, NFAState, NFATransition } from '../engine/nfa/types';
import type { DFA, DFAState, DFATransition } from '../engine/dfa/types';
import type {
  ConversionResult,
  ConversionSuccess,
  ConversionFailure,
  ConversionStep,
} from '../engine/pipeline';
import type { ValidationResult } from '../engine/validation/validateRegex';
import type { CytoscapeElement, CytoscapeNode, CytoscapeEdge } from '../adapters/cytoscapeAdapter';
import type {
  ActiveTab,
  AutomataState as HookAutomataState,
  AutomataActions,
} from '../hooks/useAutomata';
import type { DFASimulationTrace } from '../engine/dfa/dfaUtils';

// Re-export core engine representations
export type { RegexNode };
export type { NFA, NFAState, NFATransition };
export type { DFA, DFAState, DFATransition };
export type { ConversionResult, ConversionSuccess, ConversionFailure, ConversionStep };
export type { ValidationResult };
export type { CytoscapeElement, CytoscapeNode, CytoscapeEdge };
export type { ActiveTab, HookAutomataState, AutomataActions };
export type { DFASimulationTrace };

/**
 * Universal Automaton abstraction covering NFAs and DFAs
 */
export type AutomatonType = 'nfa' | 'dfa' | 'minimized';

export interface Transition {
  readonly from: string;
  readonly to: string;
  readonly symbol: string | null; // null denotes ε (epsilon) transition
}

export interface GenericState {
  readonly id: string;
  readonly label: string;
  readonly isStart: boolean;
  readonly isAccepting: boolean;
  readonly nfaStates?: ReadonlySet<number>;
}

export interface Automaton {
  readonly type: AutomatonType;
  readonly states: ReadonlyArray<GenericState>;
  readonly transitions: ReadonlyArray<Transition>;
  readonly startState: string;
  readonly acceptStates: ReadonlySet<string>;
  readonly alphabet: ReadonlySet<string>;
}

export interface StateInfo {
  id: string;
  label: string;
  isStart: boolean;
  isAccepting: boolean;
  nfaStates: string;
  /** Outgoing transitions; `target` is the target state's display label. */
  transitions: Array<{ symbol: string; target: string }>;
}

export type RightPanelView = 'table' | 'simulator' | 'steps';

export interface SimulationStep {
  stepIndex: number;
  fromState: string;
  symbol: string;
  toState: string;
  isAccepted: boolean;
}
