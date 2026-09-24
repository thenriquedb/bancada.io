import React from 'react'
import type { CooktopElement } from '../../models/types.ts'

type CooktopRendererProps = {
  element: CooktopElement
  selected: boolean
  hovered: boolean
  hasError?: boolean
}

export const CooktopRenderer: React.FC<CooktopRendererProps> = ({ element, selected, hovered, hasError }) => {
  const { position: pos, width, depth } = element

  const fill = selected ? '#dbeafe' : hovered ? '#fff8e1' : '#fafafa'
  const stroke = hasError ? '#ef4444' : selected ? '#1971c2' : '#555555'
  const strokeW = selected ? 1.5 : 1

  // Burner positions (2×2 grid centered)
  const burnerR = Math.min(width, depth) * 0.15
  const bx1 = pos.x + width * 0.28
  const bx2 = pos.x + width * 0.72
  const by1 = pos.y + depth * 0.28
  const by2 = pos.y + depth * 0.72

  const cornerR = Math.min(width, depth) * 0.05
  const gradId = `cooktop-grad-${element.id}`
  const burnerGradId = `cooktop-burner-${element.id}`

  return (
    <g className="element element--cooktop">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={selected ? '#3b82f6' : '#2a2a2a'} />
          <stop offset="50%" stopColor={selected ? '#60a5fa' : '#111111'} />
          <stop offset="100%" stopColor={selected ? '#1d4ed8' : '#000000'} />
        </linearGradient>
        <radialGradient id={burnerGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#444" />
          <stop offset="80%" stopColor="#111" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
        <filter id={`shadow-ct-${element.id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Outer footprint (Glass surface) */}
      <rect x={pos.x} y={pos.y} width={width} height={depth} rx={cornerR}
        fill={`url(#${gradId})`} stroke={stroke} strokeWidth={strokeW} filter={`url(#shadow-ct-${element.id})`} />

      {/* Burners */}
      {[{ x: bx1, y: by1 }, { x: bx2, y: by1 }, { x: bx1, y: by2 }, { x: bx2, y: by2 }].map((b, i) => (
        <g key={i}>
          {/* Burner outer ring */}
          <circle cx={b.x} cy={b.y} r={burnerR} fill={`url(#${burnerGradId})`} stroke="#444" strokeWidth={2} />
          {/* Red glow indicator */}
          <circle cx={b.x} cy={b.y} r={burnerR * 0.8} fill="none" stroke="#dc2626" strokeWidth={2} opacity={0.6} />
          <circle cx={b.x} cy={b.y} r={burnerR * 0.85} fill="none" stroke="#b91c1c" strokeWidth={1} opacity={0.4} />
          {/* Inner metallic part */}
          <circle cx={b.x} cy={b.y} r={burnerR * 0.4} fill="#222" stroke="#555" strokeWidth={1.5} />
          <circle cx={b.x} cy={b.y} r={burnerR * 0.15} fill="#111" />
        </g>
      ))}

      {/* Controls (Small dots at bottom) */}
      <circle cx={pos.x + width / 2 - 30} cy={pos.y + depth - 25} r={8} fill="#333" stroke="#666" strokeWidth={1} />
      <circle cx={pos.x + width / 2} cy={pos.y + depth - 25} r={8} fill="#333" stroke="#666" strokeWidth={1} />
      <circle cx={pos.x + width / 2 + 30} cy={pos.y + depth - 25} r={8} fill="#333" stroke="#666" strokeWidth={1} />

      {/* Label */}
      <text x={pos.x + width / 2} y={pos.y + 20} textAnchor="middle" dominantBaseline="middle"
        fontSize={Math.min(width, depth) * 0.05} fontFamily="Inter, sans-serif" fill="#888"
        stroke="#111" strokeWidth={2} paintOrder="stroke fill" strokeOpacity={0.8}
        style={{ userSelect: 'none', pointerEvents: 'none' }}>
        Cooktop {width}×{depth}
      </text>
    </g>
  )
}
