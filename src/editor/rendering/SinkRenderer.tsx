import React from 'react'
import type { SinkElement } from '../../models/types.ts'
import { SINK_FILL, SINK_STROKE } from './constants.ts'

type SinkRendererProps = {
  element: SinkElement
  selected: boolean
  hovered: boolean
  hasError?: boolean
  zoom?: number
}

export const SinkRenderer: React.FC<SinkRendererProps> = ({ element, selected, hovered, hasError, zoom = 1 }) => {
  const { position: pos, width, depth } = element

  const fill = selected ? '#dbeafe' : hovered ? '#e7f5ff' : SINK_FILL
  const stroke = hasError ? '#ef4444' : selected ? '#1971c2' : hovered ? '#339af0' : SINK_STROKE
  const strokeW = selected ? 2 : 1.5

  // Center of the element
  const cx = pos.x + width / 2
  const cy = pos.y + depth / 2

  const cornerR = Math.min(width, depth) * 0.12
  const innerMargin = 30 // 3cm rim
  
  const innerW = Math.max(10, width - innerMargin * 2)
  const innerD = Math.max(10, depth - innerMargin * 2)
  const innerCornerR = Math.min(innerW, innerD) * 0.15

  return (
    <g 
      className="element element--sink"
      transform={element.rotation ? `rotate(${element.rotation} ${cx} ${cy})` : undefined}
    >
      {/* Outer bounds (rim) */}
      <rect x={pos.x} y={pos.y} width={width} height={depth} rx={cornerR}
        fill={fill} stroke={stroke} strokeWidth={strokeW} />

      {/* Inner bowl */}
      <rect x={pos.x + innerMargin} y={pos.y + innerMargin} width={innerW} height={innerD} rx={innerCornerR}
        fill="transparent" stroke={stroke} strokeWidth="1" opacity={0.5} strokeDasharray="4 4" />

      {/* Drain */}
      <circle cx={cx} cy={cy} r={20} fill="transparent" stroke={stroke} strokeWidth={1} opacity={0.6} />
      <circle cx={cx} cy={cy} r={8} fill={stroke} opacity={0.4} />

      {/* Label */}
      <text x={cx} y={pos.y + depth - innerMargin + 5} textAnchor="middle" dominantBaseline="middle"
        fontSize={Math.max(Math.min(width, depth) * 0.08, 12 / zoom)} fontFamily="Inter, sans-serif" fill="#495057"
        stroke="#ffffff" strokeWidth={3} paintOrder="stroke fill" strokeOpacity={0.8} fontWeight="600"
        style={{ userSelect: 'none', pointerEvents: 'none' }}>
        CUBA
        <tspan x={cx} dy={Math.max(Math.min(width, depth) * 0.1, 16 / zoom)} fontWeight="400" fontSize={Math.max(Math.min(width, depth) * 0.06, 10 / zoom)} fill="#868e96">{width} × {depth} mm</tspan>
      </text>
    </g>
  )
}
