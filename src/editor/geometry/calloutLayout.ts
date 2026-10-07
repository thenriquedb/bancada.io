import type { CountertopElement, ProjectElement, Rect } from '../../models/types.ts'
import type { AutoDimension } from './dimensions.ts'
import { getElementBounds } from './bounds.ts'
import { getElementReferenceBounds } from './segments.ts'

// ─── Visual constants (screen px) ─────────────────────────────────────────────

export const SMALL_ELEMENT_THRESHOLD = 48 // px on screen: below this → callout mode
export const COMPACT_ELEMENT_THRESHOLD = 90 // px on screen: below this → compact mode
export const MIN_VISUAL_SIZE = 14 // px on screen
export const HIT_AREA_SIZE = 32 // px on screen

const LEADER_DX = 22
const LEADER_DY = 16
const LEADER_STUB = 8
const TEXT_GAP = 3
const LABEL_HEIGHT = 24
const CHAR_W_TITLE = 6.4
const CHAR_W_SUB = 5.4
const BOX_PADDING = 3

// ─── Types ────────────────────────────────────────────────────────────────────

export type ElementVisualMode = 'full' | 'compact' | 'callout'

export type Point = { x: number; y: number }

export type ReferenceBounds = {
  left: number
  right: number
  top: number
  bottom: number
  segmentId?: string
}

export type CalloutLayout = {
  elementId: string
  anchor: Point          // element centre (world)
  start: Point           // leader start – on the visual edge of the symbol
  elbow: Point
  end: Point             // leader end – where the text begins
  linePath: Point[]
  textAnchor: 'start' | 'end'
  labelBox: Rect
  label: string
  secondaryLabel: string
  elementBounds: Rect
  segmentBounds?: ReferenceBounds
  globalBounds?: Rect
  collisions: number
}

export function getVisualMode(screenW: number, screenH: number): ElementVisualMode {
  if (screenW < SMALL_ELEMENT_THRESHOLD && screenH < SMALL_ELEMENT_THRESHOLD) return 'callout'
  if (Math.min(screenW, screenH) < COMPACT_ELEMENT_THRESHOLD) return 'compact'
  return 'full'
}

// ─── Text helpers ─────────────────────────────────────────────────────────────

/**
 * Short canvas label: cuts at the first preposition and caps the length.
 * The full name stays in the model – this is display-only.
 */
export function shortLabel(full: string): string {
  const up = (full ?? '').trim().toUpperCase()
  const cut = up.split(/\s+(?:DE|DA|DO|DAS|DOS|PARA|COM|EM)\s+/)[0] || up
  return cut.length > 12 ? `${cut.slice(0, 11)}…` : cut
}

export function getCalloutText(el: ProjectElement): { title: string; subtitle: string } {
  if (el.type === 'faucet') return { title: 'TORNEIRA', subtitle: `Ø${el.diameter} mm` }
  if (el.type === 'trash') {
    return el.shape === 'circular'
      ? { title: 'LIXEIRA', subtitle: `Ø${el.diameter ?? 250} mm` }
      : { title: 'LIXEIRA', subtitle: `${el.width ?? 300} × ${el.depth ?? 250} mm` }
  }
  if (el.type === 'cutout') {
    const title = el.label ?? 'RECORTE'
    return el.shape === 'circular'
      ? { title, subtitle: `Ø${el.diameter ?? 100} mm` }
      : { title, subtitle: `${el.width ?? 200} × ${el.depth ?? 200} mm` }
  }
  return { title: '', subtitle: '' }
}

// ─── Geometry helpers ─────────────────────────────────────────────────────────

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

function inflate(r: Rect, p: number): Rect {
  return { x: r.x - p, y: r.y - p, width: r.width + 2 * p, height: r.height + 2 * p }
}

function segmentBox(a: Point, b: Point, thick: number): Rect {
  return {
    x: Math.min(a.x, b.x) - thick / 2,
    y: Math.min(a.y, b.y) - thick / 2,
    width: Math.abs(a.x - b.x) + thick,
    height: Math.abs(a.y - b.y) + thick,
  }
}

/** Approximate obstacles produced by the dimension layer (text boxes + lines). */
function dimensionObstacles(dimensions: AutoDimension[], zoom: number): Rect[] {
  const out: Rect[] = []
  const px = 1 / zoom
  for (const d of dimensions) {
    const isPrimary = d.kind === 'countertop'
    const off = d.offset + (isPrimary ? (d.offset > 0 ? 50 : -50) : 0)
    const fs = Math.max(isPrimary ? 24 : d.kind === 'element' ? 20 : 15, 12 * px)
    const tw = d.label.length * fs * 0.64
    const th = fs * 1.2
    let a: Point, b: Point
    if (d.orientation === 'horizontal') {
      a = { x: d.startPoint.x, y: d.startPoint.y + off }
      b = { x: d.endPoint.x, y: d.endPoint.y + off }
    } else {
      a = { x: d.startPoint.x + off, y: d.startPoint.y }
      b = { x: d.endPoint.x + off, y: d.endPoint.y }
    }
    out.push(segmentBox(a, b, 2 * px))
    const mx = (a.x + b.x) / 2
    const my = (a.y + b.y) / 2
    out.push({ x: mx - tw / 2, y: my - th / 2, width: tw, height: th })
  }
  return out
}

const OBSTACLE_TYPES = new Set(['sink', 'cooktop', 'faucet', 'trash', 'cutout'])

function findCountertop(el: ProjectElement, elements: ProjectElement[]): CountertopElement | undefined {
  let cur: ProjectElement | undefined = el
  for (let i = 0; i < 5 && cur; i++) {
    const pid = (cur as any).parentId as string | undefined
    if (!pid) return undefined
    const p: ProjectElement | undefined = elements.find(e => e.id === pid)
    if (p?.type === 'countertop') return p
    cur = p
  }
  return undefined
}

