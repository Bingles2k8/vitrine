import type { StagedDoc } from '@/components/StagedDocumentPicker'

export async function uploadStagedDocs(
  supabase: any,
  staged: StagedDoc[],
  objectId: string,
  museumId: string,
  relatedToType: string,
  relatedToId: string,
): Promise<string[]> {
  const failed: string[] = []

  for (const doc of staged) {
    if (!doc.label.trim() || !doc.file) continue

    const ext = doc.file.name.split('.').pop()
    const path = `${museumId}/${objectId}/${relatedToType}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { data: storageData, error: storageErr } = await supabase.storage
      .from('object-documents')
      .upload(path, doc.file, { upsert: false })

    if (storageErr) {
      console.error('[uploadStagedDocs]', doc.file.name, storageErr.message)
      failed.push(doc.file.name)
      continue
    }

    const { data: { publicUrl } } = supabase.storage
      .from('object-documents')
      .getPublicUrl(storageData.path)

    const res = await fetch(`/api/objects/${objectId}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        related_to_type: relatedToType,
        related_to_id: relatedToId,
        label: doc.label.trim(),
        document_type: doc.docType || null,
        file_url: publicUrl,
        file_name: doc.file.name,
        file_size: doc.file.size,
        mime_type: doc.file.type,
      }),
    })

    if (!res.ok) {
      console.error('[uploadStagedDocs] API error for', doc.file.name)
      await supabase.storage.from('object-documents').remove([storageData.path])
      failed.push(doc.file.name)
    }
  }

  return failed
}
