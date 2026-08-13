import type { CollectionProfile } from '../types'
import { diamondClarityScale, rawScale } from '../scales'

export const jewellery: CollectionProfile = {
  id: 'jewellery',
  label: 'Jewellery & Gemstones',
  blurb: 'Fine jewellery, loose stones, silver',
  emoji: '💍',
  category: 'Jewellery',

  nouns: { item: 'Piece', itemPlural: 'Pieces', collection: 'Collection', addItem: 'Add Piece' },

  fields: {
    title:            { label: 'Piece', placeholder: 'e.g. Art Deco diamond ring' },
    artist:           { label: 'Maker / Designer', placeholder: 'e.g. Cartier, Georg Jensen' },
    production_date:  { label: 'Date', placeholder: 'e.g. c.1925' },
    culture:          { label: 'Origin', placeholder: 'e.g. French, English' },
    object_type:      { label: 'Type', placeholder: 'e.g. Ring, Necklace…' },
    medium:           { label: 'Metal & Stones', placeholder: 'e.g. Platinum, old-cut diamonds' },
    rarity:           { label: 'Hallmark', placeholder: 'e.g. London 1925, 950 Pt' },
    number_of_parts:  { label: 'Pieces in Suite' },
    inscription:      { label: 'Hallmarks & Engraving', placeholder: 'Assay marks, maker’s mark, engraving…' },
    current_location: { label: 'Stored In', placeholder: 'e.g. Safe, tray 1' },
  },

  vocab: {
    objectTypes: ['Ring', 'Engagement Ring', 'Necklace', 'Pendant', 'Bracelet', 'Bangle',
                  'Earrings', 'Brooch', 'Tiara', 'Cufflinks', 'Watch Chain', 'Locket',
                  'Loose Gemstone', 'Parure / Suite', 'Other'],
    mediums:     ['Platinum', '18ct yellow gold', '18ct white gold', '18ct rose gold',
                  '14ct gold', '9ct gold', 'Sterling silver', 'Palladium', 'Titanium',
                  'Diamond', 'Sapphire', 'Ruby', 'Emerald', 'Opal', 'Pearl', 'Jade',
                  'Amber', 'Turquoise', 'Garnet', 'Aquamarine', 'Topaz', 'Other'],
    emojis:      ['💍','💎','📿','👑','🔶','🔷','🟣','⚪','🟡','🌟','✨','🫧','🪞','🐚','🌸','🧿'],
    conditionLabels: {
      Excellent: 'Excellent',
      Good:      'Very Good',
      Fair:      'Good — wear consistent with age',
      Poor:      'Poor — needs restoration',
      Critical:  'Damaged',
    },
    statusLabels: {
      'On Display':    'In Wear / On Display',
      'Storage':       'In Safe',
      'Restoration':   'With Jeweller',
      'Deaccessioned': 'Sold / Gifted',
    },
  },

  certification: {
    title: 'Laboratory Certification',
    labels: { authority: 'Laboratory', number: 'Report Number', grade: 'Clarity', date: 'Reported' },
    derivesCondition: false,
    authorities: [
      { id: 'GIA', label: 'GIA', scale: 'diamond-clarity' },
      { id: 'IGI', label: 'IGI', scale: 'diamond-clarity' },
      { id: 'AGS', label: 'AGS', scale: 'diamond-clarity' },
      { id: 'HRD', label: 'HRD Antwerp', scale: 'diamond-clarity' },
      { id: 'GCS', label: 'Gem-A / GCS', scale: 'diamond-clarity' },
      { id: 'NONE', label: 'Not certified', scale: 'raw' },
    ],
    scales: [diamondClarityScale, rawScale],
  },

  customFields: [
    { key: 'jewellery.carat_weight', label: 'Carat Weight', type: 'number', unit: 'ct', min: 0 },
    { key: 'jewellery.metal_fineness', label: 'Metal & Fineness', type: 'text',
      placeholder: 'e.g. 950 platinum, 750 gold' },
    { key: 'jewellery.principal_stone', label: 'Principal Stone', type: 'text',
      placeholder: 'e.g. Old European cut diamond' },
    { key: 'jewellery.size', label: 'Ring / Chain Size', type: 'text', placeholder: 'e.g. N½, 18"' },
  ],

  listColumns: [
    { field: 'object_type', label: 'Type' },
    { field: 'medium', label: 'Metal & Stones' },
    { field: 'production_date', label: 'Date' },
  ],

  breakdowns: [
    { field: 'object_type', title: 'By Type' },
    { field: 'artist', title: 'By Maker' },
  ],
}
