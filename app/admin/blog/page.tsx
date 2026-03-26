import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSideClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { DeleteButton } from './DeleteButton'

export default async function AdminBlogPage() {
  const supabase = await createServerSideClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.id !== process.env.ADMIN_USER_ID) notFound()

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data: posts } = await admin
    .from('blog_posts')
    .select('id, slug, title, published_at')
    .order('published_at', { ascending: false })

  return (
    <div className="min-h-screen bg-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600">
              ← Admin
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight mt-1">Blog Posts</h1>
          </div>
          <Link
            href="/admin/blog/new"
            className="bg-gray-900 text-white text-sm px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            New post
          </Link>
        </div>

        {(posts ?? []).length === 0 ? (
          <p className="text-gray-400 text-sm">No posts yet.</p>
        ) : (
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Published</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(posts ?? []).map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{post.title}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{post.slug}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(post.published_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-4 justify-end">
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="text-xs text-gray-400 hover:text-gray-700"
                        >
                          View
                        </Link>
                        <Link
                          href={`/admin/blog/${post.id}/edit`}
                          className="text-xs text-gray-400 hover:text-gray-700"
                        >
                          Edit
                        </Link>
                        <DeleteButton id={post.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
