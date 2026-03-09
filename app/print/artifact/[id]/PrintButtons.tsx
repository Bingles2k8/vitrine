'use client'

export default function PrintButtons() {
  return (
    <div style={{ marginBottom: '16pt', display: 'flex', gap: '8pt' }}>
      <button
        onClick={() => window.print()}
        style={{ background: '#1a1a1a', color: 'white', border: 'none', padding: '8px 16px', fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer', borderRadius: '4px' }}
      >
        Print / Save as PDF
      </button>
      <button
        onClick={() => window.close()}
        style={{ background: 'transparent', border: '1px solid #ccc', padding: '8px 16px', fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', color: '#666' }}
      >
        Close
      </button>
    </div>
  )
}
