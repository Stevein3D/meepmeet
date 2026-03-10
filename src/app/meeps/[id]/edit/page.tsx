'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Header from '@/components/Header'

interface UserProfile {
  id: string
  name: string
  alias: string | null
  email: string
  bggId: string | null
  role: 'VISITOR' | 'MEMBER' | 'GAME_MASTER'
}

export default function EditMeepPage() {
  const router = useRouter()
  const params = useParams()
  const profileId = params.id as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        setCurrentUserRole(currentUser.role)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load profile')
        setLoading(false)
      })
  }, [profileId, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const payload: Record<string, string> = {
      name: formData.get('name') as string,
      alias: formData.get('alias') as string,
      bggId: formData.get('bggId') as string,
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
          <p className="text-red-600">{error ?? 'Profile not found'}</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen p-8">
        <h1 className="text-4xl font-bold mb-2">Edit Profile</h1>
        <p className="text-gray-500 mb-8">{profile.email}</p>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              defaultValue={profile.name}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label htmlFor="alias" className="block text-sm font-medium mb-1">
              Alias
            </label>
            <input
              type="text"
              id="alias"
              name="alias"
              defaultValue={profile.alias ?? ''}
              placeholder="Nickname or handle"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label htmlFor="bggId" className="block text-sm font-medium mb-1">
              BoardGameGeek Username
            </label>
            <input
              type="text"
              id="bggId"
              name="bggId"
              defaultValue={profile.bggId ?? ''}
              placeholder="Your BGG username"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          {currentUserRole === 'GAME_MASTER' && (
            <div>
              <label htmlFor="role" className="block text-sm font-medium mb-1">
                Role
              </label>
              <select
                id="role"
                name="role"
                defaultValue={profile.role}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="VISITOR">Visitor</option>
                <option value="MEMBER">Member</option>
                <option value="GAME_MASTER">Game Master</option>
              </select>
            </div>
          )}

          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/meeps')}
              className="px-6 py-2 border rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </>
  )
}
