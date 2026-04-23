// Shared engine for seeding example hobbyist museums.
// Caller passes in the collection spec; engine handles cleanup,
// user creation, Wikimedia image resolution, R2 uploads, and DB inserts.

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

const UA = { 'User-Agent': 'VitrineSeeder/1.0 (https://vitrinecms.com; bingles2k8@gmail.com)' }

async function resolveWikipediaLeadImage(pageTitle) {
  const r = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`,
    { headers: UA }
  )
  if (!r.ok) throw new Error(`Wikipedia REST ${r.status} for ${pageTitle}`)
  const j = await r.json()
  if (!j.originalimage?.source) throw new Error(`No lead image for ${pageTitle}`)
  return {
    url: j.originalimage.source,
    attribution: `Wikipedia: ${j.title}`,
    pageUrl: j.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`,
  }
}

async function resolveCommonsFile(filename) {
  // filename e.g. "Penny_Black_stamp.jpg" (no "File:" prefix)
  const r = await fetch(
    `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent('File:' + filename)}&prop=imageinfo&iiprop=url&format=json&origin=*`,
    { headers: UA }
  )
  if (!r.ok) throw new Error(`Commons API ${r.status} for ${filename}`)
  const j = await r.json()
  const pages = j?.query?.pages
  const first = pages ? Object.values(pages)[0] : null
  const url = first?.imageinfo?.[0]?.url
  if (!url) throw new Error(`No Commons file: ${filename}`)
  return { url, attribution: `Wikimedia Commons: ${filename}`, pageUrl: `https://commons.wikimedia.org/wiki/File:${filename}` }
}

async function resolveImage(ref) {
  // ref: { page: 'X' } OR { commonsFile: 'X.jpg' }
  if (ref.commonsFile) return resolveCommonsFile(ref.commonsFile)
  if (ref.page) return resolveWikipediaLeadImage(ref.page)
  throw new Error('Image ref needs .page or .commonsFile')
}

async function download(url) {
  const r = await fetch(url, { headers: UA })
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
  await r2.send(new PutObjectCommand({ Bucket: bucket, Key: path, Body: buf, ContentType: contentType }))
  return publicUrl(bucket, path)
}

// ────────────────────────────────────────────────────────────
// Pipeline steps
// ────────────────────────────────────────────────────────────

async function cleanup(email, slug) {
  console.log(`[cleanup] Removing any previous data for ${email} / ${slug}…`)

  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 500 })
  const existingUser = list?.users?.find(u => u.email === email)

  const museumIds = []
  const { data: bySlug } = await supabase.from('museums').select('id').eq('slug', slug)
  museumIds.push(...(bySlug ?? []).map(m => m.id))
  if (existingUser) {
    const { data: byOwner } = await supabase.from('museums').select('id').eq('owner_id', existingUser.id)
    museumIds.push(...(byOwner ?? []).map(m => m.id))
  }
  const unique = [...new Set(museumIds)]

  for (const mid of unique) {
    for (const bucket of ['object-images', 'museum-assets']) {
      const listed = await r2.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: `${mid}/` }))
      for (const obj of listed.Contents ?? []) {
        await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: obj.Key }))
      }
    }
    await supabase.from('museums').delete().eq('id', mid)
  }

  if (existingUser) await supabase.auth.admin.deleteUser(existingUser.id)

  console.log(`[cleanup] removed ${unique.length} museum(s), ${existingUser ? 1 : 0} user(s)`)
}

