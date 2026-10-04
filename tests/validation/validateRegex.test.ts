import { describe, it, expect } from 'vitest';
import { validateRegex } from '../../src/engine/validation/validateRegex';

describe('validateRegex', () => {
  // Valid cases
  describe('valid expressions', () => {
    it('accepts single literal', () => {
      expect(validateRegex('a').valid).toBe(true);
    });

    it('accepts two literals (implicit concat)', () => {
      expect(validateRegex('ab').valid).toBe(true);
    });

    it('accepts union', () => {
      expect(validateRegex('a|b').valid).toBe(true);
    });

    it('accepts Kleene star', () => {
      expect(validateRegex('a*').valid).toBe(true);
    });

    it('accepts parenthesized expression', () => {
      expect(validateRegex('(a|b)').valid).toBe(true);
    });

    it('accepts complex expression', () => {
      expect(validateRegex('(a|b)*abb').valid).toBe(true);
    });

    it('accepts nested parens', () => {
      expect(validateRegex('((a|b)*)').valid).toBe(true);
    });

    it('accepts digits', () => {
      expect(validateRegex('01').valid).toBe(true);
    });
  });

  // Invalid cases
  describe('empty expression', () => {
    it('rejects empty string', () => {
      const result = validateRegex('');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects whitespace-only string', () => {
      const result = validateRegex('   ');
      expect(result.valid).toBe(false);
    });
  });

  describe('invalid characters', () => {
    it('rejects dollar sign', () => {
      expect(validateRegex('a$b').valid).toBe(false);
    });

    it('rejects spaces inside', () => {
      expect(validateRegex('a b').valid).toBe(false);
    });
  });

  describe('mismatched parentheses', () => {
    it('rejects unclosed paren', () => {
      expect(validateRegex('(a|b').valid).toBe(false);
    });

    it('rejects unexpected closing paren', () => {
      expect(validateRegex('a|b)').valid).toBe(false);
    });
  });

  describe('invalid operator usage', () => {
    it('rejects dangling | at end', () => {
      expect(validateRegex('a|').valid).toBe(false);
    });

    it('rejects | at start', () => {
      expect(validateRegex('|a').valid).toBe(false);
    });

    it('rejects consecutive ||', () => {
      expect(validateRegex('a||b').valid).toBe(false);
    });

    it('rejects * at start', () => {
      expect(validateRegex('*a').valid).toBe(false);
    });

    it('rejects * after (', () => {
      expect(validateRegex('(*a)').valid).toBe(false);
    });

    it('rejects * after |', () => {
      expect(validateRegex('a|*b').valid).toBe(false);
    });
  });

  describe('empty groups', () => {
    it('rejects empty parentheses ()', () => {
      expect(validateRegex('()').valid).toBe(false);
    });

    it('rejects empty group in expression', () => {
      expect(validateRegex('a()b').valid).toBe(false);
    });
  });

  describe('error messages', () => {
    it('gives a meaningful message for dangling |', () => {
      const result = validateRegex('a|');
      expect(result.errors[0].message).toContain('operand');
    });

    it('gives a meaningful message for *a', () => {
      const result = validateRegex('*a');
      expect(result.errors[0].message).toContain('*');
    });
  });
});
