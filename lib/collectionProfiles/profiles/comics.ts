import type { CollectionProfile } from '../types'
import { cgcComicScale, rawScale } from '../scales'

export const comics: CollectionProfile = {
  id: 'comics',
  label: 'Comics & Graphic Novels',
  blurb: 'Single issues, key issues, slabbed books',
  emoji: '💥',
  category: 'Comics & Graphic Novels',

  nouns: { item: 'Comic', itemPlural: 'Comics', collection: 'Collection', addItem: 'Add Comic' },

  fields: {
    title:            { label: 'Title & Issue', placeholder: 'e.g. Amazing Fantasy #15' },
    artist:           { label: 'Publisher / Creators', placeholder: 'e.g. Marvel — Lee & Ditko' },
    production_date:  { label: 'Cover Date', placeholder: 'e.g. August 1962' },
    object_type:      { label: 'Format', placeholder: 'e.g. Single Issue, Trade…' },
    medium:           { label: 'Cover Type', placeholder: 'e.g. Newsstand, Direct, Variant' },
    rarity:           { label: 'Print Run / Variant', placeholder: 'e.g. 1:25 incentive' },
    culture:          { hidden: true },
    production_date_qualifier: { hidden: true },
    number_of_parts:  { hidden: true },
    inscription:      { label: 'Signatures & Markings', placeholder: 'Signatures, stamps, arrival dates…' },
    current_location: { label: 'Stored In', placeholder: 'e.g. Long box 4' },
  },

  fieldOrder: ['title', 'artist', 'production_date', 'object_type', 'medium', 'rarity',
               'status', 'description', 'inscription'],

  vocab: {
    objectTypes: ['Single Issue', 'Annual', 'Trade Paperback', 'Hardcover', 'Omnibus',
                  'Graphic Novel', 'Magazine', 'Ashcan', 'Digest', 'Manga Volume',
                  'Newspaper Strip', 'Slabbed', 'Other'],
    mediums:     ['Newsstand', 'Direct Edition', 'Variant Cover', 'Incentive Variant',
                  'Sketch Cover', 'Foil Cover', 'Reprint', 'Facsimile', 'Other'],
    emojis:      ['💥','🦸','🦹','📚','🕷️','🦇','⚡','🛡️','🚀','👊','📖','🎭','🌟','🔥','💫','🧿'],
    conditionLabels: {
      Excellent: 'Near Mint / Mint',
      Good:      'Very Fine',
      Fair:      'Fine / Very Good',
      Poor:      'Good / Fair',
      Critical:  'Poor',
    },
    statusLabels: {
      'On Display':    'On Display',
      'Storage':       'In Long Box',
      'Restoration':   'Away for Grading',
      'Deaccessioned': 'Sold / Traded',
    },
  },

  certification: {
    title: 'Grading & Certification',
    labels: { authority: 'Grading Company', number: 'Certification Number', grade: 'Grade', date: 'Graded' },
    derivesCondition: true,
    authorities: [
      { id: 'CGC', label: 'CGC', scale: 'cgc-comic' },
      { id: 'CBCS', label: 'CBCS', scale: 'cgc-comic' },
      { id: 'PGX', label: 'PGX', scale: 'cgc-comic' },
      { id: 'RAW', label: 'Ungraded / Raw', scale: 'raw' },
    ],
    scales: [cgcComicScale, rawScale],
  },

  customFields: [
    { key: 'comics.issue_number', label: 'Issue Number', type: 'text', placeholder: 'e.g. 15' },
    { key: 'comics.variant_cover', label: 'Variant Cover', type: 'text',
      placeholder: 'e.g. Campbell 1:50' },
    { key: 'comics.page_quality', label: 'Page Quality', type: 'select',
      options: ['White', 'Off-White to White', 'Off-White', 'Cream to Off-White',
                'Cream', 'Tan', 'Brittle'] },
    { key: 'comics.key_issue_notes', label: 'Key Issue Notes', type: 'text', width: 'full',
      placeholder: 'e.g. First appearance of Spider-Man' },
  ],

  listColumns: [
    { field: 'artist', label: 'Publisher' },
    { field: 'production_date', label: 'Cover Date' },
    { field: 'cert_grade', label: 'Grade' },
  ],

  breakdowns: [
    { field: 'artist', title: 'By Publisher' },
    { field: 'cert_grade', title: 'By Grade' },
    { field: 'custom:comics.page_quality', title: 'By Page Quality' },
  ],
}
