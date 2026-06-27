// Per-niche config powering the programmatic SEO variants of the insurance
// inventory generator: /tools/insurance-inventory/[niche]

export type Niche = {
  slug: string
  // Display
  label: string        // "Coin", used in singular contexts
  labelPlural: string  // "coins"
  collectionNoun: string // "coin collection"
  h1: string
  intro: string
  // Category options offered in the item form for this niche
  categories: string[]
  // Example placeholders to make the form feel tailored
  examples: { title: string; maker: string; year: string; dimensions: string }
  keywords: string[]
}

export const NICHES: Record<string, Niche> = {
  coins: {
    slug: 'coins',
    label: 'Coin',
    labelPlural: 'coins',
    collectionNoun: 'coin collection',
    h1: 'Coin Collection Insurance Inventory Generator',
    intro:
      'Document your coin collection for insurance in minutes. List each coin with grade, mint year and value, add photos, and download a clean inventory PDF you can hand to your insurer.',
    categories: ['Coin', 'Banknote', 'Medal', 'Token', 'Bullion', 'Coin set', 'Other'],
    examples: { title: '1933 Penny', maker: 'Royal Mint', year: '1933', dimensions: '31mm' },
    keywords: ['coin collection insurance', 'coin inventory template', 'numismatic insurance inventory', 'how to insure a coin collection'],
  },
  comics: {
    slug: 'comics',
    label: 'Comic',
    labelPlural: 'comics',
    collectionNoun: 'comic collection',
    h1: 'Comic Book Insurance Inventory Generator',
    intro:
      'Catalogue your comic collection for insurance in minutes. Record each book with grade, issue and value, add cover photos, and download an insurer-ready inventory PDF.',
    categories: ['Comic book', 'Graphic novel', 'Slabbed/graded', 'Magazine', 'Original art', 'Other'],
    examples: { title: 'Amazing Fantasy #15', maker: 'Marvel Comics', year: '1962', dimensions: 'CGC 4.0' },
    keywords: ['comic book insurance', 'comic inventory template', 'comic collection insurance inventory', 'how to insure comics'],
  },
  vinyl: {
    slug: 'vinyl',
    label: 'Record',
    labelPlural: 'records',
    collectionNoun: 'vinyl collection',
    h1: 'Vinyl Record Insurance Inventory Generator',
    intro:
      'Document your vinyl collection for insurance in minutes. List each record with pressing, condition and value, add photos, and download a clean inventory PDF for your insurer.',
    categories: ['LP', '7" single', '12" single', 'EP', 'Box set', 'Picture disc', 'Other'],
    examples: { title: 'The Beatles – Please Please Me', maker: 'Parlophone', year: '1963', dimensions: 'VG+ / first pressing' },
    keywords: ['vinyl collection insurance', 'record inventory template', 'vinyl insurance inventory', 'how to insure a record collection'],
  },
  watches: {
    slug: 'watches',
    label: 'Watch',
    labelPlural: 'watches',
    collectionNoun: 'watch collection',
    h1: 'Watch Collection Insurance Inventory Generator',
    intro:
      'Document your watch collection for insurance in minutes. Record each watch with reference, serial and value, add photos, and download an insurer-ready inventory PDF.',
    categories: ['Wristwatch', 'Pocket watch', 'Smartwatch', 'Clock', 'Watch parts', 'Other'],
    examples: { title: 'Omega Speedmaster Professional', maker: 'Omega', year: '1969', dimensions: 'Ref. 145.022' },
    keywords: ['watch collection insurance', 'watch inventory template', 'watch insurance inventory', 'how to insure a watch collection'],
  },
  'trading-cards': {
    slug: 'trading-cards',
    label: 'Card',
    labelPlural: 'trading cards',
    collectionNoun: 'card collection',
    h1: 'Trading Card Insurance Inventory Generator',
    intro:
      'Catalogue your trading card collection for insurance in minutes. List each card with grade, set and value, add photos, and download a clean inventory PDF for your insurer.',
    categories: ['Sports card', 'Pokémon / TCG', 'Graded/slabbed', 'Sealed product', 'Other'],
    examples: { title: 'Charizard – Base Set', maker: 'Pokémon / WOTC', year: '1999', dimensions: 'PSA 9' },
    keywords: ['trading card insurance', 'card inventory template', 'sports card insurance inventory', 'how to insure a card collection'],
  },
  stamps: {
    slug: 'stamps',
    label: 'Stamp',
    labelPlural: 'stamps',
    collectionNoun: 'stamp collection',
    h1: 'Stamp Collection Insurance Inventory Generator',
    intro:
      'Document your stamp collection for insurance in minutes. Record each stamp or cover with condition and value, add photos, and download an insurer-ready inventory PDF.',
    categories: ['Stamp', 'First day cover', 'Postal history', 'Block / sheet', 'Album', 'Other'],
    examples: { title: 'Penny Black', maker: 'Great Britain', year: '1840', dimensions: 'Used, four margins' },
    keywords: ['stamp collection insurance', 'stamp inventory template', 'philatelic insurance inventory', 'how to insure a stamp collection'],
  },
  antiques: {
    slug: 'antiques',
    label: 'Item',
    labelPlural: 'antiques',
    collectionNoun: 'antiques collection',
    h1: 'Antiques Insurance Inventory Generator',
    intro:
      'Document your antiques and collectibles for insurance in minutes. List each item with description, condition and value, add photos, and download a clean inventory PDF for your insurer.',
    categories: ['Furniture', 'Ceramics', 'Glass', 'Silver / metalware', 'Art', 'Jewellery', 'Textiles', 'Other'],
    examples: { title: 'Georgian mahogany bureau', maker: 'English', year: 'c. 1780', dimensions: '110 × 90 × 50 cm' },
    keywords: ['antiques insurance', 'antiques inventory template', 'collectibles insurance inventory', 'how to insure antiques'],
  },
}

