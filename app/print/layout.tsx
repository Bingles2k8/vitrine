export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        body { background: white !important; }
        @media print { body { background: white !important; } }
      `}</style>
      {children}
    </>
  )
}
