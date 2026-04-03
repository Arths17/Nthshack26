import { useState } from "react";

export default function Glass({ 
  children, 
  style = {}, 
  className = "", 
  hoverable = false,
  glow = false,
  variant = "default"
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  const baseStyles = {
    background: "var(--q-bg-card)",
    backdropFilter: "blur(var(--q-blur))",
    WebkitBackdropFilter: "blur(var(--q-blur))",
    border: "1px solid var(--q-border)",
    borderRadius: "var(--q-radius-xl)",
    boxShadow: glow ? "var(--q-shadow-glass-glow)" : "var(--q-shadow-glass)",
    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
    position: "relative",
    overflow: "hidden",
    ...style,
  };

  const hoverStyles = hoverable && isHovered ? {
    borderColor: "var(--q-border-strong)",
    boxShadow: glow 
      ? "inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 24px 60px rgba(0, 0, 0, 0.55), 0 0 80px rgba(99, 102, 241, 0.18)"
      : "var(--q-shadow-glass-hover)",
    transform: "translateY(-2px)",
  } : {};

  const classes = [
    "glass-panel",
    hoverable && "glass-panel--hoverable",
    glow && "glass-panel--glow",
    variant !== "default" && `glass-panel--${variant}`,
    className
  ].filter(Boolean).join(" ");

  return (
    <div 
      className={classes}
      style={{ ...baseStyles, ...hoverStyles }}
      onMouseEnter={() => hoverable && setIsHovered(true)}
      onMouseLeave={() => hoverable && setIsHovered(false)}
    >
      {/* Subtle gradient shine overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 40%)",
        pointerEvents: "none",
        borderRadius: "inherit",
      }} />
      {/* Content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
