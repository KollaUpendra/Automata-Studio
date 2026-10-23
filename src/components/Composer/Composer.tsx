/**
 * Composer — the expression field (with live syntax colouring), operator keys,
 * examples and the Build action.
 */

import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { IconAlert, IconBuild, IconCheck, IconClear, IconPending } from '../Icons';

interface ComposerProps {
  regex: string;
  onRegexChange: (value: string) => void;
  onBuild: (regexOverride?: string) => void;
  onClear: () => void;
  validationMessage: string | null;
  validationIsError: boolean;
  errorPosition: number | null;
  isLoading: boolean;
  isStale: boolean;
  hasResult: boolean;
}

const EXAMPLES = ['(a|b)*abb', 'a(b|c)*', '(0|1)*101', 'a*b*', 'ab|ba', '((a|b)(a|b))*'];

const KEYS = [
  { symbol: '|', label: 'Union' },
  { symbol: '*', label: 'Kleene star' },
  { symbol: '(', label: 'Open group' },
  { symbol: ')', label: 'Close group' },
];

function Highlighted({ value, errorPosition }: { value: string; errorPosition: number | null }) {
  // The validator reports positions relative to the trimmed value.
  const offset = value.length - value.trimStart().length;
  return (
    <>
      {[...value].map((ch, i) => {
        let cls = '';
        if (errorPosition !== null && i === errorPosition + offset) cls = 'tok-bad';
        else if (ch === '|' || ch === '*' || ch === '.') cls = 'tok-op';
        else if (ch === '(' || ch === ')') cls = 'tok-paren';
        return (
          <span key={i} className={cls || undefined}>
            {ch}
          </span>
        );
      })}
    </>
  );
}

export function Composer({
  regex,
  onRegexChange,
  onBuild,
  onClear,
  validationMessage,
  validationIsError,
  errorPosition,
  isLoading,
  isStale,
  hasResult,
}: ComposerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const canBuild = !isLoading && !validationIsError && regex.trim().length > 0;

  const syncScroll = () => {
    if (inputRef.current && mirrorRef.current) {
      mirrorRef.current.scrollLeft = inputRef.current.scrollLeft;
    }
  };

  const insert = (symbol: string) => {
    const input = inputRef.current;
    const start = input?.selectionStart ?? regex.length;
    const end = input?.selectionEnd ?? regex.length;
    onRegexChange(regex.slice(0, start) + symbol + regex.slice(end));
    requestAnimationFrame(() => {
      if (!input) return;
      input.focus();
      const pos = start + symbol.length;
      input.setSelectionRange(pos, pos);
      syncScroll();
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && canBuild) onBuild();
    if (e.key === 'Escape' && regex) onClear();
  };

  const pickExample = (value: string) => {
    onRegexChange(value);
    onBuild(value);
  };

  let status: { cls: string; icon: ReactNode; text: string } | null = null;
  if (validationIsError && validationMessage) {
    status = { cls: 'status--error', icon: <IconAlert />, text: validationMessage };
  } else if (regex.trim() && isStale) {
    status = {
      cls: 'status--stale',
      icon: <IconPending />,
      text: hasResult
        ? 'Edited — press Build to update the graphs'
        : 'Press Build to draw the machines',
    };
  } else if (regex.trim() && hasResult) {
    status = { cls: '', icon: <IconCheck />, text: 'Up to date' };
  }

  return (
    <section className="composer" aria-label="Regular expression">
      <div className="composer__row">
        <div className="expr" data-state={validationIsError ? 'error' : undefined}>
          <div className="expr__mirror" ref={mirrorRef} aria-hidden="true">
            <Highlighted value={regex} errorPosition={errorPosition} />
          </div>
          <label htmlFor="regex-input" className="visually-hidden">
            Regular expression
          </label>
          <input
            id="regex-input"
            ref={inputRef}
            className="expr__input"
            type="text"
            value={regex}
            onChange={(e) => onRegexChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            onSelect={syncScroll}
            placeholder="Type a regular expression, e.g. (a|b)*abb"
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            aria-invalid={validationIsError}
            aria-describedby="regex-status"
          />
        </div>
        <button
          type="button"
          className="btn btn--primary composer__build"
          onClick={() => onBuild()}
          disabled={!canBuild}
          title="Build the NFA, DFA and minimal DFA (Enter)"
        >
          {isLoading ? <span className="spinner" aria-hidden="true" /> : <IconBuild />}
          <span>{isLoading ? 'Building…' : 'Build'}</span>
        </button>
      </div>

      <div className="composer__meta">
        <div className="keys" role="group" aria-label="Insert operator">
          {KEYS.map((k) => (
            <button
              key={k.symbol}
              type="button"
              className="key"
              onClick={() => insert(k.symbol)}
              title={`Insert ${k.label.toLowerCase()} ${k.symbol}`}
              aria-label={`Insert ${k.label.toLowerCase()}`}
            >
              {k.symbol}
            </button>
          ))}
          <button
            type="button"
            className="btn btn--quiet btn--sm btn--icon"
            onClick={onClear}
            disabled={!regex}
            title="Clear (Esc)"
            aria-label="Clear expression"
          >
            <IconClear />
          </button>
        </div>

        <div className="examples">
          <span className="examples__label">Try</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              className="chip"
              aria-pressed={regex.trim() === ex}
              onClick={() => pickExample(ex)}
            >
              {ex}
            </button>
          ))}
        </div>

        <div
          id="regex-status"
          className={`status ${status?.cls ?? ''}`}
          role="status"
          aria-live="polite"
        >
          {status && (
            <>
              {status.icon}
              <span className="status__text">{status.text}</span>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
