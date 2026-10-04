/**
 * Regex validation module.
 *
 * Validates a raw regex string before any transformation.
 * Returns structured validation errors rather than throwing.
 */

export interface ValidationError {
  message: string;
  position?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/** Characters allowed as literal symbols */
const VALID_LITERAL_REGEX = /^[a-zA-Z0-9_\-]$/;

/** Set of operator characters */
const BINARY_OPERATORS = new Set(['|', '.']);
const ALL_OPERATORS = new Set(['|', '.', '*']);
const UNARY_OPERATORS = new Set(['*']);

/**
 * Validates a raw regular expression string.
 *
 * Checks for:
 * - Empty expression
 * - Invalid characters
 * - Mismatched parentheses
 * - Consecutive binary operators
 * - Dangling operators at start/end
 * - Invalid use of * (at start, after open paren, after binary operator)
 * - Empty groups ()
 *
 * @param regex - The raw regex string to validate
 * @returns A `ValidationResult` with `valid` flag and list of errors
 */
export function validateRegex(regex: string): ValidationResult {
  const errors: ValidationError[] = [];

  // 1. Empty check
  if (regex.trim().length === 0) {
    return {
      valid: false,
      errors: [{ message: 'Regular expression cannot be empty.' }],
    };
  }

  // 2. Invalid character check
  for (let i = 0; i < regex.length; i++) {
    const ch = regex[i];
    if (!VALID_LITERAL_REGEX.test(ch) && !ALL_OPERATORS.has(ch) && ch !== '(' && ch !== ')') {
      errors.push({
        message: `Invalid character '${ch}' at position ${i + 1}. Only letters, digits, and operators (|, *, parentheses) are supported.`,
        position: i,
      });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // 3. Structural validation
  let parenDepth = 0;
  let prevChar: string | null = null;

  for (let i = 0; i < regex.length; i++) {
    const ch = regex[i];

    // Track parentheses depth
    if (ch === '(') {
      parenDepth++;

      // Check for empty group: ()
      if (i + 1 < regex.length && regex[i + 1] === ')') {
        errors.push({
          message: `Empty group "()" at position ${i + 1}. Groups must contain an expression.`,
          position: i,
        });
      }
    } else if (ch === ')') {
      parenDepth--;
      if (parenDepth < 0) {
        errors.push({
          message: `Unexpected closing parenthesis ")" at position ${i + 1}.`,
          position: i,
        });
        parenDepth = 0; // Reset to continue checking
      }
    }

    // Validate * usage
    if (UNARY_OPERATORS.has(ch)) {
      if (prevChar === null) {
        errors.push({
          message: `Operator "*" at position ${i + 1} has no preceding operand.`,
          position: i,
        });
      } else if (prevChar === '(') {
        errors.push({
          message: `Operator "*" at position ${i + 1} cannot follow an opening parenthesis.`,
          position: i,
        });
      } else if (BINARY_OPERATORS.has(prevChar)) {
        errors.push({
          message: `Operator "*" at position ${i + 1} cannot follow the binary operator "${prevChar}".`,
          position: i,
        });
      }
    }

    // Validate binary operators (|)
    if (BINARY_OPERATORS.has(ch)) {
      if (prevChar === null) {
        errors.push({
          message: `Operator "${ch}" at position ${i + 1} is missing a left operand.`,
          position: i,
        });
      } else if (prevChar === '(') {
        errors.push({
          message: `Operator "${ch}" at position ${i + 1} cannot be the first expression in a group.`,
          position: i,
        });
      } else if (BINARY_OPERATORS.has(prevChar)) {
        errors.push({
          message: `Consecutive operators "${prevChar}${ch}" at position ${i + 1}. Only one operator can appear between operands.`,
          position: i,
        });
      }

      // Check for dangling operator at end
      if (i === regex.length - 1) {
        errors.push({
          message: `Operator "${ch}" at position ${i + 1} is missing a right operand.`,
          position: i,
        });
      }

      // Check what comes after
      if (i + 1 < regex.length && regex[i + 1] === ')') {
        errors.push({
          message: `Operator "${ch}" at position ${i + 1} is missing a right operand before ")".`,
          position: i,
        });
      }
    }

    prevChar = ch;
  }

  // 4. Unclosed parentheses
  if (parenDepth > 0) {
    errors.push({
      message: `Missing ${parenDepth} closing parenthesis${parenDepth > 1 ? 'es' : ''} in the expression.`,
    });
  }

  // 5. Dangling operator at the very end
  if (prevChar !== null && BINARY_OPERATORS.has(prevChar)) {
    // This case is handled in the loop above, but we double-check
    const lastChar = regex[regex.length - 1];
    if (BINARY_OPERATORS.has(lastChar)) {
      const alreadyReported = errors.some((e) => e.position === regex.length - 1);
      if (!alreadyReported) {
        errors.push({
          message: `Operator "${lastChar}" at the end of the expression is missing a right operand.`,
          position: regex.length - 1,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
