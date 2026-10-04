/**
 * ExplanationPanel — educational step-by-step conversion explanation.
 */

import type { ConversionStep } from '../../engine/pipeline';

interface ExplanationPanelProps {
  steps: ConversionStep[];
  regex: string;
  postfix: string;
  withConcat: string;
}

export function ExplanationPanel({ steps, regex, postfix, withConcat }: ExplanationPanelProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 mb-4">
        <InfoRow label="Input" value={regex} mono />
        <InfoRow label="With concat ops" value={withConcat} mono />
        <InfoRow label="Postfix (RPN)" value={postfix} mono />
      </div>

      <div className="space-y-2">
        {steps.map((step, idx) => (
          <StepCard key={idx} step={step} index={idx + 1} />
        ))}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 text-xs">
      <span className="text-slate-500 font-medium min-w-[90px] flex-shrink-0">{label}</span>
      <code
        className={`font-mono text-indigo-300 bg-slate-900/60 border border-slate-800 px-2 py-1 rounded break-all ${mono ? '' : ''}`}
      >
        {value}
      </code>
    </div>
  );
}

function StepCard({ step, index }: { step: ConversionStep; index: number }) {
  return (
    <div className="flex gap-3 bg-slate-900/30 border border-slate-800/60 rounded-lg p-3 hover:border-slate-700/60 transition-colors">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-900/60 border border-indigo-700/60 text-indigo-300 text-xs font-bold flex items-center justify-center">
        {index}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-200 mb-0.5">{step.name}</p>
        <p className="text-xs text-slate-400 leading-relaxed">{step.detail}</p>
      </div>
    </div>
  );
}
