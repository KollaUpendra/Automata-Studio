/**
 * CanvasWorkspace — Cytoscape.js + dagre graph on a graph-paper canvas,
 * with zoom/layout controls, a legend and the selected-state card.
 */

import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import type { CytoscapeElement, StateInfo } from '../../types';
import type { Theme } from '../../hooks/useTheme';
import { cssVar } from '../../hooks/useTheme';
import { IconAlert, IconClose, IconFit, IconLayout, IconZoomIn, IconZoomOut } from '../Icons';

try {
  cytoscape.use(dagre);
} catch {
  // Already registered (hot reload)
}

const START_STUB = '__start__';

const LAYOUT = {
  name: 'dagre',
  rankDir: 'LR',
  nodeSep: 48,
  rankSep: 86,
  edgeSep: 18,
  fit: true,
  padding: 48,
} as cytoscape.LayoutOptions;

interface CanvasWorkspaceProps {
  elements: CytoscapeElement[];
  /** Changes whenever a different automaton is shown; triggers a fresh layout. */
  graphKey: string;
  theme: Theme;
  selectedState: StateInfo | null;
  onStateSelect: (stateId: string | null) => void;
  /** States currently highlighted by the simulator (a set for NFAs). */
  activeStateIds: readonly string[];
  onCyReady?: (cy: cytoscape.Core | null) => void;
  isLoading?: boolean;
  error?: string | null;
  isNfa: boolean;
}

function buildStyle(): cytoscape.StylesheetJson {
  const v = {
    sheet: cssVar('--sheet'),
    ink: cssVar('--ink'),
    graphite: cssVar('--graphite'),
    start: cssVar('--start'),
    startWash: cssVar('--start-wash'),
    accept: cssVar('--accept'),
    acceptWash: cssVar('--accept-wash'),
    select: cssVar('--select'),
    selectWash: cssVar('--select-wash'),
    highlight: cssVar('--highlight'),
    highlightInk: cssVar('--highlight-ink'),
    paper: cssVar('--paper'),
  };
  // Cytoscape rejects quoted family names, so list them bare.
  const mono = 'IBM Plex Mono, ui-monospace, Menlo, monospace';

  return [
    {
      selector: 'node',
      style: {
        'background-color': v.sheet,
        'border-color': v.ink,
        'border-width': 1.75,
        color: v.ink,
        label: 'data(label)',
        'font-family': mono,
        'font-size': 13,
        'font-weight': 600,
        'text-valign': 'center',
        'text-halign': 'center',
        width: 46,
        height: 46,
        'transition-property': 'background-color, border-color, color',
        'transition-duration': 0.15,
      },
    },
    {
      selector: 'node.start',
      style: { 'border-color': v.start, 'border-width': 2.25 },
    },
    {
      selector: 'node.accepting',
      style: {
        'border-color': v.accept,
        'border-width': 5,
        'border-style': 'double',
        'background-color': v.acceptWash,
      },
    },
    {
      selector: 'node.selected',
      style: {
        'border-color': v.select,
        'background-color': v.selectWash,
        'underlay-color': v.select,
        'underlay-opacity': 0.18,
        'underlay-padding': 7,
        'underlay-shape': 'ellipse',
      },
    },
    {
      selector: 'node.sim-active',
      style: {
        'background-color': v.highlight,
        color: v.highlightInk,
        'underlay-color': v.highlight,
        'underlay-opacity': 0.45,
        'underlay-padding': 9,
        'underlay-shape': 'ellipse',
      },
    },
    {
      selector: `node#${START_STUB}`,
      style: {
        width: 1,
        height: 1,
        'border-width': 0,
        'background-opacity': 0,
        label: '',
      },
    },
    {
      selector: 'edge',
      style: {
        width: 1.5,
        'line-color': v.graphite,
        'target-arrow-color': v.graphite,
        'target-arrow-shape': 'triangle',
        'arrow-scale': 0.95,
        'curve-style': 'bezier',
        'control-point-step-size': 36,
        label: 'data(label)',
        'font-family': mono,
        'font-size': 12,
        'font-weight': 600,
        color: v.ink,
        'text-background-color': v.paper,
        'text-background-opacity': 1,
        'text-background-padding': '2px',
        'text-background-shape': 'roundrectangle',
      },
    },
    {
      selector: 'edge:loop',
      style: {
        'loop-direction': '-90deg',
        'loop-sweep': '-50deg',
        'control-point-step-size': 52,
      },
    },
    {
      selector: 'edge.epsilon',
      style: {
        'line-style': 'dashed',
        'line-dash-pattern': [5, 4],
        color: v.select,
      },
    },
    {
      selector: 'edge.start-edge',
      style: {
        width: 2,
        'line-color': v.start,
        'target-arrow-color': v.start,
        label: 'start',
        color: v.start,
        'font-family': 'Schibsted Grotesk, system-ui, sans-serif',
        'font-weight': 500,
        'font-size': 11,
        'text-background-opacity': 0,
        'text-margin-y': -9,
      },
    },
    {
      selector: 'edge.selected',
      style: {
        width: 2.5,
        'line-color': v.select,
        'target-arrow-color': v.select,
        color: v.select,
        'z-index': 10,
      },
    },
  ];
}

