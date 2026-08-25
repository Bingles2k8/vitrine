import type { Template } from '@/lib/templates'

/**
 * A miniature of what a template actually produces.
 *
 * Every shape here is drawn from the real thing: the masthead follows
 * `layout_variant`, the body follows `grid_variant` (including the mosaic's
 * span rhythm from components/collection/grids.tsx), and all three colours are
 * the template's own preview palette. Nothing is invented to look pretty, so a
 * salon hang reads as uneven columns and a catalogue reads as ruled rows.
 *
 * Deliberately not an iframe of a live site: fourteen iframes on one page is a
 * lot of cost for a thumbnail, and several templates have no published example
 * yet.
 */

type P = { t: Template }

function px(radius: number) {
  return Math.min(radius, 3)
}

/** Solid block standing in for a work. */
function Work({ t, className = '', style }: P & { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{ backgroundColor: t.previewText, opacity: 0.22, borderRadius: px(t.card_radius), ...style }}
    />
  )
}

/** A line of label text under or beside a work. */
function Line({ t, w = '70%', accent = false }: P & { w?: string; accent?: boolean }) {
  return (
    <div
      style={{
        width: w,
        height: 2,
        borderRadius: 1,
        backgroundColor: accent ? t.previewAccent : t.previewText,
        opacity: accent ? 0.9 : 0.5,
      }}
    />
  )
}

function Masthead({ t }: P) {
  const wordmark = (w: string) => (
    <div style={{ width: w, height: 4, borderRadius: 1, backgroundColor: t.previewText, opacity: 0.85 }} />
  )
  const navDots = (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 6, height: 2, borderRadius: 1, backgroundColor: t.previewText, opacity: 0.4 }} />
      ))}
    </div>
  )

  switch (t.layout_variant) {
    case 'minimal':
      return <div className="flex justify-center pt-3 pb-3">{wordmark('26%')}</div>
    case 'dramatic':
      return <div className="flex justify-center pt-3 pb-2.5">{wordmark('34%')}</div>
    case 'archival':
      return (
        <div className="pb-2 mb-2" style={{ borderBottom: `1px solid ${t.previewText}`, borderColor: t.previewText }}>
          <div className="flex items-center justify-between pt-2.5">
            {wordmark('30%')}
            {navDots}
          </div>
        </div>
      )
    case 'magazine':
      return <div className="pt-2.5 pb-2.5">{wordmark('62%')}</div>
    case 'text-forward':
      return (
        <div className="pt-2.5 pb-2.5 space-y-1.5">
          {wordmark('40%')}
          <Line t={t} w="88%" />
          <Line t={t} w="72%" />
        </div>
      )
    case 'cover':
      return null // handled by the body — the hero is the page
    default:
      return (
        <div className="flex items-center justify-between pt-2.5 pb-2.5">
          {wordmark('28%')}
          {navDots}
        </div>
      )
  }
}

