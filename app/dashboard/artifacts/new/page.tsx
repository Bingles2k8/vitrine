'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NewObjectRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/entry')
  }, [router])

  return null
}
