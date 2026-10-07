import React from 'react'
import type { CutoutElement } from '../../models/types.ts'
import { SmallElementLabel, MIN_VISUAL_SIZE, HIT_AREA_SIZE, SMALL_ELEMENT_THRESHOLD } from './SmallElementLabel.tsx'

type CutoutRendererProps = {
  element: CutoutElement
  selected: boolean
  hovered: boolean
  zoom: number
}

export const CutoutRenderer: React.FC<CutoutRendererProps> = ({ element, selected, hovered, zoom }) => {
  const { shape, position: pos, color = '#ffffff', label = 'RECORTE' } = element

  const strokeColor = selected ? '#1971c2' : hovered ? '#339af0' : '#868e96'
  const strokeWidth = selected ? 2 : 1.5

  if (shape === 'circular') {
    const r = (element.diameter ?? 100) / 2
    const cx = pos.x + r
    const cy = pos.y + r

    return (
      <g>
        {/* Hit Area */}
        <circle cx={cx} cy={cy} r={Math.max(r, (HIT_AREA_SIZE / 2) / zoom)} fill="transparent" />

        {/* Fill the background with custom color or canvas color */}
        <circle cx={cx} cy={cy} r={r} fill={color} stroke={strokeColor} strokeWidth={strokeWidth / zoom} />
        
        {/* Cross hatch inside to denote cutout (only if not small) */}
        {r * 2 * zoom >= SMALL_ELEMENT_THRESHOLD && (
          <>
            <line x1={cx - r * 0.7} y1={cy - r * 0.7} x2={cx + r * 0.7} y2={cy + r * 0.7} stroke="#ced4da" strokeWidth={1 / zoom} strokeDasharray="4 4" />
            <line x1={cx + r * 0.7} y1={cy - r * 0.7} x2={cx - r * 0.7} y2={cy + r * 0.7} stroke="#ced4da" strokeWidth={1 / zoom} strokeDasharray="4 4" />
          </>
        )}
        
        <SmallElementLabel
          elementId={element.id}
          cx={cx}
          cy={cy}
          worldWidth={element.diameter ?? 100}
          worldHeight={element.diameter ?? 100}
          zoom={zoom}
          title={label}
          subtitle={`Ø${element.diameter} mm`}
          color={strokeColor}
          selected={selected}
          hovered={hovered}
        />
      </g>
    )
  }

  const w = element.width ?? 200
  const d = element.depth ?? 200
  const rx = shape === 'retangular-arredondado' ? (element.radius ?? 30) : 0
  const cx = pos.x + w / 2

  return (
    <g>
      {/* Hit Area */}
      <rect x={cx - Math.max(w/2, (HIT_AREA_SIZE / 2) / zoom)} y={pos.y + d/2 - Math.max(d/2, (HIT_AREA_SIZE / 2) / zoom)} width={Math.max(w, HIT_AREA_SIZE / zoom)} height={Math.max(d, HIT_AREA_SIZE / zoom)} fill="transparent" />

      {/* Main Rect */}
      <rect 
        x={pos.x} 
        y={pos.y} 
        width={w} 
        height={d} 
        rx={rx} ry={rx} 
        fill={color} stroke={strokeColor} strokeWidth={strokeWidth / zoom} 
      />
      
      {/* Cross hatch inside to denote cutout (only if not small) */}
      {Math.min(w, d) * zoom >= SMALL_ELEMENT_THRESHOLD && (
        <>
          <line x1={pos.x + w * 0.1} y1={pos.y + d * 0.1} x2={pos.x + w * 0.9} y2={pos.y + d * 0.9} stroke="#ced4da" strokeWidth={1 / zoom} strokeDasharray="4 4" />
          <line x1={pos.x + w * 0.9} y1={pos.y + d * 0.1} x2={pos.x + w * 0.1} y2={pos.y + d * 0.9} stroke="#ced4da" strokeWidth={1 / zoom} strokeDasharray="4 4" />
        </>
      )}
      
      <SmallElementLabel
        elementId={element.id}
        cx={cx}
        cy={pos.y + d / 2}
        worldWidth={w}
        worldHeight={d}
        zoom={zoom}
        title={label}
        subtitle={`${w} × ${d} mm`}
        color={strokeColor}
        selected={selected}
        hovered={hovered}
      />
    </g>
  )
}
