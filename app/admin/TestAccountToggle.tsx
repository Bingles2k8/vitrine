'use client'

import { useTransition } from 'react'
import { toggleTestAccount } from './actions'

export function TestAccountToggle({ museumId, isTest }: { museumId: string; isTest: boolean }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        const msg = isTest
          ? 'Unmark this as a test account? It will count towards stats and revenue.'
          : 'Mark this as a test account? It will be excluded from stats and revenue.'
        if (!window.confirm(msg)) return
        startTransition(() => toggleTestAccount(museumId, isTest))
      }}
      disabled={pending}
      title={isTest ? 'Unmark as test account' : 'Mark as test account'}
      className={`text-[10px] font-medium px-1.5 py-0.5 rounded border transition-colors disabled:opacity-40 ${
        isTest
          ? 'bg-gray-200 text-gray-500 border-gray-300 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
          : 'bg-white text-gray-300 border-gray-200 hover:bg-gray-100 hover:text-gray-500'
      }`}
    >
      {pending ? '…' : isTest ? 'test ✕' : 'test?'}
    </button>
  )
}
