import type { Rect } from '../models/types.ts'

// ─── ID generation ───────────────────────────────────────────────────────────

let _counter = 0

export function generateId(prefix = 'el'): string {
  _counter += 1
  return `${prefix}-${Date.now()}-${_counter}`
}

// ─── Rect / geometry helpers ─────────────────────────────────────────────────

export function rectContains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  )
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  )
}


export function snap(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function nowISO(): string {
  return new Date().toISOString()
}
