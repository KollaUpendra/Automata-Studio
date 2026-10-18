/**
 * Automata Studio — Production Canvas Workspace (Light Theme)
 * Full-height Cytoscape.js canvas with Dagre hierarchical layout, tab switcher, floating controls, and state tooltip inspector.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crosshair,
  RotateCcw,
} from 'lucide-react';
import type { CytoscapeElement, ActiveTab, StateInfo } from '../../types';

// Register dagre layout once
try {
  cytoscape.use(dagre);
} catch {
  // Already registered
}

interface CanvasWorkspaceProps {
  elements: CytoscapeElement[];
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  nfaStateCount?: number;
  dfaStateCount?: number;
  minDfaStateCount?: number;
  selectedState: StateInfo | null;
  onStateSelect: (info: StateInfo | null) => void;
  activeSimulationState?: string | null;
  onCyReady?: (cy: cytoscape.Core) => void;
  isLoading?: boolean;
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  elements,
  activeTab,
  onTabChange,
  nfaStateCount,
  dfaStateCount,
  minDfaStateCount,
  selectedState,
  onStateSelect,
  activeSimulationState,
  onCyReady,
  isLoading = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{ id: string; label: string; isAccepting: boolean; isStart: boolean } | null>(null);

  // Initialize and update Cytoscape instance
  const initCytoscape = useCallback(() => {
    if (!containerRef.current) return;

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        // Base Node Style - Crisp White with Slate Border
        {
          selector: 'node',
          style: {
            'background-color': '#ffffff', // pure white
            'border-color': '#475569',     // slate-600
            'border-width': 2,
            color: '#0f172a',              // slate-900
            'font-size': '12px',
            'font-family': 'JetBrains Mono, ui-monospace, monospace',
            'font-weight': 600,
            label: 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            width: 48,
            height: 48,
            'text-outline-width': 0,
            'transition-property': 'background-color, border-color, width, height',
            'transition-duration': 0.18,
          },
        },
        // Start state - High-contrast Sky Blue
        {
          selector: 'node.start',
          style: {
            'background-color': '#f0f9ff', // sky-50
            'border-color': '#0284c7',     // sky-600
            'border-width': 2.5,
          },
        },
        // Accepting state - Double Ring Emerald
        {
          selector: 'node.accepting',
          style: {
            'background-color': '#ecfdf5', // emerald-50
            'border-color': '#059669',     // emerald-600
            'border-width': 3,
            'border-style': 'double',
          },
        },
        // Start + Accepting state
        {
          selector: 'node.start.accepting',
          style: {
            'background-color': '#f0fdf4',
            'border-color': '#059669',
            'border-width': 3,
            'border-style': 'double',
          },
        },
        // Active Simulation Node (Indigo Glow)
        {
          selector: 'node.sim-active',
          style: {
            'background-color': '#4f46e5', // indigo-600
            'border-color': '#6366f1',     // indigo-500
            'border-width': 3.5,
            color: '#ffffff',
            'overlay-color': '#6366f1',
            'overlay-opacity': 0.25,
            'overlay-padding': 6,
          },
        },
        // Selected node (Amber neon)
        {
          selector: 'node.highlighted, node:selected',
          style: {
            'background-color': '#fef3c7', // amber-100
            'border-color': '#d97706',     // amber-600
            'border-width': 3,
            'overlay-color': '#f59e0b',
            'overlay-opacity': 0.15,
            'overlay-padding': 6,
          },
        },
        // Base edge style
        {
          selector: 'edge',
          style: {
            width: 1.75,
            'line-color': '#475569',       // slate-600
            'target-arrow-color': '#475569',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-size': '11px',
            'font-family': 'JetBrains Mono, monospace',
            'font-weight': 600,
            color: '#1e293b',
            'text-background-color': '#ffffff',
            'text-background-opacity': 0.95,
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
            'text-border-color': '#cbd5e1',
            'text-border-width': 1,
            'text-border-opacity': 0.8,
            'text-rotation': 'autorotate',
            'arrow-scale': 0.9,
          },
        },
        // Self-loop edges
        {
          selector: 'edge[source = target]',
          style: {
            'curve-style': 'bezier',
            'loop-direction': '-45deg',
            'loop-sweep': '-50deg',
          },
        },
        // Highlighted edges outgoing from selected node
        {
          selector: 'edge.highlighted',
          style: {
            'line-color': '#d97706',
            'target-arrow-color': '#d97706',
            color: '#b45309',
            width: 2.5,
          },
        },
        // Epsilon edges (NFA) - dashed slate
        {
          selector: 'edge[label = "ε"]',
          style: {
            'line-style': 'dashed',
            'line-dash-pattern': [5, 3],
            'line-color': '#64748b',
            'target-arrow-color': '#64748b',
            color: '#64748b',
          },
        },
      ],
      layout: {
        name: 'dagre',
        rankDir: 'LR',
        nodeSep: 55,
        rankSep: 90,
        edgeSep: 20,
        animate: true,
        animationDuration: 350,
        fit: true,
        padding: 40,
      } as cytoscape.LayoutOptions,
      wheelSensitivity: 0.25,
      minZoom: 0.2,
      maxZoom: 3.5,
    });

    // Node click handler
    cy.on('tap', 'node', (event) => {
      const node = event.target;
      const nodeId = node.id() as string;

      cy.elements().removeClass('highlighted');

      if (selectedState?.id === nodeId) {
        onStateSelect(null);
        return;
      }

      node.addClass('highlighted');
      node.connectedEdges('[source = "' + nodeId + '"]').addClass('highlighted');

      const data = node.data() as {
        id: string;
        label: string;
        isStart?: boolean;
        isAccepting?: boolean;
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

      onStateSelect({
        id: data.id,
        label: data.label,
        isStart: data.isStart ?? false,
        isAccepting: data.isAccepting ?? false,
        nfaStates: data.nfaStates ?? '',
        transitions: outgoingTransitions,
      });
    });

    // Node hover tooltips
    cy.on('mouseover', 'node', (event) => {
      const node = event.target;
      const data = node.data();
      setHoveredNode({
        id: data.id,
        label: data.label,
        isStart: Boolean(data.isStart),
        isAccepting: Boolean(data.isAccepting),
      });
    });

    cy.on('mouseout', 'node', () => {
      setHoveredNode(null);
    });

    // Background click deselects
    cy.on('tap', (event) => {
      if (event.target === cy) {
        cy.elements().removeClass('highlighted');
        onStateSelect(null);
      }
    });

    cyRef.current = cy;
    onCyReady?.(cy);
  }, [elements, onStateSelect, onCyReady, selectedState?.id]);

  useEffect(() => {
    initCytoscape();
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [initCytoscape]);

  // Synchronize active simulation state node highlighting
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.nodes().removeClass('sim-active');
    if (activeSimulationState) {
      const targetNode = cy.getElementById(activeSimulationState);
      if (targetNode && targetNode.length > 0) {
        targetNode.addClass('sim-active');
      }
    }
  }, [activeSimulationState]);

  // Toolbar Actions
  const handleZoomIn = () => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.zoom({ level: cy.zoom() * 1.25, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
  };

  const handleZoomOut = () => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.zoom({ level: cy.zoom() * 0.8, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
  };

  const handleFit = () => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.fit(undefined, 35);
  };

  const handleCenter = () => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.center();
  };

  const handleResetLayout = () => {
    const cy = cyRef.current;
    if (!cy) return;
    const layout = cy.layout({
      name: 'dagre',
      rankDir: 'LR',
      nodeSep: 55,
      rankSep: 90,
      edgeSep: 20,
      animate: true,
      animationDuration: 300,
      fit: true,
      padding: 40,
    } as cytoscape.LayoutOptions);
    layout.run();
  };

  const tabs: Array<{ id: ActiveTab; label: string; count?: number; badgeColor: string }> = [
    { id: 'nfa', label: 'Thompson NFA', count: nfaStateCount, badgeColor: 'text-sky-700 bg-sky-50 border-sky-200' },
    { id: 'dfa', label: 'Subset DFA', count: dfaStateCount, badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
    { id: 'minimized', label: 'Minimized DFA', count: minDfaStateCount, badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  ];

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-50 overflow-hidden select-none">
      {/* ─── Top Level Tab Switcher Bar ─── */}
      <div className="h-11 border-b border-slate-200 bg-white/80 px-4 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 font-mono text-[10px] rounded-full border ${tab.badgeColor}`}>
                    {tab.count}Q
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend pills */}
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-600 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-sky-600 bg-sky-50" />
            <span>Start</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-600 border-double bg-emerald-50" />
            <span>Accepting</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 border-b border-dashed border-slate-500" />
            <span>ε-transition</span>
          </div>
        </div>
      </div>

      {/* ─── Cytoscape Canvas Container ─── */}
      <div className="relative flex-1 w-full h-full canvas-grid overflow-hidden">
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Floating Controls Overlay */}
        <div
          className="absolute bottom-4 left-4 z-20 flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-md"
          role="toolbar"
          aria-label="Canvas zoom and layout controls"
        >
          <button type="button" onClick={handleZoomIn} className="toolbar-btn" title="Zoom In (+)">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={handleZoomOut} className="toolbar-btn" title="Zoom Out (-)">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />
          <button type="button" onClick={handleFit} className="toolbar-btn" title="Fit to View">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={handleCenter} className="toolbar-btn" title="Center View">
            <Crosshair className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={handleResetLayout} className="toolbar-btn" title="Reset Layout (LR Dagre)">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hover State Tooltip */}
        {hoveredNode && !selectedState && (
          <div className="absolute top-4 left-4 z-20 px-2.5 py-1.5 bg-white/95 border border-slate-200 rounded-md shadow-md pointer-events-none flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-indigo-700">{hoveredNode.label}</span>
            {hoveredNode.isStart && <span className="text-[10px] text-sky-700 font-mono font-medium">→ Start</span>}
            {hoveredNode.isAccepting && <span className="text-[10px] text-emerald-700 font-mono font-medium">* Accept</span>}
          </div>
        )}

        {/* Selected State Inspector Floating Pill */}
        {selectedState && (
          <div className="absolute top-4 left-4 z-20 max-w-sm bg-white/95 backdrop-blur-md border border-amber-300 rounded-lg p-3 shadow-xl">
            <div className="flex items-center justify-between gap-3 mb-1.5 border-b border-slate-100 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold font-mono text-amber-700">{selectedState.id}</span>
                {selectedState.isStart && <span className="text-[10px] text-sky-700 bg-sky-50 border border-sky-200 px-1 rounded">Start</span>}
                {selectedState.isAccepting && <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 rounded">Accepting</span>}
              </div>
              <button
                type="button"
                onClick={() => onStateSelect(null)}
                className="text-slate-400 hover:text-slate-700 text-xs px-1"
                title="Deselect"
              >
                ✕
              </button>
            </div>

            {selectedState.nfaStates && (
              <div className="text-[11px] font-mono text-slate-600 mb-2">
                <span className="text-slate-500">Subset ε-closure: </span>
                <span className="text-indigo-700 font-semibold">{selectedState.nfaStates}</span>
              </div>
            )}

            <div className="text-[11px] font-mono">
              <span className="text-slate-500 block mb-1">Outgoing Transitions:</span>
              {selectedState.transitions.length === 0 ? (
                <span className="text-slate-400 italic">No outgoing transitions (dead/sink state)</span>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {selectedState.transitions.map((t, idx) => (
                    <span key={idx} className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 text-[11px]">
                      δ({selectedState.id}, <span className="text-amber-700 font-bold">{t.symbol || 'ε'}</span>) → <span className="text-indigo-700 font-bold">{t.target}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-30 bg-slate-50/70 backdrop-blur-xs flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-xs font-mono text-indigo-700">
              <div className="w-3.5 h-3.5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
              <span>Rendering Automata Graph...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
