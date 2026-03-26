import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSideClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { BlogPostForm } from '../../BlogPostForm'
import { updatePost } from '../../../actions'

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createServerSideClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.id !== process.env.ADMIN_USER_ID) notFound()

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data: post } = await admin.from('blog_posts').select('*').eq('id', id).single()
  if (!post) notFound()

  const action = updatePost.bind(null, id)

  return (
    <div className="min-h-screen bg-white p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/admin/blog" className="text-sm text-gray-400 hover:text-gray-600">
            ← Blog posts
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Edit Post</h1>
        </div>
        <BlogPostForm action={action} defaultValues={post} />
      </div>
    </div>
  )
}
