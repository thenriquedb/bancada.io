import type { CountertopElement, ProjectElement } from '../models/types.ts'

/** Return all countertop elements from a list */
export function getCountertops(elements: ProjectElement[]): CountertopElement[] {
  return elements.filter((el): el is CountertopElement => el.type === 'countertop')
}

/** Pick the best default parent:
 *  1. Selected countertop
 *  2. First countertop
 */
export function getDefaultParent(
  countertops: CountertopElement[],
  selectedIds: string[]
): CountertopElement | undefined {
  const selected = countertops.find((ct) => selectedIds.includes(ct.id))
  return selected ?? countertops[0]
}

/** Return the world-space center position to center a child element on a countertop */
export function centerInCountertop(
  ct: CountertopElement,
  childWidth: number,
  childDepth: number
): { x: number; y: number } {
  const ctW = ct.geometry.type === 'reta' ? ct.geometry.width : ct.geometry.segmentA.width
  const ctD = ct.geometry.type === 'reta' ? ct.geometry.depth : ct.geometry.segmentA.depth
  return {
    x: ct.position.x + Math.round((ctW - childWidth) / 2),
    y: ct.position.y + Math.round((ctD - childDepth) / 2),
  }
}
