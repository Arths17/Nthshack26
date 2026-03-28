export default function Pill({active, onClick, children, style={}}) {
  return (
    <button onClick={onClick} style={{
      padding:"5px 12px", borderRadius:6,
      border:`1px solid ${active?"rgba(79,172,254,.3)":"rgba(255,255,255,.06)"}`,
      background: active ? "rgba(79,172,254,.12)" : "transparent",
      color: active ? "#4facfe" : "rgba(148,163,184,.5)",
      fontSize:12, fontWeight: active ? 600 : 400,
      cursor:"pointer", transition:"all .15s", whiteSpace:"nowrap",
      ...style
    }}>
      {children}
    </button>
  );
}
