import type { ProjectElement, CountertopElement, Point, Unit } from '../../models/types.ts'
import { getElementBounds } from './bounds.ts'
import { fromMm } from '../../utils/units.ts'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AutoDimension = {
  id: string
  orientation: 'horizontal' | 'vertical'
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
  return `${v.toFixed(d)} ${unit}`
}

// ─── Auto-dimension generator ─────────────────────────────────────────────────

const DIM_OFFSET_PRIMARY   = -80   // mm above/left for overall dims
const DIM_OFFSET_SECONDARY = -40   // mm for secondary dims

/**
 * Generate automatic dimension lines for a countertop and all its children.
 * Labels are formatted in the user's chosen unit.
 */
export function generateAutoDimensions(
  countertop: CountertopElement,
  children: ProjectElement[],
  unit: Unit = 'cm'
): AutoDimension[] {
  const dims: AutoDimension[] = []
  const pos = countertop.position
  const g   = countertop.geometry

  const ctW = g.type === 'reta' ? g.width  : g.segmentA.width
  const ctH = g.type === 'reta' ? g.depth  : g.segmentA.depth + g.segmentB.depth

  // ── Overall width (Segment A comprimento) ────────────────────────────────
  dims.push({
    id: `dim-${countertop.id}-width`,
    orientation: 'horizontal',
    startPoint: { x: pos.x, y: pos.y },
    endPoint:   { x: pos.x + ctW, y: pos.y },
    offset: DIM_OFFSET_PRIMARY,
    value: ctW,
    label: fmt(ctW, unit),
  })

  // ── Overall height ───────────────────────────────────────────────────────
  dims.push({
    id: `dim-${countertop.id}-depth`,
    orientation: 'vertical',
    startPoint: { x: pos.x + ctW, y: pos.y },
    endPoint:   { x: pos.x + ctW, y: pos.y + ctH },
    offset: 70,
    value: ctH,
    label: fmt(ctH, unit),
  })

  // ── L-shape segment dims ─────────────────────────────────────────────────
  if (g.type === 'l-shape') {
    const { segmentA: sA, segmentB: sB } = g

    // Segment A depth (profundidade)
    dims.push({
      id: `dim-${countertop.id}-sA-depth`,
      orientation: 'vertical',
      startPoint: { x: pos.x + sA.width, y: pos.y },
      endPoint:   { x: pos.x + sA.width, y: pos.y + sA.depth },
      offset: 40,
      value: sA.depth,
      label: fmt(sA.depth, unit),
    })

    // Segment B comprimento (vertical extent below A)
    dims.push({
      id: `dim-${countertop.id}-sB-length`,
      orientation: 'vertical',
      startPoint: { x: pos.x + sB.width, y: pos.y + sA.depth },
      endPoint:   { x: pos.x + sB.width, y: pos.y + sA.depth + sB.depth },
      offset: 40,
      value: sB.depth,
      label: fmt(sB.depth, unit),
    })

    // Segment B profundidade (horizontal width of B column)
    dims.push({
      id: `dim-${countertop.id}-sB-width`,
      orientation: 'horizontal',
      startPoint: { x: pos.x, y: pos.y + sA.depth + sB.depth },
      endPoint:   { x: pos.x + sB.width, y: pos.y + sA.depth + sB.depth },
      offset: 40,
      value: sB.width,
      label: fmt(sB.width, unit),
    })
  }

  // ── Child element position dims ──────────────────────────────────────────
  children.forEach((child) => {
    const bounds = getElementBounds(child)
    if (!bounds) return

    // Distance from left edge of countertop
    const dLeft = bounds.x - pos.x
    if (dLeft > 10) {
      dims.push({
        id: `dim-${child.id}-left`,
        orientation: 'horizontal',
        startPoint: { x: pos.x, y: bounds.y + bounds.height / 2 },
        endPoint:   { x: bounds.x, y: bounds.y + bounds.height / 2 },
        offset: DIM_OFFSET_SECONDARY,
        value: dLeft,
        label: fmt(dLeft, unit),
      })
    }

    // Child width
    if (bounds.width > 20) {
      dims.push({
        id: `dim-${child.id}-width`,
        orientation: 'horizontal',
        startPoint: { x: bounds.x, y: bounds.y },
        endPoint:   { x: bounds.x + bounds.width, y: bounds.y },
        offset: DIM_OFFSET_SECONDARY,
        value: bounds.width,
        label: fmt(bounds.width, unit),
      })
    }

    // Distance from top edge of countertop
    const dTop = bounds.y - pos.y
    if (dTop > 10 && dTop < ctH) {
      dims.push({
        id: `dim-${child.id}-top`,
        orientation: 'vertical',
        startPoint: { x: bounds.x + bounds.width, y: pos.y },
        endPoint:   { x: bounds.x + bounds.width, y: bounds.y },
        offset: 40,
        value: dTop,
        label: fmt(dTop, unit),
      })
    }
  })

  return dims
}
