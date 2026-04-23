'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { extractYear } from '@/lib/dateParse'

interface TimelineObject {
  id: string
  title: string
  emoji?: string | null
  image_url?: string | null
  production_date?: string | null
  acquisition_date?: string | null
  year?: string | null
}

interface CollectionTimelineProps {
  objects: TimelineObject[]
  basis?: 'production' | 'acquisition'
  onClickObject?: (id: string) => void
}

export default function CollectionTimeline({ objects, basis = 'production', onClickObject }: CollectionTimelineProps) {
  const router = useRouter()

  const { columns, unknown } = useMemo(() => {
    const byYear = new Map<number, TimelineObject[]>()
    const unknownList: TimelineObject[] = []
    for (const o of objects) {
      const source = basis === 'acquisition'
        ? o.acquisition_date
        : (o.production_date || o.year)
      const y = extractYear(source)
      if (y === null) { unknownList.push(o); continue }
      if (!byYear.has(y)) byYear.set(y, [])
      byYear.get(y)!.push(o)
    }
    const years = Array.from(byYear.keys()).sort((a, b) => a - b)
    return {
      columns: years.map(y => ({ year: y, objects: byYear.get(y)! })),
      unknown: unknownList,
    }
  }, [objects, basis])

  function handleClick(id: string) {
    if (onClickObject) onClickObject(id)
    else router.push(`/dashboard/objects/${id}`)
  }

  if (columns.length === 0 && unknown.length === 0) {
    return (
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-12 text-center">
        <p className="text-sm text-stone-400 dark:text-stone-500">
          No objects with a {basis === 'acquisition' ? 'acquisition' : 'production'} year yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg">
        <div className="flex gap-6 p-6 min-w-max">
          {columns.map(col => (
            <div key={col.year} className="flex flex-col gap-3 min-w-[140px]">
              <div className="text-xs font-mono text-stone-400 dark:text-stone-500 border-b border-stone-200 dark:border-stone-700 pb-1.5">
                {col.year}
                <span className="ml-2 text-stone-300 dark:text-stone-600">({col.objects.length})</span>
              </div>
              <div className="space-y-2">
                {col.objects.map(o => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => handleClick(o.id)}
                    className="w-full flex items-start gap-2 p-2 rounded border border-stone-100 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left"
                  >
                    {o.image_url ? (
                      <img src={o.image_url} alt="" className="w-8 h-8 object-cover rounded shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-sm shrink-0">{o.emoji || '◯'}</div>
                    )}
                    <span className="text-xs text-stone-700 dark:text-stone-300 truncate">{o.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {unknown.length > 0 && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-4">
          <div className="text-xs font-mono text-stone-400 dark:text-stone-500 mb-2">Unknown year ({unknown.length})</div>
          <div className="flex flex-wrap gap-2">
            {unknown.map(o => (
              <button
                key={o.id}
                type="button"
                onClick={() => handleClick(o.id)}
                className="flex items-center gap-2 px-2 py-1 rounded border border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                <span className="text-sm">{o.emoji || '◯'}</span>
                <span className="text-xs text-stone-600 dark:text-stone-400">{o.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
