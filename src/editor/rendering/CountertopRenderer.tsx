import React from 'react'
import type { CountertopElement } from '../../models/types.ts'

type CountertopRendererProps = {
  element: CountertopElement
  selected: boolean
  hovered: boolean
}

/**
 * SVG renderer for countertop elements.
 * Renders both straight and L-shape geometries.
 */
export const CountertopRenderer: React.FC<CountertopRendererProps> = ({
  element,
  selected,
  hovered,
}) => {
  const { position: pos, geometry, material } = element

  const fillColor = selected
    ? '#dbeafe'
    : hovered
      ? '#eff6ff'
      : '#f8f6f0'

  const strokeColor = selected ? '#1971c2' : '#555555'
  const strokeWidth = selected ? 7 : 6

  // ── Pattern ID for stone texture ──────────────────────────────────────────
  const patternId = `granite-${element.id}`

  if (geometry.type === 'reta') {
    const { width, depth } = geometry
    return (
      <g className="element element--countertop">
        <defs>
          <pattern id={patternId} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <line x1="0" y1="20" x2="20" y2="0" stroke="rgba(0,0,0,0.04)" strokeWidth="0.8" />
            <line x1="-5" y1="5" x2="5" y2="-5" stroke="rgba(0,0,0,0.03)" strokeWidth="0.8" />
            <line x1="15" y1="25" x2="25" y2="15" stroke="rgba(0,0,0,0.03)" strokeWidth="0.8" />
          </pattern>
        </defs>

        {/* Stone surface */}
        <rect
          x={pos.x} y={pos.y} width={width} height={depth}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          rx={0}
        />
        {/* Texture overlay */}
        {!selected && (
          <rect x={pos.x} y={pos.y} width={width} height={depth}
            fill={`url(#${patternId})`} pointerEvents="none" />
        )}



      </g>
    )
  }

  if (geometry.type === 'l-shape') {
    const { segmentA, segmentB } = geometry
    const totalH = segmentA.depth + segmentB.depth
    const maxW = Math.max(segmentA.width, segmentB.width)

    // L-shape polygon points
    const pts = [
      [pos.x, pos.y],
      [pos.x + segmentA.width, pos.y],
      [pos.x + segmentA.width, pos.y + segmentA.depth],
      [pos.x + segmentB.width, pos.y + segmentA.depth],
      [pos.x + segmentB.width, pos.y + totalH],
      [pos.x, pos.y + totalH],
    ]
    const pointsStr = pts.map(([x, y]) => `${x},${y}`).join(' ')

    return (
      <g className="element element--countertop">
        <defs>
          <pattern id={patternId} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <line x1="0" y1="20" x2="20" y2="0" stroke="rgba(0,0,0,0.04)" strokeWidth="0.8" />
          </pattern>
        </defs>

        <polygon
          points={pointsStr}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="miter"
        />
        {!selected && (
          <polygon points={pointsStr} fill={`url(#${patternId})`} pointerEvents="none" />
        )}

      </g>
    )
  }

  return null
}

