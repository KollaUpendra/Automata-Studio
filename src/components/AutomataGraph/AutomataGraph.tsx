/**
 * AutomataGraph component — renders the automaton using Cytoscape.js with dagre layout.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import type { CytoscapeElement } from '../../adapters/cytoscapeAdapter';
import { Controls } from '../Controls/Controls';

// Register dagre layout once
try {
  cytoscape.use(dagre);
} catch {
  // Already registered
}

interface StateInfo {
  id: string;
  label: string;
  isStart: boolean;
  isAccepting: boolean;
  nfaStates: string;
  transitions: Array<{ symbol: string; target: string }>;
}

interface AutomataGraphProps {
  elements: CytoscapeElement[];
  onStateSelect?: (info: StateInfo | null) => void;
  onCyReady?: (cy: cytoscape.Core) => void;
}

export function AutomataGraph({ elements, onStateSelect, onCyReady }: AutomataGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);

  const buildCytoscape = useCallback(() => {
    if (!containerRef.current) return;

    // Destroy existing instance
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        // Base node style
        {
          selector: 'node',
          style: {
            'background-color': '#1e2a3a',
            'border-color': '#4a9eff',
            'border-width': 2,
            color: '#e2e8f0',
            'font-size': '13px',
            'font-family': 'Inter, system-ui, sans-serif',
            'font-weight': 600,
            label: 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            width: 52,
            height: 52,
            'text-outline-width': 0,
          },
        },
        // Start state
        {
          selector: 'node.start',
          style: {
            'background-color': '#1a3a5c',
            'border-color': '#60a5fa',
            'border-width': 3,
          },
        },
        // Accepting state — double border via overlay
        {
          selector: 'node.accepting',
          style: {
            'background-color': '#1a3a2a',
            'border-color': '#34d399',
            'border-width': 3,
            'border-style': 'double',
          },
        },
        // Start + accepting
        {
          selector: 'node.start.accepting',
          style: {
            'background-color': '#1a3a40',
            'border-color': '#a78bfa',
            'border-width': 3,
            'border-style': 'double',
          },
        },
        // Selected state
        {
          selector: 'node:selected, node.highlighted',
          style: {
            'background-color': '#2d3f5a',
            'border-color': '#f59e0b',
            'border-width': 4,
            'overlay-color': '#f59e0b',
            'overlay-opacity': 0.1,
            'overlay-padding': 4,
          },
        },
        // Base edge style
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#334155',
            'target-arrow-color': '#334155',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-size': '11px',
            'font-family': 'Inter, monospace, sans-serif',
            'font-weight': 600,
            color: '#94a3b8',
            'text-background-color': '#0f1117',
            'text-background-opacity': 0.9,
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
            'text-rotation': 'autorotate',
          },
        },
        // Self-loop edges
        {
          selector: 'edge[source = target]',
          style: {
            'curve-style': 'bezier',
            'loop-direction': '-45deg',
            'loop-sweep': '-45deg',
          },
        },
        // Highlighted edges (outgoing from selected node)
        {
          selector: 'edge.highlighted',
          style: {
            'line-color': '#f59e0b',
            'target-arrow-color': '#f59e0b',
            color: '#f59e0b',
            width: 3,
          },
        },
        // Epsilon edges (NFA)
        {
          selector: 'edge[label = "ε"]',
          style: {
            'line-style': 'dashed',
            'line-dash-pattern': [6, 3],
            'line-color': '#475569',
            'target-arrow-color': '#475569',
            color: '#64748b',
          },
        },
      ],
      layout: {
        name: 'dagre',
        rankDir: 'LR',
        nodeSep: 60,
        rankSep: 100,
        edgeSep: 20,
        animate: true,
        animationDuration: 400,
        fit: true,
        padding: 40,
      } as cytoscape.LayoutOptions,
      wheelSensitivity: 0.3,
      minZoom: 0.3,
      maxZoom: 3,
    });

    // Node click handler
    cy.on('tap', 'node', (event) => {
      const node = event.target;
      const nodeId = node.id() as string;

      // Clear previous highlights
      cy.elements().removeClass('highlighted');

      if (selectedState === nodeId) {
        // Deselect
        setSelectedState(null);
        onStateSelect?.(null);
        return;
      }

      setSelectedState(nodeId);

      // Highlight node and its outgoing edges
      node.addClass('highlighted');
      node.connectedEdges('[source = "' + nodeId + '"]').addClass('highlighted');

      // Build state info
      const data = node.data() as {
        id: string;
        label: string;
        isStart: boolean;
        isAccepting: boolean;
        nfaStates?: string;
      };

      const outgoingTransitions: Array<{ symbol: string; target: string }> = [];
      cy.edges('[source = "' + nodeId + '"]').forEach((edge) => {
        const edgeData = edge.data() as { label: string; target: string };
        outgoingTransitions.push({
          symbol: edgeData.label,
          target: edgeData.target,
        });
      });

      const info: StateInfo = {
        id: data.id,
        label: data.label,
        isStart: data.isStart ?? false,
        isAccepting: data.isAccepting ?? false,
        nfaStates: data.nfaStates ?? '',
        transitions: outgoingTransitions,
      };

      onStateSelect?.(info);
    });

    // Background click — deselect
    cy.on('tap', (event) => {
      if (event.target === cy) {
        cy.elements().removeClass('highlighted');
        setSelectedState(null);
        onStateSelect?.(null);
      }
    });

    cyRef.current = cy;
    onCyReady?.(cy);
  }, [elements, onStateSelect, onCyReady, selectedState]);

  useEffect(() => {
    buildCytoscape();
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements]);

  const handleFit = () => {
    cyRef.current?.fit(undefined, 40);
  };

  const handleCenter = () => {
    cyRef.current?.center();
  };

  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.2);
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() / 1.2);
    }
  };

  const handleResetLayout = () => {
    if (cyRef.current) {
      const layout = cyRef.current.layout({
        name: 'dagre',
        rankDir: 'LR',
        nodeSep: 60,
        rankSep: 80,
        edgeSep: 30,
        animate: true,
        animationDuration: 300,
      } as cytoscape.LayoutOptions);
      layout.run();
      cyRef.current.fit(undefined, 40);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Graph controls */}
      <div className="absolute top-3 right-3 z-10">
        <Controls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFit={handleFit}
          onCenter={handleCenter}
          onResetLayout={handleResetLayout}
        />
      </div>

      {/* Cytoscape container */}
      <div
        ref={containerRef}
        className="w-full h-full bg-graph-bg rounded-lg"
        role="img"
        aria-label="Automata graph visualization"
      />

      {/* Empty state */}
      {elements.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center opacity-30">
            <svg
              className="mx-auto mb-3 w-12 h-12 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
              <path strokeWidth="1.5" d="M12 8v4l3 3" />
            </svg>
            <p className="text-slate-400 text-sm font-medium">Enter a regex and click Convert</p>
          </div>
        </div>
      )}
    </div>
  );
}
