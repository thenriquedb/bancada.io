import type { Point, Rect } from '../../models/types.ts'

/**
 * Convert a screen-space point to canvas/world space (mm).
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  panX: number,
  panY: number,
  zoom: number
): Point {
  return {
    x: (screenX - panX) / zoom,
    y: (screenY - panY) / zoom,
  }
}



/**
 * Calculate bounding rect from two points (for rubber-band selection).
 */
export function rectFromPoints(a: Point, b: Point): Rect {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  return {
    x,
    y,
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  }
}
