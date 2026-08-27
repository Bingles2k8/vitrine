import { createClient } from '@supabase/supabase-js'
import {
  verifyUnsubscribeToken,
  verifyUserUnsubscribeToken,
  verifyReminderUnsubscribeToken,
} from '@/lib/emailTokens'

// One-click unsubscribe for the non-essential email Vitrine sends.
//
// Deliberately unauthenticated: the recipient must be able to opt out straight
// from the email. The signed token (lib/emailTokens.ts) is the proof — it names
// a museum or a user we chose, so a reader cannot unsubscribe anyone but
// themselves.
//
// Three token types land here, and which one verifies decides what gets
// switched off:
//
//   museum    → museums.reengage_opt_out     re-engagement ("come back")
//   user      → account_email_opt_outs       same, for someone with no museum
//   reminder  → museums.reminder_opt_out     compliance digest, overdue loans
//
// They are separately signed, so a token only ever verifies as the kind it was
// issued as. That is what stops "stop asking me to come back" from also
// switching off "the object you lent out is overdue".
//
// `?undo=1` reverses whichever opt-out the token names. The success page links
// to it, because there is no account-settings screen in the product to send
// people to and telling them there is one would be a lie.
//
// GET and POST both, and both are required.
//
// GET is what a person clicking a link in the mail sends. POST is what a mail
// provider sends: every one of these emails carries
// `List-Unsubscribe-Post: List-Unsubscribe=One-Click`, and RFC 8058 says a URI
// advertised that way MUST accept a POST. Gmail's and Yahoo's bulk-sender rules
// require that one-click actually work. Until now only GET existed, so every
// provider that honoured the header got a 405 and the reader's "unsubscribe"
// button did nothing — the worst possible failure for a header whose entire
// purpose is to stop people reporting the mail as spam instead.
//
// A prefetch that unsubscribes someone is the safe failure direction; it cannot
// send email or destroy data, and the undo link reverses it.

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

/** What the reader thinks they are turning off, in their words not the schema's. */
const DESCRIPTION = {
  reengage: 'reminders about coming back to Vitrine',
  reminders: 'reminder emails about your collection, such as overdue loans and upcoming compliance dates',
} as const

/**
 * One-click unsubscribe, per RFC 8058.
 *
 * The provider POSTs with a `List-Unsubscribe=One-Click` body; everything that
 * identifies the request is in the signed token on the URL, so the body is not
 * read. Same handler as GET deliberately — one code path, so the two can never
 * disagree about what a token means.
 */
export async function POST(request: Request) {
  return GET(request)
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  const undo = url.searchParams.get('undo') === '1'

  // Tried in turn; only one can verify, because each purpose is signed apart.
  const museumId = verifyUnsubscribeToken(token)
  const reminderMuseumId = museumId ? null : verifyReminderUnsubscribeToken(token)
  const userId = museumId || reminderMuseumId ? null : verifyUserUnsubscribeToken(token)

  if (!museumId && !reminderMuseumId && !userId) {
    return page(
      'This link is not valid',
      `<p>We could not verify this unsubscribe link. It may have been altered in transit.</p>
       <p>Reply to any Vitrine email and we will unsubscribe you by hand.</p>`,
      400
    )
  }

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = museumId
    ? await service.from('museums').update({ reengage_opt_out: !undo }).eq('id', museumId)
    : reminderMuseumId
      ? await service.from('museums').update({ reminder_opt_out: !undo }).eq('id', reminderMuseumId)
      // Presence of the row is the opt-out, so undo is a delete. Upsert rather
      // than insert so a second click is a no-op instead of a duplicate-key
      // error the reader would read as a failure.
      : undo
        ? await service.from('account_email_opt_outs').delete().eq('user_id', userId)
        : await service.from('account_email_opt_outs').upsert({ user_id: userId }, { onConflict: 'user_id' })

  // A user token naming an account that no longer exists violates the foreign
  // key to auth.users, because the opt-out is an INSERT where the museum paths
  // are an UPDATE that simply matches no rows. That happens for real: someone
  // deletes their account, then clicks the unsubscribe link in an email still
  // sitting in their inbox. There is nothing to opt out and never will be, so
  // the honest answer is the success page, not a 500 telling them we failed.
  const gone = error?.code === '23503'

  if (error && !gone) {
    return page(
      'Something went wrong',
      `<p>We could not update your preferences just now. Please try again shortly, or reply to any Vitrine email and we will do it for you.</p>`,
      500
    )
  }

  const what = reminderMuseumId ? DESCRIPTION.reminders : DESCRIPTION.reengage

  if (undo) {
    return page(
      'Subscribed again',
      `<p>You will receive ${what}.</p>
       <p>Every one of them carries an unsubscribe link, so you can stop them again at any time.</p>`,
      200
    )
  }

  // The undo link is the whole reason this page can promise reversibility. It
  // is the same token — signed, unexpiring — so it works from an archived email
  // months later, which is the point.
  const undoUrl = `${url.origin}${url.pathname}?token=${encodeURIComponent(token ?? '')}&undo=1`

  return page(
    'Unsubscribed',
    `<p>You will not receive any more ${what}.</p>
     <p>This does not affect essential account email, such as billing or security notices.</p>
     <p>Changed your mind? <a href="${undoUrl}">Turn them back on</a>.</p>`,
    200
  )
}
