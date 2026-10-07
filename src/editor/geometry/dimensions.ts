import type { ProjectElement, CountertopElement, WetAreaElement, CountertopGeometry, Point, Unit } from '../../models/types.ts'
import { getElementBounds } from './bounds.ts'
import { getElementReferenceBounds } from './segments.ts'
import { fromMm } from '../../utils/units.ts'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AutoDimension = {
  id: string
  countertopId: string
  orientation: 'horizontal' | 'vertical'
  kind: 'countertop' | 'element' | 'gap'
  startPoint: Point
  endPoint: Point
  offset: number   // mm – positive = above/right of line
  value: number    // mm – the actual measurement
  label: string    // already formatted with unit
}

// ─── Formatting helper ────────────────────────────────────────────────────────

function fmt(mm: number, unit: Unit): string {
  const v = fromMm(mm, unit)
  const d = unit === 'm' ? 3 : unit === 'cm' ? 1 : 0
  return `${parseFloat(v.toFixed(d))} ${unit}`
}

// ─── Auto-dimension generator ─────────────────────────────────────────────────

const DIM_OFFSET_PRIMARY = -160   // mm above/left for overall dims
const DIM_OFFSET_WETAREA = -100   // mm for wet area
const DIM_OFFSET_ELEMENT = -50    // mm for sinks, cooktops

/**
 * Generate automatic dimension lines for a countertop and all its children.
 * Labels are formatted in the user's chosen unit.
 */
