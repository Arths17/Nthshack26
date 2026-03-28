const base = {
  background: "rgba(255,255,255,.03)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,.07)",
  borderRadius: 20,
};

export default function Glass({ children, style = {} }) {
  return (
    <div style={{ ...base, ...style }}>
      {children}
    </div>
  );
}
