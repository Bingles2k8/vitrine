import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cnbcvntlznwnznoixyzb.supabase.co'
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SERVICE_ROLE_KEY env var')
  console.error('Usage: SERVICE_ROLE_KEY=... node scripts/backfill-conservation-image-sizes.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// 1. List all files in the object-images bucket to build a filename → size map
console.log('Listing files in object-images bucket…')
const { data: storageFiles, error: listErr } = await supabase.storage
  .from('object-images')
  .list('', { limit: 10000 })

if (listErr) {
  console.error('Failed to list storage files:', listErr.message)
  process.exit(1)
}

const sizeMap = {}
for (const file of storageFiles ?? []) {
  if (file.metadata?.size) {
    sizeMap[file.name] = file.metadata.size
  }
}
console.log(`  Found ${Object.keys(sizeMap).length} files in storage`)

// 2. Fetch all conservation treatments with images
const { data: treatments, error: fetchErr } = await supabase
  .from('conservation_treatments')
  .select('id, images')
  .not('images', 'is', null)

if (fetchErr) {
  console.error('Failed to fetch conservation treatments:', fetchErr.message)
  process.exit(1)
}

console.log(`\nChecking ${treatments?.length ?? 0} conservation treatments…`)

let treatmentsUpdated = 0
let imagesBackfilled = 0
let imagesNotFound = 0

for (const treatment of treatments ?? []) {
  const images = treatment.images ?? []
  if (images.length === 0) continue

  let needsUpdate = false
  const updatedImages = images.map(img => {
    if (img.file_size) return img // already has size, skip

    // Extract filename from Supabase public URL
    const filename = img.url?.split('/object-images/').pop()
    if (!filename) {
      imagesNotFound++
      return img
    }

    const size = sizeMap[filename]
    if (!size) {
      imagesNotFound++
      return img
    }

    needsUpdate = true
    imagesBackfilled++
    return { ...img, file_size: size }
  })

  if (!needsUpdate) continue

  const { error: updateErr } = await supabase
    .from('conservation_treatments')
    .update({ images: updatedImages })
    .eq('id', treatment.id)

  if (updateErr) {
    console.error(`  ✗ treatment ${treatment.id}: ${updateErr.message}`)
  } else {
    treatmentsUpdated++
    console.log(`  ✓ updated treatment ${treatment.id}`)
  }
}

console.log('\nDone.')
console.log(`  Treatments updated:  ${treatmentsUpdated}`)
console.log(`  Images backfilled:   ${imagesBackfilled}`)
console.log(`  Images not in storage (skipped): ${imagesNotFound}`)
