'use client'

type Field = {
  label: string
  complete: boolean
}

type Section = {
  id: string
  label: string
  complete: boolean
  fields: Field[]
}

type Props = {
  sections: Section[]
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function ObjectProgressSidebar({ sections, activeTab, onTabChange }: Props) {
  const completedCount = sections.filter(s => s.complete).length

  return (
    <div className="space-y-1">
      <div className="text-xs font-mono text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-3">
        {completedCount}/{sections.length} complete
      </div>
      {sections.map(section => {
        const isActive = activeTab === section.id
        const isDone = section.complete

        return (
          <div key={section.id}>
            <button
              type="button"
              onClick={() => onTabChange(section.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center gap-2 ${
                isActive
                  ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium'
                  : isDone
                    ? 'text-stone-400 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-500'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/50'
              }`}
            >
              <span className={`w-4 h-4 shrink-0 flex items-center justify-center rounded-full border text-xs ${
                isDone
                  ? 'border-stone-300 dark:border-stone-600 bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500'
                  : isActive
                    ? 'border-stone-400 dark:border-stone-500'
                    : 'border-stone-300 dark:border-stone-600'
              }`}>
                {isDone && (
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3 5.5L6.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              <span className={isDone && !isActive ? 'line-through' : ''}>{section.label}</span>
            </button>

            {isActive && (
              <div className="ml-3 mt-1 mb-1 pl-4 border-l border-stone-200 dark:border-stone-700 space-y-1">
                {section.fields.map(field => (
                  <div
                    key={field.label}
                    className={`flex items-center gap-2 py-0.5 text-xs ${
                      field.complete
                        ? 'text-stone-400 dark:text-stone-600'
                        : 'text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <span className={`w-3 h-3 shrink-0 flex items-center justify-center rounded-full border ${
                      field.complete
                        ? 'border-stone-300 dark:border-stone-600 bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500'
                        : 'border-stone-400 dark:border-stone-500'
                    }`}>
                      {field.complete && (
                        <svg width="6" height="6" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4L3 5.5L6.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                    <span className={field.complete ? 'line-through' : 'font-medium'}>{field.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
