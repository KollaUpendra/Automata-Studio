/**
 * Automata Studio — Production Transition Matrix Component (Light Theme)
 * Clean tabular matrix displaying state transitions δ(q, σ), start state indicators, and accepting states.
 */

import React, { useState, useMemo } from 'react';
import { Table2, Search, ArrowRight, Asterisk } from 'lucide-react';
import type { DFA } from '../../engine/dfa/types';
import type { NFA } from '../../engine/nfa/types';
import type { ActiveTab } from '../../types';

interface TransitionTableProps {
  activeTab: ActiveTab;
  nfa: NFA | null;
  dfa: DFA | null;
  minimizedDfa: DFA | null;
  selectedStateId?: string | null;
  onSelectState?: (stateId: string) => void;
}

export const TransitionTable: React.FC<TransitionTableProps> = ({
  activeTab,
  nfa,
  dfa,
  minimizedDfa,
  selectedStateId,
  onSelectState,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  // ─── NFA Data Preparation ───
  const nfaData = useMemo(() => {
    if (activeTab !== 'nfa' || !nfa) return null;

    const alphabet = [...nfa.alphabet].sort();
    const columns = [...alphabet, 'ε'];

    // Map: stateId -> symbol -> Set<targetId>
    const transMap = new Map<number, Map<string, number[]>>();
    for (const state of nfa.states) {
      transMap.set(state.id, new Map());
    }

    for (const t of nfa.transitions) {
      const sym = t.symbol ?? 'ε';
      const stateMap = transMap.get(t.from);
      if (stateMap) {
        const arr = stateMap.get(sym) ?? [];
        arr.push(t.to);
        stateMap.set(sym, arr);
      }
    }

    return {
      states: nfa.states,
      columns,
      startState: nfa.startState,
      acceptStates: nfa.acceptStates,
      transMap,
    };
  }, [activeTab, nfa]);

  // ─── DFA Data Preparation ───
  const activeDfa = activeTab === 'minimized' ? minimizedDfa : dfa;

  const dfaData = useMemo(() => {
    if (activeTab === 'nfa' || !activeDfa) return null;

    const alphabet = [...activeDfa.alphabet].sort();

    // Map: stateId -> symbol -> targetId
    const transMap = new Map<string, Map<string, string>>();
    for (const state of activeDfa.states) {
      transMap.set(state.id, new Map());
    }

    for (const t of activeDfa.transitions) {
      transMap.get(t.from)?.set(t.symbol, t.to);
    }

    return {
      states: activeDfa.states,
      columns: alphabet,
      startState: activeDfa.startState,
      acceptStates: activeDfa.acceptStates,
      transMap,
    };
  }, [activeTab, activeDfa]);

  // ─── Filtered Rows ───
  const filteredNfaStates = useMemo(() => {
    if (!nfaData) return [];
    if (!filterQuery.trim()) return nfaData.states;
    const q = filterQuery.toLowerCase();
    return nfaData.states.filter((s) => `q${s.id}`.includes(q) || String(s.id).includes(q));
  }, [nfaData, filterQuery]);

  const filteredDfaStates = useMemo(() => {
    if (!dfaData) return [];
    if (!filterQuery.trim()) return dfaData.states;
    const q = filterQuery.toLowerCase();
    return dfaData.states.filter((s) => s.id.toLowerCase().includes(q));
  }, [dfaData, filterQuery]);

  if (!nfa && !dfa && !minimizedDfa) {
    return (
      <div className="p-8 text-center text-slate-400 font-mono text-xs">
        Compile a regular expression to inspect state transitions.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* ─── Search & Header Row ─── */}
      <div className="p-3 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50/80 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Table2 className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-semibold text-slate-800">
            Transition Matrix <span className="font-mono text-slate-500 text-[11px]">δ(q, σ)</span>
          </span>
        </div>

        <div className="relative w-40">
          <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter states..."
            className="w-full h-7 pl-6 pr-2 bg-white border border-slate-200 rounded text-[11px] font-mono text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* ─── Matrix Table Container ─── */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'nfa' && nfaData ? (
          <table className="w-full text-left border-collapse text-xs select-text">
            <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-md border-b border-slate-200 z-10">
              <tr>
                <th className="py-2 px-3 text-center w-12 font-mono text-slate-600 font-medium text-[11px]">
                  State
                </th>
                {nfaData.columns.map((col) => (
                  <th key={col} className="py-2 px-3 font-mono font-semibold text-slate-700 text-center">
                    {col === 'ε' ? <span className="text-amber-600 font-bold">ε</span> : col}
                  </th>
                ))}
                <th className="py-2 px-3 text-center font-mono text-slate-600 text-[11px] font-medium w-20">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {filteredNfaStates.map((state) => {
                const isStart = state.id === nfaData.startState;
                const isAccept = nfaData.acceptStates.has(state.id);
                const isSelected = selectedStateId === `q${state.id}` || selectedStateId === String(state.id);
                const stateTransitions = nfaData.transMap.get(state.id);

                return (
                  <tr
                    key={state.id}
                    onClick={() => onSelectState?.(`q${state.id}`)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-900 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <td className="py-2 px-3 font-semibold text-center flex items-center justify-center gap-1">
                      {isStart && (
                        <span title="Start state">
                          <ArrowRight className="w-3 h-3 text-sky-600 stroke-[2.5]" />
                        </span>
                      )}
                      <span>q{state.id}</span>
                      {isAccept && (
                        <span title="Accepting state">
                          <Asterisk className="w-3 h-3 text-emerald-600 stroke-[3]" />
                        </span>
                      )}
                    </td>

                    {nfaData.columns.map((col) => {
                      const targets = stateTransitions?.get(col);
                      return (
                        <td key={col} className="py-2 px-3 text-center">
                          {targets && targets.length > 0 ? (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 text-[11px]">
                              {'{' + targets.map((t) => `q${t}`).join(', ') + '}'}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      );
                    })}

                    <td className="py-2 px-3 text-center text-[10px]">
                      {isAccept ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
                          Accept
                        </span>
                      ) : isStart ? (
                        <span className="px-1.5 py-0.5 rounded bg-sky-50 border border-sky-200 text-sky-700 font-semibold">
                          Start
                        </span>
                      ) : (
                        <span className="text-slate-400">Transit</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : dfaData ? (
          <table className="w-full text-left border-collapse text-xs select-text">
            <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-md border-b border-slate-200 z-10">
              <tr>
                <th className="py-2 px-3 text-center w-14 font-mono text-slate-600 font-medium text-[11px]">
                  State
                </th>
                {dfaData.columns.map((col) => (
                  <th key={col} className="py-2 px-3 font-mono font-semibold text-slate-700 text-center">
                    {col}
                  </th>
                ))}
                <th className="py-2 px-3 text-center font-mono text-slate-600 text-[11px] font-medium w-20">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {filteredDfaStates.map((state) => {
                const isStart = state.id === dfaData.startState;
                const isAccept = dfaData.acceptStates.has(state.id);
                const isSelected = selectedStateId === state.id;
                const stateTransitions = dfaData.transMap.get(state.id);

                return (
                  <tr
                    key={state.id}
                    onClick={() => onSelectState?.(state.id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-900 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <td className="py-2 px-3 font-semibold text-center flex items-center justify-center gap-1">
                      {isStart && (
                        <span title="Start state">
                          <ArrowRight className="w-3 h-3 text-sky-600 stroke-[2.5]" />
                        </span>
                      )}
                      <span className="text-indigo-700 font-bold">{state.id}</span>
                      {isAccept && (
                        <span title="Accepting state">
                          <Asterisk className="w-3 h-3 text-emerald-600 stroke-[3]" />
                        </span>
                      )}
                    </td>

                    {dfaData.columns.map((col) => {
                      const target = stateTransitions?.get(col);
                      return (
                        <td key={col} className="py-2 px-3 text-center">
                          {target ? (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 text-[11px]">
                              {target}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      );
                    })}

                    <td className="py-2 px-3 text-center text-[10px]">
                      {isAccept ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
                          Accept
                        </span>
                      ) : isStart ? (
                        <span className="px-1.5 py-0.5 rounded bg-sky-50 border border-sky-200 text-sky-700 font-semibold">
                          Start
                        </span>
                      ) : (
                        <span className="text-slate-400">Transit</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
};
