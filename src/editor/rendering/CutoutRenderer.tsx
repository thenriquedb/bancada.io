import React from 'react'
import type { CutoutElement } from '../../models/types.ts'

type CutoutRendererProps = {
  element: CutoutElement
  selected: boolean
  hovered: boolean
  zoom: number
}

export const CutoutRenderer: React.FC<CutoutRendererProps> = ({ element, selected, hovered, zoom }) => {
  const { shape, position: pos } = element

  const strokeColor = selected ? '#1971c2' : hovered ? '#339af0' : '#868e96'
  const strokeWidth = selected ? 2 : 1.5

  if (shape === 'circular') {
    const r = (element.diameter ?? 100) / 2
    const cx = pos.x + r
    const cy = pos.y + r

    return (
      <g>
        {/* Fill the background with canvas color or transparent so it looks like a hole */}
        <circle cx={cx} cy={cy} r={r} fill="#ffffff" stroke={strokeColor} strokeWidth={strokeWidth} />
        {/* Cross hatch inside to denote cutout */}
        <line x1={cx - r * 0.7} y1={cy - r * 0.7} x2={cx + r * 0.7} y2={cy + r * 0.7} stroke="#ced4da" strokeWidth={1} strokeDasharray="4 4" />
        <line x1={cx + r * 0.7} y1={cy - r * 0.7} x2={cx - r * 0.7} y2={cy + r * 0.7} stroke="#ced4da" strokeWidth={1} strokeDasharray="4 4" />
        
        <text x={cx} y={cy + r + 24} textAnchor="middle"
          fontSize={Math.max(r * 0.25, 12 / zoom)} fontFamily="Inter, sans-serif" fill="#495057" fontWeight="600"
          style={{ userSelect: 'none', pointerEvents: 'none' }}>
          RECORTE
          <tspan x={cx} dy={Math.max(r * 0.3, 16 / zoom)} fontWeight="400" fontSize={Math.max(r * 0.2, 10 / zoom)} fill="#868e96">Ø{element.diameter} mm</tspan>
        </text>
      </g>
    )
  }

  const w = element.width ?? 200
  const d = element.depth ?? 200
  const rx = shape === 'retangular-arredondado' ? (element.radius ?? 30) : 0
  const cx = pos.x + w / 2
  const cy = pos.y + d / 2

  return (
    <g>
      <rect x={pos.x} y={pos.y} width={w} height={d} rx={rx} ry={rx} fill="#ffffff" stroke={strokeColor} strokeWidth={strokeWidth} />
      {/* Cross hatch inside to denote cutout */}
      <line x1={pos.x + w * 0.1} y1={pos.y + d * 0.1} x2={pos.x + w * 0.9} y2={pos.y + d * 0.9} stroke="#ced4da" strokeWidth={1} strokeDasharray="4 4" />
      <line x1={pos.x + w * 0.9} y1={pos.y + d * 0.1} x2={pos.x + w * 0.1} y2={pos.y + d * 0.9} stroke="#ced4da" strokeWidth={1} strokeDasharray="4 4" />
      
      <text x={cx} y={pos.y + d + 24} textAnchor="middle"
        fontSize={Math.max(Math.min(w, d) * 0.1, 12 / zoom)} fontFamily="Inter, sans-serif" fill="#495057" fontWeight="600"
        style={{ userSelect: 'none', pointerEvents: 'none' }}>
        RECORTE
        <tspan x={cx} dy={Math.max(Math.min(w, d) * 0.12, 16 / zoom)} fontWeight="400" fontSize={Math.max(Math.min(w, d) * 0.08, 10 / zoom)} fill="#868e96">{w} × {d} mm</tspan>
      </text>
    </g>
  )
}
