// Renders a small subset of markdown: **bold**, *italic*, headers, line breaks
export default function MarkdownText({ text, style = {}, className = "q-md" }) {
  if (!text) return null;

  const lines = text.split("\n");

  return (
    <div className={className} style={style}>
      {lines.map((line, i) => {
        const headerMatch = line.match(/^(#{1,3})\s+(.*)/);
        if (headerMatch) {
          return (
            <div
              key={i}
              style={{
                fontWeight: 600,
                color: "var(--q-text-bright)",
                fontSize: 13,
                marginTop: i > 0 ? 12 : 0,
                marginBottom: 4,
                letterSpacing: "-0.01em",
              }}
            >
              {renderInline(headerMatch[2])}
            </div>
          );
        }

        if (line.trim() === "") {
          return <div key={i} style={{ height: 6 }} />;
        }

        return (
          <div key={i} style={{ marginBottom: 2 }}>
            {renderInline(line)}
          </div>
        );
      })}
    </div>
  );
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} style={{ color: "var(--q-text-bright)", fontWeight: 600 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={i} style={{ color: "var(--q-text-secondary)" }}>
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}
