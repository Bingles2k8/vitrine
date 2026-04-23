// Seeds an example Hobbyist-tier account with 15 natural-history specimens,
// Wikimedia-sourced images uploaded to R2, a public site, and a wanted list.
// Idempotent: re-running removes the previous example user/museum first.
//
// Run: node --env-file=.env.local scripts/seed-example-natural-history.mjs

import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { randomUUID } from 'node:crypto'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_OBJECT_IMAGES_PUBLIC_URL = process.env.R2_OBJECT_IMAGES_PUBLIC_URL
const R2_MUSEUM_ASSETS_PUBLIC_URL = process.env.R2_MUSEUM_ASSETS_PUBLIC_URL

for (const [k, v] of Object.entries({
  SUPABASE_URL, SERVICE_ROLE_KEY, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY, R2_OBJECT_IMAGES_PUBLIC_URL, R2_MUSEUM_ASSETS_PUBLIC_URL,
})) {
  if (!v) { console.error(`Missing env: ${k}`); process.exit(1) }
}

const EMAIL = 'example-natural-history@vitrinecms.com'
const PASSWORD = 'ClaudeTest2026!'
const SLUG = 'example-natural-history'
const MUSEUM_NAME = 'Example Natural History Collection'
const TAGLINE = 'A demonstration collection — not a real museum'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
})

const publicUrl = (bucket, path) =>
  bucket === 'object-images'
    ? `${R2_OBJECT_IMAGES_PUBLIC_URL}/${path}`
    : `${R2_MUSEUM_ASSETS_PUBLIC_URL}/${path}`

// ────────────────────────────────────────────────────────────
// Specimens
// ────────────────────────────────────────────────────────────

// Each image entry is either a direct upload.wikimedia.org URL OR a
// Wikimedia Commons filename. The script resolves filenames via the
// Commons API before download. Caption + attribution come from Commons.

