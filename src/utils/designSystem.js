/**
 * Design System for Quanta Trading Terminal
 * Single source of truth for visual identity: colors, typography, spacing, shadows
 */

export const COLORS = {
  // Backgrounds
  bg: {
    darkest: "#050505",    // Page background
    dark: "#0a0a0a",       // Secondary background
    card: "#111111",       // Card background
    cardAlt: "#0f1419",    // Alternative card background (subtle contrast)
    cardHover: "#151515",  // Card hover state
    overlay: "rgba(0,0,0,.4)",
  },

  // Text
  text: {
    primary: "#f1f5f9",    // High contrast text
    secondary: "#cbd5e1",  // Muted text
    muted: "#94a3b8",      // Very muted text
    disabled: "rgba(148,163,184,.5)",
  },

  // Semantic
  success: "#22c55e",      // Green/bullish
  danger: "#ef4444",       // Red/bearish
  warning: "#f59e0b",      // Orange/caution
  info: "#3b82f6",         // Blue/information
  
  // Brand
  primary: "#4facfe",      // Main brand color (blue)
  accent: "#22c55e",       // Accent color (green)
  accentMuted: "rgba(74,222,128,.1)",   // Accent background
  primaryMuted: "rgba(79,172,254,.12)", // Primary background

  // Borders & Dividers
  border: {
    light: "rgba(255,255,255,.06)",
    medium: "rgba(255,255,255,.1)",
    strong: "rgba(255,255,255,.15)",
  },
};

export const TYPOGRAPHY = {
  // Font families
  families: {
    body: "'Inter', system-ui, -apple-system, sans-serif",
    heading: "'Space Grotesk', 'Inter', system-ui, sans-serif",
  },

  // Font sizes (px)
  sizes: {
    xs: 10,
    sm: 11,
    base: 12,
    md: 13,
    lg: 14,
    xl: 16,
    "2xl": 18,
    "3xl": 24,
    "4xl": 32,
    "5xl": 42,
  },

  // Font weights
  weights: {
    thin: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
};

export const RADIUS = {
  none: 0,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};

export const SHADOWS = {
  none: "none",
  xs: "0 1px 2px rgba(0,0,0,.4)",
  sm: "0 2px 4px rgba(0,0,0,.4)",
  md: "0 4px 8px rgba(0,0,0,.4)",
  lg: "0 8px 16px rgba(0,0,0,.4)",
  xl: "0 16px 32px rgba(0,0,0,.5)",
};

export const BORDERS = {
  // Subtle border (most cards)
  card: `1px solid ${COLORS.border.light}`,
  // Medium border (interactive elements)
  interactive: `1px solid ${COLORS.border.medium}`,
  // Strong border (active states)
  active: `1px solid ${COLORS.primary}`,
};

/**
 * Pre-built component styles combining multiple design tokens
 */
export const COMPONENT_STYLES = {
  // Card base
  card: {
    background: COLORS.bg.card,
    border: BORDERS.card,
    borderRadius: RADIUS.lg,
    padding: `${SPACING.lg}px ${SPACING.lg}px`,
    transition: "all .15s ease-out",
  },

  // Card with accent left border
  cardAccent: {
    background: COLORS.bg.card,
    border: BORDERS.card,
    borderRadius: RADIUS.lg,
    borderLeft: `3px solid ${COLORS.primary}`,
    padding: `${SPACING.lg}px ${SPACING.lg}px`,
    transition: "all .15s ease-out",
  },

  // Minimal stat card
  cardStat: {
    background: COLORS.bg.cardAlt,
    border: BORDERS.card,
    borderRadius: RADIUS.md,
    padding: `${SPACING.md}px ${SPACING.lg}px`,
  },

  // Button base
  button: {
    fontFamily: TYPOGRAPHY.families.body,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontSize: TYPOGRAPHY.sizes.sm,
    transition: "all .15s ease-out",
    cursor: "pointer",
  },

  // Input base
  input: {
    fontFamily: TYPOGRAPHY.families.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    padding: `${SPACING.sm}px ${SPACING.md}px`,
    background: COLORS.bg.cardAlt,
    border: BORDERS.card,
    borderRadius: RADIUS.md,
    color: COLORS.text.primary,
    outline: "none",
  },
};

/**
 * Helper function to combine base styles with overrides
 */
export function withStyle(base, overrides = {}) {
  return { ...base, ...overrides };
}
