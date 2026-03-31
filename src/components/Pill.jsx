export default function Pill({ active, onClick, children, style = {}, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`q-pill ${active ? "q-pill--active" : ""} ${className}`.trim()}
      style={style}
    >
      {children}
    </button>
  );
}
