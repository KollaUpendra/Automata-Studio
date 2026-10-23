/**
 * TransitionTable — δ(q, σ) for the automaton on screen.
 * Rows are clickable and select the same state on the graph.
 */

import { useMemo, useState } from 'react';
import type { DFA } from '../../engine/dfa/types';
import type { NFA } from '../../engine/nfa/types';
import type { ActiveTab } from '../../types';

interface TransitionTableProps {
  activeTab: ActiveTab;
  nfa: NFA | null;
  dfa: DFA | null;
  minimizedDfa: DFA | null;
  selectedStateId: string | null;
  activeStateIds: readonly string[];
  onSelectState: (stateId: string) => void;
}

interface Row {
  id: string; // graph node id
  label: string;
  isStart: boolean;
  isAccepting: boolean;
  cells: string[][]; // target labels per column
}

function buildRows(tab: ActiveTab, nfa: NFA | null, dfa: DFA | null, min: DFA | null) {
  if (tab === 'nfa') {
    if (!nfa) return null;
    const columns = [...[...nfa.alphabet].sort(), 'ε'];
    const rows: Row[] = nfa.states.map((s) => ({
      id: String(s.id),
      label: `s${s.id}`,
      isStart: s.id === nfa.startState,
      isAccepting: nfa.acceptStates.has(s.id),
      cells: columns.map((col) =>
        nfa.transitions
          .filter((t) => t.from === s.id && (t.symbol ?? 'ε') === col)
          .map((t) => t.to)
          .sort((a, b) => a - b)
          .map((to) => `s${to}`),
      ),
    }));
    return { columns, rows };
  }
  const automaton = tab === 'minimized' ? min : dfa;
  if (!automaton) return null;
  const columns = [...automaton.alphabet].sort();
  const rows: Row[] = automaton.states.map((s) => ({
    id: s.id,
    label: s.id,
    isStart: s.id === automaton.startState,
    isAccepting: automaton.acceptStates.has(s.id),
    cells: columns.map((col) =>
      automaton.transitions.filter((t) => t.from === s.id && t.symbol === col).map((t) => t.to),
    ),
  }));
  return { columns, rows };
}

export function TransitionTable({
  activeTab,
  nfa,
  dfa,
  minimizedDfa,
  selectedStateId,
  activeStateIds,
  onSelectState,
}: TransitionTableProps) {
  const [filter, setFilter] = useState('');
  const data = useMemo(
    () => buildRows(activeTab, nfa, dfa, minimizedDfa),
    [activeTab, nfa, dfa, minimizedDfa],
  );

  if (!data) {
    return <div className="panel__empty">Build an expression to see its transition table.</div>;
  }

  const q = filter.trim().toLowerCase();
  const rows = q ? data.rows.filter((r) => r.label.toLowerCase().includes(q)) : data.rows;
  const isNfa = activeTab === 'nfa';
  const deadCount = isNfa
    ? 0
    : data.rows.reduce((n, r) => n + r.cells.filter((c) => c.length === 0).length, 0);

  return (
    <div className="panel panel--flush">
      <div className="table-toolbar">
        <span className="muted">
          {data.rows.length} states × {data.columns.length} {isNfa ? 'columns' : 'symbols'}
          {deadCount > 0 &&
            `; ${deadCount} missing ${deadCount === 1 ? 'entry rejects' : 'entries reject'}`}
        </span>
        <label htmlFor="table-filter" className="visually-hidden">
          Find a state
        </label>
        <input
          id="table-filter"
          className="field"
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Find a state"
        />
      </div>
      <div className="table-wrap">
        <table className="delta">
          <thead>
            <tr>
              <th scope="col">State</th>
              {data.columns.map((col) => (
                <th key={col} scope="col" className={col === 'ε' ? 'eps' : undefined}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                aria-selected={selectedStateId === row.id}
                data-active={activeStateIds.includes(row.id)}
                tabIndex={0}
                onClick={() => onSelectState(row.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectState(row.id);
                  }
                }}
              >
                <th scope="row">
                  <span className="state-mark">
                    <span
                      className="state-mark__arrow"
                      aria-label={row.isStart ? 'start' : undefined}
                    >
                      {row.isStart ? '→' : ' '}
                    </span>
                    <span
                      className={`state-mark__ring ${row.isAccepting ? 'state-mark__ring--accept' : ''}`}
                      title={row.isAccepting ? 'accepting state' : undefined}
                    >
                      {row.label}
                    </span>
                  </span>
                </th>
                {row.cells.map((cell, i) => (
                  <td key={i}>
                    {cell.length === 0 ? (
                      <span className="none">{isNfa ? '·' : '∅'}</span>
                    ) : isNfa ? (
                      `{${cell.join(', ')}}`
                    ) : (
                      cell[0]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="panel__empty">No state matches “{filter}”.</div>}
      </div>
    </div>
  );
}
