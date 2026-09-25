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

      <text x={pos.x + length / 2} y={pos.y + height / 2} textAnchor="middle" dominantBaseline="middle"
        fontSize={Math.max(Math.min(length, height) * 0.3, 10 / zoom)} fontFamily="Inter, sans-serif" fill="#495057" fontWeight="600"
        style={{ userSelect: 'none', pointerEvents: 'none' }}>
        RODABANCA
        <tspan x={pos.x + length / 2} dy={Math.max(Math.min(length, height) * 0.4, 14 / zoom)} fontWeight="400" fontSize={Math.max(Math.min(length, height) * 0.25, 8 / zoom)} fill="#868e96">{height} mm</tspan>
      </text>
    </g>
  )
}
