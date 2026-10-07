import type { ProjectElement, CountertopElement } from '../../models/types.ts'
import { getElementBounds } from '../../editor/geometry/bounds.ts'

export type PdfDimension = {
  type: 'horizontal' | 'vertical'
  value: number
  start: { x: number; y: number }
  end: { x: number; y: number }
  priority: 'high' | 'medium' | 'low'
  offset: number
  label: string
}

function formatDim(val: number): string {
  if (val >= 100) return Math.round(val).toString()
  return (Math.round(val * 10) / 10).toString()
}

export function generatePdfDimensions(ct: CountertopElement, children: ProjectElement[]): PdfDimension[] {
  const dims: PdfDimension[] = []
  const cb = getElementBounds(ct)
  if (!cb) return dims

  // Global offset for primary dimensions
  const OUTSIDE_OFFSET = 120 // mm

  // 1. Countertop Main Dimensions
  if (ct.geometry.type === 'reta') {
    dims.push({
      type: 'horizontal',
      value: ct.geometry.width,
      start: { x: cb.x, y: cb.y },
      end: { x: cb.x + cb.width, y: cb.y },
      priority: 'high',
      offset: -OUTSIDE_OFFSET,
      label: formatDim(ct.geometry.width)
    })
    dims.push({
      type: 'vertical',
      value: ct.geometry.depth,
      start: { x: cb.x + cb.width, y: cb.y },
      end: { x: cb.x + cb.width, y: cb.y + cb.height },
      priority: 'high',
      offset: OUTSIDE_OFFSET,
      label: formatDim(ct.geometry.depth)
    })
  } else if (ct.geometry.type === 'l-shape') {
    const { segmentA, segmentB } = ct.geometry
    // Top width
    dims.push({
      type: 'horizontal',
      value: segmentA.width,
      start: { x: cb.x, y: cb.y },
      end: { x: cb.x + segmentA.width, y: cb.y },
      priority: 'high',
      offset: -OUTSIDE_OFFSET,
      label: formatDim(segmentA.width)
    })
    // Total depth (left)
    dims.push({
      type: 'vertical',
      value: segmentA.depth + segmentB.depth,
      start: { x: cb.x, y: cb.y },
      end: { x: cb.x, y: cb.y + cb.height },
      priority: 'high',
      offset: -OUTSIDE_OFFSET,
      label: formatDim(segmentA.depth + segmentB.depth)
    })
    // Top segment depth (right side)
    dims.push({
      type: 'vertical',
      value: segmentA.depth,
      start: { x: cb.x + segmentA.width, y: cb.y },
      end: { x: cb.x + segmentA.width, y: cb.y + segmentA.depth },
      priority: 'medium',
      offset: OUTSIDE_OFFSET,
      label: formatDim(segmentA.depth)
    })
    // Bottom segment width
    dims.push({
      type: 'horizontal',
      value: segmentB.width,
      start: { x: cb.x, y: cb.y + segmentA.depth + segmentB.depth },
      end: { x: cb.x + segmentB.width, y: cb.y + segmentA.depth + segmentB.depth },
      priority: 'medium',
      offset: OUTSIDE_OFFSET,
      label: formatDim(segmentB.width)
    })
  }

  // 2. Component positions
  children.forEach(child => {
    if (child.type === 'wet-area') return // Usually wet areas match sink closely or have custom rules
    if (child.type === 'dimension' || child.type === 'annotation') return
    if (child.type === 'backsplash') return

    const b = getElementBounds(child)
    if (!b) return

    // Position from left edge of countertop
    const distLeft = b.x - cb.x
    if (distLeft > 0) {
      dims.push({
        type: 'horizontal',
        value: distLeft,
        start: { x: cb.x, y: b.y + b.height / 2 },
        end: { x: b.x, y: b.y + b.height / 2 },
        priority: 'medium',
        offset: 0, 
        label: formatDim(distLeft)
      })
    }

    // Position from top edge of countertop
    const distTop = b.y - cb.y
    if (distTop > 0) {
      dims.push({
        type: 'vertical',
        value: distTop,
        start: { x: b.x + b.width / 2, y: cb.y },
        end: { x: b.x + b.width / 2, y: b.y },
        priority: 'medium',
        offset: 0,
        label: formatDim(distTop)
      })
    }
  })

  return dims
}
