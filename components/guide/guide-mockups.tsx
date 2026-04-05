// Static dashboard mockup components used inside MDX guide content.
// All are pure presentational — no client state needed.
//
// Naming convention:
//   Essentials page → Matt's Coin Collection (mattscoins.vitrine.app)
//   Professional page → Victoria Hamlet Textiles Collection (victoriahamlet.vitrine.app)

function Shell({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="border border-white/8 rounded-xl overflow-hidden shadow-xl my-6 not-prose">
      <div className="bg-stone-900 px-4 py-2.5 flex items-center gap-2 border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
        </div>
        <span className="flex-1 text-center text-xs font-mono text-stone-600">{url}</span>
      </div>
      {children}
    </div>
  )
}

function Sidebar({ active }: { active: string }) {
  const items = [
    { icon: '⬡', label: 'Objects', id: 'objects' },
    { icon: '◫', label: 'Site Builder', id: 'site' },
    { icon: '◈', label: 'Analytics', id: 'analytics' },
    { icon: '◉', label: 'Staff', id: 'staff' },
    { icon: '⚙', label: 'Settings', id: 'settings' },
  ]
  return (
    <div className="w-40 border-r border-white/5 p-3 flex-shrink-0">
      <div className="text-amber-500 font-serif italic text-sm mb-4 px-2">Vitrine.</div>
      <div className="text-xs text-stone-600 uppercase tracking-widest px-2 mb-2">Menu</div>
      {items.map(i => (
        <div key={i.id} className={`text-xs font-mono px-3 py-2 rounded mb-0.5 ${i.id === active ? 'bg-white/10 text-white' : 'text-stone-600'}`}>
          {i.icon} {i.label}
        </div>
      ))}
    </div>
  )
}

// ── Essentials — Matt's Coin Collection ───────────────────────────────────────

const COIN_OBJECTS = [
  ['🪙', 'Roman denarius — Emperor Hadrian', '117 CE', 'Silver', 'On Display', 'emerald'],
  ['🪙', 'Victorian penny — Queen Victoria', '1887', 'Copper', 'On Display', 'emerald'],
  ['🪙', 'Byzantine solidus', '680 CE', 'Gold', 'In Storage', 'stone'],
]

