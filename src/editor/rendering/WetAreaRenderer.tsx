import React from 'react'
import type { WetAreaElement } from '../../models/types.ts'

type WetAreaRendererProps = {
  element: WetAreaElement
  selected: boolean
  hovered: boolean
  zoom?: number
}

export const WetAreaRenderer: React.FC<WetAreaRendererProps> = ({ element, selected, hovered, zoom = 1 }) => {
  const { position: pos, width, depth, recess } = element
  const cx = pos.x + width / 2
  const cy = pos.y + depth / 2
  const stroke = selected ? '#1971c2' : hovered ? '#339af0' : '#8ce99a' // green dashed
  const fill = selected ? 'rgba(59, 130, 246, 0.1)' : hovered ? 'rgba(0, 0, 0, 0.05)' : 'rgba(178, 242, 187, 0.2)' // green fill
  const strokeW = selected ? 2 : 1.5

  return (
    <g className="element element--wet-area">
      {/* Area rectangle */}
      <rect x={pos.x} y={pos.y} width={width} height={depth}
        fill={fill}
        stroke={stroke} strokeWidth={strokeW}
        strokeDasharray="8 8" />

      {/* Label */}
      <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="middle"
        fontSize={14 / zoom} fontFamily="Inter, sans-serif" fill="#1e293b"
        style={{ userSelect: 'none', pointerEvents: 'none', fontWeight: 600 }}
        stroke="#ffffff" strokeWidth={3 / zoom} paintOrder="stroke fill" strokeOpacity={0.8}>
        ÁREA MOLHADA
        <tspan x={cx} dy={16 / zoom} fontWeight="400" fontSize={11 / zoom} fill="#475569">REBAIXO {recess} mm</tspan>
      </text>
    </g>
  )
}
