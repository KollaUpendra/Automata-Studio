/**
 * Top bar — brand, export actions and theme toggle.
 */

import { IconBraces, IconImage, IconMoon, IconSun } from '../Icons';
import type { Theme } from '../../hooks/useTheme';

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  canExport: boolean;
  onExportPNG: () => void;
  onExportJSON: () => void;
}

export function BrandMark() {
  return (
    <svg className="brand__mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="var(--ink)" />
      <path d="M3 16h6" stroke="var(--highlight)" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M7.5 13.4 10 16l-2.5 2.6"
        fill="none"
        stroke="var(--highlight)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="19" cy="16" r="8" fill="none" stroke="var(--sheet)" strokeWidth="2.2" />
      <circle cx="19" cy="16" r="4.6" fill="var(--highlight)" />
    </svg>
  );
}

export function Header({
  theme,
  onToggleTheme,
  canExport,
  onExportPNG,
  onExportJSON,
}: HeaderProps) {
  return (
    <header className="topbar">
      <div className="brand">
        <BrandMark />
        <span className="brand__name">Automata Studio</span>
        <span className="brand__tagline">Regular expressions, drawn as machines</span>
      </div>

      <div className="topbar__actions">
        <button
          type="button"
          className="btn btn--quiet"
          onClick={onExportPNG}
          disabled={!canExport}
          title="Download the graph on screen as a PNG image"
        >
          <IconImage />
          <span className="btn__text">PNG</span>
        </button>
        <button
          type="button"
          className="btn btn--quiet"
          onClick={onExportJSON}
          disabled={!canExport}
          title="Download the automaton on screen as JSON"
        >
          <IconBraces />
          <span className="btn__text">JSON</span>
        </button>
        <button
          type="button"
          className="btn btn--quiet btn--icon"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
        >
          {theme === 'dark' ? <IconSun /> : <IconMoon />}
        </button>
      </div>
    </header>
  );
}
