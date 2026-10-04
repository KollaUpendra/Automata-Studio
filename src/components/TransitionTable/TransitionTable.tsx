/**
 * TransitionTable — renders a tabular view of DFA or NFA transitions.
 */

import type { DFA } from '../../engine/dfa/types';
import type { NFA } from '../../engine/nfa/types';

// ---------------------------------------------------------------------------
// DFA Transition Table
// ---------------------------------------------------------------------------

interface DFATransitionTableProps {
  dfa: DFA;
}

export function DFATransitionTable({ dfa }: DFATransitionTableProps) {
  const alphabet = [...dfa.alphabet].sort();

  // Build lookup map: from → symbol → to
  const transMap = new Map<string, Map<string, string>>();
  for (const state of dfa.states) {
    transMap.set(state.id, new Map());
  }
  for (const t of dfa.transitions) {
    transMap.get(t.from)?.set(t.symbol, t.to);
  }

  return (
    <div className="overflow-x-auto">
      <table
        className="w-full text-sm border-collapse"
        role="table"
        aria-label="DFA transition table"
      >
        <thead>
          <tr className="border-b border-slate-700">
            <th className="table-header text-left py-2 px-3 w-8">
              <span className="sr-only">State markers</span>
            </th>
            <th className="table-header text-left py-2 px-3">State</th>
            {alphabet.map((sym) => (
              <th key={sym} className="table-header text-center py-2 px-3 font-mono">
                {sym}
              </th>
            ))}
            <th className="table-header text-center py-2 px-3">Accepting</th>
          </tr>
        </thead>
        <tbody>
          {dfa.states.map((state, idx) => {
            const rowTrans = transMap.get(state.id)!;
            return (
              <tr
                key={state.id}
                className={`border-b border-slate-800/60 transition-colors hover:bg-slate-800/30
                  ${idx % 2 === 0 ? 'bg-slate-900/20' : ''}`}
              >
                <td className="py-2 px-3 text-center font-mono text-xs text-slate-500">
                  {state.isStart && (
                    <span
                      className="text-blue-400 font-bold mr-0.5"
                      title="Start state"
                      aria-label="Start state"
                    >
                      →
                    </span>
                  )}
                  {state.isAccepting && (
                    <span
                      className="text-emerald-400 font-bold"
                      title="Accepting state"
                      aria-label="Accepting state"
                    >
                      *
                    </span>
                  )}
                </td>
                <td className="py-2 px-3 font-mono text-indigo-300 font-semibold">{state.id}</td>
                {alphabet.map((sym) => {
                  const target = rowTrans.get(sym);
                  return (
                    <td key={sym} className="py-2 px-3 text-center font-mono">
                      {target ? (
                        <span className="text-slate-200 bg-slate-800/60 px-2 py-0.5 rounded">
                          {target}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="py-2 px-3 text-center">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full
                    ${
                      state.isAccepting
                        ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800'
                        : 'text-slate-600'
                    }`}
                  >
                    {state.isAccepting ? 'Yes' : 'No'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-3 flex gap-4 text-xs text-slate-500">
        <span>
          <span className="text-blue-400 font-bold font-mono">→</span> Start state
        </span>
        <span>
          <span className="text-emerald-400 font-bold font-mono">*</span> Accepting state
        </span>
        <span>
          <span className="text-slate-600">—</span> No transition (dead state)
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NFA Transition Table
// ---------------------------------------------------------------------------

interface NFATransitionTableProps {
  nfa: NFA;
}

export function NFATransitionTable({ nfa }: NFATransitionTableProps) {
  const alphabet = [...nfa.alphabet].sort();
  const columns = ['ε', ...alphabet];

  // Build lookup: from → symbol → to[]
  const transMap = new Map<number, Map<string, number[]>>();
  for (const state of nfa.states) {
    transMap.set(state.id, new Map());
    for (const col of columns) {
      transMap.get(state.id)!.set(col, []);
    }
  }
  for (const t of nfa.transitions) {
    const sym = t.symbol === null ? 'ε' : t.symbol;
    const targets = transMap.get(t.from)?.get(sym);
    if (targets !== undefined) {
      targets.push(t.to);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table
        className="w-full text-sm border-collapse"
        role="table"
        aria-label="NFA transition table"
      >
        <thead>
          <tr className="border-b border-slate-700">
            <th className="table-header text-left py-2 px-3 w-8">
              <span className="sr-only">State markers</span>
            </th>
            <th className="table-header text-left py-2 px-3">State</th>
            {columns.map((col) => (
              <th
                key={col}
                className={`table-header text-center py-2 px-3 font-mono
                  ${col === 'ε' ? 'text-slate-500 italic' : ''}`}
              >
                {col}
              </th>
            ))}
            <th className="table-header text-center py-2 px-3">Accepting</th>
          </tr>
        </thead>
        <tbody>
          {nfa.states.map((state, idx) => {
            const rowTrans = transMap.get(state.id)!;
            const isStart = state.id === nfa.startState;
            const isAccepting = nfa.acceptStates.has(state.id);
            return (
              <tr
                key={state.id}
                className={`border-b border-slate-800/60 transition-colors hover:bg-slate-800/30
                  ${idx % 2 === 0 ? 'bg-slate-900/20' : ''}`}
              >
                <td className="py-2 px-3 text-center font-mono text-xs">
                  {isStart && (
                    <span className="text-blue-400 font-bold" title="Start state">
                      →
                    </span>
                  )}
                  {isAccepting && (
                    <span className="text-emerald-400 font-bold" title="Accepting state">
                      *
                    </span>
                  )}
                </td>
                <td className="py-2 px-3 font-mono text-indigo-300 font-semibold">s{state.id}</td>
                {columns.map((col) => {
                  const targets = rowTrans.get(col) ?? [];
                  return (
                    <td key={col} className="py-2 px-3 text-center font-mono">
                      {targets.length > 0 ? (
                        <span className="text-slate-200 text-xs">
                          {'{'}s{targets.sort((a, b) => a - b).join(', s')}
                          {'}'}
                        </span>
                      ) : (
                        <span className="text-slate-600">∅</span>
                      )}
                    </td>
                  );
                })}
                <td className="py-2 px-3 text-center">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full
                    ${
                      isAccepting
                        ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800'
                        : 'text-slate-600'
                    }`}
                  >
                    {isAccepting ? 'Yes' : 'No'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-3 flex gap-4 text-xs text-slate-500">
        <span>
          <span className="text-blue-400 font-bold font-mono">→</span> Start state
        </span>
        <span>
          <span className="text-emerald-400 font-bold font-mono">*</span> Accepting state
        </span>
        <span>
          <span className="text-slate-500 italic font-mono">ε</span> Epsilon transitions
        </span>
        <span>
          <span className="text-slate-600">∅</span> Empty set
        </span>
      </div>
    </div>
  );
}
