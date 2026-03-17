import { SupabaseClient } from '@supabase/supabase-js'

// ── Shared props interface ───────────────────────────────────────────────
export interface TabProps {
  museum: any
  object: any
  canEdit: boolean
  supabase: SupabaseClient
  logActivity: (actionType: string, description: string) => Promise<void>
}

export interface FormTabProps extends TabProps {
  form: Record<string, any>
  set: (field: string, value: any) => void
  saving: boolean
  saved: boolean
}

// ── Shared CSS classes ───────────────────────────────────────────────────
export const inputCls = 'w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100'
export const labelCls = 'block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5'
export const sectionTitle = 'text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-4'

// ── Shared constants ─────────────────────────────────────────────────────
export const MEDIUMS = [
  'Oil on canvas','Acrylic','Watercolour','Gouache','Tempera','Pastel','Charcoal','Ink','Oil on panel',
  'Fresco','Encaustic','Egg tempera','Collage','Mixed media','Digital','Film / Video',
  'Sculpture','Bronze','Marble','Stone','Plaster','Terracotta','Ceramics','Glass','Enamel','Mosaic',
  'Photography','Print','Etching','Lithograph','Screen print','Engraving','Woodcut',
  'Textiles','Embroidery','Tapestry','Leather','Metalwork','Wood','Paper','Ivory','Bone','Other',
]
export const STATUSES = ['Entry','On Display','Storage','On Loan','Restoration','Conservation','Deaccessioned']
export const EMOJIS = ['🖼️','🏺','🗿','💎','📜','👗','🏮','🗡️','🪞','🧣','⚗️','🌿','📷','🎨']
export const OBJECT_TYPES = ['Painting','Drawing','Print','Photograph','Sculpture','Ceramic','Textile','Furniture','Metalwork','Glass','Archaeological','Natural History','Document / Archive','Other']
export const ACQ_METHODS = ['Purchase','Gift','Bequest','Transfer','Found','Fieldwork','Exchange','Unknown']
export const CONDITION_GRADES = ['Excellent','Good','Fair','Poor','Critical']
export const TREATMENT_TYPES = ['Cleaning','Restoration','Examination','Condition Check','Other']
export const COPYRIGHT_OPTIONS = ['In Copyright','Out of Copyright','Public Domain','Unknown','CC BY','CC BY-SA','CC BY-NC']
export const DISPOSAL_METHODS = ['Sale','Transfer','Destruction','Return to Owner','Exchange','Unknown']
export const LOCATION_REASONS = ['Display change','Conservation','Loan','Inventory','Security','Other']
export const TITLE_GUARANTEE_OPTIONS = ['Deed of Gift','Bill of Sale','Transfer document','Found in collection','Unknown','Other']
export const INSURANCE_TYPES = ['Own policy','Borrower\'s policy','Government Indemnity Scheme','None']
export const INVENTORY_OUTCOMES = ['Present and correct','Present — location differs','Not found','Found in collection','No prior record']
export const ENTRY_REASONS = ['Potential acquisition', 'Loan in', 'Enquiry', 'Return from loan', 'Found in collection']
export const ENTRY_OUTCOMES = ['Pending', 'Acquired', 'Returned to depositor', 'Transferred to loan', 'Disposed']
export const VALUATION_METHODS = ['Market value', 'Insurance value', 'Replacement cost', 'Expert opinion', 'Auction estimate']
export const VALUATION_PURPOSES = ['Insurance', 'Sale', 'Estate', 'Grant', 'Other']
export const CURRENCIES = ['GBP', 'USD', 'EUR', 'CHF', 'AUD', 'CAD', 'JPY']
export const EXIT_REASONS = ['Return to depositor', 'Outgoing loan', 'Transfer', 'Disposal', 'Conservation', 'Photography', 'Sale']
export const TEMP_REASONS = new Set(['Outgoing loan', 'Conservation', 'Photography'])
export const RISK_TYPES = ['Theft', 'Fire', 'Flood', 'Pest', 'Light damage', 'Handling damage', 'Environmental', 'Provenance', 'Legal', 'Other']
export const RISK_SEVERITIES = ['Low', 'Medium', 'High', 'Critical']
export const RISK_LIKELIHOODS = ['Low', 'Medium', 'High']
export const DAMAGE_TYPES = ['Accidental', 'Environmental', 'Theft', 'Vandalism', 'Pest', 'Handling', 'Transit', 'Unknown']
export const DAMAGE_SEVERITIES = ['Minor', 'Moderate', 'Significant', 'Severe', 'Total Loss']

export const CONDITION_STYLES: Record<string, string> = {
  'Excellent': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  'Good':      'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
  'Fair':      'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  'Poor':      'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  'Critical':  'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
}

export const RISK_SEVERITY_STYLES: Record<string, string> = {
  Critical: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  High:     'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Medium:   'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
  Low:      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
}

export const CULTURES = [
  'British', 'English', 'Scottish', 'Welsh', 'Irish',
  'French', 'German', 'Italian', 'Spanish', 'Portuguese', 'Dutch', 'Flemish',
  'Netherlandish', 'Belgian', 'Swiss', 'Austrian', 'Scandinavian', 'Norwegian',
  'Swedish', 'Danish', 'Russian', 'Greek', 'Roman', 'Byzantine',
  'Ottoman', 'Persian', 'Islamic', 'Egyptian', 'African',
  'American', 'Canadian', 'Australian', 'Japanese', 'Chinese', 'Korean',
  'Indian', 'Mughal', 'Aztec', 'Mayan', 'Pre-Columbian', 'Viking',
  'Medieval European', 'Renaissance', 'Baroque', 'Rococo',
]

export const PRODUCTION_PLACES = [
  'London', 'Edinburgh', 'Dublin', 'Paris', 'Rome', 'Florence', 'Venice',
  'Milan', 'Naples', 'Amsterdam', 'Antwerp', 'Brussels', 'Bruges', 'Ghent',
  'Berlin', 'Vienna', 'Prague', 'Madrid', 'Seville', 'Lisbon',
  'New York', 'Boston', 'Philadelphia', 'Washington D.C.',
  'Beijing', 'Shanghai', 'Kyoto', 'Tokyo', 'Delhi', 'Jaipur',
  'Cairo', 'Istanbul', 'Athens', 'Jerusalem', 'Samarkand',
  'Mexico City', 'Lima', 'Sydney', 'Cape Town',
]

// ── Cataloguing constants (Proc 5) ──────────────────────────────────────
export const MAKER_ROLES = ['Artist', 'Maker', 'Manufacturer', 'Designer', 'Attributed to', 'Workshop of', 'School of', 'After', 'Unknown']
export const DATE_QUALIFIERS = ['Exact', 'Circa', 'Before', 'After', 'Between']
export const DIMENSION_UNITS = ['cm', 'mm', 'in', 'm']
export const WEIGHT_UNITS = ['kg', 'g', 'lb', 'oz']

// ── Rights constants (Proc 18) ───────────────────────────────────────
export const RIGHTS_TYPES = ['Copyright', 'Reproduction', 'Moral rights', 'Intellectual property', 'Publication', 'Performance', 'Database rights', 'Other']
export const RIGHTS_STATUSES = ['Active', 'Expired', 'Under review', 'Disputed', 'Unknown']
export const REPRODUCTION_TYPES = ['Digital photograph', 'Film scan', 'Photocopy', '3D scan', 'Cast / mould', 'Print', 'Other']

export const DAMAGE_SEVERITY_STYLES: Record<string, string> = {
  'Total Loss':  'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  Severe:        'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  Significant:   'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Moderate:      'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
  Minor:         'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
}
