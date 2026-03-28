import { useState, useEffect, useRef, useCallback } from "react";
import { fetchYF } from "./api/yahoo";
import { askClaude } from "./api/claude";
import { f2, fB, fV, SYMBOLS } from "./utils/formatters";
import Counter from "./components/Counter";
import Spark from "./components/Spark";
import Chart from "./components/Chart";
import Pill from "./components/Pill";
import Glass from "./components/Glass";
import Stat from "./components/Stat";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=DM+Serif+Display:ital@0;1&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%;background:#080e1e;color:#e2e8f0;font-family:'DM Sans',sans-serif}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:4px}
  @keyframes spin    {to{transform:rotate(360deg)}}
  @keyframes fadeUp  {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn  {from{opacity:0}to{opacity:1}}
  @keyframes slideUp {from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse   {0%,100%{opacity:1}50%{opacity:.3}}
  @keyframes ticker  {0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
  @keyframes breathe {0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.04);opacity:1}}
  @keyframes shimmer {0%{background-position:-600px 0}100%{background-position:600px 0}}
  .skel{background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.04) 75%);background-size:600px 100%;animation:shimmer 1.6s infinite;border-radius:6px}
  textarea,input{font-family:'DM Sans',sans-serif;color:#e2e8f0;background:transparent;border:none;outline:none;resize:none}
  button{font-family:'DM Sans',sans-serif}
`;

const Orbs = () => (
  <div style={{position:"fixed",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:0}}>
    <div style={{position:"absolute",top:"-20%",left:"-10%",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(79,172,254,.07) 0%,transparent 70%)",animation:"breathe 8s ease-in-out infinite"}}/>
    <div style={{position:"absolute",bottom:"-15%",right:"-5%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(167,139,250,.06) 0%,transparent 70%)",animation:"breathe 10s ease-in-out infinite 2s"}}/>
    <div style={{position:"absolute",top:"40%",right:"30%",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(74,222,128,.04) 0%,transparent 70%)",animation:"breathe 12s ease-in-out infinite 4s"}}/>
  </div>
);

export default function App() {
  const [sym,    setSym]   = useState("NVDA");
  const [data,   setData]  = useState(null);
  const [watch,  setWatch] = useState({});
  const [loadS,  setLoadS] = useState(true);
  const [loadW,  setLoadW] = useState(true);
  const [msgs,   setMsgs]  = useState([{role:"assistant",content:"Hi, I'm Quanta — your AI trading assistant powered by live Yahoo Finance data.\n\nAsk me to analyze any stock, explain a price move, give a buy/sell verdict, or build a strategy."}]);
  const [input,  setInput] = useState("");
  const [busy,   setBusy]  = useState(false);
  const [tab,    setTab]   = useState("chart");
  const [qty,    setQty]   = useState("10");
  const [cash,   setCash]  = useState(100000);
  const [pos,    setPos]   = useState({});
  const [log,    setLog]   = useState([]);
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  const load = useCallback(async s => {
    setLoadS(true);
    try { setData(await fetchYF(s)); } catch(e){console.error(e);}
    setLoadS(false);
  },[]);

  const loadWatch = useCallback(async()=>{
    setLoadW(true);
    const res=await Promise.allSettled(SYMBOLS.map(fetchYF));
    const m={};res.forEach((r,i)=>{if(r.status==="fulfilled")m[SYMBOLS[i]]=r.value;});
    setWatch(m); setLoadW(false);
  },[]);

  useEffect(()=>{load(sym);},[sym]);
  useEffect(()=>{loadWatch();},[]);
  useEffect(()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight;},[msgs,busy]);

  const sysPrompt = useCallback(()=>{
    if(!data) return "You are Quanta AI, a professional trading assistant.";
    const {price,prevClose,dayHigh,dayLow,volume,marketCap,pe,w52h,w52l,name,sector,candles}=data;
    const chg=price-prevClose, chgPct=((chg/prevClose)*100).toFixed(2);
    const t30=candles.length>=30?((price-candles.at(-30).close)/candles.at(-30).close*100).toFixed(1):"N/A";
    const recent=candles.slice(-14).map(c=>`${c.date}:$${f2(c.close)}`).join(", ");
    const userPos=pos[sym]||0;
    return `You are Quanta AI, a sharp trading intelligence assistant with LIVE Yahoo Finance data.

LIVE DATA — ${sym} (${name}, ${sector}):
• Price: $${f2(price)} | Change: ${chg>=0?"+":""}${f2(chg)} (${chgPct}%)
• Day range: $${f2(dayLow)} – $${f2(dayHigh)}
• 52-week range: $${f2(w52l)} – $${f2(w52h)}
• Market cap: ${fB(marketCap)} | P/E: ${pe?.toFixed(1)??"N/A"} | Volume: ${fV(volume)}
• 30-day performance: ${t30}%
• Recent closes: ${recent}
• User holds: ${userPos} shares of ${sym} | Cash: $${f2(cash)}

Be direct, cite SPECIFIC NUMBERS. Max 3 short paragraphs. Give clear BUY / HOLD / SELL verdicts. Plain text, no markdown. This is educational paper trading.`;
  },[data,cash,pos,sym]);

  const send = async()=>{
    if(!input.trim()||busy) return;
    const txt=input.trim(); setInput("");
    setMsgs(m=>[...m,{role:"user",content:txt}]);
    setBusy(true);
    try {
      const hist=msgs.slice(-8).map(m=>({role:m.role,content:m.content}));
      const reply=await askClaude([...hist,{role:"user",content:txt}],sysPrompt());
      setMsgs(m=>[...m,{role:"assistant",content:reply}]);
    } catch { setMsgs(m=>[...m,{role:"assistant",content:"Network error. Please retry."}]); }
    setBusy(false);
  };

  const execBuy=()=>{
    const q=parseInt(qty)||0; if(!q||!data) return;
    const cost=q*data.price; if(cost>cash) return;
    setCash(c=>+(c-cost).toFixed(2));
    setPos(p=>({...p,[sym]:(p[sym]||0)+q}));
    setLog(l=>[{type:"BUY",sym,qty:q,price:data.price,at:new Date().toLocaleTimeString()},...l.slice(0,19)]);
  };
  const execSell=()=>{
    const q=parseInt(qty)||0; if(!q||q>(pos[sym]||0)||!data) return;
    setCash(c=>+(c+q*data.price).toFixed(2));
    setPos(p=>{const n=(p[sym]||0)-q;if(n<=0){const{[sym]:_,...r}=p;return r;}return{...p,[sym]:n};});
    setLog(l=>[{type:"SELL",sym,qty:q,price:data.price,at:new Date().toLocaleTimeString()},...l.slice(0,19)]);
  };

  const price=data?.price, prev=data?.prevClose;
  const dayChg=price&&prev?price-prev:null, dayChgPct=dayChg&&prev?(dayChg/prev*100):null;
  const isUp=dayChg>=0, curPos=pos[sym]||0;
  const portVal=cash+Object.entries(pos).reduce((s,[k,v])=>s+v*(watch[k]?.price||0),0);
  const pnl=portVal-100000;

  return (
    <div style={{height:"100dvh",display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
      <style>{CSS}</style>
      <Orbs/>

      {/* ── TICKER ───────────────────────────────────────────────────────── */}
      <div style={{position:"relative",zIndex:10,height:30,borderBottom:"1px solid rgba(255,255,255,.05)",overflow:"hidden",display:"flex",alignItems:"center",background:"rgba(8,14,30,.8)",backdropFilter:"blur(20px)",flexShrink:0}}>
        {loadW ? <div className="skel" style={{width:"100%",height:"100%",borderRadius:0}}/> : (
          <div style={{display:"flex",animation:"ticker 55s linear infinite",whiteSpace:"nowrap"}}>
            {[...SYMBOLS,...SYMBOLS].map((s,i)=>{
              const d=watch[s]; if(!d) return null;
              const c=d.price&&d.prevClose?(d.price-d.prevClose)/d.prevClose*100:0;
              return (
                <span key={i} onClick={()=>setSym(s)} style={{padding:"0 22px",fontSize:11,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8,flexShrink:0,transition:"opacity .2s"}}
                  onMouseEnter={e=>e.currentTarget.style.opacity=".5"}
                  onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                  <span style={{color:"rgba(148,163,184,.4)",fontWeight:500}}>{s}</span>
                  <span style={{color:"#e2e8f0",fontWeight:500}}>${f2(d.price)}</span>
                  <span style={{fontSize:10,color:c>=0?"#4ade80":"#f87171",fontWeight:500}}>{c>=0?"▲":"▼"}{Math.abs(c).toFixed(2)}%</span>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <div style={{position:"relative",zIndex:10,height:58,display:"flex",alignItems:"center",padding:"0 24px",gap:16,background:"rgba(8,14,30,.7)",backdropFilter:"blur(24px)",borderBottom:"1px solid rgba(255,255,255,.05)",flexShrink:0}}>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <div style={{width:32,height:32,borderRadius:10,background:"linear-gradient(135deg,#4facfe 0%,#a78bfa 100%)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 20px rgba(79,172,254,.3)"}}>
            <span style={{fontFamily:"'DM Serif Display',serif",fontStyle:"italic",fontSize:17,color:"#fff",lineHeight:1}}>Q</span>
          </div>
          <div>
            <div style={{fontSize:15,fontWeight:600,letterSpacing:".12em",color:"#f8fafc"}}>QUANTA</div>
            <div style={{fontSize:9,color:"rgba(148,163,184,.5)",letterSpacing:".1em"}}>AI TRADING TERMINAL</div>
          </div>
        </div>

        {/* Symbol pills */}
        <div style={{display:"flex",gap:6,overflowX:"auto",flex:1,padding:"0 8px"}}>
          {SYMBOLS.map(s=>{
            const d=watch[s];
            const c=d?.price&&d?.prevClose?(d.price-d.prevClose)/d.prevClose*100:null;
            const active=s===sym;
            return (
              <button key={s} onClick={()=>setSym(s)} style={{
                padding:"5px 14px",borderRadius:20,border:`1px solid ${active?"rgba(79,172,254,.4)":"rgba(255,255,255,.07)"}`,
                background:active?"rgba(79,172,254,.12)":"rgba(255,255,255,.02)",
                cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1,flexShrink:0,
                transition:"all .2s",
              }}
                onMouseEnter={e=>{if(!active){e.currentTarget.style.background="rgba(255,255,255,.05)";e.currentTarget.style.borderColor="rgba(255,255,255,.14)";}}}
                onMouseLeave={e=>{if(!active){e.currentTarget.style.background="rgba(255,255,255,.02)";e.currentTarget.style.borderColor="rgba(255,255,255,.07)";}}}
              >
                <span style={{fontSize:12,fontWeight:active?600:400,color:active?"#4facfe":"rgba(148,163,184,.8)",letterSpacing:".03em"}}>{s}</span>
                {c!=null?<span style={{fontSize:9,color:c>=0?"#4ade80":"#f87171",fontWeight:500}}>{c>=0?"+":""}{c.toFixed(1)}%</span>:<div className="skel" style={{width:28,height:8}}/>}
              </button>
            );
          })}
        </div>

        {/* Portfolio */}
        <Glass style={{padding:"8px 16px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,color:"rgba(148,163,184,.5)",letterSpacing:".07em",marginBottom:2}}>P&L</div>
            <div style={{fontSize:14,fontWeight:600,color:pnl>=0?"#4ade80":"#f87171"}}>{pnl>=0?"+":"−"}${Math.abs(pnl).toFixed(0)}</div>
          </div>
          <div style={{width:1,height:28,background:"rgba(255,255,255,.08)"}}/>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,color:"rgba(148,163,184,.5)",letterSpacing:".07em",marginBottom:2}}>CASH</div>
            <div style={{fontSize:13,fontWeight:500,color:"#e2e8f0"}}>${(cash/1000).toFixed(1)}k</div>
          </div>
          <div style={{width:1,height:28,background:"rgba(255,255,255,.08)"}}/>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:"#4ade80",animation:"pulse 2s infinite",boxShadow:"0 0 8px #4ade80"}}/>
            <span style={{fontSize:10,color:"rgba(148,163,184,.6)",letterSpacing:".07em"}}>LIVE</span>
          </div>
        </Glass>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <div style={{position:"relative",zIndex:5,flex:1,display:"grid",gridTemplateColumns:"300px 1fr",minHeight:0,overflow:"hidden",gap:0}}>

        {/* ── AI CHAT PANEL ──────────────────────────────────────────────── */}
        <div style={{borderRight:"1px solid rgba(255,255,255,.05)",display:"flex",flexDirection:"column",background:"rgba(8,14,30,.6)",backdropFilter:"blur(20px)",overflow:"hidden"}}>
          {/* Header */}
          <div style={{padding:"16px 18px 12px",borderBottom:"1px solid rgba(255,255,255,.05)",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
              <div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#4facfe,#a78bfa)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2L9.5 9.5L2 12L9.5 14.5L12 22L14.5 14.5L22 12L14.5 9.5Z" fill="white"/></svg>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"#f8fafc",letterSpacing:".02em"}}>Quanta Intelligence</div>
                <div style={{fontSize:10,color:busy?"#fbbf24":"#4ade80",display:"flex",alignItems:"center",gap:4}}>
                  <span style={{width:5,height:5,borderRadius:"50%",background:busy?"#fbbf24":"#4ade80",display:"inline-block",animation:"pulse 2s infinite"}}/>
                  {busy?"Analyzing live data…":"Connected to Yahoo Finance"}
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={chatRef} style={{flex:1,overflowY:"auto",padding:"14px 14px",display:"flex",flexDirection:"column",gap:12,minHeight:0}}>
            {msgs.map((m,i)=>(
              <div key={i} style={{animation:"slideUp .25s ease both"}}>
                {m.role==="user"?(
                  <div style={{display:"flex",justifyContent:"flex-end"}}>
                    <div style={{background:"linear-gradient(135deg,rgba(79,172,254,.18),rgba(167,139,250,.18))",border:"1px solid rgba(79,172,254,.25)",borderRadius:"16px 16px 4px 16px",padding:"10px 14px",fontSize:12,color:"#e2e8f0",lineHeight:1.65,maxWidth:"88%"}}>
                      {m.content}
                    </div>
                  </div>
                ):(
                  <div style={{fontSize:12,color:"rgba(148,163,184,.85)",lineHeight:1.75,fontWeight:400,whiteSpace:"pre-wrap"}}>
                    {m.content}
                  </div>
                )}
              </div>
            ))}
            {busy&&(
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"4px 0"}}>
                <div style={{width:16,height:16,borderRadius:"50%",border:"2px solid rgba(79,172,254,.2)",borderTop:"2px solid #4facfe",animation:"spin .7s linear infinite",flexShrink:0}}/>
                <span style={{fontSize:11,color:"rgba(148,163,184,.4)",animation:"pulse 1.5s infinite"}}>Thinking…</span>
              </div>
            )}
            {/* Suggestions */}
            {msgs.length<=1&&!busy&&(
              <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:8}}>
                {[`Analyze ${sym} with the live data`,`Should I buy ${sym} today?`,`Why is ${sym} moving?`,`Build me a strategy for ${sym}`].map((p,i)=>(
                  <button key={i} onClick={()=>{setInput(p);inputRef.current?.focus();}} style={{
                    textAlign:"left",padding:"9px 12px",borderRadius:10,border:"1px solid rgba(255,255,255,.06)",background:"rgba(255,255,255,.02)",
                    color:"rgba(148,163,184,.6)",fontSize:11,cursor:"pointer",lineHeight:1.4,
                    transition:"all .2s",display:"flex",alignItems:"center",gap:8,
                  }}
                    onMouseEnter={e=>{e.currentTarget.style.background="rgba(79,172,254,.08)";e.currentTarget.style.borderColor="rgba(79,172,254,.2)";e.currentTarget.style.color="#e2e8f0";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.02)";e.currentTarget.style.borderColor="rgba(255,255,255,.06)";e.currentTarget.style.color="rgba(148,163,184,.6)";}}>
                    <span style={{fontSize:14,color:"rgba(79,172,254,.5)"}}>→</span>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{padding:"12px",borderTop:"1px solid rgba(255,255,255,.05)",flexShrink:0}}>
            <Glass style={{borderRadius:14,padding:"10px 14px",border:"1px solid rgba(255,255,255,.08)",transition:"border-color .2s"}}
              onFocus={e=>e.currentTarget.style.borderColor="rgba(79,172,254,.3)"}
              onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,.08)"}>
              <div style={{display:"flex",alignItems:"flex-end",gap:10}}>
                <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
                  placeholder={`Ask about ${sym}…`} rows={1}
                  style={{flex:1,fontSize:12,lineHeight:"18px",color:"#e2e8f0",caretColor:"#4facfe",fontWeight:400}}/>
                <button onClick={send} disabled={busy||!input.trim()} style={{
                  width:30,height:30,borderRadius:10,flexShrink:0,
                  background:input.trim()&&!busy?"linear-gradient(135deg,#4facfe,#a78bfa)":"rgba(255,255,255,.06)",
                  border:"none",color:input.trim()&&!busy?"#fff":"rgba(148,163,184,.3)",
                  cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",
                  transition:"all .2s",boxShadow:input.trim()&&!busy?"0 0 16px rgba(79,172,254,.3)":"none",
                }}>↑</button>
              </div>
              <div style={{fontSize:10,color:"rgba(148,163,184,.25)",marginTop:6,letterSpacing:".04em"}}>⏎ to send · ⇧⏎ newline</div>
            </Glass>
          </div>
        </div>

        {/* ── MAIN CONTENT ───────────────────────────────────────────────── */}
        <div style={{display:"flex",flexDirection:"column",minHeight:0,overflow:"hidden",padding:"20px 24px 16px",gap:16}}>

          {/* Price hero */}
          <Glass style={{padding:"20px 24px",borderRadius:20,flexShrink:0}}>
            {loadS?(
              <div style={{display:"flex",gap:24,alignItems:"center"}}>
                <div className="skel" style={{width:120,height:36}}/>
                <div className="skel" style={{width:80,height:24}}/>
                <div style={{marginLeft:"auto",display:"flex",gap:20}}>
                  {[80,60,70,60,60].map((w,i)=><div key={i} className="skel" style={{width:w,height:32}}/>)}
                </div>
              </div>
            ):data?(
              <div style={{display:"flex",alignItems:"center",gap:24,flexWrap:"wrap",animation:"fadeIn .4s ease"}}>
                <div>
                  <div style={{fontFamily:"'DM Serif Display',serif",fontStyle:"italic",fontSize:32,fontWeight:400,color:"#f8fafc",lineHeight:1,letterSpacing:"-.01em"}}>{sym}</div>
                  <div style={{fontSize:11,color:"rgba(148,163,184,.5)",marginTop:4,letterSpacing:".04em"}}>{data.name}</div>
                </div>
                <div>
                  <div style={{fontFamily:"'DM Serif Display',serif",fontSize:36,fontWeight:400,color:"#f8fafc",letterSpacing:"-.02em",lineHeight:1}}>
                    <Counter to={price} prefix="$"/>
                  </div>
                  <div style={{fontSize:13,marginTop:4,color:isUp?"#4ade80":"#f87171",display:"flex",alignItems:"center",gap:6}}>
                    <span style={{background:isUp?"rgba(74,222,128,.12)":"rgba(248,113,113,.12)",padding:"2px 8px",borderRadius:6,fontWeight:500}}>
                      {isUp?"▲":"▼"} ${f2(Math.abs(dayChg))} ({dayChgPct>=0?"+":""}{dayChgPct?.toFixed(2)}%)
                    </span>
                    <span style={{fontSize:11,color:"rgba(148,163,184,.4)"}}>today</span>
                  </div>
                </div>
                <div style={{marginLeft:"auto",display:"flex",gap:28,flexWrap:"wrap"}}>
                  {[
                    {label:"Market Cap",value:fB(data.marketCap)},
                    {label:"P/E Ratio",value:data.pe?.toFixed(1)??"—"},
                    {label:"Volume",value:fV(data.volume)},
                    {label:"52W High",value:`$${f2(data.w52h)}`,accent:"#4ade80"},
                    {label:"52W Low",value:`$${f2(data.w52l)}`,accent:"#f87171"},
                  ].map((s,i)=>(
                    <div key={s.label} style={{animation:`fadeUp .4s ${.06+i*.04}s ease both`}}>
                      <Stat label={s.label} value={s.value} accent={s.accent}/>
                    </div>
                  ))}
                </div>
              </div>
            ):null}
          </Glass>

          {/* Tabs + content */}
          <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0,gap:0}}>
            {/* Tab bar */}
            <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:12}}>
              {[["chart","Chart"],["positions","Positions"],["log","Trade Log"]].map(([id,label])=>(
                <Pill key={id} active={tab===id} onClick={()=>setTab(id)}>{label}</Pill>
              ))}
              <button onClick={()=>load(sym)} style={{marginLeft:"auto",padding:"5px 12px",borderRadius:20,border:"1px solid rgba(255,255,255,.07)",background:"rgba(255,255,255,.02)",color:"rgba(148,163,184,.5)",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:6,transition:"all .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.05)";e.currentTarget.style.color="#e2e8f0";}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.02)";e.currentTarget.style.color="rgba(148,163,184,.5)";}}>
                <span style={{fontSize:13}}>↺</span> Refresh
              </button>
            </div>

            {/* CHART */}
            {tab==="chart"&&(
              <div style={{flex:1,display:"flex",flexDirection:"column",gap:12,minHeight:0,animation:"fadeIn .3s ease"}}>
                <Glass style={{flex:1,padding:"4px 8px 0",minHeight:0,overflow:"hidden"}}>
                  <Chart candles={data?.candles}/>
                </Glass>
                {/* Trade controls */}
                <Glass style={{padding:"16px 20px",flexShrink:0,display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                  <div style={{fontSize:12,color:"rgba(148,163,184,.6)",display:"flex",gap:20}}>
                    <span>Position <strong style={{color:"#e2e8f0",marginLeft:6}}>{curPos} shares</strong></span>
                    <span>Value <strong style={{color:"#e2e8f0",marginLeft:6}}>${f2(curPos*(price||0))}</strong></span>
                  </div>
                  <div style={{marginLeft:"auto",display:"flex",gap:10,alignItems:"center"}}>
                    <span style={{fontSize:11,color:"rgba(148,163,184,.4)"}}>Qty</span>
                    <div style={{border:"1px solid rgba(255,255,255,.1)",borderRadius:10,background:"rgba(255,255,255,.04)",overflow:"hidden"}}>
                      <input type="number" value={qty} onChange={e=>setQty(e.target.value)} style={{width:60,padding:"7px 12px",fontSize:13,fontWeight:500,textAlign:"center"}}/>
                    </div>
                    {[
                      {label:"Buy",color:"#4ade80",bg:"rgba(74,222,128,.12)",border:"rgba(74,222,128,.3)",action:execBuy,off:!price||parseInt(qty)*(price||0)>cash},
                      {label:"Sell",color:"#f87171",bg:"rgba(248,113,113,.12)",border:"rgba(248,113,113,.3)",action:execSell,off:(pos[sym]||0)<parseInt(qty)},
                    ].map(b=>(
                      <button key={b.label} onClick={b.action} disabled={b.off} style={{
                        padding:"7px 24px",borderRadius:10,
                        border:`1px solid ${b.off?"rgba(255,255,255,.07)":b.border}`,
                        background:b.off?"rgba(255,255,255,.02)":b.bg,
                        color:b.off?"rgba(148,163,184,.25)":b.color,
                        fontSize:13,fontWeight:600,cursor:"pointer",transition:"all .2s",letterSpacing:".02em",
                      }}
                        onMouseEnter={e=>{if(!b.off)e.currentTarget.style.boxShadow=`0 0 16px ${b.bg}`;}}
                        onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                        {b.label}
                      </button>
                    ))}
                    <span style={{fontSize:11,color:"rgba(148,163,184,.3)"}}>≈ ${f2((parseInt(qty)||0)*(price||0))}</span>
                  </div>
                </Glass>
              </div>
            )}

            {/* POSITIONS */}
            {tab==="positions"&&(
              <div style={{flex:1,overflowY:"auto",animation:"fadeIn .3s ease"}}>
                {Object.keys(pos).length===0?(
                  <Glass style={{padding:"48px 24px",textAlign:"center"}}>
                    <div style={{fontSize:32,marginBottom:12,opacity:.3}}>◎</div>
                    <div style={{color:"rgba(148,163,184,.4)",fontSize:13}}>No open positions yet</div>
                    <div style={{color:"rgba(148,163,184,.25)",fontSize:11,marginTop:6}}>Buy some stocks to get started</div>
                  </Glass>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {Object.entries(pos).map(([s,q],i)=>{
                      const d=watch[s], p=d?.price||0, pnlPct=d?.prevClose?((p-d.prevClose)/d.prevClose*100):0;
                      const up=pnlPct>=0;
                      return (
                        <Glass key={s} style={{padding:"16px 20px",display:"flex",alignItems:"center",gap:16,animation:`fadeUp .3s ${i*.05}s ease both`,cursor:"pointer",transition:"border-color .2s"}}
                          onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(255,255,255,.14)"}
                          onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,.07)"}>
                          <div style={{width:40,height:40,borderRadius:12,background:up?"rgba(74,222,128,.1)":"rgba(248,113,113,.1)",border:`1px solid ${up?"rgba(74,222,128,.2)":"rgba(248,113,113,.2)"}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <span style={{fontFamily:"'DM Serif Display',serif",fontSize:14,fontStyle:"italic",color:up?"#4ade80":"#f87171"}}>{s[0]}</span>
                          </div>
                          <div>
                            <div style={{fontSize:15,fontWeight:600,color:"#f8fafc"}}>{s}</div>
                            <div style={{fontSize:11,color:"rgba(148,163,184,.5)",marginTop:2}}>{q} shares · ${f2(p)}</div>
                          </div>
                          <Spark candles={watch[s]?.candles?.slice(-30)} up={up} w={80} h={32}/>
                          <div style={{marginLeft:"auto",textAlign:"right"}}>
                            <div style={{fontSize:16,fontWeight:600,color:"#f8fafc"}}>${f2(q*p)}</div>
                            <div style={{fontSize:12,color:up?"#4ade80":"#f87171",marginTop:2}}>{up?"+":""}{pnlPct.toFixed(2)}% today</div>
                          </div>
                        </Glass>
                      );
                    })}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <Glass style={{padding:"16px 20px"}}>
                        <div style={{fontSize:11,color:"rgba(148,163,184,.4)",marginBottom:6,letterSpacing:".06em"}}>CASH REMAINING</div>
                        <div style={{fontSize:20,fontWeight:600,color:"#e2e8f0"}}>${f2(cash)}</div>
                      </Glass>
                      <Glass style={{padding:"16px 20px",border:`1px solid ${pnl>=0?"rgba(74,222,128,.2)":"rgba(248,113,113,.2)"}`,background:pnl>=0?"rgba(74,222,128,.04)":"rgba(248,113,113,.04)"}}>
                        <div style={{fontSize:11,color:"rgba(148,163,184,.4)",marginBottom:6,letterSpacing:".06em"}}>TOTAL P&L</div>
                        <div style={{fontSize:20,fontWeight:700,color:pnl>=0?"#4ade80":"#f87171"}}>{pnl>=0?"+":"−"}${Math.abs(pnl).toFixed(2)}</div>
                      </Glass>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TRADE LOG */}
            {tab==="log"&&(
              <div style={{flex:1,overflowY:"auto",animation:"fadeIn .3s ease"}}>
                {log.length===0?(
                  <Glass style={{padding:"48px 24px",textAlign:"center"}}>
                    <div style={{fontSize:32,marginBottom:12,opacity:.3}}>◈</div>
                    <div style={{color:"rgba(148,163,184,.4)",fontSize:13}}>No trades executed yet</div>
                  </Glass>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {log.map((t,i)=>(
                      <Glass key={i} style={{padding:"14px 20px",display:"flex",alignItems:"center",gap:16,animation:`fadeUp .2s ${i*.03}s ease both`}}>
                        <div style={{width:36,height:36,borderRadius:10,background:t.type==="BUY"?"rgba(74,222,128,.1)":"rgba(248,113,113,.1)",border:`1px solid ${t.type==="BUY"?"rgba(74,222,128,.25)":"rgba(248,113,113,.25)"}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <span style={{fontSize:12,fontWeight:700,color:t.type==="BUY"?"#4ade80":"#f87171"}}>{t.type==="BUY"?"↑":"↓"}</span>
                        </div>
                        <div>
                          <div style={{fontSize:13,fontWeight:600,color:"#e2e8f0"}}>{t.type} {t.sym}</div>
                          <div style={{fontSize:11,color:"rgba(148,163,184,.4)",marginTop:2}}>{t.qty} shares @ ${f2(t.price)}</div>
                        </div>
                        <div style={{marginLeft:"auto",textAlign:"right"}}>
                          <div style={{fontSize:14,fontWeight:600,color:"#e2e8f0"}}>${f2(t.qty*t.price)}</div>
                          <div style={{fontSize:10,color:"rgba(148,163,184,.3)",marginTop:2}}>{t.at}</div>
                        </div>
                      </Glass>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
