/**
 * Automata Studio — app shell.
 * Composer on top, pipeline rail, graph canvas on the left and an inspector on the right.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import type cytoscape from 'cytoscape';
import { useAutomata } from './hooks/useAutomata';
import { cssVar, useTheme } from './hooks/useTheme';
import { Header } from './components/Header/Header';
import { Composer } from './components/Composer/Composer';
import { PipelineRail } from './components/PipelineRail/PipelineRail';
import { CanvasWorkspace } from './components/CanvasWorkspace/CanvasWorkspace';
import { TransitionTable } from './components/TransitionTable/TransitionTable';
import { StringSimulator } from './components/Simulator/StringSimulator';
import { StepBreakdown } from './components/StepBreakdown/StepBreakdown';
import { IconRun, IconSteps, IconTable } from './components/Icons';
import {
  dfaToCytoscapeElements,
  isEdge,
  nfaToCytoscapeElements,
  type CytoscapeElement,
} from './adapters/cytoscapeAdapter';
import { downloadFile, exportDFAtoJSON, exportGraphAsPNG, exportNFAtoJSON } from './utils/export';
import { sanitizeFilename } from './utils/helpers';
import type { ActiveTab, RightPanelView, StateInfo } from './types';

const PANELS: Array<{ id: RightPanelView; label: string; Icon: typeof IconRun }> = [
  { id: 'simulator', label: 'Run a string', Icon: IconRun },
  { id: 'table', label: 'Transitions', Icon: IconTable },
  { id: 'steps', label: 'How it’s built', Icon: IconSteps },
];

const FILE_PREFIX: Record<ActiveTab, string> = { nfa: 'NFA', dfa: 'DFA', minimized: 'MinDFA' };

export function App() {
  const [state, actions] = useAutomata();
  const [theme, toggleTheme] = useTheme();
  const [panel, setPanel] = useState<RightPanelView>('simulator');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const cyRef = useRef<cytoscape.Core | null>(null);

  const result = state.result?.success ? state.result : null;
  const error = state.result && !state.result.success ? state.result.errors[0] : null;
  const tab = state.activeTab;

  const elements: CytoscapeElement[] = useMemo(() => {
    if (!result) return [];
    if (tab === 'nfa') return nfaToCytoscapeElements(result.nfa);
    return dfaToCytoscapeElements(tab === 'dfa' ? result.dfa : result.minimizedDfa);
  }, [result, tab]);

  // Unique per automaton on screen, so the canvas re-lays out only when it really changes.
  const graphKey = `${result?.regex ?? ''}|${tab}|${state.result ? 'r' : '-'}`;

  // Selection belongs to one graph; drop it when the graph changes.
  const [selectionKey, setSelectionKey] = useState(graphKey);
  if (selectionKey !== graphKey) {
    setSelectionKey(graphKey);
    setSelectedId(null);
  }

  const selectedState: StateInfo | null = useMemo(() => {
    if (!selectedId) return null;
    const node = elements.find((el) => !isEdge(el) && el.data.id === selectedId);
    if (!node || isEdge(node)) return null;
    const labelOf = new Map(
      elements.filter((el) => !isEdge(el)).map((el) => [el.data.id, el.data.label]),
    );
    return {
      id: node.data.id,
      label: node.data.label,
      isStart: node.data.isStart,
      isAccepting: node.data.isAccepting,
      nfaStates: node.data.nfaStates ?? '',
      transitions: elements
        .filter(isEdge)
        .filter((e) => e.data.source === selectedId)
        .map((e) => ({
          symbol: e.data.label,
          target: labelOf.get(e.data.target) ?? e.data.target,
        })),
    };
  }, [elements, selectedId]);

  const handleCyReady = useCallback((cy: cytoscape.Core | null) => {
    cyRef.current = cy;
  }, []);

  const handleActiveStates = useCallback((ids: string[]) => {
    setActiveIds((prev) =>
      prev.length === ids.length && prev.every((v, i) => v === ids[i]) ? prev : ids,
    );
  }, []);

  const toggleSelect = useCallback((id: string | null) => {
    setSelectedId((prev) => (id !== null && prev === id ? null : id));
  }, []);

  const baseName = `${FILE_PREFIX[tab]}_${sanitizeFilename(result?.regex || 'automaton', 24)}`;

  const exportPNG = () => exportGraphAsPNG(cyRef.current, `${baseName}.png`, cssVar('--paper'));

  const exportJSON = () => {
    if (!result) return;
    const json =
      tab === 'nfa'
        ? exportNFAtoJSON(result.nfa)
        : exportDFAtoJSON(
            tab === 'dfa' ? result.dfa : result.minimizedDfa,
            tab === 'dfa' ? 'DFA' : 'MinimizedDFA',
          );
    downloadFile(json, `${baseName}.json`, 'application/json');
  };

  const counts = result
    ? {
        nfa: result.nfa.states.length,
        dfa: result.dfa.states.length,
        minimized: result.minimizedDfa.states.length,
      }
    : null;

  const simDfa = result ? (tab === 'minimized' ? result.minimizedDfa : result.dfa) : null;

  return (
    <div className="app">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        canExport={Boolean(result)}
        onExportPNG={exportPNG}
        onExportJSON={exportJSON}
      />

      <Composer
        regex={state.regex}
        onRegexChange={actions.setRegex}
        onBuild={actions.convert}
        onClear={actions.reset}
        validationMessage={state.validationMessage}
        validationIsError={state.validationIsError}
        errorPosition={state.errorPosition}
        isLoading={state.isLoading}
        isStale={state.isStale || !state.result}
        hasResult={Boolean(result)}
      />

      <main className="workspace">
        <section className="canvas-pane" aria-label="Automaton">
          <PipelineRail
            builtRegex={result?.regex ?? null}
            activeTab={tab}
            onTabChange={actions.setActiveTab}
            counts={counts}
          />
          <CanvasWorkspace
            elements={elements}
            graphKey={graphKey}
            theme={theme}
            selectedState={selectedState}
            onStateSelect={toggleSelect}
            activeStateIds={panel === 'simulator' ? activeIds : []}
            onCyReady={handleCyReady}
            isLoading={state.isLoading}
            error={error}
            isNfa={tab === 'nfa'}
          />
        </section>

        <aside className="inspector" aria-label="Inspector">
          <div className="tabs" role="tablist" aria-label="Inspector views">
            {PANELS.map(({ id, label, Icon }) => (
              <button
                key={id}
                id={`panel-tab-${id}`}
                type="button"
                role="tab"
                className="tabs__tab"
                aria-selected={panel === id}
                aria-controls="inspector-panel"
                onClick={() => setPanel(id)}
              >
                <Icon />
                {label}
              </button>
            ))}
          </div>

          <div
            id="inspector-panel"
            role="tabpanel"
            aria-labelledby={`panel-tab-${panel}`}
            style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
          >
            {panel === 'simulator' && (
              <StringSimulator
                key={graphKey}
                mode={tab === 'nfa' ? 'nfa' : 'dfa'}
                nfa={result?.nfa ?? null}
                dfa={simDfa}
                onActiveStatesChange={handleActiveStates}
              />
            )}
            {panel === 'table' && (
              <TransitionTable
                activeTab={tab}
                nfa={result?.nfa ?? null}
                dfa={result?.dfa ?? null}
                minimizedDfa={result?.minimizedDfa ?? null}
                selectedStateId={selectedId}
                activeStateIds={activeIds}
                onSelectState={toggleSelect}
              />
            )}
            {panel === 'steps' && <StepBreakdown result={state.result} />}
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
