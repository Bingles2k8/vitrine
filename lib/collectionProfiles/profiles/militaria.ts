import type { CollectionProfile } from '../types'
import { proofScale, rawScale } from '../scales'

export const militaria: CollectionProfile = {
  id: 'militaria',
  label: 'Militaria & Arms',
  blurb: 'Uniforms, medals, edged weapons, deactivated arms',
  emoji: '🎖️',
  category: 'Militaria & Arms',

  nouns: { item: 'Item', itemPlural: 'Items', collection: 'Collection', addItem: 'Add Item' },

  fields: {
    title:            { label: 'Item', placeholder: 'e.g. 1907 Pattern Bayonet' },
    artist:           { label: 'Maker / Regiment', placeholder: 'e.g. Wilkinson — Royal Fusiliers' },
    production_date:  { label: 'Date', placeholder: 'e.g. 1916' },
    culture:          { label: 'Country / Service', placeholder: 'e.g. British Army' },
    object_type:      { label: 'Type', placeholder: 'e.g. Edged Weapon, Medal…' },
    medium:           { label: 'Materials', placeholder: 'e.g. Steel, brass, wool serge' },
    rarity:           { label: 'Pattern / Mark', placeholder: 'e.g. Mk III, P/1907' },
    inscription:      { label: 'Marks & Stampings', placeholder: 'Proof marks, unit stamps, inspection marks…' },
    current_location: { label: 'Stored In', placeholder: 'e.g. Secure cabinet 1' },
  },

  vocab: {
    objectTypes: ['Medal', 'Campaign Medal', 'Gallantry Award', 'Badge / Insignia',
                  'Uniform', 'Headdress', 'Edged Weapon', 'Bayonet', 'Sword',
                  'Deactivated Firearm', 'Inert Ordnance', 'Equipment', 'Webbing',
                  'Document / Paybook', 'Photograph', 'Flag / Standard', 'Other'],
    mediums:     ['Steel', 'Brass', 'Bronze', 'Silver', 'White metal', 'Leather',
                  'Wool serge', 'Cotton drill', 'Canvas', 'Bakelite', 'Wood', 'Other'],
    emojis:      ['🎖️','🏅','🗡️','⚔️','🛡️','🪖','🎗️','🏵️','📯','🧭','⭐','🇬🇧','📜','🔱','⚓','🧿'],
    conditionLabels: {
      Excellent: 'Excellent',
      Good:      'Very Good',
      Fair:      'Good — service wear',
      Poor:      'Poor',
      Critical:  'Relic condition',
    },
    statusLabels: {
      'On Display':    'On Display',
      'Storage':       'In Secure Storage',
      'Restoration':   'Being Conserved',
      'Deaccessioned': 'Sold / Transferred',
    },
  },

  certification: {
    // Not a quality opinion — a legal-compliance record. For UK and EU
    // collectors the deactivation certificate is the single most important
    // document attached to a firearm, and there is nowhere else to put it.
    title: 'Proof & Certification',
    labels: { authority: 'Issuing Body', number: 'Certificate Reference', grade: 'Status', date: 'Issued' },
    derivesCondition: false,
    authorities: [
      { id: 'LONDON-PROOF', label: 'London Proof House', scale: 'proof' },
      { id: 'BIRMINGHAM-PROOF', label: 'Birmingham Proof House', scale: 'proof' },
      { id: 'EU-PROOF', label: 'Other EU proof house', scale: 'proof' },
      { id: 'RFD', label: 'Registered firearms dealer', scale: 'proof' },
      { id: 'NONE', label: 'Not certified / not applicable', scale: 'raw' },
    ],
    scales: [proofScale, rawScale],
  },

  customFields: [
    { key: 'militaria.pattern_mark', label: 'Pattern / Mark', type: 'text',
      placeholder: 'e.g. Mk III' },
    { key: 'militaria.proof_marks', label: 'Proof Marks', type: 'text',
      placeholder: 'Marks struck on the item' },
    { key: 'militaria.deactivation_cert_ref', label: 'Deactivation Cert Ref', type: 'text',
      help: 'Reference number on the deactivation certificate. Keep the certificate itself with the item.' },
    { key: 'militaria.serial_number', label: 'Serial Number', type: 'text' },
  ],

  listColumns: [
    { field: 'culture', label: 'Country' },
    { field: 'production_date', label: 'Date' },
    { field: 'object_type', label: 'Type' },
  ],

  breakdowns: [
    { field: 'culture', title: 'By Country / Service' },
    { field: 'object_type', title: 'By Type' },
  ],
}
