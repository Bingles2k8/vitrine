'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProcessingState({
  headingStyle,
  headingColor,
  mutedColor,
}: {
  headingStyle: React.CSSProperties
  headingColor: string
  mutedColor: string
}) {
  const router = useRouter()

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 3000)
    return () => clearInterval(id)
  }, [router])

  return (
    <div className="text-center">
      <div className="text-5xl mb-5">⏳</div>
      <h1 className="text-3xl mb-3" style={{ ...headingStyle, color: headingColor }}>
        Processing your booking
      </h1>
      <p className="text-sm mb-6" style={{ color: mutedColor }}>
        Your payment is being confirmed. This usually takes a few seconds.
      </p>
      <button
        onClick={() => router.refresh()}
        className="text-sm font-mono transition-colors cursor-pointer"
        style={{ color: mutedColor }}
      >
        Refresh →
      </button>
    </div>
  )
}
