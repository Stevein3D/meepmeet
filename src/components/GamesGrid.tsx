'use client'

import { useState, useMemo, useRef, useEffect, CSSProperties } from 'react'
import GameCard from './GameCard/GameCard'

type Game = {
  id: string
  bggId: number | null
  name: string
  image: string | null
  description: string | null
  categories: string[]
  mechanisms: string[]
  minPlayers: number
  maxPlayers: number
  playtime: number
  complexity: number | null
  yearPublished: number | null
  owners: { userId: string; user: { name: string; alias: string | null } }[]
  wants: { userId: string; user: { name: string; alias: string | null } }[]
}

type MeepScore = { avg: number; count: number }

interface GamesGridProps {
  games: Game[]
  userId: string | null
  isGameMaster?: boolean
  meepScores: Record<string, MeepScore>
  sidebar?: React.ReactNode
}

const ARROW_SVG = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath d='M0 0.5l5 5 5-5' stroke='%23C9A961' stroke-opacity='0.65' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C%2Fsvg%3E\")"

const INPUT: CSSProperties = {
  background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(201,169,97,0.4)',
  borderRadius: '0.375rem',
  color: '#F5E6D3',
  padding: '0.45rem 0.65rem',
  fontSize: '0.875rem',
  outline: 'none',
}

// Select needs backgroundColor split from background so backgroundImage isn't reset
const SELECT: CSSProperties = {
  backgroundColor: 'rgba(0,0,0,0.35)',
  backgroundImage: ARROW_SVG,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.65rem center',
  backgroundSize: '10px 6px',
  border: '1px solid rgba(201,169,97,0.4)',
  borderRadius: '0.375rem',
  color: '#F5E6D3',
  padding: '0.45rem 0.65rem',
  paddingRight: '2rem',
  fontSize: '0.875rem',
  outline: 'none',
  appearance: 'none' as const,
  cursor: 'pointer',
}

const PAGE_SIZE = 50

