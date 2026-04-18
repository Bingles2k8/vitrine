import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://signed.example/put'),
}))

vi.mock('@/lib/r2', () => ({
  r2: {},
  r2PublicUrl: (bucket: string, path: string) => `https://public.example/${bucket}/${path}`,
  PutObjectCommand: class { constructor(public input: any) {} },
}))

const mockGetUser = vi.fn()
vi.mock('@/lib/supabase-server', () => ({
  createServerSideClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}))

const mockGetMuseum = vi.fn()
vi.mock('@/lib/get-museum', () => ({
  getMuseumForUser: (...args: any[]) => mockGetMuseum(...args),
}))

import { POST } from '@/app/api/storage/presign/route'

const MUSEUM_ID = '11111111-1111-1111-1111-111111111111'
const OTHER_MUSEUM = '22222222-2222-2222-2222-222222222222'

function makeRequest(body: any) {
  return new Request('http://localhost/api/storage/presign', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('POST /api/storage/presign', () => {
  beforeEach(() => {
    mockGetUser.mockReset()
    mockGetMuseum.mockReset()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGetMuseum.mockResolvedValue({ museum: { id: MUSEUM_ID } })
  })

  it('rejects unauthenticated requests', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await POST(makeRequest({
      bucket: 'object-images',
      path: `${MUSEUM_ID}/img.jpg`,
      contentType: 'image/jpeg',
    }))
    expect(res.status).toBe(401)
  })

  it('rejects invalid bucket', async () => {
    const res = await POST(makeRequest({
      bucket: 'hacker-bucket',
      path: `${MUSEUM_ID}/img.jpg`,
      contentType: 'image/jpeg',
    }))
    expect(res.status).toBe(400)
  })

  it('rejects path without UUID prefix', async () => {
    const res = await POST(makeRequest({
      bucket: 'object-images',
      path: 'not-a-uuid/img.jpg',
      contentType: 'image/jpeg',
    }))
    expect(res.status).toBe(400)
  })

  it('rejects path with traversal', async () => {
    const res = await POST(makeRequest({
      bucket: 'object-images',
      path: `${MUSEUM_ID}/../other/img.jpg`,
      contentType: 'image/jpeg',
    }))
    expect(res.status).toBe(400)
  })

  it('rejects path belonging to a different museum', async () => {
    const res = await POST(makeRequest({
      bucket: 'object-images',
      path: `${OTHER_MUSEUM}/img.jpg`,
      contentType: 'image/jpeg',
    }))
    expect(res.status).toBe(403)
  })

  it('rejects when user has no museum', async () => {
    mockGetMuseum.mockResolvedValue(null)
    const res = await POST(makeRequest({
      bucket: 'object-images',
      path: `${MUSEUM_ID}/img.jpg`,
      contentType: 'image/jpeg',
    }))
    expect(res.status).toBe(403)
  })

  it('accepts valid upload for caller museum', async () => {
    const res = await POST(makeRequest({
      bucket: 'object-images',
      path: `${MUSEUM_ID}/photo.jpg`,
      contentType: 'image/jpeg',
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.uploadUrl).toBe('https://signed.example/put')
    expect(body.publicUrl).toBe(`https://public.example/object-images/${MUSEUM_ID}/photo.jpg`)
  })

  it('rejects invalid content type', async () => {
    const res = await POST(makeRequest({
      bucket: 'object-images',
      path: `${MUSEUM_ID}/photo.jpg`,
      contentType: 'not a mime',
    }))
    expect(res.status).toBe(400)
  })
})
