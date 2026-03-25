import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const BLOG_DIR = path.join(process.cwd(), 'content/blog')

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
  content: string
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return []
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'))
  return files
    .map((file) => {
      const slug = file.replace(/\.mdx$/, '')
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8')
      const { data } = matter(raw)
      return { slug, ...(data as PostFrontmatter) }
    })
    .sort((a, b) => (a.publishedAt > b.publishedAt ? -1 : 1))
}

export function getPost(slug: string): Post | undefined {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return undefined
  const raw = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(raw)
  return { slug, ...(data as PostFrontmatter), content }
}
