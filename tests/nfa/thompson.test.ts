import { describe, it, expect } from 'vitest';
import { thompsonConstruct } from '../../src/engine/nfa/thompson';
import { parseRegex } from '../../src/engine/parser/parser';
import { validateNFA } from '../../src/engine/nfa/nfaUtils';

function buildNFA(regex: string) {
  const result = parseRegex(regex);
  if (!result.success) throw new Error(result.error.message);
  return thompsonConstruct(result.result.ast);
}

describe("Thompson's Construction", () => {
  describe('literal', () => {
    it('creates 2 states for single literal', () => {
      const nfa = buildNFA('a');
      expect(nfa.states.length).toBe(2);
    });

    it('has exactly 1 transition for literal', () => {
      const nfa = buildNFA('a');
      expect(nfa.transitions.length).toBe(1);
      expect(nfa.transitions[0].symbol).toBe('a');
    });

    it('has 1 accept state', () => {
      const nfa = buildNFA('a');
      expect(nfa.acceptStates.size).toBe(1);
    });

    it('start state is different from accept state', () => {
      const nfa = buildNFA('a');
      expect(nfa.startState).not.toBe([...nfa.acceptStates][0]);
    });

    it('has correct alphabet', () => {
      const nfa = buildNFA('a');
      expect(nfa.alphabet.has('a')).toBe(true);
    });
  });

  describe('concatenation (ab)', () => {
    it('creates 4 states', () => {
      const nfa = buildNFA('ab');
      expect(nfa.states.length).toBe(4);
    });

    it('has epsilon transition connecting the two sub-NFAs', () => {
      const nfa = buildNFA('ab');
      const epsilons = nfa.transitions.filter((t) => t.symbol === null);
      expect(epsilons.length).toBeGreaterThan(0);
    });

    it('has both a and b in alphabet', () => {
      const nfa = buildNFA('ab');
      expect(nfa.alphabet.has('a')).toBe(true);
      expect(nfa.alphabet.has('b')).toBe(true);
    });
  });

  describe('union (a|b)', () => {
    it('creates 6 states (2 for a + 2 for b + 2 new)', () => {
      const nfa = buildNFA('a|b');
      expect(nfa.states.length).toBe(6);
    });

    it('has 4 epsilon transitions', () => {
      const nfa = buildNFA('a|b');
      const epsilons = nfa.transitions.filter((t) => t.symbol === null);
      expect(epsilons.length).toBe(4);
    });

    it('has exactly 1 accept state', () => {
      const nfa = buildNFA('a|b');
      expect(nfa.acceptStates.size).toBe(1);
    });
  });

  describe('Kleene star (a*)', () => {
    it('creates 4 states (2 for a + 2 new)', () => {
      const nfa = buildNFA('a*');
      expect(nfa.states.length).toBe(4);
    });

    it('has epsilon transition allowing empty string', () => {
      // The start state should have an epsilon to accept
      const nfa = buildNFA('a*');
      const startEpsilons = nfa.transitions.filter(
        (t) => t.from === nfa.startState && t.symbol === null,
      );
      expect(startEpsilons.length).toBeGreaterThanOrEqual(1);
    });

    it('has exactly 1 accept state', () => {
      const nfa = buildNFA('a*');
      expect(nfa.acceptStates.size).toBe(1);
    });
  });

  describe('complex expressions', () => {
    it('builds valid NFA for (a|b)*', () => {
      const nfa = buildNFA('(a|b)*');
      const issues = validateNFA(nfa);
      expect(issues).toEqual([]);
    });

    it('builds valid NFA for a(b|c)*', () => {
      const nfa = buildNFA('a(b|c)*');
      const issues = validateNFA(nfa);
      expect(issues).toEqual([]);
    });

    it('builds valid NFA for (a|b)*abb', () => {
      const nfa = buildNFA('(a|b)*abb');
      const issues = validateNFA(nfa);
      expect(issues).toEqual([]);
    });

    it('builds valid NFA for ab*', () => {
      const nfa = buildNFA('ab*');
      const issues = validateNFA(nfa);
      expect(issues).toEqual([]);
    });
  });

  describe('NFA correctness via epsilon transitions', () => {
    it('all transition endpoints are valid state IDs', () => {
      const nfa = buildNFA('(a|b)*abb');
      const stateIds = new Set(nfa.states.map((s) => s.id));
      for (const t of nfa.transitions) {
        expect(stateIds.has(t.from)).toBe(true);
        expect(stateIds.has(t.to)).toBe(true);
      }
    });
  });
});
