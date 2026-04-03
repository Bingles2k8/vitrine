'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import LearnTooltipOverlay from './LearnTooltipOverlay'

interface LearnModeContextValue {
  learnMode: boolean
  setLearnMode: (v: boolean) => void
}

const LearnModeContext = createContext<LearnModeContextValue>({ learnMode: false, setLearnMode: () => {} })

export function useLearnMode() {
  return useContext(LearnModeContext)
}

export function LearnModeProvider({ children }: { children: ReactNode }) {
  const [learnMode, setLearnModeState] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('learnMode')
    if (stored === 'true') {
      setLearnModeState(true)
      document.documentElement.classList.add('learn-mode')
    }
  }, [])

  function setLearnMode(v: boolean) {
    setLearnModeState(v)
    localStorage.setItem('learnMode', String(v))
    if (v) {
      document.documentElement.classList.add('learn-mode')
    } else {
      document.documentElement.classList.remove('learn-mode')
    }
  }

  return (
    <LearnModeContext.Provider value={{ learnMode, setLearnMode }}>
      {children}
      {learnMode && <LearnTooltipOverlay />}
    </LearnModeContext.Provider>
  )
}
