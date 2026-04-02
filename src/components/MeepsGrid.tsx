'use client'

import { useState, useMemo } from 'react'
import MeepCard from './MeepCard'

type MeepEntry = {
  user: {
    id: string
    name: string
    alias: string | null
    tagline: string | null
    avatar: string | null
    role: 'VISITOR' | 'MEMBER' | 'GAME_MASTER'
    createdAt: Date
    _count: { ownedGames: number; hostedEvents: number; eventRsvps: number }
  }
  playerStats: {
    played: number
    gold: number
    silver: number
    bronze: number
    teaches: number
    mmr: number
    rankedPlayed: number
  }
}

interface MeepsGridProps {
  meeps: MeepEntry[]
  viewerUserId: string | null
  viewerIsGM: boolean
}

type SortKey = 'name' | 'mmr' | 'gold' | 'silver' | 'bronze' | 'teaches' | 'events' | 'games' | 'played'
type RoleFilter = 'ALL' | 'VISITOR' | 'MEMBER' | 'GAME_MASTER'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'name',    label: 'Sort: Name' },
  { value: 'mmr',     label: 'Sort: MMR' },
  { value: 'gold',    label: 'Sort: 🥇 Wins' },
  { value: 'silver',  label: 'Sort: 🥈 Silver' },
  { value: 'bronze',  label: 'Sort: 🥉 Bronze' },
  { value: 'teaches', label: 'Sort: Teaches' },
  { value: 'events',  label: 'Sort: Events' },
  { value: 'games',   label: 'Sort: Games Owned' },
  { value: 'played',  label: 'Sort: Played' },
]

const ROLE_LABELS: { value: RoleFilter; label: string }[] = [
  { value: 'ALL',         label: 'All' },
  { value: 'GAME_MASTER', label: 'Game Master' },
  { value: 'MEMBER',      label: 'Member' },
  { value: 'VISITOR',     label: 'Visitor' },
]


export default function MeepsGrid({ meeps, viewerUserId, viewerIsGM }: MeepsGridProps) {
  const [search, setSearch]         = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')
  const [sortBy, setSortBy]         = useState<SortKey>('name')

  const filtered = useMemo(() => {
    let list = meeps

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(m =>
        m.user.name.toLowerCase().includes(q) ||
        (m.user.alias?.toLowerCase().includes(q) ?? false)
      )
    }

    if (roleFilter !== 'ALL') {
      list = list.filter(m => m.user.role === roleFilter)
    }

    const out = [...list]

    if (sortBy === 'name') {
      out.sort((a, b) => (a.user.alias ?? a.user.name).localeCompare(b.user.alias ?? b.user.name))
    } else if (sortBy === 'mmr') {
      out.sort((a, b) => {
        const aQ = a.playerStats.rankedPlayed >= 4
        const bQ = b.playerStats.rankedPlayed >= 4
        if (aQ && !bQ) return -1
        if (!aQ && bQ) return 1
        if (!aQ && !bQ) return 0
        return b.playerStats.mmr - a.playerStats.mmr
      })
    } else if (sortBy === 'gold') {
      out.sort((a, b) => b.playerStats.gold - a.playerStats.gold)
    } else if (sortBy === 'silver') {
      out.sort((a, b) => b.playerStats.silver - a.playerStats.silver)
    } else if (sortBy === 'bronze') {
      out.sort((a, b) => b.playerStats.bronze - a.playerStats.bronze)
    } else if (sortBy === 'teaches') {
      out.sort((a, b) => b.playerStats.teaches - a.playerStats.teaches)
    } else if (sortBy === 'events') {
      out.sort((a, b) => b.user._count.eventRsvps - a.user._count.eventRsvps)
    } else if (sortBy === 'games') {
      out.sort((a, b) => b.user._count.ownedGames - a.user._count.ownedGames)
    } else if (sortBy === 'played') {
      out.sort((a, b) => b.playerStats.played - a.playerStats.played)
    }

    return out
  }, [meeps, search, roleFilter, sortBy])

  const hasFilters = !!(search || roleFilter !== 'ALL' || sortBy !== 'name')

  const reset = () => {
    setSearch('')
    setRoleFilter('ALL')
    setSortBy('name')
  }

  return (
    <div>
      {/* ── Filter rows (column, both same width) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <input
          type="text"
          placeholder="Search meeps…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="filter-input"
          style={{ width: '100%', maxWidth: '502px' }}
        />

        {/* ── chips + sort + clear ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        {/* Role filter chips */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {ROLE_LABELS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setRoleFilter(value)}
              style={{
                fontSize: '0.75rem',
                padding: '0.3rem 0.65rem',
                borderRadius: '999px',
                border: `1px solid ${roleFilter === value ? 'rgba(201,169,97,0.8)' : 'rgba(201,169,97,0.3)'}`,
                background: roleFilter === value ? 'rgba(201,169,97,0.15)' : 'rgba(0,0,0,0.2)',
                color: roleFilter === value ? '#C9A961' : 'rgba(232,212,184,0.65)',
                cursor: 'pointer',
                whiteSpace: 'nowrap' as const,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortKey)}
          className="filter-select"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={reset}
            className="filter-input"
            style={{ cursor: 'pointer', color: 'rgba(232,212,184,0.65)', borderColor: 'rgba(232,212,184,0.2)' }}
          >
            Clear ✕
          </button>
        )}
        </div>
      </div>

      {/* Result count */}
      <p style={{ fontSize: '0.8125rem', color: 'rgba(232,212,184,0.55)', marginBottom: '1.25rem' }}>
        {filtered.length} member{filtered.length !== 1 ? 's' : ''}
        {hasFilters && ` of ${meeps.length} total`}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p style={{ color: 'rgba(232,212,184,0.5)' }}>No meeps match your filters.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map(({ user, playerStats }) => (
            <MeepCard
              key={user.id}
              user={user}
              playerStats={playerStats}
              canEdit={viewerUserId === user.id || viewerIsGM}
            />
          ))}
        </div>
      )}
    </div>
  )
}
