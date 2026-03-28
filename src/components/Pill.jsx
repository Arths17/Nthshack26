export default function Pill({active, onClick, children, style={}}) {
  return (
    <button onClick={onClick} style={{padding:"5px 12px",borderRadius:6,border:`1px solid ${active?"rgba(255,255,255,.14)":"rgba(255,255,255,.06)"}`,background:active?"rgba(255,255,255,.08)":"transparent",color:active?"#f4f4f5":"#71717a",fontSize:12,fontWeight:active?500:400,cursor:"pointer",transition:"all .15s",whiteSpace:"nowrap",...style}}>
      {children}
    </button>
  );
}