const SPECIMENS = [
  {
    accession_no: 'NH-2024-001',
    title: 'Pyritised Ammonite (Asteroceras obtusum)',
    emoji: '🐚',
    object_type: 'Fossil',
    medium: 'Pyritised ammonite in limestone matrix',
    physical_materials: 'Iron pyrite, calcite, limestone',
    description: 'A well-preserved coiled ammonite cephalopod from the Lower Jurassic cliffs of the Dorset coast, partially replaced by golden iron pyrite.',
    full_description: 'Asteroceras obtusum is an index fossil for the Sinemurian stage of the Early Jurassic. This specimen was recovered from a limestone nodule on the foreshore at Black Ven, near Lyme Regis, and has undergone diagenetic replacement whereby the original aragonitic shell has been substituted by iron pyrite. The suture lines are clearly visible on the body chamber.',
    artist: 'Nature (Lower Jurassic, Sinemurian stage)',
    production_date: 'c. 195 million years BP',
    production_date_early: '-200000000',
    production_date_late: '-190000000',
    production_place: 'Black Ven, Lyme Regis, Dorset, England',
    origin_country: 'United Kingdom',
    origin_place: 'Black Ven, Lyme Regis, Dorset',
    origin_lat: 50.7265, origin_lng: -2.9233,
    origin_map_public: true,
    dimension_height: 85, dimension_width: 85, dimension_depth: 20,
    dimension_weight: 145, dimension_unit: 'mm', dimension_weight_unit: 'g',
    condition_grade: 'Good',
    is_featured: true, featured_order: 0,
    estimated_value: 180, estimated_value_currency: 'GBP',
    acquisition_method: 'Purchase',
    acquisition_source: 'Lyme Regis fossil fair',
    acquisition_date: '2022-05-14',
    acquisition_value: 150, acquisition_currency: 'GBP',
    accession_date: '2022-05-20',
    status: 'On Display',
    current_location: 'Cabinet A, Shelf 1',
    category: 'Natural History',
    ethics_cites: false,
    rarity: 'Common',
    images: [
      { page: 'Asteroceras_obtusum', caption: 'Asteroceras obtusum specimen, showing pyritised shell' },
    ],
  },
  {
    accession_no: 'NH-2024-002',
    title: 'Phacops Trilobite',
    emoji: '🪲',
    object_type: 'Fossil',
    medium: 'Calcified trilobite in limestone',
    physical_materials: 'Calcite, limestone matrix',
    description: 'A fully prepared Middle Devonian trilobite with compound eyes and articulated thoracic segments visible.',
    full_description: 'Phacops is a genus of trilobites from the Middle Devonian of North Africa and Europe. This specimen was mechanically prepared from a black limestone nodule found at Alnif, in the Anti-Atlas mountains of Morocco — one of the world\'s most prolific trilobite localities. The schizochroal eyes, each with hundreds of calcite lenses, are a diagnostic feature of the genus.',
    production_date: 'c. 390 million years BP',
    production_date_early: '-395000000',
    production_date_late: '-385000000',
    production_place: 'Alnif, Anti-Atlas, Morocco',
    origin_country: 'Morocco',
    origin_place: 'Alnif, Anti-Atlas',
    origin_lat: 31.1167, origin_lng: -4.8500,
    origin_map_public: true,
    dimension_height: 65, dimension_width: 40, dimension_depth: 12,
    dimension_weight: 85, dimension_unit: 'mm', dimension_weight_unit: 'g',
    condition_grade: 'Excellent',
    is_featured: false,
    estimated_value: 95, estimated_value_currency: 'GBP',
    acquisition_method: 'Purchase',
    acquisition_source: 'Mineralogical dealer, Tucson Gem Show 2023',
    acquisition_date: '2023-02-09',
    acquisition_value: 85, acquisition_currency: 'USD',
    accession_date: '2023-03-01',
    status: 'On Display',
    current_location: 'Cabinet A, Shelf 2',
    category: 'Natural History',
    rarity: 'Common',
    images: [
      { page: 'Phacops', caption: 'Phacops trilobite specimen from Morocco' },
    ],
  },
  {
    accession_no: 'NH-2024-003',
    title: 'Amethyst Geode Cluster',
    emoji: '💎',
    object_type: 'Mineral specimen',
    medium: 'Quartz variety (amethyst) on basalt matrix',
    physical_materials: 'Silicon dioxide (SiO₂) with iron impurities',
    colour: 'Deep violet to pale lavender',
    description: 'A hollow basalt geode half, lined with deep-violet quartz crystals, from the Artigas basalts of northern Uruguay.',
    full_description: 'Formed in gas cavities within the Paraná–Etendeka flood basalts of the Early Cretaceous, Uruguayan amethyst is prized for its saturated violet colour, attributed to trace iron and natural irradiation. This half-geode has been cut and polished on the rim to expose a druse of euhedral crystals up to 25 mm long. Hardness 7 (Mohs).',
    production_place: 'Artigas Department, Uruguay',
    origin_country: 'Uruguay',
    origin_place: 'Artigas',
    origin_lat: -30.4000, origin_lng: -56.4667,
    origin_map_public: true,
    dimension_height: 180, dimension_width: 120, dimension_depth: 90,
    dimension_weight: 2400, dimension_unit: 'mm', dimension_weight_unit: 'g',
    condition_grade: 'Excellent',
    is_featured: true, featured_order: 1,
    estimated_value: 220, estimated_value_currency: 'GBP',
    acquisition_method: 'Purchase',
    acquisition_source: 'Private mineral collector, Birmingham',
    acquisition_date: '2021-11-03',
    acquisition_value: 180, acquisition_currency: 'GBP',
    accession_date: '2021-11-10',
    status: 'On Display',
    current_location: 'Plinth, main case',
    category: 'Natural History',
    rarity: 'Common',
    images: [
      { page: 'Amethyst', caption: 'Amethyst crystal cluster' },
    ],
  },
  {
    accession_no: 'NH-2024-004',
    title: 'Pyrite Cube Cluster',
    emoji: '🟨',
    object_type: 'Mineral specimen',
    medium: 'Pyrite on marl matrix',
    physical_materials: 'Iron disulfide (FeS₂)',
    colour: 'Pale brassy yellow',
    description: 'Natural interpenetrating pyrite cubes with mirror-sharp faces, from the celebrated Navajún locality.',
    full_description: 'The Ampliación a Victoria mine at Navajún, La Rioja, is the type locality for gem-quality cubic pyrite. Crystals grow within a grey marl of Cretaceous age, and are extracted whole. This cluster shows five distinct cubes in parallel growth, the largest 25 mm on edge, with pristine faces unaffected by the usual oxidation. Specific gravity 5.0; Mohs hardness 6–6.5.',
    production_place: 'Navajún, La Rioja, Spain',
    origin_country: 'Spain',
    origin_place: 'Navajún, La Rioja',
    origin_lat: 42.1833, origin_lng: -2.1833,
    origin_map_public: true,
    dimension_height: 70, dimension_width: 60, dimension_depth: 45,
    dimension_weight: 380, dimension_unit: 'mm', dimension_weight_unit: 'g',
    condition_grade: 'Excellent',
    is_featured: false,
    estimated_value: 140, estimated_value_currency: 'GBP',
    acquisition_method: 'Purchase',
    acquisition_source: 'Online mineral auction',
    acquisition_date: '2023-07-22',
    acquisition_value: 120, acquisition_currency: 'GBP',
    accession_date: '2023-08-01',
    status: 'On Display',
    current_location: 'Cabinet B, Shelf 1',
    category: 'Natural History',
    rarity: 'Uncommon',
    images: [
      { page: 'Pyrite', caption: 'Pyrite cube cluster from Navajún' },
    ],
  },
  {
    accession_no: 'NH-2024-005',
    title: 'Botryoidal Malachite',
    emoji: '🟢',
    object_type: 'Mineral specimen',
    medium: 'Massive malachite',
    physical_materials: 'Copper carbonate hydroxide (Cu₂CO₃(OH)₂)',
    colour: 'Banded dark green to pale green',
    description: 'A botryoidal (grape-like) malachite cabochon showing concentric banding of alternating dark and pale green zones.',
    full_description: 'Malachite forms by the weathering of copper sulphide ores and typically develops in the oxidation zone of copper deposits. The Katanga region of the Democratic Republic of Congo has produced the world\'s finest specimens since the 19th century. This piece has been sliced and polished to reveal the characteristic banding. Hazard: fine dust is toxic if inhaled or ingested; the polished surface is stable.',
    production_place: 'Kolwezi, Katanga Province, DR Congo',
    origin_country: 'Democratic Republic of the Congo',
    origin_place: 'Kolwezi, Katanga',
    origin_lat: -10.7167, origin_lng: 25.4667,
    origin_map_public: true,
    dimension_height: 95, dimension_width: 75, dimension_depth: 40,
    dimension_weight: 520, dimension_unit: 'mm', dimension_weight_unit: 'g',
    condition_grade: 'Excellent',
    is_featured: false,
    estimated_value: 180, estimated_value_currency: 'GBP',
    hazard_note: 'Toxic if inhaled as dust; handle polished specimens with clean hands.',
    acquisition_method: 'Purchase',
    acquisition_source: 'Mineral fair, Munich 2022',
    acquisition_date: '2022-10-28',
    acquisition_value: 160, acquisition_currency: 'EUR',
    accession_date: '2022-11-05',
    status: 'On Display',
    current_location: 'Cabinet B, Shelf 2',
    category: 'Natural History',
    rarity: 'Common',
    images: [
      { page: 'Malachite', caption: 'Botryoidal malachite specimen' },
    ],
  },
  {
    accession_no: 'NH-2024-006',
    title: 'Chambered Nautilus Shell (halved, polished)',
    emoji: '🐚',
    object_type: 'Zoological specimen',
    medium: 'Aragonitic shell',
    physical_materials: 'Calcium carbonate (aragonite), mother-of-pearl',
    description: 'A bisected nautilus shell showing the internal chambers arranged in a logarithmic spiral, polished to reveal the nacreous layer.',
    full_description: 'Nautilus pompilius is the most familiar living representative of the ancient cephalopod subclass Nautiloidea, which has a fossil record stretching back to the Late Cambrian. The animal occupies only the outermost (body) chamber; the remaining gas-filled chambers provide buoyancy. This specimen was sourced from commercial fisheries in the Philippines prior to the 2016 CITES Appendix II listing of the genus, and is accompanied by documentation of legal import.',
    production_place: 'Cebu, Philippines (commercial fisheries, pre-2016)',
    origin_country: 'Philippines',
    origin_place: 'Cebu',
    origin_lat: 10.3157, origin_lng: 123.8854,
    origin_map_public: true,
    dimension_height: 140, dimension_width: 160, dimension_depth: 70,
    dimension_weight: 210, dimension_unit: 'mm', dimension_weight_unit: 'g',
    condition_grade: 'Excellent',
    is_featured: true, featured_order: 2,
    estimated_value: 75, estimated_value_currency: 'GBP',
    ethics_cites: true,
    acquisition_method: 'Purchase',
    acquisition_source: 'Estate sale, Kent',
    acquisition_date: '2020-06-15',
    acquisition_value: 60, acquisition_currency: 'GBP',
    accession_date: '2020-07-01',
    acquisition_ethics_notes: 'Specimen pre-dates 2016 CITES Appendix II listing of Nautilus pompilius. Kept for educational use; not offered for sale.',
    status: 'On Display',
    current_location: 'Cabinet C, Shelf 1',
    category: 'Natural History',
    rarity: 'Common',
    images: [
      { page: 'Nautilus_pompilius', caption: 'Chambered nautilus shell, sectioned' },
    ],
  },
  {
    accession_no: 'NH-2024-007',
    title: 'Blue Morpho Butterfly (Morpho peleides)',
    emoji: '🦋',
    object_type: 'Entomological specimen',
    medium: 'Pinned butterfly in riker mount',
    physical_materials: 'Dried insect, glass-topped pine box, acid-free cotton',
    colour: 'Iridescent blue (dorsal); brown with eyespots (ventral)',
    description: 'A captive-bred Blue Morpho pinned in a conservation-quality riker mount, wings spread to show the structurally-coloured dorsal surface.',
    full_description: 'The dazzling blue of Morpho peleides arises not from pigment but from microscopic lamellar ridges on the wing scales that scatter blue light — an example of structural colouration. This specimen was reared at a licensed butterfly farm in Costa Rica as part of a sustainable rainforest-conservation programme, and exported with CITES non-detriment findings under CITES Article IV. Wingspan: 110 mm.',
    production_place: 'Costa Rica (captive-bred, licensed farm)',
    origin_country: 'Costa Rica',
    origin_place: 'La Guácima, Alajuela',
    origin_lat: 9.9333, origin_lng: -84.2167,
    origin_map_public: true,
    dimension_height: 70, dimension_width: 110, dimension_depth: 30,
    dimension_weight: 4, dimension_unit: 'mm', dimension_weight_unit: 'g',
    condition_grade: 'Excellent',
    is_featured: true, featured_order: 3,
    estimated_value: 55, estimated_value_currency: 'GBP',
    acquisition_method: 'Purchase',
    acquisition_source: 'Licensed butterfly supplier, UK',
    acquisition_date: '2023-04-10',
    acquisition_value: 45, acquisition_currency: 'GBP',
    accession_date: '2023-04-18',
    acquisition_ethics_notes: 'Captive-bred; legal export documentation retained.',
    status: 'On Display',
    current_location: 'Entomology drawer 1',
    category: 'Natural History',
    rarity: 'Common',
    images: [
      { page: 'Morpho_peleides', caption: 'Blue Morpho butterfly, dorsal view' },
    ],
  },
  {
    accession_no: 'NH-2024-008',
    title: 'European Stag Beetle (Lucanus cervus), male',
    emoji: '🪲',
    object_type: 'Entomological specimen',
    medium: 'Pinned beetle',
    physical_materials: 'Dried insect, entomology pin, label',
    colour: 'Dark brown with chestnut mandibles',
    description: 'Adult male stag beetle showing the enormously enlarged mandibles used in contests between males.',
    full_description: 'Lucanus cervus is Britain\'s largest terrestrial beetle. Larvae develop for up to seven years in decaying broadleaf wood, especially oak. This male specimen (70 mm) was found deceased beneath a street lamp in the New Forest during the 2019 flight season; no living insects were taken. The species is listed under the EU Habitats Directive (Annex II) and the UK Biodiversity Action Plan.',
    production_place: 'New Forest, Hampshire, UK (found dead)',
    origin_country: 'United Kingdom',
    origin_place: 'New Forest, Hampshire',
    origin_lat: 50.8700, origin_lng: -1.5700,
    origin_map_public: true,
    dimension_height: 70, dimension_width: 35, dimension_depth: 20,
    dimension_weight: 3, dimension_unit: 'mm', dimension_weight_unit: 'g',
    condition_grade: 'Good',
    is_featured: false,
    estimated_value: 25, estimated_value_currency: 'GBP',
    acquisition_method: 'Found',
    acquisition_source: 'New Forest, collected deceased',
    acquisition_date: '2019-07-02',
    accession_date: '2019-07-15',
    acquisition_ethics_notes: 'Collected post-mortem; no living animals taken. Species protected under UK BAP.',
    status: 'Storage',
    current_location: 'Entomology drawer 2',
    category: 'Natural History',
    rarity: 'Uncommon',
    images: [
      { page: 'Lucanus_cervus', caption: 'Male European stag beetle' },
    ],
  },
  {
    accession_no: 'NH-2024-009',
    title: 'Petrified Wood Slice (Araucarioxylon arizonicum)',
    emoji: '🪵',
    object_type: 'Fossil',
    medium: 'Silicified fossil wood, polished',
    physical_materials: 'Chalcedony, jasper, chert',
    colour: 'Reds, ochres, yellows, black',
    description: 'A polished slice of Late Triassic coniferous wood permineralised with silica, from the Chinle Formation of Arizona.',
    full_description: 'Araucarioxylon arizonicum is the Arizona state fossil. During the Late Triassic, trees were buried in volcanic ash-rich floodplains and groundwater rich in dissolved silica permeated the woody tissue, preserving cell structure down to the micron scale. Iron and manganese impurities produce the vivid reds, yellows and blacks. This specimen was acquired from a private ranch adjoining the Petrified Forest National Park, where collection on private land remains lawful; no material from federal land is included.',
    production_date: 'c. 225 million years BP',
    production_date_early: '-230000000',
    production_date_late: '-220000000',
    production_place: 'Chinle Formation, Navajo County, Arizona, USA',
    origin_country: 'United States',
    origin_place: 'Holbrook, Arizona',
    origin_lat: 34.9020, origin_lng: -110.1582,
    origin_map_public: true,
    dimension_height: 220, dimension_width: 200, dimension_depth: 15,
    dimension_weight: 1150, dimension_unit: 'mm', dimension_weight_unit: 'g',
    condition_grade: 'Excellent',
    is_featured: true, featured_order: 4,
    estimated_value: 95, estimated_value_currency: 'GBP',
    acquisition_method: 'Purchase',
    acquisition_source: 'Rock shop, Holbrook AZ (specimens from adjoining private land)',
    acquisition_date: '2018-09-22',
    acquisition_value: 75, acquisition_currency: 'USD',
    accession_date: '2018-10-10',
    acquisition_ethics_notes: 'Collected from private land adjoining Petrified Forest NP; dealer provided provenance documentation.',
    status: 'On Display',
    current_location: 'Wall mount, main hall',
    category: 'Natural History',
    rarity: 'Common',
    images: [
      { page: 'Petrified_wood', caption: 'Polished petrified wood slice' },
    ],
  },
  {
    accession_no: 'NH-2024-010',
    title: 'Heart-Urchin Fossil (Micraster coranguinum)',
    emoji: '🦔',
    object_type: 'Fossil',
    medium: 'Chalk-preserved echinoid',
    physical_materials: 'Flint-infilled calcite test in chalk',
    description: 'A heart-shaped echinoid ("sea potato") preserved in the Upper Chalk, showing the characteristic petaloid ambulacra.',
    full_description: 'Micraster is a zone fossil for the Coniacian–Campanian stages of the Upper Cretaceous in north-west Europe. The five-rayed petaloid pattern on the dorsal surface marks the pore-pairs where the animal extended its tube feet for respiration. This specimen was collected by Charles Warnock, a Victorian collector, as recorded in the pencilled annotation on the base.',
    production_date: 'c. 85 million years BP',
    production_date_early: '-90000000',
    production_date_late: '-80000000',
    production_place: 'Chalk, Kent, UK',
    origin_country: 'United Kingdom',
    origin_place: 'Margate chalk cliffs, Kent',
    origin_lat: 51.3850, origin_lng: 1.3855,
    origin_map_public: true,
    dimension_height: 55, dimension_width: 60, dimension_depth: 35,
    dimension_weight: 95, dimension_unit: 'mm', dimension_weight_unit: 'g',
    condition_grade: 'Good',
    is_featured: false,
    estimated_value: 35, estimated_value_currency: 'GBP',
    provenance: 'Charles Warnock collection (late 19th century); subsequently acquired through Bonhams natural history auction, 2021.',
    acquisition_method: 'Purchase',
    acquisition_source: 'Bonhams auction, Knightsbridge',
    acquisition_date: '2021-03-17',
    acquisition_value: 30, acquisition_currency: 'GBP',
    accession_date: '2021-04-02',
    status: 'Storage',
    current_location: 'Cabinet A, Shelf 3',
    category: 'Natural History',
    rarity: 'Common',
    images: [
      { page: 'Micraster', caption: 'Fossil heart urchin preserved in chalk' },
    ],
  },
  {
    accession_no: 'NH-2024-011',
    title: 'Alethopteris Fern Fossil',
    emoji: '🌿',
    object_type: 'Fossil',
    medium: 'Carbonised plant impression in siltstone',
    physical_materials: 'Siltstone with carbonaceous residue',
    description: 'Pinnate fern-like fronds preserved as a carbonised film on a split siltstone slab from the coal measures of Pennsylvania.',
    full_description: 'Despite its fern-like appearance, Alethopteris is the foliage of a seed fern (medullosan pteridosperm), not a true fern. Specimens such as this are associated with the great Carboniferous coal forests of Euramerica. The St. Clair locality in Pennsylvania is famed for exceptional preservation of plant fossils as a white pyrophyllite mineralisation against the dark siltstone.',
    production_date: 'c. 310 million years BP',
    production_date_early: '-315000000',
    production_date_late: '-305000000',
    production_place: 'St. Clair, Schuylkill County, Pennsylvania, USA',
    origin_country: 'United States',
    origin_place: 'St. Clair, Pennsylvania',
    origin_lat: 40.7176, origin_lng: -76.1883,
    origin_map_public: true,
    dimension_height: 150, dimension_width: 110, dimension_depth: 15,
    dimension_weight: 420, dimension_unit: 'mm', dimension_weight_unit: 'g',
    condition_grade: 'Good',
    is_featured: false,
    estimated_value: 45, estimated_value_currency: 'GBP',
    acquisition_method: 'Gift',
    acquisition_source: 'Donated by retired geology teacher, Cheshire',
    acquisition_date: '2023-01-28',
    accession_date: '2023-02-05',
    is_gift: true,
    status: 'Storage',
    current_location: 'Cabinet A, Shelf 4',
    category: 'Natural History',
    rarity: 'Common',
    images: [
      { page: 'Alethopteris', caption: 'Alethopteris fern frond in siltstone' },
    ],
  },
  {
    accession_no: 'NH-2024-012',
    title: 'Megalodon Shark Tooth (Otodus megalodon)',
    emoji: '🦈',
    object_type: 'Fossil',
    medium: 'Fossilised tooth, enamel and dentine',
    physical_materials: 'Phosphate-mineralised tooth',
    colour: 'Slate grey crown, ochre root',
    description: 'A 120 mm slant-height tooth from the largest macropredator of the Cenozoic, with serrated cutting edges intact.',
    full_description: 'Otodus megalodon reached lengths estimated at 15–18 m and preyed on whales throughout Miocene and Pliocene seas. Dredged from river-bed gravels off the South Carolina coast, this tooth retains both lateral cusplets (a juvenile feature retained on some positional teeth) and fine serrations. Slant height: 120 mm.',
    production_date: 'c. 10 million years BP',
    production_date_early: '-15000000',
    production_date_late: '-3600000',
    production_place: 'Coastal rivers, South Carolina, USA',
    origin_country: 'United States',
    origin_place: 'Cooper River, South Carolina',
    origin_lat: 33.0000, origin_lng: -79.9000,
    origin_map_public: true,
    dimension_height: 120, dimension_width: 95, dimension_depth: 25,
    dimension_weight: 310, dimension_unit: 'mm', dimension_weight_unit: 'g',
    condition_grade: 'Very Good',
    is_featured: true, featured_order: 5,
    estimated_value: 420, estimated_value_currency: 'GBP',
    acquisition_method: 'Purchase',
    acquisition_source: 'Licensed fossil diver, Charleston SC',
    acquisition_date: '2022-08-14',
    acquisition_value: 380, acquisition_currency: 'USD',
    accession_date: '2022-09-01',
    status: 'On Display',
    current_location: 'Main case, central plinth',
    category: 'Natural History',
    rarity: 'Uncommon',
    images: [
      { page: 'Megalodon', caption: 'Otodus megalodon tooth' },
    ],
  },
  {
    accession_no: 'NH-2024-013',
    title: 'Belemnite Guards (Cylindroteuthis puzosiana)',
    emoji: '🖋️',
    object_type: 'Fossil',
    medium: 'Calcite rostra',
    physical_materials: 'Calcite',
    description: 'Three bullet-shaped belemnite guards from the Kimmeridge Clay of the Dorset coast.',
    full_description: 'Belemnites were extinct cephalopods related to modern squid; the guard (rostrum) is the solid calcite counter-weight at the tail end of the internal shell. The Kimmeridge Clay has yielded vast numbers of Cylindroteuthis, particularly in the pyritic horizons. These three were collected loose on the foreshore at Kimmeridge Bay within the Jurassic Coast World Heritage Site, under the local fossil-collecting code.',
    production_date: 'c. 155 million years BP',
    production_date_early: '-160000000',
    production_date_late: '-150000000',
    production_place: 'Kimmeridge Clay, Dorset, England',
    origin_country: 'United Kingdom',
    origin_place: 'Kimmeridge Bay, Dorset',
    origin_lat: 50.6075, origin_lng: -2.1341,
    origin_map_public: true,
    dimension_height: 110, dimension_width: 70, dimension_depth: 20,
    dimension_weight: 180, dimension_unit: 'mm', dimension_weight_unit: 'g',
    condition_grade: 'Good',
    is_featured: false,
    estimated_value: 30, estimated_value_currency: 'GBP',
    acquisition_method: 'Collected',
    acquisition_source: 'Kimmeridge Bay foreshore (under local collecting code)',
    acquisition_date: '2022-03-05',
    accession_date: '2022-03-12',
    acquisition_ethics_notes: 'Collected under the West Dorset Fossil Collecting Code of Conduct; loose specimens only, no hammering of in-situ cliffs.',
    status: 'Storage',
    current_location: 'Cabinet A, Shelf 5',
    category: 'Natural History',
    rarity: 'Common',
    images: [
      { page: 'Belemnitida', caption: 'Belemnite guards from the Jurassic Coast' },
    ],
  },
  {
    accession_no: 'NH-2024-014',
    title: 'Calcite on Sphalerite',
    emoji: '⬜',
    object_type: 'Mineral specimen',
    medium: 'Calcite crystals on sphalerite matrix',
    physical_materials: 'Calcium carbonate on zinc sulfide',
    colour: 'Colourless to pale honey calcite on dark-brown sphalerite',
    description: 'Scalenohedral calcite crystals (dogtooth spar) perched on a bed of dark-brown sphalerite, from the Tri-State Mining District.',
    full_description: 'The lead-zinc mines of the Tri-State District (Missouri–Kansas–Oklahoma) produced world-class specimens of galena, sphalerite and calcite until the mid-20th century. This classic combination shows a sharp contrast between transparent honey-coloured calcite scalenohedra and the resinous-lustred sphalerite beneath. A cabinet-grade historical specimen.',
    production_place: 'Sweetwater Mine, Reynolds County, Missouri, USA',
    origin_country: 'United States',
    origin_place: 'Sweetwater Mine, Missouri',
    origin_lat: 37.3333, origin_lng: -90.9167,
    origin_map_public: true,
    dimension_height: 120, dimension_width: 95, dimension_depth: 60,
    dimension_weight: 680, dimension_unit: 'mm', dimension_weight_unit: 'g',
    condition_grade: 'Excellent',
    is_featured: false,
    estimated_value: 150, estimated_value_currency: 'GBP',
    acquisition_method: 'Purchase',
    acquisition_source: 'Estate of the late Dr. J. Harrison, mineralogist',
    acquisition_date: '2020-11-19',
    acquisition_value: 125, acquisition_currency: 'GBP',
    accession_date: '2020-12-01',
    status: 'On Display',
    current_location: 'Cabinet B, Shelf 3',
    category: 'Natural History',
    rarity: 'Uncommon',
    images: [
      { page: 'Calcite', caption: 'Calcite scalenohedra on sphalerite' },
    ],
  },
  {
    accession_no: 'NH-2024-015',
    title: 'Star Sand (Foraminifera) from Okinawa',
    emoji: '⭐',
    object_type: 'Zoological specimen',
    medium: 'Foraminiferan tests in glass vial',
    physical_materials: 'Calcareous foraminiferal tests, glass, cork',
    description: 'Star-shaped single-celled organism tests (Baculogypsina sphaerulata and Calcarina spp.) sieved from beach sand on Taketomi Island.',
    full_description: 'Hoshizuna-no-Hama ("star sand beach") on Taketomi Island, Okinawa, is famous for the abundance of star-shaped foraminiferan tests in its sand. Each "star" is the calcareous skeleton of a single-celled organism that once lived attached to seagrass on the surrounding reef flats. Tests were sieved from a small handful of sand collected in 1998, before the island introduced collection restrictions. Presented in a 30 ml glass vial with 10× loupe.',
    production_place: 'Hoshizuna-no-Hama, Taketomi Island, Okinawa, Japan',
    origin_country: 'Japan',
    origin_place: 'Taketomi Island, Okinawa',
    origin_lat: 24.3333, origin_lng: 124.0833,
    origin_map_public: true,
    dimension_height: 55, dimension_width: 25, dimension_depth: 25,
    dimension_weight: 35, dimension_unit: 'mm', dimension_weight_unit: 'g',
    condition_grade: 'Excellent',
    is_featured: true, featured_order: 6,
    estimated_value: 20, estimated_value_currency: 'GBP',
    acquisition_method: 'Collected',
    acquisition_source: 'Collected in person, Taketomi Island (1998)',
    acquisition_date: '1998-08-04',
    accession_date: '2020-01-15',
    acquisition_ethics_notes: 'Collected prior to local restrictions; small quantity (<50 g).',
    status: 'On Display',
    current_location: 'Cabinet C, Shelf 2',
    category: 'Natural History',
    rarity: 'Uncommon',
    images: [
      { page: 'Foraminifera', caption: 'Star-shaped foraminiferan tests' },
    ],
  },
]

