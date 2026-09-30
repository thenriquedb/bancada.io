import type { CountertopElement, ProjectElement, Rect } from '../../models/types.ts'
import { getElementBounds } from './bounds.ts'

export type ElementReferenceBounds = {
  left: number
  right: number
  top: number
  bottom: number
  segmentId: 'A' | 'B' | 'main'
}

export function getElementReferenceBounds(
  element: ProjectElement,
  parent: CountertopElement | { type: 'wet-area', width: number, depth: number, position: {x: number, y: number} }
): ElementReferenceBounds {
  const bounds = getElementBounds(element)
  const pos = parent.position

  if (!bounds) {
    return { left: pos.x, right: pos.x + 100, top: pos.y, bottom: pos.y + 100, segmentId: 'main' }
  }

  if (parent.type !== 'countertop') {
    return {
      left: pos.x,
      right: pos.x + parent.width,
      top: pos.y,
      bottom: pos.y + parent.depth,
      segmentId: 'main'
    }
  }

  const g = parent.geometry
  if (g.type === 'reta') {
    return {
      left: pos.x,
      right: pos.x + g.width,
      top: pos.y,
      bottom: pos.y + g.depth,
      segmentId: 'main'
    }
  }

  // L-shape
  const cx = bounds.x + bounds.width / 2
  const cy = bounds.y + bounds.height / 2

  // A is horizontal top, B is vertical bottom-left
  // A: x from pos.x to pos.x + sA.width, y from pos.y to pos.y + sA.depth
  // B: x from pos.x to pos.x + sB.width, y from pos.y + sA.depth to pos.y + sA.depth + sB.depth
  
  const inSegmentB = cy > pos.y + g.segmentA.depth

  if (inSegmentB) {
    return {
      left: pos.x,
      right: pos.x + g.segmentB.width,
      top: pos.y + g.segmentA.depth,
      bottom: pos.y + g.segmentA.depth + g.segmentB.depth,
      segmentId: 'B'
    }
  } else {
    return {
      left: pos.x,
      right: pos.x + g.segmentA.width,
      top: pos.y,
      bottom: pos.y + g.segmentA.depth,
      segmentId: 'A'
    }
  }
}
