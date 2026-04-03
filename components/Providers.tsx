'use client'

import { ToastProvider } from './Toast'
import { LearnModeProvider } from './LearnModeProvider'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <LearnModeProvider>
        {children}
      </LearnModeProvider>
    </ToastProvider>
  )
}
