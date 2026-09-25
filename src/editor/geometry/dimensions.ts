import type { ProjectElement, CountertopElement, WetAreaElement, CountertopGeometry, Point, Unit } from '../../models/types.ts'
import { getElementBounds } from './bounds.ts'
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

    // Dynamic offset based on child type for its own width/depth, and parent type for gaps
    const childDimOffset = child.type === 'wet-area' ? DIM_OFFSET_WETAREA : DIM_OFFSET_ELEMENT
    const gapOffset = parent.type === 'countertop' ? DIM_OFFSET_PRIMARY : DIM_OFFSET_WETAREA

    // Distance from left edge of countertop (or nearest wet-area)
    let leftBound = pos.x
    if (parent.type === 'countertop' && child.type !== 'wet-area') {
      const waToLeft = children.filter(c => c.type === 'wet-area' && getElementBounds(c)!.x + getElementBounds(c)!.width <= bounds.x)
      if (waToLeft.length > 0) {
        const closest = waToLeft.reduce((p, c) => (getElementBounds(c)!.x + getElementBounds(c)!.width > getElementBounds(p)!.x + getElementBounds(p)!.width) ? c : p)
        leftBound = getElementBounds(closest)!.x + getElementBounds(closest)!.width
      }
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

    // Child width (only draw once, tied to direct parent)
    const isDirect = '_isVisualDirect' in child ? (child as any)._isVisualDirect : ('parentId' in child && (child as any).parentId === parent.id)
    if (bounds.width > 20 && child.dimSelf !== false && isDirect) {
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

    // Distance from top edge of parent
    const dTop = bounds.y - pos.y
    if (dTop > 10 && dTop < pH && child.dimTop !== false) {
      dims.push({
        id: `dim-${child.id}-top-${parent.id}`,
        countertopId,
        orientation: 'vertical',
        kind: 'gap',
        startPoint: { x: bounds.x + bounds.width, y: pos.y },
        endPoint: { x: bounds.x + bounds.width, y: bounds.y },
        offset: -gapOffset, // vertical offsets are typically positive or negative based on side. Using -gapOffset pushes it right.
        value: dTop,
        label: fmt(dTop, unit),
      })
    }

    // Find precise right and bottom edges of parent depending on where the child is
    let pRight = pos.x + pW
    let pBottom = pos.y + pH

    if (isLShape && g && g.type === 'l-shape') {
      const cx = bounds.x + bounds.width / 2
      const cy = bounds.y + bounds.height / 2

      pBottom = (cx < pos.x + g.segmentB.width)
        ? pos.y + g.segmentA.depth + g.segmentB.depth
        : pos.y + g.segmentA.depth

      pRight = (cy > pos.y + g.segmentA.depth)
        ? pos.x + g.segmentB.width
        : pos.x + g.segmentA.width
    }

    // Distance from right edge of parent (or nearest wet-area)
    let rightBound = pRight
    if (parent.type === 'countertop' && child.type !== 'wet-area') {
      const waToRight = children.filter(c => c.type === 'wet-area' && getElementBounds(c)!.x >= bounds.x + bounds.width)
      if (waToRight.length > 0) {
        const closest = waToRight.reduce((p, c) => (getElementBounds(c)!.x < getElementBounds(p)!.x) ? c : p)
        rightBound = getElementBounds(closest)!.x
      }
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

    // Distance from bottom edge of countertop
    const dBottom = pBottom - (bounds.y + bounds.height)
    if (dBottom > 10 && child.dimBottom !== false) {
      dims.push({
        id: `dim-${child.id}-bottom-${parent.id}`,
        countertopId,
        orientation: 'vertical',
        kind: 'gap',
        startPoint: { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
        endPoint: { x: bounds.x + bounds.width, y: pBottom },
        offset: -gapOffset, // push it right
        value: dBottom,
        label: fmt(dBottom, unit),
      })
    }
  })

  return dims
}
