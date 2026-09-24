import type { CountertopElement, ProjectElement, WetAreaElement } from '../models/types.ts'

export type ValidParent = CountertopElement | WetAreaElement

/** Return all countertop elements */
export function getCountertops(elements: ProjectElement[]): CountertopElement[] {
  return elements.filter((el): el is CountertopElement => el.type === 'countertop')
}

/** Return all valid parents (countertops and wet areas) */
export function getValidParents(elements: ProjectElement[]): ValidParent[] {
  return elements.filter((el): el is ValidParent => el.type === 'countertop' || el.type === 'wet-area')
}

/** Pick the best default parent */
export function getDefaultParent(
  parents: ValidParent[],
  selectedIds: string[]
): ValidParent | undefined {
  const selected = parents.find((p) => selectedIds.includes(p.id))
  return selected ?? parents[0]
}

/** Return the world-space center position to center a child element on a parent */
export function centerInParent(
  parent: ValidParent,
  childWidth: number,
  childDepth: number
): { x: number; y: number } {
  let pw = 0, pd = 0
  if (parent.type === 'countertop') {
    pw = parent.geometry.type === 'reta' ? parent.geometry.width : parent.geometry.segmentA.width
    pd = parent.geometry.type === 'reta' ? parent.geometry.depth : parent.geometry.segmentA.depth
  } else {
    pw = parent.width
    pd = parent.depth
  }
  return {
    x: parent.position.x + Math.round((pw - childWidth) / 2),
    y: parent.position.y + Math.round((pd - childDepth) / 2),
  }
}