export default function GamesGrid({ games, userId, isGameMaster = false, meepScores, sidebar }: GamesGridProps) {
  const [showMobileStats, setShowMobileStats] = useState(false)
  const [search, setSearch] = useState('')
  const [playerCount, setPlayerCount] = useState<number | ''>('')
  const [selectedMechanics, setSelectedMechanics] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedOwners, setSelectedOwners] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'name' | 'meepScore' | 'complexity' | 'playtime' | 'interest'>('name')
  const [mechanicsOpen, setMechanicsOpen] = useState(false)
  const [mechanicSearch, setMechanicSearch] = useState('')
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [categorySearch, setCategorySearch] = useState('')
  const [ownersOpen, setOwnersOpen] = useState(false)
  const [ownerSearch, setOwnerSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const mechanicsRef = useRef<HTMLDivElement>(null)
  const categoriesRef = useRef<HTMLDivElement>(null)
  const ownersRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mechanicsOpen) return
    const close = (e: MouseEvent | TouchEvent) => {
      if (mechanicsRef.current && !mechanicsRef.current.contains(e.target as Node)) {
        setMechanicsOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('touchstart', close)
    }
  }, [mechanicsOpen])

  useEffect(() => {
    if (!categoriesOpen) return
    const close = (e: MouseEvent | TouchEvent) => {
      if (categoriesRef.current && !categoriesRef.current.contains(e.target as Node)) {
        setCategoriesOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('touchstart', close)
    }
  }, [categoriesOpen])

  useEffect(() => {
    if (!ownersOpen) return
    const close = (e: MouseEvent | TouchEvent) => {
      if (ownersRef.current && !ownersRef.current.contains(e.target as Node)) {
        setOwnersOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('touchstart', close)
    }
  }, [ownersOpen])

  const allMechanics = useMemo(() => {
    const set = new Set<string>()
    for (const g of games) for (const m of g.mechanisms) set.add(m)
    return [...set].sort()
  }, [games])

  const allCategories = useMemo(() => {
    const set = new Set<string>()
    for (const g of games) for (const c of g.categories) set.add(c)
    return [...set].sort()
  }, [games])

  const allOwners = useMemo(() => {
    const map = new Map<string, string>()
    for (const g of games) for (const o of g.owners) map.set(o.userId, o.user.alias ?? o.user.name)
    return [...map.entries()].map(([userId, name]) => ({ userId, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [games])

  const shownMechanics = mechanicSearch
    ? allMechanics.filter(m => m.toLowerCase().includes(mechanicSearch.toLowerCase()))
    : allMechanics

  const shownCategories = categorySearch
    ? allCategories.filter(c => c.toLowerCase().includes(categorySearch.toLowerCase()))
    : allCategories

  const shownOwners = ownerSearch
    ? allOwners.filter(o => o.name.toLowerCase().includes(ownerSearch.toLowerCase()))
    : allOwners

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
          style={{ ...INPUT, flex: '1', minWidth: '160px' }}
        />
        <input
          type="number"
          placeholder="Players"
          min={1} max={20}
          value={playerCount}
          onChange={e => { setPlayerCount(e.target.value ? Number(e.target.value) : ''); setVisibleCount(PAGE_SIZE) }}
          style={{ ...INPUT, width: '6rem' }}
        />

        {/* Mechanics dropdown */}
        <div ref={mechanicsRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMechanicsOpen(o => !o)}
            style={{
              ...INPUT,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              whiteSpace: 'nowrap',
              borderColor: selectedMechanics.length > 0 ? 'rgba(201,169,97,0.8)' : 'rgba(201,169,97,0.4)',
              background: selectedMechanics.length > 0 ? 'rgba(201,169,97,0.12)' : 'rgba(0,0,0,0.35)',
            }}
          >
            Mechanics{selectedMechanics.length > 0 ? ` (${selectedMechanics.length})` : ' ▾'}
          </button>

          {mechanicsOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              zIndex: 200,
              width: '240px',
              maxHeight: '280px',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(18,10,4,0.98)',
              border: '1px solid rgba(201,169,97,0.4)',
              borderRadius: '0.375rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            }}>
              <div style={{ padding: '0.5rem', borderBottom: '1px solid rgba(201,169,97,0.15)', flexShrink: 0 }}>
                <input
                  type="text"
                  placeholder="Filter mechanics…"
                  value={mechanicSearch}
                  onChange={e => setMechanicSearch(e.target.value)}
                  style={{ ...INPUT, width: '100%', boxSizing: 'border-box' }}
                  autoFocus
                />
              </div>
              <div style={{ overflowY: 'auto', padding: '0.3rem 0.25rem' }}>
                {shownMechanics.map(m => (
                  <label
                    key={m}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      color: selectedMechanics.includes(m) ? '#C9A961' : '#E8D4B8',
                      fontSize: '0.8125rem',
                      background: selectedMechanics.includes(m) ? 'rgba(201,169,97,0.08)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMechanics.includes(m)}
                      onChange={() => toggleMechanic(m)}
                      style={{ accentColor: '#C9A961', flexShrink: 0 }}
                    />
                    {m}
                  </label>
                ))}
                {shownMechanics.length === 0 && (
                  <p style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'rgba(232,212,184,0.4)' }}>
                    No mechanics found
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Categories dropdown */}
        <div ref={categoriesRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setCategoriesOpen(o => !o)}
            style={{
              ...INPUT,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              whiteSpace: 'nowrap',
              borderColor: selectedCategories.length > 0 ? 'rgba(201,169,97,0.8)' : 'rgba(201,169,97,0.4)',
              background: selectedCategories.length > 0 ? 'rgba(201,169,97,0.12)' : 'rgba(0,0,0,0.35)',
            }}
          >
            Categories{selectedCategories.length > 0 ? ` (${selectedCategories.length})` : ' ▾'}
          </button>

          {categoriesOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              zIndex: 200,
              width: '240px',
              maxHeight: '280px',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(18,10,4,0.98)',
              border: '1px solid rgba(201,169,97,0.4)',
              borderRadius: '0.375rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            }}>
              <div style={{ padding: '0.5rem', borderBottom: '1px solid rgba(201,169,97,0.15)', flexShrink: 0 }}>
                <input
                  type="text"
                  placeholder="Filter categories…"
                  value={categorySearch}
                  onChange={e => setCategorySearch(e.target.value)}
                  style={{ ...INPUT, width: '100%', boxSizing: 'border-box' }}
                  autoFocus
                />
              </div>
              <div style={{ overflowY: 'auto', padding: '0.3rem 0.25rem' }}>
                {shownCategories.map(c => (
                  <label
                    key={c}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      color: selectedCategories.includes(c) ? '#C9A961' : '#E8D4B8',
                      fontSize: '0.8125rem',
                      background: selectedCategories.includes(c) ? 'rgba(201,169,97,0.08)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(c)}
                      onChange={() => toggleCategory(c)}
                      style={{ accentColor: '#C9A961', flexShrink: 0 }}
                    />
                    {c}
                  </label>
                ))}
                {shownCategories.length === 0 && (
                  <p style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'rgba(232,212,184,0.4)' }}>
                    No categories found
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Owners dropdown */}
        <div ref={ownersRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setOwnersOpen(o => !o)}
            style={{
              ...INPUT,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              whiteSpace: 'nowrap',
              borderColor: selectedOwners.length > 0 ? 'rgba(201,169,97,0.8)' : 'rgba(201,169,97,0.4)',
              background: selectedOwners.length > 0 ? 'rgba(201,169,97,0.12)' : 'rgba(0,0,0,0.35)',
            }}
          >
            Owners{selectedOwners.length > 0 ? ` (${selectedOwners.length})` : ' ▾'}
          </button>

          {ownersOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              zIndex: 200,
              width: '220px',
              maxHeight: '280px',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(18,10,4,0.98)',
              border: '1px solid rgba(201,169,97,0.4)',
              borderRadius: '0.375rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            }}>
              <div style={{ padding: '0.5rem', borderBottom: '1px solid rgba(201,169,97,0.15)', flexShrink: 0 }}>
                <input
                  type="text"
                  placeholder="Filter owners…"
                  value={ownerSearch}
                  onChange={e => setOwnerSearch(e.target.value)}
                  style={{ ...INPUT, width: '100%', boxSizing: 'border-box' }}
                  autoFocus
                />
              </div>
              <div style={{ overflowY: 'auto', padding: '0.3rem 0.25rem' }}>
                {shownOwners.map(o => (
                  <label
                    key={o.userId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      color: selectedOwners.includes(o.userId) ? '#C9A961' : '#E8D4B8',
                      fontSize: '0.8125rem',
                      background: selectedOwners.includes(o.userId) ? 'rgba(201,169,97,0.08)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedOwners.includes(o.userId)}
                      onChange={() => toggleOwner(o.userId)}
                      style={{ accentColor: '#C9A961', flexShrink: 0 }}
                    />
                    {o.name}
                  </label>
                ))}
                {shownOwners.length === 0 && (
                  <p style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'rgba(232,212,184,0.4)' }}>
                    No owners found
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => { setSortBy(e.target.value as typeof sortBy); setVisibleCount(PAGE_SIZE) }}
          style={SELECT}
        >
          <option value="name">Sort: Name</option>
          <option value="meepScore">Sort: Meep Score</option>
          <option value="complexity">Sort: Complexity</option>
          <option value="playtime">Sort: Playtime</option>
          <option value="interest">Sort: Interest</option>
        </select>

        {hasFilters && (
          <button
            onClick={reset}
            style={{ ...INPUT, cursor: 'pointer', color: 'rgba(232,212,184,0.65)', borderColor: 'rgba(232,212,184,0.2)' }}
          >
            Clear ✕
          </button>
        )}
      </div>

      {/* Selected filter chips */}
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
            const owner = allOwners.find(o => o.userId === uid)
            return (
              <button key={uid} onClick={() => toggleOwner(uid)} style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '999px', border: '1px solid rgba(201,169,97,0.5)', background: 'rgba(201,169,97,0.12)', color: '#C9A961', cursor: 'pointer' }}>
                {owner?.name ?? uid} ✕
              </button>
            )
          })}
        </div>
      )}

      {/* Result count + mobile Top Charts button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '0.8125rem', color: 'rgba(232,212,184,0.55)' }}>
          {filtered.length} game{filtered.length !== 1 ? 's' : ''}
          {hasFilters && ` of ${games.length} total`}
        </p>
        {sidebar && (
          <button
            className="lg:hidden"
            onClick={() => setShowMobileStats(true)}
            style={{ ...INPUT, cursor: 'pointer', fontSize: '0.8125rem', padding: '0.3rem 0.75rem' }}
          >
            {'Top Charts \u2197\uFE0E'}
          </button>
        )}
      </div>

      {/* Cards + sidebar row */}
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
                />
              ))}
            </div>
          )}

          {/* Load more */}
          {remaining > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
              <button
                onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                style={{ ...INPUT, cursor: 'pointer', padding: '0.6rem 2rem', borderColor: 'rgba(201,169,97,0.5)', fontSize: '0.9375rem' }}
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