const WANTED_ITEMS = [
  { title: 'Dinosaur tooth (theropod, Hell Creek Formation)', year: 'Late Cretaceous', medium: 'Fossil tooth', priority: 'high', notes: 'Ideally Nanotyrannus or small tyrannosaurid; slant height 20 mm+.' },
  { title: 'Opalised ammonite (Madagascar)', year: 'Cretaceous', medium: 'Iridescent ammonite', priority: 'medium', notes: 'Cleoniceras or Desmoceras genus preferred.' },
  { title: 'Campo del Cielo meteorite slice', year: 'c. 4000 years BP (fall)', medium: 'Iron meteorite, etched', priority: 'medium', notes: 'Widmanstätten pattern visible; 50–100 g range.' },
  { title: 'Fluorite crystal, Rogerley Mine', year: 'Modern extraction', medium: 'Daylight-fluorescent fluorite', priority: 'high', notes: 'Weardale, County Durham — daylight fluorescence prized.' },
  { title: 'Crinoid plate (Crawfordsville, Indiana)', year: 'Mississippian', medium: 'Fossil crinoids on limestone', priority: 'low', notes: 'Multiple articulated crowns on single slab.' },
  { title: 'Archaeopteryx cast, Solnhofen', year: 'Late Jurassic (cast)', medium: 'Resin cast', priority: 'low', notes: 'Museum-quality cast acceptable.' },
]

