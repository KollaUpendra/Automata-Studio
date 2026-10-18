/**
 * Automata Studio — Production String Simulator Component (Light Theme)
 * Step-by-step execution engine with tape visualizer, playback controls, and graph node synchronization.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  StepForward,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import type { DFA } from '../../engine/dfa/types';
import { traceDFA, type DFASimulationTrace } from '../../engine/dfa/dfaUtils';

interface StringSimulatorProps {
  dfa: DFA | null;
  onActiveStateChange?: (stateId: string | null) => void;
}

export const StringSimulator: React.FC<StringSimulatorProps> = ({
  dfa,
  onActiveStateChange,
}) => {
  const [inputString, setInputString] = useState<string>('abb');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(800);
  const timerRef = useRef<number | null>(null);

  // Compute full trace using the deterministic transition function
  const trace: DFASimulationTrace | null = React.useMemo(() => {
    if (!dfa) return null;
    return traceDFA(dfa, inputString);
  }, [dfa, inputString]);

  // Current active state ID based on current step index
  const activeStateId = React.useMemo(() => {
    if (!trace || !dfa) return null;
    return trace.statesVisited[currentStepIndex] ?? null;
  }, [trace, dfa, currentStepIndex]);

  // Sync active state back to parent (which informs Cytoscape canvas)
  useEffect(() => {
    onActiveStateChange?.(activeStateId);
  }, [activeStateId, onActiveStateChange]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Step Forward action
  const handleStepForward = useCallback(() => {
    if (!trace) return;
    setCurrentStepIndex((prev) => {
      const maxSteps = trace.statesVisited.length - 1;
      if (prev >= maxSteps) {
        setIsPlaying(false);
        return prev;
      }
      return prev + 1;
    });
  }, [trace]);

  // Reset to initial state
  const handleReset = useCallback(() => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentStepIndex(0);
  }, []);

  // Play / Pause toggle
  const togglePlay = () => {
    if (!trace) return;

    if (isPlaying) {
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      // If already at the end, restart from beginning
      if (currentStepIndex >= trace.statesVisited.length - 1) {
        setCurrentStepIndex(0);
      }
      setIsPlaying(true);
    }
  };

  // Play loop effect
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      if (!trace) return;
      setCurrentStepIndex((prev) => {
        const maxSteps = trace.statesVisited.length - 1;
        if (prev >= maxSteps) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playbackSpeedMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, trace, playbackSpeedMs]);

  if (!dfa) {
    return (
      <div className="p-8 text-center text-slate-400 font-mono text-xs">
        Compile a regular expression to test strings against the generated automaton.
      </div>
    );
  }

  const alphabetList = Array.from(dfa.alphabet).sort().join(', ');
  const maxSteps = trace ? trace.statesVisited.length - 1 : 0;
  const isFinished = currentStepIndex >= maxSteps;
  const isAcceptedAtEnd = trace?.accepted && isFinished;
  const isRejectedAtEnd = !trace?.accepted && isFinished;

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4 bg-white">
      {/* ─── Header Info ─── */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
            Deterministic String Simulator
          </span>
          <span className="text-[10px] font-mono text-slate-500 font-semibold">
            Σ = {'{'}{alphabetList || '∅'}{'}'}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Step through evaluation character-by-character to witness state transitions along the input tape.
        </p>
      </div>

      {/* ─── Input Row ─── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputString}
            onChange={(e) => {
              setInputString(e.target.value);
              setCurrentStepIndex(0);
              setIsPlaying(false);
            }}
            placeholder="Enter input string (e.g. abb)..."
            spellCheck={false}
            className="w-full h-9 bg-slate-50 border border-slate-200 rounded-md pl-3 pr-16 font-mono text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
          />
          <button
            type="button"
            onClick={() => {
              setInputString('');
              setCurrentStepIndex(0);
              setIsPlaying(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 hover:bg-slate-300 text-slate-700 transition-colors"
            title="Test empty string ε"
          >
            ε (empty)
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-md p-1 h-9 flex-shrink-0">
          <Clock className="w-3 h-3 text-slate-400 ml-1" />
          {[
            { label: '1x', ms: 800 },
            { label: '2x', ms: 400 },
          ].map((sp) => (
            <button
              key={sp.label}
              type="button"
              onClick={() => setPlaybackSpeedMs(sp.ms)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                playbackSpeedMs === sp.ms
                  ? 'bg-white text-indigo-700 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {sp.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Tape Visualization ─── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-600">
          <span>Input Tape:</span>
          <span>
            Head: <span className="text-indigo-600 font-bold">{currentStepIndex} / {inputString.length}</span>
          </span>
        </div>

        <div className="flex items-center gap-1 p-2 bg-slate-50 border border-slate-200 rounded-lg overflow-x-auto min-h-[52px]">
          {inputString.length === 0 ? (
            <div className="text-center w-full text-slate-400 font-mono text-xs py-1">
              [ Empty String <span className="text-amber-600 font-bold">ε</span> ]
            </div>
          ) : (
            inputString.split('').map((char, idx) => {
              const isCurrent = idx === currentStepIndex - 1;
              const isPast = idx < currentStepIndex - 1;

              return (
                <div
                  key={idx}
                  className={`w-8 h-9 rounded flex flex-col items-center justify-center font-mono text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 text-white border-2 border-indigo-400 shadow-md shadow-indigo-500/20 scale-105'
                      : isPast
                      ? 'bg-slate-200 text-slate-600 border border-slate-300'
                      : 'bg-white text-slate-800 border border-slate-200'
                  }`}
                >
                  <span>{char}</span>
                  <span className="text-[9px] font-normal opacity-70">{idx}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Interactive Playback Controls ─── */}
      <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg">
        <div className="flex items-center gap-1.5">
          {/* Play/Pause */}
          <button
            type="button"
            onClick={togglePlay}
            className={`btn-primary h-8 px-3 text-xs ${
              isPlaying ? 'bg-amber-600 hover:bg-amber-700' : ''
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isFinished ? 'Replay' : 'Play'}</span>
              </>
            )}
          </button>

          {/* Step Forward */}
          <button
            type="button"
            onClick={handleStepForward}
            disabled={isFinished || isPlaying}
            className="btn-ghost h-8 text-xs disabled:opacity-40"
            title="Advance 1 step"
          >
            <StepForward className="w-3.5 h-3.5" />
            <span>Step</span>
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            className="btn-ghost h-8 text-xs text-slate-600 hover:text-slate-900"
            title="Rewind to start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Current State Pill */}
        <div className="text-[11px] font-mono text-slate-600">
          State: <span className="text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">{activeStateId ?? '—'}</span>
        </div>
      </div>

      {/* ─── Verdict Banner ─── */}
      {trace && (
        <div
          className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
            isAcceptedAtEnd
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : isRejectedAtEnd
              ? 'bg-rose-50 border-rose-300 text-rose-800'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {isAcceptedAtEnd ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : isRejectedAtEnd ? (
              <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse flex-shrink-0" />
            )}

            <div>
              <div className="text-xs font-semibold">
                {isAcceptedAtEnd
                  ? 'Input Accepted'
                  : isRejectedAtEnd
                  ? 'Input Rejected'
                  : 'Evaluating Tape...'}
              </div>
              <div className="text-[11px] opacity-80 font-mono">
                {isAcceptedAtEnd
                  ? `Machine halted in accepting state (${trace.finalState}).`
                  : isRejectedAtEnd
                  ? `Halted in non-accepting state (${trace.finalState}).`
                  : `Currently at state ${activeStateId}. Advance step to continue.`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Trace Execution Log ─── */}
      {trace && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-mono text-slate-600 uppercase tracking-wider font-semibold">
            Execution Path History
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {trace.path.length === 0 ? (
              <div className="text-[11px] font-mono text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
                Start state: <span className="text-indigo-700 font-bold">{trace.finalState}</span> (no symbols consumed)
              </div>
            ) : (
              trace.path.map((item, idx) => {
                const isExecuted = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex - 1;

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-mono border transition-colors ${
                      isCurrent
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold'
                        : isExecuted
                        ? 'bg-slate-50 border-slate-200 text-slate-700'
                        : 'bg-white border-slate-100 text-slate-400'
                    }`}
                  >
                    <span className="text-slate-400 text-[10px]">#{idx + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{item.from}</span>
                      <span className="text-slate-400">──(</span>
                      <span className="text-amber-600 font-bold">{item.symbol}</span>
                      <span className="text-slate-400">)──&gt;</span>
                      <span className="font-semibold text-indigo-700">{item.to}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {isCurrent ? 'Current' : isExecuted ? 'Passed' : 'Pending'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
