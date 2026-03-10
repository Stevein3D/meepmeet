'use client'

import { useState } from 'react'
import Image from 'next/image'
import styles from './TablePlanner.module.css'

// ─── Types ───────────────────────────────────────────────────────────────────

interface GameOption {
  id: string
  name: string
  image: string | null
  minPlayers: number
  maxPlayers: number
}

interface AttendeeUser {
  id: string
  name: string
  alias: string | null
  avatar: string | null
}

interface TablePlayerData {
  id: string
  userId: string | null
  playerName: string | null
  isGM: boolean
  isWinner: boolean
  score: number | null
  user: AttendeeUser | null
}

interface TableData {
  id: string
  label: string | null
  seats: number
  game: GameOption | null
  players: TablePlayerData[]
}

interface RoundData {
  id: string
  number: number
  label: string | null
  tables: TableData[]
}

interface TablePlannerProps {
  eventId: string
  initialRounds: RoundData[]
  canManage: boolean
  attendees: AttendeeUser[]
  allMembers: AttendeeUser[]
  games: GameOption[]
  savedLabels: string[]
}

type ModalState =
  | null
  | { type: 'createRound' }
  | { type: 'editRound'; round: RoundData }
  | { type: 'createTable'; roundId: string }
  | { type: 'editTable'; roundId: string; table: TableData }
  | { type: 'addPlayer'; roundId: string; tableId: string; table: TableData }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function displayName(user: AttendeeUser) {
  return user.alias || user.name
}

function roundTitle(round: RoundData) {
  return round.label || `Round ${round.number}`
}

// ─── Round Form Modal ─────────────────────────────────────────────────────────