// ────────────────────────────────────────────────────────────
// Wikimedia image resolution
// ────────────────────────────────────────────────────────────

async function resolveWikipediaLeadImage(pageTitle) {
  // Uses Wikipedia REST API summary endpoint; returns direct upload.wikimedia.org URL
  const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`, {
    headers: { 'User-Agent': 'VitrineSeeder/1.0 (https://vitrinecms.com; bingles2k8@gmail.com)' },
  })
  if (!r.ok) throw new Error(`Wikipedia REST ${r.status} for ${pageTitle}`)
  const j = await r.json()
  if (!j.originalimage?.source) throw new Error(`No lead image for ${pageTitle}`)
  return {
    url: j.originalimage.source,
    attribution: `Wikipedia: ${j.title}`,
    pageUrl: j.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`,
  }
}

async function download(url) {
  const r = await fetch(url, {
    headers: { 'User-Agent': 'VitrineSeeder/1.0 (https://vitrinecms.com; bingles2k8@gmail.com)' },
  })
  if (!r.ok) throw new Error(`Download ${r.status} ${url}`)
  const buf = Buffer.from(await r.arrayBuffer())
  const contentType = r.headers.get('content-type') ?? 'image/jpeg'
  return { buf, contentType }
}

function extFromContentType(ct) {
  if (ct.includes('png')) return 'png'
  if (ct.includes('webp')) return 'webp'
  if (ct.includes('svg')) return 'svg'
  return 'jpg'
}

