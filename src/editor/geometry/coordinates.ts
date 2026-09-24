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
 * Convert a world-space point (mm) to screen space (px).
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  panX: number,
  panY: number,
  zoom: number
): Point {
  return {
    x: worldX * zoom + panX,
    y: worldY * zoom + panY,
  }
}

/**
 * Scale a mm measurement to screen pixels.
 */
export function mmToPx(mm: number, zoom: number): number {
  return mm * zoom
}

/**
 * Scale screen pixels to mm.
 */
export function pxToMm(px: number, zoom: number): number {
  return px / zoom
}

/**
 * Check if a world-space point is inside a rect (all in mm).
 */
export function pointInRect(p: Point, rect: Rect): boolean {
  return (
    p.x >= rect.x &&
    p.x <= rect.x + rect.width &&
    p.y >= rect.y &&
    p.y <= rect.y + rect.height
  )
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
