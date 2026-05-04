'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
      <h2 style={{ color: '#FF4D4D', margin: 0 }}>Something went wrong</h2>
      <p style={{ color: '#555', fontSize: 13, margin: 0 }}>{error.message}</p>
      <button
        onClick={reset}
        style={{ background: '#C8F04B', color: '#000', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}
      >
        Try again
      </button>
    </div>
  )
}