async function uploadToR2(bucket, path, buf, contentType) {
  await r2.send(new PutObjectCommand({
    Bucket: bucket, Key: path, Body: buf, ContentType: contentType,
  }))
  return publicUrl(bucket, path)
}

// ────────────────────────────────────────────────────────────
// Cleanup previous demo account (idempotency)
// ────────────────────────────────────────────────────────────

async function cleanup() {
  console.log('[cleanup] Removing previous example account if present…')

  // Find existing auth user
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 })
  const existingUser = list?.users?.find(u => u.email === EMAIL)

  // Find existing museum (by slug or by owner_id)
  let museumIds = []
  const { data: museumsBySlug } = await supabase.from('museums').select('id').eq('slug', SLUG)
  museumIds.push(...(museumsBySlug ?? []).map(m => m.id))
  if (existingUser) {
    const { data: museumsByOwner } = await supabase.from('museums').select('id').eq('owner_id', existingUser.id)
    museumIds.push(...(museumsByOwner ?? []).map(m => m.id))
  }
  museumIds = [...new Set(museumIds)]

  // Delete R2 assets under each museum prefix
  for (const mid of museumIds) {
    for (const bucket of ['object-images', 'museum-assets']) {
      const listed = await r2.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: `${mid}/` }))
      for (const obj of listed.Contents ?? []) {
        await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: obj.Key }))
      }
    }
  }

  // Delete museum rows (cascades to objects, object_images, wanted_items)
  for (const mid of museumIds) {
    await supabase.from('museums').delete().eq('id', mid)
  }

  // Delete auth user
  if (existingUser) {
    await supabase.auth.admin.deleteUser(existingUser.id)
  }

  console.log(`[cleanup] removed ${museumIds.length} museum(s), ${existingUser ? 1 : 0} user(s)`)
}

