import type { StagedDoc } from '@/components/StagedDocumentPicker'
import { uploadToR2, deleteFromR2 } from '@/lib/r2-upload'

export async function uploadStagedDocs(
  _supabase: any,
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

    let publicUrl: string
    try {
      publicUrl = await uploadToR2('object-documents', path, doc.file)
    } catch (err) {
      console.error('[uploadStagedDocs]', doc.file.name, err)
      failed.push(doc.file.name)
      continue
    }

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
      await deleteFromR2('object-documents', publicUrl)
      failed.push(doc.file.name)
    }
  }

  return failed
}
