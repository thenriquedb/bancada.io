import React, { useMemo } from 'react'
import type { AutoDimension } from '../geometry/dimensions.ts'
import {
  PRIMARY_DIMENSION_STROKE_WIDTH,
  DIMENSION_COLOR_PRIMARY,
  DIMENSION_COLOR_ELEMENT,
  DIMENSION_COLOR_POSITION
} from './constants.ts'

type DimensionRendererProps = {
  dimensions: AutoDimension[]
  zoom: number  // used for text scaling
}

/**
 * Renders CAD-style dimension lines in world space (mm).
 * Incorporates a visual layout system to avoid collisions and apply hierarchy.
 */
export const DimensionRenderer: React.FC<DimensionRendererProps> = ({ dimensions, zoom }) => {
  // Simple heuristic collision resolution
  const visualDims = useMemo(() => {
    const vDims = dimensions.map(d => {
      const isPrimary = d.kind === 'countertop'
      // Create visual 'bands' by pushing primary dimensions further out
      const extraOffset = isPrimary ? (d.offset > 0 ? 50 : -50) : 0
      return {
        ...d,
        isPrimary,
        visualOffset: d.offset + extraOffset,
        textNudge: 0
      }
    })

    // Sort: primary first, so secondary yields to primary
    vDims.sort((a, b) => (a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1))

    const boxes: { minX: number; maxX: number; minY: number; maxY: number }[] = []

    const FONT_EST_W = 12 / zoom
    const FONT_EST_H = 16 / zoom

    for (const dim of vDims) {
      let resolved = false
      let nudge = 0
      let pushOut = 0
      const maxTries = 10

      for (let i = 0; i < maxTries; i++) {
        let mx, my
        if (dim.orientation === 'horizontal') {
          mx = (dim.startPoint.x + dim.endPoint.x) / 2 + nudge
          my = dim.startPoint.y + dim.visualOffset + pushOut
        } else {
          mx = dim.startPoint.x + dim.visualOffset + pushOut
          my = (dim.startPoint.y + dim.endPoint.y) / 2 + nudge
        }

        const tw = dim.label.length * FONT_EST_W
        const th = FONT_EST_H
        const box = {
          minX: mx - tw / 2 - 10,
          maxX: mx + tw / 2 + 10,
          minY: my - th / 2 - 10,
          maxY: my + th / 2 + 10
        }

        const conflict = boxes.some(b => 
          box.minX < b.maxX && box.maxX > b.minX &&
          box.minY < b.maxY && box.maxY > b.minY
        )

        if (!conflict) {
          boxes.push(box)
          dim.textNudge = nudge
          dim.visualOffset += pushOut
          resolved = true
          break
        }

        // Alternate nudging
        if (dim.orientation === 'horizontal') {
          nudge = (i % 2 === 0 ? 1 : -1) * (Math.floor(i / 2) * 30)
          if (i > 5) pushOut += (dim.visualOffset > 0 ? 20 : -20)
        } else {
          nudge = (i % 2 === 0 ? 1 : -1) * (Math.floor(i / 2) * 30)
          if (i > 5) pushOut += (dim.visualOffset > 0 ? 20 : -20)
        }
      }
    }
    return vDims
  }, [dimensions, zoom])

  return (
    <g className="dimension-layer" pointerEvents="none">
      {visualDims.map((dim) => (
        <g key={dim.id} data-countertop-id={dim.countertopId}>
          <DimLine dim={dim} zoom={zoom} />
        </g>
      ))}
    </g>
  )
}

type DimLineProps = { dim: AutoDimension & { isPrimary: boolean; visualOffset: number; textNudge: number }; zoom: number }

