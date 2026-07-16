import { createClient } from '@supabase/supabase-js'
import { verifyUnsubscribeToken } from '@/lib/emailTokens'

// One-click unsubscribe for re-engagement emails.
//
// Deliberately unauthenticated: the recipient must be able to opt out straight
// from the email. The signed token (lib/emailTokens.ts) is the proof — it names
// a museum we chose, so a reader cannot unsubscribe anyone but themselves.
//
// GET is intentional and required: mail clients follow the List-Unsubscribe
// header and users click links, neither of which can POST. A prefetch that
// unsubscribes someone is the safe failure direction; it cannot send email or
// destroy data, and the owner can re-enable in Settings.

export const dynamic = 'force-dynamic'

function page(title: string, body: string, status: number): Response {
  return new Response(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex">
  <title>${title} | Vitrine</title>
  <style>
    body { font-family: Georgia, serif; color: #1a1a1a; background: #faf9f7;
           display: flex; align-items: center; justify-content: center;
           min-height: 100vh; margin: 0; padding: 24px; }
    .card { max-width: 460px; background: #fff; border: 1px solid #e7e5e4;
            border-radius: 8px; padding: 32px; }
    h1 { font-style: italic; font-size: 22px; margin: 0 0 12px; }
    p { line-height: 1.6; margin: 0 0 12px; color: #44403c; }
    a { color: #1a1a1a; }
    @media (prefers-color-scheme: dark) {
      body { background: #1c1917; color: #f5f5f4; }
      .card { background: #292524; border-color: #44403c; }
      p { color: #d6d3d1; }
      a { color: #f5f5f4; }
    }
  </style>
</head>
<body><div class="card"><h1>${title}</h1>${body}</div></body>
</html>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } }
  )
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')
  const museumId = verifyUnsubscribeToken(token)

  if (!museumId) {
    return page(
      'This link is not valid',
      `<p>We could not verify this unsubscribe link. It may have been altered in transit.</p>
       <p>You can turn these emails off from your account settings, or reply to any Vitrine email and we will do it for you.</p>`,
      400
    )
  }

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await service
    .from('museums')
    .update({ reengage_opt_out: true })
    .eq('id', museumId)

  if (error) {
    return page(
      'Something went wrong',
      `<p>We could not update your preferences just now. Please try again shortly, or reply to any Vitrine email and we will do it for you.</p>`,
      500
    )
  }

  return page(
    'Unsubscribed',
    `<p>You will not receive any more re-engagement emails from Vitrine.</p>
     <p>This does not affect essential account email, such as billing or security notices.</p>
     <p>Changed your mind? You can turn them back on in your account settings.</p>`,
    200
  )
}
