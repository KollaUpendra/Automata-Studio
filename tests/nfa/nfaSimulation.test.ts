import { describe, it, expect } from 'vitest';
import { convertRegexToAutomata } from '../../src/engine/pipeline';
import { traceNFA } from '../../src/engine/nfa/nfaSimulation';
import { simulateDFA } from '../../src/engine/dfa/dfaUtils';

describe('NFA simulation', () => {
  const inputs = ['', 'a', 'b', 'ab', 'abb', 'aabb', 'babb', 'abba', 'c', 'abbabb'];

  for (const regex of ['(a|b)*abb', 'a*', 'a(b|c)', 'ab*', '(a|b)c']) {
    it(`agrees with the DFA for "${regex}"`, () => {
      const result = convertRegexToAutomata(regex);
      if (!result.success) throw new Error('conversion failed');
      for (const input of inputs) {
        expect(traceNFA(result.nfa, input).accepted).toBe(simulateDFA(result.dfa, input));
      }
    });
  }

  it('reports where the active set empties', () => {
    const result = convertRegexToAutomata('ab');
    if (!result.success) throw new Error('conversion failed');
    const trace = traceNFA(result.nfa, 'ac');
    expect(trace.accepted).toBe(false);
    expect(trace.stuckAt).toBe(1);
    expect(trace.statesVisited).toHaveLength(2);
  });
});

describe('minimization trace', () => {
  it('records the initial split and maps every reachable state to a class', () => {
    const result = convertRegexToAutomata('(a|b)*abb');
    if (!result.success) throw new Error('conversion failed');
    const { rounds, classes } = result.minimization;
    expect(rounds[0].length).toBe(2);
    expect(rounds[rounds.length - 1].length).toBe(result.minimizedDfa.states.length);
    const merged = [...classes.values()].flat().sort();
    expect(merged).toEqual(result.dfa.states.map((s) => s.id).sort());
  });
});
