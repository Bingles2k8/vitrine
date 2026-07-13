export type FeatureIcon = 'check' | 'cross' | 'neutral'

export type FeatureRow = {
  feature: string
  vitrine: string
  competitor: string
  vitrineIcon: FeatureIcon
  competitorIcon: FeatureIcon
}

export type Competitor = {
  slug: string
  name: string
  metaTitle: string
  metaDescription: string
  keywords: string[]
  h1: string
  answerCapsule: string
  socialProofLine: string
  shutdownBanner?: string
  featureComparison: FeatureRow[]
  weaknessesHeading: string
  weaknesses: { heading: string; body: string }[]
  whySwitchPoints: { heading: string; body: string }[]
  competitorPrice: string
  competitorPriceNote: string
  competitorAnnualPrice?: string
  vitrineAnnualPrice?: string
  savingsLine?: string
  whyNow?: string
  migrationSteps: { heading: string; body: string }[]
  faqs: { question: string; answer: string }[]
}

export const competitors: Competitor[] = [
  {
    slug: 'delicious-library-alternative',
    name: 'Delicious Library',
    metaTitle: 'Best Delicious Library Alternative for Collectors (2026)',
    metaDescription:
      'Delicious Library shut down in November 2024. Vitrine is the best alternative for cataloguing books, movies, games, vinyl, and any other collection. Free to start.',
    keywords: [
      'delicious library alternative',
      'delicious library replacement',
      'app to replace delicious library',
      'collection management app mac',
    ],
    h1: 'Best Delicious Library Alternative (2026)',
    answerCapsule:
      'Delicious Library shut down in November 2024, leaving thousands of collectors without a home. Vitrine picks up where it left off: a web-based collection manager for books, movies, games, vinyl, and any other collection type. Free to start, with paid plans from £5/month.',
    socialProofLine:
      'All four Delicious Library categories plus 31 more, in one web account. Barcode scanning, public collection page, automatic backups.',
    shutdownBanner:
      'Delicious Library was discontinued in November 2024. Export your data now, before macOS updates break compatibility for good.',
    featureComparison: [
      { feature: 'Status', vitrine: 'Actively developed', competitor: 'Shut down November 2024', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Platform', vitrine: 'Web, any browser', competitor: 'Mac desktop only', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Collection types', vitrine: '35 built-in categories', competitor: 'Books, movies, games, music', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Public sharing', vitrine: 'Public collection page', competitor: 'None', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Barcode scanning', vitrine: 'Yes, in the browser', competitor: 'Yes', vitrineIcon: 'check', competitorIcon: 'check' },
      { feature: 'Free tier', vitrine: 'Up to 100 items', competitor: 'N/A (discontinued)', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Data export', vitrine: 'CSV anytime', competitor: 'No longer available', vitrineIcon: 'check', competitorIcon: 'cross' },
    ],
    weaknessesHeading: 'Where Delicious Library leaves you stuck',
    weaknesses: [
      {
        heading: 'Delicious Library no longer exists',
        body: 'The app shut down in November 2024. There is no way to buy it, no support, and no official migration path. Any data still inside the app is at risk every time macOS updates.',
      },
      {
        heading: 'Mac-only, no web, no mobile',
        body: 'Delicious Library was a desktop app for one platform. Your collection lived on one machine. No browser access, no phone app, no way to check your library when you were not at your computer.',
      },
      {
        heading: 'Locked to four collection types',
        body: 'Books, DVDs, games, music. That was the entire list. Collectors of coins, stamps, trading cards, vinyl, comics, or anything else had nowhere to go.',
      },
    ],
    whySwitchPoints: [
      {
        heading: 'Your collection stays safe and accessible',
        body: 'Vitrine is a live, actively maintained web platform. Every item is backed up automatically and exportable to CSV anytime. No risk of the app disappearing on you.',
      },
      {
        heading: 'Catalogue anything you collect',
        body: 'Books, movies, games, vinyl, coins, stamps, comics, trading cards, LEGO, art, wine, watches. 35 built-in categories with custom fields for anything that does not fit a template.',
      },
      {
        heading: 'A public collection page worth sharing',
        body: 'Every account gets a public-facing page. Share your library with friends, family, or fellow collectors. Delicious Library never offered this.',
      },
    ],
    competitorPrice: 'Discontinued',
    competitorPriceNote: 'Delicious Library is no longer available',
    migrationSteps: [
      {
        heading: 'Export your Delicious Library data',
        body: 'If you still have access, open Delicious Library and use File → Export to save your collection as XML. This gives you a structured file of every item.',
      },
      {
        heading: 'Convert XML to CSV',
        body: 'Use any free online XML-to-CSV converter, or open the XML in a spreadsheet app and save as CSV.',
      },
      {
        heading: 'Import into Vitrine',
        body: 'On the Hobbyist plan and above, upload your CSV directly via the importer. Community users add items via the quick-add form. Most collections move over in an evening.',
      },
      {
        heading: 'Set up your public page',
        body: 'Customise your public collection page, choose which items to display, and share the link with anyone who used to visit your old Delicious Library shelves.',
      },
    ],
    faqs: [
      {
        question: 'How do I know Vitrine will not shut down too?',
        answer:
          'A fair question after losing Delicious Library. Vitrine is a paid subscription business with active development, automatic cloud backups, and CSV export on every plan. If anything ever changes, you can take your data with you. Your collection is not locked in proprietary desktop software the way it was with Delicious Library.',
      },
      {
        question: 'Can I recover my Delicious Library data?',
        answer:
          'If the app still opens, export your data immediately via File → Export before your next macOS update breaks compatibility. The XML export converts cleanly to CSV and imports into Vitrine.',
      },
      {
        question: 'Does Vitrine work on Mac?',
        answer:
          'Vitrine is a web app that works in any browser on any device: Mac, PC, iPhone, Android, tablet. Nothing to install.',
      },
      {
        question: 'Can Vitrine catalogue the same things as Delicious Library?',
        answer:
          'Yes, plus much more. Books, movies, games, and music are all supported, alongside coins, stamps, trading cards, vinyl records, LEGO, art, wine, watches, and any custom collection type. 35 built-in categories in total.',
      },
      {
        question: 'Is there a free plan?',
        answer:
          'Yes. The Community plan is free and supports up to 100 items. The Hobbyist plan at £5/month supports up to 1,000 items and unlocks CSV import.',
      },
    ],
  },
  {
    slug: 'catalogit-alternative',
    name: 'CatalogIt',
    metaTitle: 'Best CatalogIt Alternative for Hobbyist Collectors (2026)',
    metaDescription:
      'Looking for a CatalogIt alternative? Vitrine offers modern collection management for hobbyists at £5/month, without museum-software complexity. Free to start.',
    keywords: [
      'catalogit alternative',
      'catalogit vs vitrine',
      'cheaper alternative to catalogit',
      'collection management software for hobbyists',
    ],
    h1: 'Best CatalogIt Alternative for Hobbyist Collectors (2026)',
    answerCapsule:
      'CatalogIt is built for museums and institutions, with pricing and complexity to match. Vitrine gives hobbyist collectors the same core cataloguing features at a fraction of the cost. Free to start, with paid plans from £5/month.',
    socialProofLine:
      '35 collection categories. Barcode scanning, public collection page, custom fields, CSV import. £5 a month.',
    featureComparison: [
      { feature: 'Free tier', vitrine: 'Up to 100 items', competitor: '50 entries', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Personal starting price', vitrine: 'Free', competitor: '$149.99/year', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Public collection page', vitrine: 'Included on every plan', competitor: 'Higher tier only', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Setup time', vitrine: 'Minutes', competitor: 'Hours to days', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Barcode scanning', vitrine: 'Yes, in the browser', competitor: 'iOS app', vitrineIcon: 'check', competitorIcon: 'check' },
      { feature: 'Mobile access', vitrine: 'Web, any browser', competitor: 'iOS app', vitrineIcon: 'check', competitorIcon: 'neutral' },
      { feature: 'Custom fields', vitrine: 'Yes', competitor: 'Yes', vitrineIcon: 'check', competitorIcon: 'check' },
      { feature: 'CSV import', vitrine: 'Hobbyist plan and above', competitor: 'Yes', vitrineIcon: 'check', competitorIcon: 'check' },
    ],
    weaknessesHeading: 'Where CatalogIt struggles for hobbyists',
    weaknesses: [
      {
        heading: 'Priced for museums, not individuals',
        body: 'CatalogIt personal plans start at $149.99/year. Workable for some, but a real commitment for a hobbyist who has not tested the software yet. Museum and organisation tiers start at $540/year.',
      },
      {
        heading: 'Built for professional cataloguers',
        body: 'CatalogIt has impressive feature depth for institutions with staff cataloguers and compliance requirements. For hobbyists, that complexity becomes friction. Adding a coin or trading card takes more steps than it should.',
      },
      {
        heading: 'A free tier that runs out fast',
        body: 'CatalogIt caps the free tier at 50 entries. Useful for a brief look, not enough to catalogue a real collection. Moving past it requires a paid subscription.',
      },
    ],
    whySwitchPoints: [
      {
        heading: 'Designed around how collectors actually think',
        body: 'Vitrine is built for people who collect because they love it. The interface is faster, simpler, and focused on what personal collectors care about: values, condition, acquisition stories, and sharing.',
      },
      {
        heading: 'Start free, upgrade only if you need to',
        body: 'The Community plan is free and supports a meaningful collection. Explore the full platform thoroughly before spending a penny.',
      },
      {
        heading: 'A public page included on every tier',
        body: 'Every Vitrine account comes with a public collection website worth showing off. CatalogIt limits public sharing or gates it behind higher tiers.',
      },
    ],
    competitorPrice: '$149.99',
    competitorPriceNote: 'per year (personal tier)',
    competitorAnnualPrice: '$149.99/year',
    vitrineAnnualPrice: '£60/year (around $75)',
    savingsLine: 'Roughly half the price, with a free plan to start.',
    whyNow: 'The longer you stay on CatalogIt, the more records you will be migrating later.',
    migrationSteps: [
      {
        heading: 'Export from CatalogIt',
        body: 'In CatalogIt, open your collection and export records as CSV. CatalogIt supports standard CSV exports from the collection view.',
      },
      {
        heading: 'Clean up your CSV',
        body: 'Open the export in Excel or Google Sheets. Keep columns that map to Vitrine fields: title, description, category, condition, value, acquisition date, and notes.',
      },
      {
        heading: 'Import into Vitrine',
        body: 'On the Hobbyist plan and above, upload your CSV directly. Community users add items manually using the quick-add flow. Max 500 rows per import.',
      },
    ],
    faqs: [
      {
        question: 'Is Vitrine as powerful as CatalogIt for serious collections?',
        answer:
          'For personal collections of coins, cards, stamps, vinyl, and similar items, Vitrine covers everything most collectors need: 35 categories, custom fields, images, values, condition notes, barcode scanning, and public sharing. CatalogIt has deeper institutional features that are unnecessary for hobbyist use.',
      },
      {
        question: 'Can I import my CatalogIt data into Vitrine?',
        answer:
          'Yes. Export your CatalogIt collection as CSV, clean up the columns, and import into Vitrine. CSV import is available on the Hobbyist plan and above. Community users can add items via quick-add.',
      },
      {
        question: 'Does Vitrine have a free plan?',
        answer:
          'Yes. The Community plan is free and supports up to 100 items. CatalogIt does not offer a comparable free tier.',
      },
      {
        question: 'Who is CatalogIt better for?',
        answer:
          'CatalogIt is a strong choice for museums and institutions with professional cataloguers, compliance needs, and a budget for software. For individual hobbyist collectors, Vitrine is faster to set up and far more affordable.',
      },
    ],
  },
  {
    slug: 'sortly-alternative',
    name: 'Sortly',
    metaTitle: 'Best Sortly Alternative for Collectors (2026)',
    metaDescription:
      'Sortly is inventory software. Vitrine is the best Sortly alternative for collectors: built for cataloguing, with condition grades, value history, and a public page. Free to start.',
    keywords: [
      'sortly alternative for collections',
      'sortly alternative',
      'collection management instead of sortly',
      'sortly vs vitrine',
    ],
    h1: 'Best Sortly Alternative for Collectors (2026)',
    answerCapsule:
      'Sortly is inventory management software built for businesses tracking tools and stock. Collectors use it because few good alternatives existed. Vitrine is built specifically for personal collections, with condition grades, value tracking, and a public page included. Free to start.',
    socialProofLine:
      'Condition grades, value history, public collection page, barcode scanning, 35 collection categories. Designed around how collectors think.',
    featureComparison: [
      { feature: 'Built for collectors', vitrine: 'Yes', competitor: 'No, inventory management', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Public collection page', vitrine: 'Yes', competitor: 'No', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Condition & grading', vitrine: 'Yes', competitor: 'No', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Value tracking', vitrine: 'Yes, with history', competitor: 'Purchase price only', vitrineIcon: 'check', competitorIcon: 'neutral' },
      { feature: 'Starting paid price', vitrine: '£5/month', competitor: '$49/month', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Free tier', vitrine: 'Up to 100 items', competitor: 'Up to 100 items (limited)', vitrineIcon: 'check', competitorIcon: 'neutral' },
    ],
    weaknessesHeading: 'Where Sortly struggles for collectors',
    weaknesses: [
      {
        heading: 'Sortly is inventory software, not a collection manager',
        body: 'Sortly was built for businesses tracking tools, equipment, and stock. There is no concept of grading, provenance, acquisition history, or collector-specific metadata. You end up cramming everything into generic notes fields.',
      },
      {
        heading: 'No way to share or showcase your collection',
        body: 'Sortly has no public-facing output. No collection page, no public gallery, no way to show fellow collectors what you have built. For most collectors, sharing is half the point.',
      },
      {
        heading: 'Expensive for what collectors actually need',
        body: 'Sortly paid plans start at $49/month, priced for business use. The collector-specific features you would actually pay for (condition tracking, value history, public sharing) are absent at any tier.',
      },
    ],
    whySwitchPoints: [
      {
        heading: 'Designed around collecting',
        body: 'Vitrine is designed for personal collections. Every field, every view, every feature is shaped around how collectors think about their items, with condition grades, value history, and acquisition notes built in.',
      },
      {
        heading: 'Public collection page included',
        body: 'Every Vitrine account comes with a public collection website. Share it with the community, your trade contacts, or family.',
      },
      {
        heading: 'A fraction of the price',
        body: 'Vitrine Hobbyist is £5/month. Sortly entry paid tier is $49/month: roughly ten times more, without the collector features.',
      },
    ],
    competitorPrice: '$49',
    competitorPriceNote: 'per month (entry paid tier)',
    competitorAnnualPrice: '$588/year',
    vitrineAnnualPrice: '£60/year (around $75)',
    savingsLine: 'Around $500/year cheaper, with the features Sortly lacks.',
    whyNow: 'Sortly was a workaround. Each new item entered is one more to migrate later.',
    migrationSteps: [
      {
        heading: 'Export from Sortly',
        body: 'In Sortly, open Settings → Export and download your inventory as CSV. The export includes name, description, quantity, price, and any custom fields.',
      },
      {
        heading: 'Map your fields to Vitrine',
        body: 'Open the CSV and rename columns: Name → title, Description → description, Price → value, and any custom fields → Vitrine notes or custom fields.',
      },
      {
        heading: 'Import or re-enter in Vitrine',
        body: 'CSV import is available on the Hobbyist plan and above. Community users can re-enter items using the quick-add flow. Most Sortly collections migrate in an afternoon.',
      },
    ],
    faqs: [
      {
        question: 'Why is Sortly popular with collectors if it is not designed for them?',
        answer:
          'Until recently, the options for personal collection management were thin: expensive museum software, dated desktop apps, or generic inventory tools like Sortly. Vitrine is built specifically to fill that gap.',
      },
      {
        question: 'Can Vitrine replace Sortly for a non-collecting use case?',
        answer:
          'Vitrine is optimised for personal collections, not business inventory. If you need to track tools, equipment, or stock across multiple locations, Sortly may still be the right tool. For any collecting hobby, Vitrine is the better fit.',
      },
      {
        question: 'Is Vitrine cheaper than Sortly?',
        answer:
          'Yes, significantly. Vitrine Hobbyist is £5/month versus Sortly $49/month entry paid tier. Vitrine also has a free Community plan for up to 100 items.',
      },
    ],
  },
  {
    slug: 'clz-alternative',
    name: 'CLZ Apps',
    metaTitle: 'Best CLZ Alternative for Modern Collectors (2026)',
    metaDescription:
      'Looking for a CLZ alternative? Vitrine is a modern, web-based collection management app for comics, books, movies, games, music, and any collectible. Free to start.',
    keywords: [
      'clz alternative',
      'clz apps alternative',
      'clz comics alternative',
      'collection management app instead of clz',
    ],
    h1: 'Best CLZ Alternative for Modern Collectors (2026)',
    answerCapsule:
      'CLZ Apps is an established collection management suite with separate apps and subscriptions for comics, books, movies, games, and music. The costs add up and the interface feels dated. Vitrine handles every collection type in one account, on the web, from £5/month.',
    socialProofLine:
      'Comics, books, movies, games, music, vinyl, trading cards, coins, plus 27 more categories. Barcode scanning included. One account.',
    featureComparison: [
      { feature: 'Collection types in one app', vitrine: '35 categories', competitor: 'One per app/subscription', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Public collection page', vitrine: 'Included', competitor: 'CLZ Web (extra subscription)', vitrineIcon: 'check', competitorIcon: 'neutral' },
      { feature: 'Platform', vitrine: 'Web, any browser', competitor: 'Desktop and mobile apps', vitrineIcon: 'check', competitorIcon: 'neutral' },
      { feature: 'Barcode scanning', vitrine: 'Yes, in the browser', competitor: 'Yes', vitrineIcon: 'check', competitorIcon: 'check' },
      { feature: 'Starting price', vitrine: 'Free', competitor: '$20–30/year per app', vitrineIcon: 'check', competitorIcon: 'neutral' },
      { feature: 'Modern UI', vitrine: 'Yes', competitor: 'Dated', vitrineIcon: 'check', competitorIcon: 'cross' },
    ],
    weaknessesHeading: 'Where CLZ struggles for modern collectors',
    weaknesses: [
      {
        heading: 'A separate subscription for every collection type',
        body: 'CLZ offers individual apps for comics, books, movies, music, and games. Each carries its own subscription cost. A collector with three different interests pays three times.',
      },
      {
        heading: 'Web access costs extra on top of your app subscription',
        body: 'CLZ core products are mobile apps. CLZ Cloud (backup and sync) is free, but accessing your collection in a browser requires CLZ Web: a separate subscription per collection type, on top of what you already pay for the mobile app.',
      },
      {
        heading: 'Interface shows its age',
        body: 'CLZ has been around since the early 2000s and the UI reflects that era. The apps work, but they lack the clean, modern feel that web-native tools provide. Setup and navigation can feel heavy for new users.',
      },
    ],
    whySwitchPoints: [
      {
        heading: 'One subscription, every collection type',
        body: 'Vitrine handles comics, books, movies, games, music, trading cards, coins, stamps, vinyl, and any other collection in one account. No separate apps, no per-category subscriptions.',
      },
      {
        heading: 'Web-native from day one',
        body: 'Vitrine is built for the web. It works in any browser, on any device, with no software to install and no separate web subscription on top of your mobile one.',
      },
      {
        heading: 'A public page worth sharing',
        body: 'Every Vitrine account includes a public collection website. Share your comic long-box, your book library, or your vinyl collection with anyone. Included in your plan, not bolted on.',
      },
    ],
    competitorPrice: '$20–30',
    competitorPriceNote: 'per year, per app',
    competitorAnnualPrice: '$60–90/year (3 apps)',
    vitrineAnnualPrice: '£60/year',
    savingsLine: 'One subscription, every collection type.',
    whyNow: 'If you are already paying for two or more CLZ apps, Vitrine costs less and covers more.',
    migrationSteps: [
      {
        heading: 'Export from CLZ',
        body: 'In any CLZ app, open Tools → Export and choose CSV or XML. The export includes titles, creators, years, condition, and value fields.',
      },
      {
        heading: 'Prepare your export',
        body: 'Open the file in a spreadsheet and ensure columns map cleanly: title, creator or author, year, condition, value, and notes.',
      },
      {
        heading: 'Import into Vitrine',
        body: 'CSV import is available on the Hobbyist plan and above. On the Community plan, the quick-add flow makes manual entry fast for most collections.',
      },
    ],
    faqs: [
      {
        question: 'Does Vitrine support barcode scanning like CLZ?',
        answer:
          'Yes. Vitrine has built-in barcode scanning that runs in the browser, no app install needed. It supports UPC, EAN, QR codes, and other common formats. Scan from the dashboard on any device with a camera.',
      },
      {
        question: 'Can I manage comics specifically in Vitrine?',
        answer:
          'Yes. Vitrine supports comic collections with fields for series, issue number, grade, CGC certification number, and condition. See the dedicated comic book collection page for details.',
      },
      {
        question: 'How does Vitrine pricing compare to CLZ?',
        answer:
          'Vitrine is free for up to 100 items, then £5/month for up to 1,000 items. CLZ charges $20–30/year per app, so a collector using three CLZ apps pays $60–90/year versus Vitrine £60/year for everything.',
      },
    ],
  },
  {
    slug: 'spreadsheet-alternative',
    name: 'Spreadsheets (Excel & Google Sheets)',
    metaTitle: 'Best Spreadsheet Alternative for Collection Management (2026)',
    metaDescription:
      'Ready to upgrade from Excel or Google Sheets for your collection? Vitrine gives you a purpose-built collection manager with public sharing, value tracking, and images. Free to start.',
    keywords: [
      'excel collection management alternative',
      'google sheets collection tracker alternative',
      'replace spreadsheet for collection',
      'collection management instead of excel',
      'collection database instead of spreadsheet',
    ],
    h1: 'Moving from Spreadsheets to Proper Collection Management',
    answerCapsule:
      'Most serious collectors start with a spreadsheet. It works, until it does not. Spreadsheets have no images, no public sharing, and no automatic value totals. Vitrine handles everything a spreadsheet cannot. Free to start, with paid plans from £5/month.',
    socialProofLine:
      'Images per item, value totals, public collection page, barcode scanning, mobile-friendly views. None of which a spreadsheet has.',
    featureComparison: [
      { feature: 'Images per item', vitrine: 'Yes', competitor: 'No (URLs only)', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Public collection page', vitrine: 'Yes', competitor: 'No', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Collection value total', vitrine: 'Automatic', competitor: 'Manual formula', vitrineIcon: 'check', competitorIcon: 'neutral' },
      { feature: 'Designed for collections', vitrine: 'Yes', competitor: 'No, general purpose', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Barcode scanning', vitrine: 'Yes, in the browser', competitor: 'No', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Search and filter', vitrine: 'Instant', competitor: 'Filter or VLOOKUP', vitrineIcon: 'check', competitorIcon: 'neutral' },
      { feature: 'Mobile access', vitrine: 'Yes, full features', competitor: 'Limited (Google Sheets)', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Sharing with others', vitrine: 'Public page or link', competitor: 'Shared document', vitrineIcon: 'check', competitorIcon: 'neutral' },
    ],
    weaknessesHeading: 'Where spreadsheets break down',
    weaknesses: [
      {
        heading: 'Spreadsheets struggle past a few hundred items',
        body: 'Filtering, searching, and calculating values across 500+ rows is slow and error-prone. Formulas break. Columns drift. What started as a clean tracker becomes a maintenance burden.',
      },
      {
        heading: 'No images, no visual catalogue',
        body: 'A spreadsheet can store a URL to a photo, but it cannot display your collection visually. You cannot browse your coins or trading cards the way you would browse a proper catalogue.',
      },
      {
        heading: 'Sharing is messy',
        body: 'Sharing a Google Sheet means giving someone edit access or a view-only link that looks like, well, a spreadsheet. There is no way to present your collection in a way that does it justice.',
      },
    ],
    whySwitchPoints: [
      {
        heading: 'Every item has a visual record',
        body: 'Add photos to each item in your Vitrine collection. Browse your catalogue visually, see condition details at a glance, and build a proper archive of what you own.',
      },
      {
        heading: 'A public collection page in minutes',
        body: 'Every Vitrine account comes with a public-facing collection website. Share it with fellow collectors, use it as a trade list, or show family what you have spent the last decade building.',
      },
      {
        heading: 'Your spreadsheet data imports directly',
        body: 'If your spreadsheet has columns for name, description, value, and condition, it can be imported into Vitrine. CSV import is available on the Hobbyist plan and above.',
      },
    ],
    competitorPrice: 'Free',
    competitorPriceNote: 'but limited for serious collections',
    whyNow: 'Every item you add to the spreadsheet is one more to re-key later.',
    migrationSteps: [
      {
        heading: 'Clean up your spreadsheet',
        body: 'Ensure your spreadsheet has clear column headers: title (or name), description, category, condition, value, acquisition date, and any notes. Remove merged cells and blank rows.',
      },
      {
        heading: 'Save as CSV',
        body: 'In Excel: File → Save As → CSV. In Google Sheets: File → Download → CSV. This gives you a clean flat file ready to import.',
      },
      {
        heading: 'Import into Vitrine',
        body: 'On the Hobbyist plan and above, upload the CSV directly. Community users can copy-paste or re-enter items using the quick-add form. Most spreadsheets migrate in an evening.',
      },
      {
        heading: 'Add images and enrich your records',
        body: 'Once your items are in Vitrine, add photos, fill in any missing details, and set your collection visibility. Your collection now has a proper home.',
      },
    ],
    faqs: [
      {
        question: 'Can I import my Excel or Google Sheets collection into Vitrine?',
        answer:
          'Yes. Export your spreadsheet as CSV and import it into Vitrine. CSV import is available on the Hobbyist plan and above (max 500 rows per import). Community users can add items manually via quick-add.',
      },
      {
        question: 'Will I lose anything by switching from a spreadsheet?',
        answer:
          'If your spreadsheet has custom columns that do not map to Vitrine fields, you can store that data in the notes or description fields. You gain images, a public page, barcode scanning, and automatic value totals.',
      },
      {
        question: 'Is Vitrine better than Google Sheets for a small collection?',
        answer:
          'For a collection under 50 items, a spreadsheet is fine. Once you have images to track, values to total, or a collection you want to share, Vitrine becomes the better tool. The free Community plan costs nothing to try.',
      },
    ],
  },
  {
    slug: 'icollect-everything-alternative',
    name: 'iCollect Everything',
    metaTitle: 'Best iCollect Everything Alternative (2026)',
    metaDescription:
      'Looking for an iCollect Everything alternative? Vitrine is a modern, web-based collection management app for any collectible. No iOS required. Free to start.',
    keywords: [
      'icollect everything alternative',
      'icollect app alternative',
      'collection management app instead of icollect',
      'cross-platform collection app',
    ],
    h1: 'Best iCollect Everything Alternative (2026)',
    answerCapsule:
      'iCollect Everything is a native app suite for iOS, Android, Mac, and Windows. Managing multiple collection types requires separate one-time purchases or a Pro subscription, and the free tier caps at 15 items per collection. Vitrine covers every collection type in one account, with a generous free tier and no installs.',
    socialProofLine:
      'Every collection type in one account: 35 categories, no per-type unlocks, no app installs. Barcode scanning runs in the browser.',
    featureComparison: [
      { feature: 'Free tier', vitrine: 'Up to 100 items', competitor: '15 items per collection type', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'All collection types in one plan', vitrine: 'Yes (35 categories)', competitor: 'Pay per type or subscribe', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Public collection page', vitrine: 'Yes', competitor: 'Limited', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Barcode scanning', vitrine: 'Yes, in the browser', competitor: 'Yes', vitrineIcon: 'check', competitorIcon: 'check' },
      { feature: 'Install required', vitrine: 'No, works in any browser', competitor: 'Yes, per platform', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Pro subscription price', vitrine: '£5/month', competitor: '$69.99/year (~$5.83/month)', vitrineIcon: 'check', competitorIcon: 'neutral' },
    ],
    weaknessesHeading: 'Where iCollect Everything struggles',
    weaknesses: [
      {
        heading: 'Paying per collection type adds up',
        body: 'iCollect Everything free tier limits you to 15 items per collection type. To unlock unlimited items you either pay per collection (~$29 each, one-time) or subscribe to Pro at $69.99/year. A collector with three hobbies pays for three unlocks, or commits to the annual subscription.',
      },
      {
        heading: 'App installs required on every device',
        body: 'iCollect Everything requires installing a native app on each device you want to use. Vitrine works in any browser: no installs, no updates to manage, accessible on whatever device you happen to have on you.',
      },
      {
        heading: 'Limited public sharing',
        body: 'Sharing your collection publicly or syncing across devices requires the Pro subscription. There is no dedicated public collection page for non-app users on the free tier.',
      },
    ],
    whySwitchPoints: [
      {
        heading: 'One subscription covers every collection type',
        body: 'Vitrine Hobbyist at £5/month covers all 35 categories in one place: coins, cards, comics, vinyl, LEGO, stamps, and more. No per-type purchases.',
      },
      {
        heading: 'Nothing to install',
        body: 'Vitrine is a web app. It works on iPhone, Android, Mac, Windows, Linux: any device with a browser. No app downloads, no App Store updates, no platform restrictions.',
      },
      {
        heading: 'Share with anyone, instantly',
        body: 'Your Vitrine collection page is public and shareable via a link. Anyone can view it without installing an app or creating an account.',
      },
    ],
    competitorPrice: '$69.99',
    competitorPriceNote: 'per year (Pro), or ~$29 per type one-time',
    competitorAnnualPrice: '$69.99/year (Pro)',
    vitrineAnnualPrice: '£60/year',
    savingsLine: 'Roughly the same price, every collection type included, no app installs.',
    whyNow: 'Three collection unlocks already costs more than a year of Vitrine.',
    migrationSteps: [
      {
        heading: 'Export from iCollect Everything',
        body: 'In the iCollect app, use the export or backup feature to create a CSV or spreadsheet of your collection. Exact steps vary by collection module.',
      },
      {
        heading: 'Prepare your data',
        body: 'Open the export in a spreadsheet app and ensure each item has clear columns for title, category, condition, and value.',
      },
      {
        heading: 'Add items to Vitrine',
        body: 'CSV import is available on the Hobbyist plan and above. Community users can add items via the quick-add form. Most iCollect collections migrate in an afternoon.',
      },
    ],
    faqs: [
      {
        question: 'Does Vitrine have a mobile app?',
        answer:
          'Vitrine is a web app optimised for mobile browsers. It works well on iPhone and Android with no app install, and barcode scanning runs directly in the browser. There is also a native Android app, Vitrine Capture, on Google Play, with an iOS version on the way.',
      },
      {
        question: 'How does Vitrine pricing compare to iCollect Everything?',
        answer:
          'iCollect Everything Pro is $69.99/year, with individual collection unlocks around $29 each. Vitrine Hobbyist is £5/month and covers every collection type in one account. Vitrine also has a free Community plan for up to 100 items.',
      },
      {
        question: 'Is Vitrine free to try?',
        answer:
          'Yes. The Community plan is free for up to 100 items with no credit card required.',
      },
    ],
  },
  {
    slug: 'collectify-alternative',
    name: 'Collectify',
    metaTitle: 'Best Collectify Alternative for Modern Collectors (2026)',
    metaDescription:
      'Collectify is dated Windows desktop software. Vitrine is the modern alternative: a web-based collection manager that works on any device. Free to start.',
    keywords: [
      'collectify alternative',
      'collectify app alternative',
      'modern collection management instead of collectify',
      'web-based collection management software',
    ],
    h1: 'Best Collectify Alternative for Modern Collectors (2026)',
    answerCapsule:
      'Collectify is Windows desktop software for managing collectibles. Functional, but showing its age. It requires a local install, has no web access, and offers no public sharing. Vitrine is the modern Collectify alternative: a web-based collection manager that works on any device, with a beautiful public collection page included. Free to start.',
    socialProofLine:
      'Browser-based, automatic cloud backup, public collection page, barcode scanning, 35 collection categories.',
    featureComparison: [
      { feature: 'Platform', vitrine: 'Web, any browser', competitor: 'Windows desktop only', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Mac, Linux, mobile', vitrine: 'Yes', competitor: 'No', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Cloud backup', vitrine: 'Automatic', competitor: 'Manual backup needed', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Public collection page', vitrine: 'Yes', competitor: 'No', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Barcode scanning', vitrine: 'Yes, in the browser', competitor: 'Limited', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Active development', vitrine: 'Yes', competitor: 'Minimal updates', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Free tier', vitrine: 'Up to 100 items', competitor: 'Trial version only', vitrineIcon: 'check', competitorIcon: 'cross' },
    ],
    weaknessesHeading: 'Where Collectify struggles for modern collectors',
    weaknesses: [
      {
        heading: 'Windows only, no Mac, mobile, or web access',
        body: 'Collectify is a Windows desktop app. Mac users cannot use it at all. There is no web interface, no mobile app, and no way to access your collection from any device other than the one it is installed on.',
      },
      {
        heading: 'Your data is at risk without manual backups',
        body: 'Collectify stores collection data locally on your hard drive. If your PC is lost, stolen, or fails, your collection records go with it unless you have set up a separate backup routine.',
      },
      {
        heading: 'No public collection page or sharing',
        body: 'Collectify has no output designed for sharing. There is no public page, no export to a viewable format, and no way to show your collection to others without giving them access to your PC.',
      },
    ],
    whySwitchPoints: [
      {
        heading: 'Access your collection from any device',
        body: 'Vitrine is a web app. Open it on your Windows PC, your Mac, your phone, or a tablet. Your collection is available anywhere with a browser and an internet connection.',
      },
      {
        heading: 'Automatic cloud backup',
        body: 'Every item in Vitrine is backed up automatically. No local database to manage, no backup schedule to remember, no risk of losing everything to a hard drive failure.',
      },
      {
        heading: 'A public collection page',
        body: 'Every Vitrine account includes a public-facing collection website. Share your collection with a link. No special software needed on the viewer end.',
      },
    ],
    competitorPrice: 'One-time purchase',
    competitorPriceNote: 'Windows only, no cloud, no mobile',
    whyNow: 'Every new entry on a Windows-only app is one more to migrate when you change machines.',
    migrationSteps: [
      {
        heading: 'Export from Collectify',
        body: 'In Collectify, use File → Export to generate a CSV or XML file of your collection records.',
      },
      {
        heading: 'Convert to CSV if needed',
        body: 'If Collectify exports as XML, use a free XML-to-CSV tool or open it in Excel and save as CSV.',
      },
      {
        heading: 'Import into Vitrine',
        body: 'CSV import is available on the Hobbyist plan and above. Community users can use the quick-add form to migrate manually.',
      },
    ],
    faqs: [
      {
        question: 'Can I use Vitrine on Windows like Collectify?',
        answer:
          'Yes, plus Mac, Linux, iPhone, and Android. Vitrine is a web app that works in any browser.',
      },
      {
        question: 'Is Vitrine actively maintained?',
        answer:
          'Yes. Vitrine is a live SaaS product with regular updates, new features, and ongoing support. Collectify receives minimal updates.',
      },
      {
        question: 'What happens to my Collectify data if I switch?',
        answer:
          'Export your Collectify collection as CSV before switching. That data can be imported into Vitrine so you do not have to start from scratch.',
      },
    ],
  },
  {
    slug: 'discogs-alternative',
    name: 'Discogs',
    metaTitle: 'Best Discogs Alternative for Vinyl Collectors (2026)',
    metaDescription:
      'Discogs is a marketplace first, catalogue second. Vitrine is the best Discogs alternative for cataloguing vinyl: your photos, your condition notes, your data. Free to start.',
    keywords: [
      'discogs alternative',
      'vinyl collection management software',
      'vinyl record cataloguing app',
      'discogs vs vitrine',
    ],
    h1: 'Best Discogs Alternative for Vinyl Collectors (2026)',
    answerCapsule:
      'Discogs is the biggest music database and marketplace in the world, and its collection tool is built around that marketplace. Your copy of a record — its photos, its condition story, its paperwork — has nowhere to live. Vitrine is a catalogue-first alternative for vinyl collectors. Free to start, with paid plans from £5/month.',
    socialProofLine:
      'Photos of your actual copies, condition and provenance notes, value history, and a public collection page. Plus 34 other collection types in the same account.',
    featureComparison: [
      { feature: 'Built for', vitrine: 'Cataloguing your collection', competitor: 'Marketplace & database', vitrineIcon: 'check', competitorIcon: 'neutral' },
      { feature: 'Photos of your copy', vitrine: 'Up to 10 per record', competitor: 'Shared release images only', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Collection types', vitrine: '35 categories', competitor: 'Physical music only', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Storage location & insurance', vitrine: 'Built in', competitor: 'Not supported', vitrineIcon: 'check', competitorIcon: 'cross' },
      { feature: 'Value tracking', vitrine: 'Your value, with history', competitor: 'Marketplace min/median/max', vitrineIcon: 'check', competitorIcon: 'neutral' },
      { feature: 'Public collection page', vitrine: 'Custom site, your branding', competitor: 'Database list view', vitrineIcon: 'check', competitorIcon: 'neutral' },
      { feature: 'Built-in marketplace', vitrine: 'No', competitor: 'The biggest in music', vitrineIcon: 'cross', competitorIcon: 'check' },
      { feature: 'Price', vitrine: 'Free up to 100 items', competitor: 'Collection tool is free', vitrineIcon: 'neutral', competitorIcon: 'check' },
    ],
    weaknessesHeading: 'Where Discogs falls short as a catalogue',
    weaknesses: [
      {
        heading: 'Your records, the database’s photos',
        body: 'A Discogs collection entry points at the shared release page. You cannot attach photos of your copy: the one with the corner ding, the original inner sleeve, the signature on the cover. For condition documentation and insurance, your copy is the whole point.',
      },
      {
        heading: 'Music only',
        body: 'Vinyl, CDs, cassettes. The same person who collects records usually collects other things too: gig posters, band shirts, books, hi-fi. None of it has a home on Discogs, so the rest of the collection ends up in a spreadsheet anyway.',
      },
      {
        heading: 'Market statistics are not a valuation record',
        body: 'Discogs shows minimum, median, and maximum from marketplace sales: a genuinely useful signal. But it is not a valuation register. No valuer, no basis, no date, no attached documents. Nothing an insurer would accept.',
      },
    ],
    whySwitchPoints: [
      {
        heading: 'A record of your actual copies',
        body: 'Every record in Vitrine gets its own photos, condition notes, provenance, and purchase-price-versus-current-value tracking. Your catalogue describes what is on your shelf, not the idealised release in a database.',
      },
      {
        heading: 'Every collection in one catalogue',
        body: 'Vinyl alongside everything else you collect: 35 built-in categories with structured fields per type, plus custom fields for anything that does not fit a template.',
      },
      {
        heading: 'A public page that does your shelves justice',
        body: 'Every Vitrine account includes a public collection website with your branding, not a database grid. A per-item privacy toggle keeps the valuable pieces private while the rest is on show.',
      },
    ],
    competitorPrice: 'Free',
    competitorPriceNote: 'collection tool is free; selling carries marketplace fees',
    whyNow: 'Every record logged only on Discogs is one more without photos of your copy, paperwork, or a value you can stand behind.',
    migrationSteps: [
      {
        heading: 'Export your Discogs collection',
        body: 'Discogs supports CSV export of your full collection, including artist, title, label, catalogue number, and your media and sleeve condition grades.',
      },
      {
        heading: 'Import into Vitrine',
        body: 'On the Hobbyist plan and above, upload the CSV via the importer and map the columns: artist, title, catalogue number, and condition all have homes. Max 500 rows per import.',
      },
      {
        heading: 'Photograph your copies',
        body: 'Add photos of each copy: sleeve, labels, inners, inserts. This is the part Discogs could never hold, and the part your catalogue has been missing.',
      },
    ],
    faqs: [
      {
        question: 'Should I delete my Discogs account?',
        answer:
          'No. Discogs is unbeatable as a music database and marketplace, and most collectors should keep using it for discography reference, buying, and selling. Vitrine replaces it as the catalogue of record: the place where your copies, their condition, and their value actually live.',
      },
      {
        question: 'Can I import my Discogs collection into Vitrine?',
        answer:
          'Yes. Export your collection from Discogs as CSV and import it on the Hobbyist plan and above. Artist, title, label, catalogue number, and condition grades map directly to Vitrine fields.',
      },
      {
        question: 'Does Vitrine handle pressing details and catalogue numbers?',
        answer:
          'Yes. The vinyl category includes structured fields for pressing and catalogue details, and custom fields cover anything specific to your collecting niche, from matrix numbers to mono/stereo variants.',
      },
      {
        question: 'Is Vitrine free like Discogs?',
        answer:
          'The Community plan is free for up to 100 items, then the Hobbyist plan is £5/month for up to 1,000. If all you want is a list tied to the Discogs database, Discogs costs nothing and does that well. Vitrine is for collectors who want more than a list.',
      },
    ],
  },
]

export function getCompetitor(slug: string): Competitor | undefined {
  return competitors.find((c) => c.slug === slug)
}
