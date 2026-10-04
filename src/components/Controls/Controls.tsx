/**
 * Controls component — floating control toolbar for graph manipulation (zoom, fit, center, reset).
 */

interface ControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onCenter: () => void;
  onResetLayout?: () => void;
}

export function Controls({ onZoomIn, onZoomOut, onFit, onCenter, onResetLayout }: ControlsProps) {
  return (
    <div
      className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-lg border border-slate-700/80 shadow-lg"
      role="toolbar"
      aria-label="Graph display controls"
    >
      <button
        id="btn-zoom-in"
        onClick={onZoomIn}
        className="graph-btn"
        title="Zoom In (+)"
        aria-label="Zoom in"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </button>

      <button
        id="btn-zoom-out"
        onClick={onZoomOut}
        className="graph-btn"
        title="Zoom Out (-)"
        aria-label="Zoom out"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </button>

      <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

      <button
        id="btn-fit"
        onClick={onFit}
        className="graph-btn"
        title="Fit to View"
        aria-label="Fit graph to view"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      </button>

      <button
        id="btn-center"
        onClick={onCenter}
        className="graph-btn"
        title="Center Graph"
        aria-label="Center graph"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
      </button>

      {onResetLayout && (
        <button
          id="btn-relayout"
          onClick={onResetLayout}
          className="graph-btn"
          title="Re-run Dagre Layout"
          aria-label="Re-run layout"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default Controls;
