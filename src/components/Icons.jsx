import { COLORS } from "../utils/designSystem";

/**
 * Page navigation icons
 * Minimal, distinctive SVG icons to replace Unicode symbols
 */

const iconProps = { viewBox: "0 0 24 24", width: 16, height: 16, fill: "currentColor", strokeWidth: 1.5 };

export const Icons = {
  // Market / Chart
  Market: (props) => (
    <svg {...iconProps} {...props} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h4m4-4h4m4 8h4M3 6h18M3 18h18" />
    </svg>
  ),

  // Compare
  Compare: (props) => (
    <svg {...iconProps} {...props} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v12m6-6v6m-9-4h12" />
    </svg>
  ),

  // Portfolio
  Portfolio: (props) => (
    <svg {...iconProps} {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path stroke="currentColor" strokeLinecap="round" d="M12 7v5l3 2" />
    </svg>
  ),

  // Screener / Filter
  Screener: (props) => (
    <svg {...iconProps} {...props} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M6 12h12M8 18h8" />
    </svg>
  ),

  // Strategies
  Strategies: (props) => (
    <svg {...iconProps} {...props} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m-6-3l6 6 6-6" />
    </svg>
  ),

  // News
  News: (props) => (
    <svg {...iconProps} {...props} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v12H4V4zm0 4h16M4 10h16" />
    </svg>
  ),

  // Alerts / Bell
  Alerts: (props) => (
    <svg {...iconProps} {...props} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),

  // Learn
  Learn: (props) => (
    <svg {...iconProps} {...props} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 12s4.5 5.747 10 5.747c5.5 0 10-4.748 10-5.747S17.5 6.253 12 6.253z" />
    </svg>
  ),

  // Chevron / Arrow
  ChevronRight: (props) => (
    <svg {...iconProps} {...props} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ),

  // Settings / Gear
  Settings: (props) => (
    <svg {...iconProps} {...props} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M12 9a3 3 0 100 6 3 3 0 000-6z" />
    </svg>
  ),

  // Plus
  Plus: (props) => (
    <svg {...iconProps} {...props} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),

  // X / Close
  X: (props) => (
    <svg {...iconProps} {...props} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),

  // Check
  Check: (props) => (
    <svg {...iconProps} {...props} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),

  // TrendingUp
  TrendingUp: (props) => (
    <svg {...iconProps} {...props} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7H5v12h12V9m0-2l6 6m-6-6l-6 6" />
    </svg>
  ),
};

/**
 * Icon component wrapper - renders any icon with consistent styling
 */
export function Icon({ type, size = "md", color = "inherit", ...props }) {
  const IconComponent = Icons[type];
  if (!IconComponent) return null;

  const sizeMap = { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 };
  return <IconComponent style={{ width: sizeMap[size], height: sizeMap[size], color }} {...props} />;
}
