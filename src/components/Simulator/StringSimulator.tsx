/**
 * StringSimulator (remount with a new `key` when the automaton changes to reset the run) — runs an input string through the automaton on screen,
 * one symbol at a time, highlighting the current state(s) on the graph.
 *
 * On the NFA tab it tracks the full set of active states (after ε-closure);
 * on the DFA tabs it follows the single deterministic path.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { DFA } from '../../engine/dfa/types';
import type { NFA } from '../../engine/nfa/types';
import { traceDFA } from '../../engine/dfa/dfaUtils';
import { traceNFA } from '../../engine/nfa/nfaSimulation';
import {
  IconCheck,
  IconPause,
  IconPending,
  IconPlay,
  IconReject,
  IconRewind,
  IconStep,
} from '../Icons';

interface StringSimulatorProps {
  mode: 'nfa' | 'dfa';
  nfa: NFA | null;
  dfa: DFA | null;
  onActiveStatesChange: (stateIds: string[]) => void;
}

interface UnifiedTrace {
  accepted: boolean;
  /** Active node ids after reading 0..n symbols (graph ids). */
  ids: string[][];
  /** Display labels for the same. */
  labels: string[];
  /** Index of the symbol that could not be read, if the run got stuck. */
  stuckAt: number | null;
}

const SPEEDS = [
  { label: '½×', ms: 1200 },
  { label: '1×', ms: 700 },
  { label: '2×', ms: 350 },
];

function unify(
  mode: 'nfa' | 'dfa',
  nfa: NFA | null,
  dfa: DFA | null,
  input: string,
): UnifiedTrace | null {
  if (mode === 'nfa' && nfa) {
    const t = traceNFA(nfa, input);
    return {
      accepted: t.accepted,
      ids: t.statesVisited.map((set) => set.map(String)),
      labels: t.statesVisited.map((set) => `{${set.map((s) => `s${s}`).join(', ')}}`),
      stuckAt: t.stuckAt ?? null,
    };
  }
  if (mode === 'dfa' && dfa) {
    const t = traceDFA(dfa, input);
    const stuck = t.statesVisited.length - 1 < input.length;
    return {
      accepted: t.accepted,
      ids: t.statesVisited.map((s) => [s]),
      labels: t.statesVisited,
      stuckAt: stuck ? t.statesVisited.length - 1 : null,
    };
  }
  return null;
}

