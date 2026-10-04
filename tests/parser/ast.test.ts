import { describe, it, expect } from 'vitest';
import { postfixToAst, astToString } from '../../src/engine/parser/ast';

describe('postfixToAst', () => {
  it('builds AST for single literal', () => {
    const ast = postfixToAst('a');
    expect(ast.type).toBe('literal');
    if (ast.type === 'literal') {
      expect(ast.value).toBe('a');
    }
  });

  it('builds AST for concatenation', () => {
    const ast = postfixToAst('ab.');
    expect(ast.type).toBe('concat');
    if (ast.type === 'concat') {
      expect(ast.left.type).toBe('literal');
      expect(ast.right.type).toBe('literal');
    }
  });

  it('builds AST for union', () => {
    const ast = postfixToAst('ab|');
    expect(ast.type).toBe('union');
  });

  it('builds AST for Kleene star', () => {
    const ast = postfixToAst('a*');
    expect(ast.type).toBe('star');
    if (ast.type === 'star') {
      expect(ast.child.type).toBe('literal');
    }
  });

  it('builds nested AST: (a|b)*', () => {
    const ast = postfixToAst('ab|*');
    expect(ast.type).toBe('star');
    if (ast.type === 'star') {
      expect(ast.child.type).toBe('union');
    }
  });

  it('builds complex AST: a.(b|c)', () => {
    const ast = postfixToAst('abc|.');
    expect(ast.type).toBe('concat');
    if (ast.type === 'concat') {
      expect(ast.left.type).toBe('literal');
      expect(ast.right.type).toBe('union');
    }
  });

  it('throws on empty postfix', () => {
    expect(() => postfixToAst('')).toThrow();
  });

  it('throws on too many operands', () => {
    expect(() => postfixToAst('ab')).toThrow();
  });

  it('throws on missing operands for concat', () => {
    expect(() => postfixToAst('a.')).toThrow();
  });

  it('throws on missing operands for union', () => {
    expect(() => postfixToAst('a|')).toThrow();
  });

  it('throws on star with no operand', () => {
    expect(() => postfixToAst('*')).toThrow();
  });
});

describe('astToString', () => {
  it('converts literal to string', () => {
    expect(astToString(postfixToAst('a'))).toBe('a');
  });

  it('converts concat to string', () => {
    expect(astToString(postfixToAst('ab.'))).toBe('(a.b)');
  });

  it('converts union to string', () => {
    expect(astToString(postfixToAst('ab|'))).toBe('(a|b)');
  });

  it('converts star to string', () => {
    expect(astToString(postfixToAst('a*'))).toBe('(a)*');
  });
});
