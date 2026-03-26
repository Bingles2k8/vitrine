'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

export default function DiscoverCategoryScroll({ children, className }: { children: React.ReactNode, className?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [atBottom, setAtBottom] = useState(false)

  const update = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 4)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [update])

  return (
    <div
      className={`flex flex-col min-h-0 ${className ?? ''}`}
      style={{ maskImage: atBottom ? 'none' : 'linear-gradient(to bottom, black, black calc(100% - 2rem), transparent)' }}
    >
      <div
        ref={scrollRef}
        className="overflow-y-auto min-h-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  )
}
