'use client'

import { useState } from 'react'
import Image from 'next/image'
import styles from './TablePlanner.module.css'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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
  placement: number | null
  score: number | null
  order: number
  user: AttendeeUser | null
}

interface TableData {
  id: string
  label: string | null
  seats: number
  unranked: boolean
  game: GameOption | null
  players: TablePlayerData[]
}

interface RoundData {
  id: string
  number: number
  label: string | null
  order: number
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

const MEDALS = [
  { value: 1, emoji: '🥇' },
  { value: 2, emoji: '🥈' },
  { value: 3, emoji: '🥉' },
]

// ─── Sortable Player Row ──────────────────────────────────────────────────────

function SortablePlayerRow({
  player,
  canManage,
  onToggleGM,
  onTogglePlacement,
  onScoreChange,
  onScoreBlur,
  scoreValue,
  onRemove,
}: {
  player: TablePlayerData
  canManage: boolean
  onToggleGM: () => void
  onTogglePlacement: (medal: number) => void
  onScoreChange: (val: string) => void
  onScoreBlur: () => void
  scoreValue: string
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: player.id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <li ref={setNodeRef} style={style} className={styles.playerItem}>
      {canManage && (
        <span className={styles.dragHandle} {...attributes} {...listeners} title="Drag to reorder">
          ⠿
        </span>
      )}
      <div className={styles.playerNameRow}>
        {canManage && (
          <button
            className={player.isGM ? styles.gmBtnActive : styles.gmBtn}
            onClick={onToggleGM}
            title={player.isGM ? 'Unset GM' : 'Set as GM'}
          >
            {player.isGM ? '★' : '☆'}
          </button>
        )}
        {!canManage && player.isGM && <span className={styles.gmStarReadonly}>★</span>}
        <span className={styles.playerName}>
          {player.user ? displayName(player.user) : player.playerName}
          {player.isGM && <span className={styles.gmBadge}> GM</span>}
          {!player.userId && <span className={styles.guestBadge}> (guest)</span>}
        </span>
      </div>
      <div className={styles.playerControls}>
        {canManage ? (
          <input
            type="number"
            className={styles.scoreInput}
            value={scoreValue}
            onChange={(e) => onScoreChange(e.target.value)}
            onBlur={onScoreBlur}
            placeholder="–"
            min={0}
          />
        ) : (
          player.score != null && <span className={styles.scoreDisplay}>{player.score}</span>
        )}
        {canManage
          ? MEDALS.map(({ value, emoji }) => (
              <button
                key={value}
                className={player.placement === value ? styles.medalBtnActive : styles.medalBtn}
                onClick={() => onTogglePlacement(value)}
                title={
                  player.placement === value
                    ? `Remove ${emoji} placement`
                    : `Mark as ${emoji}`
                }
              >
                {emoji}
              </button>
            ))
          : player.placement != null && (
              <span className={styles.winnerCrownReadonly}>
                {MEDALS.find((m) => m.value === player.placement)?.emoji}
              </span>
            )}
      </div>
      {canManage && (
        <button className={styles.removeBtn} onClick={onRemove} title="Remove">✕</button>
      )}
    </li>
  )
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
  const [unranked, setUnranked] = useState(initial?.unranked ?? false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!initial

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const body = { label: label || null, gameId: gameId || null, seats: Number(seats), unranked }
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
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={unranked}
              onChange={(e) => setUnranked(e.target.checked)}
            />
            Unranked — plays count, placements don&apos;t affect MMR
          </label>
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
  dragHandleProps,
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
  dragHandleProps?: React.HTMLAttributes<Element>
}) {
  const [modal, setModal] = useState<'edit' | 'addPlayer' | null>(null)
  const [players, setPlayers] = useState<TablePlayerData[]>(table.players)
  const [scoreMap, setScoreMap] = useState<Record<string, string>>(() =>
    Object.fromEntries(table.players.map((p) => [p.id, p.score != null ? String(p.score) : '']))
  )

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  // Sync players when table prop changes (e.g. player added from modal)
  const tableWithPlayers = { ...table, players }

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
      const updated = players.filter((p) => p.id !== playerId)
      setPlayers(updated)
      onUpdate({ ...tableWithPlayers, players: updated })
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
      const updatedPlayer: TablePlayerData = await res.json()
      const newPlayers = !currentIsGM
        ? players.map((p) => p.id === playerId ? updatedPlayer : { ...p, isGM: false })
        : players.map((p) => p.id === playerId ? updatedPlayer : p)
      setPlayers(newPlayers)
      onUpdate({ ...tableWithPlayers, players: newPlayers })
    }
  }

  async function handleTogglePlacement(playerId: string, currentPlacement: number | null, medal: number) {
    // Toggle: same medal clicked → clear; different → set
    const newPlacement = currentPlacement === medal ? null : medal
    const res = await fetch(
      `/api/events/${eventId}/rounds/${roundId}/tables/${table.id}/players`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, placement: newPlacement }),
      }
    )
    if (res.ok) {
      const updatedPlayer: TablePlayerData = await res.json()
      const newPlayers = players.map((p) => p.id === playerId ? updatedPlayer : p)
      setPlayers(newPlayers)
      onUpdate({ ...tableWithPlayers, players: newPlayers })
    } else {
      const err = await res.json().catch(() => ({}))
      console.error('Failed to toggle placement:', res.status, err)
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
      const updatedPlayer: TablePlayerData = await res.json()
      const newPlayers = players.map((p) => p.id === playerId ? updatedPlayer : p)
      setPlayers(newPlayers)
      onUpdate({ ...tableWithPlayers, players: newPlayers })
    }
  }

  async function handlePlayerDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = players.findIndex((p) => p.id === active.id)
    const newIndex = players.findIndex((p) => p.id === over.id)
    const reordered = arrayMove(players, oldIndex, newIndex)
    setPlayers(reordered)
    onUpdate({ ...tableWithPlayers, players: reordered })

    await fetch(
      `/api/events/${eventId}/rounds/${roundId}/tables/${table.id}/players`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerIds: reordered.map((p) => p.id) }),
      }
    )
  }

  return (
    <>
      <div className={styles.tableCard}>
        {/* Header */}
        <div className={styles.cardHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {canManage && dragHandleProps && (
              <span className={styles.dragHandle} {...dragHandleProps} title="Drag to reorder table">
                ⠿
              </span>
            )}
            <span className={styles.tableLabel}>
              {table.label || `Table ${tableIndex + 1}`}
            </span>
            {table.unranked && (
              <span className={styles.unrankedBadge}>Unranked</span>
            )}
          </div>
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
          <p className={styles.playerCount}>Players {players.length}/{table.seats}</p>
          {players.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handlePlayerDragEnd}
            >
              <SortableContext items={players.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <ul className={styles.playerList}>
                  {players.map((p) => (
                    <SortablePlayerRow
                      key={p.id}
                      player={p}
                      canManage={canManage}
                      onToggleGM={() => handleToggleGM(p.id, p.isGM)}
                      onTogglePlacement={(medal) => handleTogglePlacement(p.id, p.placement, medal)}
                      onScoreChange={(val) => setScoreMap((prev) => ({ ...prev, [p.id]: val }))}
                      onScoreBlur={() => handleScoreBlur(p.id, p.score)}
                      scoreValue={scoreMap[p.id] ?? ''}
                      onRemove={() => handleRemovePlayer(p.id)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
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
          table={tableWithPlayers}
          attendees={attendees}
          allMembers={allMembers}
          onClose={() => setModal(null)}
          onAdd={(player, updatedTable) => {
            const newPlayers = updatedTable.players
            setPlayers(newPlayers)
            setScoreMap((prev) => ({ ...prev, [player.id]: '' }))
            onUpdate(updatedTable)
          }}
        />
      )}
    </>
  )
}

// ─── Sortable Table Card ──────────────────────────────────────────────────────

function SortableTableCard(props: {
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.table.id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <TableCard
        {...props}
        dragHandleProps={props.canManage ? { ...attributes, ...listeners } : undefined}
      />
    </div>
  )
}

// ─── Sortable Round Section ───────────────────────────────────────────────────

function SortableRoundSection({
  round,
  roundIndex,
  eventId,
  canManage,
  attendees,
  allMembers,
  games,
  savedLabels,
  onEdit,
  onDelete,
  updateTable,
  addTable,
  deleteTable,
  reorderTables,
}: {
  round: RoundData
  roundIndex: number
  eventId: string
  canManage: boolean
  attendees: AttendeeUser[]
  allMembers: AttendeeUser[]
  games: GameOption[]
  savedLabels: string[]
  onEdit: () => void
  onDelete: () => void
  updateTable: (t: TableData) => void
  addTable: (t: TableData) => void
  deleteTable: (id: string) => void
  reorderTables: (tables: TableData[]) => void
}) {
  const [showTableModal, setShowTableModal] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: round.id,
  })
  const tableSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  async function handleTableDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = round.tables.findIndex((t) => t.id === active.id)
    const newIndex = round.tables.findIndex((t) => t.id === over.id)
    const reordered = arrayMove(round.tables, oldIndex, newIndex)
    reorderTables(reordered)

    await fetch(`/api/events/${eventId}/rounds/${round.id}/tables`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableIds: reordered.map((t) => t.id) }),
    })
  }

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const roundLabel = round.label || `Round ${roundIndex + 1}`

  return (
    <div ref={setNodeRef} style={style} className={styles.roundSection}>
      <div className={styles.roundHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {canManage && (
            <span className={styles.dragHandle} {...attributes} {...listeners} title="Drag to reorder round">
              ⠿
            </span>
          )}
          <span className={styles.roundTitle}>{roundLabel}</span>
        </div>
        {canManage && (
          <div className={styles.headerActions}>
            <button className={styles.iconBtn} onClick={onEdit}>Edit</button>
            <button className={styles.iconBtnDanger} onClick={onDelete}>Delete</button>
          </div>
        )}
      </div>

      {canManage && (
        <button className={styles.addTableBtn} onClick={() => setShowTableModal(true)}>
          + Add Table
        </button>
      )}

      {round.tables.length === 0 && (
        <p style={{ color: 'rgba(232,212,184,0.4)', fontStyle: 'italic', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
          No tables in this round yet.
        </p>
      )}

      <DndContext
        sensors={tableSensors}
        collisionDetection={closestCenter}
        onDragEnd={handleTableDragEnd}
      >
        <SortableContext items={round.tables.map((t) => t.id)} strategy={rectSortingStrategy}>
          <div className={styles.grid}>
            {round.tables.map((table, idx) => (
              <SortableTableCard
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
                onUpdate={updateTable}
                onDelete={deleteTable}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {showTableModal && (
        <TableFormModal
          eventId={eventId}
          roundId={round.id}
          games={games}
          savedLabels={savedLabels}
          onClose={() => setShowTableModal(false)}
          onSave={(table) => { addTable(table); setShowTableModal(false) }}
        />
      )}
    </div>
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

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

  async function handleRoundDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = rounds.findIndex((r) => r.id === active.id)
    const newIndex = rounds.findIndex((r) => r.id === over.id)
    const reordered = arrayMove(rounds, oldIndex, newIndex)
    setRounds(reordered)

    await fetch(`/api/events/${eventId}/rounds`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roundIds: reordered.map((r) => r.id) }),
    })
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

  function reorderTablesInRound(roundId: string, tables: TableData[]) {
    setRounds((prev) =>
      prev.map((r) => (r.id === roundId ? { ...r, tables } : r))
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleRoundDragEnd}
      >
        <SortableContext items={rounds.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          {rounds.map((round, index) => (
            <SortableRoundSection
              key={round.id}
              round={round}
              roundIndex={index}
              eventId={eventId}
              canManage={canManage}
              attendees={attendees}
              allMembers={allMembers}
              games={games}
              savedLabels={savedLabels}
              onEdit={() => setModal({ type: 'editRound', round })}
              onDelete={() => handleDeleteRound(round.id)}
              updateTable={(t) => updateTableInRound(round.id, t)}
              addTable={(t) => addTableToRound(round.id, t)}
              deleteTable={(id) => deleteTableFromRound(round.id, id)}
              reorderTables={(tables) => reorderTablesInRound(round.id, tables)}
            />
          ))}
        </SortableContext>
      </DndContext>

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
    </div>
  )
}
