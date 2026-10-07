import React from 'react'
import type { FaucetElement } from '../../models/types.ts'
import { SmallElementLabel, HIT_AREA_SIZE } from './SmallElementLabel.tsx'

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
  const stroke = hasError ? '#ef4444' : selected ? '#1971c2' : hovered ? '#339af0' : '#64748b'
  const fill = selected ? '#dbeafe' : hovered ? '#e7f5ff' : '#f8fafc'

  return (
    <g 
      className="element element--faucet"
      transform={element.rotation ? `rotate(${element.rotation} ${pos.x} ${pos.y})` : undefined}
    >
      {/* Hit Area */}
      <circle cx={pos.x} cy={pos.y} r={Math.max(r, (HIT_AREA_SIZE / 2) / zoom)} fill="transparent" />

      {/* Minimal symbol: flat ring + centre dot (real geometry unchanged) */}
      <circle cx={pos.x} cy={pos.y} r={r} fill={fill} stroke={stroke} strokeWidth={(selected ? 2 : 1.25) / zoom} />
      <circle cx={pos.x} cy={pos.y} r={Math.max(r * 0.22, 1.5 / zoom)} fill={stroke} />
      
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
        selected={selected}
        hovered={hovered}
      />
    </g>
  )
}
