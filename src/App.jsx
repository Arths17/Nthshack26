import { useState } from "react";
import { useWatchlist }  from "./hooks/useWatchlist";
import { useStockData }  from "./hooks/useStockData";
import { usePortfolio }  from "./hooks/usePortfolio";
import { useChat }       from "./hooks/useChat";
import Ticker      from "./components/Ticker";
import NavBar      from "./components/NavBar";
import ChatPanel   from "./components/ChatPanel";
import MainContent from "./components/MainContent";

const Orbs = () => (
  <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
    <div style={{ position: "absolute", top: "-20%", left: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,172,254,.07) 0%,transparent 70%)", animation: "breathe 8s ease-in-out infinite" }} />
    <div style={{ position: "absolute", bottom: "-15%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(167,139,250,.06) 0%,transparent 70%)", animation: "breathe 10s ease-in-out infinite 2s" }} />
    <div style={{ position: "absolute", top: "40%", right: "30%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(74,222,128,.04) 0%,transparent 70%)", animation: "breathe 12s ease-in-out infinite 4s" }} />
  </div>
);

export default function App() {
  const [sym, setSym] = useState("NVDA");

  const { watch, loading: loadW }             = useWatchlist();
  const { data, loading: loadS, error, reload } = useStockData(sym);
  const { cash, pos, log, buy, sell }           = usePortfolio();
  const { msgs, input, setInput, busy, send }   = useChat(sym, data, cash, pos);

  const portVal = cash + Object.entries(pos).reduce((s, [k, v]) => s + v * (watch[k]?.price || 0), 0);
  const pnl     = portVal - 100_000;

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <Orbs />
      <Ticker      watch={watch} loading={loadW} onSelect={setSym} />
      <NavBar      sym={sym} watch={watch} pnl={pnl} cash={cash} onSelect={setSym} />
      <div style={{ position: "relative", zIndex: 5, flex: 1, display: "grid", gridTemplateColumns: "300px 1fr", minHeight: 0, overflow: "hidden" }}>
        <ChatPanel   sym={sym} msgs={msgs} input={input} setInput={setInput} busy={busy} send={send} />
        <MainContent sym={sym} data={data} loading={loadS} error={error} watch={watch} pos={pos} log={log} cash={cash} buy={buy} sell={sell} onReload={reload} />
      </div>
    </div>
  );
}