// ────────────────────────────────────────────────────────────
// Create auth user + museum
// ────────────────────────────────────────────────────────────

async function createUserAndMuseum() {
  console.log('[auth] Creating user…')
  const { data: created, error: userErr } = await supabase.auth.admin.createUser({
    email: EMAIL, password: PASSWORD, email_confirm: true,
  })
  if (userErr) throw userErr
  const userId = created.user.id
  console.log(`[auth] user id = ${userId}`)

  const museumId = randomUUID()
  console.log(`[museum] Creating museum id = ${museumId}`)

  // Fetch banner and logo from Wikipedia
  console.log('[museum] Resolving banner + logo images from Wikimedia…')
  const banner = await resolveWikipediaLeadImage('Natural_history_museum')
    .catch(() => resolveWikipediaLeadImage('Cabinet_of_curiosities'))
  const { buf: bannerBuf, contentType: bannerCt } = await download(banner.url)
  const bannerPath = `${museumId}/banner-${Date.now()}.${extFromContentType(bannerCt)}`
  const bannerUrl = await uploadToR2('museum-assets', bannerPath, bannerBuf, bannerCt)

  // Use the ammonite as the logo (small, iconic)
  const logo = await resolveWikipediaLeadImage('Ammonite')
  const { buf: logoBuf, contentType: logoCt } = await download(logo.url)
  const logoPath = `${museumId}/logo-${Date.now()}.${extFromContentType(logoCt)}`
  const logoUrl = await uploadToR2('museum-assets', logoPath, logoBuf, logoCt)

  const aboutText = `Welcome to the Example Natural History Collection — a demonstration collection curated to showcase Vitrine's capabilities for the hobbyist naturalist.

**This is not a real museum.** Every specimen record, image attribution, and piece of provenance on this site has been generated as sample content for prospective Vitrine users to explore.

The fictional collector began assembling these specimens in 2018 after a childhood spent hunting ammonites on the Dorset coast. The collection now comprises sixteen pieces spanning minerals, fossils, and zoological specimens, with a particular emphasis on ethically-sourced material and specimens with documented provenance.

## What you'll find here

- **Fossils** from the British Jurassic, Moroccan Devonian, Arizonan Triassic, and Carboniferous coal measures of Pennsylvania.
- **Minerals** from classic localities — Uruguayan amethyst, Spanish pyrite, Congolese malachite, Missouri calcite.
- **Zoological and entomological specimens** sourced under CITES-compliant channels, including captive-bred Lepidoptera and a post-mortem-collected British stag beetle.
- A **wanted list** highlighting the specimens currently being sought to complete planned displays.

## Ethical note

Where specimens raise CITES, UK BAP, or heritage concerns, acquisition notes document the chain of provenance. Real collectors building real collections should consult their national authorities before acquiring specimens similar to those shown here.`

  const museumInsert = {
    id: museumId,
    owner_id: userId,
    name: MUSEUM_NAME,
    slug: SLUG,
    plan: 'hobbyist',
    ui_mode: 'simple',
    tagline: TAGLINE,
    logo_emoji: '🦕',
    logo_image_url: logoUrl,
    hero_image_url: bannerUrl,
    hero_image_position: '50% 50%',
    heading_font: 'playfair',
    primary_color: '#2d3a2e',
    accent_color: '#c9a961',
    template: 'classic',
    about_text: aboutText,
    seo_description: 'An example Vitrine collection — 15 natural history specimens curated for demonstration purposes. Not a real museum.',
    contact_email: EMAIL,
    footer_text: '© Example Natural History Collection — a Vitrine demonstration account. No specimens are for sale.',
    collection_label: 'Specimens',
    collecting_since: '2018',
    collector_bio: 'Fictional naturalist-collector with a particular interest in British Jurassic palaeontology and classic mineral localities. This bio is illustrative only.',
    discoverable: true,
    collection_category: 'Natural History',
    show_wanted: true,
    show_collection_value: false,
    dark_mode: false,
    card_radius: 6,
    hero_height: 'large',
    grid_columns: 3,
    image_ratio: 'square',
    card_padding: 'normal',
    card_metadata: 'full',
    social_instagram: '',
    social_twitter: '',
    social_website: 'https://vitrinecms.com',
  }

  const { error: musErr } = await supabase.from('museums').insert(museumInsert)
  if (musErr) throw musErr

  console.log('[museum] created')
  return { userId, museumId }
}

