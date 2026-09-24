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

  const gradId = `faucet-grad-${element.id}`
  const shadowId = `faucet-shadow-${element.id}`

  return (
    <g 
      className="element element--faucet"
      transform={element.rotation ? `rotate(${element.rotation} ${pos.x} ${pos.y})` : undefined}
    >
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={selected ? '#dbeafe' : '#ffffff'} />
          <stop offset="70%" stopColor={selected ? '#93c5fd' : '#d4d4d4'} />
          <stop offset="100%" stopColor={selected ? '#60a5fa' : '#a0a0a0'} />
        </radialGradient>
        <filter id={shadowId} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Base shadow & circle */}
      <circle cx={pos.x} cy={pos.y} r={r} fill={`url(#${gradId})`} stroke={stroke} strokeWidth={selected ? 2 : 1} filter={`url(#${shadowId})`} />
      
      {/* Inner metallic ring */}
      <circle cx={pos.x} cy={pos.y} r={r * 0.7} fill="none" stroke="#e0e0e0" strokeWidth={1} />
      
      {/* Spout pointing downwards (Y axis) */}
      <rect x={pos.x - r * 0.25} y={pos.y} width={r * 0.5} height={r * 1.5} rx={r * 0.25} 
        fill={`url(#${gradId})`} stroke={stroke} strokeWidth={1} filter={`url(#${shadowId})`} />
      
      {/* Aerator / Tip of the spout */}
      <ellipse cx={pos.x} cy={pos.y + r * 1.5} rx={r * 0.25} ry={r * 0.15} fill="#333" stroke="#888" strokeWidth={1} />
      
      {/* Top Handle */}
      <rect x={pos.x - r * 0.1} y={pos.y - r * 0.8} width={r * 0.2} height={r * 0.8} rx={r * 0.1} 
        fill={`url(#${gradId})`} stroke={stroke} strokeWidth={1} />

      {/* Diameter label */}
      <text x={pos.x} y={pos.y + r + 16} textAnchor="middle"
        fontSize={Math.max(diameter * 0.25, 10)} fontFamily="Inter, sans-serif" fill="#555"
        style={{ userSelect: 'none', pointerEvents: 'none' }}>
        Ø{diameter}
      </text>
    </g>
  )
}