function withStartStub(elements: CytoscapeElement[]): cytoscape.ElementDefinition[] {
  const defs = elements as cytoscape.ElementDefinition[];
  const start = defs.find((el) => el.data.isStart && !('source' in el.data));
  if (!start) return defs;
  return [
    { data: { id: START_STUB, label: '' } },
    ...defs,
    {
      data: {
        id: '__start_edge__',
        source: START_STUB,
        target: start.data.id as string,
        label: '',
      },
      classes: 'start-edge',
    },
  ];
}

export function CanvasWorkspace({
  elements,
  graphKey,
  theme,
  selectedState,
  onStateSelect,
  activeStateIds,
  onCyReady,
  isLoading = false,
  error,
  isNfa,
}: CanvasWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [hovered, setHovered] = useState<{
    label: string;
    isStart: boolean;
    isAccepting: boolean;
  } | null>(null);

  // Keep latest callbacks/selection in refs so the graph isn't rebuilt on every click.
  const onSelectRef = useRef(onStateSelect);
  const selectedIdRef = useRef<string | null>(selectedState?.id ?? null);
  const activeRef = useRef(activeStateIds);
  useEffect(() => {
    onSelectRef.current = onStateSelect;
    selectedIdRef.current = selectedState?.id ?? null;
    activeRef.current = activeStateIds;
  });

  // Build the graph only when the automaton itself changes.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cy = cytoscape({
      container,
      elements: withStartStub(elements),
      style: buildStyle(),
      layout: LAYOUT,
      minZoom: 0.15,
      maxZoom: 3.5,
      boxSelectionEnabled: false,
      autounselectify: true,
    });

    cy.on('tap', 'node', (evt) => {
      const id = evt.target.id() as string;
      if (id === START_STUB) return;
      onSelectRef.current(selectedIdRef.current === id ? null : id);
    });
    cy.on('tap', (evt) => {
      if (evt.target === cy) onSelectRef.current(null);
    });
    cy.on('mouseover', 'node', (evt) => {
      const d = evt.target.data();
      if (evt.target.id() === START_STUB) return;
      setHovered({
        label: d.label,
        isStart: Boolean(d.isStart),
        isAccepting: Boolean(d.isAccepting),
      });
      container.style.cursor = 'pointer';
    });
    cy.on('mouseout', 'node', () => {
      setHovered(null);
      container.style.cursor = '';
    });

    // Re-apply highlight state that existed before the rebuild.
    if (selectedIdRef.current) markSelected(cy, selectedIdRef.current);
    markActive(cy, activeRef.current);

    const ro = new ResizeObserver(() => cy.resize());
    ro.observe(container);

    cyRef.current = cy;
    onCyReady?.(cy);

    return () => {
      ro.disconnect();
      setHovered(null);
      cy.destroy();
      cyRef.current = null;
      onCyReady?.(null);
    };
    // graphKey identifies the automaton; elements is derived from it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphKey]);

  // Theme change → restyle without re-running the layout.
  useEffect(() => {
    cyRef.current?.style(buildStyle());
  }, [theme]);

  useEffect(() => {
    const cy = cyRef.current;
    if (cy) markSelected(cy, selectedState?.id ?? null);
  }, [selectedState?.id, graphKey]);

  useEffect(() => {
    const cy = cyRef.current;
    if (cy) markActive(cy, activeStateIds);
  }, [activeStateIds, graphKey]);

  const zoomBy = (factor: number) => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.animate(
      {
        zoom: {
          level: cy.zoom() * factor,
          renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 },
        },
      },
      { duration: 160 },
    );
  };

  const fit = () =>
    cyRef.current?.animate(
      { fit: { eles: cyRef.current.elements(), padding: 48 } },
      { duration: 200 },
    );

  const relayout = () => {
    cyRef.current
      ?.layout({ ...LAYOUT, animate: true, animationDuration: 300 } as cytoscape.LayoutOptions)
      .run();
  };

  const hasGraph = elements.length > 0;

  return (
    <div className="canvas" id="graph-canvas" role="tabpanel" aria-label="Automaton graph">
      <div ref={containerRef} className="canvas__cy" aria-hidden={!hasGraph} />

      {!hasGraph && !error && !isLoading && (
        <div className="canvas__empty">
          <div>
            <h2>Nothing drawn yet</h2>
            <p>Type an expression above and press Build, or pick one of the examples.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="canvas__error" role="alert">
          <IconAlert />
          <div>
            <strong>Couldn’t build this expression</strong>
            {error}
          </div>
        </div>
      )}

      {hasGraph && hovered && !selectedState && (
        <div className="floating hover-tip">
          <span className="code" style={{ fontWeight: 600 }}>
            {hovered.label}
          </span>
          {hovered.isStart && <span className="tag tag--start">start</span>}
          {hovered.isAccepting && <span className="tag tag--accept">accepting</span>}
          <span className="muted">click to inspect</span>
        </div>
      )}

      {hasGraph && selectedState && (
        <StateCard info={selectedState} isNfa={isNfa} onClose={() => onStateSelect(null)} />
      )}

      {hasGraph && (
        <>
          <div className="floating legend" aria-label="Legend">
            <span className="legend__item">
              <svg viewBox="0 0 22 14">
                <path d="M1 7h12" stroke="var(--start)" strokeWidth="2" />
                <circle
                  cx="16"
                  cy="7"
                  r="5"
                  fill="var(--sheet)"
                  stroke="var(--start)"
                  strokeWidth="1.6"
                />
              </svg>
              start state
            </span>
            <span className="legend__item">
              <svg viewBox="0 0 22 14">
                <circle
                  cx="11"
                  cy="7"
                  r="6"
                  fill="var(--accept-wash)"
                  stroke="var(--accept)"
                  strokeWidth="1.3"
                />
                <circle
                  cx="11"
                  cy="7"
                  r="3.6"
                  fill="none"
                  stroke="var(--accept)"
                  strokeWidth="1.3"
                />
              </svg>
              accepting
            </span>
            {isNfa && (
              <span className="legend__item">
                <svg viewBox="0 0 22 14">
                  <path
                    d="M1 7h20"
                    stroke="var(--graphite)"
                    strokeWidth="1.6"
                    strokeDasharray="4 3"
                  />
                </svg>
                ε move
              </span>
            )}
            <span className="legend__item">
              <svg viewBox="0 0 22 14">
                <circle cx="11" cy="7" r="6" fill="var(--highlight)" />
              </svg>
              simulator is here
            </span>
          </div>

          <div className="floating toolbar" role="toolbar" aria-label="Graph view">
            <button
              type="button"
              className="btn btn--quiet btn--sm btn--icon"
              onClick={() => zoomBy(1.25)}
              title="Zoom in"
              aria-label="Zoom in"
            >
              <IconZoomIn />
            </button>
            <button
              type="button"
              className="btn btn--quiet btn--sm btn--icon"
              onClick={() => zoomBy(0.8)}
              title="Zoom out"
              aria-label="Zoom out"
            >
              <IconZoomOut />
            </button>
            <span className="toolbar__sep" />
            <button
              type="button"
              className="btn btn--quiet btn--sm btn--icon"
              onClick={fit}
              title="Fit to view"
              aria-label="Fit graph to view"
            >
              <IconFit />
            </button>
            <button
              type="button"
              className="btn btn--quiet btn--sm btn--icon"
              onClick={relayout}
              title="Tidy layout"
              aria-label="Re-run layout"
            >
              <IconLayout />
            </button>
          </div>
        </>
      )}

      {isLoading && (
        <div className="canvas__loading" role="status">
          <div className="floating" style={{ position: 'static' }}>
            <span className="spinner" aria-hidden="true" />
            Building automata…
          </div>
        </div>
      )}
    </div>
  );
}

