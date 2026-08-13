import type { CollectionProfile } from '../types'
import { psa10Scale, bgs10Scale, rawScale } from '../scales'

export const tradingCards: CollectionProfile = {
  id: 'trading-cards',
  label: 'Trading Cards & TCGs',
  blurb: 'Sports cards, Pokémon, Magic, graded slabs',
  emoji: '🃏',
  category: 'Trading Cards & TCGs',

  nouns: { item: 'Card', itemPlural: 'Cards', collection: 'Collection', addItem: 'Add Card' },

  fields: {
    title:            { label: 'Card Name', placeholder: 'e.g. Charizard, Base Set' },
    artist:           { label: 'Set / Manufacturer', placeholder: 'e.g. Topps, Panini, Wizards of the Coast',
                        help: 'Who printed the card, and the set it belongs to.' },
    production_date:  { label: 'Year Printed', placeholder: 'e.g. 1999' },
    object_type:      { label: 'Card Type', placeholder: 'e.g. Rookie, Holo Rare…' },
    medium:           { label: 'Finish / Parallel', placeholder: 'e.g. Holo, Refractor, Foil…' },
    rarity:           { label: 'Print Run / Rarity', placeholder: 'e.g. 1 of 99, Short Print' },
    culture:          { hidden: true },
    production_date_qualifier: { hidden: true },
    number_of_parts:  { hidden: true },
    inscription:      { label: 'Signatures & Markings', placeholder: "Autographs, stamps, print marks…" },
    current_location: { label: 'Stored In', placeholder: 'e.g. Binder 3, Slab box A' },
  },

  fieldOrder: ['title', 'artist', 'production_date', 'object_type', 'medium', 'rarity',
               'status', 'description', 'inscription'],

  vocab: {
    objectTypes: ['Base', 'Rookie', 'Insert', 'Parallel', 'Holo Rare', 'Reverse Holo',
                  'Full Art', 'Secret Rare', 'Autograph', 'Relic / Patch', 'Promo',
                  'Error / Misprint', 'Graded Slab', 'Sealed Pack', 'Sealed Box', 'Other'],
    mediums:     ['Holo', 'Reverse Holo', 'Refractor', 'Prizm', 'Foil', 'Textured',
                  'Matte', 'Gloss', 'Gold', 'Rainbow', 'Cracked Ice', 'Non-foil', 'Other'],
    emojis:      ['🃏','🎴','⚡','🔥','💧','🌿','⭐','🏆','🥇','💎','📦','🧊','👑','🐉','🎯','🧿'],
    conditionLabels: {
      Excellent: 'Mint / Gem Mint',
      Good:      'Near Mint',
      Fair:      'Lightly Played',
      Poor:      'Heavily Played',
      Critical:  'Damaged',
    },
    statusLabels: {
      'On Display':    'In Display Case',
      'Storage':       'In Binder / Box',
      'Restoration':   'Away for Grading',
      'Deaccessioned': 'Sold / Traded',
    },
  },

  certification: {
    title: 'Grading & Certification',
    labels: { authority: 'Grading Company', number: 'Cert Number', grade: 'Grade', date: 'Graded' },
    derivesCondition: true,
    authorities: [
      { id: 'PSA', label: 'PSA', scale: 'psa10' },
      { id: 'BGS', label: 'Beckett (BGS)', scale: 'bgs10',
        subgrades: ['Centering', 'Corners', 'Edges', 'Surface'] },
      { id: 'CGC', label: 'CGC Cards', scale: 'psa10' },
      { id: 'SGC', label: 'SGC', scale: 'psa10' },
      { id: 'TAG', label: 'TAG', scale: 'psa10' },
      { id: 'RAW', label: 'Ungraded / Raw', scale: 'raw' },
    ],
    scales: [psa10Scale, bgs10Scale, rawScale],
  },

  customFields: [
    { key: 'trading-cards.card_number', label: 'Card Number', type: 'text',
      placeholder: 'e.g. 4/102' },
    { key: 'trading-cards.print_run', label: 'Print Run', type: 'number', min: 1,
      help: 'Total number printed, if the set discloses it.' },
    { key: 'trading-cards.language', label: 'Language', type: 'select',
      options: ['English', 'Japanese', 'German', 'French', 'Spanish', 'Italian',
                'Korean', 'Chinese', 'Portuguese', 'Other'] },
    { key: 'trading-cards.sealed', label: 'Sealed / Unopened', type: 'boolean' },
  ],

  listColumns: [
    { field: 'artist', label: 'Set' },
    { field: 'production_date', label: 'Year' },
    { field: 'cert_grade', label: 'Grade' },
  ],

  breakdowns: [
    { field: 'artist', title: 'By Set' },
    { field: 'cert_grade', title: 'By Grade' },
    { field: 'cert_authority', title: 'By Grading Company' },
  ],
}
