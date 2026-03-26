export type Competitor = {
  slug: string
  name: string
  metaTitle: string
  metaDescription: string
  keywords: string[]
  h1: string
  answerCapsule: string
  featureComparison: { feature: string; vitrine: string; competitor: string }[]
  weaknesses: { heading: string; body: string }[]
  whySwitchPoints: { heading: string; body: string }[]
  competitorPrice: string
  competitorPriceNote: string
  migrationSteps: { heading: string; body: string }[]
  faqs: { question: string; answer: string }[]
}

export const competitors: Competitor[] = [
  {
    slug: 'delicious-library-alternative',
    name: 'Delicious Library',
    metaTitle: 'Best Delicious Library Alternative for Collectors (2026)',
    metaDescription:
      'Delicious Library shut down in November 2024. Vitrine is the best alternative — catalog books, movies, games, and any collection type in a modern web app. Free to start.',
    keywords: [
      'delicious library alternative',
      'delicious library replacement',
      'app to replace delicious library',
      'collection management app mac',
    ],
    h1: 'Best Delicious Library Alternative (2026)',
    answerCapsule:
      'Delicious Library shut down in November 2024, leaving thousands of collectors without a home for their data. Vitrine is the best replacement: a modern, web-based collection management platform that catalogs books, movies, games, vinyl, and any other collection type. Free to start, with paid plans from £5/month.',
    featureComparison: [
      { feature: 'Platform', vitrine: 'Web (any browser)', competitor: 'Mac desktop only' },
      { feature: 'Status', vitrine: 'Actively developed', competitor: 'Shut down Nov 2024' },
      { feature: 'Collection types', vitrine: 'Any type', competitor: 'Books, movies, games, music' },
      { feature: 'Public sharing', vitrine: 'Public collection page', competitor: 'None' },
      { feature: 'Free tier', vitrine: 'Yes — up to 100 items', competitor: 'N/A (discontinued)' },
      { feature: 'Data export', vitrine: 'CSV export', competitor: 'No longer available' },
    ],
    weaknesses: [
      {
        heading: 'Delicious Library no longer exists',
        body: 'Delicious Library announced its shutdown in November 2024. The app no longer works, and there is no way to purchase it or migrate data through official channels. Any data still held in the app is at risk as macOS updates break compatibility.',
      },
      {
        heading: 'Mac-only with no web or mobile access',
        body: 'Even when it was active, Delicious Library was a Mac desktop app with no web interface and no mobile app. Your collection data lived entirely on one machine — not accessible from your phone or a friend\'s computer.',
      },
      {
        heading: 'Limited to four collection types',
        body: 'Delicious Library catalogued books, DVDs, games, and music — nothing else. Collectors with coins, stamps, trading cards, vinyl records, or anything outside those four categories had nowhere to go.',
      },
    ],
    whySwitchPoints: [
      {
        heading: 'Your data stays yours and stays safe',
        body: 'Vitrine is a live, actively maintained web platform. Your collection is backed up, accessible from any browser, and exportable as CSV at any time. No more risk of an app disappearing overnight.',
      },
      {
        heading: 'Catalog anything — not just four media types',
        body: 'Vitrine supports any collection type: books, movies, games, vinyl records, trading cards, coins, stamps, LEGO, art, wine, and more. Add custom fields to match exactly what you collect.',
      },
      {
        heading: 'A public collection page you can share',
        body: 'Every Vitrine account gets a public-facing collection page. Share your library with friends, family, or the collector community — something Delicious Library never offered.',
      },
    ],
    competitorPrice: 'N/A',
    competitorPriceNote: 'Delicious Library has been discontinued',
    migrationSteps: [
      {
        heading: 'Export your data from Delicious Library',
        body: 'If you still have access to Delicious Library, export your collection as XML via File → Export. This gives you a structured file of all your items.',
      },
      {
        heading: 'Convert the export to CSV',
        body: 'Use a free online XML-to-CSV converter, or open the XML in a spreadsheet and save as CSV. Keep columns for title, creator, year, type, and any notes.',
      },
      {
        heading: 'Import into Vitrine',
        body: 'Professional plan users can import directly via CSV. Community and Hobbyist users can add items manually — most collections migrate in an evening.',
      },
      {
        heading: 'Set up your public collection page',
        body: 'Once imported, customise your public page, choose which items to display, and share the link with anyone who visited your old Delicious Library shelves.',
      },
    ],
    faqs: [
      {
        question: 'Can I recover my Delicious Library data?',
        answer: 'If you still have the app installed, export your data immediately via File → Export before your macOS version breaks compatibility. The XML export can be converted to CSV and imported into Vitrine.',
      },
      {
        question: 'Does Vitrine work on Mac?',
        answer: 'Vitrine is a web app that works in any browser on any device — Mac, PC, iPhone, Android, or tablet. There is nothing to install.',
      },
      {
        question: 'Can Vitrine catalog the same things as Delicious Library?',
        answer: 'Yes, and much more. Vitrine handles books, movies, games, and music — plus coins, stamps, trading cards, vinyl records, LEGO, art, wine, watches, and any custom collection type.',
      },
      {
        question: 'Is there a free plan?',
        answer: 'Yes. The Community plan is free and supports up to 100 items. The Hobbyist plan at £5/month supports up to 500 items.',
      },
    ],
  },
  {
    slug: 'catalogit-alternative',
    name: 'CatalogIt',
    metaTitle: 'Best CatalogIt Alternative for Hobbyist Collectors (2026)',
    metaDescription:
      'Looking for a CatalogIt alternative? Vitrine offers modern collection management for hobbyists at £5/month — no museum budget required. Free to start.',
    keywords: [
      'catalogit alternative',
      'catalogit vs vitrine',
      'cheaper alternative to catalogit',
      'collection management software for hobbyists',
    ],
    h1: 'Best CatalogIt Alternative for Hobbyist Collectors (2026)',
    answerCapsule:
      'CatalogIt is designed for museums and institutional collections, with pricing and complexity to match. Vitrine is the best CatalogIt alternative for hobbyist collectors: a modern web app with the same core cataloguing features at a fraction of the cost. Free to start, with paid plans from £5/month.',
    featureComparison: [
      { feature: 'Target user', vitrine: 'Hobbyists & small museums', competitor: 'Museums & institutions' },
      { feature: 'Personal starting price', vitrine: 'Free', competitor: '$149.99/year' },
      { feature: 'Museum starting price', vitrine: '£79/month', competitor: '$540/year' },
      { feature: 'Public collection page', vitrine: 'Included', competitor: 'Add-on / higher tier' },
      { feature: 'Custom fields', vitrine: 'Yes', competitor: 'Yes' },
      { feature: 'CSV import', vitrine: 'Professional plan', competitor: 'Yes' },
      { feature: 'Mobile access', vitrine: 'Web app (any browser)', competitor: 'iOS app' },
      { feature: 'Setup complexity', vitrine: 'Minutes', competitor: 'Hours to days' },
    ],
    weaknesses: [
      {
        heading: 'Priced for museums, not individuals',
        body: 'CatalogIt\'s personal plans start at $149.99/year — workable for some, but still a meaningful commitment for a hobbyist testing whether the software fits. Museum and organisation plans start at $540/year. Vitrine\'s Hobbyist plan is £5/month with a genuinely free tier to explore first.',
      },
      {
        heading: 'Built for professional cataloguers',
        body: 'CatalogIt\'s feature depth is genuinely impressive for institutions with staff cataloguers and compliance requirements. For hobbyists, most of that complexity becomes friction. Adding a coin or trading card takes more steps than it needs to.',
      },
      {
        heading: 'Free tier is very limited',
        body: 'CatalogIt offers a free tier capped at 50 entries — useful for a brief trial, but not enough to catalogue a real collection. Moving beyond it requires a paid subscription.',
      },
    ],
    whySwitchPoints: [
      {
        heading: 'Designed for collectors, not curators',
        body: 'Vitrine is built for people who collect because they love it — not to manage institutional provenance records. The interface is faster, simpler, and focused on the things personal collectors care about: values, condition, acquisition story, and sharing.',
      },
      {
        heading: 'Start free, upgrade only if you need to',
        body: 'The Community plan is free and gives you enough to catalog a meaningful collection. You can explore the platform thoroughly before spending anything.',
      },
      {
        heading: 'A beautiful public page for your collection',
        body: 'Vitrine gives every account a public-facing collection website that looks good enough to share with anyone. CatalogIt\'s public sharing is limited or gated behind higher tiers.',
      },
    ],
    competitorPrice: '$149.99',
    competitorPriceNote: 'per year (personal tier)',
    migrationSteps: [
      {
        heading: 'Export from CatalogIt',
        body: 'In CatalogIt, go to your collection and export records as CSV. CatalogIt supports standard CSV exports from the collection view.',
      },
      {
        heading: 'Clean up your CSV',
        body: 'Open the export in Excel or Google Sheets. Keep columns that map to Vitrine fields: title, description, category, condition, value, acquisition date, and notes.',
      },
      {
        heading: 'Import into Vitrine',
        body: 'Upload your cleaned CSV via the Vitrine importer (Professional plan). Community and Hobbyist users can add items manually using the quick-add flow.',
      },
    ],
    faqs: [
      {
        question: 'Is Vitrine as powerful as CatalogIt for serious collections?',
        answer: 'For personal collections of coins, cards, stamps, vinyl, and similar items, Vitrine covers everything most collectors need: custom fields, images, values, condition notes, and public sharing. CatalogIt has deeper institutional features that are unnecessary for hobbyist use.',
      },
      {
        question: 'Can I import my CatalogIt data into Vitrine?',
        answer: 'Yes. Export your CatalogIt collection as CSV, clean up the columns, and import into Vitrine. Professional plan users can bulk-import; other plans support manual entry.',
      },
      {
        question: 'Does Vitrine have a free plan?',
        answer: 'Yes — the Community plan is free and supports up to 100 items. CatalogIt does not offer a free tier.',
      },
      {
        question: 'Who is CatalogIt better for?',
        answer: 'CatalogIt is a strong choice for museums and institutions with professional cataloguers, compliance needs, and a budget for software. For individual hobbyist collectors, Vitrine is faster to set up and far more affordable.',
      },
    ],
  },
  {
    slug: 'sortly-alternative',
    name: 'Sortly',
    metaTitle: 'Best Sortly Alternative for Collectors (2026)',
    metaDescription:
      'Sortly is inventory software — not a collection management tool. Vitrine is the best Sortly alternative for collectors: built for cataloguing, not warehousing. Free to start.',
    keywords: [
      'sortly alternative for collections',
      'sortly alternative',
      'collection management instead of sortly',
      'sortly vs vitrine',
    ],
    h1: 'Best Sortly Alternative for Collectors (2026)',
    answerCapsule:
      'Sortly is inventory management software originally designed for businesses tracking assets and stock. Collectors use it because few dedicated alternatives exist — but it shows. Vitrine is purpose-built for personal collections: it understands condition grades, values, provenance, and public sharing in ways Sortly never will. Free to start.',
    featureComparison: [
      { feature: 'Built for collectors', vitrine: 'Yes', competitor: 'No — inventory management' },
      { feature: 'Public collection page', vitrine: 'Yes', competitor: 'No' },
      { feature: 'Condition & grading fields', vitrine: 'Yes', competitor: 'No' },
      { feature: 'Value tracking', vitrine: 'Yes', competitor: 'Purchase price only' },
      { feature: 'Free tier', vitrine: 'Up to 100 items', competitor: 'Up to 100 items (limited)' },
      { feature: 'Starting paid price', vitrine: '£5/month', competitor: '$49/month' },
      { feature: 'Collection sharing', vitrine: 'Public page per account', competitor: 'None' },
    ],
    weaknesses: [
      {
        heading: 'Sortly is inventory software, not a collection manager',
        body: 'Sortly was built for businesses tracking tools, equipment, and stock. It has no concept of grading, provenance, acquisition history, or the collector-specific metadata that makes a catalogue useful. You end up stuffing collection data into generic "notes" fields.',
      },
      {
        heading: 'No way to share or showcase your collection',
        body: 'Sortly has no public-facing output. There is no collection page you can share with other collectors, no public gallery, and no way to showcase what you\'ve built. For most collectors, sharing is the point.',
      },
      {
        heading: 'Expensive for what collectors actually need',
        body: 'Sortly\'s paid plans start at $49/month, priced for business use. Collector-specific features you\'d need — condition tracking, value history, public sharing — are simply absent at any price point.',
      },
    ],
    whySwitchPoints: [
      {
        heading: 'Purpose-built for collecting',
        body: 'Vitrine is designed from the ground up for personal collections. Every field, every view, and every feature is shaped around how collectors think about their items — not how a warehouse manager would.',
      },
      {
        heading: 'Public collection page included',
        body: 'Every Vitrine account comes with a public-facing collection website. Share your collection with the community, trade contacts, or family — something Sortly cannot do.',
      },
      {
        heading: 'A fraction of the price',
        body: 'Vitrine\'s Hobbyist plan is £5/month. Sortly\'s entry paid plan is $49/month — around ten times more — with none of the collector-specific features.',
      },
    ],
    competitorPrice: '$49',
    competitorPriceNote: 'per month (entry paid tier)',
    migrationSteps: [
      {
        heading: 'Export from Sortly',
        body: 'In Sortly, go to Settings → Export and download your inventory as CSV. The export includes name, description, quantity, price, and any custom fields.',
      },
      {
        heading: 'Map your fields to Vitrine',
        body: 'Open the CSV and rename columns: "Name" → title, "Description" → description, "Price" → value, and any custom fields → Vitrine\'s notes or custom fields.',
      },
      {
        heading: 'Import or re-enter in Vitrine',
        body: 'Use Vitrine\'s CSV importer (Professional plan) or add items manually using the quick-add flow. Most Sortly collections migrate in an afternoon.',
      },
    ],
    faqs: [
      {
        question: 'Why is Sortly popular with collectors if it\'s not designed for them?',
        answer: 'Until recently, the options for personal collection management were limited: expensive museum software, dated desktop apps, or generic inventory tools like Sortly. Vitrine is built specifically to fill that gap.',
      },
      {
        question: 'Can Vitrine replace Sortly for a non-collecting use case?',
        answer: 'Vitrine is optimised for personal collections, not business inventory. If you need to track tools, equipment, or stock across multiple locations, Sortly may still be the right tool. For any collecting hobby, Vitrine is the better fit.',
      },
      {
        question: 'Is Vitrine cheaper than Sortly?',
        answer: 'Yes — significantly. Vitrine\'s Hobbyist plan is £5/month versus Sortly\'s $49/month entry paid tier. Vitrine also has a free Community plan for up to 100 items.',
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
      'CLZ Apps is an established collection management suite covering comics, books, movies, games, and music — but it requires a separate app and subscription for each collection type, costs add up quickly, and the interface feels dated. Vitrine manages every collection type in one place, on the web, from £5/month.',
    featureComparison: [
      { feature: 'Platform', vitrine: 'Web (any browser)', competitor: 'Desktop + mobile apps' },
      { feature: 'Collection types in one app', vitrine: 'All types', competitor: 'One per app/subscription' },
      { feature: 'Public collection page', vitrine: 'Yes', competitor: 'CLZ Web (extra subscription)' },
      { feature: 'Barcode scanning', vitrine: 'Roadmap', competitor: 'Yes' },
      { feature: 'Starting price', vitrine: 'Free', competitor: '$20–30/year per app' },
      { feature: 'Modern UI', vitrine: 'Yes', competitor: 'Dated' },
    ],
    weaknesses: [
      {
        heading: 'A separate subscription for every collection type',
        body: 'CLZ offers individual apps for comics (CLZ Comics), books (CLZ Books), movies (CLZ Movies), music (CLZ Music), and games (CLZ Games). Each carries its own subscription cost. A collector with three different interests pays three times.',
      },
      {
        heading: 'Web access costs extra on top of your app subscription',
        body: 'CLZ\'s core products are mobile apps. CLZ Cloud (backup and sync) is free and included, but if you want to access your collection in a browser, that requires CLZ Web — a separate subscription per collection type, on top of what you\'re already paying for the mobile app.',
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
        heading: 'Web-native from day one — no extra subscription',
        body: 'Vitrine is built for the web. It works in any browser, on any device, with no software to install and no separate web subscription on top of your mobile one.',
      },
      {
        heading: 'A public collection page worth sharing',
        body: 'Every Vitrine account includes a public collection website. Share your comic long-box, your book library, or your vinyl collection with anyone — included in your plan, not bolted on.',
      },
    ],
    competitorPrice: '$20–30',
    competitorPriceNote: 'per year, per app',
    migrationSteps: [
      {
        heading: 'Export from CLZ',
        body: 'In any CLZ app, go to Tools → Export and choose CSV or XML. The export includes titles, creators, years, condition, and value fields.',
      },
      {
        heading: 'Prepare your export',
        body: 'Open the file in a spreadsheet and ensure columns map cleanly: title, creator/author, year, condition, value, and notes.',
      },
      {
        heading: 'Import into Vitrine',
        body: 'Professional plan users can bulk-import via CSV. For other plans, the quick-add flow makes manual entry fast for most collections.',
      },
    ],
    faqs: [
      {
        question: 'Does Vitrine support barcode scanning like CLZ?',
        answer: 'Barcode scanning is on the Vitrine roadmap. In the meantime, items can be added quickly using the manual entry form, which is fast for most collection types.',
      },
      {
        question: 'Can I manage comics specifically in Vitrine?',
        answer: 'Yes. Vitrine supports comic book collections with fields for series, issue number, grade, CGC certification number, and condition. See the dedicated comic book collection page for details.',
      },
      {
        question: 'How does Vitrine\'s pricing compare to CLZ?',
        answer: 'Vitrine is free for up to 100 items, then £5/month for up to 500 items. CLZ charges $20–30/year per app — so a collector using three CLZ apps pays $60–90/year versus Vitrine\'s £60/year for everything.',
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
      'Most serious collectors start with a spreadsheet. It works — until it doesn\'t. Spreadsheets have no images, no public sharing, and no value totals that update automatically. Vitrine is purpose-built collection management software that handles everything a spreadsheet can\'t. Free to start, with paid plans from £5/month.',
    featureComparison: [
      { feature: 'Images per item', vitrine: 'Yes', competitor: 'No (links only)' },
      { feature: 'Public collection page', vitrine: 'Yes', competitor: 'No' },
      { feature: 'Collection value total', vitrine: 'Automatic', competitor: 'Manual formula' },
      { feature: 'Search and filter', vitrine: 'Instant', competitor: 'Filter/VLOOKUP required' },
      { feature: 'Mobile access', vitrine: 'Yes (web app)', competitor: 'Limited (Google Sheets)' },
      { feature: 'Sharing with others', vitrine: 'Public page or link', competitor: 'Shared document (editable)' },
      { feature: 'Designed for collections', vitrine: 'Yes', competitor: 'No — general purpose' },
    ],
    weaknesses: [
      {
        heading: 'Spreadsheets break past a few hundred items',
        body: 'Filtering, searching, and calculating values across 500+ rows is slow and error-prone. Formulas break. Columns drift. What starts as a clean tracker becomes a maintenance burden.',
      },
      {
        heading: 'No images, no visual catalogue',
        body: 'A spreadsheet can store a URL to a photo, but it cannot display your collection visually. You can\'t browse your coins or trading cards the way you\'d browse a proper catalogue.',
      },
      {
        heading: 'Sharing is messy',
        body: 'Sharing a Google Sheet means giving someone edit access or a view-only link that looks like a spreadsheet. There\'s no way to present your collection in a way that does it justice.',
      },
    ],
    whySwitchPoints: [
      {
        heading: 'Every item has a visual record',
        body: 'Add photos to each item in your Vitrine collection. Browse your catalogue visually, see condition details at a glance, and build a proper archive of what you own.',
      },
      {
        heading: 'A public collection page in minutes',
        body: 'Every Vitrine account comes with a public-facing collection website. Share it with fellow collectors, use it as a trade list, or show family what you\'ve spent the last decade building.',
      },
      {
        heading: 'Your spreadsheet data imports directly',
        body: 'If your spreadsheet has columns for name, description, value, and condition, it can be imported into Vitrine. No manual re-entry required for Professional plan users.',
      },
    ],
    competitorPrice: 'Free',
    competitorPriceNote: '(but limited for serious collections)',
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
        body: 'Professional plan users can upload the CSV directly. Community and Hobbyist users can copy-paste or re-enter items using the quick-add form — most spreadsheets migrate in an evening.',
      },
      {
        heading: 'Add images and enrich your records',
        body: 'Once your items are in Vitrine, add photos, fill in any missing details, and set your collection visibility. Your collection now has a proper home.',
      },
    ],
    faqs: [
      {
        question: 'Can I import my Excel or Google Sheets collection into Vitrine?',
        answer: 'Yes. Export your spreadsheet as CSV and import it into Vitrine. Professional plan users can bulk-import; Community and Hobbyist users can add items manually.',
      },
      {
        question: 'Will I lose anything by switching from a spreadsheet?',
        answer: 'If your spreadsheet has custom columns that don\'t map to Vitrine fields, you can store that data in the notes or description fields. You gain images, a public page, and automatic value totals.',
      },
      {
        question: 'Is Vitrine better than Google Sheets for a small collection?',
        answer: 'For a collection under 50 items, a spreadsheet is fine. Once you have images to track, values to total, or a collection you want to share, Vitrine becomes the better tool — and the free Community plan costs nothing to try.',
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
      'iCollect Everything is a native app for iOS, Android, Mac, and Windows — but managing multiple collection types requires separate one-time purchases or an annual Pro subscription, and the free tier caps you at 15 items per collection. Vitrine is the best iCollect Everything alternative: a web-based collection manager with a generous free tier and no per-type charges. Free to start.',
    featureComparison: [
      { feature: 'Platform', vitrine: 'Web (any browser)', competitor: 'iOS, Android, Mac, Windows apps' },
      { feature: 'No install required', vitrine: 'Yes', competitor: 'No — app install required per platform' },
      { feature: 'Public collection page', vitrine: 'Yes', competitor: 'Limited' },
      { feature: 'Free tier', vitrine: 'Up to 100 items', competitor: '15 items per collection type' },
      { feature: 'All collection types in one plan', vitrine: 'Yes', competitor: 'Separate purchase per type, or Pro subscription' },
      { feature: 'Pro subscription price', vitrine: '£5/month', competitor: '$69.99/year (~$5.83/month)' },
    ],
    weaknesses: [
      {
        heading: 'Paying per collection type adds up',
        body: 'iCollect Everything\'s free tier limits you to 15 items per collection type. To unlock unlimited items you either pay per collection type (~$29 each, one-time) or subscribe to the Pro plan at $69.99/year. A collector with three hobbies pays for three unlocks, or commits to the annual subscription.',
      },
      {
        heading: 'App installs required on every device',
        body: 'iCollect Everything requires installing a native app on each device you want to use. Vitrine works in any browser — no installs, no updates to manage, and accessible on any device you happen to be using.',
      },
      {
        heading: 'Limited public sharing',
        body: 'Sharing your collection publicly or syncing across devices requires the Pro subscription. There is no dedicated public collection page to share with non-app users on the free tier.',
      },
    ],
    whySwitchPoints: [
      {
        heading: 'One subscription covers every collection type',
        body: 'Vitrine\'s Hobbyist plan at £5/month covers all your collections in one place — coins, cards, comics, vinyl, LEGO, stamps, and more. No per-type purchases.',
      },
      {
        heading: 'Nothing to install',
        body: 'Vitrine is a web app. It works on iPhone, Android, Mac, Windows, Linux — any device with a browser. No app downloads, no App Store updates, no platform restrictions.',
      },
      {
        heading: 'Share with anyone, instantly',
        body: 'Your Vitrine collection page is public and shareable via a link. Anyone can view it without installing an app or creating an account.',
      },
    ],
    competitorPrice: '$69.99',
    competitorPriceNote: 'per year (Pro subscription) or ~$29 per collection type one-time',
    migrationSteps: [
      {
        heading: 'Export from iCollect Everything',
        body: 'In the iCollect app, use the export or backup feature to create a CSV or spreadsheet of your collection. The exact steps vary by collection module.',
      },
      {
        heading: 'Prepare your data',
        body: 'Open the export in a spreadsheet app and ensure each item has clear columns for title, category, condition, and value.',
      },
      {
        heading: 'Add items to Vitrine',
        body: 'Import via CSV (Professional plan) or use the quick-add form to add items manually. Most iCollect collections migrate in an afternoon.',
      },
    ],
    faqs: [
      {
        question: 'Does Vitrine have a mobile app?',
        answer: 'Vitrine is a web app optimised for mobile browsers — it works well on iPhone and Android without an app install. A native mobile app is on the roadmap.',
      },
      {
        question: 'How does Vitrine\'s pricing compare to iCollect Everything?',
        answer: 'iCollect Everything\'s Pro plan is $69.99/year; individual collection type unlocks are around $29 each. Vitrine\'s Hobbyist plan is £5/month and covers every collection type in one account. Vitrine also has a free Community plan for up to 100 items.',
      },
      {
        question: 'Is Vitrine free to try?',
        answer: 'Yes. The Community plan is free for up to 100 items with no credit card required.',
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
      'Collectify is Windows desktop software for managing collectibles — functional, but showing its age. It requires a local install, has no web access, and offers no public sharing. Vitrine is the modern Collectify alternative: a web-based collection manager that works on any device with a beautiful public collection page included. Free to start.',
    featureComparison: [
      { feature: 'Platform', vitrine: 'Web (any browser)', competitor: 'Windows desktop only' },
      { feature: 'Mac / Linux support', vitrine: 'Yes (browser)', competitor: 'No' },
      { feature: 'Public collection page', vitrine: 'Yes', competitor: 'No' },
      { feature: 'Cloud backup', vitrine: 'Yes (automatic)', competitor: 'Manual backup required' },
      { feature: 'Mobile access', vitrine: 'Yes (browser)', competitor: 'No' },
      { feature: 'Active development', vitrine: 'Yes', competitor: 'Minimal updates' },
      { feature: 'Free tier', vitrine: 'Yes — up to 100 items', competitor: 'Trial version only' },
    ],
    weaknesses: [
      {
        heading: 'Windows only — no Mac, mobile, or web access',
        body: 'Collectify is a Windows desktop app. Mac users cannot use it at all. There is no web interface, no mobile app, and no way to access your collection from any device other than the one it\'s installed on.',
      },
      {
        heading: 'Your data is at risk without manual backups',
        body: 'Collectify stores collection data locally on your hard drive. If your PC is lost, stolen, or fails, your collection records go with it unless you\'ve set up a separate backup routine.',
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
        body: 'Every item in Vitrine is backed up automatically. There\'s no local database to manage, no backup schedule to remember, and no risk of losing everything to a hard drive failure.',
      },
      {
        heading: 'A public collection page',
        body: 'Every Vitrine account includes a public-facing collection website. Share your collection with a link — no special software needed on the viewer\'s end.',
      },
    ],
    competitorPrice: 'One-time purchase',
    competitorPriceNote: 'Windows only; no cloud features',
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
        body: 'Professional plan users can upload the CSV directly. Community and Hobbyist users can use the quick-add form to migrate manually.',
      },
    ],
    faqs: [
      {
        question: 'Can I use Vitrine on Windows like Collectify?',
        answer: 'Yes — and also on Mac, Linux, iPhone, and Android. Vitrine is a web app that works in any browser.',
      },
      {
        question: 'Is Vitrine actively maintained?',
        answer: 'Yes. Vitrine is a live SaaS product with regular updates, new features, and ongoing support. Collectify receives minimal updates.',
      },
      {
        question: 'What happens to my Collectify data if I switch?',
        answer: 'Export your Collectify collection as CSV before switching. That data can be imported into Vitrine so you don\'t have to start from scratch.',
      },
    ],
  },
]

export function getCompetitor(slug: string): Competitor | undefined {
  return competitors.find((c) => c.slug === slug)
}
