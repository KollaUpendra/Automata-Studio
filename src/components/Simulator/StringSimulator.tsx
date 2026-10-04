/**
 * StringSimulator component — Interactive string testing against DFA / Minimized DFA.
 */

import { useState } from 'react';
import type { DFA } from '../../engine/dfa/types';
import { traceDFA, type DFASimulationTrace } from '../../engine/dfa/dfaUtils';

interface StringSimulatorProps {
  dfa: DFA;
  title?: string;
}

export function StringSimulator({ dfa, title = 'DFA String Simulator' }: StringSimulatorProps) {
  const [testString, setTestString] = useState<string>('');
  const [trace, setTrace] = useState<DFASimulationTrace | null>(null);

  const handleSimulate = (str: string = testString) => {
    const result = traceDFA(dfa, str);
    setTrace(result);
  };

  const alphabetList = Array.from(dfa.alphabet).sort().join(', ');

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Test whether a string is accepted or rejected by the automaton. Alphabet:{' '}
          <code className="text-amber-300 font-mono font-semibold">
            Σ = {'{'}
            {alphabetList}
            {'}'}
          </code>
        </p>
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            id="simulator-input"
            type="text"
            value={testString}
            onChange={(e) => {
              setTestString(e.target.value);
              if (trace) handleSimulate(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSimulate();
            }}
            placeholder="Enter test string (e.g. abb, ε for empty)"
            spellCheck={false}
            className="regex-input"
            aria-label="Input string to simulate"
          />
          <button
            type="button"
            onClick={() => {
              setTestString('');
              handleSimulate('');
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded"
            title="Test empty string ε"
          >
            ε (empty)
          </button>
        </div>

        <button
          id="btn-simulate"
          onClick={() => handleSimulate()}
          className="btn-primary px-4"
          aria-label="Simulate string"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Test
        </button>
      </div>

      {/* Result badge and breakdown */}
      {trace && (
        <div className="space-y-3 animate-fadeIn">
          {/* Verdict Banner */}
          <div
            className={`p-3 rounded-lg border flex items-center justify-between ${
              trace.accepted
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {trace.accepted ? (
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-rose-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
              )}
              <div>
                <span className="font-bold text-sm">
                  {trace.accepted ? 'ACCEPTED' : 'REJECTED'}
                </span>
                <span className="text-xs opacity-80 ml-2 font-mono">
                  Input: &quot;{trace.input || 'ε'}&quot;
                </span>
              </div>
            </div>

            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900/60 border border-slate-700/60">
              End State: <strong className="text-indigo-300">{trace.finalState}</strong>
            </span>
          </div>

          {/* Failure reason explanation if rejected */}
          {trace.failureReason && (
            <p className="text-xs text-rose-300/90 bg-rose-950/20 border border-rose-900/40 p-2.5 rounded-md">
              ℹ️ {trace.failureReason}
            </p>
          )}

          {/* Step-by-step Trace */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Execution Path ({trace.statesVisited.length} States Visited)
            </h4>

            {trace.path.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                Empty string simulation: Started at start state{' '}
                <span className="font-mono text-indigo-300 font-semibold">{dfa.startState}</span>{' '}
                without transitions.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {trace.path.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs bg-slate-900/50 border border-slate-800 p-2 rounded-md font-mono"
                  >
                    <span className="text-slate-500 w-6 text-right font-sans font-bold">
                      #{idx + 1}
                    </span>
                    <span className="text-indigo-300 font-semibold bg-slate-800 px-1.5 py-0.5 rounded">
                      {step.from}
                    </span>
                    <span className="text-slate-500">──</span>
                    <span className="text-amber-400 font-bold bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded">
                      {step.symbol}
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="text-indigo-300 font-semibold bg-slate-800 px-1.5 py-0.5 rounded">
                      {step.to}
                    </span>
                    {idx === trace.path.length - 1 && (
                      <span className="ml-auto font-sans text-[11px] text-slate-400">
                        {dfa.acceptStates.has(step.to) ? '★ (Accepting)' : '(Non-accepting)'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default StringSimulator;
