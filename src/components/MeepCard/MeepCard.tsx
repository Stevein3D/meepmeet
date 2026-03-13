import Image from 'next/image'
import Link from 'next/link'
import styles from './MeepCard.module.css'

interface PlayerStats {
  played: number
  gold: number
  silver: number
  bronze: number
  teaches: number
  mmr: number
  rankedPlayed: number
}

interface MeepCardProps {
  user: {
    id: string
    name: string
    alias: string | null
    tagline: string | null
    avatar: string | null
    role: 'VISITOR' | 'MEMBER' | 'GAME_MASTER'
    createdAt: Date
    _count: {
      ownedGames: number
      hostedEvents: number
      eventRsvps: number
    }
  }
  playerStats?: PlayerStats
  canEdit?: boolean
}

const roleLabel: Record<string, string> = {
  VISITOR: 'Visitor',
  MEMBER: 'Member',
  GAME_MASTER: 'Game Master',
}

const roleColors: Record<string, string> = {
  VISITOR: '#8B6F47',
  MEMBER: '#4a7c59',
  GAME_MASTER: '#7a3b3b',
}

export default function MeepCard({ user, playerStats, canEdit = false }: MeepCardProps) {
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const stats = playerStats ?? { played: 0, gold: 0, silver: 0, bronze: 0, teaches: 0, mmr: 0, rankedPlayed: 0 }

  return (
    <div
      className="flex flex-col overflow-hidden shadow-xl"
      style={{
        position: 'relative',
        border: '4px solid #8B6F47',
        borderRadius: '8px',
        backgroundImage: 'url(/wood-bg.jpg)',
        backgroundSize: '100%',
        backgroundRepeat: 'repeat-y',
        backgroundPosition: 'center',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,169,97,0.3)',
      }}
    >
      {/* Overlay — replaces backgroundBlendMode for consistent iOS rendering */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(28, 16, 8, 0.6)', pointerEvents: 'none', zIndex: 0 }} />
      <div className="p-4 flex flex-col items-center text-center gap-3" style={{ position: 'relative', zIndex: 1 }}>
        {/* Avatar */}
        <Link href={`/meeps/${user.id}`} style={{ textDecoration: 'none' }}>
        <div
          className="relative w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold flex-shrink-0"
          style={{
            border: '3px solid #C9A961',
            background: 'linear-gradient(135deg, #3a2010, #5c3a1e)',
            color: '#F5E6D3',
          }}
        >
          {user.avatar ? (
            <Image src={user.avatar} alt={user.name} fill className="object-cover" unoptimized />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        </Link>

        {/* Name — links to profile page */}
        
        <h2
          className="text-xl font-bold leading-tight relative hover:opacity-80 transition-opacity"
          style={{ color: '#F5E6D3', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
        >
          {user.alias ? <span className={styles.displayAlias}>{user.alias}</span> : <span>{user.name}</span>}
          <span className={styles.displayName}>{user.name}</span>
        </h2>

        {/* Role badge */}
        <span
          className="text-xs font-semibold px-3 py-1 rounded-full"
          style={{
            background: roleColors[user.role] + '33',
            border: `1px solid ${roleColors[user.role]}`,
            color: '#E8D4B8',
          }}
        >
          {roleLabel[user.role]}
        </span>

        {/* Tagline */}
        {user.tagline && (
          <p
            className="text-xs text-center leading-snug"
            style={{ color: 'rgba(232,212,184,0.85)', fontStyle: 'italic' }}
          >
            {user.tagline}
          </p>
        )}

        {/* Stats — Row 1: library & event counts */}
        <div
          className="w-full grid grid-cols-3 gap-2 mt-1 pt-3 text-sm"
          style={{ borderTop: '1px solid rgba(201,169,97,0.3)', color: '#E8D4B8' }}
        >
          
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg" style={{ color: '#C9A961' }}>
              {stats.gold}
            </span>
            <span className="text-xs opacity-70">🥇 Wins</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg" style={{ color: '#C9A961' }}>
              {stats.teaches}
            </span>
            <span className="text-xs opacity-70">Teaches</span>
          </div>
          {/* <div className="flex flex-col items-center">
            <span className="font-bold text-lg" style={{ color: '#C9A961' }}>
              {user._count.hostedEvents}
            </span>
            <span className="text-xs opacity-70">Hosted</span>
          </div> */}
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg" style={{ color: '#C9A961' }}>
              {user._count.eventRsvps}
            </span>
            <span className="text-xs opacity-70">Events</span>
          </div>
        </div>

        {/* Stats — Row 2: performance */}
        <div
          className="w-full grid grid-cols-3 gap-2 pt-2 text-sm"
          style={{ borderTop: '1px solid rgba(201,169,97,0.15)', color: '#E8D4B8' }}
        >
         <div className="flex flex-col items-center">
            <span className="font-bold text-lg" style={{ color: '#C9A961' }}>
              {user._count.ownedGames}
            </span>
            <span className="text-xs opacity-70">Games</span>
          </div> 
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg" style={{ color: '#C9A961' }}>
              {stats.played}
            </span>
            <span className="text-xs opacity-70">Played</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg" style={{ color: '#C9A961' }}>
              {stats.rankedPlayed < 4 ? '...' : stats.mmr.toFixed(1)}
            </span>
            <span className="text-xs opacity-70">MMR</span>
          </div>
        </div>

        <div className="mt-3 flex gap-2 w-full">
          <Link
            href={`/meeps/${user.id}`}
            className="flex-1 text-center py-2 rounded text-sm font-medium transition-all"
            style={{
              border: '2px solid #C9A961',
              color: '#C9A961',
              background: 'rgba(201,169,97,0.1)',
            }}
          >
            View
          </Link>
          {canEdit && (
            <Link
              href={`/meeps/${user.id}/edit`}
              className="flex-1 text-center py-2 rounded text-sm font-medium transition-all"
              style={{
                border: '2px solid rgba(201,169,97,0.5)',
                color: 'rgba(201,169,97,0.8)',
                background: 'rgba(201,169,97,0.06)',
              }}
            >
              Edit
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
