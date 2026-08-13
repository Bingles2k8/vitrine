import type { CollectionProfile } from '../types'

/**
 * The broad antiques/collectables catch-all. Deliberately light: relabelling
 * is sufficient, so there are no custom fields and no certification. Anything
 * more specific should get its own profile rather than bloating this one.
 */
export const antiques: CollectionProfile = {
  id: 'antiques',
  label: 'Antiques & Collectables',
  blurb: 'Furniture, silver, decorative arts, general antiques',
  emoji: '🕰️',
  category: 'Antiques & Collectibles',

  nouns: { item: 'Piece', itemPlural: 'Pieces', collection: 'Collection', addItem: 'Add Piece' },

  fields: {
    title:            { label: 'Piece', placeholder: 'e.g. Georgian mahogany chest' },
    artist:           { label: 'Maker / Retailer', placeholder: 'e.g. Gillows, Mappin & Webb' },
    production_date:  { label: 'Date', placeholder: 'e.g. c.1790' },
    culture:          { label: 'Origin', placeholder: 'e.g. English, French' },
    object_type:      { label: 'Type', placeholder: 'e.g. Chest of Drawers, Candlestick…' },
    medium:           { label: 'Materials', placeholder: 'e.g. Mahogany, sterling silver' },
    rarity:           { label: 'Edition / Mark', placeholder: 'e.g. Hallmarked London 1790' },
    inscription:      { label: 'Marks & Labels', placeholder: 'Hallmarks, maker’s labels, stamps…' },
    current_location: { label: 'Location', placeholder: 'e.g. Dining room' },
  },

  vocab: {
    objectTypes: ['Chair', 'Table', 'Chest of Drawers', 'Bureau', 'Cabinet', 'Bookcase',
                  'Mirror', 'Clock', 'Candlestick', 'Tea Service', 'Cutlery', 'Tray',
                  'Box', 'Lamp', 'Rug / Carpet', 'Sign', 'Tool', 'Scientific Instrument',
                  'Musical Instrument', 'Other'],
    mediums:     ['Mahogany', 'Oak', 'Walnut', 'Rosewood', 'Satinwood', 'Pine', 'Elm',
                  'Sterling silver', 'Silver plate', 'Sheffield plate', 'Pewter', 'Brass',
                  'Copper', 'Cast iron', 'Bronze', 'Marble', 'Leather', 'Glass',
                  'Tortoiseshell', 'Mother-of-pearl', 'Other'],
    emojis:      ['🕰️','🪞','🪑','🛋️','🗄️','🕯️','🍴','☕','🏺','🖼️','🔔','⚖️','🗝️','📻','🪆','🧿'],
    conditionLabels: {
      Excellent: 'Excellent',
      Good:      'Very Good',
      Fair:      'Good — honest wear',
      Poor:      'Poor — needs restoration',
      Critical:  'Damaged',
    },
    statusLabels: {
      'On Display':    'In Use / On Display',
      'Storage':       'In Storage',
      'Restoration':   'Being Restored',
      'Deaccessioned': 'Sold / Gifted',
    },
  },

  listColumns: [
    { field: 'artist', label: 'Maker' },
    { field: 'production_date', label: 'Date' },
    { field: 'medium', label: 'Materials' },
  ],

  breakdowns: [
    { field: 'object_type', title: 'By Type' },
    { field: 'medium', title: 'By Materials' },
  ],
}
