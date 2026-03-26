import { notFound } from 'next/navigation'
import Link from 'next/link'
import PublicFooter from '@/components/PublicFooter'
import PublicNav from '@/components/PublicNav'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllPosts, getPost } from '@/lib/blog'
import { buildPageMetadata, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'

export const revalidate = 3600

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return {}
  return buildPageMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    keywords: post.keywords,
  })
}

// Extract FAQ items from MDX content (## Frequently asked questions section)
function extractFaqs(content: string): { question: string; answer: string }[] {
  const faqSection = content.match(/## Frequently asked questions[\s\S]*$/i)
  if (!faqSection) return []
  const pairs = faqSection[0].matchAll(/\*\*(.+?)\*\*\n([^\n*]+(?:\n(?!\*\*)[^\n*]+)*)/g)
  return Array.from(pairs).map((m) => ({
    question: m[1].trim(),
    answer: m[2].trim(),
  }))
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const pageUrl = `${SITE_URL}/blog/${post.slug}`
  const faqs = extractFaqs(post.content)

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Organization', name: 'Vitrine', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'Vitrine',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: pageUrl },
    ],
  }

  const faqSchema = faqs.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }
    : null

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}

      <PublicNav activePath="/blog" />

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">

        {/* Breadcrumb */}
        <nav className="mb-10 text-sm text-stone-500" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 flex-wrap">
            <li><Link href="/" className="hover:text-stone-300 transition-colors">Home</Link></li>
            <li className="text-stone-700">/</li>
            <li><Link href="/blog" className="hover:text-stone-300 transition-colors">Blog</Link></li>
            <li className="text-stone-700">/</li>
            <li className="text-stone-300 truncate max-w-xs">{post.title}</li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-12">
          <p className="text-xs font-mono text-stone-600 mb-4 uppercase tracking-widest">
            {new Date(post.publishedAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl italic font-normal leading-tight mb-6">
            {post.title}
          </h1>
          <p className="text-lg text-stone-300 leading-relaxed">
            {post.description}
          </p>
        </header>

        {/* MDX content */}
        <div className="mdx-content">
          <MDXRemote source={post.content} />
        </div>

        {/* CTA */}
        <section className="mt-16 p-8 border border-white/10 rounded-lg text-center">
          <h2 className="text-2xl font-medium text-white mb-3">
            Ready to catalog your collection?
          </h2>
          <p className="text-stone-400 mb-6 max-w-md mx-auto">
            Free to start. No credit card required.
          </p>
          <Link
            href="/signup"
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono text-sm px-8 py-3 rounded transition-colors inline-block"
          >
            Create your free account →
          </Link>
        </section>

      </main>

      <PublicFooter />
    </div>
  )
}
