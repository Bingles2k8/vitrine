import type { CollectionProfile } from '../types'
import { wata10Scale, rawScale } from '../scales'

export const videoGames: CollectionProfile = {
  id: 'video-games',
  label: 'Video Games & Consoles',
  blurb: 'Retro carts, sealed games, hardware',
  emoji: '🎮',
  category: 'Video Games & Consoles',

  nouns: { item: 'Game', itemPlural: 'Games', collection: 'Collection', addItem: 'Add Game' },

  fields: {
    title:            { label: 'Game / Item', placeholder: 'e.g. Super Mario Bros.' },
    artist:           { label: 'Publisher / Developer', placeholder: 'e.g. Nintendo' },
    production_date:  { label: 'Release Year', placeholder: 'e.g. 1985' },
    culture:          { label: 'Region', placeholder: 'e.g. NTSC-U, PAL' },
    object_type:      { label: 'Format', placeholder: 'e.g. Cartridge, Disc…' },
    medium:           { label: 'Packaging', placeholder: 'e.g. Sealed, CIB, Loose' },
    rarity:           { label: 'Edition / Variant', placeholder: 'e.g. Collector’s Edition' },
    production_date_qualifier: { hidden: true },
    number_of_parts:  { label: 'Items in Lot' },
    inscription:      { label: 'Labels & Stickers', placeholder: 'Price stickers, seal type, rental markings…' },
    current_location: { label: 'Stored In', placeholder: 'e.g. Shelf B' },
  },

  fieldOrder: ['title', 'artist', 'production_date', 'culture', 'object_type', 'medium',
               'rarity', 'status', 'description', 'inscription'],

  vocab: {
    objectTypes: ['Cartridge', 'Disc', 'CD-ROM', 'DVD', 'Blu-ray', 'Floppy', 'Cassette',
                  'Console', 'Handheld', 'Controller', 'Accessory', 'Strategy Guide',
                  'Promotional', 'Other'],
    mediums:     ['Factory Sealed', 'Complete in Box (CIB)', 'Boxed, no manual',
                  'Loose / Cart only', 'Manual only', 'Box only', 'Other'],
    emojis:      ['🎮','👾','🕹️','💾','💿','📼','🎯','🍄','⭐','🏁','🐉','🚀','🎲','📀','🔌','🧿'],
    conditionLabels: {
      Excellent: 'Mint / Sealed',
      Good:      'Very Good',
      Fair:      'Good',
      Poor:      'Worn',
      Critical:  'Damaged',
    },
    statusLabels: {
      'On Display':    'On Display',
      'Storage':       'In Storage',
      'Restoration':   'Away for Grading',
      'Deaccessioned': 'Sold / Traded',
    },
  },

  certification: {
    title: 'Grading & Certification',
    labels: { authority: 'Grading Company', number: 'Certification Number', grade: 'Grade', date: 'Graded' },
    derivesCondition: true,
    authorities: [
      { id: 'WATA', label: 'WATA', scale: 'wata10' },
      { id: 'VGA', label: 'VGA', scale: 'wata10' },
      { id: 'CGC', label: 'CGC Video Games', scale: 'wata10' },
      { id: 'RAW', label: 'Ungraded / Raw', scale: 'raw' },
    ],
    scales: [wata10Scale, rawScale],
  },

  customFields: [
    { key: 'video-games.platform', label: 'Platform', type: 'select',
      options: ['NES', 'SNES', 'N64', 'GameCube', 'Wii', 'Switch', 'Game Boy',
                'Game Boy Advance', 'Nintendo DS', 'Master System', 'Mega Drive / Genesis',
                'Saturn', 'Dreamcast', 'PlayStation', 'PlayStation 2', 'PlayStation 3',
                'PlayStation 4', 'PlayStation 5', 'PSP', 'Xbox', 'Xbox 360', 'Xbox One',
                'Xbox Series', 'Atari 2600', 'Amiga', 'Commodore 64', 'ZX Spectrum',
                'PC', 'Arcade', 'Other'] },
    { key: 'video-games.region_code', label: 'Region Code', type: 'select',
      options: ['NTSC-U (North America)', 'NTSC-J (Japan)', 'PAL (Europe)',
                'PAL (Australia)', 'Region Free', 'Other'] },
    { key: 'video-games.completeness', label: 'Completeness', type: 'select',
      options: ['Factory Sealed', 'Complete in Box', 'Boxed — no manual',
                'Loose', 'Manual only', 'Box only'] },
  ],

  listColumns: [
    { field: 'custom:video-games.platform', label: 'Platform' },
    { field: 'production_date', label: 'Year' },
    { field: 'cert_grade', label: 'Grade' },
  ],

  breakdowns: [
    { field: 'custom:video-games.platform', title: 'By Platform' },
    { field: 'custom:video-games.completeness', title: 'By Completeness' },
    { field: 'cert_grade', title: 'By Grade' },
  ],
}