// ─── Main entry ───────────────────────────────────────────────────────────────

/**
 * Computes a callout layout for every small element.
 * Flow: element → countertop → containing segment → segment bounds → placement.
 * Greedy heuristic: try a handful of ordered candidates, take the first collision-free one.
 */
export function computeCalloutLayouts(
  elements: ProjectElement[],
  zoom: number,
  dimensions: AutoDimension[] = [],
): Map<string, CalloutLayout> {
  const result = new Map<string, CalloutLayout>()
  const px = 1 / zoom

  const boundsById = new Map<string, Rect>()
  for (const e of elements) {
    const b = getElementBounds(e)
    if (b) boundsById.set(e.id, b)
  }

  const smalls = elements
    .filter(e => e.type === 'faucet' || e.type === 'trash' || e.type === 'cutout')
    .filter(e => {
      const b = boundsById.get(e.id)
      return !!b && getVisualMode(b.width * zoom, b.height * zoom) === 'callout'
    })
    // stable order: top-to-bottom, left-to-right so the result doesn't flicker
    .sort((a, b) => {
      const ba = boundsById.get(a.id)!
      const bb = boundsById.get(b.id)!
      return ba.y - bb.y || ba.x - bb.x || a.id.localeCompare(b.id)
    })

  const dimBoxes = dimensionObstacles(dimensions, zoom)
  const placed: Rect[] = []

  for (const el of smalls) {
    const eb = boundsById.get(el.id)!
    const anchor: Point = { x: eb.x + eb.width / 2, y: eb.y + eb.height / 2 }
    const { title, subtitle } = getCalloutText(el)
    const label = shortLabel(title)

    const textW = Math.max(label.length * CHAR_W_TITLE, subtitle.length * CHAR_W_SUB) * px
    const textH = LABEL_HEIGHT * px

    // Segment-local reference (never the global bounding box of an L)
    const ct = findCountertop(el, elements)
    let seg: ReferenceBounds | undefined
    let globalBounds: Rect | undefined
    if (ct) {
      const r = getElementReferenceBounds(el, ct)
      seg = { left: r.left, right: r.right, top: r.top, bottom: r.bottom, segmentId: r.segmentId }
      globalBounds = boundsById.get(ct.id)
    }

    const radius = Math.max(Math.min(eb.width, eb.height) / 2, (MIN_VISUAL_SIZE / 2) * px)

    const prefSide = seg ? (anchor.x > (seg.left + seg.right) / 2 ? 1 : -1) : 1
    // Dimension lines sit above elements → prefer below unless the segment ends there
    const prefVert = seg && anchor.y + 60 * px > seg.bottom - 10 ? -1 : 1

    type Cand = { sx: number; sy: number; k: number }
    const cands: Cand[] = []
    for (const k of [1, 1.7, 2.4]) {
      cands.push(
        { sx: prefSide, sy: prefVert, k },
        { sx: -prefSide, sy: prefVert, k },
        { sx: prefSide, sy: -prefVert, k },
        { sx: -prefSide, sy: -prefVert, k },
        { sx: prefSide, sy: 0, k },
        { sx: -prefSide, sy: 0, k },
      )
    }

    const obstacles = elements
      .filter(o => o.id !== el.id && OBSTACLE_TYPES.has(o.type) && boundsById.has(o.id))
      .map(o => boundsById.get(o.id)!)

    let best: { layout: CalloutLayout; score: number } | null = null

    for (const c of cands) {
      const dx = c.sx * LEADER_DX * c.k * px
      const dy = c.sy * LEADER_DY * c.k * px
      const elbow: Point = { x: anchor.x + dx, y: anchor.y + dy }
      const end: Point = { x: elbow.x + c.sx * LEADER_STUB * px, y: elbow.y }
      const len = Math.hypot(dx, dy) || 1
      const start: Point = { x: anchor.x + (dx / len) * radius, y: anchor.y + (dy / len) * radius }

      const textStartX = end.x + c.sx * TEXT_GAP * px
      const labelBox: Rect = {
        x: c.sx > 0 ? textStartX : textStartX - textW,
        y: end.y - textH / 2,
        width: textW,
        height: textH,
      }
      const padded = inflate(labelBox, BOX_PADDING * px)
      const legs = [segmentBox(start, elbow, px), segmentBox(elbow, end, px)]

      let collisions = 0
      for (const p of placed) if (overlaps(padded, p)) collisions++
      for (const o of obstacles) {
        if (overlaps(padded, o)) collisions++
        if (legs.some(l => overlaps(l, o))) collisions++
      }
      for (const d of dimBoxes) {
        if (overlaps(padded, d)) collisions++
      }
      if (seg) {
        const outside =
          labelBox.x < seg.left || labelBox.x + labelBox.width > seg.right ||
          labelBox.y < seg.top || labelBox.y + labelBox.height > seg.bottom
        if (outside) collisions += 1
      }

      const layout: CalloutLayout = {
        elementId: el.id, anchor, start, elbow, end,
        linePath: [start, elbow, end],
        textAnchor: c.sx > 0 ? 'start' : 'end',
        labelBox, label, secondaryLabel: subtitle,
        elementBounds: eb, segmentBounds: seg, globalBounds, collisions,
      }
      // tiny penalty for longer leaders keeps callouts close when equally clean
      const score = collisions * 10 + c.k
      if (!best || score < best.score) best = { layout, score }
      if (collisions === 0) break
    }

    if (best) {
      result.set(el.id, best.layout)
      placed.push(inflate(best.layout.labelBox, BOX_PADDING * px))
    }
  }

  return result
}