function RoundFormModal({
  eventId,
  initial,
  onClose,
  onSave,
}: {
  eventId: string
  initial?: RoundData
  onClose: () => void
  onSave: (round: RoundData) => void
}) {
  const [label, setLabel] = useState(initial?.label ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!initial

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const body = { label: label || null }
    const url = isEdit
      ? `/api/events/${eventId}/rounds/${initial!.id}`
      : `/api/events/${eventId}/rounds`

    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      const data = await res.json()
      onSave(isEdit ? { ...initial!, ...data } : data)
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to save round')
    }
    setSaving(false)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <p className={styles.modalTitle}>{isEdit ? 'Edit Round' : 'Add Round'}</p>
        {error && <p className={styles.errorText}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Label (optional)</label>
            <input
              className={styles.input}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={`e.g. Morning Session`}
              autoFocus
            />
          </div>
          <div className={styles.modalActions}>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save' : 'Add Round'}
            </button>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Table Form Modal ─────────────────────────────────────────────────────────

function TableFormModal({
  eventId,
  roundId,
  games,
  savedLabels,
  initial,
  onClose,
  onSave,
}: {
  eventId: string
  roundId: string
  games: GameOption[]
  savedLabels: string[]
  initial?: TableData
  onClose: () => void
  onSave: (table: TableData) => void
}) {
  const [label, setLabel] = useState(initial?.label ?? '')
  const [gameId, setGameId] = useState(initial?.game?.id ?? '')
  const [seats, setSeats] = useState(String(initial?.seats ?? 4))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!initial

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const body = { label: label || null, gameId: gameId || null, seats: Number(seats) }
    const url = isEdit
      ? `/api/events/${eventId}/rounds/${roundId}/tables/${initial!.id}`
      : `/api/events/${eventId}/rounds/${roundId}/tables`

    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      onSave(await res.json())
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to save table')
    }
    setSaving(false)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <p className={styles.modalTitle}>{isEdit ? 'Edit Table' : 'Add Table'}</p>
        {error && <p className={styles.errorText}>{error}</p>}

        {/* datalist for label autocomplete */}
        <datalist id="table-label-suggestions">
          {savedLabels.map((l) => <option key={l} value={l} />)}
        </datalist>

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Label (optional)</label>
            <input
              className={styles.input}
              list="table-label-suggestions"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Main Table"
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Game (optional)</label>
            <select className={styles.select} value={gameId} onChange={(e) => setGameId(e.target.value)}>
              <option value="">— No game selected —</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Seats *</label>
            <input
              className={styles.input}
              type="number"
              min={1}
              required
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
            />
          </div>
          <div className={styles.modalActions}>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Table'}
            </button>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Add Player Modal ─────────────────────────────────────────────────────────

function AddPlayerModal({
  eventId,
  roundId,
  table,
  attendees,
  allMembers,
  onClose,
  onAdd,
}: {
  eventId: string
  roundId: string
  table: TableData
  attendees: AttendeeUser[]
  allMembers: AttendeeUser[]
  onClose: () => void
  onAdd: (player: TablePlayerData, updatedTable: TableData) => void
}) {
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)

  const alreadyIds = new Set(table.players.map((p) => p.userId).filter(Boolean))
  const attendingIds = new Set(attendees.map((a) => a.id))

  function matchesQuery(a: AttendeeUser) {
    if (alreadyIds.has(a.id)) return false
    const q = query.toLowerCase()
    return a.name.toLowerCase().includes(q) || (a.alias?.toLowerCase().includes(q) ?? false)
  }

  const attending = allMembers.filter((a) => attendingIds.has(a.id) && matchesQuery(a))
  const others = allMembers.filter((a) => !attendingIds.has(a.id) && matchesQuery(a))

  async function addPlayer(body: { userId?: string; playerName?: string }) {
    setSaving(true)
    const res = await fetch(
      `/api/events/${eventId}/rounds/${roundId}/tables/${table.id}/players`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )
    if (res.ok) {
      const player: TablePlayerData = await res.json()
      const updatedTable = { ...table, players: [...table.players, player] }
      onAdd(player, updatedTable)
    }
    setSaving(false)
  }

  function renderMember(a: AttendeeUser) {
    return (
      <li
        key={a.id}
        className={styles.pickerItem}
        onClick={() => !saving && addPlayer({ userId: a.id })}
      >
        {a.avatar ? (
          <Image src={a.avatar} alt={a.name} width={28} height={28} className={styles.avatar} unoptimized />
        ) : (
          <span className={styles.initials}>{getInitials(a.name)}</span>
        )}
        {displayName(a)}
      </li>
    )
  }

  const hasNoResults = attending.length === 0 && others.length === 0

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <p className={styles.modalTitle}>Add Player</p>
        <input
          className={styles.input}
          placeholder="Search members or type a name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          style={{ marginBottom: '0.5rem' }}
        />
        <ul className={styles.pickerList}>
          {hasNoResults && query === '' && (
            <li className={styles.emptyPicker}>No members to add</li>
          )}
          {hasNoResults && query !== '' && !query && null}

          {attending.length > 0 && (
            <>
              <li className={styles.pickerGroupHeader}>Attending</li>
              {attending.map(renderMember)}
            </>
          )}

          {others.length > 0 && (
            <>
              <li className={styles.pickerGroupHeader}>Other Members</li>
              {others.map(renderMember)}
            </>
          )}

          {query && (
            <li
              className={styles.pickerGuestItem}
              onClick={() => !saving && addPlayer({ playerName: query })}
            >
              + Add &ldquo;{query}&rdquo; as guest
            </li>
          )}
        </ul>
        <div className={styles.modalActions}>
          <button className={styles.btnSecondary} onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}

// ─── Table Card ───────────────────────────────────────────────────────────────

function TableCard({
  eventId,
  roundId,
  table,
  tableIndex,
  canManage,
  attendees,
  allMembers,
  games,
  savedLabels,
  onUpdate,
  onDelete,
}: {
  eventId: string
  roundId: string
  table: TableData
  tableIndex: number
  canManage: boolean
  attendees: AttendeeUser[]
  allMembers: AttendeeUser[]
  games: GameOption[]
  savedLabels: string[]
  onUpdate: (updated: TableData) => void
  onDelete: (tableId: string) => void
}) {
  const [modal, setModal] = useState<'edit' | 'addPlayer' | null>(null)
  const [scoreMap, setScoreMap] = useState<Record<string, string>>(() =>
    Object.fromEntries(table.players.map((p) => [p.id, p.score != null ? String(p.score) : '']))
  )

  async function handleDeleteTable() {
    const res = await fetch(`/api/events/${eventId}/rounds/${roundId}/tables/${table.id}`, {
      method: 'DELETE',
    })
    if (res.ok) onDelete(table.id)
  }

  async function handleRemovePlayer(playerId: string) {
    const res = await fetch(
      `/api/events/${eventId}/rounds/${roundId}/tables/${table.id}/players`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      }
    )
    if (res.ok) {
      onUpdate({ ...table, players: table.players.filter((p) => p.id !== playerId) })
    }
  }

  async function handleToggleGM(playerId: string, currentIsGM: boolean) {
    const res = await fetch(
      `/api/events/${eventId}/rounds/${roundId}/tables/${table.id}/players`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, isGM: !currentIsGM }),
      }
    )
    if (res.ok) {
      const updated: TablePlayerData = await res.json()
      const newPlayers = !currentIsGM
        ? table.players.map((p) => p.id === playerId ? updated : { ...p, isGM: false })
        : table.players.map((p) => p.id === playerId ? updated : p)
      onUpdate({ ...table, players: newPlayers })
    }
  }

  async function handleToggleWinner(playerId: string, currentIsWinner: boolean) {
    const res = await fetch(
      `/api/events/${eventId}/rounds/${roundId}/tables/${table.id}/players`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, isWinner: !currentIsWinner }),
      }
    )
    if (res.ok) {
      const updated: TablePlayerData = await res.json()
      const newPlayers = !currentIsWinner
        ? table.players.map((p) => p.id === playerId ? updated : { ...p, isWinner: false })
        : table.players.map((p) => p.id === playerId ? updated : p)
      onUpdate({ ...table, players: newPlayers })
    } else {
      const err = await res.json().catch(() => ({}))
      console.error('Failed to toggle winner:', res.status, err)
    }
  }

  async function handleScoreBlur(playerId: string, currentScore: number | null) {
    const raw = scoreMap[playerId] ?? ''
    const newScore = raw === '' ? null : Number(raw)
    if (typeof newScore === 'number' && isNaN(newScore)) return
    if (newScore === currentScore) return
    const res = await fetch(
      `/api/events/${eventId}/rounds/${roundId}/tables/${table.id}/players`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, score: newScore }),
      }
    )
    if (res.ok) {
      const updated: TablePlayerData = await res.json()
      onUpdate({ ...table, players: table.players.map((p) => p.id === playerId ? updated : p) })
    }
  }

  return (
    <>
      <div className={styles.tableCard}>
        {/* Header */}
        <div className={styles.cardHeader}>
          <span className={styles.tableLabel}>
            {table.label || `Table ${tableIndex + 1}`}
          </span>
          {canManage && (
            <div className={styles.headerActions}>
              <button className={styles.iconBtn} onClick={() => setModal('edit')}>Edit</button>
              <button className={styles.iconBtnDanger} onClick={handleDeleteTable}>Delete</button>
            </div>
          )}
        </div>

        {/* Game */}
        {table.game ? (
          <div className={styles.gameInfo}>
            {table.game.image && (
              <Image src={table.game.image} alt={table.game.name} width={36} height={36} className={styles.gameThumb} unoptimized />
            )}
            <div>
              <p className={styles.gameName}>{table.game.name}</p>
              <p className={styles.gameMeta}>{table.game.minPlayers}–{table.game.maxPlayers} players</p>
            </div>
          </div>
        ) : (
          <p className={styles.noGame}>No game selected</p>
        )}

        {/* Players */}
        <div className={styles.playerSection}>
          <p className={styles.playerCount}>Players {table.players.length}/{table.seats}</p>
          {table.players.length > 0 && (
            <ul className={styles.playerList}>
              {table.players.map((p) => (
                <li key={p.id} className={styles.playerItem}>
                  <div className={styles.playerNameRow}>
                    {canManage && (
                      <button
                        className={p.isGM ? styles.gmBtnActive : styles.gmBtn}
                        onClick={() => handleToggleGM(p.id, p.isGM)}
                        title={p.isGM ? 'Unset GM' : 'Set as GM'}
                      >
                        {p.isGM ? '★' : '☆'}
                      </button>
                    )}
                    {!canManage && p.isGM && <span className={styles.gmStarReadonly}>★</span>}
                    <span className={styles.playerName}>
                      {p.user ? displayName(p.user) : p.playerName}
                      {p.isGM && <span className={styles.gmBadge}> GM</span>}
                      {!p.userId && <span className={styles.guestBadge}> (guest)</span>}
                    </span>
                  </div>
                  <div className={styles.playerControls}>
                    {canManage ? (
                      <input
                        type="number"
                        className={styles.scoreInput}
                        value={scoreMap[p.id] ?? ''}
                        onChange={(e) => setScoreMap((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        onBlur={() => handleScoreBlur(p.id, p.score)}
                        placeholder="–"
                        min={0}
                      />
                    ) : (
                      p.score != null && <span className={styles.scoreDisplay}>{p.score}</span>
                    )}
                    {canManage ? (
                      <button
                        className={p.isWinner ? styles.winnerBtnActive : styles.winnerBtn}
                        onClick={() => handleToggleWinner(p.id, p.isWinner)}
                        title={p.isWinner ? 'Unset winner' : 'Mark as winner'}
                      >
                        👑
                      </button>
                    ) : (
                      p.isWinner && <span className={styles.winnerCrownReadonly}>👑</span>
                    )}
                  </div>
                  {canManage && (
                    <button className={styles.removeBtn} onClick={() => handleRemovePlayer(p.id)} title="Remove">✕</button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {canManage && (
            <button className={styles.addPlayerBtn} onClick={() => setModal('addPlayer')}>
              + Add Player
            </button>
          )}
        </div>
      </div>

      {modal === 'edit' && (
        <TableFormModal
          eventId={eventId}
          roundId={roundId}
          games={games}
          savedLabels={savedLabels}
          initial={table}
          onClose={() => setModal(null)}
          onSave={(updated) => { onUpdate(updated); setModal(null) }}
        />
      )}

      {modal === 'addPlayer' && (
        <AddPlayerModal
          eventId={eventId}
          roundId={roundId}
          table={table}
          attendees={attendees}
          allMembers={allMembers}
          onClose={() => setModal(null)}
          onAdd={(player, updatedTable) => {
            setScoreMap((prev) => ({ ...prev, [player.id]: '' }))
            onUpdate(updatedTable)
          }}
        />
      )}
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TablePlanner({
  eventId,
  initialRounds,
  canManage,
  attendees,
  allMembers,
  games,
  savedLabels,
}: TablePlannerProps) {
  const [rounds, setRounds] = useState<RoundData[]>(initialRounds)
  const [modal, setModal] = useState<ModalState>(null)

  // ── Round helpers ──
  function handleRoundSaved(updated: RoundData) {
    setRounds((prev) => {
      const idx = prev.findIndex((r) => r.id === updated.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], ...updated }
        return next
      }
      return [...prev, updated]
    })
    setModal(null)
  }

  async function handleDeleteRound(roundId: string) {
    const res = await fetch(`/api/events/${eventId}/rounds/${roundId}`, { method: 'DELETE' })
    if (res.ok) setRounds((prev) => prev.filter((r) => r.id !== roundId))
  }

  // ── Table helpers ──
  function updateTableInRound(roundId: string, updated: TableData) {
    setRounds((prev) =>
      prev.map((r) =>
        r.id !== roundId
          ? r
          : { ...r, tables: r.tables.map((t) => (t.id === updated.id ? updated : t)) }
      )
    )
  }

  function addTableToRound(roundId: string, table: TableData) {
    setRounds((prev) =>
      prev.map((r) => (r.id === roundId ? { ...r, tables: [...r.tables, table] } : r))
    )
  }

  function deleteTableFromRound(roundId: string, tableId: string) {
    setRounds((prev) =>
      prev.map((r) =>
        r.id === roundId ? { ...r, tables: r.tables.filter((t) => t.id !== tableId) } : r
      )
    )
  }

  return (
    <div>
      {canManage && (
        <button className={styles.addRoundBtn} onClick={() => setModal({ type: 'createRound' })}>
          + Add Round
        </button>
      )}

      {rounds.length === 0 && (
        <p style={{ color: 'rgba(232,212,184,0.5)', fontStyle: 'italic' }}>
          No rounds yet.{canManage ? ' Add one above.' : ''}
        </p>
      )}

      {rounds.map((round) => (
        <div key={round.id} className={styles.roundSection}>
          {/* Round header */}
          <div className={styles.roundHeader}>
            <span className={styles.roundTitle}>{roundTitle(round)}</span>
            {canManage && (
              <div className={styles.headerActions}>
                <button
                  className={styles.iconBtn}
                  onClick={() => setModal({ type: 'editRound', round })}
                >
                  Edit
                </button>
                <button
                  className={styles.iconBtnDanger}
                  onClick={() => handleDeleteRound(round.id)}
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Tables */}
          {canManage && (
            <button
              className={styles.addTableBtn}
              onClick={() => setModal({ type: 'createTable', roundId: round.id })}
            >
              + Add Table
            </button>
          )}

          {round.tables.length === 0 && (
            <p style={{ color: 'rgba(232,212,184,0.4)', fontStyle: 'italic', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              No tables in this round yet.
            </p>
          )}

          <div className={styles.grid}>
            {round.tables.map((table, idx) => (
              <TableCard
                key={table.id}
                eventId={eventId}
                roundId={round.id}
                table={table}
                tableIndex={idx}
                canManage={canManage}
                attendees={attendees}
                allMembers={allMembers}
                games={games}
                savedLabels={savedLabels}
                onUpdate={(updated) => updateTableInRound(round.id, updated)}
                onDelete={(tableId) => deleteTableFromRound(round.id, tableId)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Global modals */}
      {modal?.type === 'createRound' && (
        <RoundFormModal
          eventId={eventId}
          onClose={() => setModal(null)}
          onSave={handleRoundSaved}
        />
      )}

      {modal?.type === 'editRound' && (
        <RoundFormModal
          eventId={eventId}
          initial={modal.round}
          onClose={() => setModal(null)}
          onSave={handleRoundSaved}
        />
      )}

      {modal?.type === 'createTable' && (
        <TableFormModal
          eventId={eventId}
          roundId={modal.roundId}
          games={games}
          savedLabels={savedLabels}
          onClose={() => setModal(null)}
          onSave={(table) => { addTableToRound(modal.roundId, table); setModal(null) }}
        />
      )}
    </div>
  )
}
