import React from 'react'
import type { SinkElement } from '../../models/types.ts'

type SinkRendererProps = {
  element: SinkElement
  selected: boolean
  hovered: boolean
}

export const SinkRenderer: React.FC<SinkRendererProps> = ({ element, selected, hovered }) => {
  const { position: pos, width, depth, cutWidth, cutDepth, cutShape, sinkType } = element

  const outerFill = selected ? '#dbeafe' : hovered ? '#eff6ff' : '#ffffff'
  const stroke = selected ? '#1971c2' : '#666666'
  const strokeW = selected ? 1.5 : 1

  // Center of the element
  const cx = pos.x + width / 2
  const cy = pos.y + depth / 2

  // The cut is centered within the overall dimensions
  const cutX = pos.x + (width - cutWidth) / 2
  const cutY = pos.y + (depth - cutDepth) / 2

  const cornerR = cutShape === 'arredondado' ? Math.min(cutWidth, cutDepth) * 0.12 : 0

  return (
    <g className="element element--sink">
      {/* Outer bounds (equipment footprint) */}
      <rect x={pos.x} y={pos.y} width={width} height={depth}
        fill={outerFill} stroke={stroke} strokeWidth={strokeW} strokeDasharray={selected ? '' : '4 2'} />

      {/* Cut rectangle */}
      <rect x={cutX} y={cutY} width={cutWidth} height={cutDepth} rx={cornerR}
        fill="#c8e6fa" stroke={stroke} strokeWidth={strokeW + 0.5} fillOpacity={0.7} />

      {/* Drain indicator */}
      <circle cx={cx} cy={cy} r={Math.min(cutWidth, cutDepth) * 0.06} fill="none"
        stroke="#999" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={Math.min(cutWidth, cutDepth) * 0.03} fill="#bbb" />

      {/* Undermount dashed indicator */}
      {sinkType === 'undermount' && (
        <rect x={cutX + 8} y={cutY + 8} width={cutWidth - 16} height={cutDepth - 16}
          fill="none" stroke="#1971c2" strokeWidth={1} strokeDasharray="6 3" rx={cornerR} />
      )}

      {/* Label */}
      <text x={cx} y={pos.y + depth + 18} textAnchor="middle"
        fontSize={Math.min(width, depth) * 0.09} fontFamily="Inter, sans-serif" fill="#555"
        style={{ userSelect: 'none', pointerEvents: 'none' }}>
        Cuba {cutWidth}×{cutDepth}
      </text>
    </g>
  )
}
