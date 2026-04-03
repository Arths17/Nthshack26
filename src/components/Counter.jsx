import { useState, useEffect, useRef } from "react";

export default function Counter({ 
  to, 
  prefix = "$", 
  suffix = "",
  decimals = 2,
  duration = 800,
  easing = "easeOutQuart"
}) {
  const [val, setVal] = useState(to ?? 0);
  const [direction, setDirection] = useState(null);
  const prev = useRef(to ?? 0);
  const animationRef = useRef(null);

  // Easing functions
  const easings = {
    easeOutQuart: t => 1 - Math.pow(1 - t, 4),
    easeOutCubic: t => 1 - Math.pow(1 - t, 3),
    easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
  };

  useEffect(() => {
    if (to == null) return;
    
    // Determine direction for visual feedback
    if (to > prev.current) {
      setDirection("up");
    } else if (to < prev.current) {
      setDirection("down");
    }
    
    const start = prev.current;
    const end = to;
    const t0 = performance.now();
    const ease = easings[easing] || easings.easeOutQuart;
    
    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    const animate = (now) => {
      const progress = Math.min((now - t0) / duration, 1);
      const eased = ease(progress);
      setVal(start + (end - start) * eased);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setVal(end);
        prev.current = end;
        // Clear direction indicator after animation
        setTimeout(() => setDirection(null), 500);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [to, duration, easing]);

  const getColor = () => {
    if (direction === "up") return "var(--q-success)";
    if (direction === "down") return "var(--q-danger)";
    return "inherit";
  };

  const formattedValue = val?.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span 
      style={{ 
        color: getColor(),
        transition: "color 0.3s ease",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {prefix}{formattedValue}{suffix}
    </span>
  );
}
