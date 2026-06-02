'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function DeleteToggle({ showDelete }: { showDelete: boolean }) {
  const router = useRouter()
  const params = useSearchParams()

  function toggle() {
    const next = new URLSearchParams(params.toString())
    if (showDelete) {
      next.delete('delete')
    } else {
      next.set('delete', '1')
    }
    const qs = next.toString()
    router.push(qs ? `/admin?${qs}` : '/admin')
  }

  return (
    <button
      onClick={toggle}
      className={`text-sm border rounded px-3 py-1.5 transition-colors ${
        showDelete
          ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
      }`}
    >
      {showDelete ? 'Delete actions enabled' : 'Enable delete actions'}
    </button>
  )
}
