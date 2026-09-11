export default function DebugPage() {
  return (
    <div style={{ padding: 20, fontFamily: 'monospace', fontSize: 16 }}>
      <p>NEXT_PUBLIC_API_URL = {process.env.NEXT_PUBLIC_API_URL || '(EMPTY)'}</p>
    </div>
  );
}
