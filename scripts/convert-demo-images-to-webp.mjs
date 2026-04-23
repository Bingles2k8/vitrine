// Converts all demo-museum images (object images + logos + hero banners) to WebP
// and resizes to max 2000px wide. Updates DB refs and deletes the original R2 object.
//
// Run: node --env-file=.env.local scripts/convert-demo-images-to-webp.mjs

import { createClient } from '@supabase/supabase-js'
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'

const DEMO_SLUGS = [
  'example-vintage-cameras',
  'example-british-coinage',
  'example-classic-stamps',
  'example-natural-history',
]

const MAX_WIDTH = 2000
const WEBP_QUALITY = 82

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const OBJECT_IMAGES_PUBLIC = process.env.R2_OBJECT_IMAGES_PUBLIC_URL
const MUSEUM_ASSETS_PUBLIC = process.env.R2_MUSEUM_ASSETS_PUBLIC_URL

function parseR2Url(url) {
  if (!url) return null
  if (url.startsWith(OBJECT_IMAGES_PUBLIC)) {
    return { bucket: 'object-images', key: url.slice(OBJECT_IMAGES_PUBLIC.length + 1) }
  }
  if (url.startsWith(MUSEUM_ASSETS_PUBLIC)) {
    return { bucket: 'museum-assets', key: url.slice(MUSEUM_ASSETS_PUBLIC.length + 1) }
  }
  return null
}

function publicUrl(bucket, key) {
  return bucket === 'object-images'
    ? `${OBJECT_IMAGES_PUBLIC}/${key}`
    : `${MUSEUM_ASSETS_PUBLIC}/${key}`
}

async function streamToBuffer(stream) {
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  return Buffer.concat(chunks)
}

async function convertAndReupload(bucket, originalKey) {
  const get = await r2.send(new GetObjectCommand({ Bucket: bucket, Key: originalKey }))
  const inputBuf = await streamToBuffer(get.Body)
  const inputSize = inputBuf.length

  let pipeline = sharp(inputBuf).rotate()
  const meta = await sharp(inputBuf).metadata()
  if (meta.width && meta.width > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true })
  }
  const outputBuf = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer()

  const newKey = originalKey.replace(/\.(jpe?g|png|svg)$/i, '.webp')
  const finalKey = newKey === originalKey ? originalKey + '.webp' : newKey

  await r2.send(new PutObjectCommand({
    Bucket: bucket, Key: finalKey, Body: outputBuf, ContentType: 'image/webp',
  }))

  if (finalKey !== originalKey) {
    await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: originalKey }))
  }

  return {
    url: publicUrl(bucket, finalKey),
    before: inputSize,
    after: outputBuf.length,
  }
}

async function run() {
  const { data: museums, error: mErr } = await supabase
    .from('museums')
    .select('id, slug, hero_image_url, logo_image_url')
    .in('slug', DEMO_SLUGS)
  if (mErr) throw mErr

  let totalBefore = 0, totalAfter = 0, converted = 0, skipped = 0

  for (const m of museums) {
    console.log(`\n[${m.slug}]`)

    for (const field of ['hero_image_url', 'logo_image_url']) {
      const parsed = parseR2Url(m[field])
      if (!parsed) { console.log(`  - ${field}: skip (not on R2)`); skipped++; continue }
      if (parsed.key.endsWith('.webp')) { console.log(`  - ${field}: already webp`); skipped++; continue }
      try {
        const r = await convertAndReupload(parsed.bucket, parsed.key)
        await supabase.from('museums').update({ [field]: r.url }).eq('id', m.id)
        totalBefore += r.before; totalAfter += r.after; converted++
        console.log(`  ✓ ${field}: ${(r.before/1024).toFixed(0)}kB → ${(r.after/1024).toFixed(0)}kB  (${((1-r.after/r.before)*100).toFixed(0)}% smaller)`)
      } catch (e) {
        console.error(`  ✗ ${field}: ${e.message}`)
      }
    }

    const { data: images } = await supabase
      .from('object_images')
      .select('id, url, object_id, is_primary')
      .eq('museum_id', m.id)

    for (const img of images ?? []) {
      const parsed = parseR2Url(img.url)
      if (!parsed) { console.log(`  - object_image ${img.id}: skip (not on R2)`); skipped++; continue }
      if (parsed.key.endsWith('.webp')) { console.log(`  - object_image ${img.id}: already webp`); skipped++; continue }
      try {
        const r = await convertAndReupload(parsed.bucket, parsed.key)
        await supabase.from('object_images').update({ url: r.url }).eq('id', img.id)
        if (img.is_primary) {
          await supabase.from('objects').update({ image_url: r.url }).eq('id', img.object_id)
        }
        totalBefore += r.before; totalAfter += r.after; converted++
        console.log(`  ✓ ${parsed.key.split('/').pop()}: ${(r.before/1024).toFixed(0)}kB → ${(r.after/1024).toFixed(0)}kB  (${((1-r.after/r.before)*100).toFixed(0)}% smaller)`)
      } catch (e) {
        console.error(`  ✗ object_image ${img.id}: ${e.message}`)
      }
    }
  }

  console.log(`\n══════════════════════════════════════════`)
  console.log(`  Converted: ${converted}  Skipped: ${skipped}`)
  console.log(`  Total: ${(totalBefore/1024/1024).toFixed(2)} MB → ${(totalAfter/1024/1024).toFixed(2)} MB`)
  console.log(`  Saved:  ${((totalBefore-totalAfter)/1024/1024).toFixed(2)} MB  (${((1-totalAfter/totalBefore)*100).toFixed(1)}%)`)
  console.log(`══════════════════════════════════════════`)
}

await run()
