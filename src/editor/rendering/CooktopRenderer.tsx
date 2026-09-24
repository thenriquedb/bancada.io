import React from 'react'
import type { CooktopElement } from '../../models/types.ts'

type CooktopRendererProps = {
  element: CooktopElement
  selected: boolean
  hovered: boolean
  hasError?: boolean
}

export const CooktopRenderer: React.FC<CooktopRendererProps> = ({ element, selected, hovered, hasError }) => {
  const { position: pos, width, depth } = element

  const fill = selected ? '#dbeafe' : hovered ? '#fff8e1' : '#fafafa'
  const stroke = hasError ? '#ef4444' : selected ? '#1971c2' : '#555555'
  const strokeW = selected ? 1.5 : 1

  // Burner positions (2×2 grid centered)
  const burnerR = Math.min(width, depth) * 0.12
  const bx1 = pos.x + width * 0.28
  const bx2 = pos.x + width * 0.72
  const by1 = pos.y + depth * 0.28
  const by2 = pos.y + depth * 0.72

  return (
    <g className="element element--cooktop">
      {/* Outer footprint */}
      <rect x={pos.x} y={pos.y} width={width} height={depth}
        fill={fill} stroke={stroke} strokeWidth={strokeW + 0.5} />

      {/* Burners */}
      {[{ x: bx1, y: by1 }, { x: bx2, y: by1 }, { x: bx1, y: by2 }, { x: bx2, y: by2 }].map((b, i) => (
        <g key={i}>
          <circle cx={b.x} cy={b.y} r={burnerR} fill="none" stroke="#888" strokeWidth={1} />
          <circle cx={b.x} cy={b.y} r={burnerR * 0.5} fill="none" stroke="#aaa" strokeWidth={0.8} />
          <circle cx={b.x} cy={b.y} r={burnerR * 0.15} fill="#999" />
        </g>
      ))}

      {/* Label */}
      <text x={pos.x + width / 2} y={pos.y + depth / 2} textAnchor="middle" dominantBaseline="middle"
        fontSize={Math.min(width, depth) * 0.08} fontFamily="Inter, sans-serif" fill="#555"
        stroke="#ffffff" strokeWidth={3} paintOrder="stroke fill" strokeOpacity={0.8}
        style={{ userSelect: 'none', pointerEvents: 'none' }}>
        Cooktop {width}×{depth}
      </text>
    </g>
  )
}
