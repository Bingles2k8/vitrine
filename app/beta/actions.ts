'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function submitBetaPassword(formData: FormData) {
  const password = formData.get('password') as string
  const next = (formData.get('next') as string) || '/'

  if (!process.env.BETA_PASSWORD || password !== process.env.BETA_PASSWORD) {
    redirect(`/beta?next=${encodeURIComponent(next)}&error=1`)
  }

  const cookieStore = await cookies()
  cookieStore.set('beta_access', process.env.BETA_PASSWORD, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })

  redirect(next)
}