function markSelected(cy: cytoscape.Core, id: string | null) {
  cy.elements('.selected').removeClass('selected');
  if (!id) return;
  const node = cy.getElementById(id);
  if (node.empty()) return;
  node.addClass('selected');
  node.outgoers('edge').addClass('selected');
}

function markActive(cy: cytoscape.Core, ids: readonly string[]) {
  cy.nodes('.sim-active').removeClass('sim-active');
  for (const id of ids) cy.getElementById(id).addClass('sim-active');
}

function StateCard({
  info,
  isNfa,
  onClose,
}: {
  info: StateInfo;
  isNfa: boolean;
  onClose: () => void;
}) {
  return (
    <aside className="floating state-card" aria-label={`State ${info.label}`}>
      <div className="state-card__head">
        <span className="state-card__id">{info.label}</span>
        {info.isStart && <span className="tag tag--start">start</span>}
        {info.isAccepting && <span className="tag tag--accept">accepting</span>}
        <button
          type="button"
          className="btn btn--quiet btn--sm btn--icon state-card__close"
          onClick={onClose}
          aria-label="Close state details"
        >
          <IconClose />
        </button>
      </div>

      {info.nfaStates && (
        <div className="state-card__section">
          <div className="state-card__label">Stands for these NFA states</div>
          <div className="state-card__subset">{info.nfaStates}</div>
        </div>
      )}

      <div className="state-card__section">
        <div className="state-card__label">Leaving this state</div>
        {info.transitions.length === 0 ? (
          <div className="muted">
            No outgoing transitions{isNfa ? '.' : ' — any further input is rejected here.'}
          </div>
        ) : (
          <ul className="delta-list">
            {info.transitions.map((t, i) => (
              <li key={i}>
                δ({info.label}, <span className="sym">{t.symbol}</span>) = {t.target}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
