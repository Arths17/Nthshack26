export default function Pill({active, onClick, children, style={}}) {
  return (
    <button onClick={onClick} style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${active?"rgba(79,172,254,.4)":"rgba(255,255,255,.07)"}`,background:active?"rgba(79,172,254,.12)":"transparent",color:active?"#4facfe":"rgba(148,163,184,.7)",fontSize:12,fontFamily:"'DM Sans',sans-serif",fontWeight:active?500:400,cursor:"pointer",transition:"all .2s",whiteSpace:"nowrap",...style}}>
      {children}
    </button>
  );
}
