export default function Glass({children, style={}}) {
  return (
    <div style={{background:"#111111",border:"1px solid rgba(255,255,255,.06)",borderRadius:10,...style}}>
      {children}
    </div>
  );
}