export function EssentialsDashboardMockup() {
  return (
    <Shell url="vitrine.app/dashboard">
      <div className="bg-stone-900 flex">
        <Sidebar active="objects" />
        <div className="flex-1 p-4">
          <div className="text-xs text-stone-500 font-mono mb-4">Your collection at a glance</div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[['Total objects', '34'], ['On Display', '21'], ['In Storage', '11'], ['On Loan', '2']].map(([l, v]) => (
              <div key={l} className="bg-white/5 border border-white/5 rounded-lg p-3">
                <div className="text-xs text-stone-600 mb-1">{l}</div>
                <div className="font-serif text-xl text-white">{v}</div>
              </div>
            ))}
          </div>
          <div className="bg-white/5 border border-white/5 rounded-lg overflow-hidden">
            <div className="grid grid-cols-4 gap-3 px-4 py-2 border-b border-white/5">
              {['Object', 'Year', 'Medium', 'Status'].map(h => (
                <div key={h} className="text-xs text-stone-600 uppercase tracking-widest">{h}</div>
              ))}
            </div>
            {COIN_OBJECTS.map(([e, t, y, m, s, c]) => (
              <div key={t as string} className="grid grid-cols-4 gap-3 px-4 py-2.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm flex-shrink-0">{e}</span>
                  <span className="text-xs text-stone-300 truncate">{t}</span>
                </div>
                <div className="text-xs font-mono text-stone-500">{y}</div>
                <div className="text-xs text-stone-500 truncate">{m}</div>
                <div>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${c === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-stone-500/10 text-stone-500'}`}>{s}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  )
}

export function AddObjectFormMockup() {
  return (
    <Shell url="vitrine.app/dashboard/objects/new">
      <div className="bg-stone-900 flex">
        <Sidebar active="objects" />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-stone-300 font-mono">New object</span>
            <span className="text-xs font-mono bg-amber-500 text-stone-950 px-3 py-1 rounded">Save</span>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 space-y-3">
              {[
                { label: 'Title', value: 'Medieval groat — Edward III', required: true },
                { label: 'Date / year', value: '1351', required: false },
                { label: 'Medium', value: 'Silver', required: false },
                { label: 'Dimensions', value: '32 mm diameter', required: false },
              ].map(f => (
                <div key={f.label}>
                  <div className="text-xs text-stone-500 font-mono mb-1">
                    {f.label}{f.required && <span className="text-amber-500 ml-0.5">*</span>}
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-stone-300">{f.value}</div>
                </div>
              ))}
              <div>
                <div className="text-xs text-stone-500 font-mono mb-1">Status</div>
                <div className="bg-white/5 border border-white/10 rounded px-3 py-2 text-xs flex items-center justify-between">
                  <span className="text-emerald-400">On Display</span>
                  <span className="text-stone-600">▾</span>
                </div>
              </div>
            </div>
            <div className="w-28 flex-shrink-0">
              <div className="text-xs text-stone-500 font-mono mb-1">Image</div>
              <div className="bg-white/5 border border-dashed border-white/10 rounded-lg aspect-square flex flex-col items-center justify-center gap-1">
                <span className="text-stone-600 text-lg">📷</span>
                <span className="text-xs text-stone-600 text-center leading-tight">Drag or click to upload</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}

export function EssentialsObjectDetailMockup() {
  return (
    <Shell url="vitrine.app/dashboard/objects/...">
      <div className="bg-stone-900 flex">
        <Sidebar active="objects" />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-stone-200 font-mono mb-0.5">Roman denarius — Emperor Hadrian</div>
              <div className="text-xs text-stone-600">Silver · 117 CE</div>
            </div>
            <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full">On Display</span>
          </div>
          <div className="flex gap-1 mb-3 border-b border-white/5">
            {['Details', 'Provenance', 'Images'].map((tab, i) => (
              <div key={tab} className={`text-xs font-mono px-3 py-2 ${i === 0 ? 'border-b-2 border-amber-500 text-amber-400 -mb-px' : 'text-stone-600'}`}>{tab}</div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Medium', value: 'Silver' },
              { label: 'Dimensions', value: '18 mm, 3.3 g' },
              { label: 'Acquired', value: '2018, purchase' },
              { label: 'Accession no.', value: 'MCC-2018-007' },
            ].map(f => (
              <div key={f.label} className="bg-white/5 border border-white/5 rounded-lg p-3">
                <div className="text-xs text-stone-600 mb-0.5">{f.label}</div>
                <div className="text-xs text-stone-300">{f.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  )
}

export function ObjectSearchMockup() {
  return (
    <Shell url="vitrine.app/dashboard/objects">
      <div className="bg-stone-900 flex">
        <Sidebar active="objects" />
        <div className="flex-1 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 flex items-center gap-2">
              <span className="text-stone-600 text-xs">🔍</span>
              <span className="text-xs text-stone-400 font-mono">silver</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-stone-400 flex items-center gap-1">
              <span>Status: All</span><span className="text-stone-600">▾</span>
            </div>
          </div>
          <div className="text-xs text-stone-600 font-mono mb-2">4 results</div>
          <div className="bg-white/5 border border-white/5 rounded-lg overflow-hidden">
            {[
              ['🪙', 'Roman denarius — Hadrian', '117 CE', 'On Display', 'emerald'],
              ['🪙', 'Medieval groat — Edward III', '1351', 'On Display', 'emerald'],
              ['🪙', 'Tudor shilling — Henry VIII', '1544', 'In Storage', 'stone'],
              ['🪙', 'Celtic stater', '50 BCE', 'On Display', 'emerald'],
            ].map(([e, t, y, s, c]) => (
              <div key={t as string} className="grid grid-cols-3 gap-3 px-4 py-2.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{e}</span>
                  <span className="text-xs text-stone-300 truncate">{t}</span>
                </div>
                <div className="text-xs font-mono text-stone-500">{y}</div>
                <span className={`text-xs font-mono px-2 py-0.5 rounded-full w-fit ${c === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-stone-500/10 text-stone-500'}`}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  )
}

export function PublicSiteMockup() {
  return (
    <Shell url="mattscoins.vitrine.app">
      <div className="bg-stone-800/60 p-4">
        <div className="bg-stone-800 border border-white/5 rounded-xl overflow-hidden">
          <div className="bg-stone-700/50 px-5 py-3 flex items-center justify-between border-b border-white/5">
            <span className="font-serif italic text-stone-200 text-sm">Matt's Coin Collection<span className="text-amber-500">.</span></span>
            <div className="flex gap-4 text-xs text-stone-500 font-mono">
              <span className="text-stone-300">Collection</span>
            </div>
          </div>
          <div className="p-5">
            <div className="mb-4">
              <div className="h-2 w-56 bg-stone-600 rounded mb-2" />
              <div className="h-2 w-40 bg-stone-700 rounded" />
            </div>
            <div className="flex gap-2 mb-4">
              <div className="flex-1 bg-white/5 border border-white/5 rounded px-3 py-1.5 text-xs text-stone-500 font-mono">Search the collection…</div>
              <div className="bg-white/5 border border-white/5 rounded px-3 py-1.5 text-xs text-stone-600">All statuses ▾</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[['🪙', 'Roman denarius'], ['🪙', 'Victorian penny'], ['🪙', 'Medieval groat']].map(([e, t]) => (
                <div key={t as string} className="bg-stone-700/40 rounded-lg p-3 flex flex-col items-center gap-2">
                  <span className="text-2xl">{e}</span>
                  <span className="text-xs text-stone-400 text-center">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}

export function SiteBuilderMockup() {
  return (
    <Shell url="vitrine.app/dashboard/site">
      <div className="bg-stone-900 flex">
        <Sidebar active="site" />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-stone-300 font-mono">Site Builder</span>
            <div className="flex gap-2">
              <span className="text-xs font-mono border border-white/10 text-stone-400 px-3 py-1 rounded">Preview</span>
              <span className="text-xs font-mono bg-amber-500 text-stone-950 px-3 py-1 rounded">Publish</span>
            </div>
          </div>
          <div className="flex gap-1 mb-3 border-b border-white/5">
            {['Appearance', 'Content', 'Social links'].map((tab, i) => (
              <div key={tab} className={`text-xs font-mono px-3 py-2 ${i === 0 ? 'border-b-2 border-amber-500 text-amber-400 -mb-px' : 'text-stone-600'}`}>{tab}</div>
            ))}
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-stone-500 font-mono mb-1">Template</div>
              <div className="grid grid-cols-3 gap-2">
                {['Minimal', 'Dramatic', 'Archival'].map((t, i) => (
                  <div key={t} className={`border rounded-lg p-3 text-center text-xs font-mono ${i === 2 ? 'border-amber-500/40 text-amber-400 bg-amber-500/5' : 'border-white/8 text-stone-600'}`}>{t}</div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-stone-500 font-mono mb-1">Accent colour</div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-500 border border-white/10 flex-shrink-0" />
                <div className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-xs font-mono text-stone-400">#f59e0b</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-stone-500 font-mono mb-1">Logo</div>
              <div className="bg-white/5 border border-dashed border-white/10 rounded-lg px-3 py-2 flex items-center gap-2">
                <span className="text-stone-600 text-xs">📁</span>
                <span className="text-xs text-stone-600">coins-logo.png</span>
                <span className="text-xs text-emerald-400 ml-auto">✓ uploaded</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}

export function FeaturedObjectsMockup() {
  return (
    <Shell url="vitrine.app/dashboard/site">
      <div className="bg-stone-900 flex">
        <Sidebar active="site" />
        <div className="flex-1 p-4">
          <div className="flex gap-1 mb-3 border-b border-white/5">
            {['Appearance', 'Content', 'Social links'].map((tab, i) => (
              <div key={tab} className={`text-xs font-mono px-3 py-2 ${i === 1 ? 'border-b-2 border-amber-500 text-amber-400 -mb-px' : 'text-stone-600'}`}>{tab}</div>
            ))}
          </div>
          <div className="text-xs text-stone-500 font-mono mb-3">Featured objects (drag to reorder)</div>
          <div className="space-y-2 mb-3">
            {[
              ['🪙', 'Roman denarius — Emperor Hadrian'],
              ['🪙', 'Victorian penny — Queen Victoria'],
              ['🪙', 'Byzantine solidus'],
            ].map(([e, t]) => (
              <div key={t as string} className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-lg px-3 py-2">
                <span className="text-stone-600 cursor-move text-xs">⠿</span>
                <span className="text-sm">{e}</span>
                <span className="text-xs text-stone-300 flex-1">{t}</span>
                <span className="text-xs text-stone-600 hover:text-red-400 cursor-pointer">✕</span>
              </div>
            ))}
          </div>
          <div className="border border-dashed border-white/10 rounded-lg px-3 py-2 text-xs text-stone-600 text-center">+ Add featured object</div>
        </div>
      </div>
    </Shell>
  )
}

export function EssentialsAccountSettingsMockup() {
  return (
    <Shell url="vitrine.app/dashboard/plan">
      <div className="bg-stone-900 flex">
        <Sidebar active="settings" />
        <div className="flex-1 p-4">
          <div className="text-sm text-stone-300 font-mono mb-4">Your plan</div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-mono text-amber-400 uppercase tracking-widest">Hobbyist</span>
                <div className="font-serif text-2xl text-white mt-0.5">£5<span className="text-stone-500 text-sm font-sans font-light"> / month</span></div>
              </div>
              <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full">Active</span>
            </div>
            <div className="text-xs text-stone-500">Next billing: 1 May 2026</div>
          </div>
          <div className="space-y-2 mb-4">
            {[
              { label: 'Objects used', used: 34, max: 500 },
              { label: 'Images uploaded', used: 52, max: null },
            ].map(m => (
              <div key={m.label}>
                <div className="flex justify-between text-xs font-mono text-stone-500 mb-1">
                  <span>{m.label}</span>
                  <span>{m.used}{m.max ? ` / ${m.max}` : ''}</span>
                </div>
                {m.max && (
                  <div className="w-full bg-white/5 rounded-full h-1">
                    <div className="bg-amber-500/60 h-1 rounded-full" style={{ width: `${(m.used / m.max) * 100}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="flex-1 border border-white/10 rounded px-3 py-2 text-xs font-mono text-stone-400 text-center">Cancel subscription</div>
            <div className="flex-1 bg-amber-500 rounded px-3 py-2 text-xs font-mono text-stone-950 text-center">Upgrade plan</div>
          </div>
        </div>
      </div>
    </Shell>
  )
}

// ── Professional — Victoria Hamlet Textiles Collection ───────────────────────────────

const LCV_OBJECTS = [
  ['🖼️', "Turner's Thames at Sunset", '1809', 'Oil on canvas', 'On Display', 'emerald'],
  ['🏺', 'Egyptian shabti — Amenhotep II', '1400 BCE', 'Faience', 'On Display', 'emerald'],
  ['🗿', 'Roman mosaic fragment', '200 CE', 'Tesserae', 'In Storage', 'stone'],
]

export function ProDashboardMockup() {
  return (
    <Shell url="vitrine.app/dashboard">
      <div className="bg-stone-900 flex">
        <Sidebar active="objects" />
        <div className="flex-1 p-4">
          <div className="text-xs text-stone-500 font-mono mb-4">Your collection at a glance</div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[['Total objects', '2,847'], ['On Display', '1,203'], ['In Storage', '1,512'], ['On Loan', '132']].map(([l, v]) => (
              <div key={l} className="bg-white/5 border border-white/5 rounded-lg p-3">
                <div className="text-xs text-stone-600 mb-1">{l}</div>
                <div className="font-serif text-xl text-white">{v}</div>
              </div>
            ))}
          </div>
          <div className="bg-white/5 border border-white/5 rounded-lg overflow-hidden">
            <div className="grid grid-cols-4 gap-3 px-4 py-2 border-b border-white/5">
              {['Object', 'Year', 'Medium', 'Status'].map(h => (
                <div key={h} className="text-xs text-stone-600 uppercase tracking-widest">{h}</div>
              ))}
            </div>
            {LCV_OBJECTS.map(([e, t, y, m, s, c]) => (
              <div key={t as string} className="grid grid-cols-4 gap-3 px-4 py-2.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm flex-shrink-0">{e}</span>
                  <span className="text-xs text-stone-300 truncate">{t}</span>
                </div>
                <div className="text-xs font-mono text-stone-500">{y}</div>
                <div className="text-xs text-stone-500 truncate">{m}</div>
                <div>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${c === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-stone-500/10 text-stone-500'}`}>{s}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  )
}

export function ProObjectDetailMockup() {
  return (
    <Shell url="vitrine.app/dashboard/objects/...">
      <div className="bg-stone-900 flex">
        <Sidebar active="objects" />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-stone-200 font-mono mb-0.5">Turner's Thames at Sunset</div>
              <div className="text-xs text-stone-600">Oil on canvas · 1809</div>
            </div>
            <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full">On Display</span>
          </div>
          <div className="flex gap-1 mb-3 border-b border-white/5">
            {['Details', 'Provenance', 'Conservation', 'Rights', 'Documents'].map((tab, i) => (
              <div key={tab} className={`text-xs font-mono px-3 py-2 ${i === 0 ? 'border-b-2 border-amber-500 text-amber-400 -mb-px' : 'text-stone-600'}`}>{tab}</div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Medium', value: 'Oil on canvas' },
              { label: 'Dimensions', value: '91.4 × 121.9 cm' },
              { label: 'Acquired', value: '1947, bequest' },
              { label: 'Accession no.', value: 'LCV-1947-003' },
            ].map(f => (
              <div key={f.label} className="bg-white/5 border border-white/5 rounded-lg p-3">
                <div className="text-xs text-stone-600 mb-0.5">{f.label}</div>
                <div className="text-xs text-stone-300">{f.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  )
}

export function ObjectWithDocumentsMockup() {
  return (
    <Shell url="vitrine.app/dashboard/objects/...">
      <div className="bg-stone-900 flex">
        <Sidebar active="objects" />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-stone-200 font-mono">Egyptian shabti — Amenhotep II</div>
              <div className="text-xs text-stone-600">Faience · 1400 BCE · LCV-1923-041</div>
            </div>
            <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full">On Display</span>
          </div>
          <div className="flex gap-1 mb-3 border-b border-white/5">
            {['Details', 'Provenance', 'Conservation', 'Rights', 'Documents'].map((tab, i) => (
              <div key={tab} className={`text-xs font-mono px-3 py-2 ${i === 4 ? 'border-b-2 border-amber-500 text-amber-400 -mb-px' : 'text-stone-600'}`}>{tab}</div>
            ))}
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-stone-500 font-mono">3 documents attached</span>
            <span className="text-xs font-mono bg-amber-500 text-stone-950 px-3 py-1 rounded">+ Attach</span>
          </div>
          <div className="space-y-2">
            {[
              { icon: '📄', name: 'Acquisition deed 1923.pdf', size: '1.4 MB', label: 'Acquisition' },
              { icon: '📄', name: 'Condition report 2022.pdf', size: '2.8 MB', label: 'Conservation' },
              { icon: '📄', name: 'Export licence Egypt 1923.pdf', size: '740 KB', label: 'Provenance' },
            ].map(d => (
              <div key={d.name} className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-lg px-3 py-2.5">
                <span className="text-base flex-shrink-0">{d.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-stone-300 truncate">{d.name}</div>
                  <div className="text-xs text-stone-600 font-mono">{d.size}</div>
                </div>
                <span className="text-xs font-mono bg-stone-800 text-stone-500 px-2 py-0.5 rounded-full flex-shrink-0">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  )
}

export function ProPublicSiteMockup() {
  return (
    <Shell url="victoriahamlet.vitrine.app">
      <div className="bg-stone-800/60 p-0">
        <div className="bg-stone-700/50 px-5 py-3 flex items-center justify-between border-b border-white/5">
          <span className="font-serif italic text-stone-200 text-sm">Victoria Hamlet Textiles Collection<span className="text-amber-500">.</span></span>
          <div className="flex gap-4 text-xs font-mono">
            <span className="text-stone-500">Collection</span>
            <span className="text-stone-500">About</span>
            <span className="text-stone-300 border-b border-amber-500">Visit</span>
            <span className="text-stone-500">Events</span>
          </div>
        </div>
        <div className="p-5 bg-stone-800/60">
          <h3 className="font-serif italic text-stone-200 text-xl mb-1">Plan your visit</h3>
          <p className="text-xs text-stone-500 mb-4">Victoria Hamlet Textiles Collection · Open daily, 10:00–18:00</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { l: 'Opening hours', v: 'Daily 10:00–18:00' },
              { l: 'Admission', v: 'Free entry' },
              { l: 'Address', v: 'Exhibition Road, London' },
              { l: 'Accessibility', v: 'Step-free · Audio guides' },
            ].map(f => (
              <div key={f.l} className="bg-stone-800 border border-white/5 rounded-lg p-3">
                <div className="text-xs text-stone-600 uppercase tracking-widest mb-0.5">{f.l}</div>
                <div className="text-xs text-stone-300">{f.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  )
}

export function AnalyticsDashboardMockup() {
  const bars = [45, 62, 58, 80, 74, 91, 68]
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return (
    <Shell url="vitrine.app/dashboard/analytics">
      <div className="bg-stone-900 flex">
        <Sidebar active="analytics" />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-stone-300 font-mono">Analytics</span>
            <div className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-xs text-stone-400 flex items-center gap-1">
              Last 7 days <span className="text-stone-600">▾</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[['Page views', '18,204'], ['Unique visitors', '6,891'], ['Avg. time on site', '3m 12s']].map(([l, v]) => (
              <div key={l} className="bg-white/5 border border-white/5 rounded-lg p-3">
                <div className="text-xs text-stone-500 mb-1">{l}</div>
                <div className="font-serif text-xl text-white">{v}</div>
                <div className="text-xs text-emerald-400 font-mono mt-1">+9% this week</div>
              </div>
            ))}
          </div>
          <div className="bg-white/5 border border-white/5 rounded-lg p-3 mb-3">
            <div className="text-xs text-stone-500 font-mono mb-3">Page views — last 7 days</div>
            <div className="flex items-end gap-1.5 h-14">
              {bars.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-amber-500/70" style={{ height: `${h}%` }} />
                  <span className="text-xs text-stone-600 font-mono">{days[i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-lg p-3">
            <div className="text-xs text-stone-500 font-mono mb-2">Top objects this week</div>
            {[["Turner's Thames at Sunset", '1,842'], ['Egyptian shabti — Amenhotep II', '1,304'], ['Roman mosaic fragment', '987']].map(([o, v]) => (
              <div key={o} className="flex justify-between text-xs py-1.5 border-b border-white/5 last:border-0">
                <span className="text-stone-400 truncate">{o}</span>
                <span className="text-amber-400 font-mono ml-4">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  )
}

export function EventsDashboardMockup() {
  return (
    <Shell url="vitrine.app/dashboard/events">
      <div className="bg-stone-900 flex">
        <Sidebar active="objects" />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-stone-300 font-mono">Upcoming events</span>
            <span className="text-xs font-mono bg-amber-500 text-stone-950 px-3 py-1 rounded">+ New event</span>
          </div>
          <div className="space-y-2">
            {[
              { title: 'Turner & the Thames: Curator Tour', date: '14 Apr · 14:00', type: 'Guided tour', booked: 37, cap: 40 },
              { title: 'Ancient Egypt Evening Lecture', date: '22 Apr · 18:30', type: 'Lecture', booked: 54, cap: 60 },
              { title: 'Family Archaeology Day', date: '5 May · 10:00', type: 'Public event', booked: 143, cap: 300 },
            ].map(ev => {
              const pct = Math.round((ev.booked / ev.cap) * 100)
              return (
                <div key={ev.title} className="bg-white/5 border border-white/5 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm text-stone-200">{ev.title}</div>
                      <div className="text-xs text-stone-600 font-mono">{ev.date} · {ev.type}</div>
                    </div>
                    <span className="text-xs font-mono text-amber-400">{ev.booked}/{ev.cap}</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1">
                    <div className={`h-1 rounded-full ${pct > 85 ? 'bg-amber-500' : 'bg-emerald-500/60'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Shell>
  )
}

export function NewEventFormMockup() {
  return (
    <Shell url="vitrine.app/dashboard/events/new">
      <div className="bg-stone-900 flex">
        <Sidebar active="objects" />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-stone-300 font-mono">New event</span>
            <span className="text-xs font-mono bg-amber-500 text-stone-950 px-3 py-1 rounded">Publish event</span>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Event title', value: 'Turner & the Thames: Curator Tour' },
              { label: 'Date & time', value: '14 April 2026 at 14:00' },
              { label: 'Capacity', value: '40 attendees' },
              { label: 'Ticket price', value: '£12.00 per person' },
            ].map(f => (
              <div key={f.label}>
                <div className="text-xs text-stone-500 font-mono mb-1">{f.label}</div>
                <div className="bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-stone-300">{f.value}</div>
              </div>
            ))}
            <div className="flex items-center gap-2 py-1">
              <div className="w-4 h-4 rounded bg-amber-500 flex items-center justify-center flex-shrink-0">
                <span className="text-stone-950 text-xs">✓</span>
              </div>
              <span className="text-xs text-stone-400">Booking form closes when capacity is reached</span>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}

export function StaffDashboardMockup() {
  return (
    <Shell url="vitrine.app/dashboard/staff">
      <div className="bg-stone-900 flex">
        <Sidebar active="staff" />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-stone-300 font-mono">Staff & roles</span>
            <span className="text-xs font-mono bg-amber-500 text-stone-950 px-3 py-1 rounded">+ Invite</span>
          </div>
          <div className="space-y-2">
            {[
              { name: 'Eleanor Hartley', role: 'Admin', initials: 'EH', status: 'Active', active: true },
              { name: 'Dr. Kwame Asante', role: 'Curator', initials: 'KA', status: 'Active', active: true },
              { name: 'Mei Nakamura', role: 'Registrar', initials: 'MN', status: 'Active', active: true },
              { name: 'Oliver Bright', role: 'Volunteer', initials: 'OB', status: 'Invite pending', active: false },
            ].map(s => (
              <div key={s.name} className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-lg px-3 py-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-400 text-xs font-mono flex items-center justify-center flex-shrink-0">
                  {s.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-stone-200">{s.name}</div>
                  <div className="text-xs text-stone-600 font-mono">{s.role}</div>
                </div>
                <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${s.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-stone-500/10 text-stone-500'}`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  )
}

export function ComplianceDashboardMockup() {
  return (
    <Shell url="vitrine.app/dashboard/compliance">
      <div className="bg-stone-900 flex">
        <Sidebar active="objects" />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-stone-300 font-mono">Collections compliance</span>
            <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full">79% complete</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5 mb-4">
            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '79%' }} />
          </div>
          <div className="space-y-2">
            {[
              { label: 'Provenance documented', done: 2108, total: 2847, ok: true },
              { label: 'Acquisition method recorded', done: 2847, total: 2847, ok: true },
              { label: 'Conservation status logged', done: 1944, total: 2847, ok: true },
              { label: 'Rights & reproduction status', done: 1203, total: 2847, ok: false },
              { label: 'Loan agreements on file', done: 132, total: 132, ok: true },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-lg px-3 py-2.5">
                <span className={`text-sm flex-shrink-0 ${item.ok ? 'text-emerald-400' : 'text-amber-400'}`}>{item.ok ? '✓' : '!'}</span>
                <span className="text-xs text-stone-300 flex-1">{item.label}</span>
                <span className="text-xs font-mono text-stone-600">{item.done.toLocaleString()}/{item.total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  )
}

export function ProvenanceTabMockup() {
  return (
    <Shell url="vitrine.app/dashboard/objects/...">
      <div className="bg-stone-900 flex">
        <Sidebar active="objects" />
        <div className="flex-1 p-4">
          <div className="text-sm text-stone-300 font-mono mb-1">Egyptian shabti — Amenhotep II</div>
          <div className="flex gap-1 mb-3 border-b border-white/5">
            {['Details', 'Provenance', 'Conservation', 'Rights', 'Documents'].map((tab, i) => (
              <div key={tab} className={`text-xs font-mono px-3 py-2 ${i === 1 ? 'border-b-2 border-amber-500 text-amber-400 -mb-px' : 'text-stone-600'}`}>{tab}</div>
            ))}
          </div>
          <div className="space-y-2 mb-3">
            {[
              { date: '~1400 BCE', desc: 'Funerary object placed in the tomb of Amenhotep II, Valley of the Kings.' },
              { date: '1923', desc: 'Excavated by the Anglo-Egyptian Expedition under licence; transferred to London.' },
              { date: '1923', desc: 'Donated to the Victoria Hamlet Textiles Collection by Lord Ashworth.' },
              { date: '2019', desc: 'Condition assessment and conservation cleaning carried out on-site.' },
            ].map((e, i) => (
              <div key={i} className="flex gap-3 bg-white/5 border border-white/5 rounded-lg px-3 py-2.5">
                <span className="text-xs font-mono text-amber-400 flex-shrink-0 mt-0.5 w-16">{e.date}</span>
                <span className="text-xs text-stone-400">{e.desc}</span>
              </div>
            ))}
          </div>
          <div className="border border-dashed border-white/10 rounded-lg px-3 py-2 text-xs text-stone-600 text-center">+ Add provenance entry</div>
        </div>
      </div>
    </Shell>
  )
}

export function ProAccountSettingsMockup() {
  return (
    <Shell url="vitrine.app/dashboard/plan">
      <div className="bg-stone-900 flex">
        <Sidebar active="settings" />
        <div className="flex-1 p-4">
          <div className="text-sm text-stone-300 font-mono mb-4">Your plan</div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-mono text-amber-400 uppercase tracking-widest">Professional</span>
                <div className="font-serif text-2xl text-white mt-0.5">£79<span className="text-stone-500 text-sm font-sans font-light"> / month</span></div>
              </div>
              <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full">Active</span>
            </div>
            <div className="text-xs text-stone-500">Next billing: 1 May 2026</div>
          </div>
          <div className="space-y-2 mb-4">
            {[
              { label: 'Objects used', used: 2847, max: 5000 },
              { label: 'Document storage', used: 0.7, max: 1, unit: 'GB' },
            ].map(m => (
              <div key={m.label}>
                <div className="flex justify-between text-xs font-mono text-stone-500 mb-1">
                  <span>{m.label}</span>
                  <span>{m.unit ? `${m.used} / ${m.max} ${m.unit}` : `${m.used} / ${m.max}`}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1">
                  <div className="bg-amber-500/60 h-1 rounded-full" style={{ width: `${(m.used / m.max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="flex-1 border border-white/10 rounded px-3 py-2 text-xs font-mono text-stone-400 text-center">Cancel subscription</div>
            <div className="flex-1 bg-amber-500 rounded px-3 py-2 text-xs font-mono text-stone-950 text-center">Upgrade to Institution</div>
          </div>
        </div>
      </div>
    </Shell>
  )
}
