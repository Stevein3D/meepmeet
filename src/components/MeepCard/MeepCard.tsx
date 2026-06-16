import Link from 'next/link'
import AvatarViewer from '../AvatarViewer'
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
    role: 'VISITOR' | 'MEEP' | 'SAGE' | 'GAME_MASTER'
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
  MEEP: 'Meep',
  SAGE: 'Sage',
  GAME_MASTER: 'Game Master',
}

const roleColors: Record<string, string> = {
  VISITOR: '#8B6F47',
  MEEP: '#4a7c59',
  SAGE: '#6d5a9c',
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
      className="h-full flex flex-col overflow-hidden shadow-xl"
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
      <div className="p-4 flex-1 flex flex-col gap-3" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header — horizontal on mobile (like the meep view page), stacked + centered on sm+ */}
        <div className="flex items-center gap-3 sm:flex-col sm:gap-3">
          {/* Avatar — enlarges to a lightbox on hover/tap when a photo exists */}
          <AvatarViewer
            src={user.avatar}
            alt={user.alias ?? user.name}
            initials={initials}
            circleClassName="w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl"
          />

          {/* Name + badge + tagline */}
          <div className="flex-1 min-w-0 flex flex-col items-start gap-1.5 text-left sm:items-center sm:text-center sm:gap-3">
            <h2
              className="text-lg sm:text-xl font-bold leading-tight relative hover:opacity-80 transition-opacity"
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
                className="text-xs leading-snug"
                style={{ color: 'rgba(232,212,184,0.85)', fontStyle: 'italic' }}
              >
                {user.tagline}
              </p>
            )}
          </div>

          {/* Mobile actions — top right of the header, like the meep view page */}
          <div className="flex flex-col gap-1.5 flex-shrink-0 self-start sm:hidden">
            <Link href={`/meeps/${user.id}`} className="text-center btn btn-sm btn-ghost">
              View
            </Link>
            {canEdit && (
              <Link href={`/meeps/${user.id}/edit`} className="text-center btn btn-sm btn-secondary">
                Edit
              </Link>
            )}
          </div>
        </div>

        {/* Stats — Row 1: library & event counts. mt-auto pins stats + buttons to the
            card bottom so they align across tiles even when the tagline is missing */}
        <div
          className="w-full grid grid-cols-3 gap-2 mt-auto pt-3 text-sm"
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

        {/* Desktop actions — bottom of the tile; mobile shows them in the header instead */}
        <div className="mt-3 hidden sm:flex gap-2 w-full">
          <Link
            href={`/meeps/${user.id}`}
            className="flex-1 text-center btn btn-sm btn-ghost"
          >
            View
          </Link>
          {canEdit && (
            <Link
              href={`/meeps/${user.id}/edit`}
              className="flex-1 text-center btn btn-sm btn-secondary"
            >
              Edit
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
