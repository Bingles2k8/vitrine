import type { CollectionProfile } from '../types'
import { sheldon70Scale, pmg70Scale, rawScale } from '../scales'

export const coinsBanknotes: CollectionProfile = {
  id: 'coins-banknotes',
  label: 'Coins & Banknotes',
  blurb: 'Numismatics, medals, paper money, bullion',
  emoji: '🪙',
  category: 'Coins & Medals',

  nouns: { item: 'Coin', itemPlural: 'Coins', collection: 'Collection', addItem: 'Add Coin' },

  fields: {
    title:            { label: 'Coin / Note', placeholder: 'e.g. 1933 Double Eagle' },
    artist:           { label: 'Mint / Issuing Authority', placeholder: 'e.g. Royal Mint, Philadelphia' },
    production_date:  { label: 'Year Struck', placeholder: 'e.g. 1933' },
    culture:          { label: 'Country of Issue', placeholder: 'e.g. United Kingdom' },
    object_type:      { label: 'Type', placeholder: 'e.g. Sovereign, Banknote…' },
    medium:           { label: 'Metal / Composition', placeholder: 'e.g. 22ct gold, cupro-nickel' },
    rarity:           { label: 'Mintage', placeholder: 'e.g. 445,500 struck' },
    number_of_parts:  { hidden: true },
    inscription:      { label: 'Legend & Edge Inscription', placeholder: 'Obverse and reverse legends, edge lettering…' },
    current_location: { label: 'Stored In', placeholder: 'e.g. Cabinet tray 2' },
  },

  fieldOrder: ['title', 'artist', 'production_date', 'culture', 'object_type', 'medium',
               'rarity', 'status', 'description', 'inscription'],

  vocab: {
    objectTypes: ['Circulating Coin', 'Commemorative', 'Proof', 'Bullion', 'Sovereign',
                  'Crown', 'Pattern', 'Trial', 'Token', 'Medal', 'Military Medal',
                  'Banknote', 'Emergency Issue', 'Error Coin', 'Hammered', 'Ancient', 'Other'],
    mediums:     ['Gold', 'Silver', 'Sterling silver', 'Bronze', 'Copper', 'Cupro-nickel',
                  'Nickel-brass', 'Bi-metallic', 'Platinum', 'Electrum', 'Steel',
                  'Paper', 'Polymer', 'Other'],
    emojis:      ['🪙','💰','🥇','🥈','🥉','💵','💷','💶','💴','👑','⚖️','🏅','🎖️','📜','🔱','⭐'],
    conditionLabels: {
      Excellent: 'Uncirculated',
      Good:      'About Uncirculated',
      Fair:      'Very Fine',
      Poor:      'Fine / Good',
      Critical:  'Poor',
    },
    statusLabels: {
      'On Display':    'On Display',
      'Storage':       'In Cabinet',
      'Restoration':   'Away for Grading',
      'Deaccessioned': 'Sold / Traded',
    },
  },

  certification: {
    title: 'Grading & Certification',
    labels: { authority: 'Grading Service', number: 'Certification Number', grade: 'Grade', date: 'Graded' },
    derivesCondition: true,
    authorities: [
      { id: 'PCGS', label: 'PCGS', scale: 'sheldon70' },
      { id: 'NGC', label: 'NGC', scale: 'sheldon70' },
      { id: 'ANACS', label: 'ANACS', scale: 'sheldon70' },
      { id: 'ICG', label: 'ICG', scale: 'sheldon70' },
      { id: 'PMG', label: 'PMG (banknotes)', scale: 'pmg70' },
      { id: 'PCGS-BN', label: 'PCGS Banknote', scale: 'pmg70' },
      { id: 'RAW', label: 'Ungraded / Raw', scale: 'raw' },
    ],
    scales: [sheldon70Scale, pmg70Scale, rawScale],
  },

  customFields: [
    { key: 'coins-banknotes.denomination', label: 'Denomination', type: 'text',
      placeholder: 'e.g. One Pound, $20' },
    { key: 'coins-banknotes.mint_mark', label: 'Mint Mark', type: 'text', placeholder: 'e.g. S, D, CC' },
    { key: 'coins-banknotes.metal_fineness', label: 'Metal & Fineness', type: 'text',
      placeholder: 'e.g. .917 gold, .925 silver' },
    { key: 'coins-banknotes.serial_number', label: 'Serial Number', type: 'text',
      help: 'Banknotes — the printed serial. Fancy serials carry a premium.' },
  ],

  listColumns: [
    { field: 'production_date', label: 'Year' },
    { field: 'culture', label: 'Country' },
    { field: 'cert_grade', label: 'Grade' },
  ],

  breakdowns: [
    { field: 'culture', title: 'By Country' },
    { field: 'cert_grade', title: 'By Grade' },
    { field: 'medium', title: 'By Metal' },
  ],
}
