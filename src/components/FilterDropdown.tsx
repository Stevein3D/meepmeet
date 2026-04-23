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
    <div ref={ref} className="relative">
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
        <div className="dropdown-panel" style={{ width }}>
          <div className="dropdown-search-row">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="filter-input"
              style={{ width: '100%' }}
              autoFocus
            />
          </div>
          <div className="dropdown-option-list">
            {shown.map(o => (
              <label
                key={o.key}
                className={`dropdown-option${selected.includes(o.key) ? ' dropdown-option--selected' : ''}`}
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
              <p className="dropdown-empty">{emptyMessage}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