const DimLine: React.FC<DimLineProps> = ({ dim, zoom }) => {
  const { orientation, isPrimary, startPoint: sp, endPoint: ep, visualOffset, textNudge, label } = dim

  let lx1: number, ly1: number, lx2: number, ly2: number
  let mx: number, my: number
  let ext1x1: number, ext1y1: number, ext1x2: number, ext1y2: number
  let ext2x1: number, ext2y1: number, ext2x2: number, ext2y2: number

  if (orientation === 'horizontal') {
    ly1 = sp.y + visualOffset
    ly2 = ep.y + visualOffset
    lx1 = sp.x
    lx2 = ep.x
    mx = (lx1 + lx2) / 2 + textNudge
    my = ly1

    ext1x1 = sp.x; ext1y1 = sp.y; ext1x2 = sp.x; ext1y2 = ly1
    ext2x1 = ep.x; ext2y1 = ep.y; ext2x2 = ep.x; ext2y2 = ly2
  } else {
    lx1 = sp.x + visualOffset
    lx2 = ep.x + visualOffset
    ly1 = sp.y
    ly2 = ep.y
    mx = lx1
    my = (ly1 + ly2) / 2 + textNudge

    ext1x1 = sp.x; ext1y1 = sp.y; ext1x2 = lx1; ext1y2 = sp.y
    ext2x1 = ep.x; ext2y1 = ep.y; ext2x2 = lx2; ext2y2 = ep.y
  }

  // Hierarchy: main (overall) > dimension (element size, "how big") > position (gap, "how far")
  const isPosition = dim.kind === 'gap'
  const dimColor = isPrimary ? DIMENSION_COLOR_PRIMARY : isPosition ? DIMENSION_COLOR_POSITION : DIMENSION_COLOR_ELEMENT
  const fontSize = Math.max(isPrimary ? 24 : isPosition ? 15 : 20, 12 / zoom)
  const tickLen = Math.max(isPosition ? 8 : 12, 6 / zoom)
  const strokeDim = Math.max(isPrimary ? PRIMARY_DIMENSION_STROKE_WIDTH : isPosition ? 0.6 : 1.2, 1 / zoom)
  const strokeTick = Math.max(isPrimary ? 3 : isPosition ? 1.2 : 2.2, 1.5 / zoom)
  const strokeExt = Math.max(isPosition ? 0.6 : 1, 0.8 / zoom)
  const textWeight = isPrimary ? '700' : isPosition ? '400' : '600'

  const tickProps = orientation === 'horizontal'
    ? { dx: 0, dy: tickLen }
    : { dx: tickLen, dy: 0 }

  return (
    <g className="dimension" opacity={isPrimary ? 1 : isPosition ? 0.8 : 0.95}>
      <line x1={ext1x1} y1={ext1y1} x2={ext1x2} y2={ext1y2} stroke={dimColor} strokeWidth={strokeExt} strokeDasharray="4 2" opacity={0.5} />
      <line x1={ext2x1} y1={ext2y1} x2={ext2x2} y2={ext2y2} stroke={dimColor} strokeWidth={strokeExt} strokeDasharray="4 2" opacity={0.5} />

      <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke={dimColor} strokeWidth={strokeDim} />

      <line x1={lx1 - tickProps.dx / 2} y1={ly1 - tickProps.dy / 2} x2={lx1 + tickProps.dx / 2} y2={ly1 + tickProps.dy / 2} stroke={dimColor} strokeWidth={strokeTick} />
      <line x1={lx2 - tickProps.dx / 2} y1={ly2 - tickProps.dy / 2} x2={lx2 + tickProps.dx / 2} y2={ly2 + tickProps.dy / 2} stroke={dimColor} strokeWidth={strokeTick} />

      <rect
        x={mx - (label.length * fontSize * 0.32) - 4}
        y={my - fontSize * 0.6}
        width={label.length * fontSize * 0.64 + 8}
        height={fontSize * 1.2}
        fill="rgba(255,255,255,0.9)"
        rx={4}
      />

      <text
        x={mx} y={my}
        textAnchor="middle"
        dominantBaseline="middle"
        dy={1}
        fontSize={fontSize}
        fontFamily="Inter, sans-serif"
        fill={dimColor}
        fontWeight={textWeight}
        style={{ userSelect: 'none' }}
      >
        {label}
      </text>
    </g>
  )
}
