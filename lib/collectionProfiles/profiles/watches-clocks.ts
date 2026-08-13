import type { CollectionProfile } from '../types'
import { papersScale, rawScale } from '../scales'

export const watchesClocks: CollectionProfile = {
  id: 'watches-clocks',
  label: 'Watches & Clocks',
  blurb: 'Wristwatches, pocket watches, horology',
  emoji: '⌚',
  category: 'Clocks & Watches',

  nouns: { item: 'Watch', itemPlural: 'Watches', collection: 'Collection', addItem: 'Add Watch' },

  fields: {
    title:            { label: 'Model', placeholder: 'e.g. Submariner Date' },
    artist:           { label: 'Brand / Manufacturer', placeholder: 'e.g. Rolex, Omega' },
    production_date:  { label: 'Year of Manufacture', placeholder: 'e.g. 1968' },
    culture:          { label: 'Country of Origin', placeholder: 'e.g. Switzerland' },
    object_type:      { label: 'Type', placeholder: 'e.g. Dive Watch, Pocket Watch…' },
    medium:           { label: 'Case Material', placeholder: 'e.g. Stainless steel, 18ct gold' },
    rarity:           { label: 'Reference Number', placeholder: 'e.g. 5513' },
    number_of_parts:  { hidden: true },
    inscription:      { label: 'Dial & Caseback Markings', placeholder: 'Dial text, engravings, hallmarks…' },
    current_location: { label: 'Stored In', placeholder: 'e.g. Watch box, slot 3' },
  },

  fieldOrder: ['title', 'artist', 'production_date', 'rarity', 'object_type', 'medium',
               'culture', 'status', 'description', 'inscription'],

  vocab: {
    objectTypes: ['Dress Watch', 'Dive Watch', 'Chronograph', 'Pilot / Aviation', 'GMT',
                  'Field Watch', 'Racing / Motorsport', 'Dual Time', 'Perpetual Calendar',
                  'Moonphase', 'Skeleton', 'Pocket Watch', 'Wall Clock', 'Mantel Clock',
                  'Longcase Clock', 'Carriage Clock', 'Marine Chronometer', 'Other'],
    mediums:     ['Stainless steel', '18ct yellow gold', '18ct white gold', '18ct rose gold',
                  '9ct gold', 'Platinum', 'Titanium', 'Ceramic', 'Bronze', 'Gold-plated',
                  'Silver', 'Brass', 'Mahogany', 'Oak', 'Walnut', 'Other'],
    emojis:      ['⌚','🕰️','⏰','⏱️','⏲️','🧭','⚙️','🔧','💎','👑','🌙','⭐','🔩','📿','🗝️','🧿'],
    conditionLabels: {
      Excellent: 'Mint / Unworn',
      Good:      'Excellent',
      Fair:      'Good — honest wear',
      Poor:      'Worn / Needs service',
      Critical:  'Not running',
    },
    statusLabels: {
      'On Display':    'In Rotation',
      'Storage':       'In Safe / Box',
      'Restoration':   'Away for Service',
      'Deaccessioned': 'Sold / Traded',
    },
  },

  certification: {
    // Not a quality grade — completeness of box, papers and provenance, which
    // is what actually moves the value of a vintage watch.
    title: 'Papers & Provenance',
    labels: { authority: 'Issuing Body', number: 'Certificate / Archive Ref', grade: 'Completeness', date: 'Issued' },
    derivesCondition: false,
    authorities: [
      { id: 'MANUFACTURER', label: 'Manufacturer archive extract', scale: 'papers' },
      { id: 'COSC', label: 'COSC chronometer certificate', scale: 'papers' },
      { id: 'DEALER', label: 'Authorised dealer papers', scale: 'papers' },
      { id: 'SERVICE', label: 'Service centre documentation', scale: 'papers' },
      { id: 'NONE', label: 'No papers', scale: 'raw' },
    ],
    scales: [papersScale, rawScale],
  },

  customFields: [
    { key: 'watches-clocks.reference_number', label: 'Reference Number', type: 'text',
      placeholder: 'e.g. 116610LN' },
    { key: 'watches-clocks.serial_number', label: 'Serial Number', type: 'text' },
    { key: 'watches-clocks.movement_calibre', label: 'Movement / Calibre', type: 'text',
      placeholder: 'e.g. Cal. 3135, ETA 2824-2' },
    { key: 'watches-clocks.box_and_papers', label: 'Box & Papers', type: 'select',
      options: ['Full set', 'Watch, box & papers', 'Watch & papers', 'Watch & box',
                'Watch only'] },
  ],

  listColumns: [
    { field: 'artist', label: 'Brand' },
    { field: 'custom:watches-clocks.reference_number', label: 'Reference' },
    { field: 'production_date', label: 'Year' },
  ],

  breakdowns: [
    { field: 'artist', title: 'By Brand' },
    { field: 'object_type', title: 'By Type' },
    { field: 'custom:watches-clocks.box_and_papers', title: 'By Completeness' },
  ],
}
