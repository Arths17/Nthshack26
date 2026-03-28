import { useState, useEffect, useCallback } from "react";
import Glass from "../components/Glass";
import { useNews } from "../hooks/useNews";

const muted = "rgba(148,163,184,.5)";
const dim   = "rgba(148,163,184,.25)";

function timeAgo(dateStr) {
  try {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return "recently";
  }
}

export default function NewsPage({ sym }) {
  const { articles, loading, error, fetchStockNews, fetchMarketNews } = useNews();
  const [tab, setTab] = useState("stock");

  useEffect(() => {
    if (tab === "stock") {
      fetchStockNews(sym);
    } else if (tab === "market") {
      fetchMarketNews();
    }
  }, [tab, sym, fetchStockNews, fetchMarketNews]);

  const handleRefresh = () => {
    if (tab === "stock") {
      fetchStockNews(sym);
    } else if (tab === "market") {
      fetchMarketNews();
    }
  };


  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
        <button 
          onClick={() => setTab("stock")} 
          style={{
            padding: "5px 14px", borderRadius: 20, fontSize: 11, cursor: "pointer", transition: "all .2s",
            border: `1px solid ${tab === "stock" ? "rgba(79,172,254,.4)" : "rgba(255,255,255,.07)"}`,
            background: tab === "stock" ? "rgba(79,172,254,.12)" : "transparent",
            color: tab === "stock" ? "#4facfe" : muted,
          }}
        >
          {sym} News
        </button>
        <button 
          onClick={() => setTab("market")} 
          style={{
            padding: "5px 14px", borderRadius: 20, fontSize: 11, cursor: "pointer", transition: "all .2s",
            border: `1px solid ${tab === "market" ? "rgba(79,172,254,.4)" : "rgba(255,255,255,.07)"}`,
            background: tab === "market" ? "rgba(79,172,254,.12)" : "transparent",
            color: tab === "market" ? "#4facfe" : muted,
          }}
        >
          Market News
        </button>
        <button 
          onClick={handleRefresh} 
          style={{ 
            padding: "5px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer", 
            border: "1px solid rgba(255,255,255,.07)", background: "transparent", 
            color: muted, marginLeft: "auto", transition: "all .2s" 
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#e2e8f0"}
          onMouseLeave={e => e.currentTarget.style.color = muted}
        >
          ⟳ Refresh
        </button>
      </div>

      {/* Content */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1,2,3,4,5].map(i => (
            <Glass key={i} style={{ padding: "16px 18px", borderRadius: 14 }}>
              <div className="skel" style={{ width: "70%", height: 14, marginBottom: 8 }} />
              <div className="skel" style={{ width: "90%", height: 11, marginBottom: 6 }} />
              <div className="skel" style={{ width: "40%", height: 10 }} />
            </Glass>
          ))}
        </div>
      )}

      {error && (
        <Glass style={{ padding: "32px", textAlign: "center", borderRadius: 16 }}>
          <div style={{ fontSize: 13, color: "#f87171" }}>📡 {error}</div>
        </Glass>
      )}

      {!loading && !error && articles.length === 0 && (
        <Glass style={{ padding: "32px", textAlign: "center", borderRadius: 16 }}>
          <div style={{ fontSize: 13, color: muted }}>No news available right now</div>
        </Glass>
      )}

      {!loading && articles.map((article, i) => {
        const sentiment = article.sentiment || "neutral";
        const sentColor = sentiment === "positive" ? "#4ade80" : sentiment === "negative" ? "#f87171" : muted;
        const sentBg    = sentiment === "positive" ? "rgba(74,222,128,.06)" : sentiment === "negative" ? "rgba(248,113,113,.06)" : "transparent";
        const sentLabel = sentiment === "positive" ? "▲ Positive" : sentiment === "negative" ? "▼ Negative" : "● Neutral";
        
        return (
          <a 
            key={i} 
            href={article.link} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ textDecoration: "none" }}
          >
            <Glass 
              style={{
                padding: "16px 18px", 
                borderRadius: 14, 
                cursor: "pointer", 
                transition: "border-color .2s, transform .15s",
                display: "block", 
                background: sentBg,
              }}
              onMouseEnter={e => { 
                e.currentTarget.style.borderColor = "rgba(255,255,255,.18)"; 
                e.currentTarget.style.transform = "translateY(-1px)"; 
              }}
              onMouseLeave={e => { 
                e.currentTarget.style.borderColor = "rgba(255,255,255,.07)"; 
                e.currentTarget.style.transform = "translateY(0)"; 
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", lineHeight: 1.5, marginBottom: 6 }}>
                {article.title}
              </div>
              {article.description && (
                <div style={{ 
                  fontSize: 11, 
                  color: muted, 
                  lineHeight: 1.6, 
                  marginBottom: 8, 
                  display: "-webkit-box", 
                  WebkitLineClamp: 2, 
                  WebkitBoxOrient: "vertical", 
                  overflow: "hidden" 
                }}>
                  {article.description}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ 
                  fontSize: 9, 
                  color: sentColor, 
                  fontWeight: 700, 
                  letterSpacing: ".04em", 
                  background: `${sentColor}18`, 
                  padding: "2px 7px", 
                  borderRadius: 6 
                }}>
                  {sentLabel}
                </span>
                <span style={{ fontSize: 10, color: "#4facfe", fontWeight: 500 }}>
                  {article.source}
                </span>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: dim, display: "inline-block" }} />
                <span style={{ fontSize: 10, color: dim }}>
                  {timeAgo(article.pubDate)}
                </span>
                <span style={{ marginLeft: "auto", fontSize: 10, color: dim }}>
                  Read →
                </span>
              </div>
            </Glass>
          </a>
        );
      })}
    </div>
  );
}
