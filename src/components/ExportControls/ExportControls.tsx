/**
 * ExportControls — PNG and JSON export buttons.
 */

import { useRef } from 'react';
import type cytoscape from 'cytoscape';
import {
  exportGraphAsPNG,
  exportDFAtoJSON,
  exportNFAtoJSON,
  downloadFile,
} from '../../utils/export';
import type { DFA } from '../../engine/dfa/types';
import type { NFA } from '../../engine/nfa/types';
import type { ActiveTab } from '../../hooks/useAutomata';

interface ExportControlsProps {
  activeTab: ActiveTab;
  dfa: DFA | null;
  minimizedDfa: DFA | null;
  nfa: NFA | null;
  getCy: () => cytoscape.Core | null;
  regex: string;
}

export function ExportControls({
  activeTab,
  dfa,
  minimizedDfa,
  nfa,
  getCy,
  regex,
}: ExportControlsProps) {
  const exportingRef = useRef(false);

  const safeFilename = regex.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);

  const handleExportPNG = () => {
    if (exportingRef.current) return;
    exportingRef.current = true;
    try {
      const cy = getCy();
      if (!cy) return;
      const tabLabel = activeTab === 'nfa' ? 'NFA' : activeTab === 'dfa' ? 'DFA' : 'MinDFA';
      exportGraphAsPNG(cy, `${tabLabel}_${safeFilename}.png`);
    } finally {
      exportingRef.current = false;
    }
  };

  const handleExportJSON = () => {
    let json = '';
    let filename = '';

    if (activeTab === 'nfa' && nfa) {
      json = exportNFAtoJSON(nfa);
      filename = `NFA_${safeFilename}.json`;
    } else if (activeTab === 'dfa' && dfa) {
      json = exportDFAtoJSON(dfa, 'DFA');
      filename = `DFA_${safeFilename}.json`;
    } else if (activeTab === 'minimized' && minimizedDfa) {
      json = exportDFAtoJSON(minimizedDfa, 'MinimizedDFA');
      filename = `MinDFA_${safeFilename}.json`;
    }

    if (json) {
      downloadFile(json, filename, 'application/json');
    }
  };

  const hasData =
    (activeTab === 'nfa' && nfa) ||
    (activeTab === 'dfa' && dfa) ||
    (activeTab === 'minimized' && minimizedDfa);

  if (!hasData) return null;

  return (
    <div className="flex gap-2">
      <button
        id="btn-export-png"
        onClick={handleExportPNG}
        className="export-btn"
        title="Export current graph as PNG"
        aria-label="Export graph as PNG"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9h18M9 21V9" />
          <circle cx="16" cy="16" r="2" />
        </svg>
        PNG
      </button>
      <button
        id="btn-export-json"
        onClick={handleExportJSON}
        className="export-btn"
        title="Export automaton as JSON"
        aria-label="Export automaton as JSON"
      >
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        JSON
      </button>
    </div>
  );
}
