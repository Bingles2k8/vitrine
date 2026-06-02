'use client'

import { useRouter } from 'next/navigation'

export function ClickableRow({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: React.ReactNode
}) {
  const router = useRouter()

  function handleClick(e: React.MouseEvent<HTMLTableRowElement>) {
    // Don't navigate when the click landed on something interactive — links,
    // buttons, form fields, or anything explicitly opted out via data-no-row-nav.
    const target = e.target as HTMLElement
    if (target.closest('a, button, input, label, [role="dialog"], [data-no-row-nav]')) {
      return
    }
    router.push(href)
  }

  return (
    <tr
      onClick={handleClick}
      onMouseEnter={() => router.prefetch(href)}
      className={`cursor-pointer ${className ?? ''}`}
    >
      {children}
    </tr>
  )
}
