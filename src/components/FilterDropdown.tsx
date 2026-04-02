'use client'

import { useState, useRef } from 'react'
import useClickOutside from '@/hooks/useClickOutside'

type DropdownOption = { key: string; label: string }

interface FilterDropdownProps {
  label: string
  options: DropdownOption[]
  selected: string[]
  onToggle: (key: string) => void
  searchPlaceholder?: string
  emptyMessage?: string
  width?: number
}

export default function FilterDropdown({
  label,
  options,
  selected,
  onToggle,
  searchPlaceholder = 'Search…',
  emptyMessage = 'No options found',
  width = 240,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false), open)

  const shown = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="filter-input"
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          whiteSpace: 'nowrap',
          borderColor: selected.length > 0 ? 'rgba(201,169,97,0.8)' : undefined,
          background: selected.length > 0 ? 'rgba(201,169,97,0.12)' : undefined,
        }}
      >
        {label}{selected.length > 0 ? ` (${selected.length})` : ' ▾'}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          zIndex: 200,
          width,
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
              placeholder={searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="filter-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
              autoFocus
            />
          </div>
          <div style={{ overflowY: 'auto', padding: '0.3rem 0.25rem' }}>
            {shown.map(o => (
              <label
                key={o.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  color: selected.includes(o.key) ? '#C9A961' : '#E8D4B8',
                  fontSize: '0.8125rem',
                  background: selected.includes(o.key) ? 'rgba(201,169,97,0.08)' : 'transparent',
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(o.key)}
                  onChange={() => onToggle(o.key)}
                  style={{ accentColor: '#C9A961', flexShrink: 0 }}
                />
                {o.label}
              </label>
            ))}
            {shown.length === 0 && (
              <p style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'rgba(232,212,184,0.4)' }}>
                {emptyMessage}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
