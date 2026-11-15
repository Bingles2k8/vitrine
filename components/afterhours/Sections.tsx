import Link from 'next/link'

export type FeaturedCollection = {
  name: string
  slug: string
  count: number
  preview_image: string | null
  preview_emoji: string
}

const LABELS = [
  { title: 'Museum-standard records', meta: 'Cataloguing, Professional and above', text: 'Accession, acquisition, provenance and rights, recorded the way a museum expects.', icon: (<><path d="M7 5h15a3 3 0 0 1 3 3v19H10a3 3 0 0 1-3-3z"/><path d="M7 24a3 3 0 0 1 3-3h15"/><path d="M12 10h8M12 14h6"/></>) },
  { title: 'Loans and disposals', meta: 'Care, Professional and above', text: 'Know who has an object, when it is due back, and why it left the collection.', icon: (<><path d="M5 15l11-5 11 5v11H5z"/><path d="M5 15l11 5 11-5M16 20v6"/><path d="M16 3v6M13.5 6.5L16 9l2.5-2.5"/></>) },
  { title: 'Fields that fit what you collect', meta: 'Cataloguing, Community and Hobbyist', text: 'Pick coins, wine or clocks and the record uses their terms.', icon: (<><path d="M5 5h10l12 12-10 10L5 15z"/><circle cx="10" cy="10" r="1.6"/><path d="M14 19l4-4"/></>) },
  { title: 'Collection sets', meta: 'Display, all plans', text: 'Group objects by hand or by rule. Each set can have its own public page.', icon: (<><rect x="3" y="4" width="26" height="24" rx="1"/><rect x="8" y="9" width="16" height="14" rx="1"/><rect x="12.5" y="13" width="7" height="6" rx="1"/></>) },
  { title: 'A public website', meta: 'Display, all plans', text: 'Choose a template and your catalogue is already online.', icon: (<><rect x="3" y="5" width="26" height="22" rx="2"/><path d="M3 11h26M7 8h.01M10 8h.01M13 8h.01"/><path d="M8 16h9M8 20h14"/></>) },
  { title: 'Import and export', meta: 'Data, Hobbyist and above', text: 'Bring records in from a spreadsheet. Take them out whenever you like.', icon: (<><rect x="4" y="5" width="24" height="22" rx="1"/><path d="M4 12h24M4 19.5h24M12 5v22M20 5v22"/></>) },
]

export function Featured({ featured }: { featured: FeaturedCollection[] }) {
  if (!featured.length) return null
  return (
    <section className="eg" aria-label="Example collections">
      <div className="wrap">
        <p className="lbl">Example collections</p>
        <ul role="list">
          {featured.map(col => (
            <li key={col.slug}>
              <Link href={`/museum/${col.slug}`}>
                {col.name}<small>{col.count.toLocaleString('en-GB')} objects</small>
              </Link>
            </li>
          ))}
          <li><Link href="/discover"><small>Browse all collections</small></Link></li>
        </ul>
      </div>
    </section>
  )
}

export function Features() {
  return (
    <section className="feat pad" id="features">
      <div className="wrap">
        <h2>What it does.</h2>
        <div className="labels">
          {LABELS.map(l => (
            <article className="wl" key={l.title}>
              <svg className="ill" viewBox="0 0 32 32" aria-hidden="true" focusable="false">{l.icon}</svg>
              <h3>{l.title}</h3>
              <p className="meta">{l.meta}</p>
              <p>{l.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Who() {
  return (
    <section className="pad" id="who">
      <div className="wrap">
        <h2>For museums,<br />and for collectors.</h2>
        <div className="who">
          <div>
            <h3>Museums</h3>
            <p>Accession objects, follow loans and condition checks, and keep one catalogue for the whole team.</p>
            <ul role="list"><li>Accession and numbering</li><li>Loans, condition checks and disposals</li><li>Shared access for staff</li></ul>
          </div>
          <div>
            <h3>Collectors</h3>
            <p>Catalogue what you own, keep values and insurance details to hand, and share the pieces you are proud of.</p>
            <ul role="list"><li>Values and insurance details</li><li>Provenance and receipts</li><li>Private share links</li></ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Closing() {
  return (
    <section className="cta" id="start">
      <div className="wrap">
        <h2>Your collection, catalogued.</h2>
        <div className="ctas">
          <Link className="btn solid" href="/signup">Start free</Link>
          <a className="btn line" href="#pricing">See pricing</a>
        </div>
      </div>
    </section>
  )
}
