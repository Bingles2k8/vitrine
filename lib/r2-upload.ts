export async function uploadToR2(bucket: string, path: string, file: File | Blob): Promise<string> {
  const res = await fetch('/api/storage/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucket, path, contentType: file.type }),
  })
  if (!res.ok) throw new Error('Failed to get upload URL')
  const { uploadUrl, publicUrl } = await res.json()

  const upload = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })
  if (!upload.ok) throw new Error('Upload to R2 failed')

  return publicUrl
}

export async function deleteFromR2(bucket: string, url: string): Promise<void> {
  await fetch('/api/storage/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucket, url }),
  })
}
