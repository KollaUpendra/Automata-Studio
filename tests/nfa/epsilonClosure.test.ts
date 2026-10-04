import { describe, it, expect } from 'vitest';
import { epsilonClosure, epsilonClosureAfterMove } from '../../src/engine/nfa/epsilonClosure';
import { thompsonConstruct } from '../../src/engine/nfa/thompson';
import { parseRegex } from '../../src/engine/parser/parser';

function buildNFA(regex: string) {
  const result = parseRegex(regex);
  if (!result.success) throw new Error(result.error.message);
  return thompsonConstruct(result.result.ast);
}

describe('epsilonClosure', () => {
  it('returns the state itself when no epsilon transitions', () => {
    const nfa = buildNFA('a');
    // The accept state of "a" NFA has no outgoing epsilon transitions
    // (it's the end). Start state's epsilon closure should at least contain itself.
    const closure = epsilonClosure(new Set([nfa.startState]), nfa);
    expect(closure.has(nfa.startState)).toBe(true);
  });

  it('follows epsilon transitions', () => {
    // For (a|b), the start state has epsilon transitions to both sub-NFAs
    const nfa = buildNFA('a|b');
    const closure = epsilonClosure(new Set([nfa.startState]), nfa);
    // closure should include more than just the start state
    expect(closure.size).toBeGreaterThan(1);
  });

  it('computes closure transitively', () => {
    // For a*, the start has epsilon to inner start, which has epsilon to accept
    const nfa = buildNFA('a*');
    const closure = epsilonClosure(new Set([nfa.startState]), nfa);
    // Should include the accept state (reachable via epsilon)
    const hasAccept = [...nfa.acceptStates].some((id) => closure.has(id));
    expect(hasAccept).toBe(true);
  });

  it('returns empty set for empty input set', () => {
    const nfa = buildNFA('a');
    const closure = epsilonClosure(new Set(), nfa);
    expect(closure.size).toBe(0);
  });
});

describe('epsilonClosureAfterMove', () => {
  it('computes move then epsilon closure', () => {
    const nfa = buildNFA('a');
    // From start state, consuming 'a' should reach the accept state
    const result = epsilonClosureAfterMove(new Set([nfa.startState]), 'a', nfa);
    const acceptId = [...nfa.acceptStates][0];
    expect(result.has(acceptId)).toBe(true);
  });

  it('returns empty set when no transition on symbol', () => {
    const nfa = buildNFA('a');
    const result = epsilonClosureAfterMove(new Set([nfa.startState]), 'b', nfa);
    expect(result.size).toBe(0);
  });
});
