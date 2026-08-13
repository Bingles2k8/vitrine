import type { CollectionProfile } from '../types'
import { authenticationScale, rawScale } from '../scales'

export const sportsMemorabilia: CollectionProfile = {
  id: 'sports-memorabilia',
  label: 'Sports Memorabilia',
  blurb: 'Shirts, programmes, autographs, match-worn',
  emoji: '🏆',
  category: 'Sports Memorabilia',

  nouns: { item: 'Item', itemPlural: 'Items', collection: 'Collection', addItem: 'Add Item' },

  fields: {
    title:            { label: 'Item', placeholder: 'e.g. 1966 World Cup Final programme' },
    artist:           { label: 'Team / Player', placeholder: 'e.g. England — Bobby Moore' },
    production_date:  { label: 'Year', placeholder: 'e.g. 1966' },
    culture:          { label: 'League / Country', placeholder: 'e.g. FIFA World Cup' },
    object_type:      { label: 'Type', placeholder: 'e.g. Match Shirt, Programme…' },
    medium:           { label: 'Materials', placeholder: 'e.g. Cotton, leather, paper' },
    rarity:           { label: 'Edition', placeholder: 'e.g. 1 of 100' },
    inscription:      { label: 'Signatures & Markings', placeholder: 'Autographs, squad numbers, embroidery…' },
    current_location: { label: 'Stored In', placeholder: 'e.g. Frame, hallway' },
  },

  vocab: {
    objectTypes: ['Match-worn Shirt', 'Replica Shirt', 'Boots', 'Ball', 'Programme',
                  'Ticket', 'Pennant', 'Medal', 'Trophy', 'Signed Photograph',
                  'Autograph', 'Poster', 'Equipment', 'Other'],
    mediums:     ['Cotton', 'Polyester', 'Wool', 'Leather', 'Paper', 'Card', 'Metal',
                  'Wood', 'Resin', 'Other'],
    emojis:      ['🏆','⚽','🏉','🏏','🎾','🏀','⚾','🥊','🏒','🏅','🎽','👟','🥇','🎫','📯','🧿'],
    conditionLabels: {
      Excellent: 'Excellent',
      Good:      'Very Good',
      Fair:      'Good — used',
      Poor:      'Worn',
      Critical:  'Damaged',
    },
    statusLabels: {
      'On Display':    'On Display',
      'Storage':       'In Storage',
      'Restoration':   'Being Conserved',
      'Deaccessioned': 'Sold / Traded',
    },
  },

  certification: {
    title: 'Authentication',
    labels: { authority: 'Authenticator', number: 'Certification Number', grade: 'Opinion', date: 'Authenticated' },
    derivesCondition: false,
    authorities: [
      { id: 'PSA-DNA', label: 'PSA/DNA', scale: 'authentication' },
      { id: 'JSA', label: 'JSA (James Spence)', scale: 'authentication' },
      { id: 'BAS', label: 'Beckett Authentication', scale: 'authentication' },
      { id: 'CLUB', label: 'Club / player certificate', scale: 'authentication' },
      { id: 'NONE', label: 'Not authenticated', scale: 'raw' },
    ],
    scales: [authenticationScale, rawScale],
  },

  customFields: [
    { key: 'sports-memorabilia.player_team', label: 'Player / Team', type: 'text' },
    { key: 'sports-memorabilia.event_date', label: 'Event Date', type: 'date' },
    { key: 'sports-memorabilia.game_used', label: 'Match Used', type: 'boolean' },
    { key: 'sports-memorabilia.signed', label: 'Signed', type: 'boolean' },
  ],

  listColumns: [
    { field: 'artist', label: 'Team / Player' },
    { field: 'production_date', label: 'Year' },
    { field: 'object_type', label: 'Type' },
  ],

  breakdowns: [
    { field: 'artist', title: 'By Team / Player' },
    { field: 'object_type', title: 'By Type' },
  ],
}
