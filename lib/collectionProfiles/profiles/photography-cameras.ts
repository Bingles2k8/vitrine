import type { CollectionProfile } from '../types'

export const photographyCameras: CollectionProfile = {
  id: 'photography-cameras',
  label: 'Cameras & Technology',
  blurb: 'Vintage cameras, lenses, retro computing, hi-fi',
  emoji: '📷',
  category: 'Cameras & Optical Equipment',

  nouns: { item: 'Item', itemPlural: 'Items', collection: 'Collection', addItem: 'Add Item' },

  fields: {
    title:            { label: 'Model', placeholder: 'e.g. Leica M3' },
    artist:           { label: 'Make / Manufacturer', placeholder: 'e.g. Leica, Commodore' },
    production_date:  { label: 'Year', placeholder: 'e.g. 1954' },
    culture:          { label: 'Country of Origin', placeholder: 'e.g. Germany, Japan' },
    object_type:      { label: 'Type', placeholder: 'e.g. Rangefinder, Lens…' },
    medium:           { label: 'Body Materials', placeholder: 'e.g. Brass, chrome, vulcanite' },
    rarity:           { label: 'Serial Number', placeholder: 'e.g. 700001' },
    inscription:      { label: 'Engravings & Labels', placeholder: 'Engraved text, service stickers, badges…' },
    current_location: { label: 'Stored In', placeholder: 'e.g. Shelf C, dry cabinet' },
  },

  fieldOrder: ['title', 'artist', 'production_date', 'object_type', 'rarity', 'medium',
               'culture', 'status', 'description', 'inscription'],

  vocab: {
    objectTypes: ['Rangefinder', 'SLR', 'TLR', 'Point & Shoot', 'Large Format',
                  'Medium Format', 'Instant Camera', 'Cine Camera', 'Digital Camera',
                  'Lens', 'Light Meter', 'Enlarger', 'Tripod', 'Projector',
                  'Home Computer', 'Games Console', 'Calculator', 'Radio',
                  'Turntable', 'Amplifier', 'Typewriter', 'Telephone', 'Other'],
    mediums:     ['Brass', 'Chrome', 'Aluminium', 'Magnesium alloy', 'Titanium',
                  'Vulcanite', 'Leatherette', 'Bakelite', 'ABS plastic', 'Wood',
                  'Glass optics', 'Other'],
    emojis:      ['📷','📸','🎥','📽️','🔭','🔬','💻','🖥️','⌨️','🖱️','📻','📺','☎️','💾','🎞️','🧿'],
    conditionLabels: {
      Excellent: 'Mint',
      Good:      'Excellent',
      Fair:      'Good — user condition',
      Poor:      'Worn / Faulty',
      Critical:  'For parts',
    },
    statusLabels: {
      'On Display':    'On Display',
      'Storage':       'In Storage',
      'Restoration':   'Being Serviced',
      'Deaccessioned': 'Sold / Traded',
    },
  },

  customFields: [
    { key: 'photography-cameras.serial_number', label: 'Serial Number', type: 'text' },
    { key: 'photography-cameras.lens_mount', label: 'Lens Mount / Format', type: 'text',
      placeholder: 'e.g. M mount, 35mm' },
    { key: 'photography-cameras.shutter_count', label: 'Shutter Count', type: 'number', min: 0 },
    { key: 'photography-cameras.working', label: 'Working Order', type: 'select',
      options: ['Fully working', 'Working with faults', 'Untested', 'Not working', 'For parts'] },
  ],

  listColumns: [
    { field: 'artist', label: 'Make' },
    { field: 'production_date', label: 'Year' },
    { field: 'custom:photography-cameras.working', label: 'Working' },
  ],

  breakdowns: [
    { field: 'artist', title: 'By Make' },
    { field: 'object_type', title: 'By Type' },
    { field: 'custom:photography-cameras.working', title: 'By Working Order' },
  ],
}
