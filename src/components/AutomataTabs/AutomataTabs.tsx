/**
 * AutomataTabs — tab switcher for NFA, DFA, Minimized DFA.
 */

import type { ActiveTab } from '../../hooks/useAutomata';

interface Tab {
  id: ActiveTab;
  label: string;
  shortLabel: string;
}

const TABS: Tab[] = [
  { id: 'nfa', label: 'NFA', shortLabel: 'NFA' },
  { id: 'dfa', label: 'DFA', shortLabel: 'DFA' },
  { id: 'minimized', label: 'Minimized DFA', shortLabel: 'Min DFA' },
];

interface AutomataTabsProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  nfaStateCount?: number;
  dfaStateCount?: number;
  minDfaStateCount?: number;
  disabled?: boolean;
}

export function AutomataTabs({
  activeTab,
  onTabChange,
  nfaStateCount,
  dfaStateCount,
  minDfaStateCount,
  disabled = false,
}: AutomataTabsProps) {
  const counts: Record<ActiveTab, number | undefined> = {
    nfa: nfaStateCount,
    dfa: dfaStateCount,
    minimized: minDfaStateCount,
  };

  return (
    <div
      className="flex gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800"
      role="tablist"
      aria-label="Automata type"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = counts[tab.id];

        return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            onClick={() => !disabled && onTabChange(tab.id)}
            disabled={disabled}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 flex-1 justify-center
              ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
          >
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
            {count !== undefined && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-mono font-bold
                  ${isActive ? 'bg-indigo-500/60 text-indigo-100' : 'bg-slate-700 text-slate-300'}`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
