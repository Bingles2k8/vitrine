'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { createServerSideClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'
import { r2, r2PathFromUrl, DeleteObjectsCommand, ListObjectsV2Command } from '@/lib/r2'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function assertAdmin() {
  const supabase = await createServerSideClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.id !== process.env.ADMIN_USER_ID) notFound()
}

function parseKeywords(raw: string): string[] {
  return raw
    .split('\n')
    .map((k) => k.trim())
    .filter(Boolean)
}

export type PostActionState = { error: string } | null

export async function createPost(_prev: PostActionState, formData: FormData): Promise<PostActionState> {
  await assertAdmin()
  const admin = adminClient()

  const slug = (formData.get('slug') as string).trim()
  const title = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string).trim()
  const content = (formData.get('content') as string).trim()
  const publishedAt = (formData.get('publishedAt') as string).trim()
  const keywords = parseKeywords(formData.get('keywords') as string)

  const { error } = await admin.from('blog_posts').insert({
    slug,
    title,
    description,
    content,
    keywords,
    published_at: publishedAt,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    if (error.code === '23505') return { error: `Slug "${slug}" is already in use by another post.` }
    throw new Error(error.message)
  }

  revalidatePath('/blog')
  revalidatePath(`/blog/${slug}`)
  revalidatePath('/admin/blog')
  redirect('/admin/blog')
}

export async function updatePost(id: string, _prev: PostActionState, formData: FormData): Promise<PostActionState> {
  await assertAdmin()
  const admin = adminClient()

  const slug = (formData.get('slug') as string).trim()
  const title = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string).trim()
  const content = (formData.get('content') as string).trim()
  const publishedAt = (formData.get('publishedAt') as string).trim()
  const keywords = parseKeywords(formData.get('keywords') as string)

  // Fetch old slug in case it changed — need to revalidate the old URL too
  const { data: existing } = await admin
    .from('blog_posts')
    .select('slug')
    .eq('id', id)
    .single()

  const { error } = await admin
    .from('blog_posts')
    .update({
      slug,
      title,
      description,
      content,
      keywords,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') return { error: `Slug "${slug}" is already in use by another post.` }
    throw new Error(error.message)
  }

  revalidatePath('/blog')
  revalidatePath(`/blog/${slug}`)
  if (existing?.slug && existing.slug !== slug) {
    revalidatePath(`/blog/${existing.slug}`)
  }
  revalidatePath('/admin/blog')
  redirect('/admin/blog')
}

export async function deletePost(id: string) {
  await assertAdmin()
  const admin = adminClient()

  const { data: existing } = await admin
    .from('blog_posts')
    .select('slug')
    .eq('id', id)
    .single()

  const { error } = await admin.from('blog_posts').delete().eq('id', id)
  if (error) throw new Error(error.message)

  if (existing?.slug) {
    revalidatePath(`/blog/${existing.slug}`)
  }
  revalidatePath('/blog')
  revalidatePath('/admin/blog')
  redirect('/admin/blog')
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractStoragePath(url: string, bucketName: string): string | null {
  const marker = `/${bucketName}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return decodeURIComponent(url.slice(idx + marker.length))
}

async function deleteStorageFiles(
  _admin: ReturnType<typeof adminClient>,
  bucket: string,
  paths: (string | null | undefined)[],
) {
  const valid = paths.filter((p): p is string => !!p)
  if (valid.length === 0) return
  // R2 DeleteObjects accepts up to 1000 keys at once
  for (let i = 0; i < valid.length; i += 1000) {
    await r2.send(new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: valid.slice(i, i + 1000).map(Key => ({ Key })) },
    }))
  }
}

// ── Delete user + all data ────────────────────────────────────────────────────

export async function deleteUser(museumId: string) {
  await assertAdmin()
  const admin = adminClient()

  // 1. Fetch museum (need owner_id, stripe sub, hero/logo images)
  const { data: museum } = await admin
    .from('museums')
    .select('id, owner_id, stripe_subscription_id, hero_image_url, logo_image_url')
    .eq('id', museumId)
    .maybeSingle()

  if (!museum) throw new Error('Museum not found')

  // 2. Cancel Stripe subscription if present
  if (museum.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(museum.stripe_subscription_id)
    } catch (err) {
      console.error('Failed to cancel Stripe subscription:', err)
    }
  }

  // 3. Collect storage paths to delete
  // object-documents: list all files under {museum_id}/ using R2
  async function listAllDocPaths(prefix: string): Promise<string[]> {
    const paths: string[] = []
    let continuationToken: string | undefined
    do {
      const res = await r2.send(new ListObjectsV2Command({
        Bucket: 'object-documents',
        Prefix: `${prefix}/`,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      }))
      for (const obj of res.Contents ?? []) {
        if (obj.Key) paths.push(obj.Key)
      }
      continuationToken = res.NextContinuationToken
    } while (continuationToken)
    return paths
  }

  const docPaths = await listAllDocPaths(museum.id)

  // object-images: get URLs from DB
  const { data: objectImages } = await admin
    .from('object_images')
    .select('url')
    .eq('museum_id', museumId)

  const imagePaths = (objectImages ?? []).map(r => r2PathFromUrl('object-images', r.url))

  // museum-assets: hero + logo stored at top level of bucket
  const museumAssetPaths = [
    museum.hero_image_url ? r2PathFromUrl('museum-assets', museum.hero_image_url) : null,
    museum.logo_image_url ? r2PathFromUrl('museum-assets', museum.logo_image_url) : null,
  ]

  // 4. Delete storage files
  await Promise.all([
    deleteStorageFiles(admin, 'object-documents', docPaths),
    deleteStorageFiles(admin, 'object-images', imagePaths),
    deleteStorageFiles(admin, 'museum-assets', museumAssetPaths),
  ])

  // 5. Collect staff user IDs before deleting staff_members
  const { data: staffMembers } = await admin
    .from('staff_members')
    .select('user_id')
    .eq('museum_id', museumId)

  const staffUserIds = (staffMembers ?? []).map(s => s.user_id)

  // 6. Delete all museum data in dependency order
  for (const table of [
    'activity_log',
    'object_images',
    'object_documents',
    'reproduction_requests',
    'valuations',
    'risk_register',
    'damage_reports',
    'location_history',
    'condition_assessments',
    'conservation_treatments',
    'audit_records',
    'object_exits',
    'loans',
    'entry_records',
    'insurance_policies',
    'emergency_plans',
    'documentation_plans',
    'page_views',
    'staff_members',
    'objects',
    'locations',
    'events',
    'wanted_items',
  ]) {
    await admin.from(table).delete().eq('museum_id', museumId)
  }

  await admin.from('museums').delete().eq('id', museumId)

  // 7. Delete staff auth accounts
  for (const staffUserId of staffUserIds) {
    await admin.auth.admin.deleteUser(staffUserId)
  }

  // 8. Delete the owner auth account
  await admin.auth.admin.deleteUser(museum.owner_id)

  revalidatePath('/admin')
}
