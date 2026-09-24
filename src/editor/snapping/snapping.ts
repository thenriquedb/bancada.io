import { snap } from '../../utils/helpers.ts'
import type { Point } from '../../models/types.ts'

export type SnapOptions = {
  gridSize: number    // mm
  snapToGrid: boolean
}

/**
 * Snap a world-space point to the grid.
 */
export function snapPoint(p: Point, opts: SnapOptions): Point {
  if (!opts.snapToGrid) return p
  return {
    x: snap(p.x, opts.gridSize),
    y: snap(p.y, opts.gridSize),
  }
}

/**
 * Snap a single axis value to the grid.
 */
export function snapValue(value: number, gridSize: number, enabled: boolean): number {
  return enabled ? snap(value, gridSize) : value
}
