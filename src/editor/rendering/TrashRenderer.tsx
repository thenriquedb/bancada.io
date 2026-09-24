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

  if (shape === 'circular') {
    const r = (element.diameter ?? 250) / 2
    return (
      <g className="element element--trash">
        <circle cx={pos.x} cy={pos.y} r={r} fill={fill} stroke={stroke} strokeWidth={strokeW} />
        {/* X mark inside */}
        <line x1={pos.x - r * 0.4} y1={pos.y - r * 0.4} x2={pos.x + r * 0.4} y2={pos.y + r * 0.4}
          stroke={stroke} strokeWidth={1} />
        <line x1={pos.x + r * 0.4} y1={pos.y - r * 0.4} x2={pos.x - r * 0.4} y2={pos.y + r * 0.4}
          stroke={stroke} strokeWidth={1} />
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
      <rect x={pos.x} y={pos.y} width={w} height={d} fill={fill} stroke={stroke} strokeWidth={strokeW} />
      <line x1={pos.x + w * 0.2} y1={pos.y + d * 0.2} x2={pos.x + w * 0.8} y2={pos.y + d * 0.8}
        stroke={stroke} strokeWidth={1} />
      <line x1={pos.x + w * 0.8} y1={pos.y + d * 0.2} x2={pos.x + w * 0.2} y2={pos.y + d * 0.8}
        stroke={stroke} strokeWidth={1} />
      <text x={cx} y={pos.y + d + 18} textAnchor="middle"
        fontSize={Math.min(w, d) * 0.12} fontFamily="Inter, sans-serif" fill="#555"
        style={{ userSelect: 'none', pointerEvents: 'none' }}>
        Lixeira {w}×{d}
      </text>
    </g>
  )
}
