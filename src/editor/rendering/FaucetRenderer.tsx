import React from 'react'
import type { FaucetElement } from '../../models/types.ts'
import { SmallElementLabel, MIN_VISUAL_SIZE, HIT_AREA_SIZE, SMALL_ELEMENT_THRESHOLD } from './SmallElementLabel.tsx'

type FaucetRendererProps = {
  element: FaucetElement
  selected: boolean
  hovered: boolean
  hasError?: boolean
  zoom?: number
}

export const FaucetRenderer: React.FC<FaucetRendererProps> = ({ element, selected, hovered, hasError, zoom = 1 }) => {
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

      {/* Hit Area */}
      <circle cx={pos.x} cy={pos.y} r={Math.max(r, (HIT_AREA_SIZE / 2) / zoom)} fill="transparent" />

      {/* Base shadow & circle */}
      <circle cx={pos.x} cy={pos.y} r={r} fill={`url(#${gradId})`} stroke={stroke} strokeWidth={selected ? 2 / zoom : 1 / zoom} filter={`url(#${shadowId})`} />
      
      {/* Inner metallic ring */}
      <circle cx={pos.x} cy={pos.y} r={r * 0.7} fill="none" stroke="#e0e0e0" strokeWidth={1 / zoom} />
      
      {/* Full details if not small */}
      {diameter * zoom >= SMALL_ELEMENT_THRESHOLD && (
        <>
          {/* Spout pointing downwards (Y axis) */}
          <rect x={pos.x - r * 0.25} y={pos.y} width={r * 0.5} height={r * 1.5} rx={r * 0.25} 
            fill={`url(#${gradId})`} stroke={stroke} strokeWidth={1 / zoom} filter={`url(#${shadowId})`} />
          
          {/* Aerator / Tip of the spout */}
          <ellipse cx={pos.x} cy={pos.y + r * 1.5} rx={r * 0.25} ry={r * 0.15} fill="#333" stroke="#888" strokeWidth={1 / zoom} />
          
          {/* Top Handle */}
          <rect x={pos.x - r * 0.1} y={pos.y - r * 0.8} width={r * 0.2} height={r * 0.8} rx={r * 0.1} 
            fill={`url(#${gradId})`} stroke={stroke} strokeWidth={1 / zoom} />
        </>
      )}
      
      {/* Label / Callout */}
      <SmallElementLabel
        elementId={element.id}
        cx={pos.x}
        cy={pos.y}
        worldWidth={diameter}
        worldHeight={diameter}
        zoom={zoom}
        title="TORNEIRA"
        subtitle={`Ø${diameter} mm`}
        color={stroke}
      />
    </g>
  )
}
