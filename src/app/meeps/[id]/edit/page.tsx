'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import Header from '@/components/Header'

interface UserProfile {
  id: string
  name: string
  alias: string | null
  tagline: string | null
  email: string
  avatar: string | null
  bggId: string | null
  role: 'VISITOR' | 'MEMBER' | 'GAME_MASTER'
}

export default function EditMeepPage() {
  const router = useRouter()
  const params = useParams()
  const profileId = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/meeps/${profileId}`).then(res => res.json()),
      fetch('/api/user/profile').then(res => res.json()),
    ])
      .then(([profileData, currentUser]) => {
        const isOwner = currentUser.id === profileId
        const isGameMaster = currentUser.role === 'GAME_MASTER'

        if (!isOwner && !isGameMaster) {
          router.push('/meeps')
          return
        }

        setProfile(profileData)
        setAvatarUrl(profileData.avatar ?? null)
        setCurrentUserRole(currentUser.role)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load profile')
        setLoading(false)
      })
  }, [profileId, router])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarError(null)

    if (!file.type.startsWith('image/')) {
      setAvatarError('File must be an image.')
      return
    }
    if (file.size > 500 * 1024) {
      setAvatarError('Image must be under 500 KB.')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/user/avatar', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        setAvatarUrl(data.url)
      } else {
        setAvatarError(data.error || 'Upload failed.')
      }
    } catch {
      setAvatarError('Upload failed.')
    } finally {
      setUploading(false)
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const payload: Record<string, string | null> = {
      name: formData.get('name') as string,
      alias: formData.get('alias') as string,
      tagline: formData.get('tagline') as string,
      bggId: formData.get('bggId') as string,
      avatar: avatarUrl,
    }

    if (currentUserRole === 'GAME_MASTER') {
      payload.role = formData.get('role') as string
    }

    try {
      const response = await fetch(`/api/meeps/${profileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        router.push('/meeps')
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save changes')
      }
    } catch {
      setError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen p-8">
          <p>Loading...</p>
        </main>
      </>
    )
  }

  if (!profile) {
    return (
      <>
        <Header />
        <main className="min-h-screen p-8">
          <p style={{ color: '#d97070' }}>{error ?? 'Profile not found'}</p>
        </main>
      </>
    )
  }

  const initials = profile.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <>
      <Header />
      <main className="min-h-screen p-8">
        <h1 className="text-4xl font-bold mb-8">Edit Profile</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-lg">
          <div className="wood-panel space-y-4 mb-6">
            {/* Avatar */}
            <div className="field-group">
              <label>Photo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.4rem' }}>
                {/* Circular preview */}
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    border: '3px solid #C9A961',
                    background: 'linear-gradient(135deg, #3a2010, #5c3a1e)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#F5E6D3',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={profile.name} fill className="object-cover" unoptimized />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                      padding: '0.35rem 0.85rem',
                      background: 'rgba(201,169,97,0.1)',
                      border: '1px solid rgba(201,169,97,0.5)',
                      borderRadius: '4px',
                      color: '#C9A961',
                      fontSize: '0.8rem',
                      cursor: uploading ? 'wait' : 'pointer',
                    }}
                  >
                    {uploading ? 'Uploading…' : 'Upload photo'}
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl(null)}
                      style={{
                        padding: '0.35rem 0.85rem',
                        background: 'none',
                        border: '1px solid rgba(180,60,60,0.4)',
                        borderRadius: '4px',
                        color: '#d97070',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      Remove photo
                    </button>
                  )}
                  <p style={{ fontSize: '0.72rem', color: 'rgba(232,212,184,0.45)', margin: 0 }}>
                    Max 500 KB · JPG, PNG, GIF, WebP
                  </p>
                </div>
              </div>
              {avatarError && (
                <p style={{ color: '#d97070', fontSize: '0.8rem', marginTop: '0.4rem' }}>{avatarError}</p>
              )}
            </div>

            {/* Name */}
            <div className="field-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                defaultValue={profile.name}
              />
            </div>

            {/* Alias */}
            <div className="field-group">
              <label htmlFor="alias">Alias</label>
              <input
                type="text"
                id="alias"
                name="alias"
                defaultValue={profile.alias ?? ''}
                placeholder="Nickname or handle"
              />
            </div>

            {/* Tagline */}
            <div className="field-group">
              <label htmlFor="tagline">Tagline</label>
              <input
                type="text"
                id="tagline"
                name="tagline"
                defaultValue={profile.tagline ?? ''}
                placeholder="A short line about yourself"
                maxLength={120}
              />
            </div>

            {/* BGG */}
            <div className="field-group">
              <label htmlFor="bggId">BoardGameGeek Username</label>
              <input
                type="text"
                id="bggId"
                name="bggId"
                defaultValue={profile.bggId ?? ''}
                placeholder="Your BGG username"
              />
            </div>

            {/* Role — GM only */}
            {currentUserRole === 'GAME_MASTER' && (
              <div className="field-group">
                <label htmlFor="role">Role</label>
                <select id="role" name="role" defaultValue={profile.role}>
                  <option value="VISITOR">Visitor</option>
                  <option value="MEMBER">Member</option>
                  <option value="GAME_MASTER">Game Master</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button type="submit" disabled={saving || uploading} className="btn btn-md btn-primary disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => router.push('/meeps')} className="btn btn-md btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </main>
    </>
  )
}
