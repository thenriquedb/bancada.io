import React from 'react'
import type { TrashElement } from '../../models/types.ts'
import { TRASH_FILL, TRASH_STROKE } from './constants.ts'

type TrashRendererProps = {
  element: TrashElement
  selected: boolean
  hovered: boolean
  hasError?: boolean
  zoom?: number
}

export const TrashRenderer: React.FC<TrashRendererProps> = ({ element, selected, hovered, hasError, zoom = 1 }) => {
  const { position: pos, shape } = element
  const fill = selected ? '#dbeafe' : hovered ? '#e7f5ff' : TRASH_FILL
  const stroke = hasError ? '#ef4444' : selected ? '#1971c2' : hovered ? '#339af0' : TRASH_STROKE
  const strokeW = selected ? 2 : 1.5

  if (shape === 'circular') {
    const r = (element.diameter ?? 250) / 2
    return (
      <g 
        className="element element--trash"
        transform={element.rotation ? `rotate(${element.rotation} ${pos.x} ${pos.y})` : undefined}
      >
        {/* Outer rim */}
        <circle cx={pos.x} cy={pos.y} r={r} fill={fill} stroke={stroke} strokeWidth={strokeW} />
        {/* Inner hole */}
        <circle cx={pos.x} cy={pos.y} r={r * 0.8} fill="transparent" stroke={stroke} strokeWidth={1} strokeDasharray="4 4" opacity={0.6} />

        <text x={pos.x} y={pos.y + r + 24} textAnchor="middle"
          fontSize={Math.max(r * 0.25, 12 / zoom)} fontFamily="Inter, sans-serif" fill="#495057" fontWeight="600"
          style={{ userSelect: 'none', pointerEvents: 'none' }}>
          LIXEIRA
          <tspan x={pos.x} dy={Math.max(r * 0.3, 16 / zoom)} fontWeight="400" fontSize={Math.max(r * 0.2, 10 / zoom)} fill="#868e96">Ø{element.diameter ?? 250} mm</tspan>
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
    <g 
      className="element element--trash"
      transform={element.rotation ? `rotate(${element.rotation} ${cx} ${cy})` : undefined}
    >
      {/* Outer rim */}
      <rect x={pos.x} y={pos.y} width={w} height={d} rx={10} fill={fill} stroke={stroke} strokeWidth={strokeW} />
      {/* Inner hole */}
      <rect x={pos.x + 8} y={pos.y + 8} width={w - 16} height={d - 16} rx={6} fill="transparent" stroke={stroke} strokeWidth={1} strokeDasharray="4 4" opacity={0.6} />
      
      <text x={cx} y={pos.y + d + 24} textAnchor="middle"
        fontSize={Math.max(Math.min(w, d) * 0.1, 12 / zoom)} fontFamily="Inter, sans-serif" fill="#495057" fontWeight="600"
        style={{ userSelect: 'none', pointerEvents: 'none' }}>
        LIXEIRA
        <tspan x={cx} dy={Math.max(Math.min(w, d) * 0.12, 16 / zoom)} fontWeight="400" fontSize={Math.max(Math.min(w, d) * 0.08, 10 / zoom)} fill="#868e96">{w} × {d} mm</tspan>
      </text>
    </g>
  )
}
