import { describe, it, expect } from 'vitest';
import { infixToPostfix } from '../../src/engine/parser/infixToPostfix';

describe('infixToPostfix (Shunting-yard)', () => {
  it('converts single literal', () => {
    expect(infixToPostfix('a')).toBe('a');
  });

  it('converts concatenation', () => {
    expect(infixToPostfix('a.b')).toBe('ab.');
  });

  it('converts union', () => {
    expect(infixToPostfix('a|b')).toBe('ab|');
  });

  it('converts Kleene star', () => {
    expect(infixToPostfix('a*')).toBe('a*');
  });

  it('handles precedence: star binds tighter than concat', () => {
    // a.b* → a b* → postfix: ab*.
    expect(infixToPostfix('a.b*')).toBe('ab*.');
  });

  it('handles precedence: concat binds tighter than union', () => {
    // a.b|c → (a.b)|c → postfix: ab.c|
    expect(infixToPostfix('a.b|c')).toBe('ab.c|');
  });

  it('handles parentheses overriding precedence', () => {
    // a.(b|c) → postfix: abc|.
    expect(infixToPostfix('a.(b|c)')).toBe('abc|.');
  });

  it('handles (a|b)*', () => {
    expect(infixToPostfix('(a|b)*')).toBe('ab|*');
  });

  it('handles (a|b)*.a.b.b (left-associative concat)', () => {
    // (a|b)*.a.b.b with left-assoc:
    // Step 1: (a|b)* . a = (ab|*).(a) → ab|*a.
    // Step 2: (ab|*a.) . b → ab|*a.b.
    // Step 3: (ab|*a.b.) . b → ab|*a.b.b.
    expect(infixToPostfix('(a|b)*.a.b.b')).toBe('ab|*a.b.b.');
  });

  it('handles triple concatenation', () => {
    expect(infixToPostfix('a.b.c')).toBe('ab.c.');
  });

  it('left-associativity: a.b.c is (a.b).c', () => {
    // postfix: a b . c .
    expect(infixToPostfix('a.b.c')).toBe('ab.c.');
  });

  it('left-associativity of union: a|b|c is (a|b)|c', () => {
    expect(infixToPostfix('a|b|c')).toBe('ab|c|');
  });

  it('throws on mismatched closing paren', () => {
    expect(() => infixToPostfix('a.b)')).toThrow();
  });

  it('throws on mismatched opening paren', () => {
    expect(() => infixToPostfix('(a.b')).toThrow();
  });

  it('complex: a.(b|c)*', () => {
    // with explicit concat: a.(b|c)*
    // postfix: a bc|* .
    expect(infixToPostfix('a.(b|c)*')).toBe('abc|*.');
  });
});
