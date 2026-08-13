import type { CollectionProfile } from '../types'
import { sealedBoxScale, rawScale } from '../scales'

export const toysModels: CollectionProfile = {
  id: 'toys-models',
  label: 'Toys, Models & Figures',
  blurb: 'Action figures, LEGO, die-cast, railways',
  emoji: '🧸',
  category: 'Toys & Models',

  nouns: { item: 'Item', itemPlural: 'Items', collection: 'Collection', addItem: 'Add Item' },

  fields: {
    title:            { label: 'Name', placeholder: 'e.g. Millennium Falcon' },
    artist:           { label: 'Brand / Manufacturer', placeholder: 'e.g. LEGO, Hornby, Kenner' },
    production_date:  { label: 'Year Released', placeholder: 'e.g. 1979' },
    object_type:      { label: 'Type', placeholder: 'e.g. Action Figure, Die-cast…' },
    medium:           { label: 'Materials', placeholder: 'e.g. ABS plastic, die-cast metal' },
    rarity:           { label: 'Item / Set Number', placeholder: 'e.g. 75192' },
    culture:          { hidden: true },
    production_date_qualifier: { hidden: true },
    inscription:      { label: 'Markings & Stamps', placeholder: 'Copyright stamps, mould marks, country of origin…' },
    current_location: { label: 'Stored In', placeholder: 'e.g. Display cabinet, shelf 2' },
  },

  fieldOrder: ['title', 'artist', 'production_date', 'object_type', 'rarity', 'medium',
               'number_of_parts', 'status', 'description', 'inscription'],

  vocab: {
    objectTypes: ['Action Figure', 'Doll', 'Teddy Bear', 'Die-cast Vehicle', 'Model Kit',
                  'Building Set', 'Model Railway', 'Locomotive', 'Rolling Stock',
                  'Vinyl Figure', 'Statue', 'Playset', 'Board Game', 'Puzzle',
                  'Tin Toy', 'Pedal Car', 'Other'],
    mediums:     ['ABS plastic', 'Die-cast metal', 'Tinplate', 'Wood', 'Resin', 'Vinyl',
                  'Mohair', 'Plush', 'Composition', 'Bisque', 'Card', 'Other'],
    emojis:      ['🧸','🚂','🚗','🤖','🪆','🎠','🧩','🚀','🦖','🏰','⭐','🎲','🚁','🛸','🧱','🧿'],
    conditionLabels: {
      Excellent: 'Mint',
      Good:      'Near Mint',
      Fair:      'Played With',
      Poor:      'Worn',
      Critical:  'Damaged / Incomplete',
    },
    statusLabels: {
      'On Display':    'On Display',
      'Storage':       'Boxed Away',
      'Restoration':   'Being Restored',
      'Deaccessioned': 'Sold / Traded',
    },
  },

  certification: {
    title: 'Grading & Certification',
    labels: { authority: 'Grading Company', number: 'Certification Number', grade: 'Grade', date: 'Graded' },
    derivesCondition: true,
    authorities: [
      { id: 'AFA', label: 'AFA (Action Figure Authority)', scale: 'sealed-box' },
      { id: 'UKG', label: 'UKG (UK Graders)', scale: 'sealed-box' },
      { id: 'RAW', label: 'Ungraded', scale: 'raw' },
    ],
    scales: [sealedBoxScale, rawScale],
  },

  customFields: [
    { key: 'toys-models.item_number', label: 'Item / Set Number', type: 'text',
      placeholder: 'e.g. 75192' },
    { key: 'toys-models.scale', label: 'Scale', type: 'text', placeholder: 'e.g. 1:18, OO gauge' },
    { key: 'toys-models.piece_count', label: 'Piece Count', type: 'number', min: 1 },
    { key: 'toys-models.sealed', label: 'Sealed / Unopened', type: 'boolean' },
  ],

  listColumns: [
    { field: 'artist', label: 'Brand' },
    { field: 'production_date', label: 'Year' },
    { field: 'object_type', label: 'Type' },
  ],

  breakdowns: [
    { field: 'artist', title: 'By Brand' },
    { field: 'object_type', title: 'By Type' },
  ],
}