// ────────────────────────────────────────────────────────────
// Insert specimens + images
// ────────────────────────────────────────────────────────────

async function seedSpecimens(museumId) {
  console.log(`[objects] seeding ${SPECIMENS.length} specimens…`)

  for (const spec of SPECIMENS) {
    const objectId = randomUUID()
    const { images, ...objectFields } = spec

    // Insert object row
    const objectRow = {
      id: objectId,
      museum_id: museumId,
      show_on_site: true,
      formally_accessioned: true,
      record_completeness: 'full',
      ...objectFields,
    }

    const { error: objErr } = await supabase.from('objects').insert(objectRow)
    if (objErr) {
      console.error(`[objects] ${spec.accession_no} FAIL: ${objErr.message}`)
      continue
    }

    // Resolve, upload and record each image
    let primaryUrl = null
    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      try {
        const resolved = await resolveWikipediaLeadImage(img.page)
        const { buf, contentType } = await download(resolved.url)
        const path = `${museumId}/${objectId}-${i}-${Date.now()}.${extFromContentType(contentType)}`
        const url = await uploadToR2('object-images', path, buf, contentType)
        if (i === 0) primaryUrl = url

        const caption = `${img.caption} — Image via ${resolved.attribution}`
        await supabase.from('object_images').insert({
          object_id: objectId,
          museum_id: museumId,
          url,
          caption,
          is_primary: i === 0,
          sort_order: i,
        })
        console.log(`  ✓ ${spec.accession_no} image ${i + 1}/${images.length}`)
      } catch (e) {
        console.error(`  ✗ ${spec.accession_no} image ${i + 1}: ${e.message}`)
      }
    }

    // Set objects.image_url to the primary image URL
    if (primaryUrl) {
      await supabase.from('objects').update({ image_url: primaryUrl }).eq('id', objectId)
    }

    console.log(`[objects] ${spec.accession_no}  ${spec.title}  ✓`)
  }
}