function Body({ t }: P) {
  const r = px(t.card_radius)

  switch (t.grid_variant) {
    // Gallery plate: matted works, generous air, a quiet caption beneath.
    case 'plate':
      return (
        <div className="grid grid-cols-3 gap-2.5 px-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-1">
              <Work t={t} className="w-full" style={{ height: 26 }} />
              <div className="flex flex-col items-center gap-1 pt-0.5">
                <Line t={t} w="80%" />
              </div>
            </div>
          ))}
        </div>
      )

    // Ruled rows: thumbnail, then the record beside it.
    case 'catalogue':
      return (
        <div className="space-y-0">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center gap-2 py-1.5"
              style={{ borderTop: i ? `1px solid ${t.previewText}33` : undefined }}
            >
              <Work t={t} style={{ width: 14, height: 14, flexShrink: 0 }} />
              <div className="flex-1 space-y-1">
                <Line t={t} w="55%" />
                <Line t={t} w="34%" />
              </div>
            </div>
          ))}
        </div>
      )

    // Full-bleed tiles butted together, no gutter at all.
    case 'spotlight':
      return (
        <div className="grid grid-cols-3 gap-0">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{ height: 24, backgroundColor: t.previewText, opacity: i % 2 ? 0.16 : 0.26 }}
            />
          ))}
        </div>
      )

    // Asymmetric spans — the rhythm is the one in grids.tsx.
    case 'mosaic':
      return (
        <div className="grid grid-cols-4 gap-1" style={{ gridAutoRows: '17px' }}>
          <Work t={t} style={{ gridColumn: 'span 2', gridRow: 'span 2' }} />
          <Work t={t} />
          <Work t={t} />
          <Work t={t} style={{ gridRow: 'span 2' }} />
          <Work t={t} style={{ gridColumn: 'span 1' }} />
        </div>
      )

    // Salon hang: columns, natural heights, densely packed.
    case 'salon':
      return (
        <div className="grid grid-cols-3 gap-1.5 items-start">
          {[
            [14, 36],
            [32, 12, 8],
            [24, 20],
          ].map((col, i) => (
            <div key={i} className="space-y-1.5">
              {col.map((h, j) => (
                <Work t={t} key={j} className="w-full" style={{ height: h }} />
              ))}
            </div>
          ))}
        </div>
      )

    // Alternating figure / text spreads.
    case 'editorial':
      return (
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <Work t={t} style={{ width: '58%', height: 24 }} />
            <div className="flex-1 space-y-1">
              <Line t={t} w="28%" accent />
              <Line t={t} w="90%" />
              <Line t={t} w="72%" />
            </div>
          </div>
          <div className="flex gap-2 items-center flex-row-reverse">
            <Work t={t} style={{ width: '58%', height: 24 }} />
            <div className="flex-1 space-y-1">
              <Line t={t} w="28%" accent />
              <Line t={t} w="85%" />
              <Line t={t} w="64%" />
            </div>
          </div>
        </div>
      )

    // Cover: the hero is the page, then wide bands beneath.
    case 'stack':
      return (
        // Full-viewport hero, then wide bands. The hero carries a title so it
        // reads as the cover it is rather than a third band.
        <div className="space-y-1.5 -mx-2.5">
          <div
            className="relative flex flex-col justify-end gap-1 px-3 pb-2"
            style={{ height: 46, backgroundColor: t.previewText, opacity: 0.34 }}
          >
            <div style={{ width: '46%', height: 5, backgroundColor: t.previewBg, opacity: 0.9 }} />
            <div style={{ width: '30%', height: 2, backgroundColor: t.previewBg, opacity: 0.6 }} />
          </div>
          <div style={{ height: 14, backgroundColor: t.previewText, opacity: 0.18 }} />
          <div style={{ height: 14, backgroundColor: t.previewText, opacity: 0.12 }} />
        </div>
      )

    // ── object-led ────────────────────────────────────────────────────────
    // These five are the premium set, and the thing they sell is how an object
    // is presented. Drawn with the light, depth and card structure the real
    // templates have rather than as blocks, because a block sells none of it.

    // A rack of covers with one square on, the rest raked away, over its own
    // reflection. The gradient on each raked card is the light falling off.
    case 'flip':
      return (
        <div style={{ height: 62 }}>
          <div
            className="flex items-end justify-center gap-[3px]"
            style={{ perspective: 200, height: 44 }}
          >
            {[-2, -1, 0, 1, 2].map((pos) => {
              const front = pos === 0
              const dir = pos > 0 ? 1 : -1
              return (
                <div
                  key={pos}
                  className="relative overflow-hidden"
                  style={{
                    width: front ? 30 : 15,
                    height: front ? 42 : 34,
                    transform: front ? undefined : `rotateY(${-dir * 54}deg)`,
                    backgroundColor: t.previewText,
                    opacity: front ? 1 : 0.5,
                    boxShadow: front ? `0 2px 8px ${t.previewBg}` : undefined,
                  }}
                >
                  {/* the plate itself */}
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: t.previewText, opacity: 0.28 }} />
                  {front && (
                    <>
                      <div
                        style={{
                          position: 'absolute',
                          inset: '4px 4px 12px 4px',
                          backgroundColor: t.previewText,
                          opacity: 0.5,
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          left: 4,
                          bottom: 5,
                          width: 16,
                          height: 2,
                          backgroundColor: t.previewAccent,
                        }}
                      />
                    </>
                  )}
                  {/* light falling off toward the outer edge */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `linear-gradient(${dir > 0 ? 90 : 270}deg, transparent, ${t.previewBg}cc)`,
                      opacity: front ? 0 : 1,
                    }}
                  />
                </div>
              )
            })}
          </div>
          {/* reflection, faded back into the page */}
          <div className="relative" style={{ height: 16 }}>
            <div
              className="flex items-start justify-center gap-[3px]"
              style={{ transform: 'scaleY(-1)', height: 16, overflow: 'hidden' }}
            >
              {[-2, -1, 0, 1, 2].map((pos) => (
                <div
                  key={pos}
                  style={{
                    width: pos === 0 ? 30 : 15,
                    height: 16,
                    backgroundColor: t.previewText,
                    opacity: pos === 0 ? 0.16 : 0.07,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `linear-gradient(180deg, transparent, ${t.previewBg})`,
              }}
            />
          </div>
        </div>
      )

    // A fanned hand in graded holders, the held one catching the light. The
    // sheen is a real multi-stop gradient rather than a flat accent fill.
    case 'foil':
      return (
        <div className="relative flex items-end justify-center" style={{ height: 62 }}>
          {[-42, -21, 0, 21, 42].map((deg, i) => {
            const held = i === 2
            return (
              <div
                key={deg}
                className="absolute overflow-hidden"
                style={{
                  bottom: held ? 18 : 0,
                  width: held ? 25 : 21,
                  height: held ? 35 : 30,
                  borderRadius: r,
                  border: `1px solid ${t.previewText}${held ? '55' : '22'}`,
                  backgroundColor: `${t.previewText}14`,
                  transformOrigin: '50% 185%',
                  transform: `rotate(${deg}deg)`,
                  boxShadow: held ? `0 3px 10px ${t.previewBg}` : undefined,
                  zIndex: held ? 2 : 1,
                }}
              >
                {held ? (
                  <>
                    {/* holo */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `linear-gradient(118deg, ${t.previewAccent}00 8%, ${t.previewAccent}dd 30%, #7ad9ff99 46%, ${t.previewAccent}cc 62%, #ffd76a88 76%, ${t.previewAccent}00 92%)`,
                      }}
                    />
                    {/* grader's label across the top of the slab */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 2,
                        left: 2,
                        right: 2,
                        height: 4,
                        borderRadius: 1,
                        backgroundColor: t.previewText,
                        opacity: 0.8,
                      }}
                    />
                  </>
                ) : (
                  <div
                    style={{
                      position: 'absolute',
                      inset: '5px 3px 3px 3px',
                      borderRadius: 1,
                      backgroundColor: t.previewText,
                      opacity: 0.18,
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      )

    // A lit case. Warm spill from the lamps, pieces of different silhouette
    // standing on inset glass shelves, and the one brought forward on a plinth.
    case 'northlight':
      return (
        <div className="relative" style={{ height: 62 }}>
          {/* the lamps, and their spill down the back of the case */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `radial-gradient(46% 52% at 32% -6%, ${t.previewAccent}42, transparent 72%), radial-gradient(46% 52% at 70% -6%, ${t.previewAccent}34, transparent 72%)`,
            }}
          />
          {[0, 1].map((shelf) => {
            const objects =
              shelf === 0
                ? [
                    { w: 8, h: 20, br: '4px 4px 1px 1px' },   // standing vessel
                    { w: 13, h: 24, br: '6px 6px 2px 2px' },  // the one brought forward
                    { w: 10, h: 11, br: '1px' },              // block
                  ]
                : [
                    { w: 11, h: 9, br: '5px 5px 1px 1px' },   // low bowl
                    { w: 7, h: 15, br: '3px 3px 1px 1px' },
                    { w: 9, h: 12, br: '1px' },
                  ]
            return (
              <div
                key={shelf}
                className="absolute"
                style={{ top: shelf * 31, left: '8%', right: '8%' }}
              >
                <div className="flex items-end justify-center gap-5" style={{ height: 26 }}>
                  {objects.map((o, i) => {
                    const lit = shelf === 0 && i === 1
                    return (
                      <div key={i} className="flex flex-col items-center">
                        <div
                          style={{
                            width: o.w,
                            height: o.h,
                            borderRadius: o.br,
                            backgroundColor: t.previewText,
                            opacity: lit ? 0.68 : 0.24,
                            boxShadow: lit ? `0 0 10px ${t.previewAccent}77` : undefined,
                          }}
                        />
                        {lit && (
                          // plinth
                          <div
                            style={{
                              width: 19,
                              height: 3,
                              backgroundColor: t.previewText,
                              opacity: 0.38,
                            }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
                {/* the glass, catching light along its front edge */}
                <div
                  style={{
                    height: 2,
                    backgroundImage: `linear-gradient(90deg, transparent, ${t.previewAccent}, transparent)`,
                    opacity: 0.85,
                  }}
                />
              </div>
            )
          })}
        </div>
      )

    // One card caught mid-turn: the object on the face you are leaving, the
    // catalogue entry on the face coming round.
    case 'verso':
      return (
        <div className="flex items-center justify-center" style={{ height: 62, perspective: 300 }}>
          <div className="flex items-center" style={{ transformStyle: 'preserve-3d' }}>
            {/* object face, turning away */}
            <div
              className="relative overflow-hidden"
              style={{
                width: 27,
                height: 42,
                borderRadius: r,
                backgroundColor: `${t.previewText}20`,
                border: `1px solid ${t.previewText}30`,
                transform: 'rotateY(30deg)',
                transformOrigin: '100% 50%',
              }}
            >
              <div style={{ position: 'absolute', inset: 4, backgroundColor: t.previewText, opacity: 0.45 }} />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `linear-gradient(270deg, ${t.previewBg}aa, transparent 55%)`,
                }}
              />
            </div>
            {/* the fold */}
            <div style={{ width: 2, height: 42, backgroundColor: t.previewBg, zIndex: 3 }} />
            {/* record face, coming round */}
            <div
              className="relative px-2 py-2 flex flex-col gap-[3px] justify-center"
              style={{
                width: 34,
                height: 42,
                borderRadius: r,
                backgroundColor: `${t.previewText}16`,
                border: `1px solid ${t.previewText}3a`,
                transform: 'rotateY(-16deg)',
                transformOrigin: '0% 50%',
                boxShadow: `-4px 0 10px ${t.previewBg}`,
              }}
            >
              <div style={{ width: '58%', height: 3, backgroundColor: t.previewAccent }} />
              <div style={{ width: '100%', height: 1, backgroundColor: `${t.previewText}4a`, margin: '1px 0' }} />
              {['92%', '74%', '84%', '62%', '78%'].map((w, i) => (
                <div key={i} style={{ width: w, height: 1.5, backgroundColor: t.previewText, opacity: 0.38 }} />
              ))}
            </div>
          </div>
        </div>
      )

    // The collection through a finder: the world outside the frame goes dark,
    // ticks count the frames, and the needle reads condition.
    case 'viewfinder':
      return (
        <div className="relative flex items-center justify-center" style={{ height: 62 }}>
          {/* frame counter */}
          <div className="absolute top-0 left-0 right-0 flex justify-center gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                style={{
                  width: 1,
                  height: i === 3 ? 5 : 3,
                  backgroundColor: i === 3 ? t.previewAccent : t.previewText,
                  opacity: i === 3 ? 1 : 0.35,
                }}
              />
            ))}
          </div>

          <div className="relative" style={{ width: 62, height: 40, marginTop: 4 }}>
            {/* the ground, and the object sitting in the finder */}
            <div style={{ position: 'absolute', inset: 0, backgroundColor: t.previewText, opacity: 0.13 }} />
            <div
              style={{
                position: 'absolute',
                left: '50%',
                bottom: 7,
                width: 15,
                height: 22,
                borderRadius: '6px 6px 2px 2px',
                transform: 'translateX(-50%)',
                backgroundColor: t.previewText,
                opacity: 0.44,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 8,
                right: 8,
                bottom: 6,
                height: 1,
                backgroundColor: t.previewText,
                opacity: 0.3,
              }}
            />
            {/* focus box, sitting over the object */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 20,
                height: 15,
                transform: 'translate(-50%, -50%)',
                border: `1px solid ${t.previewAccent}99`,
              }}
            />
            {/* corner brackets */}
            {[
              { top: -1, left: -1, bt: 1, bl: 1 },
              { top: -1, right: -1, bt: 1, br: 1 },
              { bottom: -1, left: -1, bb: 1, bl: 1 },
              { bottom: -1, right: -1, bb: 1, br: 1 },
            ].map((c, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  width: 9,
                  height: 9,
                  top: c.top,
                  left: c.left,
                  right: c.right,
                  bottom: c.bottom,
                  borderTop: c.bt ? `2px solid ${t.previewAccent}` : undefined,
                  borderBottom: c.bb ? `2px solid ${t.previewAccent}` : undefined,
                  borderLeft: c.bl ? `2px solid ${t.previewAccent}` : undefined,
                  borderRight: c.br ? `2px solid ${t.previewAccent}` : undefined,
                }}
              />
            ))}
          </div>

          {/* condition needle */}
          <div className="absolute bottom-0 right-1 flex items-end gap-[2px]" style={{ height: 8 }}>
            {[3, 5, 7, 5].map((h, i) => (
              <div
                key={i}
                style={{
                  width: 1,
                  height: h,
                  backgroundColor: i === 2 ? t.previewAccent : t.previewText,
                  opacity: i === 2 ? 1 : 0.3,
                }}
              />
            ))}
          </div>
        </div>
      )


    default:
      return (
        <div className="grid grid-cols-3 gap-1.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Work t={t} key={i} className="w-full" style={{ height: 20 }} />
          ))}
        </div>
      )
  }
}

export default function TemplateThumb({ t }: P) {
  // The sidebar templates split the page rather than stacking it.
  if (t.layout_variant === 'sidebar') {
    return (
      <div className="flex gap-2 p-2.5 h-[104px]" style={{ backgroundColor: t.previewBg }} aria-hidden="true">
        <div className="w-1/4 space-y-1.5 pt-1">
          <div style={{ width: '80%', height: 4, backgroundColor: t.previewText, opacity: 0.85 }} />
          <Line t={t} w="60%" />
          <Line t={t} w="70%" />
        </div>
        <div className="flex-1 overflow-hidden">
          <Body t={t} />
        </div>
      </div>
    )
  }

  return (
    <div className="px-2.5 pb-2.5 h-[104px] overflow-hidden" style={{ backgroundColor: t.previewBg }} aria-hidden="true">
      <Masthead t={t} />
      <Body t={t} />
    </div>
  )
}
