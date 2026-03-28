import { useState, useEffect, useRef } from "react";

export default function Counter({ to, prefix="$", decimals=2 }) {
  const [val, setVal] = useState(to??0);
  const prev = useRef(to??0);
  useEffect(() => {
    if(to==null) return;
    const start=prev.current, end=to, dur=600, t0=performance.now();
    const go = now => {
      const p=Math.min((now-t0)/dur,1), e=1-Math.pow(1-p,3);
      setVal(start+(end-start)*e);
      if(p<1) requestAnimationFrame(go); else {setVal(end);prev.current=end;}
    };
    requestAnimationFrame(go);
  },[to]);
  return <>{prefix}{val?.toLocaleString("en-US",{minimumFractionDigits:decimals,maximumFractionDigits:decimals})}</>;
}
