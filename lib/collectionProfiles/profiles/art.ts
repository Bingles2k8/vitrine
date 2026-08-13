import type { CollectionProfile } from '../types'
import { coaScale, rawScale } from '../scales'

export const art: CollectionProfile = {
  id: 'art',
  label: 'Art & Paintings',
  blurb: 'Paintings, prints, sculpture, works on paper',
  emoji: '🖼️',
  category: 'Art & Paintings',

  nouns: { item: 'Work', itemPlural: 'Works', collection: 'Collection', addItem: 'Add Work' },

  fields: {
    title:            { label: 'Title', placeholder: 'e.g. Untitled (Blue)' },
    artist:           { label: 'Artist', placeholder: 'e.g. Bridget Riley' },
    production_date:  { label: 'Date', placeholder: 'e.g. 1965, c.1920–1930' },
    culture:          { label: 'Culture / School', placeholder: 'e.g. British, Bauhaus' },
    object_type:      { label: 'Medium Type', placeholder: 'e.g. Painting, Screenprint…' },
    medium:           { label: 'Materials', placeholder: 'e.g. oil on canvas, gouache on paper' },
    rarity:           { label: 'Edition', placeholder: 'e.g. 12/50, Artist’s Proof' },
    inscription:      { label: 'Signature & Inscriptions', placeholder: 'Signed, dated, verso inscriptions…' },
    current_location: { label: 'Location', placeholder: 'e.g. Drawing room, north wall' },
  },

  vocab: {
    objectTypes: ['Painting', 'Drawing', 'Watercolour', 'Print', 'Etching', 'Lithograph',
                  'Screenprint', 'Woodcut', 'Engraving', 'Photograph', 'Sculpture',
                  'Bronze', 'Ceramic', 'Collage', 'Mixed Media', 'Textile Art',
                  'Digital / Video', 'Installation', 'Other'],
    emojis:      ['🖼️','🎨','🖌️','🗿','✏️','🖊️','📐','🌅','🌊','🌻','👤','🏛️','⭐','🔷','🌈','🧿'],
    conditionLabels: {
      Excellent: 'Excellent',
      Good:      'Good',
      Fair:      'Fair',
      Poor:      'Poor — needs attention',
      Critical:  'Critical',
    },
    statusLabels: {
      'On Display':    'Hung / On Display',
      'Storage':       'In Storage',
      'Restoration':   'With Conservator',
      'Deaccessioned': 'Sold / Gifted',
    },
  },

  certification: {
    title: 'Authentication',
    labels: { authority: 'Authenticated By', number: 'Certificate Number', grade: 'Status', date: 'Issued' },
    derivesCondition: false,
    authorities: [
      { id: 'ARTIST', label: 'Artist / studio', scale: 'coa' },
      { id: 'ESTATE', label: 'Artist’s estate or foundation', scale: 'coa' },
      { id: 'CATALOGUE', label: 'Catalogue raisonné', scale: 'coa' },
      { id: 'EXPERT', label: 'Independent expert', scale: 'coa' },
      { id: 'GALLERY', label: 'Gallery / dealer', scale: 'coa' },
      { id: 'NONE', label: 'Not authenticated', scale: 'raw' },
    ],
    scales: [coaScale, rawScale],
  },

  customFields: [
    { key: 'art.edition_number', label: 'Edition Number', type: 'text', placeholder: 'e.g. 12/50' },
    { key: 'art.signed_where', label: 'Signed & Where', type: 'text',
      placeholder: 'e.g. Signed lower right in pencil' },
    { key: 'art.framed', label: 'Framed', type: 'boolean' },
  ],

  listColumns: [
    { field: 'artist', label: 'Artist' },
    { field: 'production_date', label: 'Date' },
    { field: 'medium', label: 'Materials' },
  ],

  breakdowns: [
    { field: 'artist', title: 'By Artist' },
    { field: 'object_type', title: 'By Medium' },
  ],
}
