/**
 * NFA type definitions.
 */

export interface NFAState {
  readonly id: number;
}

/** null represents an ε (epsilon) transition */
export interface NFATransition {
  readonly from: number;
  readonly to: number;
  readonly symbol: string | null;
}

export interface NFA {
  readonly states: ReadonlyArray<NFAState>;
  readonly transitions: ReadonlyArray<NFATransition>;
  readonly startState: number;
  readonly acceptStates: ReadonlySet<number>;
  readonly alphabet: ReadonlySet<string>;
}
