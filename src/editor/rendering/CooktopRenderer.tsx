import React from 'react'
import type { CooktopElement } from '../../models/types.ts'
import { COOKTOP_FILL, COOKTOP_STROKE } from './constants.ts'

type CooktopRendererProps = {
  element: CooktopElement
  selected: boolean
  hovered: boolean
  hasError?: boolean
  zoom?: number
}

export const CooktopRenderer: React.FC<CooktopRendererProps> = ({ element, selected, hovered, hasError, zoom = 1 }) => {
  const { position: pos, width, depth, cutWidth = width, cutDepth = depth, displayMode = 'cooktop' } = element

  const fill = selected ? '#dbeafe' : hovered ? '#fff8e1' : COOKTOP_FILL
  const stroke = hasError ? '#ef4444' : selected ? '#1971c2' : hovered ? '#fcc419' : COOKTOP_STROKE
  const strokeW = selected ? 2 : 1.5

  const cornerR = Math.min(width, depth) * 0.05
  const cx = pos.x + width / 2
  const cy = pos.y + depth / 2

  if (displayMode === 'cutout') {
    const cw = cutWidth || width
    const cd = cutDepth || depth
    const cxRect = cx - cw / 2
    const cyRect = cy - cd / 2

    return (
      <g 
        className="element element--cooktop-cutout"
        transform={element.rotation ? `rotate(${element.rotation} ${cx} ${cy})` : undefined}
      >
        {/* Invisible hit area for the full cooktop size */}
        <rect x={pos.x} y={pos.y} width={width} height={depth} fill="transparent" />
        
        {/* Cutout visual */}
        <rect x={cxRect} y={cyRect} width={cw} height={cd} rx={cornerR}
          fill={fill} stroke={stroke} strokeWidth={strokeW} strokeDasharray="5 5" />
        
        {/* Label */}
        <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="middle"
          fontSize={14 / zoom} fontFamily="Inter, sans-serif" fill="#1e293b"
          style={{ userSelect: 'none', pointerEvents: 'none', fontWeight: 600 }}
          stroke="#ffffff" strokeWidth={3 / zoom} paintOrder="stroke fill" strokeOpacity={0.8}>
          NICHO COOKTOP
          <tspan x={cx} dy={16 / zoom} fontWeight="400" fontSize={11 / zoom} fill="#475569">{cw} × {cd} mm</tspan>
        </text>
      </g>
    )
  }

  // Burner positions (2×2 grid centered)
  const burnerR = Math.min(width, depth) * 0.15
  const bx1 = pos.x + width * 0.28
  const bx2 = pos.x + width * 0.72
  const by1 = pos.y + depth * 0.28
  const by2 = pos.y + depth * 0.72

  return (
    <g 
      className="element element--cooktop"
      transform={element.rotation ? `rotate(${element.rotation} ${cx} ${cy})` : undefined}
    >
      {/* Outer footprint */}
      <rect x={pos.x} y={pos.y} width={width} height={depth} rx={cornerR}
        fill={fill} stroke={stroke} strokeWidth={strokeW} />

      {/* Burners - Simple vector stroke */}
      {[{ x: bx1, y: by1 }, { x: bx2, y: by1 }, { x: bx1, y: by2 }, { x: bx2, y: by2 }].map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r={burnerR} fill="transparent" stroke={stroke} strokeWidth={1} opacity={0.5} />
      ))}

      {/* Controls (Small dots at bottom) */}
      <circle cx={pos.x + width / 2 - 20} cy={pos.y + depth - 20} r={4} fill={stroke} opacity={0.6} />
      <circle cx={pos.x + width / 2} cy={pos.y + depth - 20} r={4} fill={stroke} opacity={0.6} />
      <circle cx={pos.x + width / 2 + 20} cy={pos.y + depth - 20} r={4} fill={stroke} opacity={0.6} />

      {/* Label */}
      <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="middle"
        fontSize={14 / zoom} fontFamily="Inter, sans-serif" fill="#1e293b"
        style={{ userSelect: 'none', pointerEvents: 'none', fontWeight: 600 }}
        stroke="#ffffff" strokeWidth={3 / zoom} paintOrder="stroke fill" strokeOpacity={0.8}>
        COOKTOP
        <tspan x={cx} dy={16 / zoom} fontWeight="400" fontSize={11 / zoom} fill="#475569">{width} × {depth} mm</tspan>
      </text>
    </g>
  )
}

