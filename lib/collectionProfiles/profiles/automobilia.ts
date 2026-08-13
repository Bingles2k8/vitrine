import type { CollectionProfile } from '../types'

export const automobilia: CollectionProfile = {
  id: 'automobilia',
  label: 'Automobilia & Vehicles',
  blurb: 'Cars, motorcycles, parts, petroliana',
  emoji: '🚗',
  category: 'Automobilia & Vehicles',

  nouns: { item: 'Item', itemPlural: 'Items', collection: 'Collection', addItem: 'Add Item' },

  fields: {
    title:            { label: 'Vehicle / Item', placeholder: 'e.g. Jaguar E-Type Series 1' },
    artist:           { label: 'Marque / Manufacturer', placeholder: 'e.g. Jaguar, Castrol' },
    production_date:  { label: 'Year', placeholder: 'e.g. 1963' },
    culture:          { label: 'Country of Origin', placeholder: 'e.g. United Kingdom' },
    object_type:      { label: 'Type', placeholder: 'e.g. Car, Enamel Sign…' },
    medium:           { label: 'Materials', placeholder: 'e.g. Steel, vitreous enamel' },
    rarity:           { label: 'Chassis / Part No.', placeholder: 'e.g. 850001' },
    inscription:      { label: 'Plates & Markings', placeholder: 'Chassis plates, casting numbers, decals…' },
    current_location: { label: 'Kept At', placeholder: 'e.g. Garage bay 2' },
  },

  vocab: {
    objectTypes: ['Car', 'Motorcycle', 'Scooter', 'Commercial Vehicle', 'Tractor',
                  'Engine', 'Body Panel', 'Wheel', 'Badge / Mascot', 'Enamel Sign',
                  'Petrol Pump', 'Oil Can', 'Handbook / Manual', 'Sales Brochure',
                  'Poster', 'Trophy', 'Tool', 'Other'],
    mediums:     ['Steel', 'Aluminium', 'Cast iron', 'Chrome', 'Brass', 'Vitreous enamel',
                  'Bakelite', 'Leather', 'Wood', 'Glass', 'Paper', 'Tinplate', 'Other'],
    emojis:      ['🚗','🏎️','🏍️','🚙','🚐','🚚','🚜','⚙️','🔧','🛞','⛽','🛢️','🏁','🪧','🏆','🧿'],
    conditionLabels: {
      Excellent: 'Concours',
      Good:      'Very Good',
      Fair:      'Original / Patina',
      Poor:      'Project',
      Critical:  'Restoration Required',
    },
    statusLabels: {
      'On Display':    'On Display',
      'Storage':       'In Garage',
      'Restoration':   'Under Restoration',
      'Deaccessioned': 'Sold / Traded',
    },
  },

  customFields: [
    { key: 'automobilia.chassis_vin', label: 'Chassis / VIN', type: 'text' },
    { key: 'automobilia.part_number', label: 'Part Number', type: 'text' },
    { key: 'automobilia.fits_model', label: 'Fits Model', type: 'text',
      placeholder: 'e.g. E-Type Series 1, 1961–1968' },
  ],

  listColumns: [
    { field: 'artist', label: 'Marque' },
    { field: 'production_date', label: 'Year' },
    { field: 'object_type', label: 'Type' },
  ],

  breakdowns: [
    { field: 'artist', title: 'By Marque' },
    { field: 'object_type', title: 'By Type' },
  ],
}
