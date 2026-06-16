'use client'

import { useState, type CSSProperties } from 'react'
import Image from 'next/image'
import ConfirmModal from './ConfirmModal'

interface EventOption {
  id: string
  title: string
  date: string
}

type LinkType = 'none' | 'custom' | 'event'

interface Preset {
  label: string
  subject: string
  heading: string
  body: string
  buttonText: string
  linkType: LinkType
}

const PRESETS: Record<string, Preset> = {
  pollsOpen: {
    label: 'Polls are open',
    subject: 'Meep Meet Date Vote 🎲',
    heading: 'The Polls are Open',
    body: "Hello Meeps!\n\nPlease select all the dates you'd be available for our next Meep Meet. Click below to cast your vote.",
    buttonText: 'Vote Now',
    linkType: 'event',
  },
  dateConfirmed: {
    label: 'Date confirmed',
    subject: 'Date confirmed!',
    heading: 'Date Confirmed',
    body: 'Our next Meep Meet date is locked in. Check the details and RSVP using the button below.',
    buttonText: 'View Event',
    linkType: 'event',
  },
  oneOff: {
    label: 'One-off message',
    subject: '',
    heading: '',
    body: '',
    buttonText: '',
    linkType: 'none',
  },
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(201,169,97,0.4)',
  borderRadius: '0.375rem',
  color: '#E8D4B8',
  outline: 'none',
  fontSize: '0.9rem',
}

const labelClass = 'block text-sm font-medium mb-1'
const labelStyle: CSSProperties = { color: '#C9A961' }