async function createUserAndMuseum(config) {
  const { email, password, slug, museum, logoRef, bannerRef } = config

  console.log('[auth] Creating user…')
  const { data: created, error: userErr } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
  })
  if (userErr) throw userErr
  const userId = created.user.id

  const museumId = randomUUID()
  console.log(`[museum] ${museumId}`)

  console.log('[museum] Resolving banner + logo…')
  const banner = await resolveImage(bannerRef)
  const { buf: bannerBuf, contentType: bannerCt } = await download(banner.url)
  const bannerPath = `${museumId}/banner-${Date.now()}.${extFromContentType(bannerCt)}`
  const bannerUrl = await uploadToR2('museum-assets', bannerPath, bannerBuf, bannerCt)

  const logo = await resolveImage(logoRef)
  const { buf: logoBuf, contentType: logoCt } = await download(logo.url)
  const logoPath = `${museumId}/logo-${Date.now()}.${extFromContentType(logoCt)}`
  const logoUrl = await uploadToR2('museum-assets', logoPath, logoBuf, logoCt)

  const museumRow = {
    id: museumId,
    owner_id: userId,
    name: museum.name,
    slug,
    plan: 'hobbyist',
    ui_mode: 'simple',
    tagline: museum.tagline,
    logo_emoji: museum.logo_emoji,
    logo_image_url: logoUrl,
    hero_image_url: bannerUrl,
    hero_image_position: '50% 50%',
    heading_font: museum.heading_font ?? 'playfair',
    primary_color: museum.primary_color,
    accent_color: museum.accent_color,
    template: museum.template ?? 'classic',
    about_text: museum.about_text,
    seo_description: museum.seo_description,
    contact_email: email,
    footer_text: museum.footer_text,
    collection_label: museum.collection_label ?? 'Specimens',
    collecting_since: museum.collecting_since,
    collector_bio: museum.collector_bio,
    discoverable: true,
    collection_category: museum.collection_category,
    show_wanted: true,
    show_collection_value: false,
    dark_mode: false,
    card_radius: museum.card_radius ?? 6,
    hero_height: museum.hero_height ?? 'large',
    grid_columns: museum.grid_columns ?? 3,
    image_ratio: museum.image_ratio ?? 'square',
    card_padding: museum.card_padding ?? 'normal',
    card_metadata: museum.card_metadata ?? 'full',
    social_instagram: '',
    social_twitter: '',
    social_website: 'https://vitrinecms.com',
  }

  const { error: musErr } = await supabase.from('museums').insert(museumRow)
  if (musErr) throw musErr
  console.log('[museum] created')
  return { userId, museumId }
}

async function seedSpecimens(museumId, specimens) {
  console.log(`[objects] seeding ${specimens.length} specimens…`)
  for (const spec of specimens) {
    const objectId = randomUUID()
    const { images, ...objectFields } = spec

    const { error: objErr } = await supabase.from('objects').insert({
      id: objectId,
      museum_id: museumId,
      show_on_site: true,
      formally_accessioned: true,
      record_completeness: 'full',
      ...objectFields,
    })
    if (objErr) {
      console.error(`  ✗ ${spec.accession_no}: ${objErr.message}`)
      continue
    }

    let primaryUrl = null
    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      try {
        const resolved = await resolveImage(img)
        const { buf, contentType } = await download(resolved.url)
        const path = `${museumId}/${objectId}-${i}-${Date.now()}.${extFromContentType(contentType)}`
        const url = await uploadToR2('object-images', path, buf, contentType)
        if (i === 0) primaryUrl = url
        await supabase.from('object_images').insert({
          object_id: objectId,
          museum_id: museumId,
          url,
          caption: `${img.caption} — ${resolved.attribution}`,
          is_primary: i === 0,
          sort_order: i,
        })
      } catch (e) {
        console.error(`  ✗ ${spec.accession_no} image ${i + 1}: ${e.message}`)
      }
    }

    if (primaryUrl) {
      await supabase.from('objects').update({ image_url: primaryUrl }).eq('id', objectId)
    }

    console.log(`  ✓ ${spec.accession_no}  ${spec.title}`)
  }
}

async function seedWanted(museumId, wanted) {
  console.log(`[wanted] seeding ${wanted.length} items…`)
  for (const w of wanted) {
    const { error } = await supabase.from('wanted_items').insert({ museum_id: museumId, ...w })
    if (error) console.error(`  ✗ ${w.title}: ${error.message}`)
    else console.log(`  ✓ ${w.title}`)
  }
}

export async function runSeed(config) {
  await cleanup(config.email, config.slug)
  const { userId, museumId } = await createUserAndMuseum(config)
  await seedSpecimens(museumId, config.specimens)
  await seedWanted(museumId, config.wanted)

  console.log('\n══════════════════════════════════════════')
  console.log('  Seed complete')
  console.log('══════════════════════════════════════════')
  console.log(`  Email:    ${config.email}`)
  console.log(`  Password: ${config.password}`)
  console.log(`  Museum:   ${config.museum.name}`)
  console.log(`  Slug:     ${config.slug}`)
  console.log(`  User ID:  ${userId}`)
  console.log(`  Museum:   ${museumId}`)
  console.log(`  Public:   https://vitrinecms.com/museum/${config.slug}`)
  console.log(`  Category: ${config.museum.collection_category}`)
  console.log('══════════════════════════════════════════\n')
  return { userId, museumId }
}
