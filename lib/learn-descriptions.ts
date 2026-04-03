export interface LearnEntry {
  label: string
  description: string
  technical?: {
    column?: string
    type?: string
    table?: string
    relationships?: string
    spectrum?: string
  }
}

export const learnDescriptions: Record<string, LearnEntry> = {

  // ── Navigation ────────────────────────────────────────────────────────
  'nav.objects': {
    label: 'Objects',
    description: 'Your main collection catalogue. Every item you manage lives here — search, filter, sort, and bulk-edit from the objects list.',
    technical: { table: 'objects', column: 'objects.*', type: 'Primary collection table' },
  },
  'nav.wanted': {
    label: 'Wanted',
    description: 'Your acquisition wishlist. Track objects you hope to acquire, with notes on priority and target price.',
    technical: { table: 'wanted_items', spectrum: 'Supports Procedure 2 — Acquisition planning' },
  },
  'nav.entry': {
    label: 'Object Entry',
    description: 'Record objects arriving at your museum — whether for potential acquisition, loan, or enquiry. Every incoming object should have an entry record before anything else happens.',
    technical: { table: 'entry_records', spectrum: 'Procedure 1 — Object Entry' },
  },
  'nav.register': {
    label: 'Accession Register',
    description: 'The formal register of objects accessioned into your permanent collection. Required for museum accreditation.',
    technical: { table: 'objects', column: 'objects.accession_no', spectrum: 'Procedure 2 — Accessioning' },
  },
  'nav.loans': {
    label: 'Loans Register',
    description: 'Manage loans in (borrowed from others) and loans out (lent to others). Track dates, insurance, conditions, and overdue returns.',
    technical: { table: 'loans', spectrum: 'Procedures 7 & 8 — Loans In / Loans Out' },
  },
  'nav.conservation': {
    label: 'Conservation',
    description: 'Log conservation treatments — cleaning, stabilisation, restoration. Attach before/after images and track costs.',
    technical: { table: 'conservation_treatments', spectrum: 'Procedure 12 — Conservation & Collections Care' },
  },
  'nav.audit': {
    label: 'Audit & Inventory',
    description: 'Run inventory checks to confirm objects are where they should be and in expected condition. Manage formal audit exercises.',
    technical: { table: 'audit_records, inventory_exercises', spectrum: 'Procedure 6 — Inventory Control' },
  },
  'nav.exits': {
    label: 'Object Exit',
    description: 'Record objects leaving your premises — for loans, returns, transfers, or disposal. Captures authorisation, transport, and receipt confirmation.',
    technical: { table: 'object_exits', spectrum: 'Procedure 16 — Object Exit' },
  },
  'nav.locations': {
    label: 'Location Register',
    description: 'Your master list of storage and display locations. Each location can have a code, building, floor, room, and unit for precise tracking.',
    technical: { table: 'locations', spectrum: 'Procedure 3 — Location & Movement Control' },
  },
  'nav.valuation': {
    label: 'Valuation Register',
    description: 'Log formal valuations with method, purpose, and valuer details. Track how your collection value changes over time.',
    technical: { table: 'valuations', spectrum: 'Procedure 13 — Valuation Control' },
  },
  'nav.risk': {
    label: 'Risk Register',
    description: 'Identify and assess risks to your collection — theft, fire, flood, pests, handling damage. Rate severity and likelihood, plan mitigations.',
    technical: { table: 'risk_register', spectrum: 'Procedure 15 — Risk Management' },
  },
  'nav.emergency': {
    label: 'Emergency Plans',
    description: 'Prepare for the worst. Create emergency plans for fire, flood, theft, and more. Set salvage priorities so your most important objects are saved first.',
    technical: { table: 'emergency_plans, emergency_salvage_priorities', spectrum: 'Procedure 15 — Emergency Planning' },
  },
  'nav.insurance': {
    label: 'Insurance',
    description: 'Manage insurance policies covering your collection. Link specific objects to policies and track renewal dates.',
    technical: { table: 'insurance_policies, insurance_policy_objects', spectrum: 'Procedure 14 — Insurance & Indemnity' },
  },
  'nav.damage': {
    label: 'Damage Reports',
    description: 'Document any damage or loss — accidental, environmental, theft, or vandalism. Track investigation, repair, and insurance claims.',
    technical: { table: 'damage_reports', spectrum: 'Procedure 16 — Damage & Loss' },
  },
  'nav.collections-use': {
    label: 'Use of Collections',
    description: 'Record authorised uses of your objects — research access, photography, exhibition loans, educational programmes.',
    technical: { table: 'collection_use_records', spectrum: 'Procedure 10 — Use of Collections' },
  },
  'nav.disposal': {
    label: 'Disposal',
    description: 'Manage the formal process of removing objects from your collection — sale, transfer, destruction, or return. Requires governing body approval.',
    technical: { table: 'disposal_records', spectrum: 'Procedure 17 — Deaccession & Disposal' },
  },
  'nav.collections-review': {
    label: 'Collections Review',
    description: 'Periodic review of your collection against your collecting policy. Identify objects for potential disposal or enhanced care.',
    technical: { table: 'collection_reviews', spectrum: 'Procedure 20 — Collections Review' },
  },
  'nav.docs': {
    label: 'Documentation Plan',
    description: 'Plan and track improvements to your collection documentation. Identify backlogs and set priorities for cataloguing work.',
    technical: { table: 'documentation_plans, documentation_plan_backlogs', spectrum: 'Procedure 21 — Documentation Planning' },
  },
  'nav.trash': {
    label: 'Deleted Objects',
    description: 'Soft-deleted objects that can be restored. Objects are kept here for 30 days before permanent removal.',
    technical: { table: 'objects', column: 'objects.deleted_at', type: 'timestamptz, nullable' },
  },
  'nav.site': {
    label: 'Site Builder',
    description: 'Customise your public museum website — choose a template, set colours and fonts, add branding and social links.',
  },
  'nav.events': {
    label: 'Events',
    description: 'Create and manage events with ticketed entry. Sell tickets via Stripe with timed entry slots and capacity management.',
    technical: { table: 'events, event_time_slots, ticket_orders, tickets' },
  },
  'nav.staff': {
    label: 'Staff & Roles',
    description: 'Invite team members and control what they can do. Admins have full access, Editors can modify objects, Viewers are read-only.',
    technical: { table: 'staff_members', column: 'staff_members.access', type: "enum: 'Admin' | 'Editor' | 'Viewer'" },
  },
  'nav.analytics': {
    label: 'Analytics',
    description: 'Insights into your collection — composition breakdown, public page views, and collection growth over time.',
    technical: { table: 'page_views, objects' },
  },

  // ── Dashboard status cards ────────────────────────────────────────────
  'dashboard.total_objects': {
    label: 'Total Objects',
    description: 'The total number of active objects in your collection, excluding soft-deleted items in the bin.',
    technical: { table: 'objects', column: 'COUNT(*) WHERE deleted_at IS NULL', type: 'Computed count' },
  },
  'dashboard.on_display': {
    label: 'On Display',
    description: 'Objects currently set to "On Display" status — these are items visible to the public in your galleries or exhibition spaces.',
    technical: { table: 'objects', column: "objects.status = 'On Display'", type: 'Filtered count' },
  },
  'dashboard.on_loan': {
    label: 'On Loan',
    description: 'Objects currently lent to other institutions. Check the Loans Register for return dates and overdue items.',
    technical: { table: 'objects', column: "objects.status = 'On Loan'", type: 'Filtered count', relationships: 'Linked via loans table' },
  },
  'dashboard.in_restoration': {
    label: 'In Restoration',
    description: 'Objects undergoing conservation treatment or restoration. See the Conservation tab on each object for treatment details.',
    technical: { table: 'objects', column: "objects.status = 'Restoration'", type: 'Filtered count' },
  },
  'dashboard.deaccessioned': {
    label: 'Deaccessioned',
    description: 'Objects formally removed from your collection through the deaccession process. These remain in the database for audit purposes.',
    technical: { table: 'objects', column: "objects.status = 'Deaccessioned'", type: 'Filtered count', spectrum: 'Procedure 17 — Deaccession & Disposal' },
  },
  'dashboard.total_paid': {
    label: 'Total Paid',
    description: 'The sum of all acquisition values across your collection — what you paid (or the declared gift value) for each object.',
    technical: { table: 'objects', column: 'SUM(objects.acquisition_value)', type: 'Aggregated numeric' },
  },
  'dashboard.estimated_value': {
    label: 'Estimated Value',
    description: 'The sum of all estimated values. The gain/loss percentage compares this against total paid to show collection appreciation.',
    technical: { table: 'objects', column: 'SUM(objects.estimated_value)', type: 'Aggregated numeric' },
  },

  // ── Dashboard table columns ───────────────────────────────────────────
  'dashboard.col.object': {
    label: 'Object Column',
    description: 'Shows the object icon, title, and accession number. Click any row to open the full object detail page.',
  },
  'dashboard.col.year': {
    label: 'Year Column',
    description: 'The cataloguing date or production date of the object. Can be a single year, range, or approximate date.',
    technical: { column: 'objects.year OR objects.production_date', type: 'text' },
  },
  'dashboard.col.medium': {
    label: 'Medium Column',
    description: 'The primary material or technique — e.g. "Oil on canvas", "Bronze", "Watercolour". Searchable and filterable.',
    technical: { column: 'objects.medium', type: 'text' },
  },
  'dashboard.col.status': {
    label: 'Status Column',
    description: 'The current lifecycle status of the object. Colour-coded: green for On Display, amber for On Loan, red for Restoration.',
    technical: { column: 'objects.status', type: "enum: Entry | On Display | Storage | On Loan | Restoration | Conservation | Deaccessioned" },
  },

  // ── Dashboard actions ─────────────────────────────────────────────────
  'action.import_csv': {
    label: 'Import CSV',
    description: 'Bulk-import objects from a spreadsheet. Upload a CSV file and map its columns to Vitrine fields. Supports all object fields.',
  },
  'action.new_entry': {
    label: 'New Entry Record',
    description: 'Create a new object entry record. This is the starting point for any object arriving at your museum.',
    technical: { table: 'entry_records', spectrum: 'Procedure 1 — Object Entry' },
  },
  'action.save': {
    label: 'Save Changes',
    description: 'Saves all changes on this page to the database. An entry is added to the activity log automatically.',
    technical: { table: 'activity_log' },
  },
  'action.bulk_status': {
    label: 'Change Status',
    description: 'Update the status of all selected objects at once. Select objects using the checkboxes, then choose a new status.',
    technical: { column: 'objects.status', type: 'Bulk UPDATE' },
  },
  'action.show_on_site': {
    label: 'Show on Site',
    description: 'Make the selected objects visible on your public museum website.',
    technical: { column: 'objects.show_on_site', type: 'boolean → true' },
  },
  'action.hide_from_site': {
    label: 'Hide from Site',
    description: 'Remove the selected objects from your public museum website. They remain in your collection, just hidden from visitors.',
    technical: { column: 'objects.show_on_site', type: 'boolean → false' },
  },
  'action.move_to_bin': {
    label: 'Move to Bin',
    description: 'Soft-delete the selected objects. They move to "Deleted Objects" and can be restored within 30 days.',
    technical: { column: 'objects.deleted_at', type: 'SET to current timestamp' },
  },

  // ── Object fields — Overview tab ──────────────────────────────────────
  'objects.icon': {
    label: 'Icon',
    description: 'A decorative emoji to represent this object in lists and cards. Purely cosmetic — pick whatever feels right.',
    technical: { column: 'objects.emoji', type: 'text', table: 'objects' },
  },
  'objects.title': {
    label: 'Object Title',
    description: 'The main name or title of this object. This is the primary identifier shown in search results, your collection list, and on your public website.',
    technical: { column: 'objects.title', type: 'text, not null', table: 'objects', spectrum: 'Procedure 5 — Cataloguing' },
  },
  'objects.artist': {
    label: 'Artist / Maker',
    description: 'The person or workshop who created the object. For attributed works, use the Maker Role field in Full mode for qualifiers like "Workshop of" or "After".',
    technical: { column: 'objects.artist', type: 'text', table: 'objects', spectrum: 'Procedure 5 — Cataloguing' },
  },
  'objects.production_date': {
    label: 'Date (Cataloguing)',
    description: 'When the object was made. Can be exact (1850), approximate (c.1920), or a range (1920–1930). Use the Date Qualifier to indicate precision.',
    technical: { column: 'objects.production_date', type: 'text', table: 'objects', spectrum: 'Procedure 5 — Cataloguing' },
  },
  'objects.production_date_qualifier': {
    label: 'Date Qualifier',
    description: 'How precise is the production date? "Exact" for known dates, "Circa" for approximations, "Between" for ranges, or "Before"/"After" for terminus dates.',
    technical: { column: 'objects.production_date_qualifier', type: "text: Exact | Circa | Before | After | Between", table: 'objects' },
  },
  'objects.medium': {
    label: 'Medium',
    description: 'The primary material or technique — "Oil on canvas", "Bronze", "Silver gelatin print". This is one of the most important fields for filtering and searching.',
    technical: { column: 'objects.medium', type: 'text', table: 'objects', spectrum: 'Procedure 5 — Cataloguing' },
  },
  'objects.object_type': {
    label: 'Object Type',
    description: 'The broad category: Painting, Sculpture, Ceramic, Photograph, etc. Used for collection statistics and filtering.',
    technical: { column: 'objects.object_type', type: 'text', table: 'objects', spectrum: 'Procedure 5 — Cataloguing' },
  },
  'objects.culture': {
    label: 'Culture / Origin',
    description: 'The cultural, geographical, or ethnic origin — "British", "Japanese", "Pre-Columbian". Helps contextualise the object historically.',
    technical: { column: 'objects.culture', type: 'text', table: 'objects', spectrum: 'Procedure 5 — Cataloguing' },
  },
  'objects.accession_no': {
    label: 'Accession Number',
    description: 'A unique identifier assigned when the object formally enters your collection. Format is typically YYYY.NNN (year.sequence). Auto-generated if left blank.',
    technical: { column: 'objects.accession_no', type: 'text, unique per museum', table: 'objects', spectrum: 'Procedure 2 — Accessioning' },
  },
  'objects.rarity': {
    label: 'Edition / Rarity',
    description: 'For prints, multiples, or limited editions — e.g. "1 of 500", "First Edition", "Artist\'s Proof".',
    technical: { column: 'objects.rarity', type: 'text', table: 'objects' },
  },
  'objects.number_of_parts': {
    label: 'Number of Parts',
    description: 'If the object is multi-part (e.g. a pair of vases, a tea set), enter the count here. When greater than 1, a Parts section appears to catalogue each component.',
    technical: { column: 'objects.number_of_parts', type: 'integer, default 1', table: 'objects', relationships: 'Linked to object_components table' },
  },
  'objects.formally_accessioned': {
    label: 'Accession Status',
    description: 'Whether this object has been formally accessioned into the permanent collection. Some objects (found in collection, pre-existing) may not have gone through a formal process.',
    technical: { column: 'objects.formally_accessioned', type: 'boolean, default true', table: 'objects', spectrum: 'Procedure 2 — Accessioning' },
  },
  'objects.status': {
    label: 'Status',
    description: 'The current lifecycle status: Entry (just arrived), On Display, Storage, On Loan, Restoration, Conservation, or Deaccessioned. Drives dashboard statistics and filtering.',
    technical: { column: 'objects.status', type: "text: Entry | On Display | Storage | On Loan | Restoration | Conservation | Deaccessioned", table: 'objects' },
  },
  'objects.condition_grade': {
    label: 'Condition',
    description: 'The most recent condition assessment grade. Updated automatically when you log a new assessment in the Condition tab.',
    technical: { column: 'objects.condition_grade', type: "text: Excellent | Good | Fair | Poor | Critical", table: 'objects', relationships: 'Snapshot from condition_assessments', spectrum: 'Procedure 11 — Condition Checking' },
  },
  'objects.current_location': {
    label: 'Current Location',
    description: 'Where this object physically is right now. Updated automatically when you record a movement in the Location tab.',
    technical: { column: 'objects.current_location', type: 'text', table: 'objects', relationships: 'Snapshot from location_history; references locations registry', spectrum: 'Procedure 3 — Location & Movement Control' },
  },
  'objects.dimensions': {
    label: 'Dimensions',
    description: 'Height, width, depth, and weight of the object. Choose your unit (cm, mm, in, m) and weight unit (kg, g, lb, oz). Add notes for framed dimensions, with base, etc.',
    technical: { column: 'objects.dimension_height, _width, _depth, _weight, _unit, _weight_unit, _notes', type: 'numeric + text', table: 'objects', spectrum: 'Procedure 5 — Cataloguing' },
  },
  'objects.description': {
    label: 'Description',
    description: 'A public-facing description of the object. This appears on your museum website if the object is set to "Show on site".',
    technical: { column: 'objects.description', type: 'text', table: 'objects' },
  },
  'objects.historical_context': {
    label: 'Historical Context',
    description: 'Background information about the historical period, events, or significance related to this object. Helps visitors and researchers understand why it matters.',
    technical: { column: 'objects.historical_context', type: 'text', table: 'objects' },
  },
  'objects.inscription': {
    label: 'Marks and Inscriptions',
    description: 'Any text, symbols, or marks on the object — inscriptions, hallmarks, maker\'s marks, stamps, signatures, labels. Important for authentication and provenance.',
    technical: { column: 'objects.inscription', type: 'text', table: 'objects', spectrum: 'Procedure 5 — Cataloguing' },
  },
  'objects.other_names': {
    label: 'Other Names / Also Known As',
    description: 'Alternative titles, former names, or popular names the object is known by. Helps with searchability.',
    technical: { column: 'objects.other_names', type: 'text', table: 'objects', spectrum: 'Procedure 5 — Cataloguing' },
  },
  'objects.colour': {
    label: 'Colour',
    description: 'The dominant colour(s) of the object — Polychrome, Monochrome, or a specific colour. Part of the physical description.',
    technical: { column: 'objects.colour', type: 'text', table: 'objects', spectrum: 'Procedure 5 — Cataloguing' },
  },
  'objects.shape': {
    label: 'Shape',
    description: 'The basic form — Rectangular, Circular, Cylindrical, Figurative, etc. Useful for 3D objects and archaeological finds.',
    technical: { column: 'objects.shape', type: 'text', table: 'objects', spectrum: 'Procedure 5 — Cataloguing' },
  },
  'objects.surface_treatment': {
    label: 'Surface Treatment',
    description: 'How the surface has been treated — Glazed, Gilded, Varnished, Patinated, Polished, etc.',
    technical: { column: 'objects.surface_treatment', type: 'text', table: 'objects', spectrum: 'Procedure 5 — Cataloguing' },
  },
  'objects.provenance': {
    label: 'Provenance',
    description: 'The ownership history of the object before your acquisition. Critical for establishing legitimacy and historical significance. Document every known owner.',
    technical: { column: 'objects.provenance', type: 'text', table: 'objects', spectrum: 'Procedure 5 — Cataloguing' },
  },
  'objects.provenance_date_range': {
    label: 'Provenance Date Range',
    description: 'The time span covered by the known provenance — e.g. "1850–1920" or "pre-1945". Helps identify gaps in ownership history.',
    technical: { column: 'objects.provenance_date_range', type: 'text', table: 'objects' },
  },
  'objects.field_collection_info': {
    label: 'Field Collection Information',
    description: 'For archaeological or natural history objects: the site, field collector, collection date, and archaeological context.',
    technical: { column: 'objects.field_collection_info', type: 'text', table: 'objects', spectrum: 'Procedure 5 — Cataloguing' },
  },
  'objects.credit_line': {
    label: 'Credit Line',
    description: 'How the donor or source wishes to be credited — e.g. "Gift of the Smith Family" or "Purchased with funds from the Heritage Lottery Fund".',
    technical: { column: 'objects.credit_line', type: 'text', table: 'objects' },
  },
  'objects.physical_materials': {
    label: 'Materials & Techniques',
    description: 'Detailed materials and making techniques — "oil on canvas, gilt wood frame" or "hand-thrown stoneware, salt glaze". More specific than Medium.',
    technical: { column: 'objects.physical_materials', type: 'text', table: 'objects', spectrum: 'Procedure 5 — Cataloguing' },
  },
  'objects.production_place': {
    label: 'Production Place',
    description: 'Where the object was made — city, region, or country. Distinct from Culture/Origin which is about cultural context.',
    technical: { column: 'objects.production_place', type: 'text', table: 'objects', spectrum: 'Procedure 5 — Cataloguing' },
  },
  'objects.is_gift': {
    label: 'Purchase or Gift',
    description: 'Whether this object was gifted or purchased. Affects how acquisition value is interpreted and may have tax/legal implications.',
    technical: { column: 'objects.is_gift', type: 'boolean, nullable', table: 'objects' },
  },
  'objects.insured_value': {
    label: 'Insured Value',
    description: 'The value this object is insured for. Internal only — not shown on your public site. Keep this up to date for insurance claims.',
    technical: { column: 'objects.insured_value', type: 'numeric', table: 'objects', spectrum: 'Procedure 14 — Insurance & Indemnity' },
  },
  'objects.show_on_site': {
    label: 'Public Site',
    description: 'When enabled, this object appears on your public museum website. When disabled, it stays in your internal catalogue only.',
    technical: { column: 'objects.show_on_site', type: 'boolean, default false', table: 'objects' },
  },
  'objects.is_featured': {
    label: 'Feature on Homepage',
    description: 'Highlights this object in a special section above the main collection grid on your public website. Only works when the object is visible on site.',
    technical: { column: 'objects.is_featured', type: 'boolean, default false', table: 'objects' },
  },
  'objects.category': {
    label: 'Discovery Category',
    description: 'Overrides your museum\'s default category in the Vitrine Discover directory for this specific object. Leave blank to inherit.',
    technical: { column: 'objects.category', type: 'text, nullable', table: 'objects' },
  },
  'objects.full_description': {
    label: 'Full Description',
    description: 'A detailed internal catalogue description — more thorough than the public description. For staff and researchers only.',
    technical: { column: 'objects.full_description', type: 'text', table: 'objects', spectrum: 'Procedure 5 — Cataloguing' },
  },
  'objects.hazard_note': {
    label: 'Hazard Note',
    description: 'Warning about hazardous materials or handling risks — asbestos, lead paint, fragile glass, sharp edges, radioactive materials. Shown prominently with a warning icon.',
    technical: { column: 'objects.hazard_note', type: 'text', table: 'objects', spectrum: 'Procedure 11 — Condition Checking' },
  },

  // ── Acquisition tab ───────────────────────────────────────────────────
  'acquisition.method': {
    label: 'Acquisition Method',
    description: 'How the object was acquired: Purchase, Gift, Bequest, Transfer, Found, Fieldwork, or Exchange.',
    technical: { column: 'objects.acquisition_method', type: 'text', table: 'objects', spectrum: 'Procedure 2 — Accessioning' },
  },
  'acquisition.date': {
    label: 'Acquisition Date',
    description: 'The date the object was acquired — when ownership transferred to your museum.',
    technical: { column: 'objects.acquisition_date', type: 'date', table: 'objects', spectrum: 'Procedure 2 — Accessioning' },
  },
  'acquisition.source': {
    label: 'Acquisition Source',
    description: 'Who you got it from — donor name, auction house, gallery, estate, or previous owner.',
    technical: { column: 'objects.acquisition_source', type: 'text', table: 'objects', spectrum: 'Procedure 2 — Accessioning' },
  },
  'acquisition.justification': {
    label: 'Acquisition Justification',
    description: 'Why this object was acquired — how it fits your collecting policy and what it adds to the collection. Required for museum accreditation.',
    technical: { column: 'objects.acquisition_justification', type: 'text', table: 'objects', spectrum: 'Procedure 2 — Accessioning' },
  },
  'acquisition.notes': {
    label: 'Acquisition Notes',
    description: 'Any additional notes about the acquisition — negotiation details, special circumstances, related correspondence.',
    technical: { column: 'objects.acquisition_note', type: 'text', table: 'objects' },
  },
  'acquisition.documentation_ref': {
    label: 'Associated Documentation',
    description: 'Reference to legal transfer documents — deeds of gift, bills of sale, purchase receipts. Required for accreditation. Upload supporting files below.',
    technical: { column: 'objects.acquisition_documentation_ref', type: 'text', table: 'objects', spectrum: 'Procedure 2 — Accessioning' },
  },
  'acquisition.accession_date': {
    label: 'Accession Date',
    description: 'The date the object was formally accessioned (entered into the permanent collection). May differ from acquisition date if there was a delay.',
    technical: { column: 'objects.accession_date', type: 'date', table: 'objects', spectrum: 'Procedure 2 — Accessioning' },
  },
  'acquisition.conditions': {
    label: 'Conditions Attached to Acquisition',
    description: 'Any restrictions or conditions from the donor or seller — display requirements, loan restrictions, naming conditions, or repatriation clauses.',
    technical: { column: 'objects.conditions_attached_to_acquisition', type: 'text', table: 'objects', spectrum: 'Procedure 2 — Accessioning' },
  },
  'acquisition.acknowledgement': {
    label: 'Acknowledgement Sent to Donor',
    description: 'Whether a formal thank-you letter or acknowledgement has been sent to the person or institution who donated or sold the object.',
    technical: { column: 'objects.acknowledgement_sent_to_donor', type: 'boolean', table: 'objects' },
  },
  'acquisition.source_contact': {
    label: 'Source Contact Details',
    description: 'Email, phone, or postal address for the donor or vendor. Needed for future correspondence or if conditions need clarification.',
    technical: { column: 'objects.acquisition_source_contact', type: 'text', table: 'objects' },
  },
  'acquisition.authorised_by': {
    label: 'Authorised By',
    description: 'The person or governing body who authorised the acquisition. Required for governance and audit trail.',
    technical: { column: 'objects.acquisition_authorised_by', type: 'text', table: 'objects', spectrum: 'Procedure 2 — Accessioning' },
  },
  'acquisition.authority_date': {
    label: 'Authority Date',
    description: 'When the acquisition was formally authorised by the governing body or designated authority.',
    technical: { column: 'objects.acquisition_authority_date', type: 'date', table: 'objects' },
  },
  'acquisition.title_guarantee': {
    label: 'Title / Legal Basis',
    description: 'The document that proves legal ownership transferred — Deed of Gift, Bill of Sale, Transfer Document, or Found in Collection.',
    technical: { column: 'objects.acquisition_title_guarantee', type: 'text', table: 'objects', spectrum: 'Procedure 2 — Accessioning' },
  },
  'acquisition.object_count': {
    label: 'Number of Objects',
    description: 'How many objects were included in this acquisition batch. Useful when a group of objects was acquired together.',
    technical: { column: 'objects.acquisition_object_count', type: 'integer', table: 'objects' },
  },
  'acquisition.register_confirmed': {
    label: 'Formally Entered in Accession Register',
    description: 'Confirms the object has been recorded in the formal accession register. A key compliance checkpoint.',
    technical: { column: 'objects.accession_register_confirmed', type: 'boolean', table: 'objects', spectrum: 'Procedure 2 — Accessioning' },
  },
  'acquisition.ethics_art_loss': {
    label: 'Art Loss Register Check',
    description: 'Confirm you have checked the Art Loss Register to verify the object is not listed as stolen or looted.',
    technical: { column: 'objects.ethics_art_loss_register', type: 'boolean', table: 'objects' },
  },
  'acquisition.ethics_cites': {
    label: 'CITES Check',
    description: 'Confirm the object does not contain materials from endangered species (ivory, tortoiseshell, feathers) regulated under CITES.',
    technical: { column: 'objects.ethics_cites', type: 'boolean', table: 'objects' },
  },
  'acquisition.ethics_dealing_act': {
    label: 'Dealing in Cultural Objects Act Check',
    description: 'Confirm you have considered the Dealing in Cultural Objects (Offences) Act 2003 and checked the country of origin for export restrictions.',
    technical: { column: 'objects.ethics_dealing_act', type: 'boolean', table: 'objects' },
  },
  'acquisition.ethics_human_remains': {
    label: 'Human Remains Check',
    description: 'Confirm relevant guidance has been followed if the object contains or may contain human material (bone, hair, skin, tissue).',
    technical: { column: 'objects.ethics_human_remains', type: 'boolean', table: 'objects' },
  },

  // ── Condition tab ─────────────────────────────────────────────────────
  'condition.grade': {
    label: 'Condition Grade',
    description: 'Rate the physical state: Excellent (near perfect), Good (minor wear), Fair (noticeable issues), Poor (significant damage), Critical (at risk of loss).',
    technical: { column: 'condition_assessments.grade', type: "text: Excellent | Good | Fair | Poor | Critical", table: 'condition_assessments', spectrum: 'Procedure 11 — Condition Checking' },
  },
  'condition.assessed_at': {
    label: 'Assessment Date',
    description: 'When this condition check was carried out. Defaults to today.',
    technical: { column: 'condition_assessments.assessed_at', type: 'date', table: 'condition_assessments' },
  },
  'condition.assessor': {
    label: 'Assessor',
    description: 'The person who carried out the condition assessment. Could be a conservator, curator, or trained volunteer.',
    technical: { column: 'condition_assessments.assessor', type: 'text', table: 'condition_assessments' },
  },
  'condition.reason_for_check': {
    label: 'Reason for Check',
    description: 'Why this assessment was done — Acquisition, Loan out, Loan return, Display change, Routine check, Damage suspected, Conservation, or Insurance.',
    technical: { column: 'condition_assessments.reason_for_check', type: 'text', table: 'condition_assessments', spectrum: 'Procedure 11 — Condition Checking' },
  },
  'condition.long_description': {
    label: 'Detailed Description',
    description: 'A thorough written description of the current physical condition — structural integrity, surface condition, previous repairs, active deterioration.',
    technical: { column: 'condition_assessments.long_description', type: 'text', table: 'condition_assessments' },
  },
  'condition.hazard_note': {
    label: 'Hazard Note',
    description: 'Any safety hazards identified during assessment — toxic materials, sharp edges, structural instability. This gets copied to the object\'s main hazard alert.',
    technical: { column: 'condition_assessments.hazard_note → objects.hazard_note', type: 'text', relationships: 'Updates objects.hazard_note on save' },
  },
  'condition.recommendations': {
    label: 'Recommendations',
    description: 'What should be done next — conservation treatment needed, environmental adjustments, handling restrictions, or rehousing.',
    technical: { column: 'condition_assessments.recommendations', type: 'text', table: 'condition_assessments' },
  },
  'condition.next_check_date': {
    label: 'Next Check Date',
    description: 'When this object should next be assessed. Set based on condition severity and risk — Critical objects should be checked more frequently.',
    technical: { column: 'condition_assessments.next_check_date', type: 'date', table: 'condition_assessments' },
  },
  'condition.notes': {
    label: 'Notes',
    description: 'Additional notes about this assessment — anything not covered by the structured fields above.',
    technical: { column: 'condition_assessments.notes', type: 'text', table: 'condition_assessments' },
  },

  // ── Location tab ──────────────────────────────────────────────────────
  'location.new_location': {
    label: 'New Location',
    description: 'Where you are moving this object to. Select from your location register or type a new name — new locations are automatically added to your register.',
    technical: { column: 'location_history.location', type: 'text', table: 'location_history', relationships: 'Auto-creates in locations table', spectrum: 'Procedure 3 — Location & Movement Control' },
  },
  'location.code': {
    label: 'Location Code',
    description: 'A structured location code like STORE-A-BAY3-SHELF2. Required for museum accreditation — every storage location needs a unique, systematic code.',
    technical: { column: 'locations.location_code', type: 'text, unique', table: 'locations', spectrum: 'Procedure 3 — Location & Movement Control' },
  },
  'location.building': {
    label: 'Building',
    description: 'Which building the location is in. Useful for multi-building museums or off-site storage.',
    technical: { column: 'locations.building', type: 'text', table: 'locations' },
  },
  'location.floor': {
    label: 'Floor',
    description: 'Which floor or level — Ground, First, Basement, Mezzanine, etc.',
    technical: { column: 'locations.floor', type: 'text', table: 'locations' },
  },
  'location.room': {
    label: 'Room',
    description: 'The specific room, gallery, or area within the building and floor.',
    technical: { column: 'locations.room', type: 'text', table: 'locations' },
  },
  'location.unit': {
    label: 'Unit / Position',
    description: 'The specific shelf, bay, rack, drawer, or case position within the room. The most granular level of location.',
    technical: { column: 'locations.unit', type: 'text', table: 'locations' },
  },
  'location.type': {
    label: 'Location Type',
    description: 'The purpose of this location: Display, Storage, Quarantine, Transit, Conservation Lab, or Office.',
    technical: { column: 'locations.location_type', type: "text: Display | Storage | Quarantine | Transit | Conservation Lab | Office", table: 'locations' },
  },
  'location.moved_by': {
    label: 'Moved By',
    description: 'Who physically moved the object. Important for accountability and in case of any damage during transit.',
    technical: { column: 'location_history.moved_by', type: 'text', table: 'location_history' },
  },
  'location.moved_at': {
    label: 'Date of Move',
    description: 'When the object was moved to this location.',
    technical: { column: 'location_history.moved_at', type: 'timestamptz', table: 'location_history' },
  },

  // ── Conservation tab ──────────────────────────────────────────────────
  'conservation.treatment_type': {
    label: 'Treatment Type',
    description: 'The category of conservation work: Cleaning, Restoration, Examination, Condition Check, or Other (with suggestions like Surface consolidation, Structural repair, etc.).',
    technical: { column: 'conservation_treatments.treatment_type', type: 'text', table: 'conservation_treatments', spectrum: 'Procedure 12 — Conservation & Collections Care' },
  },
  'conservation.conservator': {
    label: 'Conservator',
    description: 'The person or firm carrying out the treatment. Record their qualifications and accreditation status if known.',
    technical: { column: 'conservation_treatments.conservator', type: 'text', table: 'conservation_treatments' },
  },
  'conservation.start_date': {
    label: 'Start Date',
    description: 'When the conservation treatment began.',
    technical: { column: 'conservation_treatments.start_date', type: 'date', table: 'conservation_treatments' },
  },
  'conservation.end_date': {
    label: 'End Date',
    description: 'When the treatment was completed. Leave blank if still in progress.',
    technical: { column: 'conservation_treatments.end_date', type: 'date, nullable', table: 'conservation_treatments' },
  },
  'conservation.description': {
    label: 'Description',
    description: 'What was done — the specific interventions, techniques used, and materials applied.',
    technical: { column: 'conservation_treatments.description', type: 'text', table: 'conservation_treatments' },
  },
  'conservation.condition_description': {
    label: 'Condition Before Treatment',
    description: 'The state of the object before conservation began. Documents what prompted the treatment.',
    technical: { column: 'conservation_treatments.condition_description', type: 'text', table: 'conservation_treatments' },
  },
  'conservation.materials_used': {
    label: 'Materials Used',
    description: 'Specific conservation materials — adhesives, consolidants, solvents, fills. Important for future conservators to know what was applied.',
    technical: { column: 'conservation_treatments.materials_used', type: 'text', table: 'conservation_treatments' },
  },
  'conservation.cost': {
    label: 'Cost',
    description: 'The cost of this conservation treatment. Useful for budgeting and insurance valuations.',
    technical: { column: 'conservation_treatments.cost', type: 'numeric', table: 'conservation_treatments' },
  },
  'conservation.recommendation_future': {
    label: 'Future Recommendations',
    description: 'What the conservator recommends for ongoing care — environmental conditions, handling precautions, retreatment timeline.',
    technical: { column: 'conservation_treatments.recommendation_future', type: 'text', table: 'conservation_treatments' },
  },

  // ── Loans tab ─────────────────────────────────────────────────────────
  'loans.direction': {
    label: 'Loan Direction',
    description: '"Out" means you are lending to another institution. "In" means you are borrowing from someone else. Each has different paperwork requirements.',
    technical: { column: 'loans.direction', type: "text: Out | In", table: 'loans', spectrum: 'Procedures 7 & 8 — Loans In / Loans Out' },
  },
  'loans.borrowing_institution': {
    label: 'Borrowing Institution',
    description: 'The museum, gallery, or organisation on the other end of the loan. For loans out, this is who is borrowing your object.',
    technical: { column: 'loans.borrowing_institution', type: 'text, not null', table: 'loans' },
  },
  'loans.contact_name': {
    label: 'Contact Name',
    description: 'Your primary contact at the borrowing/lending institution.',
    technical: { column: 'loans.contact_name', type: 'text', table: 'loans' },
  },
  'loans.contact_email': {
    label: 'Contact Email',
    description: 'Email address for the loan contact. Used for correspondence and reminders.',
    technical: { column: 'loans.contact_email', type: 'text', table: 'loans' },
  },
  'loans.loan_start_date': {
    label: 'Loan Start Date',
    description: 'When the loan period begins — typically when the object leaves your premises (loan out) or arrives (loan in).',
    technical: { column: 'loans.loan_start_date', type: 'date', table: 'loans' },
  },
  'loans.loan_end_date': {
    label: 'Loan End Date',
    description: 'When the object should be returned. The dashboard flags overdue loans automatically.',
    technical: { column: 'loans.loan_end_date', type: 'date', table: 'loans', relationships: 'Used for overdue detection on dashboard' },
  },
  'loans.status': {
    label: 'Loan Status',
    description: 'Requested → Agreed → Active → Returned (or Cancelled). Each status change should be recorded with a date.',
    technical: { column: 'loans.status', type: "text: Requested | Agreed | Active | Returned | Cancelled", table: 'loans' },
  },
  'loans.insurance_value': {
    label: 'Insurance Value',
    description: 'The agreed insurance value for this loan. The borrower typically needs to insure the object for at least this amount.',
    technical: { column: 'loans.insurance_value', type: 'numeric', table: 'loans', spectrum: 'Procedure 14 — Insurance & Indemnity' },
  },
  'loans.purpose': {
    label: 'Purpose',
    description: 'Why the loan is happening — exhibition, research, conservation, photography, education.',
    technical: { column: 'loans.purpose', type: 'text', table: 'loans' },
  },
  'loans.conditions': {
    label: 'Conditions',
    description: 'Special conditions attached to the loan — display requirements, photography restrictions, environmental needs, handling instructions.',
    technical: { column: 'loans.conditions', type: 'text', table: 'loans' },
  },

  // ── Valuation tab ─────────────────────────────────────────────────────
  'valuation.value': {
    label: 'Value',
    description: 'The assessed monetary value of the object. Enter the amount without currency symbols — select currency separately.',
    technical: { column: 'valuations.value', type: 'numeric', table: 'valuations', spectrum: 'Procedure 13 — Valuation Control' },
  },
  'valuation.currency': {
    label: 'Currency',
    description: 'The currency of the valuation — GBP, USD, EUR, etc.',
    technical: { column: 'valuations.currency', type: 'text', table: 'valuations' },
  },
  'valuation.date': {
    label: 'Valuation Date',
    description: 'When this valuation was carried out. Valuations typically become stale after 3-5 years.',
    technical: { column: 'valuations.valuation_date', type: 'date', table: 'valuations' },
  },
  'valuation.valuer': {
    label: 'Valuer',
    description: 'Who performed the valuation — independent appraiser, auction house specialist, or internal staff.',
    technical: { column: 'valuations.valuer', type: 'text', table: 'valuations' },
  },
  'valuation.method': {
    label: 'Valuation Method',
    description: 'How the value was determined: Market value, Insurance value, Replacement cost, Expert opinion, or Auction estimate.',
    technical: { column: 'valuations.method', type: 'text', table: 'valuations', spectrum: 'Procedure 13 — Valuation Control' },
  },
  'valuation.purpose': {
    label: 'Purpose',
    description: 'Why the valuation was needed: Insurance, Sale, Estate planning, Grant application, or Other.',
    technical: { column: 'valuations.purpose', type: 'text', table: 'valuations' },
  },
  'valuation.basis': {
    label: 'Valuation Basis',
    description: 'The conceptual basis: Fair market value, Replacement value, Insurance value, Salvage value, or Nominal.',
    technical: { column: 'valuations.valuation_basis', type: 'text', table: 'valuations' },
  },
  'valuation.validity_date': {
    label: 'Validity Date',
    description: 'When this valuation expires or should be reviewed. Set a reminder to commission a new valuation before this date.',
    technical: { column: 'valuations.validity_date', type: 'date', table: 'valuations' },
  },

  // ── Entry tab ─────────────────────────────────────────────────────────
  'entry.number': {
    label: 'Entry Number',
    description: 'Auto-generated unique reference for this entry record — format ER-YYYY-NNN. Cannot be edited.',
    technical: { column: 'entry_records.entry_number', type: 'text, auto-generated', table: 'entry_records', spectrum: 'Procedure 1 — Object Entry' },
  },
  'entry.date': {
    label: 'Entry Date',
    description: 'When the object physically arrived at your premises.',
    technical: { column: 'entry_records.entry_date', type: 'date', table: 'entry_records' },
  },
  'entry.reason': {
    label: 'Entry Reason',
    description: 'Why the object is arriving: Potential acquisition, Loan in, Enquiry, Return from loan, or Found in collection.',
    technical: { column: 'entry_records.entry_reason', type: 'text', table: 'entry_records', spectrum: 'Procedure 1 — Object Entry' },
  },
  'entry.outcome': {
    label: 'Outcome',
    description: 'What happened: Pending (still deciding), Acquired, Returned to depositor, Transferred to loan, or Disposed.',
    technical: { column: 'entry_records.outcome', type: 'text', table: 'entry_records' },
  },
  'entry.condition_on_entry': {
    label: 'Condition on Entry',
    description: 'The condition of the object when it arrived. Document any pre-existing damage to protect yourself from liability.',
    technical: { column: 'entry_records.condition_on_entry', type: 'text', table: 'entry_records', spectrum: 'Procedure 1 — Object Entry' },
  },
  'entry.donor_name': {
    label: 'Donor Name',
    description: 'The person or institution who deposited the object.',
    technical: { column: 'entry_records.donor_name', type: 'text', table: 'entry_records' },
  },
  'entry.donor_contact': {
    label: 'Donor Contact',
    description: 'Contact details for the depositor — email, phone, or address.',
    technical: { column: 'entry_records.donor_contact', type: 'text', table: 'entry_records' },
  },
  'entry.notes': {
    label: 'Notes',
    description: 'Additional notes about this entry — special handling requirements, verbal agreements, or follow-up actions needed.',
    technical: { column: 'entry_records.notes', type: 'text', table: 'entry_records' },
  },

  // ── Audit tab ─────────────────────────────────────────────────────────
  'audit.date': {
    label: 'Audit Date',
    description: 'When the inventory check was carried out.',
    technical: { column: 'audit_records.inventoried_at', type: 'date', table: 'audit_records', spectrum: 'Procedure 6 — Inventory Control' },
  },
  'audit.inventoried_by': {
    label: 'Inventoried By',
    description: 'The person who performed the check. For accountability and follow-up.',
    technical: { column: 'audit_records.inventoried_by', type: 'text', table: 'audit_records' },
  },
  'audit.location_confirmed': {
    label: 'Location Confirmed',
    description: 'Whether the object was found at its recorded location. A "no" here triggers a discrepancy that needs investigation.',
    technical: { column: 'audit_records.location_confirmed', type: 'boolean', table: 'audit_records' },
  },
  'audit.condition_confirmed': {
    label: 'Condition Confirmed',
    description: 'Whether the condition matches the last recorded assessment. A "no" means the condition has changed and needs a new assessment.',
    technical: { column: 'audit_records.condition_confirmed', type: 'boolean', table: 'audit_records' },
  },
  'audit.outcome': {
    label: 'Inventory Outcome',
    description: 'The result: Present and correct, Present but location differs, Not found, Found in collection (unexpected find), or No prior record.',
    technical: { column: 'audit_records.discrepancy', type: 'text', table: 'audit_records', spectrum: 'Procedure 6 — Inventory Control' },
  },
  'audit.notes': {
    label: 'Notes',
    description: 'Additional observations from the audit — notes about condition, access difficulties, or recommended actions.',
    technical: { column: 'audit_records.notes', type: 'text', table: 'audit_records' },
  },

  // ── Damage tab ────────────────────────────────────────────────────────
  'damage.incident_date': {
    label: 'Incident Date',
    description: 'When the damage occurred (or is believed to have occurred). May differ from the discovery date.',
    technical: { column: 'damage_reports.incident_date', type: 'date', table: 'damage_reports', spectrum: 'Procedure 16 — Damage & Loss' },
  },
  'damage.discovered_date': {
    label: 'Discovered Date',
    description: 'When the damage was first noticed. The gap between incident and discovery dates may be relevant for insurance claims.',
    technical: { column: 'damage_reports.discovered_date', type: 'date', table: 'damage_reports' },
  },
  'damage.discovered_by': {
    label: 'Discovered By',
    description: 'Who found the damage. They may need to provide a witness statement for insurance or police reports.',
    technical: { column: 'damage_reports.discovered_by', type: 'text', table: 'damage_reports' },
  },
  'damage.type': {
    label: 'Damage Type',
    description: 'The category: Accidental, Environmental, Theft, Vandalism, Pest, Handling, Transit, or Unknown.',
    technical: { column: 'damage_reports.damage_type', type: 'text', table: 'damage_reports' },
  },
  'damage.severity': {
    label: 'Severity',
    description: 'How bad is it? Minor (cosmetic), Moderate (noticeable), Significant (affects integrity), Severe (major structural), or Total Loss.',
    technical: { column: 'damage_reports.severity', type: "text: Minor | Moderate | Significant | Severe | Total Loss", table: 'damage_reports' },
  },
  'damage.description': {
    label: 'Description',
    description: 'Detailed description of the damage — what happened, what is affected, visible signs.',
    technical: { column: 'damage_reports.description', type: 'text', table: 'damage_reports' },
  },
  'damage.cause': {
    label: 'Cause',
    description: 'What caused the damage — if known. May be determined during investigation.',
    technical: { column: 'damage_reports.cause', type: 'text', table: 'damage_reports' },
  },
  'damage.repair_estimate': {
    label: 'Repair Estimate',
    description: 'Estimated cost to repair or conserve the damaged object.',
    technical: { column: 'damage_reports.repair_estimate', type: 'numeric', table: 'damage_reports' },
  },
  'damage.insurance_claim_ref': {
    label: 'Insurance Claim Reference',
    description: 'Reference number from your insurance provider if a claim has been filed.',
    technical: { column: 'damage_reports.insurance_claim_ref', type: 'text', table: 'damage_reports', relationships: 'Related to insurance_policies' },
  },

  // ── Risk tab ──────────────────────────────────────────────────────────
  'risk.type': {
    label: 'Risk Type',
    description: 'The category of risk: Theft, Fire, Flood, Pest, Light damage, Handling damage, Environmental, Provenance, Legal, or Other.',
    technical: { column: 'risk_register.risk_type', type: 'text', table: 'risk_register', spectrum: 'Procedure 15 — Risk Management' },
  },
  'risk.severity': {
    label: 'Severity',
    description: 'The potential impact if this risk materialises: Low, Medium, High, or Critical.',
    technical: { column: 'risk_register.severity', type: "text: Low | Medium | High | Critical", table: 'risk_register' },
  },
  'risk.likelihood': {
    label: 'Likelihood',
    description: 'How likely is this risk to occur: Low, Medium, or High. Combined with severity to prioritise mitigation efforts.',
    technical: { column: 'risk_register.likelihood', type: "text: Low | Medium | High", table: 'risk_register' },
  },
  'risk.description': {
    label: 'Description',
    description: 'Detailed description of the risk — what could go wrong, what would be affected, and under what circumstances.',
    technical: { column: 'risk_register.description', type: 'text', table: 'risk_register' },
  },
  'risk.mitigation': {
    label: 'Mitigation',
    description: 'What you are doing (or plan to do) to reduce this risk — preventive measures, monitoring, insurance, emergency procedures.',
    technical: { column: 'risk_register.mitigation', type: 'text', table: 'risk_register' },
  },
  'risk.review_date': {
    label: 'Review Date',
    description: 'When this risk should next be reviewed. Risks should be reassessed regularly and after any incidents.',
    technical: { column: 'risk_register.review_date', type: 'date', table: 'risk_register' },
  },

  // ── Exits tab ─────────────────────────────────────────────────────────
  'exits.exit_date': {
    label: 'Exit Date',
    description: 'When the object physically left your premises.',
    technical: { column: 'object_exits.exit_date', type: 'date', table: 'object_exits', spectrum: 'Procedure 16 — Object Exit' },
  },
  'exits.exit_reason': {
    label: 'Exit Reason',
    description: 'Why the object is leaving: Return to depositor, Outgoing loan, Transfer, Disposal, Conservation, Photography, or Sale.',
    technical: { column: 'object_exits.exit_reason', type: 'text', table: 'object_exits' },
  },
  'exits.recipient_name': {
    label: 'Recipient Name',
    description: 'The person or institution receiving the object. Required for every exit.',
    technical: { column: 'object_exits.recipient_name', type: 'text, not null', table: 'object_exits' },
  },
  'exits.exit_authorised_by': {
    label: 'Authorised By',
    description: 'Who authorised this object to leave your premises. Required — no object should leave without formal authorisation.',
    technical: { column: 'object_exits.exit_authorised_by', type: 'text, not null', table: 'object_exits', spectrum: 'Procedure 16 — Object Exit' },
  },

  // ── Rights tab ────────────────────────────────────────────────────────
  'rights.copyright_status': {
    label: 'Copyright Status',
    description: 'The current copyright position: In Copyright, Out of Copyright, Public Domain, Unknown, or a Creative Commons licence.',
    technical: { column: 'objects.copyright_status', type: 'text', table: 'objects', spectrum: 'Procedure 9 — Rights Management' },
  },
  'rights.holder': {
    label: 'Rights Holder',
    description: 'Who owns the intellectual property rights — the artist, their estate, a collecting society, or your museum.',
    technical: { column: 'objects.rights_holder', type: 'text', table: 'objects', spectrum: 'Procedure 9 — Rights Management' },
  },
  'rights.notes': {
    label: 'Rights Notes',
    description: 'Additional information about rights — licence terms, usage restrictions, reproduction permissions, or pending enquiries.',
    technical: { column: 'objects.rights_notes', type: 'text', table: 'objects' },
  },

  // ── Settings ──────────────────────────────────────────────────────────
  'settings.theme': {
    label: 'Theme',
    description: 'Switch between System (follows your OS preference), Light, and Dark modes. Saved in your browser.',
    technical: { type: 'localStorage: theme', column: "system | light | dark" },
  },
  'settings.ui_mode': {
    label: 'Interface Mode',
    description: 'Simple mode shows just the basics — good for hobbyists. Full mode unlocks all Spectrum 5.1 compliance features. Professional plan and above.',
    technical: { column: 'museums.ui_mode', type: "text: simple | full", table: 'museums' },
  },
  'settings.discoverable': {
    label: 'Directory Listing',
    description: 'When enabled, your museum appears in the public Vitrine Discover directory so visitors and researchers can find you.',
    technical: { column: 'museums.discoverable', type: 'boolean, default false', table: 'museums' },
  },
  'settings.learn_mode': {
    label: 'Learn Mode',
    description: 'You found it! When enabled, hovering over fields and buttons shows educational tooltips explaining what everything does, including data structure details.',
    technical: { type: 'localStorage: learnMode' },
  },
}
