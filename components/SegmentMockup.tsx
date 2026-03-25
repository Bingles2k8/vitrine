import type { MockItem, MockDetail } from '@/lib/segments'

// ── List view mockup ─────────────────────────────────────────────────────────

export function MockupListView({
  items,
  collectionName,
}: {
  items: MockItem[]
  collectionName: string
}) {
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden shadow-2xl bg-stone-900">
      {/* Browser chrome */}
      <div className="bg-stone-800 px-4 py-2.5 flex items-center gap-3 border-b border-white/5">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/60" />
          <span className="w-3 h-3 rounded-full bg-amber-400/60" />
          <span className="w-3 h-3 rounded-full bg-green-500/60" />
        </div>
        <div className="flex-1 bg-stone-700/60 rounded text-stone-500 text-xs font-mono px-3 py-1 max-w-xs">
          app.vitrinecms.com/dashboard
        </div>
      </div>

      {/* App chrome */}
      <div className="flex" style={{ height: '280px' }}>
        {/* Sidebar */}
        <div className="w-40 bg-stone-900 border-r border-white/5 flex-shrink-0 p-3 hidden sm:block">
          <p className="text-[10px] uppercase tracking-widest text-stone-600 mb-3 px-2">Collections</p>
          <div className="rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2 mb-1">
            <p className="text-amber-400 text-xs font-medium truncate">{collectionName}</p>
          </div>
          <div className="px-3 py-2 mb-1">
            <p className="text-stone-600 text-xs truncate">Wishlist</p>
          </div>
          <div className="px-3 py-2">
            <p className="text-stone-600 text-xs truncate">Sold</p>
          </div>
        </div>

        {/* Main panel */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between gap-3">
            <div className="bg-stone-800 rounded px-3 py-1.5 text-xs text-stone-500 flex-1 max-w-xs">
              Search items...
            </div>
            <div className="bg-amber-500 rounded px-3 py-1.5 text-xs text-stone-950 font-medium flex-shrink-0">
              + Add item
            </div>
          </div>

          {/* Item rows */}
          <div className="overflow-y-auto flex-1">
            {items.map((item, i) => (
              <div
                key={i}
                className={`px-4 py-2.5 flex items-center gap-3 border-b border-white/5 text-xs ${
                  item.selected ? 'bg-amber-500/5 border-l-2 border-l-amber-500' : ''
                }`}
              >
                <div className="w-7 h-7 rounded bg-stone-700 flex-shrink-0 flex items-center justify-center text-stone-500 text-[10px]">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`truncate font-medium ${item.selected ? 'text-white' : 'text-stone-300'}`}>
                    {item.name}
                  </p>
                  <p className="text-stone-500 truncate">{item.badge}</p>
                </div>
                {item.tag && (
                  <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-stone-700 text-stone-400 hidden sm:inline">
                    {item.tag}
                  </span>
                )}
                <p className={`flex-shrink-0 font-mono text-xs ${item.selected ? 'text-amber-400' : 'text-stone-400'}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Detail view mockup ───────────────────────────────────────────────────────

export function MockupDetailView({ detail }: { detail: MockDetail }) {
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden shadow-2xl bg-stone-900">
      {/* Browser chrome */}
      <div className="bg-stone-800 px-4 py-2.5 flex items-center gap-3 border-b border-white/5">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/60" />
          <span className="w-3 h-3 rounded-full bg-amber-400/60" />
          <span className="w-3 h-3 rounded-full bg-green-500/60" />
        </div>
        <div className="flex-1 bg-stone-700/60 rounded text-stone-500 text-xs font-mono px-3 py-1 max-w-xs">
          app.vitrinecms.com/item/detail
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex" style={{ height: '280px' }}>
        {/* Image placeholder */}
        <div className="w-44 bg-stone-800 flex-shrink-0 border-r border-white/5 flex items-center justify-center hidden sm:flex">
          <div className="text-center">
            <div className="w-20 h-20 rounded-lg bg-stone-700 mx-auto mb-2 flex items-center justify-center text-stone-600">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
            <p className="text-stone-600 text-[10px]">Photo</p>
          </div>
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-white font-medium text-sm mb-4 leading-tight">{detail.heading}</p>
          <div className="space-y-2.5">
            {detail.fields.map((field) => (
              <div key={field.label} className="flex gap-2 text-xs">
                <span className="text-stone-500 w-28 flex-shrink-0">{field.label}</span>
                <span className="text-stone-300">{field.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <div className="bg-stone-700 rounded px-3 py-1.5 text-xs text-stone-400">Edit</div>
            <div className="border border-white/10 rounded px-3 py-1.5 text-xs text-stone-500">Export</div>
          </div>
        </div>
      </div>
    </div>
  )
}
