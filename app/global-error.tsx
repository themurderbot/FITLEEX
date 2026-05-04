'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{ background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <h2 style={{ color: '#FF4D4D', marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ color: '#555', fontSize: 13, marginBottom: 16 }}>{error.message}</p>
          <button
            onClick={reset}
            style={{ background: '#C8F04B', color: '#000', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
