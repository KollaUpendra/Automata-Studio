import { describe, it, expect } from 'vitest';
import { insertConcatenationOperators } from '../../src/engine/parser/concatenate';

describe('insertConcatenationOperators', () => {
  it('inserts between two literals', () => {
    expect(insertConcatenationOperators('ab')).toBe('a.b');
  });

  it('inserts between literal and open paren', () => {
    expect(insertConcatenationOperators('a(b|c)')).toBe('a.(b|c)');
  });

  it('inserts between close paren and literal', () => {
    expect(insertConcatenationOperators('(a|b)c')).toBe('(a|b).c');
  });

  it('inserts between close paren and open paren', () => {
    expect(insertConcatenationOperators('(a)(b)')).toBe('(a).(b)');
  });

  it('inserts between star and literal', () => {
    expect(insertConcatenationOperators('a*b')).toBe('a*.b');
  });

  it('inserts between star and open paren', () => {
    expect(insertConcatenationOperators('a*(b)')).toBe('a*.(b)');
  });

  it('handles three-character literal', () => {
    expect(insertConcatenationOperators('abc')).toBe('a.b.c');
  });

  it('does not insert before )', () => {
    expect(insertConcatenationOperators('(ab)')).toBe('(a.b)');
  });

  it('does not insert after (', () => {
    expect(insertConcatenationOperators('(a)')).toBe('(a)');
  });

  it('does not insert before |', () => {
    expect(insertConcatenationOperators('a|b')).toBe('a|b');
  });

  it('does not insert after |', () => {
    expect(insertConcatenationOperators('a|b')).toBe('a|b');
  });

  it('handles a*bc correctly', () => {
    expect(insertConcatenationOperators('a*bc')).toBe('a*.b.c');
  });

  it('handles (a|b)*abb', () => {
    expect(insertConcatenationOperators('(a|b)*abb')).toBe('(a|b)*.a.b.b');
  });

  it('handles single character', () => {
    expect(insertConcatenationOperators('a')).toBe('a');
  });

  it('handles empty string', () => {
    expect(insertConcatenationOperators('')).toBe('');
  });

  it('handles star alone', () => {
    expect(insertConcatenationOperators('a*')).toBe('a*');
  });
});
