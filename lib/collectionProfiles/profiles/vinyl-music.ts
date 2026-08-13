import type { CollectionProfile } from '../types'

export const vinylMusic: CollectionProfile = {
  id: 'vinyl-music',
  label: 'Vinyl & Recorded Music',
  blurb: 'Records, pressings, tapes, CDs',
  emoji: '💿',
  category: 'Records & Music',

  nouns: { item: 'Record', itemPlural: 'Records', collection: 'Collection', addItem: 'Add Record' },

  fields: {
    title:            { label: 'Album / Title', placeholder: 'e.g. Kind of Blue' },
    artist:           { label: 'Artist', placeholder: 'e.g. Miles Davis' },
    production_date:  { label: 'Release Year', placeholder: 'e.g. 1959' },
    culture:          { label: 'Label / Country', placeholder: 'e.g. Columbia — US' },
    object_type:      { label: 'Format', placeholder: 'e.g. LP, 7" Single…' },
    medium:           { label: 'Vinyl Colour / Weight', placeholder: 'e.g. Black 180g, Clear' },
    rarity:           { label: 'Pressing / Edition', placeholder: 'e.g. First pressing, 1 of 500' },
    number_of_parts:  { label: 'Discs in Set' },
    inscription:      { label: 'Runout & Sleeve Markings', placeholder: 'Runout etchings, stampers, promo stamps…' },
    current_location: { label: 'Stored In', placeholder: 'e.g. Shelf A, crate 2' },
  },

  fieldOrder: ['title', 'artist', 'production_date', 'object_type', 'culture', 'medium',
               'rarity', 'number_of_parts', 'status', 'description', 'inscription'],

  vocab: {
    objectTypes: ['LP', '12" Single', '10"', '7" Single', 'EP', 'Box Set', 'Picture Disc',
                  'Flexi Disc', 'Shellac 78', 'CD', 'Cassette', 'Reel-to-Reel',
                  '8-Track', 'MiniDisc', 'Other'],
    mediums:     ['Black vinyl', 'Black 180g', 'Clear', 'Coloured', 'Splatter', 'Marbled',
                  'Picture disc', 'Half-speed master', 'Audiophile pressing', 'Shellac',
                  'Other'],
    cultures:    ['UK', 'US', 'Germany', 'Japan', 'France', 'Netherlands', 'Italy',
                  'Canada', 'Australia', 'Brazil', 'Jamaica', 'Sweden', 'Spain', 'Other'],
    emojis:      ['💿','📀','🎵','🎶','🎸','🎷','🎺','🥁','🎹','🎤','🎧','📻','🔊','⭐','🌈','🧿'],
    conditionLabels: {
      Excellent: 'Mint / Near Mint',
      Good:      'Very Good Plus',
      Fair:      'Very Good',
      Poor:      'Good',
      Critical:  'Poor / Fair',
    },
    statusLabels: {
      'On Display':    'On Display',
      'Storage':       'On the Shelf',
      'Restoration':   'Being Cleaned',
      'Deaccessioned': 'Sold / Traded',
    },
  },

  customFields: [
    { key: 'vinyl-music.catalogue_number', label: 'Catalogue Number', type: 'text',
      placeholder: 'e.g. CL 1355' },
    { key: 'vinyl-music.matrix_runout', label: 'Matrix / Runout', type: 'text',
      placeholder: 'e.g. XLP 45144-1A', help: 'Etched in the dead wax — how pressings are identified.' },
    { key: 'vinyl-music.speed_rpm', label: 'Speed', type: 'select',
      options: ['33⅓ RPM', '45 RPM', '78 RPM', 'Not applicable'] },
    { key: 'vinyl-music.sleeve_condition', label: 'Sleeve Condition', type: 'select',
      options: ['Mint', 'Near Mint', 'Very Good Plus', 'Very Good', 'Good', 'Poor', 'No sleeve'] },
  ],

  listColumns: [
    { field: 'artist', label: 'Artist' },
    { field: 'production_date', label: 'Year' },
    { field: 'object_type', label: 'Format' },
  ],

  breakdowns: [
    { field: 'artist', title: 'By Artist' },
    { field: 'object_type', title: 'By Format' },
    { field: 'culture', title: 'By Label / Country' },
  ],
}
