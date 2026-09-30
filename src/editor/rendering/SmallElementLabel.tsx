import React from 'react'
import { useEditorStore } from '../../store/editorStore.ts'
import { getElementReferenceBounds } from '../geometry/segments.ts'

export const SMALL_ELEMENT_THRESHOLD = 48 // px on screen
export const MIN_VISUAL_SIZE = 14 // px on screen
export const HIT_AREA_SIZE = 32 // px on screen

type SmallElementLabelProps = {
  elementId: string
  cx: number
  cy: number
  worldWidth: number
  worldHeight: number
  zoom: number
  title: string
  subtitle: string
  color?: string
}

export const SmallElementLabel: React.FC<SmallElementLabelProps> = ({
  elementId,
  cx,
  cy,
  worldWidth,
  worldHeight,
  zoom,
  title,
  subtitle,
  color = '#64748b'
}) => {
  const store = useEditorStore()
  const elements = store.project.elements

  const screenW = worldWidth * zoom
  const screenH = worldHeight * zoom

  const isSmall = screenW < SMALL_ELEMENT_THRESHOLD && screenH < SMALL_ELEMENT_THRESHOLD

  if (!isSmall) {
    // Normal label
    return (
      <text x={cx} y={cy - 6 / zoom} textAnchor="middle" dominantBaseline="middle"
        fontSize={14 / zoom} fontFamily="Inter, sans-serif" fill="#1e293b"
        style={{ userSelect: 'none', pointerEvents: 'none', fontWeight: 600 }}
        stroke="#ffffff" strokeWidth={3 / zoom} paintOrder="stroke fill" strokeOpacity={0.8}>
        {title}
        <tspan x={cx} dy={16 / zoom} fontWeight="400" fontSize={11 / zoom} fill="#475569">{subtitle}</tspan>
      </text>
    )
  }

  // Callout representation
  let dirX = 1 // 1 for right, -1 for left
  
  const el = elements.find(e => e.id === elementId)
  if (el && el.parentId) {
    const parent = elements.find(p => p.id === el.parentId)
    if (parent && parent.type === 'countertop') {
      const refBounds = getElementReferenceBounds(el, parent)
      const midX = (refBounds.left + refBounds.right) / 2
      if (cx > midX) {
        dirX = 1
      } else {
        dirX = -1
      }
    } else if (parent && parent.type === 'wet-area') {
      const pw = parent.width ?? 1000
      if (cx > parent.position.x + pw / 2) {
        dirX = 1
      } else {
        dirX = -1
      }
    }
  }

  // Simple heuristic: stagger vertical position based on other small elements nearby
  let staggerY = 0
  const nearbyThreshold = 150 / zoom
  const smallElements = elements.filter(e => {
    if (e.id === elementId) return false
    const ew = (e as any).diameter ?? (e as any).width ?? 100
    const eh = (e as any).diameter ?? (e as any).depth ?? 100
    return (ew * zoom < SMALL_ELEMENT_THRESHOLD && eh * zoom < SMALL_ELEMENT_THRESHOLD)
  })
  
  // Count how many small elements are close and above us
  for (const other of smallElements) {
    const ox = other.position.x
    const oy = other.position.y
    if (Math.abs(ox - cx) < nearbyThreshold) {
      if (oy < cy && cy - oy < nearbyThreshold) {
        staggerY += 20 / zoom
      }
    }
  }

  const offsetPx = 60
  const offsetWorld = (offsetPx / zoom) * dirX

  const lineX1 = cx
  const lineY1 = cy
  const lineX2 = cx + offsetWorld
  const lineY2 = cy + staggerY

  const textX = lineX2 + (dirX > 0 ? 4 / zoom : -4 / zoom)
  const textY = lineY2

  return (
    <g className="callout" style={{ pointerEvents: 'none', userSelect: 'none' }}>
      {/* Draw a polyline instead of line if staggered */}
      {staggerY === 0 ? (
        <line x1={lineX1} y1={lineY1} x2={lineX2} y2={lineY2} stroke={color} strokeWidth={1 / zoom} />
      ) : (
        <polyline points={`${lineX1},${lineY1} ${lineX1 + offsetWorld * 0.3},${lineY1} ${lineX1 + offsetWorld * 0.7},${lineY2} ${lineX2},${lineY2}`} fill="none" stroke={color} strokeWidth={1 / zoom} />
      )}
      
      <text x={textX} y={textY - 4 / zoom} textAnchor={dirX > 0 ? 'start' : 'end'} dominantBaseline="baseline"
        fontSize={11 / zoom} fontFamily="Inter, sans-serif" fill="#1e293b" fontWeight="600"
        stroke="#ffffff" strokeWidth={3 / zoom} paintOrder="stroke fill">
        {title}
      </text>
      <text x={textX} y={textY + 12 / zoom} textAnchor={dirX > 0 ? 'start' : 'end'} dominantBaseline="baseline"
        fontSize={10 / zoom} fontFamily="Inter, sans-serif" fill="#475569"
        stroke="#ffffff" strokeWidth={3 / zoom} paintOrder="stroke fill">
        {subtitle}
      </text>
    </g>
  )
}
