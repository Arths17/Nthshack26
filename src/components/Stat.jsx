export default function Stat({label, value, accent}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:3}}>
      <span style={{fontSize:10,color:"#52525b",letterSpacing:".05em",textTransform:"uppercase"}}>{label}</span>
      <span style={{fontSize:13,fontWeight:500,color:accent||"#e4e4e7"}}>{value}</span>
    </div>
  );
}
