import Link from 'next/link'
import { PLANS, PLAN_ORDER, FREE_TIER_TEMPLATES, type PlanId } from '@/lib/plans'
import { templatesForPlan } from '@/lib/templates'

type Cell = { text: string; yes: boolean }
const yes = (text: string): Cell => ({ text, yes: true })
const no = (text: string): Cell => ({ text, yes: false })
const inc = (on: boolean): Cell => (on ? yes('Included') : no('Not included'))
const num = (n: number | null) => (n === null ? 'Unlimited' : n.toLocaleString('en-GB'))

function storage(mb: number | null): Cell {
  if (mb === null) return yes('Unlimited')
  if (mb === 0) return no('None')
  return yes(mb >= 1024 ? `${mb / 1024} GB` : `${mb} MB`)
}

const ROWS: Array<{ label: string; cell: (id: PlanId) => Cell }> = [
  { label: 'Objects', cell: id => yes(num(PLANS[id].objects)) },
  { label: 'Staff accounts', cell: id => yes(num(PLANS[id].staff)) },
  { label: 'Images per object', cell: id => yes(String(PLANS[id].imagesPerObject)) },
  { label: 'Document storage', cell: id => storage(PLANS[id].documentStorageMb) },
  // Community is limited to FREE_TIER_TEMPLATES; other plans get whatever their tier unlocks (premium templates need Professional).
  { label: 'Public website', cell: id => yes(`${id === 'community' ? FREE_TIER_TEMPLATES.length : templatesForPlan(id).length} templates`) },
  { label: 'Collection analytics, CSV import and export', cell: id => inc(PLANS[id].analytics) },
  { label: 'Visitor analytics', cell: id => inc(PLANS[id].visitorAnalytics) },
  {
    label: 'Private share links',
    cell: id => {
      const n = PLANS[id].shareLinks
      return n === 0 ? no('Not included') : yes(num(n))
    },
  },
  // The loans, conservation and disposal registers are gated by the plan's compliance flag.
  { label: 'Loans, conservation and disposal records', cell: id => inc(PLANS[id].compliance) },
  { label: 'Event ticketing and visit page', cell: id => inc(PLANS[id].ticketing && PLANS[id].visitInfo) },
  { label: 'Donor and depositor records', cell: id => inc(PLANS[id].depositorTracking) },
  { label: 'Dashboard', cell: id => yes(PLANS[id].fullMode ? 'Full' : 'Simple') },
]

function price(id: PlanId) {
  const p = PLANS[id].price
  const m = /^(.+?)\/(\w+)$/.exec(p)
  return m ? { main: m[1], unit: `/${m[2]}`, txt: false } : { main: p, unit: '', txt: true }
}

function cta(id: PlanId) {
  if (id === 'community') return { label: 'Start free', href: '/signup' }
  if (id === 'enterprise') return { label: 'Contact us', href: '/contact/enterprise' }
  return { label: `Choose ${PLANS[id].label}`, href: id === 'institution' ? '/plans/institution' : '/signup' }
}

export default function Pricing() {
  return (
    <section className="price pad" id="pricing">
      <div className="wrap">
        <h2>Start free.</h2>
        <p className="lede">Move up when you need more room.</p>
        <div className="tw" tabIndex={0} role="region" aria-label="Plan comparison, scrolls sideways on small screens">
          <table className="pt">
            <thead>
              <tr>
                <th className="rl" scope="col"><span className="pn">Plan</span></th>
                {PLAN_ORDER.map(id => {
                  const p = price(id)
                  return (
                    <th key={id} scope="col" className={PLANS[id].featured ? 'c3' : undefined}>
                      <span className="pn">{PLANS[id].label}</span>
                      <span className={'pp' + (p.txt ? ' txt' : '')}>{p.main}{p.unit && <small>{p.unit}</small>}</span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(r => (
                <tr key={r.label}>
                  <th scope="row">{r.label}</th>
                  {PLAN_ORDER.map(id => {
                    const c = r.cell(id)
                    return <td key={id} className={(c.yes ? 'y' : 'n') + (PLANS[id].featured ? ' c3' : '')}>{c.text}</td>
                  })}
                </tr>
              ))}
              <tr className="pf">
                <th scope="row"><span className="sr">Choose a plan</span></th>
                {PLAN_ORDER.map(id => {
                  const c = cta(id)
                  return (
                    <td key={id} className={PLANS[id].featured ? 'c3' : undefined}>
                      <Link className={'btn ' + (PLANS[id].featured ? 'solid' : 'line')} href={c.href}>{c.label}</Link>
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
        <div className="pcards" role="region" aria-label="Plan comparison">
          {PLAN_ORDER.map(id => {
            const p = price(id)
            const c = cta(id)
            const hl = PLANS[id].featured
            return (
              <article key={id} className={'pc' + (hl ? ' hl' : '')}>
                <h3 className="pn">{PLANS[id].label}</h3>
                <span className={'pp' + (p.txt ? ' txt' : '')}>{p.main}{p.unit && <small>{p.unit}</small>}</span>
                <dl>
                  {ROWS.map(r => {
                    const cell = r.cell(id)
                    return <div key={r.label}><dt>{r.label}</dt><dd className={cell.yes ? undefined : 'n'}>{cell.text}</dd></div>
                  })}
                </dl>
                <Link className={'btn ' + (hl ? 'solid' : 'line')} href={c.href}>{c.label}</Link>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
