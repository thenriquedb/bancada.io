import React from 'react'
import type { SinkElement } from '../../models/types.ts'

type SinkRendererProps = {
  element: SinkElement
  selected: boolean
  hovered: boolean
  hasError?: boolean
}

export const SinkRenderer: React.FC<SinkRendererProps> = ({ element, selected, hovered, hasError }) => {
  const { position: pos, width, depth } = element

  const outerFill = selected ? '#dbeafe' : hovered ? '#eff6ff' : '#c8e6fa'
  const stroke = hasError ? '#ef4444' : selected ? '#1971c2' : '#666666'
  const strokeW = selected ? 1.5 : 1

  // Center of the element
  const cx = pos.x + width / 2
  const cy = pos.y + depth / 2

  const cornerR = Math.min(width, depth) * 0.12

  return (
    <g className="element element--sink">
      {/* Outer bounds */}
      <rect x={pos.x} y={pos.y} width={width} height={depth} rx={cornerR}
        fill={outerFill} stroke={stroke} strokeWidth={strokeW + 0.5} />

      {/* Drain indicator (Centralized circle) */}
      <circle cx={cx} cy={cy} r={Math.min(width, depth) * 0.08} fill="none"
        stroke="#999" strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={Math.min(width, depth) * 0.03} fill="#bbb" />

      {/* Label */}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
        fontSize={Math.min(width, depth) * 0.09} fontFamily="Inter, sans-serif" fill="#555"
        stroke="#ffffff" strokeWidth={3} paintOrder="stroke fill" strokeOpacity={0.8}
        style={{ userSelect: 'none', pointerEvents: 'none' }}>
        Cuba {width}×{depth}
      </text>
    </g>
  )
}
