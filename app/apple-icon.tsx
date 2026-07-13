import { ImageResponse } from 'next/og'

// Apple touch icon (iOS home screen / share sheets). Next.js serves this at
// /apple-icon and injects <link rel="apple-touch-icon">. Mirrors app/icon.svg.
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0c0a09',
          color: '#f59e0b',
          fontSize: 104,
          fontStyle: 'italic',
          fontFamily: 'Georgia, serif',
        }}
      >
        V.
      </div>
    ),
    { ...size }
  )
}
