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
  action: (formData: FormData) => Promise<void>
  defaultValues?: DefaultValues
}) {
  const publishedDefault = defaultValues.published_at
    ? new Date(defaultValues.published_at).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]

  return (
    <form action={action} className="space-y-6">
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
          className="bg-gray-900 text-white text-sm px-6 py-2 rounded hover:bg-gray-700 transition-colors"
        >
          Save post
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
