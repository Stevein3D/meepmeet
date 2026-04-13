'use client'

import { useState, useMemo } from 'react'
import GameCard from './GameCard/GameCard'
import FilterDropdown from './FilterDropdown'
import type { Game, MeepScore } from '@/lib/types'

interface GamesGridProps {
  games: Game[]
  userId: string | null
  isGameMaster?: boolean
  meepScores: Record<string, MeepScore>
  userRatings?: Record<string, number>
  sidebar?: React.ReactNode
}

const PAGE_SIZE = 50

export default function GamesGrid({ games, userId, isGameMaster = false, meepScores, userRatings = {}, sidebar }: GamesGridProps) {
  const [showMobileStats, setShowMobileStats] = useState(false)
  const [search, setSearch] = useState('')
  const [playerCount, setPlayerCount] = useState<number | ''>('')
  const [selectedMechanics, setSelectedMechanics] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedOwners, setSelectedOwners] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'name' | 'meepScore' | 'complexity' | 'playtime' | 'interest' | 'dateAdded'>('name')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const allMechanics = useMemo(() => {
    const set = new Set<string>()
    for (const g of games) for (const m of g.mechanisms) set.add(m)
    return [...set].sort().map(m => ({ key: m, label: m }))
  }, [games])

  const allCategories = useMemo(() => {
    const set = new Set<string>()
    for (const g of games) for (const c of g.categories) set.add(c)
    return [...set].sort().map(c => ({ key: c, label: c }))
  }, [games])

  const allOwners = useMemo(() => {
    const map = new Map<string, string>()
    for (const g of games) for (const o of g.owners) map.set(o.userId, o.user.alias ?? o.user.name)
    return [...map.entries()]
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [games])

  const filtered = useMemo(() => {
    let list = games
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(g => g.name.toLowerCase().includes(q))
    }
    if (playerCount !== '') {
      const n = playerCount as number
      list = list.filter(g => g.minPlayers <= n && g.maxPlayers >= n)
    }
    if (selectedCategories.length > 0) {
      list = list.filter(g => selectedCategories.every(c => g.categories.includes(c)))
    }
    if (selectedMechanics.length > 0) {
      list = list.filter(g => selectedMechanics.every(m => g.mechanisms.includes(m)))
    }
    if (selectedOwners.length > 0) {
      list = list.filter(g => selectedOwners.some(uid => g.owners.some(o => o.userId === uid)))
    }
    const out = [...list]
    if (sortBy === 'meepScore') {
      out.sort((a, b) => {
        const aQ = (meepScores[a.id]?.count ?? 0) >= 2
        const bQ = (meepScores[b.id]?.count ?? 0) >= 2
        if (aQ && !bQ) return -1
        if (!aQ && bQ) return 1
        return (meepScores[b.id]?.avg ?? -1) - (meepScores[a.id]?.avg ?? -1)
      })
    } else if (sortBy === 'complexity') {
      out.sort((a, b) => (b.complexity ?? 0) - (a.complexity ?? 0))
    } else if (sortBy === 'playtime') {
      out.sort((a, b) => a.playtime - b.playtime)
    } else if (sortBy === 'interest') {
      out.sort((a, b) => b.wants.length - a.wants.length)
    } else if (sortBy === 'dateAdded') {
      out.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else {
      out.sort((a, b) => a.name.localeCompare(b.name))
    }
    return out
  }, [games, search, playerCount, selectedCategories, selectedMechanics, selectedOwners, sortBy, meepScores])

  const hasFilters = !!(search || playerCount !== '' || selectedCategories.length > 0 || selectedMechanics.length > 0 || selectedOwners.length > 0 || sortBy !== 'name')

  const reset = () => {
    setSearch(''); setPlayerCount('')
    setSelectedCategories([]); setSelectedMechanics([]); setSelectedOwners([]); setSortBy('name'); setVisibleCount(PAGE_SIZE)
  }

  const toggleMechanic = (m: string) => {
    setSelectedMechanics(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
    setVisibleCount(PAGE_SIZE)
  }

  const toggleCategory = (c: string) => {
    setSelectedCategories(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
    setVisibleCount(PAGE_SIZE)
  }

  const toggleOwner = (uid: string) => {
    setSelectedOwners(prev => prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid])
    setVisibleCount(PAGE_SIZE)
  }

  const visible = filtered.slice(0, visibleCount)
  const remaining = filtered.length - visibleCount

  return (
    <div>
      {/* ── Filter bar ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search games…"
          value={search}
          onChange={e => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE) }}
          className="filter-input"
          style={{ flex: 1, minWidth: '160px' }}
        />
        <input
          type="number"
          placeholder="Players"
          min={1}
          value={playerCount}
          onChange={e => { setPlayerCount(e.target.value ? Number(e.target.value) : ''); setVisibleCount(PAGE_SIZE) }}
          className="filter-input"
          style={{ width: '6rem' }}
        />

        <FilterDropdown
          label="Mechanics"
          options={allMechanics}
          selected={selectedMechanics}
          onToggle={toggleMechanic}
          searchPlaceholder="Filter mechanics…"
          emptyMessage="No mechanics found"
        />
        <FilterDropdown
          label="Categories"
          options={allCategories}
          selected={selectedCategories}
          onToggle={toggleCategory}
          searchPlaceholder="Filter categories…"
          emptyMessage="No categories found"
        />
        <FilterDropdown
          label="Owners"
          options={allOwners}
          selected={selectedOwners}
          onToggle={toggleOwner}
          searchPlaceholder="Filter owners…"
          emptyMessage="No owners found"
          width={220}
        />

        <select
          value={sortBy}
          onChange={e => { setSortBy(e.target.value as typeof sortBy); setVisibleCount(PAGE_SIZE) }}
          className="filter-select"
        >
          <option value="name">Sort: Name</option>
          <option value="meepScore">Sort: Meep Score</option>
          <option value="complexity">Sort: Complexity</option>
          <option value="playtime">Sort: Playtime</option>
          <option value="interest">Sort: Interest</option>
          <option value="dateAdded">Sort: Date Added</option>
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

      {/* ── Selected filter chips ── */}
      {(selectedCategories.length > 0 || selectedMechanics.length > 0 || selectedOwners.length > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
          {selectedCategories.map(c => (
            <button key={c} onClick={() => toggleCategory(c)} style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '999px', border: '1px solid rgba(201,169,97,0.5)', background: 'rgba(201,169,97,0.12)', color: '#C9A961', cursor: 'pointer' }}>
              {c} ✕
            </button>
          ))}
          {selectedMechanics.map(m => (
            <button key={m} onClick={() => toggleMechanic(m)} style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '999px', border: '1px solid rgba(201,169,97,0.5)', background: 'rgba(201,169,97,0.12)', color: '#C9A961', cursor: 'pointer' }}>
              {m} ✕
            </button>
          ))}
          {selectedOwners.map(uid => {
            const owner = allOwners.find(o => o.key === uid)
            return (
              <button key={uid} onClick={() => toggleOwner(uid)} style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '999px', border: '1px solid rgba(201,169,97,0.5)', background: 'rgba(201,169,97,0.12)', color: '#C9A961', cursor: 'pointer' }}>
                {owner?.label ?? uid} ✕
              </button>
            )
          })}
        </div>
      )}

      {/* ── Result count + mobile Top Charts button ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '0.8125rem', color: 'rgba(232,212,184,0.55)' }}>
          {filtered.length} game{filtered.length !== 1 ? 's' : ''}
          {hasFilters && ` of ${games.length} total`}
        </p>
        {sidebar && (
          <button
            className="lg:hidden filter-input"
            onClick={() => setShowMobileStats(true)}
            style={{ cursor: 'pointer', fontSize: '0.8125rem', padding: '0.3rem 0.75rem' }}
          >
            Top Charts
          </button>
        )}
      </div>

      {/* ── Cards + sidebar row ── */}
      <div className="flex flex-row gap-6 items-start">

        {/* Game cards column */}
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <p style={{ color: 'rgba(232,212,184,0.5)' }}>No games match your filters.</p>
          ) : (
            <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(min(315px, 100%), 1fr))' }}>
              {visible.map(game => (
                <GameCard
                  key={game.id}
                  game={game}
                  userId={userId}
                  isGameMaster={isGameMaster}
                  userOwnsGame={userId ? game.owners.some(o => o.userId === userId) : false}
                  userWantsGame={userId ? game.wants.some(w => w.userId === userId) : false}
                  wantCount={game.wants.length}
                  meepScore={meepScores[game.id]}
                  userRating={userRatings[game.id] ?? null}
                />
              ))}
            </div>
          )}

          {remaining > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
              <button
                onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                className="filter-input"
                style={{ cursor: 'pointer', padding: '0.6rem 2rem', borderColor: 'rgba(201,169,97,0.5)', fontSize: '0.9375rem' }}
              >
                Load More ({remaining} more)
              </button>
            </div>
          )}
        </div>

        {/* Desktop sidebar — hidden on mobile */}
        {sidebar && (
          <div
            className="hidden lg:block"
            style={{ width: 260, flexShrink: 0, position: 'sticky', top: '1.5rem', alignSelf: 'flex-start' }}
          >
            {sidebar}
          </div>
        )}

      </div>

      {/* Mobile Top Charts overlay */}
      {showMobileStats && sidebar && (
        <div
          className="lg:hidden"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 500,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setShowMobileStats(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              maxHeight: '80vh',
              overflowY: 'auto',
              padding: '1.25rem 1rem 1.5rem',
              background: '#1a0e06',
              border: '2px solid #8B6F47',
              borderRadius: '10px',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ color: '#C9A961', fontWeight: 700, fontSize: '1rem' }}>Top Charts</span>
              <button
                onClick={() => setShowMobileStats(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(232,212,184,0.6)', fontSize: '1.25rem', cursor: 'pointer', padding: '0.25rem' }}
              >
                ✕
              </button>
            </div>
            {sidebar}
          </div>
        </div>
      )}

    </div>
  )
}
