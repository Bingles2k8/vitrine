import type { PublicCertification } from '@/lib/publicProfile'

/**
 * A graded item's slab details.
 *
 * For a graded coin, card or comic the grade is the single most important fact
 * about the object — often the reason it is worth what it is worth. The public
 * object page previously showed only the generic Excellent/Good/Fair condition
 * and dropped the grader, the grade and the certificate number entirely.
 *
 * The certificate number is rendered as selectable text when the grader has no
 * verified lookup URL, so a visitor can still check it by hand.
 */
export default function CertificationPanel({
  cert,
  accent,
  heading,
  muted,
  border,
  cardBg,
  square,
}: {
  cert: PublicCertification
  accent: string
  heading: string
  muted: string
  border: string
  cardBg: string
  /** Hard-edged templates keep their square corners. */
  square?: boolean
}) {
  return (
    <div
      className="mb-8 overflow-hidden"
      style={{
        border: `1px solid ${border}`,
        borderRadius: square ? 0 : 8,
        background: cardBg,
      }}
    >
      <div
        className="px-4 py-2 text-[11px] font-mono uppercase tracking-[0.18em]"
        style={{ background: `${accent}14`, color: accent, borderBottom: `1px solid ${border}` }}
      >
        {cert.title}
      </div>

      <div className="p-4 flex flex-wrap items-baseline gap-x-8 gap-y-3">
        <div>
          <div className="text-[11px] uppercase tracking-widest font-mono mb-1" style={{ color: muted }}>
            Graded by
          </div>
          <div className="text-sm font-medium" style={{ color: heading }}>{cert.authorityLabel}</div>
        </div>

        {cert.grade && (
          <div>
            <div className="text-[11px] uppercase tracking-widest font-mono mb-1" style={{ color: muted }}>
              {cert.gradeLabel}
            </div>
            <div className="text-2xl leading-none font-semibold" style={{ color: accent }}>{cert.grade}</div>
          </div>
        )}

        {cert.number && (
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-widest font-mono mb-1" style={{ color: muted }}>
              {cert.numberLabel}
            </div>
            {cert.verifyUrl ? (
              <a
                href={cert.verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono underline underline-offset-2 transition-opacity hover:opacity-70 break-all"
                style={{ color: heading }}
              >
                {cert.number} ↗
              </a>
            ) : (
              <div className="text-sm font-mono break-all" style={{ color: heading }}>{cert.number}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
