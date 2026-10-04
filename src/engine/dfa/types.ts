/**
 * DFA type definitions.
 */

export interface DFAState {
  readonly id: string;
  /** The set of NFA state IDs this DFA state represents (from subset construction) */
  readonly nfaStates: ReadonlySet<number>;
  readonly isStart: boolean;
  readonly isAccepting: boolean;
}

export interface DFATransition {
  readonly from: string;
  readonly to: string;
  readonly symbol: string;
}

export interface DFA {
  readonly states: ReadonlyArray<DFAState>;
  readonly transitions: ReadonlyArray<DFATransition>;
  readonly startState: string;
  readonly acceptStates: ReadonlySet<string>;
  readonly alphabet: ReadonlySet<string>;
}
