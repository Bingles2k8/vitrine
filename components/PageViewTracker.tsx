'use client'

import { useEffect } from 'react'

interface PageViewTrackerProps {
  museumId: string
  pageType: 'home' | 'artifact' | 'events' | 'visit' | 'embed'
  artifactId?: string
}

export default function PageViewTracker({ museumId, pageType, artifactId }: PageViewTrackerProps) {
  useEffect(() => {
    // Fire-and-forget — never block the page or show errors
    fetch('/api/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ museum_id: museumId, page_type: pageType, artifact_id: artifactId }),
    }).catch(() => {})
  }, [museumId, pageType, artifactId])

  return null
}
