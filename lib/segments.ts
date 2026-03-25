export type MockItem = {
  name: string
  badge: string      // grade, condition, year, etc.
  value: string
  tag?: string       // "Key date", "Graded", "Sealed", etc.
  selected?: boolean
}

export type MockDetail = {
  heading: string
  fields: { label: string; value: string }[]
}

export type Segment = {
  slug: string
  name: string
  metaTitle: string
  metaDescription: string
  keywords: string[]
  h1: string
  items: string
  collectorNoun: string
  answerCapsule: string
  schemaDescription: string
  painPoints: { heading: string; body: string }[]
  features: { name: string; description: string }[]
  steps: { heading: string; body: string }[]
  competitors: { name: string; weakness: string }[]
  faqs: { question: string; answer: string }[]
  mockListItems: MockItem[]
  mockDetail: MockDetail
}

export const segments: Segment[] = [
  {
    slug: 'trading-card-collection-app',
    name: 'Trading Card Collection App',
    metaTitle: 'Trading Card Collection App – Catalog & Track Your Cards',
    metaDescription:
      'The best app for managing a trading card collection. Track sports cards, Pokémon cards, and graded slabs. Record PSA, BGS, and CGC grades. Free to start.',
    keywords: [
      'trading card collection app',
      'sports card collection app',
      'pokemon card collection app',
      'best app to track card collection',
      'trading card inventory software',
    ],
    h1: 'Trading Card Collection App',
    items: 'trading cards',
    collectorNoun: 'card collector',
    answerCapsule:
      'Vitrine is a trading card collection app that lets collectors catalog sports cards, Pokémon cards, and graded slabs in one place. Record PSA, BGS, and CGC grades, track card values, and build a public showcase. Free to start, with paid plans from £5/month.',
    schemaDescription:
      'Vitrine for card collectors. Catalog sports cards, Pokémon cards, and graded slabs. Track PSA, BGS, and CGC grades, set values, and share your collection publicly.',
    painPoints: [
      {
        heading: 'Graded and raw cards in the same collection',
        body: 'Most apps treat all cards the same. Vitrine lets you record grading company, grade, cert number, and slab condition separately from raw cards, so your inventory reflects what you actually own.',
      },
      {
        heading: 'Spreadsheets stop working past a few hundred cards',
        body: 'Searching, filtering by set, and tracking values in a spreadsheet gets painful fast. Vitrine handles collections of any size with proper search, filtering by set or grade, and a running value total.',
      },
      {
        heading: 'No way to show off your collection',
        body: "There is no good way to share a spreadsheet with other collectors. Vitrine gives every account a public collection page where you control exactly which cards are visible.",
      },
    ],
    features: [
      {
        name: 'Condition and grading notes',
        description: 'Record grading company, grade, and cert number in the condition and notes fields. Works for PSA, BGS, CGC, and raw cards alike.',
      },
      {
        name: 'Set and series tracking',
        description: 'Organise cards by set, series, and year using the category and description fields. Filter your collection by any field in seconds.',
      },
      {
        name: 'Value tracking',
        description: 'Record purchase price and current estimated value per card. See your total collection value at a glance.',
      },
      {
        name: 'Bulk CSV import',
        description: 'Already have a spreadsheet? Import it directly on Professional plans. Vitrine maps your columns and flags anything that needs review.',
      },
      {
        name: 'Public collection page',
        description: 'Share a link to your collection with other collectors. You decide which cards are visible.',
      },
      {
        name: 'Photo storage',
        description: 'Attach front and back images to every card. Useful for insurance and for spotting condition issues later.',
      },
    ],
    steps: [
      {
        heading: 'Create a free account',
        body: 'Sign up at vitrinecms.com. No credit card required. Your collection is private by default.',
      },
      {
        heading: 'Add your first cards',
        body: 'Enter cards one by one. On Professional plans you can also import a CSV from your existing spreadsheet. Set, year, player, condition, and value fields are all available from the start.',
      },
      {
        heading: 'Record grades and values',
        body: 'Use the condition and notes fields to record grading company, grade, and cert number for slabs. For raw cards, record condition grade and estimated value.',
      },
      {
        heading: 'Build your public page',
        body: 'Choose which cards to make public and share the link. Your collection page updates automatically as you add cards.',
      },
    ],
    competitors: [
      {
        name: 'PSA Set Registry',
        weakness: 'Only tracks PSA-graded cards. No support for raw cards, BGS, CGC, or other grading companies.',
      },
      {
        name: 'Beckett',
        weakness: 'Primarily a price guide and marketplace. The collection manager is a secondary feature with limited custom fields.',
      },
      {
        name: 'CLZ Sports Cards',
        weakness: 'Desktop software that requires a local install. No public collection page. Interface has not changed significantly in years.',
      },
    ],
    faqs: [
      {
        question: 'Can I use Vitrine to catalog my Pokémon card collection?',
        answer:
          'Yes. Vitrine works for any trading card — Pokémon, sports cards, Magic: The Gathering, Yu-Gi-Oh, and others. You can organise by set, record condition and value, and share your collection publicly.',
      },
      {
        question: 'How do I track graded cards alongside raw cards?',
        answer:
          'Vitrine has separate fields for grading company (PSA, BGS, CGC, SGC), grade, and cert number. These fields sit alongside the standard card fields, so graded and raw cards coexist in the same collection.',
      },
      {
        question: 'Can I import my spreadsheet into Vitrine?',
        answer:
          'Yes. Export your spreadsheet as CSV and import it into Vitrine. The importer maps your columns to Vitrine fields. You can review and correct any rows before the import commits.',
      },
      {
        question: "I'm collecting, not selling. Does Vitrine still work for me?",
        answer:
          "Yes. Vitrine is built for collectors, not sellers. There's no marketplace or listing feature. The focus is on cataloguing, tracking value, and showcasing what you own.",
      },
      {
        question: 'How do I value my card collection in Vitrine?',
        answer:
          'Add an estimated value to each card when you catalogue it. Vitrine totals these up so you can see your collection value at a glance. You can update values whenever prices change.',
      },
    ],
    mockListItems: [
      { name: '1986 Fleer Michael Jordan #57', badge: 'PSA 9', value: '£3,200', tag: 'Graded', selected: true },
      { name: '2003 Topps Chrome LeBron James RC', badge: 'BGS 9.5', value: '£1,850', tag: 'Graded' },
      { name: '1952 Topps Mickey Mantle #311', badge: 'SGC 4', value: '£12,400', tag: 'Key' },
      { name: '1989 Upper Deck Ken Griffey Jr. RC', badge: 'Raw · NM', value: '£95' },
      { name: '2000 Pokémon Base Set Charizard #4', badge: 'CGC 8', value: '£620', tag: 'Graded' },
    ],
    mockDetail: {
      heading: '1986 Fleer Michael Jordan #57',
      fields: [
        { label: 'Set', value: '1986–87 Fleer Basketball' },
        { label: 'Grade', value: 'PSA 9 — Mint' },
        { label: 'Cert no.', value: '12345678' },
        { label: 'Player', value: 'Michael Jordan' },
        { label: 'Year', value: '1986' },
        { label: 'Purchase price', value: '£1,200' },
        { label: 'Est. value', value: '£3,200' },
        { label: 'Notes', value: 'Centring 60/40. No print lines.' },
      ],
    },
  },

  {
    slug: 'coin-collection-app',
    name: 'Coin Collection App',
    metaTitle: 'Coin Collection App – Catalog & Track Your Coins',
    metaDescription:
      'The best app for coin collectors. Record denomination, mint, year, PCGS and NGC grades, and value. Track your numismatic collection online. Free to start.',
    keywords: [
      'coin collection app',
      'best coin collection software',
      'coin inventory app',
      'coin collection management app',
      'numismatic collection software',
    ],
    h1: 'Coin Collection App',
    items: 'coins',
    collectorNoun: 'coin collector',
    answerCapsule:
      'Vitrine is a coin collection app for numismatists and hobbyist collectors. Catalog coins by denomination, mint, year, and grade. Record PCGS and NGC grades, track value, and build a public showcase. Plans start free.',
    schemaDescription:
      'Vitrine for coin collectors. Catalog coins by denomination, mint, year, and grade. Record PCGS and NGC grades, track collection value, and share your numismatic collection publicly.',
    painPoints: [
      {
        heading: 'CoinManage and similar tools are stuck on Windows',
        body: 'The most popular coin software requires a Windows desktop install and looks like it was built in 2003. Vitrine is web-based and works in any browser, on any device.',
      },
      {
        heading: 'No room for variety and variety notes',
        body: "Numismatics has hundreds of die varieties, doubled dies, and mint errors. Generic inventory apps don't have fields for these. Vitrine lets you record variety details and notes for any coin.",
      },
      {
        heading: 'Nothing to show other collectors',
        body: 'Sharing your collection with fellow numismatists usually means exporting a spreadsheet and emailing it. Vitrine gives you a public collection page that others can browse.',
      },
    ],
    features: [
      {
        name: 'Numismatic fields',
        description: 'Record denomination, country, mint, year, mint mark, composition, diameter, and weight for every coin.',
      },
      {
        name: 'Grading and condition notes',
        description: 'Record grading company, grade, and cert number in the condition and notes fields. Works for PCGS, NGC, and raw coin grades alike.',
      },
      {
        name: 'Variety and error notes',
        description: 'Document die varieties, doubled dies, repunched mint marks, and other varieties in free-text notes.',
      },
      {
        name: 'Condition reports',
        description: 'Record luster, strike, surface quality, and eye appeal. Useful for raw coins where a full description matters.',
      },
      {
        name: 'Value tracking',
        description: 'Log purchase price and current estimated value. See your total collection value across all coins.',
      },
      {
        name: 'Public showcase',
        description: 'Share a link to your collection. Control which coins are visible to the public.',
      },
    ],
    steps: [
      {
        heading: 'Create your account',
        body: 'Sign up free at vitrinecms.com. Start adding coins immediately — no setup required.',
      },
      {
        heading: 'Add coins to your collection',
        body: 'Enter denomination, country, mint, year, and mint mark. Add photos of obverse and reverse. Record grade and cert number if the coin is certified.',
      },
      {
        heading: 'Document variety and condition',
        body: 'Use the notes field to record die varieties, errors, and condition details. These are searchable later.',
      },
      {
        heading: 'Track values',
        body: 'Enter a purchase price and current estimated value for each coin. Vitrine totals them up into a collection value figure.',
      },
    ],
    competitors: [
      {
        name: 'CoinManage',
        weakness: 'Windows desktop software only. No web access, no public collection page. Interface has changed little since the early 2000s.',
      },
      {
        name: 'PCGS Set Registry',
        weakness: 'Only tracks PCGS-certified coins in official PCGS sets. Raw coins and non-PCGS certified coins cannot be catalogued.',
      },
      {
        name: 'Spreadsheets',
        weakness: 'No image support, no structured grading fields, no value totals, no way to share with other collectors.',
      },
    ],
    faqs: [
      {
        question: 'Can I catalog world coins, not just US coins?',
        answer:
          'Yes. Vitrine has no restriction on coin type or country. You can catalog US coins, world coins, ancient coins, and error coins in the same collection.',
      },
      {
        question: 'How do I record PCGS and NGC grades?',
        answer:
          'Use the condition grade and notes fields. Enter the grading company (PCGS, NGC, or other), the grade (e.g. MS65), and cert number in the notes. The condition grade field records the overall state (Excellent, Good, Fair, Poor) for quick filtering.',
      },
      {
        question: 'How do I value my coin collection?',
        answer:
          'Enter an estimated value for each coin as you catalog it. Vitrine sums these up to show your total collection value. Update individual values as the market changes.',
      },
      {
        question: 'Can I import my existing coin inventory spreadsheet?',
        answer:
          'Yes. Export your spreadsheet as CSV and use the Vitrine importer. You map your columns to Vitrine fields and review any rows that need attention before confirming.',
      },
      {
        question: 'Does Vitrine support mint error coins?',
        answer:
          'Yes. Use the variety and notes fields to document mint errors — off-center strikes, die caps, clipped planchets, and others. There is no limit on the detail you can record.',
      },
    ],
    mockListItems: [
      { name: '1921-D Morgan Dollar', badge: 'MS64 · PCGS', value: '£145', selected: true },
      { name: '1909-S VDB Lincoln Cent', badge: 'F12 · Raw', value: '£680', tag: 'Key date' },
      { name: '1916-D Mercury Dime', badge: 'VF30 · NGC', value: '£1,900', tag: 'Key date' },
      { name: '1955 Doubled Die Lincoln Cent', badge: 'EF40 · Raw', value: '£1,200', tag: 'Error' },
      { name: '1964 Kennedy Half Dollar', badge: 'MS65 · Raw', value: '£18' },
    ],
    mockDetail: {
      heading: '1921-D Morgan Dollar',
      fields: [
        { label: 'Denomination', value: 'Dollar' },
        { label: 'Country', value: 'United States' },
        { label: 'Mint', value: 'Denver (D)' },
        { label: 'Year', value: '1921' },
        { label: 'Grade', value: 'MS64' },
        { label: 'Grading co.', value: 'PCGS' },
        { label: 'Purchase price', value: '£88' },
        { label: 'Est. value', value: '£145' },
      ],
    },
  },

  {
    slug: 'vinyl-record-collection-app',
    name: 'Vinyl Record Collection App',
    metaTitle: 'Vinyl Record Collection App – Catalog & Track Your Records',
    metaDescription:
      'Catalog your vinyl record collection online. Record label, pressing, matrix, and condition. Track value and share your collection. Free to start.',
    keywords: [
      'vinyl record collection app',
      'record collection software',
      'vinyl collection tracker',
      'discogs alternative',
      'vinyl collection management',
    ],
    h1: 'Vinyl Record Collection App',
    items: 'records',
    collectorNoun: 'record collector',
    answerCapsule:
      'Vitrine is a vinyl record collection app that lets collectors catalog pressings by label, country, and matrix. Record condition grades, track values, and share your collection publicly. A dedicated collection manager, not a marketplace.',
    schemaDescription:
      'Vitrine for vinyl record collectors. Catalog records by label, pressing, and matrix. Record condition grades, track collection value, and share your vinyl collection publicly.',
    painPoints: [
      {
        heading: 'Discogs is a marketplace, not a collection manager',
        body: "Discogs is excellent for buying and selling. But its collection feature is secondary — limited custom fields, no condition notes beyond a basic grade, and your data exists to serve the marketplace, not you.",
      },
      {
        heading: 'CLZ Music requires a desktop install',
        body: 'CLZ Music is a capable app, but it runs on Windows or Mac as a local install. You cannot access your collection from another device without syncing.',
      },
      {
        heading: 'No public-facing showcase',
        body: "Most record collectors want to show their collection to others. Vitrine gives you a public page that people can browse without needing an account.",
      },
    ],
    features: [
      {
        name: 'Pressing details',
        description: 'Record label, catalogue number, country, pressing year, and matrix information for every record.',
      },
      {
        name: 'Condition grading',
        description: 'Record condition grade (Excellent, Good, Fair, Poor) and add detailed notes on the media and sleeve separately in the notes field.',
      },
      {
        name: 'Value tracking',
        description: 'Log what you paid and current estimated value. See your total collection value in one place.',
      },
      {
        name: 'Custom notes',
        description: 'Document pressing variations, deadwax etchings, stamper codes, and anything else that matters to you.',
      },
      {
        name: 'Public collection page',
        description: 'Share a link to your collection. Choose which records are visible.',
      },
      {
        name: 'Photo storage',
        description: 'Attach label and sleeve scans to any record. Useful for documenting rare pressings.',
      },
    ],
    steps: [
      {
        heading: 'Create your account',
        body: 'Sign up free. Your collection is private by default. No connection to any marketplace.',
      },
      {
        heading: 'Add your records',
        body: 'Enter artist, title, label, catalogue number, country, and year. Add photos of the label and sleeve.',
      },
      {
        heading: 'Record condition and pressing details',
        body: 'Set a condition grade for the record. Use the notes field to document media and sleeve condition separately, deadwax etchings, and any pressing quirks.',
      },
      {
        heading: 'Track value and share',
        body: 'Enter purchase price and current estimated value. When ready, make your collection public and share the link.',
      },
    ],
    competitors: [
      {
        name: 'Discogs',
        weakness: 'A marketplace first. Collection features are limited and exist to support buying and selling, not archival cataloguing.',
      },
      {
        name: 'CLZ Music',
        weakness: 'Desktop-only software requiring a local install. No public collection page. Requires a paid subscription.',
      },
      {
        name: 'Spreadsheets',
        weakness: 'No image support, no condition grading fields, no way to share, no value totals.',
      },
    ],
    faqs: [
      {
        question: 'How is Vitrine different from Discogs?',
        answer:
          "Discogs is a marketplace and database. Its collection feature is a secondary tool built around buying and selling. Vitrine is a dedicated collection manager with no marketplace. Your data is yours and serves you, not a platform.",
      },
      {
        question: 'Can I record deadwax etchings and pressing details?',
        answer:
          'Yes. Vitrine has a notes field for every record where you can document matrix information, deadwax etchings, stamper codes, and any other pressing details.',
      },
      {
        question: 'How do I record condition for my records?',
        answer:
          'Each record has a condition grade field (Excellent, Good, Fair, Poor) for quick filtering. Use the notes field to record more granular detail — media and sleeve condition, pressing quirks, deadwax etchings — in whatever format you prefer.',
      },
      {
        question: 'Can I track how much my collection is worth?',
        answer:
          'Yes. Enter a current estimated value for each record. Vitrine totals these up and shows your collection value. Update values whenever you want.',
      },
      {
        question: 'Can I import records I already have listed in Discogs?',
        answer:
          'Discogs lets you export your collection as CSV. You can import that file into Vitrine. Some field mapping will be required during the import step.',
      },
    ],
    mockListItems: [
      { name: 'Pink Floyd – The Dark Side of the Moon', badge: 'UK 1st · NM/VG+', value: '£95', selected: true },
      { name: 'Led Zeppelin – Led Zeppelin IV', badge: 'UK 1st · VG+/VG', value: '£65' },
      { name: 'Miles Davis – Kind of Blue', badge: 'US 1st · VG/VG', value: '£180', tag: 'Original' },
      { name: 'The Beatles – Abbey Road', badge: 'UK 1st · NM/NM', value: '£140' },
      { name: 'David Bowie – The Rise and Fall of Ziggy Stardust', badge: 'UK 1st · VG+/VG+', value: '£85' },
    ],
    mockDetail: {
      heading: 'The Dark Side of the Moon',
      fields: [
        { label: 'Artist', value: 'Pink Floyd' },
        { label: 'Label', value: 'Harvest SHVL 804' },
        { label: 'Country', value: 'UK' },
        { label: 'Year', value: '1973 (1st pressing)' },
        { label: 'Matrix', value: 'SHDP 4001 A-2 / B-2' },
        { label: 'Media grade', value: 'Near Mint (NM)' },
        { label: 'Sleeve grade', value: 'Very Good Plus (VG+)' },
        { label: 'Est. value', value: '£95' },
      ],
    },
  },

  {
    slug: 'book-collection-app',
    name: 'Book Collection App',
    metaTitle: 'Book Collection App – Catalog Your Home Library',
    metaDescription:
      'Catalog your book collection online. Track editions, condition, and value. Built for book collectors, not reading trackers. Free to start.',
    keywords: [
      'book collection app',
      'book cataloguing software',
      'home library app',
      'book collection management',
      'rare book catalog software',
    ],
    h1: 'Book Collection App',
    items: 'books',
    collectorNoun: 'book collector',
    answerCapsule:
      'Vitrine is a book collection app that helps collectors catalog editions, record condition and provenance, and track value. Built for people who collect books, not just read them. Covers first editions, rare books, and general home libraries. Free to start.',
    schemaDescription:
      'Vitrine for book collectors. Catalog books by edition, condition, and value. Track first editions, signed copies, and rare books. Share your collection publicly.',
    painPoints: [
      {
        heading: 'Goodreads is for reading, not collecting',
        body: 'Goodreads tracks what you have read and what you want to read. It has no fields for edition, condition, provenance, or value. It was not built for people who collect books as objects.',
      },
      {
        heading: 'LibraryThing has no valuation tools',
        body: 'LibraryThing is good for cataloguing what you own, but it has no value tracking, condition grading, or provenance fields. It cannot help you document a collection for insurance.',
      },
      {
        heading: 'First editions and signed copies need more than a title and author',
        body: "A first edition needs edition number, print run, publisher, binding condition, dust jacket condition, and notes on any signatures or inscriptions. Generic apps don't have these fields.",
      },
    ],
    features: [
      {
        name: 'Edition and publication fields',
        description: 'Record publisher, edition, print run, year, ISBN, binding type, and format for every book.',
      },
      {
        name: 'Condition grading',
        description: 'Grade book and dust jacket condition separately. Use standard grades (Fine, Very Good, Good, Fair, Poor) or write your own condition notes.',
      },
      {
        name: 'Provenance and inscription fields',
        description: 'Document signatures, inscriptions, bookplates, previous owners, and purchase history.',
      },
      {
        name: 'Value tracking',
        description: 'Record purchase price and current estimated value. See your total collection value.',
      },
      {
        name: 'Custom shelves',
        description: 'Organise your collection by any grouping: genre, author, period, or your own categories.',
      },
      {
        name: 'Public collection page',
        description: 'Share your library with other collectors. Control which books are visible.',
      },
    ],
    steps: [
      {
        heading: 'Create your account',
        body: 'Sign up free. Your collection is private until you choose to share it.',
      },
      {
        heading: 'Add your books',
        body: 'Enter title, author, publisher, edition, and year. Add photos of the cover, spine, and any notable pages.',
      },
      {
        heading: 'Record condition and provenance',
        body: 'Grade the book and dust jacket. Note any signatures, inscriptions, bookplates, or ownership history.',
      },
      {
        heading: 'Track value',
        body: 'Enter what you paid and the current estimated value. Vitrine totals these up across your whole collection.',
      },
    ],
    competitors: [
      {
        name: 'Goodreads',
        weakness: 'A reading tracker and social network. No edition fields, no condition grading, no value tracking.',
      },
      {
        name: 'LibraryThing',
        weakness: 'Good for basic cataloguing but no value tracking, no condition grading, and no provenance fields.',
      },
      {
        name: 'Spreadsheets',
        weakness: 'Cannot store images inline, no structured condition fields, no value totals, difficult to share.',
      },
    ],
    faqs: [
      {
        question: 'How is Vitrine different from Goodreads?',
        answer:
          'Goodreads tracks what you read. Vitrine tracks what you own as a physical collection. Vitrine has fields for edition, condition, provenance, and value that Goodreads does not.',
      },
      {
        question: 'Can I catalog first editions and signed copies?',
        answer:
          "Yes. Vitrine has fields for edition number, publisher, binding condition, dust jacket condition, and provenance notes. You can document signatures, inscriptions, and any other details that affect a book's value.",
      },
      {
        question: 'Can I track books I have lent to friends?',
        answer:
          'Yes. Use the notes field to record who has borrowed a book and when. You can filter your collection to show only items currently on loan.',
      },
      {
        question: 'Can I catalog a large home library, not just rare books?',
        answer:
          'Yes. Vitrine works for collections of any size and type. You can mix rare books, general reading copies, and reference books in the same collection, and use shelves to organise them.',
      },
      {
        question: 'Can I import my LibraryThing or Goodreads library?',
        answer:
          'Both LibraryThing and Goodreads support CSV export. You can import that file into Vitrine. Some fields will need mapping during the import step.',
      },
    ],
    mockListItems: [
      { name: 'The Great Gatsby — F. Scott Fitzgerald', badge: '1st Ed · 1925', value: '£4,200', tag: 'First edition', selected: true },
      { name: 'To Kill a Mockingbird — Harper Lee', badge: '1st Ed · 1960', value: '£8,500', tag: 'First edition' },
      { name: 'Harry Potter and the Philosopher\'s Stone', badge: '1st Ed · 1997', value: '£35,000', tag: 'First edition' },
      { name: 'Nineteen Eighty-Four — George Orwell', badge: '1st Ed · 1949', value: '£12,000', tag: 'First edition' },
      { name: 'The Hobbit — J.R.R. Tolkien', badge: '3rd Impr · 1937', value: '£2,800' },
    ],
    mockDetail: {
      heading: 'The Great Gatsby',
      fields: [
        { label: 'Author', value: 'F. Scott Fitzgerald' },
        { label: 'Publisher', value: 'Charles Scribner\'s Sons' },
        { label: 'Edition', value: 'First edition, first printing' },
        { label: 'Year', value: '1925' },
        { label: 'Binding', value: 'Hardcover with dust jacket' },
        { label: 'Condition', value: 'Very Good / Very Good' },
        { label: 'Provenance', value: 'Purchased at Sotheby\'s, 2019' },
        { label: 'Est. value', value: '£4,200' },
      ],
    },
  },

  {
    slug: 'lego-toy-collection-app',
    name: 'LEGO & Toy Collection App',
    metaTitle: 'LEGO Collection Tracker – Catalog & Track Your Sets',
    metaDescription:
      'Track your LEGO collection and other toys online. Record set numbers, condition, minifigures, and value. Built for AFOLs and toy collectors. Free to start.',
    keywords: [
      'lego collection tracker',
      'lego collection app',
      'funko pop collection tracker',
      'toy collection app',
      'action figure collection app',
    ],
    h1: 'LEGO & Toy Collection App',
    items: 'LEGO sets and toys',
    collectorNoun: 'LEGO collector',
    answerCapsule:
      'Vitrine is a LEGO and toy collection app that lets collectors track sets by number, condition, and value. Record sealed, opened, and built states. Works for LEGO, Funko Pops, action figures, and any other toy collection. Free to start.',
    schemaDescription:
      'Vitrine for LEGO and toy collectors. Track LEGO sets by number, condition, and value. Record sealed and opened states, and estimated values. Works for all toy types.',
    painPoints: [
      {
        heading: 'Brickset is a database, not a collection manager',
        body: 'Brickset is an excellent LEGO set database, but tracking your personal collection there is limited. It has no condition fields, no value tracking, and no way to document custom builds or modifications.',
      },
      {
        heading: 'Most tools only cover LEGO',
        body: 'Collectors who own LEGO alongside Funko Pops, action figures, or other toys have no single tool that covers everything. Vitrine handles any collection type in one place.',
      },
      {
        heading: 'Spreadsheets cannot handle images well',
        body: 'Documenting the condition of a sealed box or a specific minifigure variant requires photos. Spreadsheets handle images poorly. Vitrine stores photos alongside every item.',
      },
    ],
    features: [
      {
        name: 'Set number and series fields',
        description: 'Record LEGO set number, theme, subtheme, year, and piece count. Works for any other toy line too.',
      },
      {
        name: 'Condition states',
        description: 'Track sealed (MISB), opened, built, or incomplete states. Record box and instruction condition separately.',
      },
      {
        name: 'Completeness notes',
        description: 'Use the description and notes fields to list minifigures included and note any missing pieces or figures.',
      },
      {
        name: 'Value tracking',
        description: 'Log retail price paid and current estimated resale value. See total collection value.',
      },
      {
        name: 'Photo storage',
        description: 'Attach photos to any item. Useful for documenting sealed box condition or custom builds.',
      },
      {
        name: 'Public collection page',
        description: 'Share your collection with other AFOLs and collectors.',
      },
    ],
    steps: [
      {
        heading: 'Create your account',
        body: 'Sign up free. Start adding sets immediately.',
      },
      {
        heading: 'Add your sets',
        body: 'Enter set number, theme, year, and name. Add photos. Record whether the set is sealed, opened, or built.',
      },
      {
        heading: 'Record condition and completeness',
        body: 'Note box condition, instruction condition, and whether all pieces are present. List any missing figures or parts in the notes field.',
      },
      {
        heading: 'Track values',
        body: 'Enter what you paid and the current estimated value. Sealed, retired sets often appreciate significantly — Vitrine tracks this over time.',
      },
    ],
    competitors: [
      {
        name: 'Brickset',
        weakness: 'A set database with basic wishlist and owned-set tracking. No condition fields, no value tracking, no custom builds.',
      },
      {
        name: 'BrickLink',
        weakness: 'A marketplace for buying and selling LEGO parts. Collection management is not its purpose.',
      },
      {
        name: 'Spreadsheets',
        weakness: 'No image support, no structured condition fields, difficult to calculate value across a large collection.',
      },
    ],
    faqs: [
      {
        question: 'Can I track Funko Pops and action figures alongside LEGO?',
        answer:
          'Yes. Vitrine works for any toy or collectible. You can have LEGO sets, Funko Pops, action figures, and other toys in the same collection, organised into separate groups.',
      },
      {
        question: 'How do I record MISB and MISP condition?',
        answer:
          'Use the condition field to record the state: Mint in Sealed Box (MISB), Mint in Sealed Polybag (MISP), opened, built, or incomplete. Add a condition note for any box damage or missing pieces.',
      },
      {
        question: 'Can I track the value of retired LEGO sets?',
        answer:
          'Yes. Enter the current estimated value for any set. You can update this over time as sealed retired sets appreciate. Vitrine shows your total collection value.',
      },
      {
        question: 'Can I document custom LEGO builds?',
        answer:
          "Yes. Add a custom build as an item with its own photos, piece count estimate, and notes. There's no restriction on item type.",
      },
      {
        question: 'Can I import from a spreadsheet I already use?',
        answer:
          'Yes. Export your spreadsheet as CSV and import it into Vitrine. Map your columns to the appropriate Vitrine fields during the import step.',
      },
    ],
    mockListItems: [
      { name: 'LEGO 10179 UCS Millennium Falcon', badge: 'MISB · 2007', value: '£3,800', tag: 'Retired', selected: true },
      { name: 'LEGO 10143 Death Star II', badge: 'Open · Built', value: '£1,200', tag: 'Retired' },
      { name: 'LEGO 10283 Space Shuttle Discovery', badge: 'MISB · 2021', value: '£210' },
      { name: 'LEGO 21309 NASA Apollo Saturn V', badge: 'Opened · Complete', value: '£260', tag: 'Retired' },
      { name: 'LEGO 75313 UCS AT-AT', badge: 'MISB · 2021', value: '£750' },
    ],
    mockDetail: {
      heading: 'UCS Millennium Falcon (10179)',
      fields: [
        { label: 'Set number', value: '10179' },
        { label: 'Theme', value: 'Star Wars — Ultimate Collector Series' },
        { label: 'Year', value: '2007 (retired 2010)' },
        { label: 'Piece count', value: '5,195' },
        { label: 'Condition', value: 'Mint in Sealed Box (MISB)' },
        { label: 'Box condition', value: 'Very Good — minor shelf wear' },
        { label: 'Purchase price', value: '£350' },
        { label: 'Est. value', value: '£3,800' },
      ],
    },
  },

  {
    slug: 'comic-book-collection-app',
    name: 'Comic Book Collection App',
    metaTitle: 'Comic Book Collection App – Catalog & Track Your Comics',
    metaDescription:
      'The best app for comic book collectors. Track series, issues, grades, variant covers, and condition. Free to start.',
    keywords: [
      'comic book collection app',
      'comic book inventory software',
      'best app for comic collectors',
      'how to catalog comic book collection',
      'cgc collection tracker',
    ],
    h1: 'Comic Book Collection App',
    items: 'comic books',
    collectorNoun: 'comic collector',
    answerCapsule:
      'Vitrine is a comic book collection app for tracking series, issues, graded slabs, and variant covers. Record grades and condition alongside raw copies. Track collection value. Free to start, with paid plans from £5/month.',
    schemaDescription:
      'Vitrine for comic book collectors. Catalog series, issues, and graded slabs. Record grades, variant covers, and condition. Track collection value.',
    painPoints: [
      {
        heading: 'CLZ Comics requires paid desktop software',
        body: 'CLZ Comics is capable but runs as desktop software on Windows or Mac and requires a subscription. There is no web-based access without a separate sync setup.',
      },
      {
        heading: 'No easy way to mix graded and raw copies',
        body: 'Most apps treat all comics the same. Vitrine lets you record grading company, grade, and cert number for certified copies in the condition and notes fields, alongside raw copies, all in the same collection.',
      },
      {
        heading: 'Spreadsheets fall apart past a few hundred issues',
        body: 'Tracking a large long-box collection in a spreadsheet means no images, no structured condition tracking, and no way to note key issues. Vitrine handles collections of any size.',
      },
    ],
    features: [
      {
        name: 'Series and issue tracking',
        description: 'Organise by publisher, series, volume, and issue number. Use category and notes to note key issues and first appearances.',
      },
      {
        name: 'Grading and condition notes',
        description: 'Record grading company, grade, and cert number for slabs in the condition and notes fields. Works for CGC, CBCS, and raw copies alike.',
      },
      {
        name: 'Variant cover notes',
        description: 'Document cover variants — newsstand, direct edition, incentive variant, and store exclusives — in the description or notes.',
      },
      {
        name: 'Value tracking',
        description: 'Log purchase price and current estimated value per issue. See total collection value.',
      },
      {
        name: 'Key issue notes',
        description: 'Use the category and notes fields to mark first appearances, first prints, and historically significant issues.',
      },
      {
        name: 'Public collection page',
        description: 'Share a link to your collection with other collectors.',
      },
    ],
    steps: [
      {
        heading: 'Create your account',
        body: 'Sign up free. Your collection starts private.',
      },
      {
        heading: 'Add your comics',
        body: 'Enter publisher, series, volume, and issue number. Add cover photos. Note key issues in the category or notes field.',
      },
      {
        heading: 'Record grades and variants',
        body: 'Use the condition and notes fields to record grading company, grade, and cert number for slabs. For raw copies, record condition grade. Note cover variant in the description.',
      },
      {
        heading: 'Track value',
        body: 'Enter purchase price and estimated current value. Key issues and slabs can be updated as market prices shift.',
      },
    ],
    competitors: [
      {
        name: 'CLZ Comics',
        weakness: 'Desktop software requiring installation and a paid subscription. No browser-based access by default.',
      },
      {
        name: 'GoCollect',
        weakness: 'Primarily a price guide. The collection tracking feature is secondary and focused on graded books.',
      },
      {
        name: 'Spreadsheets',
        weakness: 'No grading fields, no variant tracking, no images, and no key issue flags.',
      },
    ],
    faqs: [
      {
        question: 'Can I track both graded slabs and raw copies?',
        answer:
          'Yes. Use the condition grade and notes fields to record grading company (CGC, CBCS, PGX), grade, and cert number for slabs. Raw copies get a standard condition grade. Both types live in the same collection.',
      },
      {
        question: 'How do I track variant covers?',
        answer:
          'Add the variant type in the description or notes — newsstand, direct, incentive, store exclusive, or any other variant. You can have multiple entries for the same issue number if you own different variants.',
      },
      {
        question: 'Can I note first appearances and key issues?',
        answer:
          'Yes. Use the category and notes fields to mark an issue as key and explain why — first appearance, first print, cameo, origin issue, and so on.',
      },
      {
        question: 'Can I export my collection for insurance purposes?',
        answer:
          'CSV export is available on Professional plans and includes all fields: title, issue, grade, cert number, purchase price, and estimated value.',
      },
      {
        question: 'Can I import a spreadsheet I already use to track my comics?',
        answer:
          'Yes. Export your spreadsheet as CSV and import it into Vitrine. Map your column headers to the appropriate fields. The importer flags any rows that need review.',
      },
    ],
    mockListItems: [
      { name: 'Amazing Fantasy #15', badge: 'CGC 6.0 · 1962', value: '£28,000', tag: 'Key issue', selected: true },
      { name: 'X-Men #1', badge: 'CGC 7.5 · 1963', value: '£9,400', tag: 'Key issue' },
      { name: 'The Amazing Spider-Man #129', badge: 'CGC 8.5 · 1974', value: '£3,200', tag: '1st Punisher' },
      { name: 'Incredible Hulk #181', badge: 'Raw · VF · 1974', value: '£1,800', tag: '1st Wolverine' },
      { name: 'Batman #1', badge: 'CGC 4.0 · 1940', value: '£42,000', tag: 'Key issue' },
    ],
    mockDetail: {
      heading: 'Amazing Fantasy #15',
      fields: [
        { label: 'Publisher', value: 'Marvel Comics' },
        { label: 'Issue', value: '#15' },
        { label: 'Cover date', value: 'August 1962' },
        { label: 'Significance', value: '1st appearance of Spider-Man' },
        { label: 'Grade', value: 'CGC 6.0 — Fine' },
        { label: 'Cert no.', value: '0987654321' },
        { label: 'Purchase price', value: '£18,500' },
        { label: 'Est. value', value: '£28,000' },
      ],
    },
  },

  {
    slug: 'wine-collection-app',
    name: 'Wine Collection App',
    metaTitle: 'Wine Collection App – Manage Your Wine Cellar',
    metaDescription:
      'Manage your wine collection online. Track producer, vintage, appellation, cellar location, and value. A CellarTracker alternative built for precision. Free to start.',
    keywords: [
      'wine collection app',
      'wine cellar management software',
      'cellar tracker alternative',
      'wine collection tracker',
      'wine inventory app',
    ],
    h1: 'Wine Collection App',
    items: 'bottles',
    collectorNoun: 'wine collector',
    answerCapsule:
      'Vitrine is a wine collection app that helps collectors manage their cellar by producer, vintage, appellation, and bin location. Track drinking windows, record tasting notes, and value bottles for insurance. A dedicated wine cellar manager with no community data concerns.',
    schemaDescription:
      'Vitrine for wine collectors. Manage your cellar by producer, vintage, appellation, and bin location. Track drinking windows, tasting notes, and bottle values.',
    painPoints: [
      {
        heading: "CellarTracker's data quality is community-sourced",
        body: 'CellarTracker relies on user-submitted tasting notes and valuations. Data quality varies significantly. Vitrine puts you in control of your own data without depending on what others have entered.',
      },
      {
        heading: 'Most wine apps are phone-first',
        body: 'Vivino and similar apps are designed for scanning bottles on the go. Managing a serious cellar with hundreds of bottles needs a proper desktop interface.',
      },
      {
        heading: 'Insurance documentation is an afterthought',
        body: 'Most wine apps have no way to generate a structured inventory for insurance purposes. Vitrine stores purchase price and estimated value per bottle and lets you export the full list.',
      },
    ],
    features: [
      {
        name: 'Cellar fields',
        description: 'Record producer, wine name, vintage, appellation, region, grape variety, and format (bottle, magnum, etc.).',
      },
      {
        name: 'Cellar location notes',
        description: 'Record cellar location for every bottle using the location field. Find any wine in your cellar in seconds.',
      },
      {
        name: 'Drinking window notes',
        description: 'Record drink-from and drink-by dates in the notes fields alongside your tasting notes.',
      },
      {
        name: 'Tasting notes',
        description: 'Record your own tasting notes per bottle or per case using the description field. These are yours, not community data.',
      },
      {
        name: 'Value tracking',
        description: 'Log purchase price and current estimated value. See total cellar value across all bottles.',
      },
      {
        name: 'Public collection page',
        description: 'Optionally share your cellar with guests or other collectors.',
      },
    ],
    steps: [
      {
        heading: 'Create your account',
        body: 'Sign up free. Your cellar is private by default.',
      },
      {
        heading: 'Add your wines',
        body: 'Enter producer, name, vintage, appellation, and quantity. Record bin location.',
      },
      {
        heading: 'Record drinking windows and tasting notes',
        body: 'Add drink-from and drink-by dates to the notes alongside tasting notes. All notes are searchable.',
      },
      {
        heading: 'Track values',
        body: 'Record purchase price and estimated value per bottle. Vitrine totals these across your cellar.',
      },
    ],
    competitors: [
      {
        name: 'CellarTracker',
        weakness: 'Community-sourced data with variable quality. Dated interface. Tasting notes and valuations rely on what other users have entered.',
      },
      {
        name: 'Vivino',
        weakness: 'Designed for discovering and buying wine. Not built for managing a serious cellar or generating insurance documentation.',
      },
      {
        name: 'Spreadsheets',
        weakness: 'No bin location fields, no drinking window tracking, no value totals, difficult to share.',
      },
    ],
    faqs: [
      {
        question: 'Can I track wine by bin location in my cellar?',
        answer:
          'Yes. Vitrine has a bin location field for every bottle or case. Enter your cellar grid reference, rack number, or any location system you use. Filter your collection by location to find any bottle.',
      },
      {
        question: 'How do I value my wine collection for insurance?',
        answer:
          'Enter a purchase price and current estimated value for each wine. Vitrine totals these across your cellar. On Professional plans you can export the full list as CSV.',
      },
      {
        question: 'Can I record bottles I have received as gifts?',
        answer:
          'Yes. Leave the purchase price field empty or enter zero, and note the gift in the provenance field. All other fields work the same.',
      },
      {
        question: 'Can I track en primeur purchases?',
        answer:
          'Yes. Add the wine with the vintage and note in the status or notes field that it is an en primeur purchase awaiting delivery. Update the record when the bottles arrive.',
      },
      {
        question: 'How is Vitrine different from CellarTracker?',
        answer:
          'CellarTracker is community-driven. Its data and tasting notes come from other users. Vitrine is your private cellar manager. Your data and notes are entirely your own, with no dependence on what others have contributed.',
      },
    ],
    mockListItems: [
      { name: 'Pétrus 2015', badge: '6 bottles · Bin A3', value: '£4,200', selected: true },
      { name: 'Screaming Eagle 2018', badge: '3 bottles · Bin B1', value: '£8,400', tag: 'Ready 2028' },
      { name: 'Ridge Monte Bello 2019', badge: '12 bottles · Bin C2', value: '£1,800' },
      { name: 'Château Margaux 2016', badge: '6 bottles · Bin A1', value: '£3,600', tag: 'Ready 2026' },
      { name: 'Opus One 2020', badge: '1 magnum · Bin D4', value: '£680' },
    ],
    mockDetail: {
      heading: 'Pétrus 2015',
      fields: [
        { label: 'Producer', value: 'Château Pétrus' },
        { label: 'Appellation', value: 'Pomerol, Bordeaux' },
        { label: 'Vintage', value: '2015' },
        { label: 'Quantity', value: '6 × 75cl bottles' },
        { label: 'Bin location', value: 'Rack A, Row 3' },
        { label: 'Drink from', value: '2025' },
        { label: 'Drink by', value: '2050' },
        { label: 'Est. value', value: '£700 per bottle' },
      ],
    },
  },

  {
    slug: 'watch-collection-app',
    name: 'Watch Collection App',
    metaTitle: 'Watch Collection App – Track & Manage Your Watches',
    metaDescription:
      'Track your watch collection online. Record reference numbers, serial numbers, service history, and value. The collection manager built for watch collectors. Free to start.',
    keywords: [
      'watch collection app',
      'watch collection tracker',
      'best app for watch collectors',
      'watch inventory app',
      'watch collection management',
    ],
    h1: 'Watch Collection App',
    items: 'watches',
    collectorNoun: 'watch collector',
    answerCapsule:
      'Vitrine is a watch collection app for tracking reference numbers, serial numbers, service history, provenance, and value. No dedicated collection management tool dominates the watch market. Vitrine fills that gap with a clean, web-based catalogue.',
    schemaDescription:
      'Vitrine for watch collectors. Track reference numbers, serial numbers, service history, and provenance. Record box and papers status and current market value.',
    painPoints: [
      {
        heading: 'No dedicated tool exists for watch collectors',
        body: 'Watch collectors are well served by forums, price guides, and marketplaces. A dedicated collection management tool is missing. Most collectors fall back on spreadsheets, which were not built for this.',
      },
      {
        heading: 'Service history is hard to document properly',
        body: 'A well-documented service history matters for value and for future buyers. Spreadsheets have no structured way to record service dates, service centres, and work performed. Vitrine gives each watch a notes and condition section where you can log this.',
      },
      {
        heading: 'Provenance and papers documentation is an afterthought',
        body: "Box and papers status, purchase receipts, and ownership history affect a watch's value significantly. Generic inventory apps have no fields for these.",
      },
    ],
    features: [
      {
        name: 'Reference and serial number fields',
        description: 'Record manufacturer reference number, serial number, and case number for every watch.',
      },
      {
        name: 'Service history notes',
        description: 'Record service dates, service centres, and work performed in the notes and condition fields. Build a documented maintenance history for each watch.',
      },
      {
        name: 'Box and papers status',
        description: 'Record whether a watch has its original box, inner box, outer box, warranty card, and additional papers.',
      },
      {
        name: 'Provenance fields',
        description: 'Document purchase source, purchase date, previous owners, and any auction or dealer receipts.',
      },
      {
        name: 'Value tracking',
        description: 'Record purchase price and current estimated market value. See total collection value.',
      },
      {
        name: 'Photo storage',
        description: 'Attach dial, case, caseback, and bracelet photos. Useful for condition documentation and insurance.',
      },
    ],
    steps: [
      {
        heading: 'Create your account',
        body: 'Sign up free. Add your first watch immediately.',
      },
      {
        heading: 'Add the watch details',
        body: 'Enter manufacturer, model, reference number, serial number, year of manufacture, and movement type. Add photos.',
      },
      {
        heading: 'Document box, papers, and provenance',
        body: 'Record box and papers status. Note purchase source, purchase date, and any previous ownership history.',
      },
      {
        heading: 'Record service history',
        body: 'Use the notes and condition fields to record each service: date, service centre, and work performed. All notes are searchable.',
      },
    ],
    competitors: [
      {
        name: 'Spreadsheets',
        weakness: 'The default for most watch collectors. No structured service history log, no provenance fields, no image support, no total value calculation.',
      },
      {
        name: 'Generic inventory apps',
        weakness: 'Apps like Sortly were built for business inventory. They have no reference number fields, no service log, and no box and papers tracking.',
      },
    ],
    faqs: [
      {
        question: 'How do I record service history in Vitrine?',
        answer:
          'Use the condition and notes fields on each watch record. Record the service date, service centre, and work performed in the notes. This builds up over time and stays attached to the watch.',
      },
      {
        question: 'How do I track box and papers status?',
        answer:
          "Vitrine has a box and papers field where you record what's present: original box, inner box, outer box, warranty card, hang tags, and additional papers. You can add condition notes for each.",
      },
      {
        question: 'How do I value my watch collection for insurance?',
        answer:
          'Enter a current estimated market value for each watch. Vitrine totals these across your collection. Include photos for additional documentation. On Professional plans you can export the full list as CSV.',
      },
      {
        question: 'Can I track vintage and modern watches in the same collection?',
        answer:
          'Yes. There is no restriction on watch type or era. Vintage pieces, modern references, dress watches, and sports watches all live in the same collection.',
      },
      {
        question: 'Can I document a watch I plan to sell?',
        answer:
          "Yes. A complete Vitrine record — reference number, serial number, service history, box and papers, photos, and provenance — is useful documentation for any potential buyer. Export it as CSV or share your collection page.",
      },
    ],
    mockListItems: [
      { name: 'Rolex Daytona Ref. 116500LN', badge: '2016 · Ceramic', value: '£22,500', selected: true },
      { name: 'Patek Philippe Nautilus 5711/1A', badge: '2019 · Steel', value: '£98,000', tag: 'Full set' },
      { name: 'Omega Speedmaster Moonwatch', badge: '1969 · Cal. 861', value: '£4,200', tag: 'Vintage' },
      { name: 'A. Lange & Söhne Lange 1', badge: '2015 · 18ct Gold', value: '£18,500', tag: 'Full set' },
      { name: 'IWC Portugieser Chronograph', badge: '2021 · Steel', value: '£6,800' },
    ],
    mockDetail: {
      heading: 'Rolex Daytona Ref. 116500LN',
      fields: [
        { label: 'Reference', value: '116500LN' },
        { label: 'Serial no.', value: '2E123456' },
        { label: 'Year', value: '2016' },
        { label: 'Movement', value: 'Cal. 4130 (automatic)' },
        { label: 'Box & papers', value: 'Full set — box, papers, hangtag' },
        { label: 'Last service', value: 'March 2023 · Rolex Authorised' },
        { label: 'Purchase price', value: '£11,500' },
        { label: 'Est. value', value: '£22,500' },
      ],
    },
  },

  {
    slug: 'stamp-collection-app',
    name: 'Stamp Collection App',
    metaTitle: 'Stamp Collection App – Catalog & Manage Your Stamps',
    metaDescription:
      'Catalog your stamp collection online. Record Scott, Stanley Gibbons, and Michel catalogue numbers, condition, and value. Free to start.',
    keywords: [
      'stamp collection software',
      'stamp cataloguing app',
      'philately collection software',
      'how to organize stamp collection',
      'stamp inventory app',
    ],
    h1: 'Stamp Collection App',
    items: 'stamps',
    collectorNoun: 'philatelist',
    answerCapsule:
      'Vitrine is a stamp collection app for philatelists. Catalog stamps by Scott, Stanley Gibbons, or Michel catalogue number. Record condition, perforation, and watermark details. Track value and share your collection. Free to start.',
    schemaDescription:
      'Vitrine for stamp collectors. Catalog stamps by catalogue number, condition, and value. Record perforation, watermark, and gum details. Works with Scott, Stanley Gibbons, and Michel numbering.',
    painPoints: [
      {
        heading: 'StampManage is Windows-only desktop software',
        body: 'StampManage is the most established stamp software, but it requires a Windows install and cannot be accessed from another device without a local network setup.',
      },
      {
        heading: 'Most tools use only one catalogue system',
        body: 'Collectors in different countries use different catalogue systems. Scott is standard in the US, Stanley Gibbons in the UK, Michel in Germany. Vitrine lets you record catalogue numbers from any system.',
      },
      {
        heading: 'No public showcase for your collection',
        body: 'Most stamp apps are entirely private. Vitrine gives you a public collection page to share with other philatelists.',
      },
    ],
    features: [
      {
        name: 'Catalogue number fields',
        description: 'Record Scott, Stanley Gibbons, Michel, and Yvert catalogue numbers. Use whichever system you prefer.',
      },
      {
        name: 'Condition grading',
        description: 'Record condition using standard philatelic grades: Superb, Extremely Fine, Very Fine, Fine, Very Good, Good, Fair, Poor.',
      },
      {
        name: 'Perforation and watermark fields',
        description: 'Document perforation gauge and watermark type. Essential for identifying varieties.',
      },
      {
        name: 'Gum condition',
        description: 'Record gum status: mint never hinged (MNH), lightly hinged (LH), hinged (H), no gum (NG), or regummed.',
      },
      {
        name: 'Value tracking',
        description: 'Log catalogue value and purchase price. Track how your collection value changes over time.',
      },
      {
        name: 'Photo storage',
        description: 'Scan stamps front and back. Useful for identifying varieties and documenting condition.',
      },
    ],
    steps: [
      {
        heading: 'Create your account',
        body: 'Sign up free. Start cataloguing immediately.',
      },
      {
        heading: 'Add your stamps',
        body: 'Enter country, issue, catalogue number, and year. Add a scan of the front and back.',
      },
      {
        heading: 'Record condition details',
        body: 'Note the condition grade, gum status, perforation gauge, and watermark. These fields distinguish a valuable stamp from a common one.',
      },
      {
        heading: 'Track catalogue and market values',
        body: 'Enter the catalogue value and what you paid. Update values as catalogue editions change.',
      },
    ],
    competitors: [
      {
        name: 'StampManage',
        weakness: 'Windows desktop software only. Cannot be accessed from a tablet or phone. Requires a local install.',
      },
      {
        name: 'Spreadsheets',
        weakness: 'No structured catalogue number fields, no gum condition tracking, no image support inline, no value totals.',
      },
    ],
    faqs: [
      {
        question: 'Which stamp catalogue system does Vitrine support?',
        answer:
          'Vitrine has fields for Scott, Stanley Gibbons, and Michel catalogue numbers. You can fill in whichever system you use. Many collectors record numbers from two or more systems for the same stamp.',
      },
      {
        question: 'How do I record MNH, LH, and hinged condition?',
        answer:
          'Vitrine has a gum condition field with standard philatelic options: mint never hinged (MNH), original gum lightly hinged (OG LH), hinged (H), no gum (NG), and regummed. Add a condition note for anything more specific.',
      },
      {
        question: 'Can I catalog a thematic collection?',
        answer:
          'Yes. Use collections and custom labels to organise stamps by theme — birds, ships, royalty, space, or any other topic. Thematic collections work alongside country-based organisation.',
      },
      {
        question: 'Can I track catalogue value separately from market value?',
        answer:
          'Yes. Vitrine has separate fields for catalogue value (what the catalogue lists) and purchase price (what you paid). You can also enter a current estimated market value if it differs from catalogue.',
      },
      {
        question: 'Can I scan and attach images to each stamp?',
        answer:
          'Yes. Attach scans of the front and back to any stamp entry. Scans are useful for identifying varieties, watermarks, and perforations — and for documenting condition.',
      },
    ],
    mockListItems: [
      { name: 'GB 1d Black, plate 1b (1840)', badge: 'VF · MNH', value: '£3,200', tag: 'Key', selected: true },
      { name: 'US Inverted Jenny (1918)', badge: 'F/VF · Used', value: '£85,000', tag: 'Error' },
      { name: 'GB 2d Blue, plate 5 (1841)', badge: 'Fine · LH', value: '£280' },
      { name: 'Australia Kangaroo 5/- (1913)', badge: 'VF · OG', value: '£420', tag: '1st wmk' },
      { name: 'Germany Zeppelin stamp (1928)', badge: 'Superb · MNH', value: '£1,100' },
    ],
    mockDetail: {
      heading: 'GB 1d Black, Plate 1b (1840)',
      fields: [
        { label: 'Country', value: 'Great Britain' },
        { label: 'Issue', value: '1d Black' },
        { label: 'Year', value: '1840' },
        { label: 'Stanley Gibbons', value: 'SG 1' },
        { label: 'Scott', value: 'SC 1' },
        { label: 'Condition', value: 'Very Fine' },
        { label: 'Gum', value: 'Mint Never Hinged (MNH)' },
        { label: 'Est. value', value: '£3,200' },
      ],
    },
  },

  {
    slug: 'art-collection-app',
    name: 'Art Collection App',
    metaTitle: 'Art Collection App – Catalog & Manage Your Artwork',
    metaDescription:
      'Catalog your art collection online. Record medium, dimensions, provenance, and insurance value. An affordable alternative to Artwork Archive for hobbyist collectors. Free to start.',
    keywords: [
      'art collection management software',
      'art inventory app',
      'artwork archive alternative',
      'how to catalogue artwork',
      'art collection tracker',
    ],
    h1: 'Art Collection App',
    items: 'artworks',
    collectorNoun: 'art collector',
    answerCapsule:
      'Vitrine is an art collection app for hobbyist collectors. Catalog artworks with medium, dimensions, provenance, exhibition history, and insurance value. A web-based alternative to Artwork Archive at a fraction of the price. Free to start.',
    schemaDescription:
      'Vitrine for art collectors. Catalog artworks with medium, dimensions, provenance, condition reports, and insurance value. Track exhibition history and share your collection.',
    painPoints: [
      {
        heading: 'Artwork Archive is expensive and built for galleries',
        body: 'Artwork Archive is the dominant art collection tool, but it starts at several hundred dollars per year and is designed for galleries and professional artists. A hobbyist collector does not need most of its features.',
      },
      {
        heading: 'Most tools have no valuation tracking',
        body: 'Documenting what art is worth for insurance purposes is a practical need for any collector. Most apps treat value as an optional field rather than a core feature.',
      },
      {
        heading: 'Provenance documentation is poorly supported',
        body: 'Provenance — the documented ownership history of a work — matters for authenticity and for resale. Generic inventory apps have no structured provenance fields.',
      },
    ],
    features: [
      {
        name: 'Artwork fields',
        description: 'Record artist, title, year, medium, dimensions, edition number, and framing details.',
      },
      {
        name: 'Provenance chain',
        description: 'Document the full ownership history of each work: gallery purchased from, previous owners, auction records, and any certificates of authenticity.',
      },
      {
        name: 'Condition reports',
        description: 'Record condition at acquisition and update it over time. Note any restoration, damage, or conservation work.',
      },
      {
        name: 'Exhibition history notes',
        description: 'Record exhibitions the work has appeared in — date, venue, and title — in the notes and description fields. Loans management is available on Professional plans.',
      },
      {
        name: 'Insurance value',
        description: 'Record current insurance value and update it after reappraisal. Vitrine totals insurance values across your collection.',
      },
      {
        name: 'Photo storage',
        description: 'Attach high-resolution images: front, back, signature, detail shots, and frame.',
      },
    ],
    steps: [
      {
        heading: 'Create your account',
        body: 'Sign up free. Your collection is private by default.',
      },
      {
        heading: 'Add your artworks',
        body: 'Enter artist, title, year, medium, and dimensions. Add photos. Record where and when you acquired the work.',
      },
      {
        heading: 'Document provenance and condition',
        body: 'Record the ownership chain, any certificates of authenticity, and the condition at acquisition.',
      },
      {
        heading: 'Set insurance value',
        body: 'Enter the current insurance value for each work. Update it after professional reappraisals. Vitrine totals these across your collection.',
      },
    ],
    competitors: [
      {
        name: 'Artwork Archive',
        weakness: 'Priced and designed for galleries and professional artists. Expensive for a hobbyist collector with a modest collection.',
      },
      {
        name: 'Spreadsheets',
        weakness: 'No provenance chain fields, no structured condition reports, no exhibition history, no value calculation.',
      },
    ],
    faqs: [
      {
        question: 'How do I document provenance in Vitrine?',
        answer:
          'Each artwork has a provenance section where you record the ownership chain: gallery purchased from, purchase date, any previous owners, auction records, and certificates of authenticity. Add as much or as little detail as you have.',
      },
      {
        question: 'Can I record condition reports for my artworks?',
        answer:
          'Yes. Vitrine has a condition report field for every work. Record the condition at acquisition and add entries over time if the condition changes. Note any restoration, damage, or conservation work.',
      },
      {
        question: 'How do I value my art collection for insurance?',
        answer:
          'Enter the current insurance value for each work. Vitrine totals these across your collection. Update values after professional reappraisals. On Professional plans you can export the full list as CSV.',
      },
      {
        question: 'Can I track multiple works by the same artist?',
        answer:
          'Yes. Filter your collection by artist to see all works by them together. You can also create a separate collection group for a single artist if you prefer.',
      },
      {
        question: 'How is Vitrine different from Artwork Archive?',
        answer:
          'Artwork Archive is built for galleries, artists, and institutions at professional pricing. Vitrine is built for hobbyist collectors at a fraction of the cost. If you collect art but are not running a gallery, Vitrine covers what you actually need.',
      },
    ],
    mockListItems: [
      { name: 'Still Life with Lemons — Maria Kovacs (2018)', badge: 'Oil on canvas', value: '£4,200', tag: 'Appraised', selected: true },
      { name: 'Coastal Study No. 3 — James Hartley (2021)', badge: 'Watercolour', value: '£850' },
      { name: 'Untitled (Red) — A. Ferreira (1997)', badge: 'Acrylic on board', value: '£2,600', tag: 'Provenance' },
      { name: 'Portrait of E. — unknown (c.1940)', badge: 'Oil on canvas', value: '£1,100', tag: 'Researching' },
      { name: 'Edition 3/12 — Sam Okafor (2020)', badge: 'Screen print', value: '£380' },
    ],
    mockDetail: {
      heading: 'Still Life with Lemons — Maria Kovacs (2018)',
      fields: [
        { label: 'Artist', value: 'Maria Kovacs' },
        { label: 'Year', value: '2018' },
        { label: 'Medium', value: 'Oil on canvas' },
        { label: 'Dimensions', value: '60 × 80 cm' },
        { label: 'Acquired from', value: 'Studio sale, Budapest' },
        { label: 'Condition', value: 'Excellent — no restoration' },
        { label: 'Insurance value', value: '£4,200' },
      ],
    },
  },
]

export function getSegment(slug: string): Segment | undefined {
  return segments.find((s) => s.slug === slug)
}
