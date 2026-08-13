import type { CollectionProfile } from '../types'
import { expertisingScale, rawScale } from '../scales'

export const stamps: CollectionProfile = {
  id: 'stamps',
  label: 'Stamps & Postal History',
  blurb: 'Philately, covers, postcards, ephemera',
  emoji: '📮',
  category: 'Stamps & Ephemera',

  nouns: { item: 'Stamp', itemPlural: 'Stamps', collection: 'Collection', addItem: 'Add Stamp' },

  fields: {
    title:            { label: 'Stamp / Item', placeholder: 'e.g. Penny Black' },
    artist:           { label: 'Issuing Post / Printer', placeholder: 'e.g. Royal Mail — Perkins Bacon' },
    production_date:  { label: 'Year of Issue', placeholder: 'e.g. 1840' },
    culture:          { label: 'Country of Issue', placeholder: 'e.g. Great Britain' },
    object_type:      { label: 'Type', placeholder: 'e.g. Definitive, Cover…' },
    medium:           { label: 'Printing Method', placeholder: 'e.g. Line-engraved, Photogravure' },
    rarity:           { label: 'Rarity', placeholder: 'e.g. Scarce, 68 recorded' },
    number_of_parts:  { label: 'Items in Lot' },
    inscription:      { label: 'Postmarks & Overprints', placeholder: 'Cancellations, overprints, cachets…' },
    current_location: { label: 'Stored In', placeholder: 'e.g. Album 2, page 14' },
  },

  fieldOrder: ['title', 'artist', 'production_date', 'culture', 'object_type', 'medium',
               'rarity', 'status', 'description', 'inscription'],

  vocab: {
    objectTypes: ['Definitive', 'Commemorative', 'Airmail', 'Postage Due', 'Official',
                  'Revenue', 'Booklet', 'Miniature Sheet', 'Se-tenant', 'Error / Variety',
                  'First Day Cover', 'Postal Cover', 'Postal Stationery', 'Postcard',
                  'Essay / Proof', 'Other'],
    mediums:     ['Line-engraved', 'Recess', 'Typography', 'Lithography', 'Photogravure',
                  'Offset', 'Embossed', 'Digital', 'Other'],
    emojis:      ['📮','✉️','📯','📫','🌍','👑','🕊️','🚂','✈️','🚢','🏰','🌹','⭐','📜','🗺️','🧿'],
    conditionLabels: {
      Excellent: 'Superb',
      Good:      'Fine',
      Fair:      'Average',
      Poor:      'Faulty',
      Critical:  'Damaged',
    },
    statusLabels: {
      'On Display':    'On Display',
      'Storage':       'In Album',
      'Restoration':   'Away for Expertising',
      'Deaccessioned': 'Sold / Traded',
    },
  },

  certification: {
    title: 'Expertising & Certification',
    labels: { authority: 'Expertising Body', number: 'Certificate Number', grade: 'Opinion', date: 'Certified' },
    derivesCondition: false,
    authorities: [
      { id: 'PSE', label: 'PSE (Professional Stamp Experts)', scale: 'expertising' },
      { id: 'PF', label: 'Philatelic Foundation', scale: 'expertising' },
      { id: 'BPA', label: 'British Philatelic Association', scale: 'expertising' },
      { id: 'RPS', label: 'Royal Philatelic Society London', scale: 'expertising' },
      { id: 'APEX', label: 'APEX (American Philatelic Society)', scale: 'expertising' },
      { id: 'NONE', label: 'Not expertised', scale: 'raw' },
    ],
    scales: [expertisingScale, rawScale],
  },

  customFields: [
    { key: 'stamps.catalogue_number', label: 'Catalogue Number', type: 'text',
      placeholder: 'e.g. SG 1, Scott 1', help: 'Stanley Gibbons, Scott, Michel or Yvert reference.' },
    { key: 'stamps.perforation', label: 'Perforation', type: 'text', placeholder: 'e.g. 14 x 15, Imperf' },
    { key: 'stamps.watermark', label: 'Watermark', type: 'text', placeholder: 'e.g. Small Crown' },
    { key: 'stamps.gum_condition', label: 'Gum', type: 'select',
      options: ['Never hinged', 'Lightly hinged', 'Hinged', 'Part original gum',
                'No gum', 'Regummed', 'Not applicable'] },
    { key: 'stamps.mint_or_used', label: 'Mint or Used', type: 'select',
      options: ['Mint', 'Used', 'On cover', 'Cancelled to order'] },
  ],

  listColumns: [
    { field: 'culture', label: 'Country' },
    { field: 'production_date', label: 'Issued' },
    { field: 'custom:stamps.catalogue_number', label: 'Catalogue' },
  ],

  breakdowns: [
    { field: 'culture', title: 'By Country' },
    { field: 'object_type', title: 'By Type' },
    { field: 'custom:stamps.mint_or_used', title: 'Mint vs Used' },
  ],
}
