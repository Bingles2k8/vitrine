'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { createServerSideClient } from '@/lib/supabase-server'

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

export async function createPost(formData: FormData) {
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

  if (error) throw new Error(error.message)

  revalidatePath('/blog')
  revalidatePath(`/blog/${slug}`)
  revalidatePath('/admin/blog')
  redirect('/admin/blog')
}

export async function updatePost(id: string, formData: FormData) {
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

  if (error) throw new Error(error.message)

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
