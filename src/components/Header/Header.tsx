/**
 * Automata Studio — Production Header & Control Bar (Light Theme)
 * Top navigation with real-time validated regex input, quick operators, compilation trigger, and export actions.
 */

import React, { useRef } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Play,
  FileCode,
  Image as ImageIcon,
  RotateCcw,
  Code2,
} from 'lucide-react';
import type cytoscape from 'cytoscape';
import type { ActiveTab } from '../../types';
import type { DFA } from '../../engine/dfa/types';
import type { NFA } from '../../engine/nfa/types';
import { exportGraphAsPNG, exportDFAtoJSON, exportNFAtoJSON } from '../../utils/export';

interface HeaderProps {
  regex: string;
  onRegexChange: (val: string) => void;
  onCompile: () => void;
  onReset: () => void;
  validationMessage: string | null;
  validationIsError: boolean;
  isLoading: boolean;
  activeTab: ActiveTab;
  nfa: NFA | null;
  dfa: DFA | null;
  minimizedDfa: DFA | null;
  getCy: () => cytoscape.Core | null;
}

const PRESET_EXAMPLES = [
  { label: '(a|b)*abb', value: '(a|b)*abb' },
  { label: 'a(b|c)*', value: 'a(b|c)*' },
  { label: '(0|1)*101', value: '(0|1)*101' },
  { label: 'a*b*', value: 'a*b*' },
];

const OPERATORS = [
  { symbol: '|', label: 'Union' },
  { symbol: '*', label: 'Kleene Star' },
  { symbol: '(', label: 'Open Paren' },
  { symbol: ')', label: 'Close Paren' },
  { symbol: 'ε', label: 'Epsilon' },
];

export const Header: React.FC<HeaderProps> = ({
  regex,
  onRegexChange,
  onCompile,
  onReset,
  validationMessage,
  validationIsError,
  isLoading,
  activeTab,
  nfa,
  dfa,
  minimizedDfa,
  getCy,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOperatorInsert = (symbol: string) => {
    if (!inputRef.current) {
      onRegexChange(regex + symbol);
      return;
    }
    const input = inputRef.current;
    const start = input.selectionStart ?? regex.length;
    const end = input.selectionEnd ?? regex.length;
    const nextValue = regex.slice(0, start) + symbol + regex.slice(end);
    onRegexChange(nextValue);

    setTimeout(() => {
      input.focus();
      const pos = start + symbol.length;
      input.setSelectionRange(pos, pos);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !validationIsError && !isLoading && regex.trim()) {
      onCompile();
    }
  };

  const safeFilename = (regex.trim() || 'automaton').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 24);

  const handleExportPNG = () => {
    const cy = getCy();
    if (!cy) return;
    const prefix = activeTab.toUpperCase();
    exportGraphAsPNG(cy, `${prefix}_${safeFilename}.png`);
  };

  const handleExportJSON = () => {
    if (activeTab === 'nfa' && nfa) {
      exportNFAtoJSON(nfa);
    } else if (activeTab === 'dfa' && dfa) {
      exportDFAtoJSON(dfa, 'DFA');
    } else if (activeTab === 'minimized' && minimizedDfa) {
      exportDFAtoJSON(minimizedDfa, 'MinimizedDFA');
    }
  };

  const canExport = Boolean((activeTab === 'nfa' && nfa) || (activeTab === 'dfa' && dfa) || (activeTab === 'minimized' && minimizedDfa));

  return (
    <header className="h-14 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 flex items-center justify-between gap-4 z-40 select-none flex-shrink-0 shadow-xs">
      {/* ─── Left Brand & Title ─── */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-800 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center">
          <Code2 className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-slate-900">
              Automata<span className="text-indigo-600">Studio</span>
            </span>
            <span className="text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-medium">
              Zero-Backend TOC Engine
            </span>
          </div>
        </div>
      </div>

      {/* ─── Center: Regex Input Bar & Operator Pallet ─── */}
      <div className="flex-1 max-w-2xl flex items-center gap-2">
        <div className="relative flex-1 group">
          <input
            ref={inputRef}
            type="text"
            value={regex}
            onChange={(e) => onRegexChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter regular expression (e.g. (a|b)*abb)..."
            spellCheck={false}
            autoComplete="off"
            className={`w-full h-9 bg-slate-50/90 border rounded-md pl-3 pr-24 font-mono text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-150 focus:bg-white ${
              validationIsError
                ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                : regex.trim()
                ? 'border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
            }`}
          />

          {/* Validation Status Icon + Monospace Tooltip */}
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
            {regex.trim() && (
              validationIsError ? (
                <div className="flex items-center gap-1 text-[11px] text-rose-600 font-sans" title={validationMessage ?? 'Syntax error'}>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                  <span className="hidden xl:inline text-[10px] font-mono max-w-[120px] truncate">{validationMessage}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-sans" title="Valid regular expression">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden xl:inline text-[10px] font-mono">Valid</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Quick Insert Operators */}
        <div className="hidden md:flex items-center gap-1">
          {OPERATORS.map((op) => (
            <button
              key={op.symbol}
              type="button"
              onClick={() => handleOperatorInsert(op.symbol)}
              title={`Insert ${op.label} (${op.symbol})`}
              className="operator-btn"
            >
              {op.symbol}
            </button>
          ))}
        </div>

        {/* Compile Trigger */}
        <button
          type="button"
          onClick={onCompile}
          disabled={isLoading || validationIsError || !regex.trim()}
          className="btn-primary h-9 flex-shrink-0"
          title="Compile Regex into NFA, DFA, and Minimized DFA"
        >
          {isLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Compiling...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current text-white" />
              <span>Compile</span>
            </>
          )}
        </button>

        {/* Reset Input */}
        <button
          type="button"
          onClick={onReset}
          title="Clear expression"
          className="btn-ghost h-9 px-2 text-slate-500 hover:text-slate-800"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ─── Right: Preset Examples & Export Actions ─── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Preset quick pills */}
        <div className="hidden lg:flex items-center gap-1.5 border-r border-slate-200 pr-2.5">
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-amber-500" />
            Presets:
          </span>
          {PRESET_EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => {
                onRegexChange(ex.value);
                setTimeout(onCompile, 10);
              }}
              className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-slate-100 hover:bg-indigo-50 border border-slate-200 text-slate-600 hover:text-indigo-700 transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleExportPNG}
            disabled={!canExport}
            className="btn-ghost h-8 text-xs font-mono"
            title="Export high-resolution PNG image of the current diagram"
          >
            <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">PNG</span>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            disabled={!canExport}
            className="btn-ghost h-8 text-xs font-mono"
            title="Export standard automata JSON definition"
          >
            <FileCode className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">JSON</span>
          </button>
        </div>
      </div>
    </header>
  );
};
