import React from 'react'
import type { AutoDimension } from '../geometry/dimensions.ts'

type DimensionRendererProps = {
  dimensions: AutoDimension[]
  zoom: number  // used for text scaling
}

const TICK_SIZE = 8  // mm
const FONT_SIZE = 22 // mm

/**
 * Renders CAD-style dimension lines in world space (mm).
 * Arrow ticks at each end, measurement text centered on the line.
 */
export const DimensionRenderer: React.FC<DimensionRendererProps> = ({ dimensions, zoom }) => {
  return (
    <g className="dimension-layer" pointerEvents="none">
      {dimensions.map((dim) => (
        <DimLine key={dim.id} dim={dim} zoom={zoom} />
      ))}
    </g>
  )
}

type DimLineProps = { dim: AutoDimension; zoom: number }

const DimLine: React.FC<DimLineProps> = ({ dim, zoom }) => {
  const { orientation, kind, startPoint: sp, endPoint: ep, offset, label } = dim

  // Compute the dimension line positions
  let lx1: number, ly1: number, lx2: number, ly2: number
  let mx: number, my: number   // midpoint for text
  let ext1x1: number, ext1y1: number, ext1x2: number, ext1y2: number
  let ext2x1: number, ext2y1: number, ext2x2: number, ext2y2: number

  if (orientation === 'horizontal') {
    ly1 = sp.y + offset
    ly2 = ep.y + offset
    lx1 = sp.x
    lx2 = ep.x
    mx = (lx1 + lx2) / 2
    my = ly1

    // Extension lines from element to dim line
    ext1x1 = sp.x; ext1y1 = sp.y; ext1x2 = sp.x; ext1y2 = ly1
    ext2x1 = ep.x; ext2y1 = ep.y; ext2x2 = ep.x; ext2y2 = ly2
  } else {
    lx1 = sp.x + offset
    lx2 = ep.x + offset
    ly1 = sp.y
    ly2 = ep.y
    mx = lx1
    my = (ly1 + ly2) / 2

    ext1x1 = sp.x; ext1y1 = sp.y; ext1x2 = lx1; ext1y2 = sp.y
    ext2x1 = ep.x; ext2y1 = ep.y; ext2x2 = lx2; ext2y2 = ep.y
  }

  const dimColor =
    kind === 'countertop' ? '#1971c2' :
    kind === 'element'    ? '#0ca678' :
                            '#e8590c' // gap
  const fontSize = FONT_SIZE
  const tickLen = TICK_SIZE

  // Tick marks (small perpendicular lines at each end)
  const tickProps = orientation === 'horizontal'
    ? { dx: 0, dy: tickLen }
    : { dx: tickLen, dy: 0 }

  return (
    <g className="dimension" opacity={0.9}>
      {/* Extension lines */}
      <line x1={ext1x1} y1={ext1y1} x2={ext1x2} y2={ext1y2}
        stroke={dimColor} strokeWidth={0.8} strokeDasharray="4 2" />
      <line x1={ext2x1} y1={ext2y1} x2={ext2x2} y2={ext2y2}
        stroke={dimColor} strokeWidth={0.8} strokeDasharray="4 2" />

      {/* Dimension line */}
      <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke={dimColor} strokeWidth={1} />

      {/* Tick marks at start */}
      <line x1={lx1 - tickProps.dx / 2} y1={ly1 - tickProps.dy / 2}
            x2={lx1 + tickProps.dx / 2} y2={ly1 + tickProps.dy / 2}
        stroke={dimColor} strokeWidth={1.5} />

      {/* Tick marks at end */}
      <line x1={lx2 - tickProps.dx / 2} y1={ly2 - tickProps.dy / 2}
            x2={lx2 + tickProps.dx / 2} y2={ly2 + tickProps.dy / 2}
        stroke={dimColor} strokeWidth={1.5} />

      {/* Text background for readability */}
      <rect
        x={orientation === 'horizontal' ? mx - (label.length * fontSize * 0.32) : mx - (label.length * fontSize * 0.32) - 4}
        y={orientation === 'horizontal' ? my - fontSize * 0.75 : my - fontSize * 0.4}
        width={label.length * fontSize * 0.64}
        height={fontSize}
        fill="rgba(255,255,255,0.85)"
        rx={2}
      />

      {/* Measurement text */}
      <text
        x={mx} y={my}
        textAnchor="middle"
        dominantBaseline={orientation === 'horizontal' ? 'auto' : 'middle'}
        dy={orientation === 'horizontal' ? -4 : 0}
        fontSize={fontSize}
        fontFamily="JetBrains Mono, monospace"
        fill={dimColor}
        fontWeight="500"
        style={{ userSelect: 'none' }}
      >
        {label}
      </text>
    </g>
  )
}
