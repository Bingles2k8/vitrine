import { createClient } from '@supabase/supabase-js'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

const SUPABASE_URL = 'https://cnbcvntlznwnznoixyzb.supabase.co'
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SERVICE_ROLE_KEY env var')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const BACKUP_DIR = '/Users/matt/artifact-images-backup'

// Step 1: Delete incorrectly uploaded files from object-images
async function deleteFolder(bucket, prefix) {
  const { data, error } = await supabase.storage.from(bucket).list(prefix)
  if (error || !data) return
  for (const item of data) {
    const path = `${prefix}/${item.name}`
    if (item.id === null) {
      await deleteFolder(bucket, path)
    } else {
      const { error: delErr } = await supabase.storage.from(bucket).remove([path])
      if (delErr) console.error(`  ✗ delete ${path}: ${delErr.message}`)
      else console.log(`  ✓ deleted ${path}`)
    }
  }
}

// Step 2: Upload files at the correct root level
async function uploadFiles(localDir, bucket) {
  const entries = await readdir(localDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isFile()) continue
    const file = await readFile(join(localDir, entry.name))
    const { error } = await supabase.storage.from(bucket).upload(entry.name, file, { upsert: true })
    if (error) console.error(`  ✗ ${entry.name}: ${error.message}`)
    else console.log(`  ✓ ${entry.name}`)
  }
}

console.log('\nDeleting incorrectly uploaded artifact-images subfolder from object-images...')
await deleteFolder('object-images', 'artifact-images')

console.log('\nDeleting incorrectly uploaded museum-assets subfolder from object-images...')
await deleteFolder('object-images', 'museum-assets')

console.log('\nUploading images to root of object-images...')
await uploadFiles(join(BACKUP_DIR, 'artifact-images'), 'object-images')

console.log('\nDone!')
