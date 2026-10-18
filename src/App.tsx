/**
 * Automata Studio — Production TOC Workbench (Light Theme)
 * Full-viewport dashboard layout with zero outer scroll, dual-split interactive visualization and algorithmic inspection.
 */

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import type cytoscape from 'cytoscape';
import { Table2, Play, Cpu, AlertTriangle } from 'lucide-react';
import { useAutomata } from './hooks/useAutomata';
import { Header } from './components/Header/Header';
import { CanvasWorkspace } from './components/CanvasWorkspace/CanvasWorkspace';
import { TransitionTable } from './components/TransitionTable/TransitionTable';
import { StringSimulator } from './components/Simulator/StringSimulator';
import { StepBreakdown } from './components/StepBreakdown/StepBreakdown';
import {
  dfaToCytoscapeElements,
  nfaToCytoscapeElements,
  type CytoscapeElement,
} from './adapters/cytoscapeAdapter';
import type { StateInfo, RightPanelView } from './types';

export function App() {
  const [state, actions] = useAutomata();
  const [selectedState, setSelectedState] = useState<StateInfo | null>(null);
  const [activeRightPanel, setActiveRightPanel] = useState<RightPanelView>('simulator');
  const [activeSimState, setActiveSimState] = useState<string | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  // Auto-compile default regex on first load if not yet compiled
  useEffect(() => {
    if (!state.result && state.regex) {
      actions.convert();
    }
  }, [state.result, state.regex, actions]);

  // Build Cytoscape graph elements based on the active tab
  const elements: CytoscapeElement[] = useMemo(() => {
    if (!state.result?.success) return [];
    const res = state.result;
    switch (state.activeTab) {
      case 'nfa':
        return nfaToCytoscapeElements(res.nfa);
      case 'dfa':
        return dfaToCytoscapeElements(res.dfa);
      case 'minimized':
        return dfaToCytoscapeElements(res.minimizedDfa);
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

  // Active DFA used for simulation (DFA or Minimized DFA)
  const simulationDfa = useMemo(() => {
    if (!result?.success) return null;
    return state.activeTab === 'minimized' ? result.minimizedDfa : result.dfa;
  }, [result, state.activeTab]);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-50 text-slate-900 font-sans select-none">
      {/* ═══════════════ TOP HEADER / CONTROL BAR ═══════════════ */}
      <Header
        regex={state.regex}
        onRegexChange={actions.setRegex}
        onCompile={actions.convert}
        onReset={() => {
          actions.reset();
          setSelectedState(null);
          setActiveSimState(null);
        }}
        validationMessage={state.validationMessage}
        validationIsError={state.validationIsError}
        isLoading={state.isLoading}
        activeTab={state.activeTab}
        nfa={result?.success ? result.nfa : null}
        dfa={result?.success ? result.dfa : null}
        minimizedDfa={result?.success ? result.minimizedDfa : null}
        getCy={getCy}
      />

      {/* ═══════════════ MAIN WORKSPACE (SPLIT VIEW) ═══════════════ */}
      <div className="flex-1 flex overflow-hidden min-h-0 w-full relative">
        {/* Error Notification Bar (if conversion fails) */}
        {result && !result.success && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4">
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 shadow-xl flex items-start gap-2.5 backdrop-blur-md">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-rose-900">Compilation Error:</span>
                <p className="text-rose-700 font-mono text-[11px] mt-0.5">{result.errors[0]}</p>
              </div>
            </div>
          </div>
        )}

        {/* ─── LEFT PANEL: Graph Visualizer Canvas ─── */}
        <section
          aria-label="Automata Graph Canvas"
          className="flex-1 h-full min-w-0 relative flex flex-col border-r border-slate-200 overflow-hidden"
        >
          <CanvasWorkspace
            elements={elements}
            activeTab={state.activeTab}
            onTabChange={actions.setActiveTab}
            nfaStateCount={result?.success ? result.nfa.states.length : undefined}
            dfaStateCount={result?.success ? result.dfa.states.length : undefined}
            minDfaStateCount={result?.success ? result.minimizedDfa.states.length : undefined}
            selectedState={selectedState}
            onStateSelect={handleStateSelect}
            activeSimulationState={activeSimState}
            onCyReady={handleCyReady}
            isLoading={state.isLoading}
          />
        </section>

        {/* ─── RIGHT PANEL: Inspection & Simulation Drawer ─── */}
        <aside
          aria-label="Automata Inspector and Simulation Drawer"
          className="w-[410px] xl:w-[460px] 2xl:w-[500px] h-full flex flex-col bg-white flex-shrink-0 border-l border-slate-200 shadow-xs overflow-hidden z-20"
        >
          {/* Drawer Top Navigation Tabs */}
          <div className="h-11 border-b border-slate-200 bg-slate-50/70 px-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-lg border border-slate-200">
              {[
                { id: 'simulator' as const, label: 'String Simulator', icon: Play },
                { id: 'table' as const, label: 'Transition Table', icon: Table2 },
                { id: 'steps' as const, label: 'Step Breakdown', icon: Cpu },
              ].map(({ id, label, icon: Icon }) => {
                const isActive = activeRightPanel === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveRightPanel(id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-white text-indigo-600 border border-slate-200/80 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick State Count Pill */}
            {result?.success && (
              <span className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
                {state.activeTab.toUpperCase()}
              </span>
            )}
          </div>

          {/* Drawer Views */}
          <div className="flex-1 overflow-hidden relative">
            {activeRightPanel === 'simulator' && (
              <StringSimulator
                dfa={simulationDfa}
                onActiveStateChange={setActiveSimState}
              />
            )}

            {activeRightPanel === 'table' && (
              <TransitionTable
                activeTab={state.activeTab}
                nfa={result?.success ? result.nfa : null}
                dfa={result?.success ? result.dfa : null}
                minimizedDfa={result?.success ? result.minimizedDfa : null}
                selectedStateId={selectedState?.id}
                onSelectState={(stateId) => {
                  const cy = cyRef.current;
                  if (!cy) return;
                  const node = cy.getElementById(stateId);
                  if (node && node.length > 0) {
                    cy.elements().removeClass('highlighted');
                    node.addClass('highlighted');
                    node.connectedEdges('[source = "' + stateId + '"]').addClass('highlighted');
                    setSelectedState({
                      id: stateId,
                      label: node.data('label') || stateId,
                      isStart: Boolean(node.data('isStart')),
                      isAccepting: Boolean(node.data('isAccepting')),
                      nfaStates: node.data('nfaStates') || '',
                      transitions: [],
                    });
                  }
                }}
              />
            )}

            {activeRightPanel === 'steps' && (
              <StepBreakdown result={result} />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
