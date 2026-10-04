/**
 * Automata Studio — Main Application Component
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import cytoscape from 'cytoscape';
import { useAutomata } from './hooks/useAutomata';
import { RegexInput } from './components/RegexInput/RegexInput';
import { AutomataTabs } from './components/AutomataTabs/AutomataTabs';
import { AutomataGraph } from './components/AutomataGraph/AutomataGraph';
import {
  DFATransitionTable,
  NFATransitionTable,
} from './components/TransitionTable/TransitionTable';
import { StateDetails } from './components/StateDetails/StateDetails';
import { ExplanationPanel } from './components/ExplanationPanel/ExplanationPanel';
import { ExportControls } from './components/ExportControls/ExportControls';
import { StringSimulator } from './components/Simulator/StringSimulator';
import {
  dfaToCytoscapeElements,
  nfaToCytoscapeElements,
  type CytoscapeElement,
} from './adapters/cytoscapeAdapter';
import type { CytoscapeNode } from './adapters/cytoscapeAdapter';

// ---------------------------------------------------------------------------
// State info type
// ---------------------------------------------------------------------------
interface StateInfo {
  id: string;
  label: string;
  isStart: boolean;
  isAccepting: boolean;
  nfaStates: string;
  transitions: Array<{ symbol: string; target: string }>;
}

// ---------------------------------------------------------------------------
// Panel tabs for the right panel
// ---------------------------------------------------------------------------
type RightPanel = 'graph' | 'table' | 'simulator' | 'steps';

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export function App() {
  const [state, actions] = useAutomata();
  const [selectedState, setSelectedState] = useState<StateInfo | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanel>('graph');
  const cyRef = useRef<cytoscape.Core | null>(null);

  // Build Cytoscape elements based on active tab
  const elements: CytoscapeElement[] = useMemo(() => {
    if (!state.result?.success) return [];
    const result = state.result;
    switch (state.activeTab) {
      case 'nfa':
        return nfaToCytoscapeElements(result.nfa);
      case 'dfa':
        return dfaToCytoscapeElements(result.dfa);
      case 'minimized':
        return dfaToCytoscapeElements(result.minimizedDfa);
    }
  }, [state.result, state.activeTab]);

  const handleStateSelect = useCallback((info: StateInfo | null) => {
    setSelectedState(info);
  }, []);

  const handleCyReady = useCallback((cy: cytoscape.Core) => {
    cyRef.current = cy;
  }, []);

  const getCy = useCallback(() => cyRef.current, []);

  const result = state.result;

  // Node count display
  const nodeCount = useMemo(() => {
    if (!elements.length) return 0;
    return elements.filter((el): el is CytoscapeNode => !('source' in el.data)).length;
  }, [elements]);

  return (
    <div className="min-h-screen bg-app text-slate-100 flex flex-col">
      {/* ═══════════════ HEADER ═══════════════ */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3" />
                <circle cx="4" cy="6" r="2" />
                <circle cx="20" cy="6" r="2" />
                <circle cx="4" cy="18" r="2" />
                <circle cx="20" cy="18" r="2" />
                <line x1="6" y1="7" x2="10" y2="10.5" />
                <line x1="14" y1="10.5" x2="18" y2="7" />
                <line x1="6" y1="17" x2="10" y2="13.5" />
                <line x1="14" y1="13.5" x2="18" y2="17" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Automata Studio</h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Interactive Regex → NFA → DFA Visualization
              </p>
            </div>
          </div>

          {/* Status badge */}
          {result?.success && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-900/20 border border-emerald-800/40 px-3 py-1.5 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="font-mono hidden sm:inline">{result.regex}</span>
              <span className="text-slate-400 hidden sm:inline">→</span>
              <span className="hidden sm:inline">
                {result.minimizedDfa.states.length} min states
              </span>
              <span className="sm:hidden">Ready</span>
            </div>
          )}
        </div>
      </header>

      {/* ═══════════════ MAIN LAYOUT ═══════════════ */}
      <div className="flex-1 flex overflow-hidden max-w-screen-2xl mx-auto w-full">
        {/* ─── LEFT SIDEBAR ─── */}
        <aside className="w-72 xl:w-80 flex-shrink-0 border-r border-slate-800/80 bg-slate-900/50 flex flex-col overflow-y-auto">
          <div className="p-4 space-y-5 flex-1">
            {/* Section: Regex Input */}
            <section aria-label="Regex input">
              <RegexInput
                value={state.regex}
                onChange={actions.setRegex}
                onConvert={actions.convert}
                onReset={actions.reset}
                validationMessage={state.validationMessage}
                validationIsError={state.validationIsError}
                isLoading={state.isLoading}
              />
            </section>

            {/* Divider */}
            {result?.success && <div className="border-t border-slate-800/60" />}

            {/* Section: Syntax Reference */}
            <section aria-label="Syntax reference">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                Supported Syntax
              </h2>
              <div className="space-y-1.5">
                {[
                  { sym: 'a, b, 0, 1', desc: 'Literals' },
                  { sym: 'a|b', desc: 'Union' },
                  { sym: 'ab', desc: 'Concatenation' },
                  { sym: 'a*', desc: 'Kleene Star' },
                  { sym: '(a|b)*', desc: 'Grouping' },
                ].map(({ sym, desc }) => (
                  <div key={sym} className="flex items-center gap-2 text-xs">
                    <code className="font-mono text-amber-300 bg-slate-900/60 border border-slate-800 px-1.5 py-0.5 rounded min-w-[70px] text-center">
                      {sym}
                    </code>
                    <span className="text-slate-500">{desc}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* State details when a node is selected */}
            {result?.success && (
              <>
                <div className="border-t border-slate-800/60" />
                <section aria-label="Selected state details">
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                    State Inspector
                  </h2>
                  <StateDetails stateInfo={selectedState} />
                </section>
              </>
            )}

            {/* Export controls */}
            {result?.success && (
              <>
                <div className="border-t border-slate-800/60" />
                <section aria-label="Export options">
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                    Export
                  </h2>
                  <ExportControls
                    activeTab={state.activeTab}
                    dfa={result.success ? result.dfa : null}
                    minimizedDfa={result.success ? result.minimizedDfa : null}
                    nfa={result.success ? result.nfa : null}
                    getCy={getCy}
                    regex={state.regex}
                  />
                </section>
              </>
            )}
          </div>
        </aside>

        {/* ─── MAIN CONTENT ─── */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Error display */}
          {result && !result.success && (
            <div className="m-4 bg-red-950/30 border border-red-800/60 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <h3 className="font-semibold text-red-300 text-sm">Conversion Failed</h3>
                  <ul className="mt-1 space-y-1">
                    {result.errors.map((err, i) => (
                      <li key={i} className="text-red-400/90 text-sm">
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tab bar and panel switcher */}
          {result?.success && (
            <div className="border-b border-slate-800/80 px-4 pt-4 pb-0 space-y-3">
              {/* Automata type tabs */}
              <AutomataTabs
                activeTab={state.activeTab}
                onTabChange={actions.setActiveTab}
                nfaStateCount={result.nfa.states.length}
                dfaStateCount={result.dfa.states.length}
                minDfaStateCount={result.minimizedDfa.states.length}
              />

              {/* Right panel switcher: Graph / Table / Steps */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800">
                  {(
                    [
                      {
                        id: 'graph' as const,
                        label: 'Graph',
                        icon: (
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="6" cy="12" r="2" />
                            <circle cx="18" cy="6" r="2" />
                            <circle cx="18" cy="18" r="2" />
                            <line x1="8" y1="11" x2="16" y2="7" />
                            <line x1="8" y1="13" x2="16" y2="17" />
                          </svg>
                        ),
                      },
                      {
                        id: 'table' as const,
                        label: 'Table',
                        icon: (
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <line x1="3" y1="9" x2="21" y2="9" />
                            <line x1="3" y1="15" x2="21" y2="15" />
                            <line x1="9" y1="3" x2="9" y2="21" />
                          </svg>
                        ),
                      },
                      {
                        id: 'simulator' as const,
                        label: 'Test String',
                        icon: (
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        ),
                      },
                      {
                        id: 'steps' as const,
                        label: 'Steps',
                        icon: (
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
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                            />
                          </svg>
                        ),
                      },
                    ] satisfies Array<{ id: RightPanel; label: string; icon: React.ReactNode }>
                  ).map(({ id, label, icon }) => (
                    <button
                      key={id}
                      id={`view-${id}`}
                      onClick={() => setRightPanel(id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150
                        ${
                          rightPanel === id
                            ? 'bg-slate-700 text-slate-100'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      aria-pressed={rightPanel === id}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>

                {/* State count */}
                <div className="text-xs text-slate-500">
                  <span className="text-slate-300 font-mono font-semibold">{nodeCount}</span> states
                </div>
              </div>
            </div>
          )}

          {/* ─── Panel content ─── */}
          <div className="flex-1 overflow-hidden relative">
            {/* Graph view */}
            <div
              id={`panel-${state.activeTab}`}
              role="tabpanel"
              aria-labelledby={`tab-${state.activeTab}`}
              className={`absolute inset-0 p-4 ${rightPanel === 'graph' ? '' : 'hidden'}`}
            >
              <AutomataGraph
                elements={elements}
                onStateSelect={handleStateSelect}
                onCyReady={handleCyReady}
              />
            </div>

            {/* Transition table view */}
            {rightPanel === 'table' && result?.success && (
              <div className="absolute inset-0 overflow-y-auto p-4">
                <div className="card">
                  <h3 className="text-sm font-semibold text-slate-200 mb-3">
                    Transition Table —{' '}
                    {state.activeTab === 'nfa'
                      ? 'NFA'
                      : state.activeTab === 'dfa'
                        ? 'DFA'
                        : 'Minimized DFA'}
                  </h3>
                  {state.activeTab === 'nfa' ? (
                    <NFATransitionTable nfa={result.nfa} />
                  ) : state.activeTab === 'dfa' ? (
                    <DFATransitionTable dfa={result.dfa} />
                  ) : (
                    <DFATransitionTable dfa={result.minimizedDfa} />
                  )}
                </div>
              </div>
            )}

            {/* String Simulator view */}
            {rightPanel === 'simulator' && result?.success && (
              <div className="absolute inset-0 overflow-y-auto p-4">
                <div className="card">
                  <StringSimulator
                    dfa={state.activeTab === 'minimized' ? result.minimizedDfa : result.dfa}
                    title={`String Simulator — ${
                      state.activeTab === 'minimized'
                        ? 'Minimized DFA'
                        : state.activeTab === 'dfa'
                          ? 'DFA'
                          : 'DFA (Equivalent of NFA)'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Steps view */}
            {rightPanel === 'steps' && result?.success && (
              <div className="absolute inset-0 overflow-y-auto p-4">
                <div className="card">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4">Conversion Steps</h3>
                  <ExplanationPanel
                    steps={result.steps}
                    regex={result.regex}
                    postfix={result.postfix}
                    withConcat={result.withConcat}
                  />
                </div>
              </div>
            )}

            {/* Empty state */}
            {!result && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center max-w-sm px-6">
                  <div className="w-16 h-16 bg-indigo-900/30 border border-indigo-800/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-indigo-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-1.575 1.575a1.875 1.875 0 01-2.651 0l-1.025-1.025a3.375 3.375 0 00-4.774 0l-1.025 1.025a1.875 1.875 0 01-2.65 0L5 15"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-slate-300 mb-2">
                    Welcome to Automata Studio
                  </h2>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">
                    Enter a regular expression in the left panel and click{' '}
                    <strong className="text-indigo-400">Convert</strong> to visualize the NFA, DFA,
                    and Minimized DFA.
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { step: '1', label: "Thompson's NFA", color: 'text-blue-400' },
                      { step: '2', label: 'Subset DFA', color: 'text-indigo-400' },
                      { step: '3', label: "Hopcroft's Min", color: 'text-purple-400' },
                    ].map(({ step, label, color }) => (
                      <div
                        key={step}
                        className="bg-slate-900/60 border border-slate-800 rounded-lg p-2"
                      >
                        <div className={`font-bold text-lg font-mono ${color}`}>{step}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="border-t border-slate-800/60 bg-slate-900/30 py-2 px-4 text-center text-xs text-slate-600">
        Automata Studio — Theory of Computation Visualizer &nbsp;·&nbsp; Thompson's Construction
        &nbsp;·&nbsp; Subset Construction &nbsp;·&nbsp; Hopcroft's Minimization
      </footer>
    </div>
  );
}

export default App;
