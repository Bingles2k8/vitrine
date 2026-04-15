'use client'

import { useActionState } from 'react'
import type { PostActionState } from '../actions'

type DefaultValues = {
  slug?: string
  title?: string
  description?: string
  content?: string
  keywords?: string[]
  published_at?: string
}

export function BlogPostForm({
  action,
  defaultValues = {},
}: {
  action: (prev: PostActionState, formData: FormData) => Promise<PostActionState>
  defaultValues?: DefaultValues
}) {
  const [state, formAction, pending] = useActionState(action, null)

  const publishedDefault = defaultValues.published_at
    ? new Date(defaultValues.published_at).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-4 py-3">
          {state.error}
        </div>
      )}
      <Field label="Title" name="title" defaultValue={defaultValues.title} required />
      <Field
        label="Slug"
        name="slug"
        defaultValue={defaultValues.slug}
        hint="URL-safe, e.g. how-to-catalog-a-collection"
        required
      />
      <Field
        label="Description"
        name="description"
        defaultValue={defaultValues.description}
        hint="Used in meta tags and the post listing"
        required
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Published date</label>
        <input
          type="date"
          name="publishedAt"
          defaultValue={publishedDefault}
          required
          className="border border-gray-300 rounded px-3 py-2 text-sm font-mono"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Keywords{' '}
          <span className="text-gray-400 font-normal">(one per line)</span>
        </label>
        <textarea
          name="keywords"
          rows={5}
          defaultValue={(defaultValues.keywords ?? []).join('\n')}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Content{' '}
          <span className="text-gray-400 font-normal">(Markdown)</span>
        </label>
        <textarea
          name="content"
          rows={32}
          defaultValue={defaultValues.content}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
        />
      </div>
      <div className="pt-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-gray-900 text-white text-sm px-6 py-2 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save post'}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  name,
  defaultValue,
  hint,
  required,
}: {
  label: string
  name: string
  defaultValue?: string
  hint?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
      />
    </div>
  )
}
