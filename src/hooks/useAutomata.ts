/**
 * useAutomata hook — manages the automata computation state.
 */

import { useState, useCallback, useMemo } from 'react';
import { convertRegexToAutomata, type ConversionResult } from '../engine/pipeline';
import { validateRegex } from '../engine/validation/validateRegex';

export type ActiveTab = 'nfa' | 'dfa' | 'minimized';

export interface AutomataState {
  regex: string;
  result: ConversionResult | null;
  activeTab: ActiveTab;
  isLoading: boolean;
  validationMessage: string | null;
  validationIsError: boolean;
}

export interface AutomataActions {
  setRegex: (regex: string) => void;
  convert: () => void;
  reset: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export function useAutomata(): [AutomataState, AutomataActions] {
  const [regex, setRegexState] = useState<string>('(a|b)*abb');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('nfa');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Real-time validation as user types
  const { validationMessage, validationIsError } = useMemo(() => {
    if (regex.trim().length === 0) {
      return { validationMessage: null, validationIsError: false };
    }
    const validation = validateRegex(regex.trim());
    if (!validation.valid) {
      return {
        validationMessage: validation.errors[0]?.message ?? 'Invalid regex',
        validationIsError: true,
      };
    }
    return { validationMessage: 'Valid regular expression', validationIsError: false };
  }, [regex]);

  const setRegex = useCallback((newRegex: string) => {
    setRegexState(newRegex);
  }, []);

  const convert = useCallback(() => {
    if (!regex.trim()) return;
    setIsLoading(true);

    // Use requestAnimationFrame to allow UI to update before computation
    requestAnimationFrame(() => {
      try {
        const conversionResult = convertRegexToAutomata(regex.trim());
        setResult(conversionResult);
        if (conversionResult.success) {
          setActiveTab('nfa');
        }
      } finally {
        setIsLoading(false);
      }
    });
  }, [regex]);

  const reset = useCallback(() => {
    setRegexState('');
    setResult(null);
    setActiveTab('nfa');
  }, []);

  const state: AutomataState = {
    regex,
    result,
    activeTab,
    isLoading,
    validationMessage,
    validationIsError,
  };

  const actions: AutomataActions = {
    setRegex,
    convert,
    reset,
    setActiveTab,
  };

  return [state, actions];
}
