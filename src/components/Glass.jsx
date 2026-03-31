export default function Glass({ children, style = {}, className = "", hoverable = false }) {
  const interactive = hoverable ? "glass-panel--interactive" : "";
  return (
    <div className={`glass-panel ${interactive} ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}
