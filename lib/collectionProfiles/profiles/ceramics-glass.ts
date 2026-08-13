import type { CollectionProfile } from '../types'

export const ceramicsGlass: CollectionProfile = {
  id: 'ceramics-glass',
  label: 'Ceramics & Glass',
  blurb: 'Pottery, porcelain, studio glass, tableware',
  emoji: '🏺',
  category: 'Ceramics & Pottery',

  nouns: { item: 'Piece', itemPlural: 'Pieces', collection: 'Collection', addItem: 'Add Piece' },

  fields: {
    title:            { label: 'Piece', placeholder: 'e.g. Blue and white ginger jar' },
    artist:           { label: 'Maker / Factory', placeholder: 'e.g. Wedgwood, Bernard Leach' },
    production_date:  { label: 'Date', placeholder: 'e.g. c.1880' },
    culture:          { label: 'Origin', placeholder: 'e.g. English, Chinese' },
    object_type:      { label: 'Form', placeholder: 'e.g. Vase, Bowl…' },
    medium:           { label: 'Body & Glaze', placeholder: 'e.g. Bone china, tin-glazed earthenware' },
    rarity:           { label: 'Pattern / Mark', placeholder: 'e.g. Willow, impressed LEACH' },
    number_of_parts:  { label: 'Pieces in Set' },
    inscription:      { label: 'Marks & Signatures', placeholder: 'Factory marks, impressed seals, painted marks…' },
    current_location: { label: 'Stored In', placeholder: 'e.g. Dresser, top shelf' },
  },

  vocab: {
    objectTypes: ['Vase', 'Bowl', 'Plate', 'Charger', 'Dish', 'Jug', 'Teapot', 'Cup & Saucer',
                  'Tureen', 'Figurine', 'Tile', 'Jar', 'Decanter', 'Drinking Glass',
                  'Paperweight', 'Sculpture', 'Tableware Service', 'Other'],
    mediums:     ['Porcelain', 'Bone china', 'Hard-paste porcelain', 'Soft-paste porcelain',
                  'Earthenware', 'Stoneware', 'Salt-glazed stoneware', 'Tin-glazed earthenware',
                  'Delftware', 'Majolica', 'Raku', 'Celadon', 'Lead crystal', 'Cut glass',
                  'Pressed glass', 'Blown glass', 'Cameo glass', 'Uranium glass', 'Other'],
    emojis:      ['🏺','🫖','🍶','🍽️','🥣','🏵️','🌸','🐉','🪷','⚱️','🥂','🪞','⭐','🔵','🟤','🧿'],
    conditionLabels: {
      Excellent: 'Perfect',
      Good:      'Very Good',
      Fair:      'Minor damage',
      Poor:      'Chipped / Cracked',
      Critical:  'Restored / Broken',
    },
    statusLabels: {
      'On Display':    'On Display',
      'Storage':       'In Storage',
      'Restoration':   'With Restorer',
      'Deaccessioned': 'Sold / Gifted',
    },
  },

  customFields: [
    { key: 'ceramics-glass.pattern_name', label: 'Pattern Name', type: 'text',
      placeholder: 'e.g. Willow, Imari' },
    { key: 'ceramics-glass.factory_mark', label: 'Factory Mark', type: 'text',
      placeholder: 'e.g. Crossed swords, impressed WEDGWOOD' },
    { key: 'ceramics-glass.set_piece_count', label: 'Pieces in Set', type: 'number', min: 1 },
  ],

  listColumns: [
    { field: 'artist', label: 'Maker' },
    { field: 'production_date', label: 'Date' },
    { field: 'medium', label: 'Body' },
  ],

  breakdowns: [
    { field: 'artist', title: 'By Maker' },
    { field: 'medium', title: 'By Body & Glaze' },
  ],
}
