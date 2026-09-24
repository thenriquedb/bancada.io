import type { ProjectElement, Rect } from '../../models/types.ts'

/**
 * Return the bounding rect (in mm) of any element.
 * Returns null for elements without a fixed bounding box (e.g. annotations).
 */
export function getElementBounds(el: ProjectElement): Rect | null {
  switch (el.type) {
    case 'countertop': {
      const g = el.geometry
      if (g.type === 'reta') {
        return { x: el.position.x, y: el.position.y, width: g.width, height: g.depth }
      }
      if (g.type === 'l-shape') {
        const totalW = Math.max(g.segmentA.width, g.segmentB.width)
        const totalH = g.segmentA.depth + g.segmentB.depth
        return { x: el.position.x, y: el.position.y, width: totalW, height: totalH }
      }
      return null
    }
    case 'sink':
      return { x: el.position.x, y: el.position.y, width: el.width, height: el.depth }
    case 'cooktop':
      return { x: el.position.x, y: el.position.y, width: el.width, height: el.depth }
    case 'faucet':
      return {
        x: el.position.x - el.diameter / 2,
        y: el.position.y - el.diameter / 2,
        width: el.diameter,
        height: el.diameter,
      }
    case 'trash': {
      const d = el.shape === 'circular' ? (el.diameter ?? 250) : (el.width ?? 200)
      const h = el.shape === 'circular' ? (el.diameter ?? 250) : (el.depth ?? 250)
      return { x: el.position.x - d / 2, y: el.position.y - h / 2, width: d, height: h }
    }
    case 'wet-area':
      return { x: el.position.x, y: el.position.y, width: el.width, height: el.depth }
    case 'backsplash':
      return { x: el.position.x, y: el.position.y, width: el.length, height: el.height }
    case 'annotation':
      return { x: el.position.x, y: el.position.y, width: 200, height: 20 }
    case 'dimension':
      return null
    default:
      return null
  }
}

/**
 * Return a bounding rect encompassing all elements.
 */
export function getGroupBounds(elements: ProjectElement[]): Rect | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  let any = false
  for (const el of elements) {
    const r = getElementBounds(el)
    if (!r) continue
    any = true
    minX = Math.min(minX, r.x)
    minY = Math.min(minY, r.y)
    maxX = Math.max(maxX, r.x + r.width)
    maxY = Math.max(maxY, r.y + r.height)
  }
  if (!any) return null
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}
