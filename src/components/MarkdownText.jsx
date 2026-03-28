// Renders a small subset of markdown: **bold**, *italic*, headers, line breaks
export default function MarkdownText({ text, style = {} }) {
  if (!text) return null;

  const lines = text.split("\n");

  return (
    <div style={style}>
      {lines.map((line, i) => {
        // Strip leading #s for headers → render as bold + slightly larger
        const headerMatch = line.match(/^(#{1,3})\s+(.*)/);
        if (headerMatch) {
          return (
            <div key={i} style={{ fontWeight: 600, color: "#f8fafc", fontSize: 13, marginTop: i > 0 ? 10 : 0, marginBottom: 2 }}>
              {renderInline(headerMatch[2])}
            </div>
          );
        }

        // Empty line → spacer
        if (line.trim() === "") {
          return <div key={i} style={{ height: 8 }} />;
        }

        // Normal line
        return (
          <div key={i} style={{ marginBottom: 1 }}>
            {renderInline(line)}
          </div>
        );
      })}
    </div>
  );
}

function renderInline(text) {
  // Split on **bold** and *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "#f1f5f9", fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i} style={{ color: "#cbd5e1" }}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}
