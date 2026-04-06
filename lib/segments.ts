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
          'Yes, on Professional plans. Export your spreadsheet as CSV and import it into Vitrine. The importer maps your columns to Vitrine fields. You can review and correct any rows before the import commits.',
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
          'Yes, on Professional plans. Export your spreadsheet as CSV and use the Vitrine importer. You map your columns to Vitrine fields and review any rows that need attention before confirming.',
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
          'Discogs lets you export your collection as CSV. On Professional plans you can import that file into Vitrine. Some field mapping will be required during the import step.',
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
        description: 'Record publisher, edition, print run, year, binding type, and format for every book.',
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
          'Both LibraryThing and Goodreads support CSV export. On Professional plans you can import that file into Vitrine. Some fields will need mapping during the import step.',
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
          'Yes, on Professional plans. Export your spreadsheet as CSV and import it into Vitrine. Map your columns to the appropriate Vitrine fields during the import step.',
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
          'Yes, on Professional plans. Export your spreadsheet as CSV and import it into Vitrine. Map your column headers to the appropriate fields. The importer flags any rows that need review.',
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
          "Use the notes and description fields to record box and papers status — original box, inner box, outer box, warranty card, hang tags, and additional papers. Add condition notes for each element alongside the main record.",
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
          'Record Scott, Stanley Gibbons, Michel, and Yvert catalogue numbers in the notes field. You can use whichever system you prefer. Many collectors record numbers from two or more systems for the same stamp.',
      },
      {
        question: 'How do I record MNH, LH, and hinged condition?',
        answer:
          'Use the condition and notes fields to record gum status: mint never hinged (MNH), original gum lightly hinged (OG LH), hinged (H), no gum (NG), or regummed. Add a more detailed condition note for anything specific.',
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

  // --- New segments ---

  {
    slug: 'video-game-collection-app',
    name: 'Video Game Collection App',
    metaTitle: 'Video Game Collection App – Catalog Your Games & Consoles',
    metaDescription:
      'The best app for video game collectors. Catalog games, consoles, and accessories across every platform. Track condition, value, and completeness. Free to start.',
    keywords: [
      'video game collection app',
      'video game inventory software',
      'retro game collection tracker',
      'game collection management app',
      'best app to catalog video games',
    ],
    h1: 'Video Game Collection App',
    items: 'games',
    collectorNoun: 'game collector',
    answerCapsule:
      'Vitrine is a video game collection app for collectors of all sizes. Catalog games, consoles, and accessories across every platform — from Atari 2600 to PS5. Track condition, completeness, and estimated value. Share your collection publicly. Free to start.',
    schemaDescription:
      'Vitrine for video game collectors. Catalog games, consoles, and accessories. Track condition, completeness, and value across every platform.',
    painPoints: [
      {
        heading: 'One collection, every platform',
        body: 'Most trackers are platform-specific or built around marketplace listings. Vitrine lets you catalog everything together — retro cartridges, loose discs, sealed boxes, and hardware — in a single searchable collection.',
      },
      {
        heading: 'Condition and completeness matter',
        body: 'Whether a game is loose, complete in box, or factory sealed changes its value significantly. Vitrine has dedicated condition and notes fields so you can record exactly what you have.',
      },
      {
        heading: 'No way to show your collection to other collectors',
        body: 'Spreadsheets and forum posts are clunky. Vitrine gives you a clean public collection page you can link to, showing exactly what you own and how it looks.',
      },
    ],
    features: [
      {
        name: 'Platform and format tracking',
        description: 'Catalog by platform, format (cartridge, disc, digital), and region. Filter across your entire collection in seconds.',
      },
      {
        name: 'Completeness tracking',
        description: 'Record whether a game is loose, complete in box, or factory sealed using the condition field. Affects both display and value estimates.',
      },
      {
        name: 'Value tracking',
        description: 'Log purchase price and current estimated value per title. Track your total collection value over time.',
      },
      {
        name: 'Photo storage',
        description: 'Attach photos of box art, cartridge labels, and inserts. Useful for insurance and documenting condition.',
      },
      {
        name: 'Public collection page',
        description: 'Share a link to your collection. You choose which items are visible. Great for trading lists and showing off grail pickups.',
      },
      {
        name: 'Bulk CSV import',
        description: 'Already tracking in a spreadsheet? Import it directly on Professional plans. Vitrine maps your columns and flags anything that needs review.',
      },
    ],
    steps: [
      {
        heading: 'Create a free account',
        body: 'Sign up at vitrinecms.com. No credit card required. Your collection is private by default.',
      },
      {
        heading: 'Add your games and hardware',
        body: 'Enter titles one by one, or import a CSV on Professional plans. Record platform, year, condition, completeness, and value from the start.',
      },
      {
        heading: 'Attach photos and notes',
        body: 'Add photos of box art, cart labels, and manuals. Use the notes field for serial numbers, regional variations, or anything else that matters to you.',
      },
      {
        heading: 'Share your collection page',
        body: 'Make selected items public and share the link with other collectors. Your page updates automatically as you add new pickups.',
      },
    ],
    competitors: [
      {
        name: 'VGPC / PriceCharting',
        weakness: 'A price guide and marketplace tool. Not a collection manager — limited cataloguing fields and no public collection pages.',
      },
      {
        name: 'CLZ Games',
        weakness: 'App is scan-and-match focused but limited for unusual or retro items. No public-facing collection page for sharing.',
      },
      {
        name: 'Google Sheets',
        weakness: 'Works for small collections but becomes unmanageable at scale. No photo storage, no public page, and formatting is entirely manual.',
      },
    ],
    faqs: [
      {
        question: 'Can I catalog retro games alongside modern ones?',
        answer:
          'Yes. Vitrine has no platform restrictions. You can catalog everything from Atari 2600 cartridges to PS5 discs in a single collection, organised however you like.',
      },
      {
        question: 'How do I track whether a game is complete in box or loose?',
        answer:
          'Use the condition field to record completeness — loose, CIB (complete in box), or factory sealed. You can add additional detail in the notes field, such as whether the manual is present.',
      },
      {
        question: 'Can I track hardware and accessories as well as games?',
        answer:
          'Yes. Vitrine is flexible enough to catalog consoles, controllers, cables, and accessories alongside your games. Use the category field to keep them organised.',
      },
      {
        question: 'Is there a way to share my want list or trade list?',
        answer:
          'You can add a notes section to your public collection page describing what you are looking for or willing to trade. Individual items can be marked public or private.',
      },
      {
        question: 'Can I import my existing spreadsheet?',
        answer:
          'Yes, on Professional plans. Export your spreadsheet as CSV, import it into Vitrine, and map your columns to Vitrine fields. You can review everything before the import commits.',
      },
    ],
    mockListItems: [
      { name: 'Super Mario World (SNES)', badge: 'CIB · Near Mint', value: '£85', tag: 'Complete', selected: true },
      { name: 'Earthbound (SNES)', badge: 'CIB · Very Good', value: '£420', tag: 'Grail' },
      { name: 'Sonic the Hedgehog (Mega Drive)', badge: 'Loose · Good', value: '£18' },
      { name: 'GoldenEye 007 (N64)', badge: 'CIB · Excellent', value: '£65' },
      { name: 'Silent Hill 2 (PS2)', badge: 'Sealed', value: '£380', tag: 'Sealed' },
    ],
    mockDetail: {
      heading: 'Super Mario World (SNES)',
      fields: [
        { label: 'Platform', value: 'Super Nintendo (SNES)' },
        { label: 'Region', value: 'PAL — UK' },
        { label: 'Condition', value: 'Complete in Box — Near Mint' },
        { label: 'Includes', value: 'Cart, box, manual, map insert' },
        { label: 'Year', value: '1992' },
        { label: 'Purchase price', value: '£40' },
        { label: 'Est. value', value: '£85' },
        { label: 'Notes', value: 'Label is clean. Box has minor shelf wear on corners.' },
      ],
    },
  },

  {
    slug: 'vintage-camera-collection-app',
    name: 'Vintage Camera Collection App',
    metaTitle: 'Vintage Camera Collection App – Catalog Film & Classic Cameras',
    metaDescription:
      'The best app for vintage camera collectors. Catalog film cameras, lenses, and accessories. Record serial numbers, shutter counts, and service history. Free to start.',
    keywords: [
      'vintage camera collection app',
      'film camera collection tracker',
      'camera collection management software',
      'vintage camera inventory app',
      'classic camera cataloguing tool',
    ],
    h1: 'Vintage Camera Collection App',
    items: 'cameras',
    collectorNoun: 'camera collector',
    answerCapsule:
      'Vitrine is a vintage camera collection app for collectors of film cameras, lenses, and photographic equipment. Record serial numbers, shutter counts, service history, and estimated value. Build a public showcase or keep it private. Free to start.',
    schemaDescription:
      'Vitrine for vintage camera collectors. Catalog film cameras, lenses, and accessories. Record serial numbers, condition, service history, and value.',
    painPoints: [
      {
        heading: 'Serial numbers and service history get lost',
        body: 'A camera\'s serial number tells you its production date and provenance. Vitrine gives you a permanent home for serial numbers, CLA history, and known faults — information that would otherwise live on Post-it notes.',
      },
      {
        heading: 'Lenses, bodies, and accessories need to stay linked',
        body: 'A Leica M body is only half the story without its lenses. Vitrine lets you note which lenses pair with which bodies, and keep your whole kit catalogued in one place.',
      },
      {
        heading: 'Insurance needs documentation',
        body: 'High-value cameras are expensive to replace. Vitrine stores photos, purchase receipts, and valuations so you have a proper record if something goes missing.',
      },
    ],
    features: [
      {
        name: 'Serial number and provenance records',
        description: 'Record serial number, production year range, and any known history. Useful for dating equipment and proving provenance.',
      },
      {
        name: 'Condition and service history',
        description: 'Log CLA dates, shutter curtain condition, light seal status, and any known faults. Know exactly what needs attention.',
      },
      {
        name: 'Value tracking',
        description: 'Record purchase price and current estimated value. Track how your collection value changes over time.',
      },
      {
        name: 'Photo storage',
        description: 'Attach photos of each camera from multiple angles. Useful for insurance and documenting condition.',
      },
      {
        name: 'Public collection page',
        description: 'Share your collection with other photographers and collectors. Choose which items are visible.',
      },
      {
        name: 'Bulk CSV import',
        description: 'Import an existing spreadsheet on Professional plans. Vitrine maps your columns and flags anything that needs review.',
      },
    ],
    steps: [
      {
        heading: 'Create a free account',
        body: 'Sign up at vitrinecms.com. No credit card required. Start with up to 100 items on the free plan.',
      },
      {
        heading: 'Add your cameras and lenses',
        body: 'Enter each item with make, model, serial number, condition, and estimated value. Add service notes and known faults in the notes field.',
      },
      {
        heading: 'Attach photos and documents',
        body: 'Photograph each item and attach the images. Add purchase receipts or valuations as document attachments on Professional plans.',
      },
      {
        heading: 'Share your collection page',
        body: 'Make selected items public and share the link with other collectors. Your page updates automatically as you add new pieces.',
      },
    ],
    competitors: [
      {
        name: 'Camera-wiki.org',
        weakness: 'A reference wiki, not a personal collection manager. No ability to track what you personally own, condition, or value.',
      },
      {
        name: 'Flickr camera finder',
        weakness: 'Shows which cameras other photographers use — not a cataloguing or collection management tool.',
      },
      {
        name: 'Google Sheets',
        weakness: 'Manual, no photo storage, and becomes unwieldy as a collection grows. No public sharing page.',
      },
    ],
    faqs: [
      {
        question: 'Can I catalog lenses and accessories alongside camera bodies?',
        answer:
          'Yes. Vitrine works for any type of photographic equipment — bodies, lenses, filters, flash units, and accessories. Use the category field to keep them organised.',
      },
      {
        question: 'How do I record service history for a camera?',
        answer:
          'Use the notes field to record CLA dates, what was serviced, and by whom. You can also attach scanned service receipts as document files on Professional plans.',
      },
      {
        question: 'How do I date a camera from its serial number?',
        answer:
          'Vitrine does not automatically look up serial number databases, but you can record the serial number and the production date range you researched, keeping it permanently attached to that item.',
      },
      {
        question: 'Can I track cameras I have sold or traded away?',
        answer:
          'Yes. Use the status field to mark items as deaccessioned or sold, and record the sale price in the notes. They stay in your collection history without appearing in your active inventory.',
      },
      {
        question: 'Is Vitrine useful if I shoot with my cameras as well as collect them?',
        answer:
          'Yes. Many collectors are also active shooters. You can record which film stocks you have run through a camera, shutter count estimates, and any issues that came up — useful for a working collection.',
      },
    ],
    mockListItems: [
      { name: 'Leica M3 Double Stroke (1954)', badge: 'Excellent', value: '£1,450', tag: 'Serviced', selected: true },
      { name: 'Nikon F2 Photomic (1971)', badge: 'Very Good', value: '£320' },
      { name: 'Rolleiflex 2.8F (1960)', badge: 'Good — haze on rear element', value: '£680' },
      { name: 'Contax G2 + Zeiss 45mm', badge: 'Mint', value: '£1,100', tag: 'Kit' },
      { name: 'Olympus OM-1 (1972)', badge: 'Fair — light seals replaced', value: '£95' },
    ],
    mockDetail: {
      heading: 'Leica M3 Double Stroke (1954)',
      fields: [
        { label: 'Make / model', value: 'Leica M3 Double Stroke' },
        { label: 'Serial number', value: '700XXX' },
        { label: 'Production year', value: '1954' },
        { label: 'Condition', value: 'Excellent — no brassing' },
        { label: 'Last CLA', value: 'March 2022 — DAG Camera' },
        { label: 'Shutter speeds', value: 'All accurate to within 1/3 stop' },
        { label: 'Purchase price', value: '£900' },
        { label: 'Est. value', value: '£1,450' },
      ],
    },
  },

  {
    slug: 'sneaker-collection-app',
    name: 'Sneaker Collection App',
    metaTitle: 'Sneaker Collection App – Catalog & Track Your Sneakers',
    metaDescription:
      'The best app for sneaker collectors. Catalog Jordans, Yeezys, and limited releases. Track deadstock condition, size, and current market value. Free to start.',
    keywords: [
      'sneaker collection app',
      'sneaker inventory tracker',
      'best app to catalog sneakers',
      'jordan collection app',
      'sneakerhead collection management',
    ],
    h1: 'Sneaker Collection App',
    items: 'sneakers',
    collectorNoun: 'sneakerhead',
    answerCapsule:
      'Vitrine is a sneaker collection app for collectors who want more than a spreadsheet. Catalog Jordans, Yeezys, and limited releases. Record size, colourway, condition, and current market value. Share your collection publicly. Free to start.',
    schemaDescription:
      'Vitrine for sneaker collectors. Catalog limited releases, track deadstock condition and market value, and share your collection publicly.',
    painPoints: [
      {
        heading: 'Condition and deadstock status change value dramatically',
        body: 'A VNDS pair is worth significantly less than true deadstock. Vitrine lets you record exactly what you have — box condition, yellowing, and any wear — so your collection data is accurate.',
      },
      {
        heading: 'Tracking current market value is tedious in a spreadsheet',
        body: 'Prices move fast. Vitrine stores your cost and your current estimated value per pair, so you can see your collection value at a glance and update estimates when the market shifts.',
      },
      {
        heading: 'Photos are scattered across your phone',
        body: 'Vitrine gives every pair a permanent home for photos — box, sole, toe box, heel — all attached to the catalogue entry so nothing gets lost when you upgrade your phone.',
      },
    ],
    features: [
      {
        name: 'Size and colourway tracking',
        description: 'Record size, colourway name, SKU, and release year. Filter your collection by any of these in seconds.',
      },
      {
        name: 'Condition and deadstock status',
        description: 'Log deadstock, VNDS, worn, or beater condition. Add notes on yellowing, box condition, or sole wear.',
      },
      {
        name: 'Market value tracking',
        description: 'Record retail price, purchase price, and current estimated market value. See your total collection value and cost basis at a glance.',
      },
      {
        name: 'Photo storage',
        description: 'Attach multiple photos per pair — box, profile, sole, details. Useful for insurance and documenting condition.',
      },
      {
        name: 'Public collection page',
        description: 'Share a curated view of your collection. Control exactly which pairs are visible.',
      },
      {
        name: 'Bulk CSV import',
        description: 'Already tracking in a spreadsheet? Import it on Professional plans. Vitrine maps your columns and flags anything that needs review.',
      },
    ],
    steps: [
      {
        heading: 'Create a free account',
        body: 'Sign up at vitrinecms.com. No credit card required. Up to 100 pairs on the free plan.',
      },
      {
        heading: 'Add your pairs',
        body: 'Enter each pair with name, SKU, size, colourway, condition, and estimated value. Add notes for box condition, yellowing, or any other details.',
      },
      {
        heading: 'Attach photos',
        body: 'Photograph each pair and attach the images. Cover all angles — profile, sole, toe box, heel, and box.',
      },
      {
        heading: 'Share your collection page',
        body: 'Choose which pairs to make public and share the link. Useful for trading, flexing, and insurance purposes.',
      },
    ],
    competitors: [
      {
        name: 'GOAT / StockX',
        weakness: 'Marketplaces, not collection managers. Built for buying and selling, not cataloguing what you own.',
      },
      {
        name: 'Copdate',
        weakness: 'A release calendar and draw entry tool, not a collection management app.',
      },
      {
        name: 'Google Sheets',
        weakness: 'Manual, no photo storage, and no way to share your collection publicly in a clean format.',
      },
    ],
    faqs: [
      {
        question: 'Can I use Vitrine to track the value of my sneaker collection?',
        answer:
          'Yes. Add a purchase price and estimated current market value to each pair. Vitrine totals these so you can see your overall collection value and cost basis at a glance.',
      },
      {
        question: 'How do I record deadstock condition versus worn pairs?',
        answer:
          'Use the condition field to record deadstock, VNDS, worn, or beater status. Add more detail in the notes field — box condition, any yellowing, sole wear.',
      },
      {
        question: 'Can I catalog limited collabs and colourway variants?',
        answer:
          'Yes. Use the name, SKU, and notes fields to capture colourway names, collaboration details, and release information. There are no restrictions on what you can catalog.',
      },
      {
        question: 'Is this useful for insurance purposes?',
        answer:
          'Yes. A complete catalogue with photos and purchase prices is exactly what you need for an insurance claim. Vitrine keeps all of this in one place.',
      },
      {
        question: 'Can I track pairs I have sold or traded?',
        answer:
          'Yes. Mark items as deaccessioned and record the sale price. They stay in your history without cluttering your active collection view.',
      },
    ],
    mockListItems: [
      { name: 'Air Jordan 1 Retro High OG "Chicago" (2015)', badge: 'DS · Size 10', value: '£1,200', tag: 'Deadstock', selected: true },
      { name: 'Nike SB Dunk Low "Pigeon" (2005)', badge: 'VNDS · Size 9', value: '£3,400', tag: 'Grail' },
      { name: 'Adidas Yeezy 350 V2 "Zebra"', badge: 'DS · Size 9.5', value: '£280' },
      { name: 'New Balance 550 "White Green"', badge: 'DS · Size 10', value: '£140' },
      { name: 'Air Jordan 4 Retro "Bred" (2019)', badge: 'Worn · Size 10', value: '£320' },
    ],
    mockDetail: {
      heading: 'Air Jordan 1 Retro High OG "Chicago" (2015)',
      fields: [
        { label: 'Model', value: 'Air Jordan 1 Retro High OG' },
        { label: 'Colourway', value: 'Varsity Red / Black / White' },
        { label: 'SKU', value: '555088-101' },
        { label: 'Size', value: 'UK 9 / US 10' },
        { label: 'Condition', value: 'Deadstock — box complete' },
        { label: 'Retail price', value: '£120' },
        { label: 'Purchase price', value: '£280' },
        { label: 'Est. value', value: '£1,200' },
      ],
    },
  },

  {
    slug: 'sports-memorabilia-collection-app',
    name: 'Sports Memorabilia Collection App',
    metaTitle: 'Sports Memorabilia Collection App – Catalog Shirts, Programmes & Autographs',
    metaDescription:
      'The best app for sports memorabilia collectors. Catalog signed shirts, match programmes, autographs, and photographs. Track provenance and value. Free to start.',
    keywords: [
      'sports memorabilia collection app',
      'signed shirt catalogue software',
      'sports autograph collection tracker',
      'football memorabilia app',
      'sports collectibles management software',
    ],
    h1: 'Sports Memorabilia Collection App',
    items: 'memorabilia',
    collectorNoun: 'memorabilia collector',
    answerCapsule:
      'Vitrine is a sports memorabilia collection app for collectors of signed shirts, match programmes, autographs, and photographs. Record provenance, authentication certificates, and current value. Build a public showcase or keep it private. Free to start.',
    schemaDescription:
      'Vitrine for sports memorabilia collectors. Catalog signed shirts, programmes, autographs, and photographs. Track provenance, authentication, and value.',
    painPoints: [
      {
        heading: 'Provenance documentation gets lost',
        body: 'Where an item was obtained, who witnessed a signing, and what certificates exist can be difficult to reconstruct years later. Vitrine keeps this information permanently attached to each item.',
      },
      {
        heading: 'Condition affects value significantly',
        body: 'A signed shirt in excellent condition with full provenance is worth far more than the same item without documentation. Vitrine lets you record condition and attach certificate scans so your records match the physical reality.',
      },
      {
        heading: 'Insurance requires proper documentation',
        body: 'High-value signed items are expensive to replace and difficult to prove without records. Vitrine stores photos, valuations, and provenance information in one place.',
      },
    ],
    features: [
      {
        name: 'Provenance and authentication records',
        description: 'Record where an item was obtained, authentication certificate numbers, and witnessed signing details. Critical for value and insurance.',
      },
      {
        name: 'Condition tracking',
        description: 'Log framing status, fading, foxing, or any wear. Attach condition reports from valuers.',
      },
      {
        name: 'Value tracking',
        description: 'Record purchase price and current estimated value. Track insurance value separately where needed.',
      },
      {
        name: 'Photo storage',
        description: 'Attach photos of the item, the signature, and any certificates. Multiple images per item.',
      },
      {
        name: 'Public collection page',
        description: 'Share a curated view of your collection publicly. You control which items are visible.',
      },
      {
        name: 'Document storage',
        description: 'Attach PDFs of COAs, valuations, and purchase receipts on Professional plans.',
      },
    ],
    steps: [
      {
        heading: 'Create a free account',
        body: 'Sign up at vitrinecms.com. No credit card required. Your collection is private by default.',
      },
      {
        heading: 'Add your items',
        body: 'Enter each item with description, sport, player or team, condition, and estimated value. Record provenance details in the notes field.',
      },
      {
        heading: 'Attach photos and documents',
        body: 'Photograph each item and its signature. Attach certificate of authenticity scans and valuations as documents on Professional plans.',
      },
      {
        heading: 'Build your collection page',
        body: 'Make selected items public and share the link. Your page updates automatically as you add new pieces.',
      },
    ],
    competitors: [
      {
        name: 'eBay / Goldin',
        weakness: 'Marketplaces for selling, not tools for cataloguing and managing what you own.',
      },
      {
        name: 'PSA / Beckett',
        weakness: 'Grading and authentication services, not collection management tools. No way to catalog the full range of memorabilia you own.',
      },
      {
        name: 'Google Sheets',
        weakness: 'Manual and error-prone. No photo storage, no document attachments, and no public sharing.',
      },
    ],
    faqs: [
      {
        question: 'Can I catalog different types of memorabilia together?',
        answer:
          'Yes. Vitrine handles signed shirts, programmes, photographs, boots, balls, and any other physical items in one collection. Use categories to keep different types organised.',
      },
      {
        question: 'How do I record authentication certificates?',
        answer:
          'Record the certificate number and issuing organisation in the notes field. On Professional plans you can attach a scanned PDF of the COA directly to the item record.',
      },
      {
        question: 'Can I track the value of my collection over time?',
        answer:
          'Add a current estimated value to each item. Vitrine totals these across your collection. Update values whenever you get a new valuation or the market shifts.',
      },
      {
        question: 'Is Vitrine useful for insurance purposes?',
        answer:
          'Yes. A complete catalogue with photos, provenance notes, and purchase prices gives you the documentation you need for an insurance claim or valuation.',
      },
      {
        question: 'Can I share my collection with other collectors or for display?',
        answer:
          'Yes. Make selected items public on your collection page. You control exactly which items are visible and can share the link anywhere.',
      },
    ],
    mockListItems: [
      { name: 'Bobby Moore signed England shirt (1966)', badge: 'Framed · Excellent', value: '£8,500', tag: 'COA', selected: true },
      { name: 'Muhammad Ali signed photograph (1978)', badge: 'Very Good', value: '£2,200', tag: 'COA' },
      { name: 'FA Cup Final programme (1953)', badge: 'Good — minor foxing', value: '£320' },
      { name: 'George Best signed boots', badge: 'Good', value: '£1,800', tag: 'COA' },
      { name: 'Wembley 1966 World Cup ticket stub', badge: 'Fair', value: '£180' },
    ],
    mockDetail: {
      heading: 'Bobby Moore signed England shirt (1966)',
      fields: [
        { label: 'Item', value: 'England home shirt — 1966 World Cup era' },
        { label: 'Signed by', value: 'Bobby Moore' },
        { label: 'Condition', value: 'Excellent — framed with UV glass' },
        { label: 'Authentication', value: 'JSA COA — cert no. AA12345' },
        { label: 'Provenance', value: 'Direct from Moore estate, 1995' },
        { label: 'Insurance value', value: '£9,000' },
        { label: 'Purchase price', value: '£4,200' },
        { label: 'Est. value', value: '£8,500' },
      ],
    },
  },

  {
    slug: 'model-train-collection-app',
    name: 'Model Train Collection App',
    metaTitle: 'Model Train Collection App – Catalog Locomotives & Rolling Stock',
    metaDescription:
      'The best app for model railway collectors. Catalog locomotives, rolling stock, and accessories. Record gauge, manufacturer, and DCC decoder details. Free to start.',
    keywords: [
      'model train collection app',
      'model railway inventory software',
      'hornby collection tracker',
      'model locomotive catalogue app',
      'model railway management software',
    ],
    h1: 'Model Train Collection App',
    items: 'locomotives and rolling stock',
    collectorNoun: 'model railway collector',
    answerCapsule:
      'Vitrine is a model train collection app for OO, N, HO, and other gauge collectors. Catalog locomotives, rolling stock, and accessories by manufacturer, era, and livery. Record DCC decoder details, running condition, and value. Free to start.',
    schemaDescription:
      'Vitrine for model railway collectors. Catalog locomotives, rolling stock, and accessories. Record gauge, manufacturer, DCC details, and running condition.',
    painPoints: [
      {
        heading: 'Collections span manufacturers, gauges, and eras',
        body: 'Hornby, Bachmann, Märklin, and Heljan all have different numbering systems. Vitrine lets you keep everything in one place, organised by gauge, era, or whatever system makes sense to you.',
      },
      {
        heading: 'DCC decoder details need to be recorded',
        body: 'Which decoder is fitted, what address it runs on, and what sound files are loaded are easy to forget for a large fleet. Vitrine keeps these notes permanently attached to each locomotive.',
      },
      {
        heading: 'Values vary enormously by condition and rarity',
        body: 'A mint-in-box Hornby Dublo from the 1950s is worth very different money to a runner from the same era. Vitrine lets you track condition and value separately for each item.',
      },
    ],
    features: [
      {
        name: 'Gauge and manufacturer tracking',
        description: 'Catalog by gauge (OO, N, HO, O, G), manufacturer, catalogue number, and era. Filter your fleet in seconds.',
      },
      {
        name: 'DCC and running notes',
        description: 'Record decoder manufacturer, chip address, sound project, and running condition. Know exactly what each loco needs.',
      },
      {
        name: 'Condition and packaging',
        description: 'Log whether items are mint in box, unboxed, or running stock. Track any repairs or repaints.',
      },
      {
        name: 'Value tracking',
        description: 'Record purchase price and estimated current value. Useful for insurance and estate planning.',
      },
      {
        name: 'Photo storage',
        description: 'Attach photos of each model — both sides, roof detail, and box if present.',
      },
      {
        name: 'Public collection page',
        description: 'Share a page showing your fleet. You decide which items are publicly visible.',
      },
    ],
    steps: [
      {
        heading: 'Create a free account',
        body: 'Sign up at vitrinecms.com. No credit card required. Catalog up to 100 items on the free plan.',
      },
      {
        heading: 'Add your locomotives and rolling stock',
        body: 'Enter each item with manufacturer, catalogue number, gauge, livery, era, condition, and value. Record DCC details in the notes field.',
      },
      {
        heading: 'Attach photos',
        body: 'Photograph each model from both sides and add the images to the record. Include box shots for mint-in-box items.',
      },
      {
        heading: 'Build your collection page',
        body: 'Choose which items to make public and share the link with other modellers.',
      },
    ],
    competitors: [
      {
        name: 'RailAdvisor',
        weakness: 'Focused on tracking what to buy next, not cataloguing what you own with full condition and value records.',
      },
      {
        name: 'Excel / LibreOffice',
        weakness: 'Manual data entry, no photo storage, and nothing to help you share your collection with other modellers.',
      },
      {
        name: 'Manufacturer websites',
        weakness: 'Good for identifying models but not for recording your personal collection, condition, or values.',
      },
    ],
    faqs: [
      {
        question: 'Can I catalog multiple gauges in one collection?',
        answer:
          'Yes. Record the gauge for each item — OO, N, HO, O, G, or any other. You can filter by gauge to see a specific part of your fleet.',
      },
      {
        question: 'How do I record DCC decoder information?',
        answer:
          'Use the notes field to record decoder manufacturer, chip number, DCC address, and any sound project details. These stay permanently attached to that locomotive\'s record.',
      },
      {
        question: 'Can I use Vitrine for estate or insurance purposes?',
        answer:
          'Yes. A complete catalogue with photos, purchase prices, and condition notes is exactly what you need for an insurance valuation or estate documentation.',
      },
      {
        question: 'Does Vitrine look up catalogue numbers automatically?',
        answer:
          'Vitrine does not auto-populate from manufacturer databases, but you can record the catalogue number and reference it manually. This keeps your records accurate regardless of how a manufacturer updates their listings.',
      },
      {
        question: 'Can I share my collection with a model railway club?',
        answer:
          'Yes. Make selected items public on your collection page and share the link. Members can browse your fleet without needing a Vitrine account.',
      },
    ],
    mockListItems: [
      { name: 'Hornby R3393 A4 "Mallard" (OO)', badge: 'Mint in box', value: '£185', tag: 'DCC Sound', selected: true },
      { name: 'Bachmann 31-076 Class 37 "Grainflow" (OO)', badge: 'Very Good — runner', value: '£75' },
      { name: 'Märklin 3029 V200 Diesel (HO)', badge: 'Good — original box', value: '£120' },
      { name: 'Graham Farish 372-130 Class 08 (N)', badge: 'Excellent', value: '£55' },
      { name: 'Hornby Dublo 3221 A4 "Golden Fleece" (c.1958)', badge: 'Good — no box', value: '£95', tag: 'Vintage' },
    ],
    mockDetail: {
      heading: 'Hornby R3393 A4 "Mallard" (OO)',
      fields: [
        { label: 'Manufacturer', value: 'Hornby' },
        { label: 'Catalogue no.', value: 'R3393' },
        { label: 'Class / type', value: 'LNER A4 4-6-2' },
        { label: 'Gauge', value: 'OO (1:76)' },
        { label: 'Livery', value: 'LNER Garter Blue — BR lined green' },
        { label: 'DCC decoder', value: 'ESU LokSound 5 — Tornado profile' },
        { label: 'Condition', value: 'Mint in original box' },
        { label: 'Est. value', value: '£185' },
      ],
    },
  },

  {
    slug: 'fossil-mineral-collection-app',
    name: 'Fossil & Mineral Collection App',
    metaTitle: 'Fossil & Mineral Collection App – Catalog Specimens & Crystals',
    metaDescription:
      'The best app for fossil and mineral collectors. Catalog specimens, crystals, and meteorites. Record locality, formation, and acquisition details. Free to start.',
    keywords: [
      'fossil collection app',
      'mineral collection tracker',
      'crystal collection management software',
      'geological specimen catalogue',
      'fossil inventory app',
    ],
    h1: 'Fossil & Mineral Collection App',
    items: 'specimens',
    collectorNoun: 'fossil and mineral collector',
    answerCapsule:
      'Vitrine is a fossil and mineral collection app for geological collectors. Catalog fossils, minerals, crystals, and meteorites. Record locality, formation, acquisition details, and current value. Build a public showcase or keep it private. Free to start.',
    schemaDescription:
      'Vitrine for fossil and mineral collectors. Catalog specimens by locality, formation, and acquisition. Track condition and value.',
    painPoints: [
      {
        heading: 'Locality and provenance data gets separated from specimens',
        body: 'A fossil\'s scientific and commercial value depends heavily on where it was found. Vitrine keeps locality, formation, and acquisition details permanently attached to each specimen — not on a paper label that can go missing.',
      },
      {
        heading: 'Large collections are hard to search by hand',
        body: 'Finding a specific ammonite from the Jurassic of Dorset in boxes of specimens is slow. Vitrine lets you search and filter your collection by any field in seconds.',
      },
      {
        heading: 'No public way to share your collection',
        body: 'Geological societies and fellow collectors want to see what you have. Vitrine gives you a clean public collection page you can share with a link.',
      },
    ],
    features: [
      {
        name: 'Locality and formation records',
        description: 'Record locality, country, formation, geological period, and acquisition source. The most important fields for any scientific collection.',
      },
      {
        name: 'Identification and classification',
        description: 'Record genus, species, common name, and any identification notes. Useful for collections that span palaeontology and mineralogy.',
      },
      {
        name: 'Condition and dimensions',
        description: 'Log specimen dimensions, matrix condition, and any restoration or preparation notes.',
      },
      {
        name: 'Value tracking',
        description: 'Record purchase price and estimated current value. Useful for insurance and estate documentation.',
      },
      {
        name: 'Photo storage',
        description: 'Attach multiple photos per specimen from different angles. Essential for documentation and identification.',
      },
      {
        name: 'Public collection page',
        description: 'Share your collection with geological societies, dealers, and fellow collectors.',
      },
    ],
    steps: [
      {
        heading: 'Create a free account',
        body: 'Sign up at vitrinecms.com. No credit card required. Up to 100 specimens on the free plan.',
      },
      {
        heading: 'Add your specimens',
        body: 'Enter each specimen with name, locality, formation, geological period, condition, and estimated value. Record identification notes and acquisition source.',
      },
      {
        heading: 'Attach photos',
        body: 'Photograph each specimen from multiple angles and attach the images. Include scale bars where useful.',
      },
      {
        heading: 'Share your collection',
        body: 'Make selected items public and share the link with geological societies, show organisers, or other collectors.',
      },
    ],
    competitors: [
      {
        name: 'Mindat.org',
        weakness: 'A mineral database and locality reference, not a personal collection manager. No way to track what you personally own.',
      },
      {
        name: 'Paleobiology Database',
        weakness: 'A scientific reference database, not a tool for cataloguing a personal collection.',
      },
      {
        name: 'Google Sheets',
        weakness: 'Manual, no photo storage, and difficult to share with other collectors in a clean format.',
      },
    ],
    faqs: [
      {
        question: 'Can I catalog both fossils and minerals in the same collection?',
        answer:
          'Yes. Vitrine places no restrictions on what you catalog. Use the category field to separate fossils, minerals, crystals, and meteorites within the same account.',
      },
      {
        question: 'How do I record locality information?',
        answer:
          'Use the acquisition and notes fields to record locality, quarry or site name, formation, geological period, and how you acquired the specimen. This information stays permanently attached to the record.',
      },
      {
        question: 'Can I record the dimensions of specimens?',
        answer:
          'Yes. Use the notes or description fields to record dimensions, matrix size, and any preparation details. There are no restrictions on what information you can capture.',
      },
      {
        question: 'Is Vitrine useful for a dealer or a personal collector?',
        answer:
          'Vitrine is designed for personal and institutional collections, not for marketplace listings. It works well for serious private collectors, geological societies, and small museum collections.',
      },
      {
        question: 'Can I share specimens with a geological society or club?',
        answer:
          'Yes. Make selected specimens public on your collection page and share the link. Members can view your collection without needing a Vitrine account.',
      },
    ],
    mockListItems: [
      { name: 'Asteroceras ammonite — Charmouth, Jurassic', badge: 'Excellent', value: '£180', tag: 'Prep\'d', selected: true },
      { name: 'Dioptase on calcite — Congo', badge: 'Museum quality', value: '£420' },
      { name: 'Triceratops tooth — Hell Creek Fm., Montana', badge: 'Good', value: '£95', tag: 'COA' },
      { name: 'Pallasite meteorite slice — Esquel, 18g', badge: 'Excellent', value: '£520' },
      { name: 'Pyrite sun — Sparta, Illinois', badge: 'Very Good', value: '£65' },
    ],
    mockDetail: {
      heading: 'Asteroceras ammonite — Charmouth, Jurassic',
      fields: [
        { label: 'Genus / species', value: 'Asteroceras obtusum' },
        { label: 'Locality', value: 'Black Ven, Charmouth, Dorset, UK' },
        { label: 'Formation', value: 'Lower Lias — Obtusum Zone' },
        { label: 'Period', value: 'Early Jurassic (Sinemurian)' },
        { label: 'Dimensions', value: '14 × 12 × 6 cm' },
        { label: 'Condition', value: 'Excellent — full suturing visible' },
        { label: 'Purchase price', value: '£90' },
        { label: 'Est. value', value: '£180' },
      ],
    },
  },

  {
    slug: 'funko-pop-collection-app',
    name: 'Funko Pop Collection App',
    metaTitle: 'Funko Pop Collection App – Catalog & Track Your Funko Pops',
    metaDescription:
      'The best app for Funko Pop collectors. Catalog standard, chase, and exclusive Pops. Track box condition, variant details, and current value. Free to start.',
    keywords: [
      'funko pop collection app',
      'funko pop inventory tracker',
      'best app to catalog funko pops',
      'funko pop collection manager',
      'funko pop database app',
    ],
    h1: 'Funko Pop Collection App',
    items: 'Funko Pops',
    collectorNoun: 'Funko collector',
    answerCapsule:
      'Vitrine is a Funko Pop collection app that lets you catalog standard, chase, and exclusive Pops in one place. Record variant details, box condition, and current estimated value. Share your collection publicly. Free to start.',
    schemaDescription:
      'Vitrine for Funko Pop collectors. Catalog standard, chase, and exclusive Pops. Track variant details, box condition, and value.',
    painPoints: [
      {
        heading: 'Chase and variant tracking is confusing in a spreadsheet',
        body: 'A standard Pop and its chase variant look almost identical but are worth very different amounts. Vitrine lets you record variant type, item number, and sticker exclusivity so your catalogue is accurate.',
      },
      {
        heading: 'Box condition significantly affects value',
        body: 'Mint in box versus good box versus box damage changes what a Pop is worth. Vitrine has a dedicated condition field so you can track this properly.',
      },
      {
        heading: 'Large collections are hard to search',
        body: 'Hundreds of Pops across multiple fandoms are impossible to navigate by eye. Vitrine lets you filter and search by fandom, line, or any other field.',
      },
    ],
    features: [
      {
        name: 'Variant and exclusivity tracking',
        description: 'Record whether a Pop is standard, chase, flocked, glow, metallic, or an exclusive. Log the retailer exclusivity and sticker type.',
      },
      {
        name: 'Item number and line tracking',
        description: 'Record the Pop number, line name, and fandom. Filter your collection by line or fandom in seconds.',
      },
      {
        name: 'Box condition tracking',
        description: 'Log box condition — mint, very good, good, or damaged. Critical for tracking value accurately.',
      },
      {
        name: 'Value tracking',
        description: 'Record retail price and current estimated value. See your total collection value at a glance.',
      },
      {
        name: 'Photo storage',
        description: 'Attach photos of the Pop and the box. Useful for insurance and for showing off grail pieces.',
      },
      {
        name: 'Public collection page',
        description: 'Share a public page showing your collection. You control which Pops are visible.',
      },
    ],
    steps: [
      {
        heading: 'Create a free account',
        body: 'Sign up at vitrinecms.com. No credit card required. Up to 100 Pops on the free plan.',
      },
      {
        heading: 'Add your Pops',
        body: 'Enter each Pop with line name, item number, variant type, box condition, and estimated value.',
      },
      {
        heading: 'Record exclusivity and sticker details',
        body: 'Note the retailer exclusivity (Hot Topic, Funko Shop, SDCC, etc.) and sticker type in the notes field.',
      },
      {
        heading: 'Share your collection page',
        body: 'Make selected Pops public and share the link with other collectors.',
      },
    ],
    competitors: [
      {
        name: 'Funko App',
        weakness: 'Official app for browsing the catalogue, not a full collection manager with condition tracking, value records, and custom notes.',
      },
      {
        name: 'PopPrice Guide',
        weakness: 'A value guide and marketplace tool. Limited cataloguing features for recording your own collection details.',
      },
      {
        name: 'Google Sheets',
        weakness: 'Manual and inflexible. No photo storage and no way to share your collection publicly.',
      },
    ],
    faqs: [
      {
        question: 'How do I track chase variants separately from standard Pops?',
        answer:
          'Add each variant as a separate entry. Use the notes or condition field to record the variant type — chase, flocked, glow, metallic — and the item number. This keeps your value estimates accurate for each variant.',
      },
      {
        question: 'Can I track the exclusivity sticker for each Pop?',
        answer:
          'Yes. Record the retailer exclusivity and sticker type in the notes field — Hot Topic, Target, SDCC, Funko Shop, and so on.',
      },
      {
        question: 'How do I catalog Pops I have in box versus out of box?',
        answer:
          'Use the condition field to record whether a Pop is mint in box, unboxed, or something in between. Add detail on box condition — corner dents, creases — in the notes.',
      },
      {
        question: 'Can I share my collection with other Funko fans?',
        answer:
          'Yes. Make selected Pops public on your collection page and share the link.',
      },
      {
        question: 'Can I import my existing spreadsheet?',
        answer:
          'Yes, on Professional plans. Export your spreadsheet as CSV, import it into Vitrine, and map your columns. You can review everything before the import commits.',
      },
    ],
    mockListItems: [
      { name: 'Batman (1989) #337 — SDCC Exclusive', badge: 'MIB · Mint', value: '£210', tag: 'Exclusive', selected: true },
      { name: 'Vegeta #10 — Chase', badge: 'MIB · Very Good', value: '£85', tag: 'Chase' },
      { name: 'Alien #31 — Metallic', badge: 'MIB · Good box', value: '£140', tag: 'Metallic' },
      { name: 'Darth Vader #01 (2011 original)', badge: 'MIB · Very Good', value: '£95', tag: 'Original' },
      { name: 'Pennywise #55 — Flocked', badge: 'MIB · Mint', value: '£55', tag: 'Flocked' },
    ],
    mockDetail: {
      heading: 'Batman (1989) #337 — SDCC Exclusive',
      fields: [
        { label: 'Line', value: 'DC Comics — Batman (1989)' },
        { label: 'Item number', value: '#337' },
        { label: 'Variant', value: 'SDCC 2017 Exclusive' },
        { label: 'Sticker', value: 'SDCC 2017 — Funko sticker present' },
        { label: 'Box condition', value: 'Mint — no dents or creases' },
        { label: 'Retail price', value: '£15' },
        { label: 'Purchase price', value: '£80' },
        { label: 'Est. value', value: '£210' },
      ],
    },
  },

  {
    slug: 'board-game-collection-app',
    name: 'Board Game Collection App',
    metaTitle: 'Board Game Collection App – Catalog Your Board Games & Expansions',
    metaDescription:
      'The best app for board game collectors. Catalog games, expansions, and Kickstarter exclusives. Track completeness, condition, and value. Free to start.',
    keywords: [
      'board game collection app',
      'board game inventory tracker',
      'best app to catalog board games',
      'tabletop game collection management',
      'board game library software',
    ],
    h1: 'Board Game Collection App',
    items: 'board games',
    collectorNoun: 'board game collector',
    answerCapsule:
      'Vitrine is a board game collection app for hobbyists who want a proper record of their library. Catalog games, expansions, and Kickstarter exclusives. Track completeness, component condition, and estimated value. Share your collection page publicly. Free to start.',
    schemaDescription:
      'Vitrine for board game collectors. Catalog games and expansions. Track completeness, condition, and value.',
    painPoints: [
      {
        heading: 'Expansions and promos are hard to track with a game',
        body: 'BoardGameGeek is great for discovery but not for tracking which expansions you own, which promos are included, and which Kickstarter extras came in which pledge level. Vitrine keeps your full library organised by base game.',
      },
      {
        heading: 'Kickstarter exclusives need special documentation',
        body: 'Knowing which KS campaign you backed, what pledge level you chose, and what extras were included is important for completeness and resale. Vitrine lets you record all of this in the notes field.',
      },
      {
        heading: 'Component completeness affects value',
        body: 'A game missing its rulebook or key tokens is worth significantly less than a complete copy. Vitrine has a condition field and notes section so you know exactly what is and is not in every box.',
      },
    ],
    features: [
      {
        name: 'Base game and expansion tracking',
        description: 'Catalog base games, expansions, promo packs, and accessories together. Use categories and notes to group everything belonging to the same title.',
      },
      {
        name: 'Completeness and condition tracking',
        description: 'Record whether components are complete, punched or unpunched, and log any missing pieces.',
      },
      {
        name: 'Value tracking',
        description: 'Record retail price and current estimated value. Useful for insurance and if you ever want to sell.',
      },
      {
        name: 'Photo storage',
        description: 'Attach photos of boxes, components, and Kickstarter inserts.',
      },
      {
        name: 'Public collection page',
        description: 'Share your library publicly. Useful for gaming groups and conventions.',
      },
      {
        name: 'Bulk CSV import',
        description: 'Import a BGG export or existing spreadsheet on Professional plans.',
      },
    ],
    steps: [
      {
        heading: 'Create a free account',
        body: 'Sign up at vitrinecms.com. No credit card required. Up to 100 titles on the free plan.',
      },
      {
        heading: 'Add your games and expansions',
        body: 'Enter each title with publisher, player count, condition, completeness, and estimated value. Note any Kickstarter details in the notes field.',
      },
      {
        heading: 'Record completeness',
        body: 'Note whether all components are present and in what condition. Flag any missing pieces.',
      },
      {
        heading: 'Share your library',
        body: 'Make your collection public and share the link with your gaming group.',
      },
    ],
    competitors: [
      {
        name: 'BoardGameGeek',
        weakness: 'Excellent for discovery and reviews but not a personal collection manager. Limited condition and value tracking for your own copies.',
      },
      {
        name: 'Dized',
        weakness: 'Focused on rules tutorials, not collection cataloguing.',
      },
      {
        name: 'Google Sheets',
        weakness: 'Manual and inflexible. No photo storage and no way to share your library in a clean format.',
      },
    ],
    faqs: [
      {
        question: 'Can I track expansions and promos separately from the base game?',
        answer:
          'Yes. Add each expansion as its own entry and note in the description which base game it belongs to. You can use the category field to group everything together.',
      },
      {
        question: 'How do I record Kickstarter exclusives and pledge levels?',
        answer:
          'Use the notes field to record the campaign name, pledge level, and what extras were included. This information stays permanently attached to that entry.',
      },
      {
        question: 'Can I import my BGG collection?',
        answer:
          'BGG allows you to export your collection as CSV. On Professional plans you can import that CSV into Vitrine, map the columns, and review before committing.',
      },
      {
        question: 'Is Vitrine useful for a gaming group that loans games out?',
        answer:
          'Yes. Use the status field to mark games as on loan and record who has them. The loans feature on Professional plans adds due dates and return tracking.',
      },
      {
        question: 'Can I share my collection with my gaming group?',
        answer:
          'Yes. Make selected games public on your collection page and share the link. Group members can see what you own without needing a Vitrine account.',
      },
    ],
    mockListItems: [
      { name: 'Gloomhaven (2017, KS Edition)', badge: 'Complete · Punched', value: '£120', tag: 'KS', selected: true },
      { name: 'Wingspan + European Expansion', badge: 'Complete · Near Mint', value: '£60' },
      { name: 'Twilight Imperium 4th Ed.', badge: 'Complete · Good', value: '£95' },
      { name: 'Root + Underworld Expansion', badge: 'Complete · Excellent', value: '£75' },
      { name: 'Pandemic Legacy Season 1', badge: 'Sealed', value: '£55', tag: 'Sealed' },
    ],
    mockDetail: {
      heading: 'Gloomhaven (2017, KS Edition)',
      fields: [
        { label: 'Publisher', value: 'Cephalofair Games' },
        { label: 'Year', value: '2017 (Kickstarter 1st printing)' },
        { label: 'Players', value: '1–4' },
        { label: 'Condition', value: 'Complete — all components present' },
        { label: 'KS extras', value: 'Foam insert, promo cards, painted miniature set' },
        { label: 'Status', value: 'Campaign in progress (Scenario 14)' },
        { label: 'Purchase price', value: '£80' },
        { label: 'Est. value', value: '£120' },
      ],
    },
  },

  {
    slug: 'antique-collection-app',
    name: 'Antique Collection App',
    metaTitle: 'Antique Collection App – Catalog Ceramics, Silver & Furniture',
    metaDescription:
      'The best app for antique collectors. Catalog ceramics, silver, furniture, and decorative arts. Record maker\'s marks, provenance, and insurance value. Free to start.',
    keywords: [
      'antique collection app',
      'antique inventory software',
      'antique catalogue management',
      'decorative arts collection app',
      'antiques collection tracking software',
    ],
    h1: 'Antique Collection App',
    items: 'antiques',
    collectorNoun: 'antique collector',
    answerCapsule:
      'Vitrine is an antique collection app for collectors of ceramics, silver, furniture, and decorative arts. Record maker\'s marks, provenance, condition, and insurance value. Attach photographs and valuation documents. Free to start.',
    schemaDescription:
      'Vitrine for antique collectors. Catalog ceramics, silver, furniture, and decorative arts. Record maker\'s marks, provenance, condition, and insurance value.',
    painPoints: [
      {
        heading: 'Maker\'s marks and attribution need to be recorded properly',
        body: 'The difference between a piece attributed to a workshop and one with a confirmed maker\'s mark can be thousands of pounds. Vitrine keeps this information permanently attached to each item, not on a paper label that can become detached.',
      },
      {
        heading: 'Provenance documentation is scattered',
        body: 'Auction catalogues, purchase receipts, and previous valuation reports live in different places. Vitrine gives you a single record per item with attached documents on Professional plans.',
      },
      {
        heading: 'Insurance valuations go out of date',
        body: 'Antique markets move. Vitrine lets you update estimated values and record the date of the last professional valuation, so your insurance cover stays accurate.',
      },
    ],
    features: [
      {
        name: 'Attribution and maker\'s marks',
        description: 'Record maker, workshop, factory mark, attribution confidence, and any reference numbers from standard catalogues.',
      },
      {
        name: 'Provenance records',
        description: 'Document auction house, sale date, lot number, previous owners, and any exhibition history.',
      },
      {
        name: 'Condition reporting',
        description: 'Log chips, cracks, restoration, and any conservation notes. Record the date of last professional assessment.',
      },
      {
        name: 'Insurance value tracking',
        description: 'Record purchase price, current estimated value, and insurance replacement value separately.',
      },
      {
        name: 'Photo storage',
        description: 'Attach multiple photos per item — overall, detail, marks, and base.',
      },
      {
        name: 'Document storage',
        description: 'Attach PDFs of valuations, auction records, and provenance documents on Professional plans.',
      },
    ],
    steps: [
      {
        heading: 'Create a free account',
        body: 'Sign up at vitrinecms.com. No credit card required. Up to 100 items on the free plan.',
      },
      {
        heading: 'Add your items',
        body: 'Enter each antique with description, maker, period, medium, condition, and estimated value. Record provenance and attribution in the notes field.',
      },
      {
        heading: 'Attach photos and documents',
        body: 'Photograph each item thoroughly — overall, marks, damage, base. Attach valuation documents on Professional plans.',
      },
      {
        heading: 'Keep values up to date',
        body: 'Update estimated values when you receive a new valuation. Record the valuation date in the notes field.',
      },
    ],
    competitors: [
      {
        name: 'LiveAuctioneers',
        weakness: 'A marketplace and auction archive. Useful for price research but not for cataloguing and managing your personal collection.',
      },
      {
        name: 'The Antiques Trade Gazette',
        weakness: 'A trade publication and auction index, not a personal collection management tool.',
      },
      {
        name: 'Google Sheets',
        weakness: 'Manual, no photo or document storage, and no public sharing capability.',
      },
    ],
    faqs: [
      {
        question: 'Can I catalog different categories of antiques in one collection?',
        answer:
          'Yes. Use the category field to separate ceramics, silver, furniture, glass, and other categories within the same collection.',
      },
      {
        question: 'How do I record maker\'s marks and attribution?',
        answer:
          'Use the maker and notes fields to record the mark description, attribution confidence, and any reference to standard catalogues (Jewitt, Chaffers, etc.).',
      },
      {
        question: 'Can I attach valuation documents?',
        answer:
          'Yes, on Professional plans. Attach PDFs of formal valuations, auction records, and any other documentation directly to the item record.',
      },
      {
        question: 'Is Vitrine useful for estate purposes?',
        answer:
          'Yes. A complete catalogue with photos, provenance, and values is exactly what solicitors and valuers need when handling an estate.',
      },
      {
        question: 'Can I share my collection with a dealer or valuer?',
        answer:
          'Yes. Make selected items public on your collection page and share the link, or keep everything private and export the record information.',
      },
    ],
    mockListItems: [
      { name: 'Worcester porcelain vase, c.1770 (Flight period)', badge: 'Very Good — hairline to base', value: '£2,800', tag: 'Documented', selected: true },
      { name: 'George III silver salt cellar, London 1784', badge: 'Excellent', value: '£640' },
      { name: 'Staffordshire pearlware jug, c.1810', badge: 'Good — restored chip', value: '£220' },
      { name: 'Regency rosewood card table, c.1820', badge: 'Good — surface marks', value: '£1,400' },
      { name: 'Chelsea porcelain figure, c.1760 (Red Anchor)', badge: 'Fair — repaired', value: '£480', tag: 'Repaired' },
    ],
    mockDetail: {
      heading: 'Worcester porcelain vase, c.1770 (Flight period)',
      fields: [
        { label: 'Maker / factory', value: 'Royal Worcester — Flight period' },
        { label: 'Period', value: 'c.1770 (pre-Flight)' },
        { label: 'Mark', value: 'Crescent mark in underglaze blue' },
        { label: 'Medium', value: 'Soft-paste porcelain, polychrome enamel' },
        { label: 'Dimensions', value: 'H 28 cm' },
        { label: 'Condition', value: 'Very Good — hairline crack to foot rim' },
        { label: 'Provenance', value: 'Christie\'s, London, March 2008, lot 42' },
        { label: 'Insurance value', value: '£3,200' },
      ],
    },
  },

  {
    slug: 'military-memorabilia-collection-app',
    name: 'Military Memorabilia Collection App',
    metaTitle: 'Military Memorabilia Collection App – Catalog Medals, Uniforms & Documents',
    metaDescription:
      'The best app for military collectors. Catalog medals, uniforms, badges, and documents. Record recipient history, provenance, and research notes. Free to start.',
    keywords: [
      'military memorabilia collection app',
      'medal collection management software',
      'militaria collection tracker',
      'military collectibles catalogue app',
      'war medal collection app',
    ],
    h1: 'Military Memorabilia Collection App',
    items: 'militaria',
    collectorNoun: 'militaria collector',
    answerCapsule:
      'Vitrine is a military memorabilia collection app for collectors of medals, uniforms, badges, and documents. Record recipient research, provenance, condition, and current value. Attach photographs and research documents. Free to start.',
    schemaDescription:
      'Vitrine for militaria collectors. Catalog medals, uniforms, badges, and documents. Record recipient history, provenance, and research notes.',
    painPoints: [
      {
        heading: 'Recipient research and provenance need to travel with items',
        body: 'Years of medal research — service records, roll lookups, newspaper mentions — can become separated from the items themselves. Vitrine keeps this research permanently attached to each piece.',
      },
      {
        heading: 'Groups and associated items need to be linked',
        body: 'A medal group has more value together than apart. Vitrine lets you note which items belong together and track the provenance of the group as a whole.',
      },
      {
        heading: 'Condition and completeness affect value significantly',
        body: 'Whether a medal retains its original ribbon, whether a uniform is complete with its buttons, matters for both historical value and resale. Vitrine tracks this properly.',
      },
    ],
    features: [
      {
        name: 'Recipient and service records',
        description: 'Record recipient name, rank, unit, service number, and dates. Attach research notes and archive references.',
      },
      {
        name: 'Provenance documentation',
        description: 'Record previous owners, auction history, and any known exhibition or publication record.',
      },
      {
        name: 'Condition tracking',
        description: 'Log ribbon condition, naming style (impressed, engraved, running script), and any damage or replacement parts.',
      },
      {
        name: 'Value tracking',
        description: 'Record purchase price and current estimated value. Track group values separately from individual items.',
      },
      {
        name: 'Photo storage',
        description: 'Attach photos of the obverse, reverse, ribbon, and any associated documents.',
      },
      {
        name: 'Document storage',
        description: 'Attach scanned service records, auction catalogues, and research documents on Professional plans.',
      },
    ],
    steps: [
      {
        heading: 'Create a free account',
        body: 'Sign up at vitrinecms.com. No credit card required. Up to 100 items on the free plan.',
      },
      {
        heading: 'Add your items',
        body: 'Enter each item with description, period, country of origin, condition, and estimated value. Record recipient details and provenance in the notes field.',
      },
      {
        heading: 'Attach research and photos',
        body: 'Photograph each item — obverse, reverse, detail — and attach scanned research documents on Professional plans.',
      },
      {
        heading: 'Build your collection record',
        body: 'Keep all research attached to each item permanently. Share selected items publicly or keep the collection private.',
      },
    ],
    competitors: [
      {
        name: 'DNW / Dix Noonan Webb',
        weakness: 'An auction house and price archive. Useful for valuation research but not for managing your personal collection.',
      },
      {
        name: 'Medal Yearbook',
        weakness: 'A reference guide and value guide. Not a tool for cataloguing and managing what you personally own.',
      },
      {
        name: 'Google Sheets',
        weakness: 'Manual and clunky. No way to attach research documents or photographs alongside catalogue data.',
      },
    ],
    faqs: [
      {
        question: 'Can I catalog different types of militaria together?',
        answer:
          'Yes. Catalog medals, uniforms, badges, headgear, documents, and weapons (where legally held) in a single collection. Use categories to organise by type, period, or nationality.',
      },
      {
        question: 'How do I record research I have done on a recipient?',
        answer:
          'Record research notes — service record references, roll confirmations, newspaper mentions — in the notes field. On Professional plans, attach scanned documents directly to the item record.',
      },
      {
        question: 'Can I track a medal group as a unit?',
        answer:
          'Yes. Add each medal as an individual item and note in each record which other items it belongs with. You can use the same category name to group them together.',
      },
      {
        question: 'Is Vitrine useful for insurance purposes?',
        answer:
          'Yes. A catalogue with photographs, provenance notes, and current estimated values is exactly what you need for an insurance claim or formal valuation.',
      },
      {
        question: 'Can I share my collection with a militaria society?',
        answer:
          'Yes. Make selected items public on your collection page and share the link with society members.',
      },
    ],
    mockListItems: [
      { name: 'Victoria Cross — Pte. John Smith, 1/Coldstream Guards, 1916', badge: 'Good — original ribbon', value: '£280,000', tag: 'Named', selected: true },
      { name: 'Military Medal group (3) — Cpl. T. Hughes, RFA, 1914–18', badge: 'Very Good', value: '£1,800', tag: 'Group' },
      { name: 'British Army officer\'s peaked cap, c.1940', badge: 'Fair — moth damage to peak', value: '£85' },
      { name: 'Luftwaffe pilot\'s badge (Flugzeugführerabzeichen)', badge: 'Very Good', value: '£420' },
      { name: '1914 Mons Star — Pte. W. Atkins, ASC', badge: 'Excellent — named', value: '£95', tag: 'Named' },
    ],
    mockDetail: {
      heading: 'Military Medal group (3) — Cpl. T. Hughes, RFA, 1914–18',
      fields: [
        { label: 'Recipient', value: 'Cpl. Thomas Hughes, 42nd Battery, RFA' },
        { label: 'Service no.', value: '12345' },
        { label: 'Medals', value: 'MM, 1914–15 Star, BWM' },
        { label: 'Condition', value: 'Very Good — original ribbons' },
        { label: 'Naming style', value: 'Impressed — MM unnamed, stars named' },
        { label: 'Research', value: 'Medal Index Card confirmed. MIC ref: WO 372/10' },
        { label: 'Purchase price', value: '£820' },
        { label: 'Est. value', value: '£1,800' },
      ],
    },
  },

  {
    slug: 'jewelry-collection-app',
    name: 'Jewellery Collection App',
    metaTitle: 'Jewellery Collection App – Catalog Rings, Necklaces & Gemstones',
    metaDescription:
      'The best app for jewellery collectors. Catalog rings, necklaces, and gemstones. Record hallmarks, gemstone details, and insurance value. Free to start.',
    keywords: [
      'jewellery collection app',
      'jewelry collection management software',
      'jewellery inventory tracker',
      'gemstone collection app',
      'fine jewellery catalogue software',
    ],
    h1: 'Jewellery Collection App',
    items: 'jewellery',
    collectorNoun: 'jewellery collector',
    answerCapsule:
      'Vitrine is a jewellery collection app for collectors of rings, necklaces, brooches, and gemstones. Record hallmarks, gemstone details, provenance, and insurance value. Attach photographs and valuation documents. Free to start.',
    schemaDescription:
      'Vitrine for jewellery collectors. Catalog rings, necklaces, and gemstones. Record hallmarks, gemstone details, and insurance value.',
    painPoints: [
      {
        heading: 'Insurance requires proper documentation',
        body: 'Without photographs, valuations, and hallmark records, an insurance claim for lost or stolen jewellery is difficult to support. Vitrine keeps all of this in one place.',
      },
      {
        heading: 'Gemstone details need to be permanently recorded',
        body: 'Cut, carat weight, colour, and clarity are not always documented by retailers. Once the certificate gets separated from a piece, these details are hard to recover. Vitrine keeps them permanently attached.',
      },
      {
        heading: 'Inherited jewellery often lacks documentation',
        body: 'Family jewellery passed down through generations rarely comes with records. Vitrine lets you create that record now — before another generation loses track of what exists and what it is worth.',
      },
    ],
    features: [
      {
        name: 'Hallmark and metalwork records',
        description: 'Record metal type, hallmarks, maker\'s mark, and assay office. Reference for insurance, valuation, and dating.',
      },
      {
        name: 'Gemstone details',
        description: 'Record stone type, cut, carat weight, colour, clarity, and any grading certificate references.',
      },
      {
        name: 'Provenance and maker records',
        description: 'Document maker, retailer, purchase date, and any exhibition or publication history.',
      },
      {
        name: 'Insurance value tracking',
        description: 'Record purchase price, current estimated value, and insurance replacement value. Update values when you receive a new valuation.',
      },
      {
        name: 'Photo storage',
        description: 'Attach photos of each piece — worn, flat, detail of marks and stones.',
      },
      {
        name: 'Document storage',
        description: 'Attach PDFs of valuations, gemstone certificates, and purchase receipts on Professional plans.',
      },
    ],
    steps: [
      {
        heading: 'Create a free account',
        body: 'Sign up at vitrinecms.com. No credit card required. Up to 100 items on the free plan.',
      },
      {
        heading: 'Add your pieces',
        body: 'Enter each item with description, metal, hallmarks, gemstone details, maker, and insurance value.',
      },
      {
        heading: 'Attach photos and valuation documents',
        body: 'Photograph each piece thoroughly. Attach gemstone certificates and valuations on Professional plans.',
      },
      {
        heading: 'Keep values up to date',
        body: 'Update estimated values when you receive a new professional valuation. Record the date so you know when it is next due.',
      },
    ],
    competitors: [
      {
        name: 'Worthpoint',
        weakness: 'A price guide and auction archive. Useful for research but not for managing your personal collection.',
      },
      {
        name: 'Excel spreadsheet',
        weakness: 'Manual, no photo or document storage, and difficult to share with valuers or insurers.',
      },
      {
        name: 'Notes app / paper records',
        weakness: 'Easily lost, hard to search, and no photo attachment capability.',
      },
    ],
    faqs: [
      {
        question: 'Can I catalog different types of jewellery together?',
        answer:
          'Yes. Catalog rings, necklaces, bracelets, brooches, earrings, and loose stones in one collection. Use categories to organise by type.',
      },
      {
        question: 'How do I record hallmarks?',
        answer:
          'Use the notes field to record the metal type, hallmark symbols (date letter, assay office, maker\'s mark), and any other marks present.',
      },
      {
        question: 'Can I attach gemstone certificates?',
        answer:
          'Yes, on Professional plans. Attach PDFs of GIA, HRD, or other gemstone grading certificates directly to the item record.',
      },
      {
        question: 'Is Vitrine useful for inherited jewellery?',
        answer:
          'Yes. Creating a proper record now — with photos, descriptions, and estimated values — is the most useful thing you can do for inherited pieces that lack documentation.',
      },
      {
        question: 'Can I share my catalogue with a valuer or insurer?',
        answer:
          'You can make selected items public on your collection page and share the link, or keep everything private and refer valuers to specific records.',
      },
    ],
    mockListItems: [
      { name: 'Art Deco platinum diamond ring, c.1925', badge: 'Excellent', value: '£4,800', tag: 'Valued 2024', selected: true },
      { name: 'Victorian gold brooch — 18ct, c.1880', badge: 'Very Good', value: '£1,200' },
      { name: 'Sapphire and diamond necklace — Mappin & Webb, 1965', badge: 'Excellent', value: '£6,500', tag: 'Certificate' },
      { name: 'Georgian mourning ring — hair work, c.1820', badge: 'Good — minor enamel loss', value: '£680' },
      { name: 'Edwardian pearl earrings — natural, tested', badge: 'Excellent', value: '£2,100', tag: 'Tested' },
    ],
    mockDetail: {
      heading: 'Art Deco platinum diamond ring, c.1925',
      fields: [
        { label: 'Description', value: 'Platinum filigree ring, old European cut diamond centre' },
        { label: 'Period', value: 'Art Deco, c.1925' },
        { label: 'Metal', value: 'Platinum — UK hallmark, Edinburgh' },
        { label: 'Centre stone', value: 'Diamond, 1.2ct, G colour, VS1 — GIA cert #12345' },
        { label: 'Condition', value: 'Excellent — no repairs or alterations' },
        { label: 'Last valued', value: 'March 2024 — Bonhams' },
        { label: 'Insurance value', value: '£5,500' },
        { label: 'Est. market value', value: '£4,800' },
      ],
    },
  },

  {
    slug: 'vintage-clothing-collection-app',
    name: 'Vintage Clothing Collection App',
    metaTitle: 'Vintage Clothing Collection App – Catalog Fashion & Costume',
    metaDescription:
      'The best app for vintage clothing collectors. Catalog garments, accessories, and costume. Record label details, condition, and value. Free to start.',
    keywords: [
      'vintage clothing collection app',
      'vintage fashion catalogue software',
      'costume collection management app',
      'vintage wardrobe inventory tracker',
      'fashion archive management software',
    ],
    h1: 'Vintage Clothing Collection App',
    items: 'garments',
    collectorNoun: 'vintage clothing collector',
    answerCapsule:
      'Vitrine is a vintage clothing collection app for collectors and curators of fashion and costume. Catalog garments, accessories, and textiles. Record label details, provenance, condition, and estimated value. Share your collection publicly. Free to start.',
    schemaDescription:
      'Vitrine for vintage clothing collectors. Catalog garments and accessories. Record label details, condition, provenance, and value.',
    painPoints: [
      {
        heading: 'Label details and provenance are hard to record alongside the physical garment',
        body: 'Designer, country of manufacture, fabric composition, and care label information are all important for dating and attributing a garment. Vitrine keeps this permanently attached to each record.',
      },
      {
        heading: 'Condition tracking is essential for textiles',
        body: 'Moths, fading, seam stress, and alterations all affect a garment\'s value and wearability. Vitrine has a dedicated condition field and notes section for detailed condition reporting.',
      },
      {
        heading: 'Photos are scattered and not linked to catalogue records',
        body: 'Vitrine gives every garment a permanent home for photographs — flat, worn, label, and detail — all attached to the record and searchable.',
      },
    ],
    features: [
      {
        name: 'Label and attribution records',
        description: 'Record designer, label name, country of origin, fabric composition, and dating evidence. Essential for attribution and valuation.',
      },
      {
        name: 'Condition reporting',
        description: 'Log fading, moth damage, alterations, repairs, and any conservation treatment. Record the date of last assessment.',
      },
      {
        name: 'Size and measurements',
        description: 'Record contemporary label size and actual measurements. Useful for wearable collections and loans.',
      },
      {
        name: 'Value tracking',
        description: 'Record purchase price and current estimated value. Useful for insurance and estate purposes.',
      },
      {
        name: 'Photo storage',
        description: 'Attach photos of the garment flat, on a form, label detail, and any notable features.',
      },
      {
        name: 'Public collection page',
        description: 'Share a curated view of your collection. Useful for fashion researchers, stylists, and exhibitions.',
      },
    ],
    steps: [
      {
        heading: 'Create a free account',
        body: 'Sign up at vitrinecms.com. No credit card required. Up to 100 items on the free plan.',
      },
      {
        heading: 'Add your garments',
        body: 'Enter each item with designer, type, period, label details, condition, and estimated value.',
      },
      {
        heading: 'Record condition and measurements',
        body: 'Log condition notes and actual measurements. Note any alterations or repairs.',
      },
      {
        heading: 'Attach photos',
        body: 'Photograph each garment flat and in detail. Capture labels, construction details, and any notable features.',
      },
    ],
    competitors: [
      {
        name: 'Vestiaire Collective / Vinted',
        weakness: 'Marketplaces for selling, not tools for cataloguing and managing a personal or institutional collection.',
      },
      {
        name: 'PastPerfect Online',
        weakness: 'Designed for museum collections. Complex and expensive for personal or small institutional use.',
      },
      {
        name: 'Google Sheets',
        weakness: 'Manual, no photo storage, and difficult to share with researchers or curators.',
      },
    ],
    faqs: [
      {
        question: 'Can I catalog accessories and textiles as well as garments?',
        answer:
          'Yes. Vitrine handles garments, shoes, bags, hats, scarves, and textile pieces in one collection. Use categories to keep them organised.',
      },
      {
        question: 'How do I record fabric composition and care labels?',
        answer:
          'Use the notes field to record label text verbatim — designer, fabric composition, country of origin, and care instructions. This is useful for dating and attribution.',
      },
      {
        question: 'Is Vitrine useful for a wearable collection?',
        answer:
          'Yes. Record which items you actively wear alongside items held for preservation. Use the status field to note wearable, display, or storage condition.',
      },
      {
        question: 'Can I share my collection with fashion researchers?',
        answer:
          'Yes. Make selected items public on your collection page and share the link with researchers, curators, or stylists.',
      },
      {
        question: 'Can I use Vitrine for a costume collection at a theatre or institution?',
        answer:
          'Yes. Vitrine\'s Professional plan is suited to institutional costume collections, with staff accounts, loans tracking, and document storage.',
      },
    ],
    mockListItems: [
      { name: 'Ossie Clark for Radley printed chiffon dress, c.1970', badge: 'Good — minor fading', value: '£1,800', tag: 'Documented', selected: true },
      { name: 'Balenciaga couture evening jacket, c.1963', badge: 'Very Good', value: '£8,500' },
      { name: 'Biba knitted maxi dress, c.1972', badge: 'Excellent', value: '£420' },
      { name: 'Vivienne Westwood "Pirate" shirt, 1981', badge: 'Good — label intact', value: '£2,200', tag: 'Label' },
      { name: 'Christian Dior New Look bar jacket, 1947', badge: 'Fair — conservation needed', value: '£12,000', tag: 'Conservation' },
    ],
    mockDetail: {
      heading: 'Ossie Clark for Radley printed chiffon dress, c.1970',
      fields: [
        { label: 'Designer', value: 'Ossie Clark for Radley' },
        { label: 'Period', value: 'c.1970 — Celia Birtwell print' },
        { label: 'Fabric', value: 'Printed chiffon — polyester' },
        { label: 'Label', value: '"Ossie Clark for Radley" — present and legible' },
        { label: 'Size (label)', value: 'Not stated' },
        { label: 'Bust / waist', value: '34 in / 26 in' },
        { label: 'Condition', value: 'Good — minor fading to print on reverse hem' },
        { label: 'Est. value', value: '£1,800' },
      ],
    },
  },

  // --- Institutional segments ---

  {
    slug: 'museum-collection-management-software',
    name: 'Museum Collection Management Software',
    metaTitle: 'Museum Collection Management Software – Built for Museums of All Sizes',
    metaDescription:
      'Affordable museum collection management software. Catalog objects, manage loans, track condition, and publish a public collection website. Plans from free to institutional.',
    keywords: [
      'museum collection management software',
      'museum cataloguing software',
      'collection management system museum',
      'museum object database software',
      'small museum collection management',
    ],
    h1: 'Museum Collection Management Software',
    items: 'museum objects',
    collectorNoun: 'museum',
    answerCapsule:
      'Vitrine is collection management software built for museums of all sizes — from independent heritage sites to multi-site institutions. Catalog objects, manage loans, track condition and compliance, and publish a public collection website. Professional plans from £79/month.',
    schemaDescription:
      'Vitrine for museums. Catalog collections, manage loans and compliance, and publish a public collection website. Designed for institutions of all sizes.',
    painPoints: [
      {
        heading: 'Legacy CMS software is expensive and complex to maintain',
        body: 'Enterprise collection management systems cost tens of thousands of pounds to license and require IT support to maintain. Vitrine is web-based, requires no installation, and is priced for institutions that do not have a dedicated IT team.',
      },
      {
        heading: 'Collections compliance requires proper documentation',
        body: 'Provenance documentation, acquisition records, disposal registers, and loans agreements are legal and ethical requirements. Vitrine\'s Professional plan includes dedicated compliance tools for each of these.',
      },
      {
        heading: 'Staff need different levels of access',
        body: 'Curators, registrars, and volunteers all need to access the collection — but not all need the same permissions. Vitrine\'s role-based access system lets you give staff exactly the access they need.',
      },
    ],
    features: [
      {
        name: 'Full object cataloguing',
        description: 'Record all standard fields — object name, accession number, medium, dimensions, acquisition method, provenance, condition, and location.',
      },
      {
        name: 'Loans management',
        description: 'Track outgoing and incoming loans with lender/borrower details, due dates, and condition reports. Overdue loans are flagged automatically.',
      },
      {
        name: 'Compliance tools',
        description: 'Provenance documentation, acquisition method records, disposal register, and collections review — all required for ethical collections governance.',
      },
      {
        name: 'Staff accounts and roles',
        description: 'Invite staff as Admin, Curator, Editor, or Viewer. Control who can add, edit, and approve records.',
      },
      {
        name: 'Public collection website',
        description: 'Publish a branded public collection page automatically. Choose which objects are publicly visible. No web development required.',
      },
      {
        name: 'CSV bulk import',
        description: 'Import existing spreadsheet records on Professional plans. Vitrine maps your columns and flags anything that needs review before committing.',
      },
    ],
    steps: [
      {
        heading: 'Create your museum account',
        body: 'Sign up at vitrinecms.com. Choose Community for small collections or Professional/Institution for full museum functionality. No credit card required for Community.',
      },
      {
        heading: 'Import or enter your collection',
        body: 'Import an existing spreadsheet via CSV on Professional plans, or enter objects one by one. All standard museum cataloguing fields are available from the start.',
      },
      {
        heading: 'Invite your team',
        body: 'Add staff with role-based access. Curators can edit records; Viewers can search and report; Admins manage settings and access.',
      },
      {
        heading: 'Publish your public collection',
        body: 'Choose which objects are publicly visible and your collection website goes live automatically. Update it as you add new records.',
      },
    ],
    competitors: [
      {
        name: 'Axiell EMu',
        weakness: 'Enterprise system designed for large institutions. High licensing costs, long implementation timelines, and requires dedicated IT support.',
      },
      {
        name: 'PastPerfect Online',
        weakness: 'US-focused with limited compliance tools for UK institutions. Annual licensing fees and an interface that has not modernised significantly.',
      },
      {
        name: 'Spreadsheets',
        weakness: 'Used by many small museums by necessity. No role-based access, no public website generation, and no compliance workflow tools.',
      },
    ],
    faqs: [
      {
        question: 'Is Vitrine suitable for a small independent museum?',
        answer:
          'Yes. The Community plan is free for up to 100 objects. The Professional plan at £79/month gives a small museum full cataloguing, compliance tools, staff accounts, and a public website — without the cost of enterprise software.',
      },
      {
        question: 'Does Vitrine meet Spectrum or UKAD compliance requirements?',
        answer:
          'Vitrine\'s Professional plan includes the core records required for Spectrum compliance — acquisition, loans, disposal, condition checking, and collections review. We recommend reviewing these against your specific accreditation requirements.',
      },
      {
        question: 'Can I migrate from our existing system?',
        answer:
          'Yes. Export your existing records as CSV and import them into Vitrine on Professional plans. Vitrine maps your columns to its fields and lets you review before committing.',
      },
      {
        question: 'How do staff accounts work?',
        answer:
          'Invite staff by email. Assign them a role — Admin, Curator, Editor, or Viewer. Roles control what each person can see and change. Professional plans include up to 10 staff accounts.',
      },
      {
        question: 'Does Vitrine provide a public collection website?',
        answer:
          'Yes. Every Vitrine account gets a public collection page on a vitrinecms.com subdomain. You choose which objects are publicly visible. The page updates automatically as you edit records.',
      },
    ],
    mockListItems: [
      { name: 'Oil portrait, attr. circle of Lely, c.1680', badge: 'On Display · Good', value: '£12,000', tag: 'Accession', selected: true },
      { name: 'Bronze figurine — Roman, 1st–2nd C AD', badge: 'Storage · Excellent', value: '£4,500' },
      { name: 'Embroidered silk panel — Chinese, Qing dynasty', badge: 'On Loan · Good', value: '£6,800', tag: 'On Loan' },
      { name: 'Watercolour, attributed J.M.W. Turner', badge: 'Conservation · Under review', value: '£28,000', tag: 'Conservation' },
      { name: 'Agricultural implement collection (32 items)', badge: 'Storage · Various', value: '£3,200' },
    ],
    mockDetail: {
      heading: 'Oil portrait, attr. circle of Lely, c.1680',
      fields: [
        { label: 'Accession no.', value: 'ACC-1984-042' },
        { label: 'Attribution', value: 'Circle of Sir Peter Lely (attr.)' },
        { label: 'Medium', value: 'Oil on canvas' },
        { label: 'Dimensions', value: '76 × 63 cm (framed: 91 × 78 cm)' },
        { label: 'Acquisition', value: 'Bequest — Mrs E. Hartley, 1984' },
        { label: 'Location', value: 'Gallery 2 — North wall' },
        { label: 'Condition', value: 'Good — stable. Last checked March 2024' },
        { label: 'Insurance value', value: '£14,000' },
      ],
    },
  },

  {
    slug: 'local-history-society-collection-app',
    name: 'Local History Society Collection App',
    metaTitle: 'Local History Society Collection App – Catalog Archives & Artefacts',
    metaDescription:
      'Affordable collection management for local history societies. Catalog photographs, documents, maps, and artefacts. Publish a public collection page. Plans from free.',
    keywords: [
      'local history society collection app',
      'heritage collection management software',
      'local archive cataloguing software',
      'community archive management app',
      'local museum collection management',
    ],
    h1: 'Local History Society Collection App',
    items: 'archive items',
    collectorNoun: 'local history society',
    answerCapsule:
      'Vitrine is a collection management app designed for local history societies, heritage groups, and community archives. Catalog photographs, documents, maps, and artefacts. Publish a public collection website. Professional plans from £79/month — or start free.',
    schemaDescription:
      'Vitrine for local history societies and community archives. Catalog photographs, documents, maps, and artefacts. Publish a public collection page.',
    painPoints: [
      {
        heading: 'Collections are often unmanaged spreadsheets or worse',
        body: 'Many local history societies manage their collections in spreadsheets, paper registers, or not at all. Vitrine provides a proper catalogue without requiring technical expertise or a large budget.',
      },
      {
        heading: 'Volunteers need appropriate access without technical training',
        body: 'Volunteers come and go. Vitrine\'s role-based access lets you give new volunteers limited editing rights, while trustees retain full control — no IT knowledge required.',
      },
      {
        heading: 'There is no easy way to share the collection with the community',
        body: 'Local history collections belong to the community. Vitrine\'s public collection page lets your society share its holdings online automatically, making them accessible to researchers and residents.',
      },
    ],
    features: [
      {
        name: 'Full cataloguing for mixed collections',
        description: 'Catalog photographs, maps, documents, books, artefacts, and oral history recordings in a single collection — each with appropriate fields.',
      },
      {
        name: 'Volunteer access management',
        description: 'Add volunteers as Editors or Viewers. Trustees and officers can be Admins. No technical configuration required.',
      },
      {
        name: 'Document and image storage',
        description: 'Attach scanned documents and photographs to catalogue records. Keep the digital copy permanently linked to the catalogue entry.',
      },
      {
        name: 'Public collection website',
        description: 'Publish a public page showing your holdings. Researchers can search and browse your collection without visiting in person.',
      },
      {
        name: 'CSV bulk import',
        description: 'Import existing spreadsheet records on Professional plans. No need to re-enter everything from scratch.',
      },
      {
        name: 'Loans tracking',
        description: 'Track items loaned to exhibitions, schools, or other organisations. Know where everything is at all times.',
      },
    ],
    steps: [
      {
        heading: 'Create your society account',
        body: 'Sign up at vitrinecms.com. The Community plan is free for up to 100 items. Professional gives full functionality for £79/month.',
      },
      {
        heading: 'Import or enter your collection',
        body: 'Import an existing spreadsheet via CSV on Professional plans, or start entering items one by one. Everything is saved automatically.',
      },
      {
        heading: 'Add your volunteers and officers',
        body: 'Invite volunteers by email and assign appropriate roles. Trustees get Admin access; cataloguers get Editor access; public enquirers can be Viewers.',
      },
      {
        heading: 'Publish your online collection',
        body: 'Make selected items publicly visible and your collection page goes live automatically. Researchers can find and browse your holdings online.',
      },
    ],
    competitors: [
      {
        name: 'PastPerfect Online',
        weakness: 'Designed for US museums. Annual licensing fees that stretch small society budgets, with limited support for UK catalogue standards.',
      },
      {
        name: 'Flickr / Google Photos',
        weakness: 'Photo sharing tools, not collection management systems. No catalogue fields, no loans tracking, no access control.',
      },
      {
        name: 'Excel spreadsheet',
        weakness: 'Used by many societies by necessity. No image storage, no public website, and fragile when volunteer turnover occurs.',
      },
    ],
    faqs: [
      {
        question: 'Is Vitrine affordable for a volunteer-run society?',
        answer:
          'Yes. The Community plan is free for up to 100 items. The Professional plan at £79/month gives your society full cataloguing, staff accounts, document storage, and a public collection website.',
      },
      {
        question: 'Can we catalog photographs alongside documents and artefacts?',
        answer:
          'Yes. Vitrine handles mixed collections. Use the category field to separate photographs, documents, maps, and three-dimensional objects within the same account.',
      },
      {
        question: 'How do we manage volunteer access when members change?',
        answer:
          'Add volunteers by email and assign them a role. When a volunteer leaves, you can remove their access immediately. This prevents the "orphaned spreadsheet" problem that affects many societies.',
      },
      {
        question: 'Can the public search our collection online?',
        answer:
          'Yes. Your public collection page lets anyone browse and search items you have made publicly visible. Researchers can find what you hold before making an enquiry.',
      },
      {
        question: 'Can we import our existing spreadsheet?',
        answer:
          'Yes, on Professional plans. Export your spreadsheet as CSV and import it into Vitrine. Map your columns to Vitrine fields and review before committing.',
      },
    ],
    mockListItems: [
      { name: 'High Street photograph, c.1903 — glass plate negative', badge: 'Fragile · Fair', value: '—', tag: 'Digitised', selected: true },
      { name: 'OS map sheet — 1:2500, 1891 edition', badge: 'Good — some foxing', value: '—' },
      { name: 'Parish vestry minute book, 1842–1871', badge: 'Poor — rebinding needed', value: '—', tag: 'Priority' },
      { name: 'Corn dolly — harvest, c.1920', badge: 'Good', value: '—' },
      { name: 'Oral history recording — Mrs D. Perkins, 1984', badge: 'Digital · Good', value: '—' },
    ],
    mockDetail: {
      heading: 'High Street photograph, c.1903 — glass plate negative',
      fields: [
        { label: 'Accession no.', value: 'PHOTO-1978-014' },
        { label: 'Format', value: 'Glass plate negative — whole plate (8½ × 6½ in)' },
        { label: 'Subject', value: 'High Street looking north — shops and pedestrians visible' },
        { label: 'Date', value: 'c.1903 (postmark on related postcard)' },
        { label: 'Condition', value: 'Fair — emulsion lift on lower right corner' },
        { label: 'Digitised', value: 'Yes — TIFF scan at 1200 dpi, March 2022' },
        { label: 'Acquisition', value: 'Donated — Miss J. Burgess, 1978' },
        { label: 'Location', value: 'Cabinet 3, Drawer B — tissue interleaved' },
      ],
    },
  },

  {
    slug: 'university-archive-management',
    name: 'University Archive Management Software',
    metaTitle: 'University Archive Management Software – Catalog Special Collections',
    metaDescription:
      'Collection management software for university archives and special collections. Catalog rare books, manuscripts, and institutional records. Plans from free.',
    keywords: [
      'university archive management software',
      'special collections catalogue software',
      'university library collection management',
      'rare book catalogue software',
      'academic archive management system',
    ],
    h1: 'University Archive Management Software',
    items: 'archive items',
    collectorNoun: 'archive',
    answerCapsule:
      'Vitrine is collection management software for university archives, special collections departments, and academic libraries. Catalog rare books, manuscripts, institutional records, and research collections. Publish a public finding aid. Professional plans from £79/month.',
    schemaDescription:
      'Vitrine for university archives and special collections. Catalog rare books, manuscripts, and institutional records. Publish public finding aids.',
    painPoints: [
      {
        heading: 'Researchers need to find material before they visit',
        body: 'A well-catalogued online finding aid reduces speculative visit requests and helps researchers identify what they need in advance. Vitrine\'s public collection page acts as a permanent online catalogue.',
      },
      {
        heading: 'Multiple staff need appropriate levels of access',
        body: 'Archivists, cataloguers, and reading room supervisors all need different levels of access to the system. Vitrine\'s role-based access gives each staff member exactly the access they need.',
      },
      {
        heading: 'Large collections need bulk import, not manual re-entry',
        body: 'Migrating from spreadsheets, card catalogues, or legacy systems is painful if it requires re-entering every record by hand. Vitrine\'s CSV import on Professional plans handles bulk migration.',
      },
    ],
    features: [
      {
        name: 'Full archival cataloguing',
        description: 'Catalog each item with reference codes, dates, extent, scope and content, and access conditions.',
      },
      {
        name: 'Access conditions and restrictions',
        description: 'Record closed or restricted items with review dates. Control which records are publicly visible.',
      },
      {
        name: 'Staff accounts with role-based access',
        description: 'Professional plans include staff accounts. Assign roles to archivists, cataloguers, supervisors, and readers separately.',
      },
      {
        name: 'Public online finding aid',
        description: 'Publish a searchable public catalogue automatically. Researchers can identify holdings before requesting access.',
      },
      {
        name: 'Document and image storage',
        description: 'Attach digitised images and PDFs to catalogue records. Keep digital surrogates permanently linked to the catalogue entry.',
      },
      {
        name: 'Loans and outreach tracking',
        description: 'Track items on loan to exhibitions, researchers, or partner institutions. Record condition at departure and return.',
      },
    ],
    steps: [
      {
        heading: 'Create your archive account',
        body: 'Sign up at vitrinecms.com. Choose the Professional plan for staff accounts, document storage, and all compliance tools.',
      },
      {
        heading: 'Import your existing catalogue',
        body: 'Export from your current system or spreadsheet as CSV and import into Vitrine. Map your fields and review before committing.',
      },
      {
        heading: 'Set access conditions and visibility',
        body: 'Mark restricted or closed items as private. All other records can be made publicly visible for the online finding aid.',
      },
      {
        heading: 'Publish your online finding aid',
        body: 'Your public collection page goes live automatically. Researchers can search and browse your holdings online.',
      },
    ],
    competitors: [
      {
        name: 'Archivematica',
        weakness: 'A digital preservation platform, not a descriptive catalogue or public finding aid tool. Requires significant technical infrastructure.',
      },
      {
        name: 'Axiell Archives',
        weakness: 'Enterprise pricing and implementation timelines suited to large national institutions. Significant IT overhead.',
      },
      {
        name: 'Spreadsheets and shared drives',
        weakness: 'Common in underfunded special collections departments. No access control, no public facing catalogue, and fragile to staff turnover.',
      },
    ],
    faqs: [
      {
        question: 'Can Vitrine handle archival description at different levels?',
        answer:
          'Yes. You can catalog at item, file, series, or fonds level using the description and category fields. Reference codes, dates of creation, extent, and scope and content fields are all available.',
      },
      {
        question: 'How do we handle access restrictions on sensitive records?',
        answer:
          'Mark restricted or closed items as private. They remain in your catalogue for internal use but are not visible on the public collection page. Record review dates in the notes field.',
      },
      {
        question: 'Can we attach digitised images to catalogue records?',
        answer:
          'Yes. Attach images and PDFs to individual records on Professional plans. Digitised surrogates stay permanently linked to the catalogue entry.',
      },
      {
        question: 'How does the public finding aid work?',
        answer:
          'Items you mark as publicly visible appear automatically on your collection page. Researchers can search and browse without requesting access in advance for open material.',
      },
      {
        question: 'Can we migrate from our existing catalogue system?',
        answer:
          'Yes. Export your existing catalogue as CSV and import it into Vitrine. Map columns to Vitrine fields and review before committing. Staff can then continue cataloguing in Vitrine from that point.',
      },
    ],
    mockListItems: [
      { name: 'Correspondence — John Ruskin to Prof. Charles Eliot Norton, 1869–1872', badge: '1 box · Restricted to 2030', value: '—', tag: 'Restricted', selected: true },
      { name: 'University Senate minutes, 1892–1945', badge: '12 vols · Open', value: '—' },
      { name: 'Architectural drawings — main building, 1903–1908', badge: '42 sheets · Open', value: '—' },
      { name: 'Photographic collection — campus life, 1920s–1960s', badge: '~3,000 prints · Open', value: '—' },
      { name: 'Student union records, 1968–1985', badge: '4 boxes · Partial restriction', value: '—', tag: 'Partial' },
    ],
    mockDetail: {
      heading: 'Correspondence — John Ruskin to Prof. Charles Eliot Norton, 1869–1872',
      fields: [
        { label: 'Reference', value: 'MS-RUS-012/3' },
        { label: 'Extent', value: '1 archival box (47 items)' },
        { label: 'Dates', value: '1869–1872' },
        { label: 'Creator', value: 'Ruskin, John (1819–1900)' },
        { label: 'Scope', value: 'Letters discussing art theory, Venetian architecture, and social reform' },
        { label: 'Access', value: 'Restricted — digital consultation only until 2030' },
        { label: 'Acquisition', value: 'Deposited by Norton family estate, 1952' },
        { label: 'Location', value: 'Strong room — Bay 4, Shelf C' },
      ],
    },
  },

  {
    slug: 'photography-archive-management',
    name: 'Photography Archive Management Software',
    metaTitle: 'Photography Archive Management Software – Catalog Photo Collections',
    metaDescription:
      'Collection management software for photography archives, press archives, and photographers\' estates. Catalog prints, negatives, and digital files. Plans from free.',
    keywords: [
      'photography archive management software',
      'photo archive catalogue software',
      'photography collection management app',
      'press photo archive management',
      'photographer estate archive software',
    ],
    h1: 'Photography Archive Management Software',
    items: 'photographs',
    collectorNoun: 'photography archive',
    answerCapsule:
      'Vitrine is collection management software for photography archives, press photo collections, and photographers\' estates. Catalog prints, negatives, transparencies, and digital files. Record technical details, rights information, and provenance. Publish a public collection. Professional plans from £79/month.',
    schemaDescription:
      'Vitrine for photography archives and photographers\' estates. Catalog prints, negatives, and digital files. Record technical details, rights, and provenance.',
    painPoints: [
      {
        heading: 'Prints, negatives, and digital files need to be linked',
        body: 'A photograph often exists in multiple formats — the original negative, a vintage print, a modern print, and a digital scan. Vitrine keeps all of these linked under a single catalogue entry.',
      },
      {
        heading: 'Rights and reproduction status is critical and often unclear',
        body: 'Who holds copyright, whether images are licensed for reproduction, and under what terms are questions that arise constantly for photography archives. Vitrine\'s notes and compliance fields let you record this information properly.',
      },
      {
        heading: 'Technical metadata needs to travel with the image',
        body: 'Camera, lens, film stock, exposure, and development notes are essential for a research archive and valuable for an estate catalogue. Vitrine keeps this permanently attached to each record.',
      },
    ],
    features: [
      {
        name: 'Multi-format cataloguing',
        description: 'Catalog prints, negatives (glass plate, film), transparencies, contact sheets, and digital files in one collection.',
      },
      {
        name: 'Technical metadata',
        description: 'Record camera, lens, film stock, format, exposure details, and development process. Essential for research and conservation.',
      },
      {
        name: 'Rights and reproduction records',
        description: 'Record copyright holder, licence terms, publication history, and any reproduction restrictions.',
      },
      {
        name: 'Condition tracking',
        description: 'Log fading, silver mirroring, mould, physical damage, and any conservation treatment. Record condition at acquisition and at review.',
      },
      {
        name: 'Image storage',
        description: 'Attach scanned reference images to each catalogue record. Keeps digital surrogates permanently linked to the catalogue entry.',
      },
      {
        name: 'Public collection page',
        description: 'Publish a public online collection for research enquiries. Control which images are visible based on rights status.',
      },
    ],
    steps: [
      {
        heading: 'Create your archive account',
        body: 'Sign up at vitrinecms.com. Choose Professional for a single-person archive or Institution for a team with multiple staff.',
      },
      {
        heading: 'Import or enter your catalogue',
        body: 'Import an existing spreadsheet via CSV on Professional plans, or enter records one by one. All standard photographic archive fields are available.',
      },
      {
        heading: 'Record rights and restrictions',
        body: 'Note copyright holder, licence terms, and any reproduction restrictions for each image or series. Mark restricted items as private.',
      },
      {
        heading: 'Publish your online archive',
        body: 'Make publicly shareable images visible on your collection page. Researchers can browse and enquire without needing to visit in person.',
      },
    ],
    competitors: [
      {
        name: 'Photoshelter',
        weakness: 'A commercial photography portfolio and licensing platform. Designed for working photographers, not archival cataloguing of historical collections.',
      },
      {
        name: 'Lightroom / Capture One',
        weakness: 'Digital asset management tools for active photographers. Not built for cataloguing physical prints, negatives, or mixed-format archives.',
      },
      {
        name: 'Excel spreadsheet',
        weakness: 'Common in photography archives by necessity. No image preview, no rights management workflow, and fragile to staff and volunteer turnover.',
      },
    ],
    faqs: [
      {
        question: 'Can I catalog physical prints and negatives alongside digital files?',
        answer:
          'Yes. Vitrine handles mixed-format photography collections. Use the category and notes fields to distinguish print types, negative formats, and digital files within the same collection.',
      },
      {
        question: 'How do I record rights and copyright information?',
        answer:
          'Use the notes field to record the copyright holder, date of any rights assignment, licence terms, and any restrictions on reproduction. Mark restricted items as private on the public collection page.',
      },
      {
        question: 'Can I attach scanned reference images to catalogue records?',
        answer:
          'Yes. Attach scanned reference images or low-resolution JPEGs to each record. On Professional plans, you can also attach full-resolution files as document attachments.',
      },
      {
        question: 'Is Vitrine suitable for a photographer\'s estate?',
        answer:
          'Yes. Estate archives are a common use case — cataloguing prints, negatives, contact sheets, and documents left by a photographer. Vitrine\'s Professional plan gives you the tools to build a proper record without the cost of enterprise archival software.',
      },
      {
        question: 'Can researchers search the collection online?',
        answer:
          'Yes. Items you mark as publicly visible appear on your collection page. Researchers can search and browse before making an enquiry, reducing speculative contact requests.',
      },
    ],
    mockListItems: [
      { name: '"Steel works, Sheffield" — Bill Brandt, c.1937 (vintage print)', badge: 'Good — silver mirror', value: '£4,200', tag: 'Rights cleared', selected: true },
      { name: 'Contact sheet 47 — Karsh Ottawa session, Nov 1941', badge: 'Excellent', value: '—' },
      { name: 'Large format negative — Dorothea Lange, "Migrant Mother" study, 1936', badge: 'Good — stored cold', value: '—', tag: 'Archive copy' },
      { name: '"Coronation crowds, The Mall" — press photograph, 1953', badge: 'Very Good', value: '£380' },
      { name: 'Glass plate negative — studio portrait, c.1908', badge: 'Fair — corner chip', value: '—' },
    ],
    mockDetail: {
      heading: '"Steel works, Sheffield" — Bill Brandt, c.1937 (vintage print)',
      fields: [
        { label: 'Photographer', value: 'Bill Brandt (1904–1983)' },
        { label: 'Date', value: 'c.1937' },
        { label: 'Format', value: 'Vintage gelatin silver print' },
        { label: 'Dimensions', value: '29.5 × 24 cm' },
        { label: 'Condition', value: 'Good — light silver mirroring to edges' },
        { label: 'Copyright', value: 'Bill Brandt Archive Ltd — reproduction on application' },
        { label: 'Publication history', value: 'Published: "A Night in London", 1938' },
        { label: 'Est. value', value: '£4,200' },
      ],
    },
  },
]

export function getSegment(slug: string): Segment | undefined {
  return segments.find((s) => s.slug === slug)
}
