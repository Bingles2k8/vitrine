import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSideClient } from '@/lib/supabase-server'
import { BlogPostForm } from '../BlogPostForm'
import { createPost } from '../../actions'

export default async function NewBlogPostPage() {
  const supabase = await createServerSideClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.id !== process.env.ADMIN_USER_ID) notFound()

  return (
    <div className="min-h-screen bg-white p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/admin/blog" className="text-sm text-gray-400 hover:text-gray-600">
            ← Blog posts
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">New Post</h1>
        </div>
        <BlogPostForm action={createPost} />
      </div>
    </div>
  )
}
