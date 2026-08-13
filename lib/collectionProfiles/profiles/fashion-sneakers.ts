import type { CollectionProfile } from '../types'
import { authenticationScale, rawScale } from '../scales'

export const fashionSneakers: CollectionProfile = {
  id: 'fashion-sneakers',
  label: 'Fashion, Sneakers & Streetwear',
  blurb: 'Trainers, vintage clothing, handbags, textiles',
  emoji: '👟',
  category: 'Sneakers & Streetwear',

  nouns: { item: 'Piece', itemPlural: 'Pieces', collection: 'Wardrobe', addItem: 'Add Piece' },

  fields: {
    title:            { label: 'Name', placeholder: 'e.g. Air Jordan 1 Chicago' },
    artist:           { label: 'Brand / Designer', placeholder: 'e.g. Nike, Vivienne Westwood' },
    production_date:  { label: 'Season / Year', placeholder: 'e.g. SS85, 1985' },
    culture:          { label: 'Country of Manufacture', placeholder: 'e.g. Made in Italy' },
    object_type:      { label: 'Type', placeholder: 'e.g. Sneakers, Jacket…' },
    medium:           { label: 'Materials', placeholder: 'e.g. Leather, cotton twill' },
    rarity:           { label: 'Colourway', placeholder: 'e.g. Bred, Chicago' },
    production_date_qualifier: { hidden: true },
    inscription:      { label: 'Labels & Tags', placeholder: 'Care labels, size tags, hologram stickers…' },
    current_location: { label: 'Stored In', placeholder: 'e.g. Rack 2, box 14' },
  },

  vocab: {
    objectTypes: ['Sneakers', 'Boots', 'Shoes', 'T-shirt', 'Hoodie', 'Jacket', 'Coat',
                  'Dress', 'Trousers', 'Denim', 'Knitwear', 'Handbag', 'Wallet',
                  'Belt', 'Hat / Cap', 'Scarf', 'Sunglasses', 'Other'],
    mediums:     ['Leather', 'Suede', 'Patent leather', 'Nubuck', 'Canvas', 'Cotton',
                  'Denim', 'Wool', 'Cashmere', 'Silk', 'Linen', 'Nylon', 'Polyester',
                  'Gore-Tex', 'Mesh', 'Primeknit / Flyknit', 'Other'],
    emojis:      ['👟','👞','👢','👜','🧥','👕','👗','🧢','🕶️','👖','🧣','🥾','⭐','💼','🔥','🧿'],
    conditionLabels: {
      Excellent: 'Deadstock',
      Good:      'Very Near Deadstock',
      Fair:      'Lightly Worn',
      Poor:      'Well Worn',
      Critical:  'Beaters',
    },
    statusLabels: {
      'On Display':    'On Display',
      'Storage':       'Boxed Away',
      'Restoration':   'Being Cleaned',
      'Deaccessioned': 'Sold / Traded',
    },
  },

  certification: {
    title: 'Authentication',
    labels: { authority: 'Verified By', number: 'Verification ID', grade: 'Result', date: 'Verified' },
    derivesCondition: false,
    authorities: [
      { id: 'STOCKX', label: 'StockX', scale: 'authentication' },
      { id: 'GOAT', label: 'GOAT', scale: 'authentication' },
      { id: 'CHECKCHECK', label: 'CheckCheck', scale: 'authentication' },
      { id: 'ENTRUPY', label: 'Entrupy', scale: 'authentication' },
      { id: 'BRAND', label: 'Brand / boutique', scale: 'authentication' },
      { id: 'NONE', label: 'Not verified', scale: 'raw' },
    ],
    scales: [authenticationScale, rawScale],
  },

  customFields: [
    { key: 'fashion-sneakers.size', label: 'Size', type: 'text', placeholder: 'e.g. UK 9, IT 42' },
    { key: 'fashion-sneakers.style_code', label: 'Style Code / SKU', type: 'text',
      placeholder: 'e.g. 555088-101' },
    { key: 'fashion-sneakers.colourway', label: 'Colourway', type: 'text',
      placeholder: 'e.g. White/Black-Varsity Red' },
    { key: 'fashion-sneakers.wear_grade', label: 'Wear Grade', type: 'select',
      options: ['DS (Deadstock)', 'VNDS (Very Near Deadstock)', 'Lightly worn',
                'Worn', 'Beaters'] },
  ],

  listColumns: [
    { field: 'artist', label: 'Brand' },
    { field: 'custom:fashion-sneakers.size', label: 'Size' },
    { field: 'production_date', label: 'Season' },
  ],

  breakdowns: [
    { field: 'artist', title: 'By Brand' },
    { field: 'object_type', title: 'By Type' },
    { field: 'custom:fashion-sneakers.wear_grade', title: 'By Wear Grade' },
  ],
}
