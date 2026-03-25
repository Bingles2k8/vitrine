import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'
import { buildPageMetadata, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'

export const metadata = buildPageMetadata({
  title: 'Collection Management Blog – Guides & Tips',
  description: 'Guides, tips, and comparisons for collectors. How to catalog, organize, and value your collection of coins, trading cards, vinyl records, books, and more.',
  path: '/blog',
  keywords: ['collection management blog', 'collector guides', 'how to catalog a collection', 'collection tips'],
})

export default function BlogIndex() {
  const posts = getAllPosts()

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
    ],
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <JsonLd data={breadcrumbSchema} />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-stone-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl italic">
            Vitrine<span className="text-amber-500">.</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/discover" className="text-sm text-stone-400 hover:text-white transition-colors">Discover</Link>
            <Link href="/#features" className="text-sm text-stone-400 hover:text-white transition-colors">Features</Link>
            <Link href="/#pricing" className="text-sm text-stone-400 hover:text-white transition-colors">Pricing</Link>
            <Link href="/blog" className="text-sm text-white transition-colors">Blog</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-stone-400 hover:text-white transition-colors font-mono">
              Sign in
            </Link>
            <Link href="/signup" className="bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-mono px-4 py-2 rounded transition-colors">
              Start free →
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">

        {/* Breadcrumb */}
        <nav className="mb-10 text-sm text-stone-500" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-stone-300 transition-colors">Home</Link></li>
            <li className="text-stone-700">/</li>
            <li className="text-stone-300">Blog</li>
          </ol>
        </nav>

        {/* Header */}
        <section className="mb-16">
          <h1 className="font-serif text-5xl md:text-6xl italic font-normal leading-tight mb-6">
            The Vitrine Blog
          </h1>
          <p className="text-lg text-stone-400 leading-relaxed max-w-2xl">
            Guides, comparisons, and tips for collectors. How to catalog, organize, and value any collection.
          </p>
        </section>

        {/* Post list */}
        {posts.length === 0 ? (
          <p className="text-stone-500">No posts yet.</p>
        ) : (
          <div className="space-y-1">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block group py-8 border-b border-white/5 hover:border-white/10 transition-colors"
              >
                <p className="text-xs font-mono text-stone-600 mb-3 uppercase tracking-widest">
                  {new Date(post.publishedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <h2 className="text-xl font-medium text-white group-hover:text-amber-400 transition-colors mb-3 leading-snug">
                  {post.title}
                </h2>
                <p className="text-stone-400 leading-relaxed text-sm max-w-2xl">
                  {post.description}
                </p>
                <p className="mt-4 text-sm font-mono text-amber-500 group-hover:text-amber-400 transition-colors">
                  Read more →
                </p>
              </Link>
            ))}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 text-sm text-stone-500">
          <span className="font-serif italic">Vitrine<span className="text-amber-500">.</span></span>
          <div className="flex flex-wrap gap-6">
            <Link href="/blog" className="hover:text-stone-300 transition-colors">Blog</Link>
            <Link href="/about" className="hover:text-stone-300 transition-colors">About</Link>
            <Link href="/faq" className="hover:text-stone-300 transition-colors">FAQ</Link>
            <Link href="/privacy" className="hover:text-stone-300 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-stone-300 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
