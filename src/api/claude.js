export const askClaude = async (messages, system) => {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system,messages}),
  });
  const d = await r.json();
  return d.content?.[0]?.text || "Error — please retry.";
};
