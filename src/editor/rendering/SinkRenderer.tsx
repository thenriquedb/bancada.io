import React from 'react'
import type { SinkElement } from '../../models/types.ts'

type SinkRendererProps = {
  element: SinkElement
  selected: boolean
  hovered: boolean
  hasError?: boolean
  zoom?: number
}

export const SinkRenderer: React.FC<SinkRendererProps> = ({ element, selected, hovered, hasError, zoom = 1 }) => {
  const { position: pos, width, depth } = element

  const outerFill = selected ? '#dbeafe' : hovered ? '#eff6ff' : '#c8e6fa'
  const stroke = hasError ? '#ef4444' : selected ? '#1971c2' : '#666666'
  const strokeW = selected ? 1.5 : 1

  // Center of the element
  const cx = pos.x + width / 2
  const cy = pos.y + depth / 2

  const cornerR = Math.min(width, depth) * 0.12
  const innerMargin = 30 // 3cm rim
  
  const innerW = Math.max(10, width - innerMargin * 2)
  const innerD = Math.max(10, depth - innerMargin * 2)
  const innerCornerR = Math.min(innerW, innerD) * 0.15

  const gradId = `sink-grad-${element.id}`
  const bowlGradId = `sink-bowl-${element.id}`

  return (
    <g 
      className="element element--sink"
      transform={element.rotation ? `rotate(${element.rotation} ${cx} ${cy})` : undefined}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={selected ? '#dbeafe' : '#e2e2e2'} />
          <stop offset="50%" stopColor={selected ? '#bfdbfe' : '#f5f5f5'} />
          <stop offset="100%" stopColor={selected ? '#93c5fd' : '#d4d4d4'} />
        </linearGradient>
        <radialGradient id={bowlGradId} cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor={selected ? '#93c5fd' : '#d4d4d4'} />
          <stop offset="80%" stopColor={selected ? '#bfdbfe' : '#ececec'} />
          <stop offset="100%" stopColor={selected ? '#dbeafe' : '#f8f8f8'} />
        </radialGradient>
        <filter id={`shadow-${element.id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
        </filter>
        <filter id={`inner-shadow-${element.id}`}>
          <feOffset dx="0" dy="4"/>
          <feGaussianBlur stdDeviation="5" result="offset-blur"/>
          <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse"/>
          <feFlood floodColor="black" floodOpacity="0.2" result="color"/>
          <feComposite operator="in" in="color" in2="inverse" result="shadow"/>
          <feComposite operator="over" in="shadow" in2="SourceGraphic"/>
        </filter>
      </defs>

      {/* Outer bounds (rim) */}
      <rect x={pos.x} y={pos.y} width={width} height={depth} rx={cornerR}
        fill={`url(#${gradId})`} stroke={stroke} strokeWidth={strokeW} filter={`url(#shadow-${element.id})`} />

      {/* Inner bowl */}
      <rect x={pos.x + innerMargin} y={pos.y + innerMargin} width={innerW} height={innerD} rx={innerCornerR}
        fill={`url(#${bowlGradId})`} stroke="#c0c0c0" strokeWidth="1" filter={`url(#inner-shadow-${element.id})`} />

      {/* Drain */}
      <circle cx={cx} cy={cy} r={45} fill="#333" stroke="#aaa" strokeWidth={3} />
      <circle cx={cx} cy={cy} r={35} fill="#555" />
      {/* Drain grill lines */}
      <line x1={cx - 20} y1={cy} x2={cx + 20} y2={cy} stroke="#aaa" strokeWidth={2} />
      <line x1={cx} y1={cy - 20} x2={cx} y2={cy + 20} stroke="#aaa" strokeWidth={2} />
      <line x1={cx - 14} y1={cy - 14} x2={cx + 14} y2={cy + 14} stroke="#aaa" strokeWidth={2} />
      <line x1={cx - 14} y1={cy + 14} x2={cx + 14} y2={cy - 14} stroke="#aaa" strokeWidth={2} />

      {/* Label */}
      <text x={cx} y={pos.y + depth - innerMargin / 2} textAnchor="middle" dominantBaseline="middle"
        fontSize={Math.max(Math.min(width, depth) * 0.1, 10 / zoom)} fontFamily="Inter, sans-serif" fill="#555"
        stroke="#ffffff" strokeWidth={3} paintOrder="stroke fill" strokeOpacity={0.8}
        style={{ userSelect: 'none', pointerEvents: 'none' }}>
        Cuba {width}×{depth}
      </text>
    </g>
  )
}
