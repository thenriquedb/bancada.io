import React from 'react'
import type { ProjectElement, CountertopElement } from '../../models/types.ts'
import { getElementBounds } from '../geometry/bounds.ts'
import { getLHandles } from '../geometry/lshapeHandles.ts'
import type { LHandleInfo } from '../geometry/lshapeHandles.ts'

type SelectionOverlayProps = {
  elements:       ProjectElement[]
  selectedIds:    string[]
  zoom:           number
  panX:           number
  panY:           number
  hoveredHandle:  string | null          // "elId:handleName"
  onHandleEnter:  (key: string) => void
  onHandleLeave:  () => void
}

const HANDLE_SIZE  = 10
const HALF         = HANDLE_SIZE / 2
const EDGE_W       = 10
const EDGE_H       = 26
const CORNER_COLOR = '#1971c2'
const EDGE_COLOR   = '#339af0'

// ─── Standard (bounding-box) handles ─────────────────────────────────────────

type HandleDef = {
  name:   string
  cx:     number
  cy:     number
  cursor: string
  edge:   boolean
}

function makeStdHandles(
  sx: number, sy: number, sw: number, sh: number
): HandleDef[] {
  return [
    { name: 'nw', cx: sx,        cy: sy,        cursor: 'nw-resize', edge: false },
    { name: 'ne', cx: sx + sw,   cy: sy,        cursor: 'ne-resize', edge: false },
    { name: 'se', cx: sx + sw,   cy: sy + sh,   cursor: 'se-resize', edge: false },
    { name: 'sw', cx: sx,        cy: sy + sh,   cursor: 'sw-resize', edge: false },
    { name: 'n',  cx: sx + sw/2, cy: sy,        cursor: 'n-resize',  edge: true  },
    { name: 's',  cx: sx + sw/2, cy: sy + sh,   cursor: 's-resize',  edge: true  },
    { name: 'e',  cx: sx + sw,   cy: sy + sh/2, cursor: 'e-resize',  edge: true  },
    { name: 'w',  cx: sx,        cy: sy + sh/2, cursor: 'w-resize',  edge: true  },
  ]
}

// ─── Render a single handle ───────────────────────────────────────────────────

const HandleRect: React.FC<{
  cx: number; cy: number
  cursor: string
  hovered: boolean
  edge: boolean
  isHoriz?: boolean
  onEnter: () => void
  onLeave: () => void
}> = ({ cx, cy, cursor, hovered, edge, isHoriz = false, onEnter, onLeave }) => {
  if (edge) {
    const rw = isHoriz ? EDGE_H : EDGE_W
    const rh = isHoriz ? EDGE_W : EDGE_H
    return (
      <rect
        x={cx - rw / 2} y={cy - rh / 2}
        width={rw} height={rh} rx={3}
        fill={hovered ? CORNER_COLOR : EDGE_COLOR}
        stroke="white" strokeWidth={1.5}
        opacity={hovered ? 1 : 0.8}
        style={{ cursor, transition: 'opacity 0.1s, fill 0.1s' }}
        pointerEvents="all"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      />
    )
  }
  return (
    <g>
      {/* Drop shadow */}
      <rect x={cx - HALF + 1} y={cy - HALF + 1} width={HANDLE_SIZE} height={HANDLE_SIZE}
        rx={2} fill="rgba(0,0,0,0.18)" pointerEvents="none" />
      <rect
        x={cx - HALF} y={cy - HALF}
        width={HANDLE_SIZE} height={HANDLE_SIZE} rx={2}
        fill={hovered ? CORNER_COLOR : 'white'}
        stroke={CORNER_COLOR} strokeWidth={2}
        style={{ cursor, transition: 'fill 0.1s' }}
        pointerEvents="all"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      />
    </g>
  )
}

