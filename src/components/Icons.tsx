/**
 * Small inline icon set (24×24, stroked) so the UI has no runtime icon dependency.
 */

import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function make(paths: ReactNode) {
  return function Icon(props: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        {...props}
      >
        {paths}
      </svg>
    );
  };
}

export const IconAlert = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5M12 16.2v.1" />
  </>,
);
export const IconCheck = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.2 12.3 2.6 2.6 5-5.4" />
  </>,
);
export const IconPending = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="2.5" fill="currentColor" />
  </>,
);
export const IconReject = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m9 9 6 6M15 9l-6 6" />
  </>,
);
export const IconBuild = make(
  <>
    <path d="M4 12h3M17 12h3" />
    <path d="m5.8 9.8 2.2 2.2-2.2 2.2" />
    <circle cx="12" cy="12" r="4" />
  </>,
);
export const IconClear = make(
  <>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
    <path d="M3.5 4v4.5H8" />
  </>,
);
export const IconImage = make(
  <>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m20.5 16-4.5-4.5L6 19.5" />
  </>,
);
export const IconBraces = make(
  <>
    <path d="M8 4.5c-2 0-2.5 1-2.5 2.5v2.5c0 1.2-.8 2.5-2 2.5 1.2 0 2 1.3 2 2.5V17c0 1.5.5 2.5 2.5 2.5" />
    <path d="M16 4.5c2 0 2.5 1 2.5 2.5v2.5c0 1.2.8 2.5 2 2.5-1.2 0-2 1.3-2 2.5V17c0 1.5-.5 2.5-2.5 2.5" />
  </>,
);
export const IconMoon = make(<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />);
export const IconSun = make(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
  </>,
);
export const IconZoomIn = make(
  <>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m20 20-4.8-4.8M10.5 7.8v5.4M7.8 10.5h5.4" />
  </>,
);
export const IconZoomOut = make(
  <>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m20 20-4.8-4.8M7.8 10.5h5.4" />
  </>,
);
export const IconFit = make(
  <path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15" />,
);
export const IconLayout = make(
  <>
    <circle cx="5.5" cy="12" r="2.5" />
    <circle cx="18.5" cy="6" r="2.5" />
    <circle cx="18.5" cy="18" r="2.5" />
    <path d="M8 11 16 7M8 13l8 4" />
  </>,
);
export const IconPlay = make(
  <path d="M7 4.8v14.4a.8.8 0 0 0 1.2.7l11.4-7.2a.8.8 0 0 0 0-1.4L8.2 4.1a.8.8 0 0 0-1.2.7Z" />,
);
export const IconPause = make(<path d="M8 5v14M16 5v14" />);
export const IconStep = make(
  <>
    <path d="M5 5.5v13l9-6.5-9-6.5Z" />
    <path d="M18.5 5v14" />
  </>,
);
export const IconRewind = make(
  <>
    <path d="M19 5.5v13l-9-6.5 9-6.5Z" />
    <path d="M5.5 5v14" />
  </>,
);
export const IconRun = make(
  <>
    <rect x="2.5" y="7" width="19" height="10" rx="1.5" />
    <path d="M8.5 7v10M15.5 7v10" />
  </>,
);
export const IconTable = make(
  <>
    <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
    <path d="M3.5 9.5h17M9.5 4.5v15" />
  </>,
);
export const IconSteps = make(
  <>
    <circle cx="6" cy="6" r="2" />
    <circle cx="6" cy="18" r="2" />
    <path d="M6 8v8M11 6h9M11 18h9M11 12h6" />
  </>,
);
export const IconClose = make(<path d="m6 6 12 12M18 6 6 18" />);
