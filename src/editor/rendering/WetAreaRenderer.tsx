import React from 'react'
import type { WetAreaElement } from '../../models/types.ts'

type WetAreaRendererProps = {
  element: WetAreaElement
  selected: boolean
  hovered: boolean
}

export const WetAreaRenderer: React.FC<WetAreaRendererProps> = ({ element, selected, hovered }) => {
  const { position: pos, width, depth, recess } = element
  const cx = pos.x + width / 2
  const cy = pos.y + depth / 2
  const stroke = selected ? '#1971c2' : hovered ? '#339af0' : '#2f9e44'
  const fill = selected ? '#dbeafe' : hovered ? '#e7f5ff' : '#e8f8e8'

  return (
    <g className="element element--wet-area">
      {/* Area rectangle */}
      <rect x={pos.x} y={pos.y} width={width} height={depth}
        fill={fill} fillOpacity={0.6}
        stroke={stroke} strokeWidth={selected ? 2 : 1.5} strokeDasharray={selected ? '' : '8 4'} />

      {/* Diagonal lines indicating rebaixo */}
      {Array.from({ length: Math.ceil(width / 40) + 1 }, (_, i) => {
        const x = pos.x + i * 40
        return (
          <line key={i} x1={x} y1={pos.y} x2={x - 40} y2={pos.y + 40}
            stroke={stroke} strokeWidth={0.6} opacity={0.4} />
        )
      })}

      {/* Label */}
      <text x={cx} y={cy - 8} textAnchor="middle"
        fontSize={Math.min(width, depth) * 0.07} fontFamily="Inter, sans-serif" fill="#2f9e44" fontWeight="500"
        style={{ userSelect: 'none', pointerEvents: 'none' }}>
        Área Molhada
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle"
        fontSize={Math.min(width, depth) * 0.06} fontFamily="Inter, sans-serif" fill="#555"
        style={{ userSelect: 'none', pointerEvents: 'none' }}>
        Rebaixo {recess} mm
      </text>
    </g>
  )
}
