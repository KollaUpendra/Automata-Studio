import { describe, it, expect } from 'vitest';
import { convertRegexToAutomata } from '../../src/engine/pipeline';
import { simulateDFA } from '../../src/engine/dfa/dfaUtils';

describe('Integration: Full Pipeline', () => {
  const requiredRegexes = [
    'a',
    'ab',
    'a|b',
    'a*',
    '(a|b)*',
    'ab*',
    'a(b|c)',
    '(a|b)c',
    '(a|b)*abb',
    '((a|b)*abb)',
  ];

  for (const regex of requiredRegexes) {
    it(`pipeline succeeds for "${regex}"`, () => {
      const result = convertRegexToAutomata(regex);
      expect(result.success).toBe(true);
    });
  }

  it('returns postfix for "a|b"', () => {
    const result = convertRegexToAutomata('a|b');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.postfix).toBe('ab|');
    }
  });

  it('returns postfix for "ab"', () => {
    const result = convertRegexToAutomata('ab');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.postfix).toBe('ab.');
    }
  });

  it('returns postfix for "(a|b)*"', () => {
    const result = convertRegexToAutomata('(a|b)*');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.postfix).toBe('ab|*');
    }
  });

  it('NFA has correct number of states for "a"', () => {
    const result = convertRegexToAutomata('a');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.nfa.states.length).toBe(2);
    }
  });

  it('DFA is deterministic', () => {
    const result = convertRegexToAutomata('(a|b)*abb');
    expect(result.success).toBe(true);
    if (result.success) {
      const seen = new Set<string>();
      for (const t of result.dfa.transitions) {
        const key = `${t.from}:${t.symbol}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }
  });

  it('minimized DFA accepts same language as DFA', () => {
    const testCases: Array<[string, string[]]> = [
      ['(a|b)*abb', ['abb', 'aabb', 'babb', '', 'ab', 'aba']],
      ['a*', ['', 'a', 'aaa', 'b']],
      ['a|b', ['a', 'b', 'ab', '']],
    ];

    for (const [regex, tests] of testCases) {
      const result = convertRegexToAutomata(regex);
      expect(result.success).toBe(true);
      if (result.success) {
        for (const input of tests) {
          const dfaResult = simulateDFA(result.dfa, input);
          const minResult = simulateDFA(result.minimizedDfa, input);
          expect(minResult).toBe(dfaResult);
        }
      }
    }
  });

  it('returns errors for invalid regex', () => {
    const result = convertRegexToAutomata('a|');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('returns errors for empty regex', () => {
    const result = convertRegexToAutomata('');
    expect(result.success).toBe(false);
  });

  it('provides educational steps on success', () => {
    const result = convertRegexToAutomata('a|b');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.steps[0].name).toBe('Validation');
    }
  });
});
