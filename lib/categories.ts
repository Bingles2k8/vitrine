export const COLLECTION_CATEGORIES = [
  'Art & Paintings',
  'Books & Manuscripts',
  'Ceramics & Pottery',
  'Clocks & Watches',
  'Coins & Medals',
  'Fashion & Clothing',
  'Furniture',
  'Jewellery',
  'Maps & Prints',
  'Militaria & Arms',
  'Musical Instruments',
  'Natural History',
  'Photography',
  'Records & Music',
  'Scientific Instruments',
  'Silver & Metalwork',
  'Sports & Games',
  'Stamps & Ephemera',
  'Toys & Models',
  'Tribal & Ethnographic',
] as const

export type CollectionCategory = typeof COLLECTION_CATEGORIES[number]