async function seedWanted(museumId) {
  console.log(`[wanted] seeding ${WANTED_ITEMS.length} items…`)
  for (const w of WANTED_ITEMS) {
    const { error } = await supabase.from('wanted_items').insert({
      museum_id: museumId, ...w,
    })
    if (error) console.error(`  ✗ ${w.title}: ${error.message}`)
    else console.log(`  ✓ ${w.title}`)
  }
}

// ────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────

async function main() {
  await cleanup()
  const { userId, museumId } = await createUserAndMuseum()
  await seedSpecimens(museumId)
  await seedWanted(museumId)

  console.log('\n══════════════════════════════════════════')
  console.log('  Seed complete')
  console.log('══════════════════════════════════════════')
  console.log(`  Email:    ${EMAIL}`)
  console.log(`  Password: ${PASSWORD}`)
  console.log(`  Museum:   ${MUSEUM_NAME}`)
  console.log(`  Slug:     ${SLUG}`)
  console.log(`  User ID:  ${userId}`)
  console.log(`  Museum:   ${museumId}`)
  console.log(`  Public:   https://vitrinecms.com/museum/${SLUG}`)
  console.log(`  Discover: https://vitrinecms.com/discover  (category: Natural History)`)
  console.log('══════════════════════════════════════════\n')
}

main().catch(e => {
  console.error('Seeder failed:', e)
  process.exit(1)
})
