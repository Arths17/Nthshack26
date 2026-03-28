export const askClaude = async (messages, system) => {
  const r = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, system }),
  });
  if (!r.ok) throw new Error(`Server error ${r.status}`);
  const d = await r.json();
  return d.text || "Error — please retry.";
};
