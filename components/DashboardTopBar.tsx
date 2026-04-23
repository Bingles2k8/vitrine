'use client'

import { createContext, useContext, type ReactNode } from 'react'

interface DashboardContextValue {
  museum: any | null
  pathname: string
  isShallow: boolean
}

const DashboardContext = createContext<DashboardContextValue>({
  museum: null,
  pathname: '',
  isShallow: false,
})

export function DashboardProvider({
  value,
  children,
}: {
  value: DashboardContextValue
  children: ReactNode
}) {
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboardContext(): DashboardContextValue {
  return useContext(DashboardContext)
}

type Variant = 'primary' | 'secondary' | 'ghost'

interface TopBarButtonBaseProps {
  variant?: Variant
  disabled?: boolean
  title?: string
  children: ReactNode
  className?: string
}

type TopBarButtonProps =
  | (TopBarButtonBaseProps & {
      as?: 'button'
      onClick?: () => void
      type?: 'button' | 'submit'
    })
  | (TopBarButtonBaseProps & {
      as: 'a'
      href: string
      target?: string
      rel?: string
      onClick?: () => void
    })

function variantClasses(variant: Variant): string {
  switch (variant) {
    case 'primary':
      return 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-100 px-4 py-2'
    case 'secondary':
      return 'border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 px-3 py-1.5'
    case 'ghost':
      return 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 px-3 py-1.5'
  }
}

export function TopBarButton(props: TopBarButtonProps) {
  const { variant = 'secondary', disabled, title, children, className = '' } = props
  const baseCls = 'inline-flex items-center text-xs font-mono rounded flex-shrink-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const cls = `${baseCls} ${variantClasses(variant)} ${className}`.trim()

  if (props.as === 'a') {
    return (
      <a
        href={props.href}
        target={props.target}
        rel={props.rel}
        onClick={props.onClick}
        title={title}
        className={cls}
        aria-disabled={disabled || undefined}
      >
        {children}
      </a>
    )
  }

  return (
    <button
      type={props.type ?? 'button'}
      onClick={props.onClick}
      disabled={disabled}
      title={title}
      className={cls}
    >
      {children}
    </button>
  )
}

interface DashboardTopBarProps {
  title: ReactNode
  actions?: ReactNode
  subRow?: ReactNode
}

export default function DashboardTopBar({ title, actions, subRow }: DashboardTopBarProps) {
  const { museum, isShallow } = useDashboardContext()
  const showPublicLink =
    isShallow && ['community', 'hobbyist'].includes(museum?.plan ?? '') && !!museum?.slug

  const titleNode =
    typeof title === 'string' ? (
      <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100 truncate">{title}</span>
    ) : (
      title
    )

  return (
    <>
      <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
        <div className="flex items-center min-w-0">{titleNode}</div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {actions}
          {showPublicLink && (
            <TopBarButton
              as="a"
              href={`/museum/${museum.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
            >
              View public site ↗
            </TopBarButton>
          )}
        </div>
      </div>
      {subRow && (
        <div className="px-4 md:px-8 py-3 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 sticky top-14 z-10">
          {subRow}
        </div>
      )}
    </>
  )
}
