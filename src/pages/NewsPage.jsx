import { useState, useEffect, useCallback } from "react";
import Glass from "../components/Glass";

const PROXY = "https://corsproxy.io/?url=";
const muted = "rgba(148,163,184,.5)";
const dim   = "rgba(148,163,184,.25)";

const POS_WORDS = /\b(surge|soar|jump|gain|rise|rally|beat|record|profit|growth|strong|boost|upgrade|bull|buy|outperform|high|up|positive|win|exceed|top)\b/i;
const NEG_WORDS = /\b(fall|drop|crash|plunge|sink|loss|miss|warn|cut|downgrade|bear|sell|underperform|low|down|negative|risk|concern|fear|weak|decline|layoff|lawsuit|fine|penalty)\b/i;

function getSentiment(title, desc) {
  const text = `${title} ${desc}`;
  const pos = (text.match(POS_WORDS) || []).length;
  const neg = (text.match(NEG_WORDS) || []).length;
  if (pos > neg + 1) return "positive";
  if (neg > pos + 1) return "negative";
  return "neutral";
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function parseRSS(xml) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  return Array.from(doc.querySelectorAll("item")).map(item => ({
    title:   item.querySelector("title")?.textContent || "",
    link:    item.querySelector("link")?.textContent || "",
    pubDate: item.querySelector("pubDate")?.textContent || "",
    source:  item.querySelector("source")?.textContent || "Yahoo Finance",
    desc:    item.querySelector("description")?.textContent?.replace(/<[^>]*>/g, "").trim() || "",
  }));
}

async function fetchNews(symbol) {
  const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${symbol}&region=US&lang=en-US`;
  const r = await fetch(`${PROXY}${encodeURIComponent(url)}`);
  const xml = await r.text();
  return parseRSS(xml);
}

export default function NewsPage({ sym }) {
  const [articles, setArticles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [tab,      setTab]      = useState(sym);

  const load = useCallback(async (s) => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchNews(s);
      setArticles(items);
    } catch {
      setError("Couldn't load news — check your connection.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { setTab(sym); }, [sym]);
  useEffect(() => { load(tab); }, [tab, load]);

  const TABS = [sym, "AAPL", "MSFT", "TSLA", "SPY"].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Symbol tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
        {TABS.map(s => (
          <button key={s} onClick={() => setTab(s)} style={{
            padding: "5px 14px", borderRadius: 20, fontSize: 11, cursor: "pointer", transition: "all .2s",
            border: `1px solid ${tab === s ? "rgba(79,172,254,.4)" : "rgba(255,255,255,.07)"}`,
            background: tab === s ? "rgba(79,172,254,.12)" : "transparent",
            color: tab === s ? "#4facfe" : muted,
          }}>{s}</button>
        ))}
        <button onClick={() => load(tab)} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer", border: "1px solid rgba(255,255,255,.07)", background: "transparent", color: muted, marginLeft: "auto", transition: "all .2s" }}
          onMouseEnter={e => e.currentTarget.style.color = "#e2e8f0"}
          onMouseLeave={e => e.currentTarget.style.color = muted}>
          Refresh
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
          <div style={{ fontSize: 13, color: "#f87171" }}>{error}</div>
        </Glass>
      )}

      {!loading && !error && articles.length === 0 && (
        <Glass style={{ padding: "32px", textAlign: "center", borderRadius: 16 }}>
          <div style={{ fontSize: 13, color: muted }}>No news found for {tab}</div>
        </Glass>
      )}

      {!loading && articles.map((a, i) => {
        const sentiment = getSentiment(a.title, a.desc);
        const sentColor = sentiment === "positive" ? "#4ade80" : sentiment === "negative" ? "#f87171" : muted;
        const sentBg    = sentiment === "positive" ? "rgba(74,222,128,.06)" : sentiment === "negative" ? "rgba(248,113,113,.06)" : "transparent";
        const sentLabel = sentiment === "positive" ? "▲ Positive" : sentiment === "negative" ? "▼ Negative" : "● Neutral";
        return (
          <a key={i} href={a.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            <Glass style={{
              padding: "16px 18px", borderRadius: 14, cursor: "pointer", transition: "border-color .2s, transform .15s",
              display: "block", background: sentBg,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.18)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.07)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", lineHeight: 1.5, marginBottom: 6 }}>{a.title}</div>
              {a.desc && (
                <div style={{ fontSize: 11, color: muted, lineHeight: 1.6, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {a.desc}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 9, color: sentColor, fontWeight: 700, letterSpacing: ".04em", background: `${sentColor}18`, padding: "2px 7px", borderRadius: 6 }}>{sentLabel}</span>
                <span style={{ fontSize: 10, color: "#4facfe", fontWeight: 500 }}>{a.source}</span>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: dim, display: "inline-block" }} />
                <span style={{ fontSize: 10, color: dim }}>{timeAgo(a.pubDate)}</span>
                <span style={{ marginLeft: "auto", fontSize: 10, color: dim }}>Read →</span>
              </div>
            </Glass>
          </a>
        );
      })}
    </div>
  );
}
