export default function Stat({ label, value, accent, size = "default", showIndicator = false, trend = null }) {
  const sizes = {
    small: { label: 9, value: 12, gap: 2 },
    default: { label: 10, value: 14, gap: 4 },
    large: { label: 11, value: 18, gap: 6 },
  };
  
  const s = sizes[size] || sizes.default;
  
  const getTrendColor = () => {
    if (trend === "up") return "var(--q-success)";
    if (trend === "down") return "var(--q-danger)";
    return accent || "var(--q-text)";
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: s.gap,
      position: "relative",
    }}>
      <span style={{
        fontSize: s.label,
        color: "var(--q-text-faint)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontWeight: 500,
      }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          fontSize: s.value,
          fontWeight: 600,
          color: getTrendColor(),
          fontFamily: "var(--q-font-mono)",
          fontVariantNumeric: "tabular-nums",
          transition: "color 0.2s ease",
        }}>
          {value}
        </span>
        {showIndicator && trend && (
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 18,
            height: 18,
            borderRadius: 4,
            background: trend === "up" ? "var(--q-success-subtle)" : "var(--q-danger-subtle)",
            color: trend === "up" ? "var(--q-success)" : "var(--q-danger)",
          }}>
            <svg 
              width="10" 
              height="10" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3" 
              strokeLinecap="round"
              style={{ transform: trend === "down" ? "rotate(180deg)" : "none" }}
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </span>
        )}
      </div>
    </div>
  );
}
