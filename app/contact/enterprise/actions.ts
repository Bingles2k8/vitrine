'use server'

import { Resend } from 'resend'
import { headers } from 'next/headers'
import { apiLimiter } from '@/lib/rate-limit'

const resend = new Resend(process.env.RESEND_API_KEY)

function esc(s: string | null | undefined): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export type EnterpriseContactState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string }

export async function submitEnterpriseEnquiry(
  _prev: EnterpriseContactState,
  formData: FormData
): Promise<EnterpriseContactState> {
  const name           = (formData.get('name')           as string | null)?.trim()
  const institution    = (formData.get('institution')    as string | null)?.trim()
  const email          = (formData.get('email')          as string | null)?.trim()
  const collectionSize = (formData.get('collectionSize') as string | null)?.trim()
  const storageNeeds   = (formData.get('storageNeeds')   as string | null)?.trim()
  const staffCount     = (formData.get('staffCount')     as string | null)?.trim()
  const specialRequests = (formData.get('specialRequests') as string | null)?.trim()

  if (!name || !institution || !email) {
    return { status: 'error', message: 'Please fill in your name, institution, and email.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { status: 'error', message: 'Please enter a valid email address.' }
  }

  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? hdrs.get('x-real-ip') ?? 'unknown'
  const { success } = await apiLimiter.limit(ip).catch(() => ({ success: true }))
  if (!success) {
    return { status: 'error', message: 'Too many requests. Please try again later.' }
  }

  const html = `
    <h2 style="font-family:serif;margin-bottom:24px">Enterprise plan enquiry</h2>
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%">
      <tr><td style="padding:8px 0;color:#888;width:180px">Name</td><td style="padding:8px 0">${esc(name)}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Institution</td><td style="padding:8px 0">${esc(institution)}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Email</td><td style="padding:8px 0"><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
      <tr><td style="padding:8px 0;color:#888">Collection size</td><td style="padding:8px 0">${esc(collectionSize) || '—'}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Storage estimate</td><td style="padding:8px 0">${esc(storageNeeds) || '—'}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Staff / users</td><td style="padding:8px 0">${esc(staffCount) || '—'}</td></tr>
    </table>
    ${specialRequests ? `<h3 style="font-family:serif;margin-top:24px">Special requests / notes</h3><p style="font-family:sans-serif;font-size:14px;white-space:pre-wrap">${esc(specialRequests)}</p>` : ''}
  `

  try {
    await resend.emails.send({
      from: 'Vitrine <noreply@contact.vitrinecms.com>',
      to: 'hello@composition.agency',
      replyTo: email,
      subject: `Enterprise enquiry — ${institution}`,
      html,
    })
    return { status: 'success' }
  } catch {
    return { status: 'error', message: 'Something went wrong. Please try emailing us directly at hello@composition.agency.' }
  }
}
