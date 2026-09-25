import React from 'react'
import type { CountertopElement } from '../../models/types.ts'
import { COUNTERTOP_FILL, COUNTERTOP_STROKE, COUNTERTOP_STROKE_WIDTH, COUNTERTOP_STROKE_WIDTH_SELECTED } from './constants.ts'

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
  const { position: pos, geometry } = element

  const fillColor = selected
    ? '#dbeafe'
    : hovered
      ? '#eff6ff'
      : COUNTERTOP_FILL

  const strokeColor = selected ? '#1971c2' : COUNTERTOP_STROKE
  const strokeWidth = selected ? COUNTERTOP_STROKE_WIDTH_SELECTED : COUNTERTOP_STROKE_WIDTH

  if (geometry.type === 'reta') {
    const { width, depth } = geometry
    return (
      <g className="element element--countertop">
        <rect
          x={pos.x} y={pos.y} width={width} height={depth}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          rx={0}
        />
      </g>
    )
  }

  if (geometry.type === 'l-shape') {
    const { segmentA, segmentB } = geometry
    const totalH = segmentA.depth + segmentB.depth

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
        <polygon
          points={pointsStr}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="miter"
        />
      </g>
    )
  }

  return null
}