export const NICHE_SLUGS = Object.keys(NICHES)

export function faqsFor(niche: Niche): { question: string; answer: string }[] {
  const thing = niche.collectionNoun
  return [
    {
      question: 'Is it free to use?',
      answer:
        'Yes, and there is nothing to sign up for. You build your inventory and download the PDF and CSV right here in your browser.',
    },
    {
      question: 'Do you store my data or photos?',
      answer:
        'No. Everything happens on your device — your item details and photos never leave your browser. The PDF is generated locally and the photos are embedded into it on your computer.',
    },
    {
      question: 'What does the inventory include?',
      answer:
        'For each item you can record its name, category, maker or origin, year, condition, size or grade, serial number, how and when you acquired it, purchase price and estimated value, plus photos. The PDF includes a summary, a schedule of values, and your photographs — the documentation insurers ask for.',
    },
    {
      question: 'Will an insurer accept this document?',
      answer:
        'It produces the kind of itemised, photographed, dated inventory insurers recommend for documenting valuable collections and scheduled personal property. Your insurer may still require a professional appraisal for high-value items — this tool documents what you own; it does not set official valuations.',
    },
    {
      question: 'How do I keep it updated as my collection grows?',
      answer:
        'This tool gives you a one-off snapshot. To keep a living record — adding items over time, tracking value, and re-generating insurance documentation whenever you need it — you can import your CSV straight into Vitrine and manage it there.',
    },
  ]
}

// The generic (hobby-agnostic) configuration used at /tools/insurance-inventory
export const GENERIC_NICHE: Niche = {
  slug: '',
  label: 'Item',
  labelPlural: 'items',
  collectionNoun: 'collection',
  h1: 'Collection Insurance Inventory Generator',
  intro:
    'Document any collection for insurance in minutes. List each item with its condition and value, add photos, and download a clean, insurer-ready inventory PDF. It all runs in your browser.',
  categories: ['Coins', 'Comics', 'Vinyl', 'Watches', 'Trading cards', 'Stamps', 'Antiques', 'Art', 'Jewellery', 'Other'],
  examples: { title: 'e.g. 1933 Penny', maker: 'Maker or origin', year: 'Year', dimensions: 'Size / grade' },
  keywords: [
    'collection insurance inventory',
    'collectibles insurance inventory',
    'home inventory for insurance',
    'free collection inventory generator',
    'how to document a collection for insurance',
  ],
}
