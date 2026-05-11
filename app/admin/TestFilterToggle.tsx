'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function TestFilterToggle({ hideTest }: { hideTest: boolean }) {
  const router = useRouter()
  const params = useSearchParams()

  function toggle() {
    const next = new URLSearchParams(params.toString())
    if (hideTest) {
      next.delete('hideTest')
    } else {
      next.set('hideTest', '1')
    }
    router.push(`/admin?${next.toString()}`)
  }

  return (
    <button
      onClick={toggle}
      className={`text-sm border rounded px-3 py-1.5 transition-colors ${
        hideTest
          ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
      }`}
    >
      {hideTest ? 'Showing real accounts only' : 'Show all accounts'}
    </button>
  )
}
