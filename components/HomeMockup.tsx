/**
 * The dashboard mock from the homepage hero. Pulled out so a hero that has no
 * room for it can still show it as its own block. Markup unchanged.
 */
export default function HomeMockup({ className = '' }: { className?: string }) {
  return (
    <div className={`border border-white/8 rounded-xl overflow-hidden shadow-2xl ${className}`}>
            <div className="bg-stone-900 px-4 py-3 flex items-center gap-2 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-xs font-mono text-stone-600">vitrine.app/my-collection</span>
              </div>
            </div>
            <div className="bg-stone-900 flex">
              <div className="w-32 lg:w-44 border-r border-white/5 p-3 flex-shrink-0">
                <div className="text-amber-500 font-serif italic text-base mb-4 px-2">Vitrine.</div>
                <div className="text-xs text-stone-600 uppercase tracking-widest px-2 mb-2">My collection</div>
                <div className="bg-white/10 text-white text-xs font-mono px-3 py-2 rounded mb-1">⬡ Objects</div>
                <div className="text-stone-500 text-xs font-mono px-3 py-2 mb-1">◫ My site</div>
                <div className="text-stone-500 text-xs font-mono px-3 py-2 mb-1">◈ Analytics</div>
                <div className="text-stone-500 text-xs font-mono px-3 py-2">⋯ Settings</div>
              </div>
              <div className="flex-1 p-3 lg:p-5">
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3 mb-4 lg:mb-5">
                  {[['Total', '347'], ['Est. value', '£12,400'], ['Added this year', '48'], ['For sale', '3']].map(([l, v]) => (
                    <div key={l} className="bg-white/5 rounded-lg p-2 lg:p-3 border border-white/5">
                      <div className="text-xs text-stone-500 mb-1">{l}</div>
                      <div className="font-serif text-xl lg:text-2xl text-white">{v}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-white/5 rounded-lg border border-white/5 overflow-hidden">
                  <div className="grid grid-cols-3 gap-2 lg:grid-cols-4 lg:gap-4 px-3 lg:px-4 py-2 border-b border-white/5">
                    {['Object', 'Year', 'Value', 'Condition'].map(h => (
                      <div key={h} className={`text-xs text-stone-600 uppercase tracking-widest${h === 'Value' ? ' hidden lg:block' : ''}`}>{h}</div>
                    ))}
                  </div>
                  {[
                    ['💿', 'Beatles — Please Please Me', '1963', '£340', 'Mint', 'emerald'],
                    ['📻', 'Braun T3 Pocket Radio', '1958', '£210', 'Good', 'amber'],
                    ['📷', 'Leica M3 (Chrome)', '1954', '£1,200', 'Excellent', 'emerald'],
                  ].map(([emoji, title, year, value, condition, color]) => (
                    <div key={title} className="grid grid-cols-3 gap-2 lg:grid-cols-4 lg:gap-4 px-3 lg:px-4 py-2.5 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm flex-shrink-0">{emoji}</span>
                        <span className="text-xs text-stone-300 truncate">{title}</span>
                      </div>
                      <div className="text-xs font-mono text-stone-500">{year}</div>
                      <div className="text-xs font-mono text-stone-500 hidden lg:block">{value}</div>
                      <div>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {condition}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
  )
}
