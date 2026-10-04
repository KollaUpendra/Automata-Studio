/**
 * ValidationMessage component — displays live syntax validation feedback.
 */

interface ValidationMessageProps {
  message: string | null;
  isError: boolean;
}

export function ValidationMessage({ message, isError }: ValidationMessageProps) {
  if (!message) {
    return <div className="min-h-[1.25rem]" aria-hidden="true" />;
  }

  return (
    <div className="min-h-[1.25rem] flex items-center" role="status" aria-live="polite">
      <p
        className={`text-xs flex items-center gap-1.5 font-medium transition-all duration-150 ${
          isError ? 'text-red-400' : 'text-emerald-400'
        }`}
      >
        {isError ? (
          <svg
            className="w-3.5 h-3.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
            <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
          </svg>
        ) : (
          <svg
            className="w-3.5 h-3.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
        <span>{message}</span>
      </p>
    </div>
  );
}

export default ValidationMessage;
