/**
 * useAutomata hook — manages the automata computation state.
 */

import { useState, useCallback, useMemo } from 'react';
import { convertRegexToAutomata, type ConversionResult } from '../engine/pipeline';
import { validateRegex } from '../engine/validation/validateRegex';

export type ActiveTab = 'nfa' | 'dfa' | 'minimized';

export const DEFAULT_REGEX = '(a|b)*abb';

export interface AutomataState {
  regex: string;
  result: ConversionResult | null;
  activeTab: ActiveTab;
  isLoading: boolean;
  validationMessage: string | null;
  validationIsError: boolean;
  /** Character position (0-based) of the first validation error, when known. */
  errorPosition: number | null;
  /** True when the input differs from the expression that was last built. */
  isStale: boolean;
}

export interface AutomataActions {
  setRegex: (regex: string) => void;
  /** Builds the automata. Pass `regexOverride` to build a value that was just set (e.g. a preset). */
  convert: (regexOverride?: string) => void;
  reset: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export function useAutomata(): [AutomataState, AutomataActions] {
  const [regex, setRegex] = useState<string>(DEFAULT_REGEX);
  // Build the default expression synchronously so the first paint already has a graph.
  const [result, setResult] = useState<ConversionResult | null>(() =>
    convertRegexToAutomata(DEFAULT_REGEX),
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('nfa');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Real-time validation as the user types
  const { validationMessage, validationIsError, errorPosition } = useMemo(() => {
    const trimmed = regex.trim();
    if (trimmed.length === 0) {
      return { validationMessage: null, validationIsError: false, errorPosition: null };
    }
    const validation = validateRegex(trimmed);
    if (!validation.valid) {
      const first = validation.errors[0];
      return {
        validationMessage: first?.message ?? 'This expression is not valid.',
        validationIsError: true,
        errorPosition: first?.position ?? null,
      };
    }
    return { validationMessage: null, validationIsError: false, errorPosition: null };
  }, [regex]);

  const convert = useCallback(
    (regexOverride?: string) => {
      const source = (regexOverride ?? regex).trim();
      if (!source) return;
      setIsLoading(true);

      // Let the UI paint the loading state before the (synchronous) computation.
      requestAnimationFrame(() => {
        try {
          setResult(convertRegexToAutomata(source));
        } finally {
          setIsLoading(false);
        }
      });
    },
    [regex],
  );

  const reset = useCallback(() => {
    setRegex('');
    setResult(null);
    setActiveTab('nfa');
  }, []);

  const isStale = Boolean(result && result.regex !== regex.trim());

  const state: AutomataState = {
    regex,
    result,
    activeTab,
    isLoading,
    validationMessage,
    validationIsError,
    errorPosition,
    isStale,
  };

  const actions = useMemo<AutomataActions>(
    () => ({ setRegex, convert, reset, setActiveTab }),
    [convert, reset],
  );

  return [state, actions];
}
