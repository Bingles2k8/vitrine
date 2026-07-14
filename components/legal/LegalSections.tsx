import { Fragment } from 'react'
import Link from 'next/link'
import type { Block, Inline, LegalDoc } from '@/lib/legal/types'

/**
 * Renders the body of a legal document from the shared source in lib/legal.
 *
 * `siteLinks={false}` degrades on-site links to plain text, keeping the wording
 * intact. The bare /legal/* pages the iOS app opens must contain no route back
 * into the site — see lib/legal/types.ts.
 */
export default function LegalSections({
  doc,
  siteLinks,
  scale = 'compact',
}: {
  doc: LegalDoc
  siteLinks: boolean
  scale?: Scale
}) {
  return (
    <>
      {doc.sections.map(section => (
        <section key={section.heading} className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">
            {section.heading}
          </h2>
          {section.blocks.map((block, i) => (
            <BlockView key={i} block={block} siteLinks={siteLinks} scale={scale} />
          ))}
        </section>
      ))}
    </>
  )
}

/** Body text size: compact on the marketing pages, comfortable in the iOS in-app browser. */
type Scale = 'compact' | 'comfortable'

const BODY: Record<Scale, string> = {
  compact: 'text-sm',
  comfortable: 'text-[15px] sm:text-base',
}

const MUTED = 'text-stone-600 dark:text-stone-400'
const LINK = 'underline hover:text-stone-900 dark:hover:text-stone-100 transition-colors'

// Bold runs are darker in paragraphs than in list items — preserved from the
// original hand-written pages so /privacy and /terms render unchanged.
const STRONG_IN_PARAGRAPH = 'text-stone-900 dark:text-stone-100'
const STRONG_IN_LIST = 'text-stone-700 dark:text-stone-300'

function BlockView({ block, siteLinks, scale }: { block: Block; siteLinks: boolean; scale: Scale }) {
  const body = `${BODY[scale]} ${MUTED}`

  switch (block.kind) {
    case 'p':
      return (
        <p className={block.tight ? body : `${body} leading-relaxed`}>
          {renderInline(block.content, siteLinks, STRONG_IN_PARAGRAPH)}
        </p>
      )

    case 'ul':
      return (
        <ul className="space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className={`flex items-start gap-2 ${body}`}>
              <span className="text-stone-300 dark:text-stone-600 mt-0.5 flex-shrink-0">—</span>
              <span>{renderInline(item, siteLinks, STRONG_IN_LIST)}</span>
            </li>
          ))}
        </ul>
      )

    case 'callout':
      return (
        <div className="bg-stone-50 dark:bg-stone-800 rounded-lg p-4">
          <p className="text-xs font-mono text-stone-500 dark:text-stone-400 mb-1">{block.label}</p>
          <p className={`${body} leading-relaxed`}>
            {renderInline(block.content, siteLinks, STRONG_IN_PARAGRAPH)}
          </p>
        </div>
      )
  }
}

function renderInline(nodes: Inline[], siteLinks: boolean, strongClass: string) {
  return nodes.map((node, i) => {
    if ('strong' in node) {
      return (
        <strong key={i} className={strongClass}>
          {node.text}
        </strong>
      )
    }
    if ('href' in node) {
      return (
        <a key={i} href={node.href} className={LINK}>
          {node.text}
        </a>
      )
    }
    if ('siteHref' in node) {
      return siteLinks ? (
        <Link key={i} href={node.siteHref} className={LINK}>
          {node.text}
        </Link>
      ) : (
        <Fragment key={i}>{node.text}</Fragment>
      )
    }
    return <Fragment key={i}>{node.text}</Fragment>
  })
}
