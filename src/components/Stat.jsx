export default function Stat({label, value, accent}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:3}}>
      <span style={{fontSize:10,color:"rgba(148,163,184,.4)",letterSpacing:".05em",textTransform:"uppercase"}}>{label}</span>
      <span style={{fontSize:13,fontWeight:500,color:accent||"#e2e8f0"}}>{value}</span>
    </div>
  );
}
