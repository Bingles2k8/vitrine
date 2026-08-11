import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const sendMock = vi.fn()
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock }
  },
}))

import { esc, hashContent, sendComplianceEmail, COMPLIANCE_FROM } from '@/lib/email/send'

describe('esc', () => {
  it('escapes the characters that break out of HTML context', () => {
    expect(esc('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
    )
  })

  it('escapes ampersands first so entities are not double-broken', () => {
    expect(esc('Tom & Jerry <b>')).toBe('Tom &amp; Jerry &lt;b&gt;')
  })

  it('treats null and undefined as empty', () => {
    expect(esc(null)).toBe('')
    expect(esc(undefined)).toBe('')
  })
})

describe('hashContent', () => {
  it('is stable for identical content', () => {
    expect(hashContent('<p>hello</p>')).toBe(hashContent('<p>hello</p>'))
  })

  it('changes when a single character changes', () => {
    expect(hashContent('<p>hello</p>')).not.toBe(hashContent('<p>hellp</p>'))
  })

  it('is a 64-character hex digest', () => {
    expect(hashContent('anything')).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('sendComplianceEmail', () => {
  const original = process.env.RESEND_API_KEY

  beforeEach(() => {
    sendMock.mockReset()
    process.env.RESEND_API_KEY = 're_test_key'
  })

  afterEach(() => {
    if (original === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = original
  })

  it('returns the provider message id and the content hash on success', async () => {
    sendMock.mockResolvedValue({ data: { id: 'msg_123' }, error: null })

    const result = await sendComplianceEmail({
      to: 'curator@example.org',
      subject: 'Your subscription has been cancelled',
      html: '<p>Confirmed</p>',
    })

    expect(result.messageId).toBe('msg_123')
    expect(result.contentHash).toBe(hashContent('<p>Confirmed</p>'))
    expect(result.error).toBeNull()
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ from: COMPLIANCE_FROM, to: 'curator@example.org' })
    )
  })

  it('reports a provider error without throwing', async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: 'domain not verified' } })

    const result = await sendComplianceEmail({
      to: 'curator@example.org',
      subject: 'x',
      html: '<p>x</p>',
    })

    expect(result.messageId).toBeNull()
    expect(result.error).toBe('domain not verified')
    // The hash is still returned, so a failed send is still evidenced.
    expect(result.contentHash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('swallows a thrown transport error, because a cancellation must not fail on email', async () => {
    sendMock.mockRejectedValue(new Error('socket hang up'))

    const result = await sendComplianceEmail({
      to: 'curator@example.org',
      subject: 'x',
      html: '<p>x</p>',
    })

    expect(result.messageId).toBeNull()
    expect(result.error).toBe('socket hang up')
  })

  it('reports a missing API key rather than attempting a send', async () => {
    delete process.env.RESEND_API_KEY

    const result = await sendComplianceEmail({
      to: 'curator@example.org',
      subject: 'x',
      html: '<p>x</p>',
    })

    expect(result.error).toMatch(/RESEND_API_KEY/)
    expect(sendMock).not.toHaveBeenCalled()
  })
})