// ─── Main overlay ─────────────────────────────────────────────────────────────

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  elements, selectedIds, zoom, panX, panY, hoveredHandle, onHandleEnter, onHandleLeave,
}) => {
  if (selectedIds.length === 0) return null

  const selectedElements = elements.filter((el) => selectedIds.includes(el.id))

  return (
    <>
      {selectedElements.map((el) => {
        const bounds = getElementBounds(el)
        if (!bounds) return null

        const sx = bounds.x * zoom + panX
        const sy = bounds.y * zoom + panY
        const sw = bounds.width  * zoom
        const sh = bounds.height * zoom

        const isLShape =
          el.type === 'countertop' &&
          (el as CountertopElement).geometry.type === 'l-shape'

        // ── L-shape: custom polygon-edge handles ─────────────────────────
        if (isLShape) {
          const g = (el as CountertopElement).geometry
          if (g.type !== 'l-shape') return null
          const { segmentA: sA, segmentB: sB } = g
          const { x: px, y: py } = el.position

          const lHandles: LHandleInfo[] = getLHandles(
            px, py, sA.width, sA.depth, sB.width, sB.depth,
            zoom, panX, panY
          )

          // Build the polygon outline in screen coords
          const pts = [
            [px * zoom + panX,           py * zoom + panY],
            [(px + sA.width) * zoom + panX, py * zoom + panY],
            [(px + sA.width) * zoom + panX, (py + sA.depth) * zoom + panY],
            [(px + sB.width) * zoom + panX, (py + sA.depth) * zoom + panY],
            [(px + sB.width) * zoom + panX, (py + sA.depth + sB.depth) * zoom + panY],
            [px * zoom + panX,           (py + sA.depth + sB.depth) * zoom + panY],
          ].map(([x, y]) => `${x},${y}`).join(' ')

          return (
            <g key={el.id} className="selection-overlay selection-overlay--lshape">
              {/* Polygon outline */}
              <polygon
                points={pts}
                fill="none"
                stroke={CORNER_COLOR}
                strokeWidth={1.5}
                strokeDasharray="5 3"
                pointerEvents="none"
              />

              {/* L-shape specific handles */}
              {lHandles.map((h) => {
                const key     = `${el.id}:${h.name}`
                const hovered = hoveredHandle === key
                const isHoriz = h.name === 's-a' || h.name === 's-b'

                return (
                  <HandleRect
                    key={h.name}
                    cx={h.sx} cy={h.sy}
                    cursor={h.cursor}
                    hovered={hovered}
                    edge={h.edge}
                    isHoriz={isHoriz}
                    onEnter={() => onHandleEnter(key)}
                    onLeave={onHandleLeave}
                  />
                )
              })}

              {/* Dimension hint labels */}
              <LShapeHints
                px={px} py={py}
                aW={sA.width} aD={sA.depth}
                bW={sB.width} bD={sB.depth}
                zoom={zoom} panX={panX} panY={panY}
              />
            </g>
          )
        }

        // ── Standard bounding-box handles ────────────────────────────────
        const resizable = el.type === 'countertop' || el.type === 'sink' ||
          el.type === 'cooktop' || el.type === 'wet-area' || el.type === 'backsplash' || el.type === 'cutout'

        const handles: HandleDef[] = resizable ? makeStdHandles(sx, sy, sw, sh) : []

        return (
          <g key={el.id} className="selection-overlay">
            <rect x={sx} y={sy} width={sw} height={sh}
              fill="none" stroke={CORNER_COLOR} strokeWidth={1.5}
              strokeDasharray="5 3" pointerEvents="none" />

            {handles.map((h) => {
              const key     = `${el.id}:${h.name}`
              const hovered = hoveredHandle === key
              const isHoriz = h.name === 'n' || h.name === 's'
              return (
                <HandleRect
                  key={h.name}
                  cx={h.cx} cy={h.cy}
                  cursor={h.cursor}
                  hovered={hovered}
                  edge={h.edge}
                  isHoriz={isHoriz}
                  onEnter={() => onHandleEnter(key)}
                  onLeave={onHandleLeave}
                />
              )
            })}
          </g>
        )
      })}
    </>
  )
}

// ─── Dimension hint labels on L-shape ────────────────────────────────────────

const LShapeHints: React.FC<{
  px: number; py: number
  aW: number; aD: number; bW: number; bD: number
  zoom: number; panX: number; panY: number
}> = ({ px, py, aW, aD, bW, bD, zoom, panX, panY }) => {
  const fmtCm = (mm: number) => `${(mm / 10).toFixed(0)}cm`
  const t = (wx: number, wy: number) => ({ x: wx * zoom + panX, y: wy * zoom + panY })

  const aWMid  = t(px + aW / 2,             py)
  const aDMid  = t(px + aW,                 py + aD / 2)
  const bWMid  = t(px + bW / 2,             py + aD + bD)
  const bDMid  = t(px + bW,                 py + aD + bD / 2)

  const style: React.CSSProperties = {
    fontSize: 11,
    fontFamily: 'Inter, sans-serif',
    userSelect: 'none',
    pointerEvents: 'none',
  }

  const bg = 'rgba(255,255,255,0.85)'

  return (
    <g pointerEvents="none" style={style}>
      {/* Seg A width */}
      <rect x={aWMid.x - 28} y={aWMid.y - 18} width={56} height={14} rx={3} fill={bg} />
      <text x={aWMid.x} y={aWMid.y - 8} textAnchor="middle" fill="#1971c2" fontSize={11}>{fmtCm(aW)}</text>

      {/* Seg A depth */}
      <rect x={aDMid.x + 6} y={aDMid.y - 8} width={44} height={14} rx={3} fill={bg} />
      <text x={aDMid.x + 10} y={aDMid.y + 4} textAnchor="start" fill="#e67700" fontSize={11}>{fmtCm(aD)}</text>

      {/* Seg B width */}
      <rect x={bWMid.x - 22} y={bWMid.y + 4} width={44} height={14} rx={3} fill={bg} />
      <text x={bWMid.x} y={bWMid.y + 14} textAnchor="middle" fill="#2f9e44" fontSize={11}>{fmtCm(bW)}</text>

      {/* Seg B depth */}
      <rect x={bDMid.x + 6} y={bDMid.y - 8} width={44} height={14} rx={3} fill={bg} />
      <text x={bDMid.x + 10} y={bDMid.y + 4} textAnchor="start" fill="#2f9e44" fontSize={11}>{fmtCm(bD)}</text>
    </g>
  )
}
