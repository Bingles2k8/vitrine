import type { CollectionProfile } from '../types'

export const books: CollectionProfile = {
  id: 'books',
  label: 'Books & Manuscripts',
  blurb: 'First editions, rare books, archives',
  emoji: '📚',
  category: 'Books & Manuscripts',

  nouns: { item: 'Book', itemPlural: 'Books', collection: 'Library', addItem: 'Add Book' },

  fields: {
    title:            { label: 'Title', placeholder: 'e.g. The Hobbit' },
    artist:           { label: 'Author / Publisher', placeholder: 'e.g. J.R.R. Tolkien — Allen & Unwin' },
    production_date:  { label: 'Publication Date', placeholder: 'e.g. 1937' },
    culture:          { label: 'Place of Publication', placeholder: 'e.g. London' },
    object_type:      { label: 'Type', placeholder: 'e.g. First Edition, Manuscript…' },
    medium:           { label: 'Binding & Materials', placeholder: 'e.g. Publisher’s cloth, full calf' },
    rarity:           { label: 'Edition / Printing', placeholder: 'e.g. First edition, first impression' },
    number_of_parts:  { label: 'Volumes' },
    inscription:      { label: 'Inscriptions & Bookplates', placeholder: 'Signatures, dedications, ownership marks…' },
    current_location: { label: 'Shelved At', placeholder: 'e.g. Case 3, shelf 2' },
  },

  vocab: {
    objectTypes: ['First Edition', 'Limited Edition', 'Signed Copy', 'Association Copy',
                  'Proof / ARC', 'Reprint', 'Incunabulum', 'Manuscript', 'Letter',
                  'Diary / Journal', 'Map', 'Atlas', 'Pamphlet', 'Periodical',
                  'Illustrated Book', 'Private Press', 'Other'],
    mediums:     ['Publisher’s cloth', 'Full leather', 'Half leather', 'Full calf',
                  'Full morocco', 'Vellum', 'Boards', 'Paperback', 'Dust jacket',
                  'Slipcased', 'Parchment', 'Paper', 'Other'],
    emojis:      ['📚','📖','📕','📗','📘','📙','📜','✒️','🖋️','🗞️','🗺️','🔖','⭐','🏛️','🕯️','🧿'],
    conditionLabels: {
      Excellent: 'Fine',
      Good:      'Near Fine',
      Fair:      'Very Good',
      Poor:      'Good — worn',
      Critical:  'Poor',
    },
    statusLabels: {
      'On Display':    'On Display',
      'Storage':       'Shelved',
      'Restoration':   'With Binder',
      'Deaccessioned': 'Sold / Gifted',
    },
  },

  customFields: [
    { key: 'books.isbn', label: 'ISBN', type: 'text', placeholder: 'e.g. 978-0261102217' },
    { key: 'books.edition_statement', label: 'Edition Statement', type: 'text',
      placeholder: 'As printed on the copyright page' },
    { key: 'books.binding', label: 'Binding', type: 'select',
      options: ['Hardcover', 'Paperback', 'Leather', 'Half-leather', 'Vellum',
                'Boards', 'Spiral', 'Loose sheets', 'Other'] },
    { key: 'books.dust_jacket', label: 'Dust Jacket', type: 'select',
      options: ['Present — original', 'Present — price-clipped', 'Facsimile',
                'Absent', 'Not issued'] },
    { key: 'books.signed', label: 'Signed', type: 'boolean' },
  ],

  listColumns: [
    { field: 'artist', label: 'Author' },
    { field: 'production_date', label: 'Published' },
    { field: 'rarity', label: 'Edition' },
  ],

  breakdowns: [
    { field: 'artist', title: 'By Author / Publisher' },
    { field: 'object_type', title: 'By Type' },
  ],
}
