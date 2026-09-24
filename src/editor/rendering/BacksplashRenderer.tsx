import React from 'react'
import type { BacksplashElement } from '../../models/types.ts'

type BacksplashRendererProps = {
  element: BacksplashElement
  selected: boolean
  hovered: boolean
}

export const BacksplashRenderer: React.FC<BacksplashRendererProps> = ({ element, selected, hovered }) => {
  const { position: pos, height, length } = element
  const stroke = selected ? '#1971c2' : hovered ? '#339af0' : '#888888'
  const fill = selected ? '#dbeafe' : hovered ? '#eff6ff' : '#ece9e0'

  return (
    <g className="element element--backsplash">
      <rect x={pos.x} y={pos.y} width={length} height={height}
        fill={fill} stroke={stroke} strokeWidth={selected ? 2 : 1.5} />

      {/* Horizontal texture lines */}
      {Array.from({ length: Math.floor(height / 25) }, (_, i) => (
        <line key={i} x1={pos.x + 4} y1={pos.y + 12 + i * 25} x2={pos.x + length - 4} y2={pos.y + 12 + i * 25}
          stroke={stroke} strokeWidth={0.5} opacity={0.3} />
      ))}

      <text x={pos.x + length / 2} y={pos.y + height / 2} textAnchor="middle" dominantBaseline="middle"
        fontSize={Math.min(height * 0.3, 30)} fontFamily="Inter, sans-serif" fill="#666"
        style={{ userSelect: 'none', pointerEvents: 'none' }}>
        Rodabanca {height} mm
      </text>
    </g>
  )
}
