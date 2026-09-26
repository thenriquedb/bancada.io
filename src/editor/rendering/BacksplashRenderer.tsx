import React from 'react'
import type { BacksplashElement } from '../../models/types.ts'

type BacksplashRendererProps = {
  element: BacksplashElement
  selected: boolean
  hovered: boolean
  zoom?: number
}

export const BacksplashRenderer: React.FC<BacksplashRendererProps> = ({ element, selected, hovered, zoom = 1 }) => {
  const { position: pos, height, length } = element
  const stroke = selected ? '#1971c2' : hovered ? '#339af0' : '#adb5bd'
  const fill = selected ? '#dbeafe' : hovered ? '#eff6ff' : '#f8f9fa'

  return (
    <g className="element element--backsplash">
      <rect x={pos.x} y={pos.y} width={length} height={height}
        fill={fill} stroke={stroke} strokeWidth={selected ? 2 : 1.5} />

      <text x={pos.x + length / 2} y={pos.y + height / 2 - 6} textAnchor="middle" dominantBaseline="middle"
        fontSize={14 / zoom} fontFamily="Inter, sans-serif" fill="#1e293b"
        style={{ userSelect: 'none', pointerEvents: 'none', fontWeight: 600 }}
        stroke="#ffffff" strokeWidth={3 / zoom} paintOrder="stroke fill" strokeOpacity={0.8}>
        RODABANCA
        <tspan x={pos.x + length / 2} dy={16 / zoom} fontWeight="400" fontSize={11 / zoom} fill="#475569">{height} mm</tspan>
      </text>
    </g>
  )
}