export function StringSimulator({ mode, nfa, dfa, onActiveStatesChange }: StringSimulatorProps) {
  const [input, setInput] = useState('abb');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(700);

  const automaton = mode === 'nfa' ? nfa : dfa;
  const alphabet = useMemo(() => (automaton ? [...automaton.alphabet].sort() : []), [automaton]);
  const trace = useMemo(() => unify(mode, nfa, dfa, input), [mode, nfa, dfa, input]);

  const lastStep = trace ? trace.ids.length - 1 : 0;
  const finished = step >= lastStep;
  const running = playing && !finished;

  // Publish the highlighted state(s) to the graph.
  const activeIds = trace?.ids[Math.min(step, lastStep)];
  useEffect(() => {
    onActiveStatesChange(activeIds ?? []);
  }, [activeIds, onActiveStatesChange]);

  // Clear highlight when the simulator unmounts (another panel opened).
  useEffect(() => () => onActiveStatesChange([]), [onActiveStatesChange]);

  // Playback loop: advance one symbol per tick until the run finishes.
  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => setStep((s) => s + 1), speed);
    return () => window.clearTimeout(id);
  }, [running, step, speed]);

  if (!automaton || !trace) {
    return <div className="panel__empty">Build an expression to try strings against it.</div>;
  }

  const unknown = [...new Set([...input].filter((ch) => !automaton.alphabet.has(ch)))];
  const current = Math.min(step, lastStep);
  const stuckHere = trace.stuckAt !== null && finished;

  const play = () => {
    if (finished) setStep(0);
    setPlaying(true);
  };

  let verdict: { cls: string; icon: ReactNode; title: string; body: ReactNode };
  if (!finished) {
    verdict = {
      cls: '',
      icon: <IconPending />,
      title: `Read ${current} of ${input.length} symbol${input.length === 1 ? '' : 's'}`,
      body: (
        <>
          Now in <span className="hl">{trace.labels[current]}</span>. Step or play to continue.
        </>
      ),
    };
  } else if (trace.accepted) {
    verdict = {
      cls: 'verdict--accept',
      icon: <IconCheck />,
      title: input.length ? `Accepted “${input}”` : 'Accepts the empty string ε',
      body: (
        <>
          Finished in <span className="hl">{trace.labels[current]}</span>
          {mode === 'nfa' ? ', which contains an accepting state.' : ', an accepting state.'}
        </>
      ),
    };
  } else if (stuckHere) {
    const sym = input[trace.stuckAt!];
    verdict = {
      cls: 'verdict--reject',
      icon: <IconReject />,
      title: `Rejected “${input}”`,
      body: (
        <>
          No transition on <strong className="code">{sym}</strong> from{' '}
          <span className="hl">{trace.labels[current]}</span> (symbol {trace.stuckAt! + 1}), so the
          machine stops.
        </>
      ),
    };
  } else {
    verdict = {
      cls: 'verdict--reject',
      icon: <IconReject />,
      title: input.length ? `Rejected “${input}”` : 'Rejects the empty string ε',
      body: (
        <>
          Finished in <span className="hl">{trace.labels[current]}</span>
          {mode === 'nfa' ? ', which has no accepting state.' : ', which is not accepting.'}
        </>
      ),
    };
  }

  return (
    <div className="panel">
      <p className="panel__intro">
        {mode === 'nfa'
          ? 'The NFA can be in several states at once. After each symbol it moves every active state, then follows ε-moves.'
          : 'The DFA follows exactly one transition per symbol. Watch the highlighted state on the graph.'}
      </p>

      <label htmlFor="sim-input" className="h3" style={{ display: 'block' }}>
        Input string
      </label>
      <div className="sim-input">
        <input
          id="sim-input"
          className="field"
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value.replace(/\s/g, ''));
            setStep(0);
            setPlaying(false);
          }}
          placeholder="leave empty to test ε"
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
        />
      </div>
      <p className={`sim-note ${unknown.length ? 'sim-note--warn' : ''}`}>
        {unknown.length
          ? `${unknown.map((c) => `“${c}”`).join(', ')} ${unknown.length === 1 ? 'is' : 'are'} not in the alphabet {${alphabet.join(', ')}}.`
          : `Alphabet Σ = {${alphabet.join(', ')}}`}
      </p>

      <div className="tape" aria-label="Input tape">
        {input.length === 0 ? (
          <div className="tape__empty">Empty string ε</div>
        ) : (
          [...input].map((ch, i) => {
            const isStuck = stuckHere && i === trace.stuckAt;
            const cls = isStuck
              ? 'tape__cell--stuck'
              : i === current && !finished
                ? 'tape__cell--head'
                : i < current
                  ? 'tape__cell--read'
                  : '';
            return (
              <div
                key={i}
                className={`tape__cell ${cls}`}
                aria-current={i === current && !finished ? 'step' : undefined}
              >
                {ch}
                <span className="tape__index">{i + 1}</span>
              </div>
            );
          })
        )}
      </div>

      <div className="transport">
        {running ? (
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => setPlaying(false)}
          >
            <IconPause /> Pause
          </button>
        ) : (
          <button type="button" className="btn btn--primary btn--sm" onClick={play}>
            <IconPlay /> {finished && current > 0 ? 'Replay' : 'Play'}
          </button>
        )}
        <button
          type="button"
          className="btn btn--sm"
          onClick={() => setStep((s) => Math.min(s + 1, lastStep))}
          disabled={finished || running}
        >
          <IconStep /> Step
        </button>
        <button
          type="button"
          className="btn btn--sm"
          onClick={() => setStep(lastStep)}
          disabled={finished || running}
          title="Jump to the result"
        >
          Run to end
        </button>
        <button
          type="button"
          className="btn btn--quiet btn--sm btn--icon"
          onClick={() => {
            setPlaying(false);
            setStep(0);
          }}
          disabled={step === 0}
          title="Back to the start"
          aria-label="Back to the start"
        >
          <IconRewind />
        </button>
        <div className="speed" role="group" aria-label="Playback speed">
          {SPEEDS.map((s) => (
            <button
              key={s.ms}
              type="button"
              aria-pressed={speed === s.ms}
              onClick={() => setSpeed(s.ms)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`verdict ${verdict.cls}`} role="status" aria-live="polite">
        {verdict.icon}
        <div>
          <div className="verdict__title">{verdict.title}</div>
          <div className="verdict__body">{verdict.body}</div>
        </div>
      </div>

      <ol className="trace" aria-label="Run so far">
        <li data-done="true" data-current={current === 0}>
          <span className="trace__n">0</span>
          <span>start in {trace.labels[0]}</span>
        </li>
        {trace.labels.slice(1).map((label, i) => (
          <li key={i} data-done={i + 1 <= current} data-current={i + 1 === current}>
            <span className="trace__n">{i + 1}</span>
            <span>
              read <span className="trace__sym">{input[i]}</span> → {label}
            </span>
          </li>
        ))}
        {trace.stuckAt !== null && (
          <li data-done={finished} data-current={false}>
            <span className="trace__n">{trace.stuckAt + 1}</span>
            <span>
              read <span className="trace__sym">{input[trace.stuckAt]}</span> → no move, rejected
            </span>
          </li>
        )}
      </ol>
    </div>
  );
}
