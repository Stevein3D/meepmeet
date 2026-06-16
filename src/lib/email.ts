import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'MeepMeet <meepmail@meepmeet.club>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://meepmeet.club'
const LOGO_URL = `${APP_URL}/mm-logo-parchment.png`

function formatDate(date: Date): string {
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  })
}

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:30px 30px;background:#1a2e1a;font-family:Georgia,serif;">
  <div style="max-width:520px;margin:32px auto;background:#12200f;border:1px solid #3d5432;border-radius:10px;overflow:hidden;">
    <div style="background:#12200f;padding:28px 28px 28px;border-bottom:1px solid #3d5432;text-align:center;">
      <img src="${LOGO_URL}" alt="MeepMeet" width="120" style="display:block;margin:0 auto;max-width:120px;" />
    </div>
    <div style="padding:28px;">
      ${content}
    </div>
    <div style="padding:14px 28px;border-top:1px solid #3d5432;text-align:center;">
      <p style="margin:0;font-size:0.85rem;color:#d4c9a8;">You're receiving this because you're a Meep Meet member.</p>
    </div>
  </div>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Convert plain editable text into email-safe paragraphs (blank line = new
// paragraph, single newline = <br>). Escapes HTML so GM-entered text can't break
// the layout or inject markup.
function textToParagraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(
      (block) =>
        `<p style="margin:0 0 14px;color:#d4c9a8;font-size:1.05rem;line-height:1.5;">${escapeHtml(block).replace(/\n/g, '<br>')}</p>`,
    )
    .join('')
}

async function batchSend(
  recipients: { email: string; name: string }[],
  subject: string,
  html: string,
) {
  const messages = recipients.map(r => ({
    from: FROM,
    to: r.email,
    subject,
    html,
  }))
  // Resend batch limit is 100 per call
  for (let i = 0; i < messages.length; i += 100) {
    await resend.batch.send(messages.slice(i, i + 100))
  }
}

export async function sendDateConfirmedEmail({
  eventTitle,
  date,
  location,
  eventId,
  recipients,
}: {
  eventTitle: string
  date: Date
  location: string | null
  eventId: string
  recipients: { email: string; name: string }[]
}) {
  if (!process.env.RESEND_API_KEY || recipients.length === 0) return

  const formattedDate = formatDate(date)
  const eventUrl = `${APP_URL}/events/${eventId}`

  const html = baseLayout(`
    <h2 style="margin:0 0 16px;font-size:1.1rem;color:#c9a84c;letter-spacing:0.02em;">Date Confirmed</h2>
    <p style="margin:0 0 10px;color:#d4c9a8;font-size:1.1rem;line-height:1.3font-weight:600;">${eventTitle}</p>
    <p style="margin:0 0 6px;color:#d4c9a8;font-size:1.1rem;line-height:1.3;"><span style="color:#c9a84c;font-weight:600;">When:</span> ${formattedDate}</p>
    ${location ? `<p style="margin:0 0 6px;color:#d4c9a8;font-size:1.1rem;line-height:1.3;"><span style="color:#c9a84c;font-weight:600;">Where:</span> ${location}</p>` : ''}
    <div style="margin-top:24px;">
      <a href="${eventUrl}" style="display:inline-block;padding:10px 22px;background:#5a7a4a;color:#e8d5b0;text-decoration:none;border-radius:6px;font-weight:700;font-size:0.9rem;border:1px solid #6d9458;">View Event</a>
    </div>
  `)

  await batchSend(recipients, `Date confirmed: ${eventTitle}`, html)
}

/**
 * Generic GM-composed email: editable heading + body, with an optional CTA
 * button. Wrapped in the same logo/footer layout as every other email.
 */
