import React from 'react'
import type { TrashElement } from '../../models/types.ts'

type TrashRendererProps = {
  element: TrashElement
  selected: boolean
  hovered: boolean
  hasError?: boolean
}

export const TrashRenderer: React.FC<TrashRendererProps> = ({ element, selected, hovered, hasError }) => {
  const { position: pos, shape } = element
  const stroke = hasError ? '#ef4444' : selected ? '#1971c2' : hovered ? '#339af0' : '#666666'
  const fill = selected ? '#dbeafe' : hovered ? '#e7f5ff' : '#e8e8e8'
  const strokeW = selected ? 2 : 1.5

  const gradId = `trash-grad-${element.id}`
  const holeGradId = `trash-hole-${element.id}`

  if (shape === 'circular') {
    const r = (element.diameter ?? 250) / 2
    return (
      <g className="element element--trash">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={selected ? '#dbeafe' : '#f0f0f0'} />
            <stop offset="50%" stopColor={selected ? '#bfdbfe' : '#d4d4d4'} />
            <stop offset="100%" stopColor={selected ? '#93c5fd' : '#b0b0b0'} />
          </linearGradient>
          <radialGradient id={holeGradId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#111" />
            <stop offset="80%" stopColor="#333" />
            <stop offset="100%" stopColor="#555" />
          </radialGradient>
          <filter id={`shadow-trash-${element.id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Outer rim */}
        <circle cx={pos.x} cy={pos.y} r={r} fill={`url(#${gradId})`} stroke={stroke} strokeWidth={strokeW} filter={`url(#shadow-trash-${element.id})`} />
        {/* Inner rim */}
        <circle cx={pos.x} cy={pos.y} r={r * 0.9} fill="none" stroke="#e0e0e0" strokeWidth={1} />
        {/* Hole */}
        <circle cx={pos.x} cy={pos.y} r={r * 0.8} fill={`url(#${holeGradId})`} />
        
        {/* Lid (half open) */}
        <path d={`M ${pos.x - r*0.75} ${pos.y} A ${r*0.75} ${r*0.75} 0 0 1 ${pos.x + r*0.75} ${pos.y}`} fill={`url(#${gradId})`} stroke="#ccc" strokeWidth="1" />

        <text x={pos.x} y={pos.y + r + 16} textAnchor="middle"
          fontSize={Math.max(r * 0.3, 10)} fontFamily="Inter, sans-serif" fill="#555"
          style={{ userSelect: 'none', pointerEvents: 'none' }}>
          Lixeira Ø{element.diameter ?? 250}
        </text>
      </g>
    )
  }

  // Rectangular
  const w = element.width ?? 300
  const d = element.depth ?? 250
  const cx = pos.x + w / 2
  const cy = pos.y + d / 2

  return (
    <g className="element element--trash">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={selected ? '#dbeafe' : '#f0f0f0'} />
          <stop offset="50%" stopColor={selected ? '#bfdbfe' : '#d4d4d4'} />
          <stop offset="100%" stopColor={selected ? '#93c5fd' : '#b0b0b0'} />
        </linearGradient>
        <linearGradient id={holeGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#222" />
          <stop offset="100%" stopColor="#000" />
        </linearGradient>
        <filter id={`shadow-trash-${element.id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Outer rim */}
      <rect x={pos.x} y={pos.y} width={w} height={d} rx={10} fill={`url(#${gradId})`} stroke={stroke} strokeWidth={strokeW} filter={`url(#shadow-trash-${element.id})`} />
      {/* Inner rim */}
      <rect x={pos.x + 4} y={pos.y + 4} width={w - 8} height={d - 8} rx={8} fill="none" stroke="#e0e0e0" strokeWidth={1} />
      {/* Hole */}
      <rect x={pos.x + 8} y={pos.y + 8} width={w - 16} height={d - 16} rx={6} fill={`url(#${holeGradId})`} />
      
      {/* Rectangular Lid (half open) */}
      <rect x={pos.x + 8} y={pos.y + 8} width={w - 16} height={(d - 16) / 2} rx={6} fill={`url(#${gradId})`} stroke="#ccc" strokeWidth="1" />

      <text x={cx} y={pos.y + d + 18} textAnchor="middle"
        fontSize={Math.min(w, d) * 0.12} fontFamily="Inter, sans-serif" fill="#555"
        style={{ userSelect: 'none', pointerEvents: 'none' }}>
        Lixeira {w}×{d}
      </text>
    </g>
  )
}
