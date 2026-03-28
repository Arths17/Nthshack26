export const askClaude = async (messages, system, currentTicker) => {
  const r = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, system, current_ticker: currentTicker }),
  });
  if (!r.ok) {
    let detail = `Server error ${r.status}`;
    try {
      const body = await r.json();
      if (body.detail) detail = body.detail;
    } catch (_) {}
    throw new Error(detail);
  }
  const d = await r.json();
  return d.text || "Error — please retry.";
};
