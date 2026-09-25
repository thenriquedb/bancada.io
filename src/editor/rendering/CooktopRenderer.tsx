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

  // Lighter, cleaner background matching the app's aesthetic
  const fill = selected ? '#dbeafe' : hovered ? '#fff8e1' : '#f8f9fa'
  const stroke = hasError ? '#ef4444' : selected ? '#1971c2' : '#ced4da'
  const strokeW = selected ? 1.5 : 1

  // Burner positions (2×2 grid centered)
  const burnerR = Math.min(width, depth) * 0.15
  const bx1 = pos.x + width * 0.28
  const bx2 = pos.x + width * 0.72
  const by1 = pos.y + depth * 0.28
  const by2 = pos.y + depth * 0.72

  const cornerR = Math.min(width, depth) * 0.05
  const cx = pos.x + width / 2
  const cy = pos.y + depth / 2

  return (
    <g 
      className="element element--cooktop"
      transform={element.rotation ? `rotate(${element.rotation} ${cx} ${cy})` : undefined}
    >
      <defs>
        <filter id={`shadow-ct-${element.id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.1" />
        </filter>
      </defs>

      {/* Outer footprint (Glass surface) */}
      <rect x={pos.x} y={pos.y} width={width} height={depth} rx={cornerR}
        fill={fill} stroke={stroke} strokeWidth={strokeW} filter={`url(#shadow-ct-${element.id})`} />

      {/* Burners - Lighter gray aesthetics */}
      {[{ x: bx1, y: by1 }, { x: bx2, y: by1 }, { x: bx1, y: by2 }, { x: bx2, y: by2 }].map((b, i) => (
        <g key={i}>
          {/* Burner outer ring */}
          <circle cx={b.x} cy={b.y} r={burnerR} fill="transparent" stroke="#dee2e6" strokeWidth={2} />
          {/* Red glow indicator (softer) */}
          <circle cx={b.x} cy={b.y} r={burnerR * 0.8} fill="none" stroke="#ff8787" strokeWidth={1.5} opacity={0.6} />
          {/* Inner metallic part */}
          <circle cx={b.x} cy={b.y} r={burnerR * 0.4} fill="#e9ecef" stroke="#ced4da" strokeWidth={1} />
        </g>
      ))}

      {/* Controls (Small dots at bottom) */}
      <circle cx={pos.x + width / 2 - 30} cy={pos.y + depth - 25} r={6} fill="#adb5bd" />
      <circle cx={pos.x + width / 2} cy={pos.y + depth - 25} r={6} fill="#adb5bd" />
      <circle cx={pos.x + width / 2 + 30} cy={pos.y + depth - 25} r={6} fill="#adb5bd" />

      {/* Label */}
      <text x={pos.x + width / 2} y={pos.y + 20} textAnchor="middle" dominantBaseline="middle"
        fontSize={Math.min(width, depth) * 0.08} fontFamily="Inter, sans-serif" fill="#868e96"
        style={{ userSelect: 'none', pointerEvents: 'none', fontWeight: 500 }}>
        Cooktop
      </text>
    </g>
  )
}