export async function sendCustomEmail({
  subject,
  heading,
  body,
  buttonText,
  buttonUrl,
  recipients,
}: {
  subject: string
  heading?: string
  body: string
  buttonText?: string
  buttonUrl?: string
  recipients: { email: string; name: string }[]
}) {
  if (!process.env.RESEND_API_KEY || recipients.length === 0) return

  const headingHtml = heading
    ? `<h2 style="margin:0 0 16px;font-size:1.4rem;color:#c9a84c;letter-spacing:0.02em;">${escapeHtml(heading)}</h2>`
    : ''
  const bodyHtml = textToParagraphs(body)
  const buttonHtml =
    buttonText && buttonUrl
      ? `<div style="margin-top:22px;"><a href="${escapeHtml(buttonUrl)}" style="display:inline-block;padding:11px 24px;background:#5a7a4a;color:#e8d5b0;text-decoration:none;border-radius:6px;font-weight:700;font-size:1rem;border:1px solid #6d9458;">${escapeHtml(buttonText)}</a></div>`
      : ''

  const html = baseLayout(`${headingHtml}${bodyHtml}${buttonHtml}`)
  await batchSend(recipients, subject, html)
}

export async function sendNewUserNotificationEmail({
  name,
  email,
  clerkId,
}: {
  name: string
  email: string
  clerkId: string
}) {
  if (!process.env.RESEND_API_KEY) return

  const profileUrl = `${APP_URL}/admin/users`

  const html = baseLayout(`
    <h2 style="margin:0 0 16px;font-size:1.5rem;color:#c9a84c;letter-spacing:0.02em;">New Member Signup</h2>
    <p style="margin:0 0 16px;color:#d4c9a8;font-size:1.1rem;line-height:1.5;">A new member has joined Meep Meet!</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
      <tr>
        <td style="padding:8px 0;color:#c9a84c;font-weight:600;font-size:1rem;width:80px;">Name</td>
        <td style="padding:8px 0;color:#e8d5b0;font-size:1rem;">${name}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#c9a84c;font-weight:600;font-size:1rem;">Email</td>
        <td style="padding:8px 0;color:#e8d5b0;font-size:1rem;">${email}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#c9a84c;font-weight:600;font-size:1rem;">Clerk ID</td>
        <td style="padding:8px 0;color:#d4c9a8;font-size:0.9rem;font-family:monospace;">${clerkId}</td>
      </tr>
    </table>
    <div style="margin-top:8px;">
      <a href="${profileUrl}" style="display:inline-block;padding:10px 22px;background:#5a7a4a;color:#e8d5b0;text-decoration:none;border-radius:6px;font-weight:700;font-size:0.9rem;border:1px solid #6d9458;">View All Users</a>
    </div>
  `)

  await resend.emails.send({
    from: FROM,
    to: 'meepmail@meepmeet.club',
    subject: `New member: ${name}`,
    html,
  })
}

export async function sendPollOpenEmail({
  eventTitle,
  eventId,
  recipients,
}: {
  eventTitle: string
  eventId: string
  recipients: { email: string; name: string }[]
}) {
  if (!process.env.RESEND_API_KEY || recipients.length === 0) return

  const eventUrl = `${APP_URL}/events/${eventId}`

  const html = baseLayout(`
    <h2 style="margin:0 0 16px;font-size:1.5rem;color:#c9a84c;letter-spacing:0.02em;">The Polls are Open (again)</h2>
    <p style="margin:0 0 12px;color:#d4c9a8;font-size:1.1rem;line-height:1.3">Hello Meeps, our apologies for the double email blast and false confirmation. Our meepstake. :C</p>
    <p style="margin:0 0 12px;color:#d4c9a8;font-size:1.1rem;line-height:1.3">Please select all the dates you'd be available for the next Meep Meet - <span style="font-weight:600;color:#e8d5b0;">${eventTitle}</span>. Click the button below to cast your vote!</p>
    <div style="margin-top:20px;">
      <a href="${eventUrl}" style="display:inline-block;padding:10px 22px;background:#5a7a4a;color:#e8d5b0;text-decoration:none;border-radius:6px;font-weight:700;font-size:1.3rem;border:1px solid #6d9458;">Vote Now</a>
    </div>
  `)

  await batchSend(recipients, `Meep Meet Date Vote 🎲`, html)
}