export function generateAutoDimensions(
  parent: CountertopElement | WetAreaElement,
  children: ProjectElement[],
  unit: Unit = 'cm',
  countertopId: string
): AutoDimension[] {
  const dims: AutoDimension[] = []
  const pos = parent.position

  let pW = 0, pH = 0
  let isLShape = false
  let g: CountertopGeometry | undefined

  if (parent.type === 'countertop') {
    g = parent.geometry
    pW = g.type === 'reta' ? g.width : g.segmentA.width
    pH = g.type === 'reta' ? g.depth : g.segmentA.depth + g.segmentB.depth
    isLShape = g.type === 'l-shape'
  } else {
    pW = parent.width
    pH = parent.depth
  }

  // Only draw overall dimensions if it's a countertop
  if (parent.type === 'countertop' && parent.dimSelf !== false) {
    // ── Overall width (Segment A comprimento) ────────────────────────────────
    dims.push({
      id: `dim-${parent.id}-width`,
      countertopId,
      orientation: 'horizontal',
      kind: 'countertop',
      startPoint: { x: pos.x, y: pos.y },
      endPoint: { x: pos.x + pW, y: pos.y },
      offset: DIM_OFFSET_PRIMARY,
      value: pW,
      label: fmt(pW, unit),
    })

    // ── Overall height ───────────────────────────────────────────────────────
    const xDepth = isLShape ? pos.x : pos.x + pW
    const offsetDepth = isLShape ? DIM_OFFSET_PRIMARY : 50
    dims.push({
      id: `dim-${parent.id}-depth`,
      countertopId,
      orientation: 'vertical',
      kind: 'countertop',
      startPoint: { x: xDepth, y: pos.y },
      endPoint: { x: xDepth, y: pos.y + pH },
      offset: offsetDepth,
      value: pH,
      label: fmt(pH, unit),
    })

    // ── L-shape segment dims ─────────────────────────────────────────────────
    if (g && g.type === 'l-shape') {
      const { segmentA: sA, segmentB: sB } = g

      // Segment A depth (profundidade)
      dims.push({
        id: `dim-${parent.id}-sA-depth`,
        countertopId,
        orientation: 'vertical',
        kind: 'countertop',
        startPoint: { x: pos.x + sA.width, y: pos.y },
        endPoint: { x: pos.x + sA.width, y: pos.y + sA.depth },
        offset: Math.abs(DIM_OFFSET_PRIMARY),
        value: sA.depth,
        label: fmt(sA.depth, unit),
      })

      // Segment B comprimento (vertical extent below A)
      dims.push({
        id: `dim-${parent.id}-sB-length`,
        countertopId,
        orientation: 'vertical',
        kind: 'countertop',
        startPoint: { x: pos.x + sB.width, y: pos.y + sA.depth },
        endPoint: { x: pos.x + sB.width, y: pos.y + sA.depth + sB.depth },
        offset: Math.abs(DIM_OFFSET_PRIMARY),
        value: sB.depth,
        label: fmt(sB.depth, unit),
      })

      // Segment B profundidade (horizontal width of B column)
      dims.push({
        id: `dim-${parent.id}-sB-width`,
        countertopId,
        orientation: 'horizontal',
        kind: 'countertop',
        startPoint: { x: pos.x, y: pos.y + sA.depth + sB.depth },
        endPoint: { x: pos.x + sB.width, y: pos.y + sA.depth + sB.depth },
        offset: Math.abs(DIM_OFFSET_PRIMARY),
        value: sB.width,
        label: fmt(sB.width, unit),
      })
    }
  }

  // ── Child element position dims ──────────────────────────────────────────
  children.forEach((child) => {
    // Note: visibility filtering is mostly handled by Canvas.tsx before passing children.
    const bounds = getElementBounds(child)
    if (!bounds) return
    
    const refBounds = getElementReferenceBounds(child, parent as any)

    // Dynamic offset based on child type for its own width/depth, and parent type for gaps
    const childDimOffset = child.type === 'wet-area' ? DIM_OFFSET_WETAREA : DIM_OFFSET_ELEMENT
    const gapOffset = parent.type === 'countertop' ? DIM_OFFSET_PRIMARY : DIM_OFFSET_WETAREA

    // Helper to find wet area containing the child
    let waContaining: ProjectElement | undefined
    if (parent.type === 'countertop' && child.type !== 'wet-area') {
      const cx = bounds.x + bounds.width / 2
      const cy = bounds.y + bounds.height / 2
      waContaining = children.find(c => {
        if (c.type !== 'wet-area') return false
        const wb = getElementBounds(c)!
        return cx >= wb.x && cx <= wb.x + wb.width && cy >= wb.y && cy <= wb.y + wb.height
      })
    }

    // Cutouts: measure to the nearest neighbouring item in that direction (same segment,
    // overlapping span) instead of the countertop edge. Falls back to the existing bound.
    const neighbours = child.type === 'cutout'
      ? children.filter(o => {
          if (o.id === child.id || o.type === 'wet-area' || o.type === 'backsplash') return false
          if (!getElementBounds(o)) return false
          return getElementReferenceBounds(o, parent as any).segmentId === refBounds.segmentId
        }).map(o => getElementBounds(o)!)
      : []
    const overlapY = (o: { y: number; height: number }) => o.y < bounds.y + bounds.height && o.y + o.height > bounds.y
    const overlapX = (o: { x: number; width: number }) => o.x < bounds.x + bounds.width && o.x + o.width > bounds.x

    // Distance from left edge
    let leftBound = refBounds.left
    if (parent.type === 'countertop' && child.type !== 'wet-area') {
      if (waContaining) {
        leftBound = getElementBounds(waContaining)!.x
      } else {
        const waToLeft = children.filter(c => c.type === 'wet-area' && getElementBounds(c)!.x + getElementBounds(c)!.width <= bounds.x)
        if (waToLeft.length > 0) {
          const closest = waToLeft.reduce((p, c) => (getElementBounds(c)!.x + getElementBounds(c)!.width > getElementBounds(p)!.x + getElementBounds(p)!.width) ? c : p)
          if (getElementBounds(closest)!.x >= refBounds.left) {
            leftBound = getElementBounds(closest)!.x + getElementBounds(closest)!.width
          }
        }
      }
    }
    for (const o of neighbours) {
      const edge = o.x + o.width
      if (overlapY(o) && edge <= bounds.x && edge > leftBound) leftBound = edge
    }
    const dLeft = bounds.x - leftBound
    if (dLeft > 10 && child.dimLeft !== false) {
      dims.push({
        id: `dim-${child.id}-left-${parent.id}`,
        countertopId,
        orientation: 'horizontal',
        kind: 'gap',
        startPoint: { x: leftBound, y: bounds.y + bounds.height / 2 },
        endPoint: { x: bounds.x, y: bounds.y + bounds.height / 2 },
        offset: gapOffset,
        value: dLeft,
        label: fmt(dLeft, unit),
      })
    }

    // Child width
    const isDirect = '_isVisualDirect' in child ? (child as any)._isVisualDirect : ('parentId' in child && (child as any).parentId === parent.id)
    let isCircular = false
    if (child.type === 'faucet') isCircular = true
    else if (child.type === 'trash' && child.shape === 'circular') isCircular = true
    else if (child.type === 'cutout' && child.shape === 'circular') isCircular = true

    if (bounds.width > 20 && child.dimSelf !== false && isDirect && !isCircular) {
      dims.push({
        id: `dim-${child.id}-width`,
        countertopId,
        orientation: 'horizontal',
        kind: 'element',
        startPoint: { x: bounds.x, y: bounds.y },
        endPoint: { x: bounds.x + bounds.width, y: bounds.y },
        offset: childDimOffset,
        value: bounds.width,
        label: fmt(bounds.width, unit),
      })
    }

    // Distance from top edge
    let topBound = refBounds.top
    if (parent.type === 'countertop' && child.type !== 'wet-area') {
      if (waContaining) {
        topBound = getElementBounds(waContaining)!.y
      } else {
        const waAbove = children.filter(c => c.type === 'wet-area' && getElementBounds(c)!.y + getElementBounds(c)!.height <= bounds.y)
        if (waAbove.length > 0) {
          const closest = waAbove.reduce((p, c) => (getElementBounds(c)!.y + getElementBounds(c)!.height > getElementBounds(p)!.y + getElementBounds(p)!.height) ? c : p)
          if (getElementBounds(closest)!.y >= refBounds.top) {
            topBound = getElementBounds(closest)!.y + getElementBounds(closest)!.height
          }
        }
      }
    }
    for (const o of neighbours) {
      const edge = o.y + o.height
      if (overlapX(o) && edge <= bounds.y && edge > topBound) topBound = edge
    }
    const dTop = bounds.y - topBound
    if (dTop > 10 && child.dimTop !== false) {
      dims.push({
        id: `dim-${child.id}-top-${parent.id}`,
        countertopId,
        orientation: 'vertical',
        kind: 'gap',
        startPoint: { x: bounds.x + bounds.width, y: topBound },
        endPoint: { x: bounds.x + bounds.width, y: bounds.y },
        offset: -gapOffset,
        value: dTop,
        label: fmt(dTop, unit),
      })
    }

    // Distance from right edge
    let rightBound = refBounds.right
    if (parent.type === 'countertop' && child.type !== 'wet-area') {
      if (waContaining) {
        const wb = getElementBounds(waContaining)!
        rightBound = wb.x + wb.width
      } else {
        const waToRight = children.filter(c => c.type === 'wet-area' && getElementBounds(c)!.x >= bounds.x + bounds.width)
        if (waToRight.length > 0) {
          const closest = waToRight.reduce((p, c) => (getElementBounds(c)!.x < getElementBounds(p)!.x) ? c : p)
          if (getElementBounds(closest)!.x <= refBounds.right) {
            rightBound = getElementBounds(closest)!.x
          }
        }
      }
    }
    for (const o of neighbours) {
      if (overlapY(o) && o.x >= bounds.x + bounds.width && o.x < rightBound) rightBound = o.x
    }
    const dRight = rightBound - (bounds.x + bounds.width)
    if (dRight > 10 && child.dimRight !== false) {
      dims.push({
        id: `dim-${child.id}-right-${parent.id}`,
        countertopId,
        orientation: 'horizontal',
        kind: 'gap',
        startPoint: { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
        endPoint: { x: rightBound, y: bounds.y + bounds.height / 2 },
        offset: gapOffset,
        value: dRight,
        label: fmt(dRight, unit),
      })
    }

    // Distance from bottom edge
    let bottomBound = refBounds.bottom
    if (parent.type === 'countertop' && child.type !== 'wet-area') {
      if (waContaining) {
        const wb = getElementBounds(waContaining)!
        bottomBound = wb.y + wb.height
      } else {
        const waBelow = children.filter(c => c.type === 'wet-area' && getElementBounds(c)!.y >= bounds.y + bounds.height)
        if (waBelow.length > 0) {
          const closest = waBelow.reduce((p, c) => (getElementBounds(c)!.y < getElementBounds(p)!.y) ? c : p)
          if (getElementBounds(closest)!.y + getElementBounds(closest)!.height <= refBounds.bottom) {
            bottomBound = getElementBounds(closest)!.y
          }
        }
      }
    }
    for (const o of neighbours) {
      if (overlapX(o) && o.y >= bounds.y + bounds.height && o.y < bottomBound) bottomBound = o.y
    }
    const dBottom = bottomBound - (bounds.y + bounds.height)
    if (dBottom > 10 && child.dimBottom !== false) {
      dims.push({
        id: `dim-${child.id}-bottom-${parent.id}`,
        countertopId,
        orientation: 'vertical',
        kind: 'gap',
        startPoint: { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
        endPoint: { x: bounds.x + bounds.width, y: bottomBound },
        offset: -gapOffset,
        value: dBottom,
        label: fmt(dBottom, unit),
      })
    }
  })

  return dims
}
