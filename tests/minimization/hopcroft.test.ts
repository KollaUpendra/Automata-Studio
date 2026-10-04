import { describe, it, expect } from 'vitest';
import { minimizeDfa } from '../../src/engine/minimization/hopcroft';
import { nfaToDfa } from '../../src/engine/dfa/subsetConstruction';
import { thompsonConstruct } from '../../src/engine/nfa/thompson';
import { parseRegex } from '../../src/engine/parser/parser';
import { simulateDFA, validateDFA } from '../../src/engine/dfa/dfaUtils';

function buildMinDFA(regex: string) {
  const result = parseRegex(regex);
  if (!result.success) throw new Error(result.error.message);
  const nfa = thompsonConstruct(result.result.ast);
  const dfa = nfaToDfa(nfa);
  return { dfa, minDfa: minimizeDfa(dfa) };
}

describe('DFA Minimization (Hopcroft)', () => {
  describe('structural correctness', () => {
    it('produces a valid DFA for "a"', () => {
      const { minDfa } = buildMinDFA('a');
      expect(validateDFA(minDfa)).toEqual([]);
    });

    it('produces a valid DFA for "(a|b)*abb"', () => {
      const { minDfa } = buildMinDFA('(a|b)*abb');
      expect(validateDFA(minDfa)).toEqual([]);
    });

    it('produces a valid DFA for "a*"', () => {
      const { minDfa } = buildMinDFA('a*');
      expect(validateDFA(minDfa)).toEqual([]);
    });

    it('has start state m0', () => {
      const { minDfa } = buildMinDFA('a');
      expect(minDfa.startState).toBe('m0');
    });
  });

  describe('state reduction', () => {
    it('minimized DFA has <= states than original DFA', () => {
      const { dfa, minDfa } = buildMinDFA('(a|b)*abb');
      expect(minDfa.states.length).toBeLessThanOrEqual(dfa.states.length);
    });

    it('already-minimal DFA does not increase state count', () => {
      // "a" DFA should be minimal: 2 states (start, accepting)
      const { dfa, minDfa } = buildMinDFA('a');
      expect(minDfa.states.length).toBeLessThanOrEqual(dfa.states.length);
    });
  });

  describe('language equivalence', () => {
    // Test that minimized DFA accepts the same strings as the original DFA
    function testEquivalent(regex: string, testStrings: string[]) {
      const result = parseRegex(regex);
      if (!result.success) throw new Error(result.error.message);
      const nfa = thompsonConstruct(result.result.ast);
      const dfa = nfaToDfa(nfa);
      const minDfa = minimizeDfa(dfa);

      for (const str of testStrings) {
        const originalResult = simulateDFA(dfa, str);
        const minResult = simulateDFA(minDfa, str);
        expect(minResult).toBe(originalResult);
      }
    }

    it('"a" is language equivalent after minimization', () => {
      testEquivalent('a', ['', 'a', 'b', 'aa', 'ab']);
    });

    it('"a|b" is language equivalent after minimization', () => {
      testEquivalent('a|b', ['', 'a', 'b', 'ab', 'aa']);
    });

    it('"a*" is language equivalent after minimization', () => {
      testEquivalent('a*', ['', 'a', 'aa', 'aaa', 'b']);
    });

    it('"(a|b)*abb" is language equivalent after minimization', () => {
      testEquivalent('(a|b)*abb', ['', 'abb', 'aabb', 'babb', 'abababb', 'ab', 'aba', 'b']);
    });

    it('"ab" is language equivalent after minimization', () => {
      testEquivalent('ab', ['', 'a', 'ab', 'abc', 'b']);
    });

    it('"(a|b)*" is language equivalent after minimization', () => {
      testEquivalent('(a|b)*', ['', 'a', 'b', 'ab', 'ababba', 'c']);
    });
  });

  describe('accepting states', () => {
    it('minimized DFA has accepting states', () => {
      const { minDfa } = buildMinDFA('a');
      expect(minDfa.acceptStates.size).toBeGreaterThan(0);
    });

    it('"a*" minimized start state is accepting', () => {
      const { minDfa } = buildMinDFA('a*');
      expect(minDfa.acceptStates.has(minDfa.startState)).toBe(true);
    });
  });
});
