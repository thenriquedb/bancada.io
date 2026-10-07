import React from 'react'
import type { ArrowElement } from '../../models/types.ts'

type ArrowRendererProps = {
  element: ArrowElement
  selected: boolean
  hovered: boolean
  zoom: number
}

export const ArrowRenderer: React.FC<ArrowRendererProps> = ({ element, selected, hovered, zoom }) => {
  const { position, start, end, color = '#ff0000' } = element

  // Calculate arrow head
  const angle = Math.atan2(end.y - start.y, end.x - start.x)
  const headLen = 15 / zoom
  const h1x = end.x - headLen * Math.cos(angle - Math.PI / 6)
  const h1y = end.y - headLen * Math.sin(angle - Math.PI / 6)
  const h2x = end.x - headLen * Math.cos(angle + Math.PI / 6)
  const h2y = end.y - headLen * Math.sin(angle + Math.PI / 6)

  const strokeWidth = selected ? 3 / zoom : 2 / zoom
  const strokeColor = selected ? '#1971c2' : hovered ? '#339af0' : color

  return (
    <g className="element element--arrow" transform={`translate(${position.x}, ${position.y})`}>
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      <polygon
        points={`${end.x},${end.y} ${h1x},${h1y} ${h2x},${h2y}`}
        fill={strokeColor}
      />
      
      {/* Invisible hit area for easier selection */}
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke="transparent"
        strokeWidth={20 / zoom}
      />
    </g>
  )
}
