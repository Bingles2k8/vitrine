import type { CollectionProfile } from '../types'

export const wineSpirits: CollectionProfile = {
  id: 'wine-spirits',
  label: 'Wine & Spirits',
  blurb: 'Cellar records, whisky, vintages',
  emoji: '🍷',
  category: 'Wine & Spirits',

  nouns: { item: 'Bottle', itemPlural: 'Bottles', collection: 'Cellar', addItem: 'Add Bottle' },

  fields: {
    title:            { label: 'Wine / Bottle', placeholder: 'e.g. Château Margaux' },
    artist:           { label: 'Producer / Vineyard', placeholder: 'e.g. Domaine de la Romanée-Conti' },
    production_date:  { label: 'Vintage', placeholder: 'e.g. 2015, NV' },
    culture:          { label: 'Region / Appellation', placeholder: 'e.g. Bordeaux, Rioja, Islay' },
    object_type:      { label: 'Style', placeholder: 'e.g. Red, Single Malt…' },
    medium:           { label: 'Grape / Mash Bill', placeholder: 'e.g. Cabernet Sauvignon, 100% barley' },
    rarity:           { label: 'Bottle No. / Release', placeholder: 'e.g. 214 of 500, Cask 1147' },
    number_of_parts:  { hidden: true },
    dimension_height: { hidden: true },
    dimension_width:  { hidden: true },
    dimension_depth:  { hidden: true },
    dimension_weight: { hidden: true },
    inscription:      { label: 'Label & Capsule Notes', placeholder: 'Label condition, fill level, capsule…' },
    current_location: { label: 'Stored In', placeholder: 'e.g. Cellar rack B, row 4' },
  },

  fieldOrder: ['title', 'artist', 'production_date', 'culture', 'object_type', 'medium',
               'rarity', 'status', 'description', 'inscription'],

  vocab: {
    objectTypes: ['Red', 'White', 'Rosé', 'Orange', 'Sparkling', 'Champagne', 'Dessert',
                  'Fortified', 'Port', 'Sherry', 'Madeira', 'Single Malt', 'Blended Whisky',
                  'Bourbon', 'Rye', 'Irish Whiskey', 'Japanese Whisky', 'Rum', 'Gin',
                  'Vodka', 'Cognac', 'Armagnac', 'Tequila / Mezcal', 'Vermouth',
                  'Liqueur', 'Other'],
    mediums:     ['Cabernet Sauvignon', 'Merlot', 'Pinot Noir', 'Syrah / Shiraz', 'Grenache',
                  'Nebbiolo', 'Sangiovese', 'Tempranillo', 'Malbec', 'Zinfandel',
                  'Chardonnay', 'Sauvignon Blanc', 'Riesling', 'Chenin Blanc', 'Viognier',
                  'Pinot Grigio', 'Sémillon', 'Field blend', 'Malted barley', 'Corn mash',
                  'Rye mash', 'Sugarcane', 'Agave', 'Other'],
    cultures:    ['Bordeaux', 'Burgundy', 'Champagne', 'Rhône', 'Loire', 'Alsace',
                  'Tuscany', 'Piedmont', 'Veneto', 'Rioja', 'Ribera del Duero', 'Douro',
                  'Mosel', 'Rheingau', 'Napa Valley', 'Sonoma', 'Willamette', 'Barossa',
                  'Margaret River', 'Marlborough', 'Central Otago', 'Stellenbosch',
                  'Mendoza', 'Maipo', 'Speyside', 'Islay', 'Highland', 'Lowland',
                  'Campbeltown', 'Islands', 'Kentucky', 'Tennessee', 'Cognac', 'Jerez',
                  'Other'],
    emojis:      ['🍷','🥃','🍾','🍸','🍶','🥂','🍹','🍇','🛢️','🌾','🏺','⭐','👑','🔥','🧊','🧿'],
    conditionLabels: {
      Excellent: 'Pristine',
      Good:      'Good',
      Fair:      'Signs of Age',
      Poor:      'Poor',
      Critical:  'Compromised',
    },
    statusLabels: {
      'On Display':    'On Display',
      'Storage':       'In Cellar',
      'On Loan':       'Lent Out',
      'Restoration':   'Away',
      'Deaccessioned': 'Drunk / Sold',
    },
  },

  // No `certification` — wine has no grading authority. The card simply
  // doesn't render for this profile.

  customFields: [
    { key: 'wine-spirits.abv', label: 'ABV', type: 'number', unit: '%', min: 0, max: 100 },
    { key: 'wine-spirits.bottle_size_ml', label: 'Bottle Size', type: 'number', unit: 'ml',
      placeholder: '750', min: 1 },
    { key: 'wine-spirits.cask_number', label: 'Cask / Barrel No.', type: 'text' },
    { key: 'wine-spirits.bottles_held', label: 'Bottles Held', type: 'number', min: 1,
      help: 'Use for a case or several identical bottles logged as one record.' },
  ],

  listColumns: [
    { field: 'artist', label: 'Producer' },
    { field: 'production_date', label: 'Vintage' },
    { field: 'culture', label: 'Region' },
  ],

  breakdowns: [
    { field: 'culture', title: 'By Region' },
    { field: 'object_type', title: 'By Style' },
    { field: 'production_date', title: 'By Vintage' },
  ],
}
