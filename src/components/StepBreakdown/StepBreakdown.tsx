/**
 * Automata Studio — Production Step Breakdown Panel (Light Theme)
 * Educational log showing intermediate algorithmic outputs:
 * 1. AST Representation & Postfix (RPN)
 * 2. ε-Closure Sets & Subset Construction Powersets
 * 3. DFA Equivalence Partition Passes (Hopcroft Minimization)
 */

import React, { useState, useMemo } from 'react';
import {
  Network,
  Layers,
  Cpu,
  ArrowRight,
  ListTree,
} from 'lucide-react';
import type { ConversionResult, ConversionStep } from '../../engine/pipeline';
import type { RegexNode } from '../../engine/parser/ast';
import type { NFA } from '../../engine/nfa/types';
import type { DFA } from '../../engine/dfa/types';
import { epsilonClosure } from '../../engine/nfa/epsilonClosure';

interface StepBreakdownProps {
  result: ConversionResult | null;
}

export const StepBreakdown: React.FC<StepBreakdownProps> = ({ result }) => {
  const [activeSection, setActiveSection] = useState<'ast' | 'closure' | 'partitions' | 'steps'>('closure');

  if (!result || !result.success) {
    return (
      <div className="p-8 text-center text-slate-400 font-mono text-xs">
        Compile a regular expression to inspect intermediate algorithmic transformations.
      </div>
    );
  }

  const { ast, postfix, withConcat, regex, nfa, dfa, minimizedDfa, steps } = result;

  return (
    <div className="flex flex-col h-full overflow-hidden select-none bg-white">
      {/* ─── Top Sub-Tab Navigation ─── */}
      <div className="p-2 border-b border-slate-200 bg-slate-50 flex items-center gap-1 overflow-x-auto flex-shrink-0">
        {[
          { id: 'closure' as const, label: 'ε-Closures & Subsets', icon: Network },
          { id: 'partitions' as const, label: 'DFA Partitions', icon: Layers },
          { id: 'ast' as const, label: 'AST & Postfix', icon: ListTree },
          { id: 'steps' as const, label: 'Pipeline Steps', icon: Cpu },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveSection(id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
              activeSection === id
                ? 'bg-white text-indigo-700 border border-slate-200 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ─── Section Content ─── */}
      <div className="flex-1 overflow-y-auto p-4 select-text">
        {activeSection === 'closure' && <EpsilonClosureSection nfa={nfa} dfa={dfa} />}
        {activeSection === 'partitions' && <PartitionPassesSection dfa={dfa} minimizedDfa={minimizedDfa} />}
        {activeSection === 'ast' && <ASTSection ast={ast} postfix={postfix} withConcat={withConcat} regex={regex} />}
        {activeSection === 'steps' && <PipelineStepsSection steps={steps} />}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 1. ε-Closure & Subset Construction Powersets
// ---------------------------------------------------------------------------

function EpsilonClosureSection({ nfa, dfa }: { nfa: NFA; dfa: DFA }) {
  const singleClosures = useMemo(() => {
    return nfa.states.map((s) => {
      const closure = Array.from(epsilonClosure(new Set([s.id]), nfa)).sort((a, b) => a - b);
      return {
        stateId: s.id,
        closure,
      };
    });
  }, [nfa]);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
          NFA State ε-Closures
        </h4>
        <p className="text-[11px] text-slate-500 mt-0.5">
          For each NFA state <span className="font-mono text-slate-700 font-semibold">s</span>, the set of all states reachable solely by traversing ε-transitions:
        </p>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <table className="w-full text-xs font-mono">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px]">
            <tr>
              <th className="py-1.5 px-3 text-left w-20">NFA State</th>
              <th className="py-1.5 px-3 text-left">ε-closure(s)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {singleClosures.map(({ stateId, closure }) => (
              <tr key={stateId} className="hover:bg-slate-50">
                <td className="py-1.5 px-3 text-sky-700 font-semibold">q{stateId}</td>
                <td className="py-1.5 px-3 text-slate-800">
                  {'{' + closure.map((id) => `q${id}`).join(', ') + '}'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pt-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
          Subset Construction (DFA State Mappings)
        </h4>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Each DFA state corresponds to an immutable subset of NFA states:
        </p>
      </div>

      <div className="space-y-2">
        {dfa.states.map((ds) => {
          const nfaList = Array.from(ds.nfaStates).sort((a, b) => a - b);
          return (
            <div
              key={ds.id}
              className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/80 flex items-start justify-between gap-3 font-mono text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-700">{ds.id}</span>
                {ds.isStart && (
                  <span className="text-[10px] text-sky-700 bg-sky-50 border border-sky-200 px-1 py-0.2 rounded font-sans font-semibold">
                    Start
                  </span>
                )}
                {ds.isAccepting && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded font-sans font-semibold">
                    Accepting
                  </span>
                )}
              </div>
              <div className="text-slate-600 text-right">
                <span className="text-slate-400">Representing: </span>
                <span className="text-slate-800 font-semibold">
                  {'{' + nfaList.map((id) => `q${id}`).join(', ') + '}'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. DFA Minimization Partition Refinement Passes (Hopcroft)
// ---------------------------------------------------------------------------

function PartitionPassesSection({ dfa, minimizedDfa }: { dfa: DFA; minimizedDfa: DFA }) {
  const partitionHistory = useMemo(() => {
    const alphabet = [...dfa.alphabet].sort();
    const accepting = dfa.states.filter((s) => s.isAccepting).map((s) => s.id);
    const nonAccepting = dfa.states.filter((s) => !s.isAccepting).map((s) => s.id);

    // Initial partition P0
    const p0: Array<{ label: string; states: string[] }> = [];
    if (nonAccepting.length > 0) p0.push({ label: 'Non-Accepting (Q \\ F)', states: nonAccepting });
    if (accepting.length > 0) p0.push({ label: 'Accepting (F)', states: accepting });

    return {
      alphabet,
      p0,
      reduction: {
        originalStates: dfa.states.length,
        minimizedStates: minimizedDfa.states.length,
        mergedCount: dfa.states.length - minimizedDfa.states.length,
      },
    };
  }, [dfa, minimizedDfa]);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
          Hopcroft DFA Equivalence Partitions
        </h4>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Minimization refines state partitions by distinguishing states based on output behaviors:
        </p>
      </div>

      {/* Reduction summary banner */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs font-mono">
        <div>
          <span className="text-slate-500">Original DFA: </span>
          <span className="text-indigo-700 font-bold">{partitionHistory.reduction.originalStates} states</span>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        <div>
          <span className="text-slate-500">Minimized DFA: </span>
          <span className="text-emerald-700 font-bold">{partitionHistory.reduction.minimizedStates} states</span>
        </div>
        <div className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-sans font-medium">
          {partitionHistory.reduction.mergedCount > 0
            ? `${partitionHistory.reduction.mergedCount} redundant states merged`
            : 'Already minimal'}
        </div>
      </div>

      {/* Step P0: 0-Equivalence */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-mono flex items-center justify-center font-bold">
            0
          </span>
          <span>Initial 0-Equivalence Partition (P₀ = {'{F, Q \\ F}'})</span>
        </div>

        <div className="space-y-1.5 pl-6">
          {partitionHistory.p0.map((group, idx) => (
            <div key={idx} className="p-2 bg-slate-50 border border-slate-200 rounded font-mono text-xs flex items-center justify-between">
              <span className="text-slate-600 text-[11px] font-sans">{group.label}:</span>
              <span className="text-slate-900 font-bold">
                {'{' + group.states.join(', ') + '}'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step P_Final: Canonical Minimized States */}
      <div className="space-y-2 pt-2">
        <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono flex items-center justify-center font-bold">
            *
          </span>
          <span>Final Merged States (Canonical Equivalence Classes)</span>
        </div>

        <div className="space-y-1.5 pl-6">
          {minimizedDfa.states.map((ms) => (
            <div key={ms.id} className="p-2 bg-slate-50 border border-slate-200 rounded font-mono text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-emerald-700 font-bold">{ms.id}</span>
                {ms.isStart && <span className="text-[10px] text-sky-700 font-sans font-semibold">→ Start</span>}
                {ms.isAccepting && <span className="text-[10px] text-emerald-700 font-sans font-semibold">* Accept</span>}
              </div>
              <span className="text-slate-500 text-[11px]">
                Alphabet transitions: {minimizedDfa.alphabet.size}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. AST & Postfix (RPN)
// ---------------------------------------------------------------------------

function ASTSection({
  ast,
  postfix,
  withConcat,
  regex,
}: {
  ast: RegexNode;
  postfix: string;
  withConcat: string;
  regex: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
          Grammar & Parser AST
        </h4>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Transformation pipeline from raw regular expression to strongly typed Abstract Syntax Tree:
        </p>
      </div>

      <div className="space-y-2 font-mono text-xs">
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-slate-500 text-[11px] block font-sans mb-1">1. User Infix Input:</span>
          <span className="text-slate-900 font-bold">{regex}</span>
        </div>

        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-slate-500 text-[11px] block font-sans mb-1">2. Explicit Concatenation (• inserted):</span>
          <span className="text-amber-700 font-bold">{withConcat}</span>
        </div>

        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-slate-500 text-[11px] block font-sans mb-1">3. Postfix Notation (Shunting-yard RPN):</span>
          <span className="text-indigo-700 font-bold">{postfix}</span>
        </div>
      </div>

      <div className="pt-2">
        <span className="text-xs font-semibold text-slate-800 block mb-2 uppercase tracking-wider">
          Abstract Syntax Tree (AST Hierarchy)
        </span>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg overflow-x-auto font-mono text-xs">
          <ASTNodeView node={ast} depth={0} />
        </div>
      </div>
    </div>
  );
}

function ASTNodeView({ node, depth }: { node: RegexNode; depth: number }) {
  const indent = '  '.repeat(depth);

  switch (node.type) {
    case 'literal':
      return (
        <div className="text-emerald-700">
          <span className="text-slate-400">{indent}├─ </span>
          <span className="text-slate-600">Literal(</span>
          <span className="text-amber-700 font-bold">&quot;{node.value}&quot;</span>
          <span className="text-slate-600">)</span>
        </div>
      );
    case 'star':
      return (
        <div>
          <div className="text-indigo-700">
            <span className="text-slate-400">{indent}├─ </span>
            <span className="font-bold">KleeneStar (*)</span>
          </div>
          <ASTNodeView node={node.child} depth={depth + 1} />
        </div>
      );
    case 'concat':
      return (
        <div>
          <div className="text-sky-700">
            <span className="text-slate-400">{indent}├─ </span>
            <span className="font-bold">Concatenation (•)</span>
          </div>
          <ASTNodeView node={node.left} depth={depth + 1} />
          <ASTNodeView node={node.right} depth={depth + 1} />
        </div>
      );
    case 'union':
      return (
        <div>
          <div className="text-rose-700">
            <span className="text-slate-400">{indent}├─ </span>
            <span className="font-bold">Union (|)</span>
          </div>
          <ASTNodeView node={node.left} depth={depth + 1} />
          <ASTNodeView node={node.right} depth={depth + 1} />
        </div>
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// 4. Pipeline Steps Log
// ---------------------------------------------------------------------------

function PipelineStepsSection({ steps }: { steps: ConversionStep[] }) {
  return (
    <div className="space-y-3">
      {steps.map((step, idx) => (
        <div
          key={idx}
          className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3 hover:border-slate-300 transition-colors"
        >
          <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-mono font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
            {idx + 1}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-800">{step.name}</div>
            <div className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{step.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
