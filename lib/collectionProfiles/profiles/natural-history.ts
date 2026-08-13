import type { CollectionProfile } from '../types'

export const naturalHistory: CollectionProfile = {
  id: 'natural-history',
  label: 'Natural History',
  blurb: 'Fossils, minerals, taxidermy, specimens',
  emoji: '🦕',
  category: 'Natural History',

  nouns: { item: 'Specimen', itemPlural: 'Specimens', collection: 'Collection', addItem: 'Add Specimen' },

  fields: {
    title:            { label: 'Specimen', placeholder: 'e.g. Trilobite — Elrathia kingii' },
    artist:           { label: 'Collector / Locality', placeholder: 'e.g. Wheeler Shale, Utah' },
    production_date:  { label: 'Age / Period', placeholder: 'e.g. Cambrian, c.507 Ma' },
    culture:          { label: 'Geological Formation', placeholder: 'e.g. Wheeler Shale' },
    object_type:      { label: 'Specimen Type', placeholder: 'e.g. Fossil, Mineral…' },
    medium:           { label: 'Composition', placeholder: 'e.g. Calcite, pyritised' },
    rarity:           { label: 'Specimen Number', placeholder: 'e.g. NH-0142' },
    inscription:      { label: 'Labels & Annotations', placeholder: 'Original collection labels, determination slips…' },
    current_location: { label: 'Stored In', placeholder: 'e.g. Drawer 6' },
  },

  vocab: {
    objectTypes: ['Fossil', 'Mineral', 'Crystal', 'Meteorite', 'Rock', 'Gemstone (rough)',
                  'Shell', 'Insect', 'Butterfly', 'Bird', 'Mammal', 'Egg', 'Skeleton',
                  'Skull', 'Taxidermy Mount', 'Herbarium Sheet', 'Amber', 'Other'],
    mediums:     ['Calcite', 'Quartz', 'Pyrite', 'Silicified', 'Permineralised',
                  'Carbonised', 'Amber', 'Limestone matrix', 'Shale matrix',
                  'Sandstone matrix', 'Iron-nickel', 'Chitin', 'Bone', 'Keratin', 'Other'],
    emojis:      ['🦕','🦖','🐚','🦋','🪲','🦴','💎','🪨','🌿','🍃','🦉','🐝','🌋','☄️','🔬','🧿'],
    conditionLabels: {
      Excellent: 'Exceptional',
      Good:      'Good',
      Fair:      'Fair',
      Poor:      'Poor',
      Critical:  'Degraded',
    },
    statusLabels: {
      'On Display':    'On Display',
      'Storage':       'In Cabinet',
      'Restoration':   'Being Prepared',
      'Deaccessioned': 'Sold / Transferred',
    },
  },

  customFields: [
    { key: 'natural-history.species_taxon', label: 'Species / Taxon', type: 'text',
      placeholder: 'e.g. Elrathia kingii' },
    { key: 'natural-history.locality', label: 'Locality', type: 'text',
      placeholder: 'Where it was collected' },
    { key: 'natural-history.formation_period', label: 'Formation / Period', type: 'text',
      placeholder: 'e.g. Wheeler Shale, Cambrian' },
    { key: 'natural-history.permit_reference', label: 'Permit / CITES Reference', type: 'text', width: 'full',
      help: 'CITES permit or collecting licence reference. Required for many fossils, minerals and taxidermy specimens — keep the paperwork with the specimen.' },
  ],

  listColumns: [
    { field: 'custom:natural-history.species_taxon', label: 'Taxon' },
    { field: 'object_type', label: 'Type' },
    { field: 'production_date', label: 'Age' },
  ],

  breakdowns: [
    { field: 'object_type', title: 'By Specimen Type' },
    { field: 'culture', title: 'By Formation' },
  ],
}
