import { describe, expect, it } from 'vitest';
import { exportDFAtoJSON, exportNFAtoJSON } from '../../src/utils/export';
import { convertRegexToAutomata } from '../../src/engine/pipeline';

describe('automaton JSON export', () => {
  it('exports the requested DFA shape as serializable JSON', () => {
    const result = convertRegexToAutomata('(a|b)*abb');
    expect(result.success).toBe(true);
    if (!result.success) return;

    const exported = JSON.parse(exportDFAtoJSON(result.minimizedDfa, 'MinimizedDFA')) as {
      type: string;
      startState: string;
      states: unknown[];
      transitions: unknown[];
    };

    expect(exported.type).toBe('MinimizedDFA');
    expect(exported.startState).toBe(result.minimizedDfa.startState);
    expect(exported.states).toHaveLength(result.minimizedDfa.states.length);
    expect(exported.transitions).toHaveLength(result.minimizedDfa.transitions.length);
  });

  it('exports epsilon transitions as null in NFA JSON', () => {
    const result = convertRegexToAutomata('a*');
    expect(result.success).toBe(true);
    if (!result.success) return;

    const exported = JSON.parse(exportNFAtoJSON(result.nfa)) as {
      type: string;
      transitions: Array<{ symbol: string | null }>;
    };

    expect(exported.type).toBe('NFA');
    expect(exported.transitions.some((transition) => transition.symbol === null)).toBe(true);
  });
});
