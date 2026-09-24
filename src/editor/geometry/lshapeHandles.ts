/**
 * L-shape resize handle system.
 *
 * The L-shape polygon (top view, all in world-mm):
 *
 *  (px, py)─────────────────────────(px+aW, py)
 *     │                                    │  ← right edge of A  (handle: e-a)
 *     │           Segment A                │
 *     │                              (px+aW, py+aD)
 *  (px, py+aD)─────────(px+bW, py+aD)─────── ← inner step (handle: s-a)
 *     │    Segment B     │
 *     │                  │ ← right edge of B (handle: e-b)
 *  (px, py+aD+bD)──────(px+bW, py+aD+bD)
 *                 ↑ bottom edge of B (handle: s-b)
 *
 * Handle names  What dragging does
 * ──────────────────────────────────────────────────────────────
 *  nw           move origin (top-left corner)
 *  ne           segmentA.width
 *  sw           segmentB.depth  (bottom-left corner)
 *  e-a          segmentA.width  (mid-right edge of A)
 *  s-a          segmentA.depth  (inner horizontal step)
 *  e-b          segmentB.width  (mid-right edge of B)
 *  s-b          segmentB.depth  (bottom edge of B)
 *  inner        segmentB.width + segmentA.depth (inner corner)
 */

export type LHandle =
  | 'nw'        // top-left corner
  | 'ne'        // top-right corner → segmentA.width
  | 'sw'        // bottom-left corner → segmentB.depth
  | 'e-a'       // mid-right of Segment A → segmentA.width
  | 's-a'       // mid-inner-step → segmentA.depth
  | 'e-b'       // mid-right of Segment B → segmentB.width
  | 's-b'       // bottom mid → segmentB.depth
  | 'inner'     // inner corner → segmentB.width & segmentA.depth

export type LHandleInfo = {
  name:   LHandle
  sx:     number   // screen x
  sy:     number   // screen y
  cursor: string
  axis:   'x' | 'y' | 'xy'
  edge:   boolean  // true = edge pill, false = corner square
}

const HIT = 12  // px hit radius

/**
 * Compute all L-shape handle positions in screen space.
 */
export function getLHandles(
  px: number, py: number,
  aW: number, aD: number, bW: number, bD: number,
  zoom: number, panX: number, panY: number,
): LHandleInfo[] {
  // World → screen
  const toS = (wx: number, wy: number) => ({
    sx: wx * zoom + panX,
    sy: wy * zoom + panY,
  })

  const tl = toS(px, py)
  const tr = toS(px + aW, py)
  const bl = toS(px, py + aD + bD)
  const innerStep = toS(px + (aW + bW) / 2, py + aD)  // mid of inner horizontal
  const midEA     = toS(px + aW, py + aD / 2)          // mid of right edge of A
  const midEB     = toS(px + bW, py + aD + bD / 2)     // mid of right edge of B
  const midSB     = toS(px + bW / 2, py + aD + bD)     // mid of bottom edge
  const innerC    = toS(px + bW, py + aD)              // inner corner

  return [
    { name: 'nw',    ...tl,        cursor: 'nw-resize', axis: 'xy', edge: false },
    { name: 'ne',    ...tr,        cursor: 'ne-resize', axis: 'x',  edge: false },
    { name: 'sw',    ...bl,        cursor: 'sw-resize', axis: 'y',  edge: false },
    { name: 'e-a',   ...midEA,     cursor: 'e-resize',  axis: 'x',  edge: true  },
    { name: 's-a',   ...innerStep, cursor: 's-resize',  axis: 'y',  edge: true  },
    { name: 'e-b',   ...midEB,     cursor: 'e-resize',  axis: 'x',  edge: true  },
    { name: 's-b',   ...midSB,     cursor: 's-resize',  axis: 'y',  edge: true  },
    { name: 'inner', ...innerC,    cursor: 'nw-resize', axis: 'xy', edge: false },
  ]
}

/**
 * Find which handle (if any) is under screenPt.
 * Returns the handle name or null.
 */
export function hitTestLHandle(handles: LHandleInfo[], screenPt: { x: number; y: number }): LHandle | null {
  for (const h of handles) {
    const dx = Math.abs(screenPt.x - h.sx)
    const dy = Math.abs(screenPt.y - h.sy)
    if (dx <= HIT && dy <= HIT) return h.name
  }
  return null
}

/**
 * Given the original segment dimensions and a drag delta (dx, dy in world mm),
 * return updated geometry for the given handle.
 */
export function applyLResize(
  handle: LHandle,
  orig: { px: number; py: number; aW: number; aD: number; bW: number; bD: number },
  dx: number,
  dy: number,
  MIN = 100,
): { px: number; py: number; aW: number; aD: number; bW: number; bD: number } {
  let { px, py, aW, aD, bW, bD } = orig

  switch (handle) {
    case 'ne':
    case 'e-a':
      // Drag right → segmentA.width
      aW = Math.max(MIN, orig.aW + dx)
      break

    case 's-a':
      // Drag down → segmentA.depth (the inner step moves down)
      aD = Math.max(MIN, orig.aD + dy)
      break

    case 'e-b':
      // Drag right → segmentB.width
      bW = Math.max(MIN, orig.bW + dx)
      // bW must always be ≤ aW
      bW = Math.min(bW, aW - MIN)
      break

    case 'sw':
    case 's-b':
      // Drag down → segmentB.depth
      bD = Math.max(MIN, orig.bD + dy)
      break

    case 'nw':
      // Drag top-left corner → move origin, adjust aW and bD
      px = orig.px + dx
      py = orig.py + dy
      aW = Math.max(MIN, orig.aW - dx)
      bD = Math.max(MIN, orig.bD - dy)
      break

    case 'inner':
      // Drag inner corner → segmentB.width and segmentA.depth
      bW = Math.max(MIN, orig.bW + dx)
      bW = Math.min(bW, aW - MIN)
      aD = Math.max(MIN, orig.aD + dy)
      break
  }

  return {
    px: Math.round(px),
    py: Math.round(py),
    aW: Math.round(aW),
    aD: Math.round(aD),
    bW: Math.round(bW),
    bD: Math.round(bD),
  }
}
