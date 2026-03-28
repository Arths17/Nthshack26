export const askClaude = async (messages, system, currentTicker) => {
  const r = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, system, current_ticker: currentTicker }),
  });
  if (!r.ok) throw new Error(`Server error ${r.status}`);
  const d = await r.json();
  return d.text || "Error — please retry.";
};
