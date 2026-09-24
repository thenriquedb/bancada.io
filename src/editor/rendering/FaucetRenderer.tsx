import React from 'react'
import type { FaucetElement } from '../../models/types.ts'

type FaucetRendererProps = {
  element: FaucetElement
  selected: boolean
  hovered: boolean
  hasError?: boolean
}

export const FaucetRenderer: React.FC<FaucetRendererProps> = ({ element, selected, hovered, hasError }) => {
  const { position: pos, diameter } = element
  const r = diameter / 2
  const stroke = hasError ? '#ef4444' : selected ? '#1971c2' : hovered ? '#339af0' : '#555555'
  const fill = selected ? '#dbeafe' : hovered ? '#e7f5ff' : '#e0e0e0'

  return (
    <g className="element element--faucet">
      {/* Hole circle */}
      <circle cx={pos.x} cy={pos.y} r={r} fill={fill} stroke={stroke} strokeWidth={selected ? 2 : 1.5} />

      {/* Cross (technical hole symbol) */}
      <line x1={pos.x - r * 0.6} y1={pos.y} x2={pos.x + r * 0.6} y2={pos.y}
        stroke={stroke} strokeWidth={1} />
      <line x1={pos.x} y1={pos.y - r * 0.6} x2={pos.x} y2={pos.y + r * 0.6}
        stroke={stroke} strokeWidth={1} />

      {/* Diameter label */}
      <text x={pos.x} y={pos.y + r + 16} textAnchor="middle"
        fontSize={Math.max(diameter * 0.25, 10)} fontFamily="Inter, sans-serif" fill="#555"
        style={{ userSelect: 'none', pointerEvents: 'none' }}>
        Ø{diameter}
      </text>
    </g>
  )
}
