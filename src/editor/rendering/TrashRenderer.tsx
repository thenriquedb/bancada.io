import React from 'react'
import type { TrashElement } from '../../models/types.ts'
import { TRASH_FILL, TRASH_STROKE } from './constants.ts'
import { SmallElementLabel, MIN_VISUAL_SIZE, HIT_AREA_SIZE, SMALL_ELEMENT_THRESHOLD } from './SmallElementLabel.tsx'

type TrashRendererProps = {
  element: TrashElement
  selected: boolean
  hovered: boolean
  hasError?: boolean
  zoom?: number
}

export const TrashRenderer: React.FC<TrashRendererProps> = ({ element, selected, hovered, hasError, zoom = 1 }) => {
  const { position: pos, shape } = element
  const fill = selected ? '#dbeafe' : hovered ? '#e7f5ff' : TRASH_FILL
  const stroke = hasError ? '#ef4444' : selected ? '#1971c2' : hovered ? '#339af0' : TRASH_STROKE
  const strokeW = selected ? 2 : 1.5

  if (shape === 'circular') {
    const r = (element.diameter ?? 250) / 2
    return (
      <g 
        className="element element--trash"
        transform={element.rotation ? `rotate(${element.rotation} ${pos.x} ${pos.y})` : undefined}
      >
        {/* Hit Area */}
        <circle cx={pos.x} cy={pos.y} r={Math.max(r, (HIT_AREA_SIZE / 2) / zoom)} fill="transparent" />

        {/* Outer rim */}
        <circle cx={pos.x} cy={pos.y} r={r} fill={fill} stroke={stroke} strokeWidth={strokeW / zoom} />
        {/* Inner hole (only if not small) */}
        {r * 2 * zoom >= SMALL_ELEMENT_THRESHOLD && (
          <circle cx={pos.x} cy={pos.y} r={r * 0.8} fill="transparent" stroke={stroke} strokeWidth={1 / zoom} strokeDasharray="4 4" opacity={0.6} />
        )}

        <SmallElementLabel
          elementId={element.id}
          cx={pos.x}
          cy={pos.y}
          worldWidth={element.diameter ?? 250}
          worldHeight={element.diameter ?? 250}
          zoom={zoom}
          title="LIXEIRA"
          subtitle={`Ø${element.diameter ?? 250} mm`}
          color={stroke}
        />
      </g>
    )
  }

  // Rectangular
  const w = element.width ?? 300
  const d = element.depth ?? 250
  const cx = pos.x + w / 2
  const cy = pos.y + d / 2

  return (
    <g 
      className="element element--trash"
      transform={element.rotation ? `rotate(${element.rotation} ${cx} ${cy})` : undefined}
    >
      {/* Hit Area */}
      <rect x={cx - Math.max(w/2, (HIT_AREA_SIZE / 2) / zoom)} y={pos.y + d/2 - Math.max(d/2, (HIT_AREA_SIZE / 2) / zoom)} width={Math.max(w, HIT_AREA_SIZE / zoom)} height={Math.max(d, HIT_AREA_SIZE / zoom)} fill="transparent" />

      {/* Outer rim */}
      <rect 
        x={pos.x} 
        y={pos.y} 
        width={w} 
        height={d} 
        rx={10 / zoom} fill={fill} stroke={stroke} strokeWidth={strokeW / zoom} 
      />
      {/* Inner hole (only if not small) */}
      {Math.min(w, d) * zoom >= SMALL_ELEMENT_THRESHOLD && (
        <rect x={pos.x + 8} y={pos.y + 8} width={w - 16} height={d - 16} rx={6 / zoom} fill="transparent" stroke={stroke} strokeWidth={1 / zoom} strokeDasharray="4 4" opacity={0.6} />
      )}
      
      <SmallElementLabel
        elementId={element.id}
        cx={cx}
        cy={cy}
        worldWidth={w}
        worldHeight={d}
        zoom={zoom}
        title="LIXEIRA"
        subtitle={`${w} × ${d} mm`}
        color={stroke}
      />
    </g>
  )
}
