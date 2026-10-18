'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            backgroundColor: '#f8fafc',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😟</div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: '#1e293b' }}>
            Kuch ghalat ho gaya
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', maxWidth: '320px' }}>
            Internet slow ho sakta hai. Dobara try karein.
          </p>
          <button
            onClick={() => reset()}
            style={{
              backgroundColor: '#0ea5e9',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 32px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Dobara Try Karein
          </button>
        </div>
      </body>
    </html>
  );
}
