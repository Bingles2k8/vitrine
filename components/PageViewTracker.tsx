'use client'

import { useEffect } from 'react'

interface PageViewTrackerProps {
  museumId: string
  pageType: 'home' | 'object' | 'events' | 'visit' | 'embed'
  objectId?: string
}

export default function PageViewTracker({ museumId, pageType, objectId }: PageViewTrackerProps) {
  useEffect(() => {
    // Fire-and-forget — never block the page or show errors
    fetch('/api/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ museum_id: museumId, page_type: pageType, object_id: objectId }),
    }).catch(() => {})
  }, [museumId, pageType, objectId])

  return null
}
