import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export type PostFrontmatter = {
  title: string
  description: string
  publishedAt: string
  updatedAt: string
  keywords: string[]
}

export type PostMeta = PostFrontmatter & {
  slug: string
}

export type Post = PostMeta & {
  id: string
  content: string
}

export async function getAllPosts(): Promise<PostMeta[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug, title, description, published_at, updated_at, keywords')
    .order('published_at', { ascending: false })
  if (error || !data) return []
  return data.map((row) => ({
    slug: row.slug,
    title: row.title,
    description: row.description,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    keywords: row.keywords ?? [],
  }))
}

export async function getPost(slug: string): Promise<Post | undefined> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title, description, content, published_at, updated_at, keywords')
    .eq('slug', slug)
    .single()
  if (error || !data) return undefined
  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    description: data.description,
    content: data.content,
    publishedAt: data.published_at,
    updatedAt: data.updated_at,
    keywords: data.keywords ?? [],
  }
}
