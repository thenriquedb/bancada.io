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
  const stroke = selected ? '#1971c2' : hovered ? '#339af0' : '#b0b0b0'
  const fill = selected ? 'rgba(59, 130, 246, 0.1)' : hovered ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.08)'

  return (
    <g className="element element--wet-area">
      <defs>
        <filter id={`inner-shadow-wa-${element.id}`}>
          <feOffset dx="0" dy="2" />
          <feGaussianBlur stdDeviation="3" result="offset-blur" />
          <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
          <feFlood floodColor="black" floodOpacity="0.2" result="color" />
          <feComposite operator="in" in="color" in2="inverse" result="shadow" />
          <feComposite operator="over" in="shadow" in2="SourceGraphic" />
        </filter>
      </defs>

      {/* Area rectangle with inner shadow for recessed look */}
      <rect x={pos.x} y={pos.y} width={width} height={depth}
        fill={fill}
        stroke={stroke} strokeWidth={selected ? 8 : 5}
        filter={`url(#inner-shadow-wa-${element.id})`} />

      {/* Label */}
      <text x={cx} y={cy - 8} textAnchor="middle"
        fontSize={Math.min(width, depth) * 0.05} fontFamily="Inter, sans-serif" fill="#555" fontWeight="500"
        style={{ userSelect: 'none', pointerEvents: 'none' }}>
        Área Molhada
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle"
        fontSize={Math.min(width, depth) * 0.04} fontFamily="Inter, sans-serif" fill="#666"
        style={{ userSelect: 'none', pointerEvents: 'none' }}>
        Rebaixo {recess} mm
      </text>
    </g>
  )
}
