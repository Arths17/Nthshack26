export default function Spark({candles,up,w=64,h=24}) {
  if(!candles?.length) return <svg width={w} height={h}/>;
  const vals=candles.map(c=>c.close);
  const mn=Math.min(...vals), mx=Math.max(...vals), rng=mx-mn||1;
  const pts=vals.map((v,i)=>`${(i/(vals.length-1))*w},${h-((v-mn)/rng)*(h-3)-1.5}`).join(" ");
  const col = up ? "#4ade80" : "#f87171";
  return (
    <svg width={w} height={h}>
      <defs><linearGradient id={`sg${w}${h}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={col} stopOpacity=".3"/><stop offset="100%" stopColor={col} stopOpacity="0"/></linearGradient></defs>
      <polyline points={pts} fill="none" stroke={col} strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  );
}
