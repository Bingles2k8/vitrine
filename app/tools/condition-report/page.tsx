import { buildPageMetadata, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import ToolShell from '../ToolShell'
import ConditionReportBuilder from './ConditionReportBuilder'

export const metadata = buildPageMetadata({
  title: 'Free Museum Condition Report Generator',
  description:
    'A free tool to create a professional museum condition report with a visual damage map. Mark damage on a photo of the object, record the assessment, and download a formatted PDF. Runs entirely in your browser.',
  path: '/tools/condition-report',
  keywords: [
    'museum condition report template',
    'condition report generator',
    'condition report form',
    'artwork condition report',
    'object condition report',
    'collection condition report',
  ],
})

const FAQS = [
  {
    question: 'Is the condition report tool free?',
    answer:
      'Yes, and there is nothing to sign up for. You fill in the report, mark the damage map, and download the PDF directly in your browser.',
  },
  {
    question: 'Do you store the object photos or report data?',
    answer:
      'No. Everything runs on your device — the photos and report details never leave your browser. The PDF is assembled locally and the images are embedded into it on your computer.',
  },
  {
    question: 'What is the damage map?',
    answer:
      'Upload a photo of the object and click on it to drop numbered markers wherever there is damage. Each marker links to a row describing the location, the issue and its severity. The numbered photo and the key are included in the PDF.',
  },
  {
    question: 'Is it aligned with museum standards?',
    answer:
      'The fields follow standard museum condition-checking practice (object/tombstone details, overall grade, reason for check, hazards, recommendations, next check date) consistent with the Spectrum collections standard. It produces documentation; it does not replace a trained conservator’s judgement.',
  },
  {
    question: 'Can I do this for a whole collection?',
    answer:
      'This tool produces one report at a time. To manage condition reporting across an entire collection — linked to objects, loans and conservation records, and tracked over time — you can use Vitrine, the collection-management platform behind this tool.',
  },
]

export default function Page() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Museum Condition Report Generator',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
          url: `${SITE_URL}/tools/condition-report`,
          description: metadata.description as string,
          publisher: { '@type': 'Organization', name: 'Vitrine', url: SITE_URL },
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQS.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        }}
      />
      <ToolShell
        title="Museum Condition Report Generator"
        intro="Produce a clean, professional condition report in minutes. Record the object and assessment, mark every issue on a visual damage map, and download a formatted PDF. It all runs in your browser."
        faqs={FAQS}
      >
        <ConditionReportBuilder />
      </ToolShell>
    </>
  )
}
