import { describe, it, expect } from 'vitest';
import { nfaToDfa } from '../../src/engine/dfa/subsetConstruction';
import { thompsonConstruct } from '../../src/engine/nfa/thompson';
import { parseRegex } from '../../src/engine/parser/parser';
import { validateDFA, simulateDFA, traceDFA } from '../../src/engine/dfa/dfaUtils';

function buildDFA(regex: string) {
  const result = parseRegex(regex);
  if (!result.success) throw new Error(result.error.message);
  const nfa = thompsonConstruct(result.result.ast);
  return nfaToDfa(nfa);
}

describe('Subset Construction (NFA → DFA)', () => {
  describe('structural correctness', () => {
    it('produces a valid DFA for "a"', () => {
      const dfa = buildDFA('a');
      expect(validateDFA(dfa)).toEqual([]);
    });

    it('produces a valid DFA for "a|b"', () => {
      const dfa = buildDFA('a|b');
      expect(validateDFA(dfa)).toEqual([]);
    });

    it('produces a valid DFA for "a*"', () => {
      const dfa = buildDFA('a*');
      expect(validateDFA(dfa)).toEqual([]);
    });

    it('produces a valid DFA for "(a|b)*abb"', () => {
      const dfa = buildDFA('(a|b)*abb');
      expect(validateDFA(dfa)).toEqual([]);
    });

    it('start state is q0', () => {
      const dfa = buildDFA('a');
      expect(dfa.startState).toBe('q0');
    });

    it('has deterministic transitions', () => {
      const dfa = buildDFA('a|b');
      const seen = new Set<string>();
      for (const t of dfa.transitions) {
        const key = `${t.from}:${t.symbol}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    });
  });

  describe('accepting states', () => {
    it('"a*" DFA start state is accepting (accepts empty string)', () => {
      const dfa = buildDFA('a*');
      expect(dfa.acceptStates.has(dfa.startState)).toBe(true);
    });

    it('"a" DFA start state is NOT accepting', () => {
      const dfa = buildDFA('a');
      expect(dfa.acceptStates.has(dfa.startState)).toBe(false);
    });

    it('has at least one accepting state for every regex', () => {
      const regexes = ['a', 'a|b', 'a*', 'ab', '(a|b)*'];
      for (const regex of regexes) {
        const dfa = buildDFA(regex);
        expect(dfa.acceptStates.size).toBeGreaterThan(0);
      }
    });
  });

  describe('language simulation', () => {
    it('"a" accepts "a"', () => {
      expect(simulateDFA(buildDFA('a'), 'a')).toBe(true);
    });

    it('"a" rejects ""', () => {
      expect(simulateDFA(buildDFA('a'), '')).toBe(false);
    });

    it('"a" rejects "b"', () => {
      expect(simulateDFA(buildDFA('a'), 'b')).toBe(false);
    });

    it('"a|b" accepts "a"', () => {
      expect(simulateDFA(buildDFA('a|b'), 'a')).toBe(true);
    });

    it('"a|b" accepts "b"', () => {
      expect(simulateDFA(buildDFA('a|b'), 'b')).toBe(true);
    });

    it('"a|b" rejects "ab"', () => {
      expect(simulateDFA(buildDFA('a|b'), 'ab')).toBe(false);
    });

    it('"a*" accepts ""', () => {
      expect(simulateDFA(buildDFA('a*'), '')).toBe(true);
    });

    it('"a*" accepts "aaa"', () => {
      expect(simulateDFA(buildDFA('a*'), 'aaa')).toBe(true);
    });

    it('"a*" rejects "b"', () => {
      expect(simulateDFA(buildDFA('a*'), 'b')).toBe(false);
    });

    it('"ab" accepts "ab"', () => {
      expect(simulateDFA(buildDFA('ab'), 'ab')).toBe(true);
    });

    it('"ab" rejects "a"', () => {
      expect(simulateDFA(buildDFA('ab'), 'a')).toBe(false);
    });

    it('"(a|b)*" accepts ""', () => {
      expect(simulateDFA(buildDFA('(a|b)*'), '')).toBe(true);
    });

    it('"(a|b)*" accepts "ababba"', () => {
      expect(simulateDFA(buildDFA('(a|b)*'), 'ababba')).toBe(true);
    });

    it('"(a|b)*abb" accepts "abb"', () => {
      expect(simulateDFA(buildDFA('(a|b)*abb'), 'abb')).toBe(true);
    });

    it('"(a|b)*abb" accepts "aabb"', () => {
      expect(simulateDFA(buildDFA('(a|b)*abb'), 'aabb')).toBe(true);
    });

    it('"(a|b)*abb" accepts "babb"', () => {
      expect(simulateDFA(buildDFA('(a|b)*abb'), 'babb')).toBe(true);
    });

    it('"(a|b)*abb" rejects "ab"', () => {
      expect(simulateDFA(buildDFA('(a|b)*abb'), 'ab')).toBe(false);
    });

    it('"(a|b)*abb" rejects "aba"', () => {
      expect(simulateDFA(buildDFA('(a|b)*abb'), 'aba')).toBe(false);
    });
  });

  describe('traceDFA simulation', () => {
    it('traces accepted string through states', () => {
      const dfa = buildDFA('(a|b)*abb');
      const trace = traceDFA(dfa, 'abb');
      expect(trace.accepted).toBe(true);
      expect(trace.statesVisited.length).toBe(4);
      expect(trace.path.length).toBe(3);
      expect(trace.path[0].symbol).toBe('a');
      expect(trace.path[1].symbol).toBe('b');
      expect(trace.path[2].symbol).toBe('b');
    });

    it('traces rejected string and provides failure reason', () => {
      const dfa = buildDFA('(a|b)*abb');
      const trace = traceDFA(dfa, 'ab');
      expect(trace.accepted).toBe(false);
      expect(trace.failureReason).toBeDefined();
    });

    it('handles unexpected symbol not in alphabet', () => {
      const dfa = buildDFA('ab');
      const trace = traceDFA(dfa, 'ac');
      expect(trace.accepted).toBe(false);
      expect(trace.failureReason).toContain('No transition');
    });
  });
});
