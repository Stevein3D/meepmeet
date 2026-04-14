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
    <h2 style="margin:0 0 16px;font-size:1.5rem;color:#c9a84c;letter-spacing:0.02em;">The Polls are Open</h2>
    <p style="margin:0 0 12px;color:#d4c9a8;font-size:1.1rem;line-height:1.3">Hello Meeps, and welcome to the very first MeepMail - we're very excited you're here!</p>
    <p style="margin:0 0 12px;color:#d4c9a8;font-size:1.1rem;line-height:1.3">MeepMail is your go-to source for all the important details on upcoming Meep Meets. For each event, you can expect three emails:</p>
    <p style="margin:0;color:#d4c9a8;font-size:1.1rem;line-height:1.3">1. A date poll to pick all dates that you can attend (that's this one)</p>
    <p style="margin:0;color:#d4c9a8;font-size:1.1rem;line-height:1.3">2. A confirmation with the finalized date and an RSVP request</p>
    <p style="margin:0 0 12px;color:#d4c9a8;font-size:1.1rem;line-height:1.3">3. A reminder the week of the event</p>
    <p style="margin:0 0 12px;color:#d4c9a8;font-size:1.1rem;line-height:1.3">To kick things off, we're asking you to select all the dates you'd be available for the next Meep Meet - <span style="font-weight:600;color:#e8d5b0;">${eventTitle}</span>. Click the button below to cast your vote!</p>
    <div style="margin-top:20px;">
      <a href="${eventUrl}" style="display:inline-block;padding:10px 22px;background:#5a7a4a;color:#e8d5b0;text-decoration:none;border-radius:6px;font-weight:700;font-size:1.3rem;border:1px solid #6d9458;">Vote Now</a>
    </div>
  `)

  await batchSend(recipients, `Welcome to MeepMail! 🎲`, html)
}
