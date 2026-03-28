import { COLORS, RADIUS, COMPONENT_STYLES, withStyle } from "../utils/designSystem";

/**
 * Glass component with multiple variants
 * @param {Object} props
 * @param {string} props.variant - 'default' | 'accent' | 'stat' | 'minimal'
 * @param {React.ReactNode} props.children - Content
 * @param {Object} props.style - Additional inline styles
 */
export default function Glass({ children, variant = "default", style = {} }) {
  let baseStyle;

  switch (variant) {
    case "accent":
      // Card with colored left border
      baseStyle = COMPONENT_STYLES.cardAccent;
      break;
    case "stat":
      // Minimal stat card
      baseStyle = COMPONENT_STYLES.cardStat;
      break;
    case "minimal":
      // Just background and border, minimal padding
      baseStyle = {
        background: COLORS.bg.card,
        border: COMPONENT_STYLES.card.border,
        borderRadius: RADIUS.md,
        padding: `${8}px ${12}px`,
      };
      break;
    case "default":
    default:
      baseStyle = COMPONENT_STYLES.card;
  }

  return (
    <div style={withStyle(baseStyle, style)}>
      {children}
    </div>
  );
}

