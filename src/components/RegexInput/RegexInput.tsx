/**
 * RegexInput component — text field, convert/reset buttons, validation.
 */

import { type KeyboardEvent, type ChangeEvent } from 'react';
import { ValidationMessage } from '../ValidationMessage/ValidationMessage';

interface RegexInputProps {
  value: string;
  onChange: (value: string) => void;
  onConvert: () => void;
  onReset: () => void;
  validationMessage: string | null;
  validationIsError: boolean;
  isLoading: boolean;
}

const EXAMPLE_REGEXES = ['a', 'a|b', 'a*', 'ab', '(a|b)*', 'a(b|c)', '(a|b)*abb', 'ab*'];

export function RegexInput({
  value,
  onChange,
  onConvert,
  onReset,
  validationMessage,
  validationIsError,
  isLoading,
}: RegexInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onConvert();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-3">
      {/* Input label */}
      <label
        htmlFor="regex-input"
        className="block text-xs font-semibold text-slate-400 uppercase tracking-wider"
      >
        Regular Expression
      </label>

      {/* Text field */}
      <div className="relative">
        <input
          id="regex-input"
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="e.g. (a|b)*abb"
          spellCheck={false}
          autoComplete="off"
          className={`regex-input ${validationIsError ? 'border-red-500/60 focus:border-red-400' : value && !validationIsError ? 'border-emerald-500/60 focus:border-emerald-400' : ''}`}
          aria-label="Regular expression input"
          aria-describedby="validation-message"
          aria-invalid={validationIsError}
        />
        {/* Monospace indicator */}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600 font-mono pointer-events-none select-none">
          regex
        </span>
      </div>

      {/* Validation message */}
      <div id="validation-message">
        <ValidationMessage message={validationMessage} isError={validationIsError} />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          id="btn-convert"
          onClick={onConvert}
          disabled={isLoading || !value.trim() || validationIsError}
          className="btn-primary flex-1"
          aria-label="Convert regular expression to automata"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Converting...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Convert
            </span>
          )}
        </button>

        <button
          id="btn-reset"
          onClick={onReset}
          className="btn-secondary px-4"
          aria-label="Reset and clear"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Example regexes */}
      <div className="space-y-1.5">
        <p className="text-xs text-slate-500 font-medium">Examples:</p>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_REGEXES.map((ex) => (
            <button
              key={ex}
              onClick={() => onChange(ex)}
              className="example-chip"
              title={`Use example: ${ex}`}
              aria-label={`Use regex example: ${ex}`}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
