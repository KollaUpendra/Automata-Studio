/**
 * PipelineRail — shows regex → NFA → DFA → minimal DFA and switches the graph on screen.
 */

import type { KeyboardEvent } from 'react';
import type { ActiveTab } from '../../hooks/useAutomata';

interface PipelineRailProps {
  builtRegex: string | null;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  counts: Record<ActiveTab, number> | null;
}

const STEPS: Array<{ id: ActiveTab; name: string; algo: string }> = [
  { id: 'nfa', name: 'ε-NFA', algo: 'Thompson' },
  { id: 'dfa', name: 'DFA', algo: 'subset construction' },
  { id: 'minimized', name: 'Minimal DFA', algo: 'partition refinement' },
];

function Arrow() {
  return (
    <svg className="rail__arrow" viewBox="0 0 26 12" aria-hidden="true">
      <path d="M1 6h22M18 1.5 23 6l-5 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function PipelineRail({ builtRegex, activeTab, onTabChange, counts }: PipelineRailProps) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!counts || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    const i = STEPS.findIndex((s) => s.id === activeTab);
    const next = (i + (e.key === 'ArrowRight' ? 1 : STEPS.length - 1)) % STEPS.length;
    onTabChange(STEPS[next].id);
    document.getElementById(`rail-${STEPS[next].id}`)?.focus();
  };

  return (
    <nav className="rail" aria-label="Conversion pipeline">
      <span className="rail__source" title={builtRegex ?? undefined}>
        {builtRegex ?? 'no expression'}
      </span>
      <div
        role="tablist"
        aria-label="Graph to show"
        style={{ display: 'contents' }}
        onKeyDown={onKeyDown}
      >
        {STEPS.map((step) => {
          const selected = activeTab === step.id;
          return (
            <span key={step.id} style={{ display: 'contents' }}>
              <Arrow />
              <button
                id={`rail-${step.id}`}
                type="button"
                role="tab"
                className="rail__step"
                aria-selected={selected}
                aria-controls="graph-canvas"
                tabIndex={selected ? 0 : -1}
                disabled={!counts}
                onClick={() => onTabChange(step.id)}
              >
                <span className="rail__name">{step.name}</span>
                {counts && (
                  <span className="rail__count">
                    {counts[step.id]} {counts[step.id] === 1 ? 'state' : 'states'}
                  </span>
                )}
                <span className="rail__algo">{step.algo}</span>
              </button>
            </span>
          );
        })}
      </div>
    </nav>
  );
}
