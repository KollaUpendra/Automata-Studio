/**
 * StateDetails — panel showing information about a selected state.
 */

interface StateTransition {
  symbol: string;
  target: string;
}

interface StateInfo {
  id: string;
  label: string;
  isStart: boolean;
  isAccepting: boolean;
  nfaStates: string;
  transitions: StateTransition[];
}

interface StateDetailsProps {
  stateInfo: StateInfo | null;
}

export function StateDetails({ stateInfo }: StateDetailsProps) {
  if (!stateInfo) {
    return (
      <div className="flex items-center justify-center h-full min-h-[80px] text-slate-600 text-xs text-center px-4">
        <div>
          <svg
            className="w-5 h-5 mx-auto mb-1 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeWidth="1.5" strokeLinecap="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path
              strokeWidth="1.5"
              strokeLinecap="round"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          Click a state in the graph to inspect it
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      {/* State ID */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs border-2
            ${
              stateInfo.isStart && stateInfo.isAccepting
                ? 'bg-purple-900/40 border-purple-500 text-purple-300'
                : stateInfo.isAccepting
                  ? 'bg-emerald-900/40 border-emerald-500 text-emerald-300'
                  : stateInfo.isStart
                    ? 'bg-blue-900/40 border-blue-500 text-blue-300'
                    : 'bg-slate-800 border-slate-600 text-slate-300'
            }`}
          >
            {stateInfo.label}
          </div>
          <div>
            <p className="font-semibold text-slate-200">State {stateInfo.id}</p>
            <div className="flex gap-1.5 mt-0.5">
              {stateInfo.isStart && (
                <span className="text-xs bg-blue-900/40 text-blue-300 border border-blue-800 px-1.5 py-0.5 rounded">
                  Start
                </span>
              )}
              {stateInfo.isAccepting && (
                <span className="text-xs bg-emerald-900/40 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded">
                  Accepting
                </span>
              )}
              {!stateInfo.isStart && !stateInfo.isAccepting && (
                <span className="text-xs text-slate-500">Normal</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* NFA States */}
      {stateInfo.nfaStates && (
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1">NFA States</p>
          <p className="font-mono text-xs bg-slate-900/60 border border-slate-700 rounded px-2 py-1.5 text-slate-300">
            {stateInfo.nfaStates}
          </p>
        </div>
      )}

      {/* Transitions */}
      <div>
        <p className="text-xs text-slate-500 font-medium mb-1.5">Transitions</p>
        {stateInfo.transitions.length === 0 ? (
          <p className="text-xs text-slate-600 italic">No outgoing transitions</p>
        ) : (
          <div className="space-y-1">
            {stateInfo.transitions.map((t, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-slate-900/40 border border-slate-800 rounded px-2 py-1.5"
              >
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-900/20 border border-amber-800/40 px-1.5 py-0.5 rounded">
                  {t.symbol}
                </span>
                <svg
                  className="w-3 h-3 text-slate-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
                <span className="font-mono text-xs text-indigo-300 font-semibold">{t.target}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