export default function EmailComposer({
  events,
  initialEventId,
  memberCount,
}: {
  events: EventOption[]
  initialEventId?: string
  memberCount: number
}) {
  const [subject, setSubject] = useState('')
  const [heading, setHeading] = useState('')
  const [body, setBody] = useState('')
  // When arriving from an event, default to a working "View Event" button linked to it
  const [buttonText, setButtonText] = useState(initialEventId ? 'View Event' : '')
  const [linkType, setLinkType] = useState<LinkType>(initialEventId ? 'event' : 'none')
  const [customUrl, setCustomUrl] = useState('')
  const [eventId, setEventId] = useState(initialEventId ?? '')

  const [sending, setSending] = useState<null | 'test' | 'members'>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const applyPreset = (key: string) => {
    const p = PRESETS[key]
    if (!p) return
    setSubject(p.subject)
    setHeading(p.heading)
    setBody(p.body)
    setButtonText(p.buttonText)
    setLinkType(p.linkType)
    setResult(null)
  }

  const selectedEvent = events.find((e) => e.id === eventId)
  const previewButtonUrl =
    buttonText.trim() && linkType === 'custom' && customUrl.trim()
      ? customUrl.trim()
      : buttonText.trim() && linkType === 'event' && selectedEvent
      ? `/events/${selectedEvent.id}`
      : null

  const canSend = subject.trim().length > 0 && body.trim().length > 0 && !sending

  const send = async (scope: 'test' | 'members') => {
    setSending(scope)
    setResult(null)
    try {
      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, heading, body, buttonText, linkType, customUrl, eventId, scope }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ ok: true, msg: `Sent to ${data.count} ${data.count === 1 ? 'recipient' : 'recipients'} (${scope === 'members' ? 'all members' : 'Game Masters'}).` })
      } else {
        setResult({ ok: false, msg: data.error || 'Failed to send' })
      }
    } catch {
      setResult({ ok: false, msg: 'Failed to send' })
    } finally {
      setSending(null)
      setConfirmOpen(false)
    }
  }

  const paragraphs = body.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean)

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Editor */}
      <div className="lg:w-1/2 space-y-4">
        <div className="wood-panel space-y-4">
          <div className="field-group">
            <label className={labelClass} style={labelStyle}>Template</label>
            <select
              defaultValue=""
              onChange={(e) => { if (e.target.value) applyPreset(e.target.value) }}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="" disabled>Start from a template…</option>
              {Object.entries(PRESETS).map(([key, p]) => (
                <option key={key} value={key}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label className={labelClass} style={labelStyle}>Subject *</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} style={inputStyle} placeholder="Email subject line" />
          </div>

          <div className="field-group">
            <label className={labelClass} style={labelStyle}>Heading</label>
            <input value={heading} onChange={(e) => setHeading(e.target.value)} style={inputStyle} placeholder="Optional heading shown above the body" />
          </div>

          <div className="field-group">
            <label className={labelClass} style={labelStyle}>Body *</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
              placeholder={'Write your message…\n\nLeave a blank line between paragraphs.'}
            />
          </div>
        </div>

        {/* Button */}
        <div className="wood-panel space-y-4">
          <h3 className="text-sm font-bold" style={{ color: '#C9A961' }}>Call-to-action button</h3>
          <div className="field-group">
            <label className={labelClass} style={labelStyle}>Button text</label>
            <input value={buttonText} onChange={(e) => setButtonText(e.target.value)} style={inputStyle} placeholder="e.g. Vote Now (leave blank for no button)" />
          </div>

          <div className="field-group">
            <label className={labelClass} style={labelStyle}>Button links to</label>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm py-2" style={{ color: '#E8D4B8' }}>
              {(['none', 'event', 'custom'] as LinkType[]).map((t) => (
                <label key={t} className="flex items-center gap-1.5 cursor-pointer" style={{ marginBottom: 0 }}>
                  <input
                    type="radio"
                    name="linkType"
                    checked={linkType === t}
                    onChange={() => setLinkType(t)}
                    style={{ accentColor: '#C9A961', outline: 'none', boxShadow: 'none' }}
                  />
                  {t === 'none' ? 'No link' : t === 'event' ? 'An event page' : 'Custom URL'}
                </label>
              ))}
            </div>
          </div>

          {linkType === 'event' && (
            <div className="field-group">
              <label className={labelClass} style={labelStyle}>Event</label>
              <select value={eventId} onChange={(e) => setEventId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="" disabled>Choose an event…</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} — {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </option>
                ))}
              </select>
            </div>
          )}

          {linkType === 'custom' && (
            <div className="field-group">
              <label className={labelClass} style={labelStyle}>Custom URL</label>
              <input value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} style={inputStyle} placeholder="https://…" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => send('test')} disabled={!canSend} className="btn btn-md btn-secondary disabled:opacity-50">
            {sending === 'test' ? 'Sending…' : 'Send test to GMs'}
          </button>
          <button onClick={() => setConfirmOpen(true)} disabled={!canSend} className="btn btn-md btn-primary disabled:opacity-50">
            {sending === 'members' ? 'Sending…' : 'Send to all members'}
          </button>
        </div>

        {result && (
          <p className="text-sm" style={{ color: result.ok ? '#8FBC8F' : '#E8A070' }}>
            {result.ok ? '✓ ' : ''}{result.msg}
          </p>
        )}
      </div>

      {/* Live preview */}
      <div className="lg:w-1/2">
        <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'rgba(201,169,97,0.7)', letterSpacing: '0.06em' }}>
          Preview
        </p>
        <div style={{ background: '#1a2e1a', padding: '1.25rem', borderRadius: '10px' }}>
          <div style={{ maxWidth: 520, margin: '0 auto', background: '#12200f', border: '1px solid #3d5432', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #3d5432', textAlign: 'center' }}>
              <div style={{ position: 'relative', width: 120, height: 56, margin: '0 auto' }}>
                <Image src="/mm-logo-parchment.png" alt="MeepMeet" fill className="object-contain" unoptimized />
              </div>
            </div>
            <div style={{ padding: '24px' }}>
              {heading.trim() && (
                <h2 style={{ margin: '0 0 16px', fontSize: '1.4rem', color: '#c9a84c', letterSpacing: '0.02em', fontFamily: 'Georgia, serif' }}>
                  {heading}
                </h2>
              )}
              {paragraphs.length > 0 ? (
                paragraphs.map((p, i) => (
                  <p key={i} style={{ margin: '0 0 14px', color: '#d4c9a8', fontSize: '1.05rem', lineHeight: 1.5, fontFamily: 'Georgia, serif', whiteSpace: 'pre-wrap' }}>
                    {p}
                  </p>
                ))
              ) : (
                <p style={{ margin: 0, color: 'rgba(212,201,168,0.4)', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
                  Your message preview will appear here…
                </p>
              )}
              {buttonText.trim() && previewButtonUrl && (
                <div style={{ marginTop: 22 }}>
                  <span style={{ display: 'inline-block', padding: '11px 24px', background: '#5a7a4a', color: '#e8d5b0', borderRadius: 6, fontWeight: 700, fontSize: '1rem', border: '1px solid #6d9458', fontFamily: 'Georgia, serif' }}>
                    {buttonText}
                  </span>
                </div>
              )}
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid #3d5432', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#d4c9a8', fontFamily: 'Georgia, serif' }}>
                You&apos;re receiving this because you&apos;re a Meep Meet member.
              </p>
            </div>
          </div>
        </div>
        {buttonText.trim() && !previewButtonUrl && (
          <p className="text-xs mt-2" style={{ color: '#E8A070' }}>
            Button text is set but no link is selected — the button won&apos;t appear until you pick a link.
          </p>
        )}
      </div>

      {confirmOpen && (
        <ConfirmModal
          title="Send to all members"
          message={`This will email ${memberCount} ${memberCount === 1 ? 'member' : 'members'} (everyone except visitors). Send a test first if you haven't.`}
          confirmLabel={`Send to ${memberCount} ${memberCount === 1 ? 'member' : 'members'}`}
          busy={sending === 'members'}
          onConfirm={() => send('members')}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  )
}
