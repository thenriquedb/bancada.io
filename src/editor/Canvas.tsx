import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  useEditorStore,
  selectViewport,
  selectActiveTool,
  selectSelectedIds,
  selectSettings,
  selectElements,
  selectHoveredId,
} from '../store/editorStore.ts'
import { screenToWorld, rectFromPoints } from './geometry/coordinates.ts'
import { snapPoint } from './snapping/snapping.ts'
import { getElementBounds, clampChildToParent, getChildrenBounds, isInsideBounds } from './geometry/bounds.ts'
import { getLHandles, hitTestLHandle, applyLResize } from './geometry/lshapeHandles.ts'
import type { LHandle } from './geometry/lshapeHandles.ts'
import { Grid } from './rendering/Grid.tsx'
import { SelectionOverlay } from './rendering/SelectionOverlay.tsx'
import { CountertopRenderer } from './rendering/CountertopRenderer.tsx'
import { SinkRenderer } from './rendering/SinkRenderer.tsx'
import { CooktopRenderer } from './rendering/CooktopRenderer.tsx'
import { FaucetRenderer } from './rendering/FaucetRenderer.tsx'
import { TrashRenderer } from './rendering/TrashRenderer.tsx'
import { WetAreaRenderer } from './rendering/WetAreaRenderer.tsx'
import { BacksplashRenderer } from './rendering/BacksplashRenderer.tsx'
import { CutoutRenderer } from './rendering/CutoutRenderer.tsx'
import { AnnotationRenderer } from './rendering/AnnotationRenderer.tsx'
import { DimensionRenderer } from './rendering/DimensionRenderer.tsx'
import { generateAutoDimensions } from './geometry/dimensions.ts'
import { generateId } from '../utils/helpers.ts'
import type { Point, ProjectElement, CountertopElement, WetAreaElement, ValidationWarning } from '../models/types.ts'

const MIN_ZOOM = 0.04
const MAX_ZOOM = 12
const MIN_DIM  = 100   // minimum mm size when resizing

// ─── Types ────────────────────────────────────────────────────────────────────

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | LHandle

type DragState =
  | { type: 'none' }
  | { type: 'panning'; startX: number; startY: number; startPanX: number; startPanY: number }
  | { type: 'selecting'; startWorld: Point; currentWorld: Point }
  | {
      type: 'moving'
      elementIds: string[]
      startWorld: Point
      originalPositions: Map<string, Point>
    }
  | {
      type: 'resizing'
      elementId: string
      handle: ResizeHandle
      startWorld: Point
      /** Bounding-box at drag start – used for standard elements */
      originalBounds: { x: number; y: number; width: number; height: number }
      /** L-shape geometry at drag start – used for l-shape countertops */
      originalLGeo?: { px: number; py: number; aW: number; aD: number; bW: number; bD: number }
    }

// ─── Hit testing ──────────────────────────────────────────────────────────────

function hitTest(el: ProjectElement, pt: Point): boolean {
  const b = getElementBounds(el)
  if (!b) return false
  return pt.x >= b.x && pt.x <= b.x + b.width && pt.y >= b.y && pt.y <= b.y + b.height
}

/** Returns handle name if screenPt is near one, else null. */
function getResizeHandleAtScreen(
  el: ProjectElement,
  screenPt: Point,
  zoom: number,
  panX: number,
  panY: number,
): ResizeHandle | null {
  // L-shape countertop: use polygon-edge handles
  if (el.type === 'countertop' && (el as CountertopElement).geometry.type === 'l-shape') {
    const g = (el as CountertopElement).geometry
    if (g.type !== 'l-shape') return null
    const { segmentA: sA, segmentB: sB } = g
    const handles = getLHandles(
      el.position.x, el.position.y,
      sA.width, sA.depth, sB.width, sB.depth,
      zoom, panX, panY
    )
    return hitTestLHandle(handles, screenPt)
  }

  // Standard bounding-box handles for other resizable types
  const resizable = el.type === 'countertop' || el.type === 'sink' ||
    el.type === 'cooktop' || el.type === 'wet-area' || el.type === 'backsplash' || el.type === 'cutout'
  if (!resizable) return null

  const b = getElementBounds(el)
  if (!b) return null

  const sx = b.x * zoom + panX
  const sy = b.y * zoom + panY
  const sw = b.width  * zoom
  const sh = b.height * zoom

  const CORNER_HIT = 10
  const EDGE_HIT   = 8

  const handles: Array<{ name: ResizeHandle; sx: number; sy: number; hit: number }> = [
    { name: 'nw', sx,        sy,        hit: CORNER_HIT },
    { name: 'ne', sx: sx+sw, sy,        hit: CORNER_HIT },
    { name: 'se', sx: sx+sw, sy: sy+sh, hit: CORNER_HIT },
    { name: 'sw', sx,        sy: sy+sh, hit: CORNER_HIT },
    { name: 'n',  sx: sx+sw/2, sy,        hit: EDGE_HIT },
    { name: 's',  sx: sx+sw/2, sy: sy+sh, hit: EDGE_HIT },
    { name: 'e',  sx: sx+sw,   sy: sy+sh/2, hit: EDGE_HIT },
    { name: 'w',  sx,          sy: sy+sh/2, hit: EDGE_HIT },
  ]

  for (const h of handles) {
    const dx = Math.abs(screenPt.x - h.sx)
    const dy = Math.abs(screenPt.y - h.sy)
    if (dx <= h.hit && dy <= h.hit) return h.name
  }
  return null
}

function applyResize(
  el: ProjectElement,
  handle: ResizeHandle,
  ob: { x: number; y: number; width: number; height: number },
  dx: number,
  dy: number,
  store: ReturnType<typeof useEditorStore>,
  elements: ProjectElement[],
  originalLGeo?: { px: number; py: number; aW: number; aD: number; bW: number; bD: number },
) {
  let actualDx = dx
  let actualDy = dy

  // Constrain resize so parent doesn't shrink past its children
  const cBounds = getChildrenBounds(el.id, elements)
  if (cBounds) {
    if (handle.includes('e')) {
      const minDx = (cBounds.x + cBounds.width) - (ob.x + ob.width)
      actualDx = Math.max(actualDx, minDx)
    }
    if (handle.includes('w')) {
      const maxDx = cBounds.x - ob.x
      actualDx = Math.min(actualDx, maxDx)
    }
    if (handle.includes('s')) {
      const minDy = (cBounds.y + cBounds.height) - (ob.y + ob.height)
      actualDy = Math.max(actualDy, minDy)
    }
    if (handle.includes('n')) {
      const maxDy = cBounds.y - ob.y
      actualDy = Math.min(actualDy, maxDy)
    }
  }

  // Clamp dx and dy to parent bounds if it is a child
  if ('parentId' in el && (el as any).parentId) {
    const parent = elements.find(p => p.id === (el as any).parentId)
    if (parent) {
      const pBounds = getElementBounds(parent)
      if (pBounds) {
        if (handle.includes('e')) {
          const maxDx = pBounds.x + pBounds.width - (ob.x + ob.width)
          actualDx = Math.min(actualDx, maxDx)
        }
        if (handle.includes('w')) {
          const minDx = pBounds.x - ob.x
          actualDx = Math.max(actualDx, minDx)
        }
        if (handle.includes('s')) {
          const maxDy = pBounds.y + pBounds.height - (ob.y + ob.height)
          actualDy = Math.min(actualDy, maxDy)
        }
        if (handle.includes('n')) {
          const minDy = pBounds.y - ob.y
          actualDy = Math.max(actualDy, minDy)
        }
      }
    }
  }

  // ── L-shape: use ORIGINAL geometry captured at drag start ────────────────
  if (el.type === 'countertop' && (el as CountertopElement).geometry.type === 'l-shape') {
    if (!originalLGeo) return  // safety guard
    const result = applyLResize(handle as LHandle, originalLGeo, actualDx, actualDy, MIN_DIM)
    store.updateElement(el.id, {
      position: { x: Math.round(result.px / 5) * 5, y: Math.round(result.py / 5) * 5 },
      geometry: {
        type: 'l-shape',
        segmentA: { width: Math.round(result.aW / 5) * 5, depth: Math.round(result.aD / 5) * 5 },
        segmentB: { width: Math.round(result.bW / 5) * 5, depth: Math.round(result.bD / 5) * 5 },
      },
    } as Partial<CountertopElement>)
    return
  }

  let nx = ob.x, ny = ob.y, nw = ob.width, nh = ob.height

  if (handle.includes('e'))  nw = Math.max(MIN_DIM, ob.width  + actualDx)
  if (handle.includes('s'))  nh = Math.max(MIN_DIM, ob.height + actualDy)
  if (handle.includes('w')) { nx = ob.x + actualDx; nw = Math.max(MIN_DIM, ob.width  - actualDx) }
  if (handle.includes('n')) { ny = ob.y + actualDy; nh = Math.max(MIN_DIM, ob.height - actualDy) }

  nx = Math.round(nx / 5) * 5; ny = Math.round(ny / 5) * 5
  nw = Math.round(nw / 5) * 5; nh = Math.round(nh / 5) * 5

  switch (el.type) {
    case 'countertop':
      if ((el as CountertopElement).geometry.type === 'reta') {
        store.updateElement(el.id, {
          position: { x: nx, y: ny },
          geometry: { type: 'reta', width: nw, depth: nh },
        } as Partial<CountertopElement>)
      }
      break
    case 'sink':
      store.updateElement(el.id, { position: { x: nx, y: ny }, width: nw, depth: nh })
      break
    case 'cooktop': {
      const cooktop = el as CooktopElement
      if (cooktop.displayMode === 'cutout') {
        const cw = nw
        const cd = nh
        const newPosX = nx + cw / 2 - cooktop.width / 2
        const newPosY = ny + cd / 2 - cooktop.depth / 2
        store.updateElement(cooktop.id, { position: { x: newPosX, y: newPosY }, cutWidth: cw, cutDepth: cd })
      } else {
        store.updateElement(cooktop.id, { position: { x: nx, y: ny }, width: nw, depth: nh })
      }
      break
    }
    case 'wet-area':
      store.updateElement(el.id, { position: { x: nx, y: ny }, width: nw, depth: nh })
      break
    case 'backsplash':
      store.updateElement(el.id, { position: { x: nx, y: ny }, length: nw, height: nh })
      break
    case 'cutout':
      if (el.shape === 'circular') {
        const d = Math.max(nw, nh) // keep it circular
        store.updateElement(el.id, { position: { x: nx, y: ny }, diameter: d })
      } else {
        store.updateElement(el.id, { position: { x: nx, y: ny }, width: nw, depth: nh })
      }
      break
  }
}

// ─── Canvas ───────────────────────────────────────────────────────────────────

type CanvasProps = {
  warnings?: ValidationWarning[]
}

export const Canvas: React.FC<CanvasProps> = ({ warnings = [] }) => {
  const svgRef  = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [drag, setDrag] = useState<DragState>({ type: 'none' })
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null)
  const [isSpacePressed, setIsSpacePressed] = useState(false)

  const viewport    = useEditorStore(selectViewport)
  const activeTool  = useEditorStore(selectActiveTool)
  const selectedIds = useEditorStore(selectSelectedIds)
  const settings    = useEditorStore(selectSettings)
  const elements    = useEditorStore(selectElements)
  const hoveredId   = useEditorStore(selectHoveredId)
  const store       = useEditorStore()

  // ── Resize observer ──────────────────────────────────────────────────────
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const e = entries[0]
      if (e) setSize({ width: e.contentRect.width, height: e.contentRect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Keyboard shortcuts (Space to pan) ────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true)
        if (e.target === document.body) {
           e.preventDefault()
        }
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // ── Wheel zoom ───────────────────────────────────────────────────────────
  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault()
      const rect = svgRef.current?.getBoundingClientRect()
      if (!rect) return
      const ox = e.clientX - rect.left
      const oy = e.clientY - rect.top
      const factor = e.deltaY > 0 ? 0.88 : 1.14
      store.setZoom(Math.min(Math.max(viewport.zoom * factor, MIN_ZOOM), MAX_ZOOM), ox, oy)
    },
    [viewport.zoom, store]
  )

  // ── SVG-relative mouse position ──────────────────────────────────────────
  const getSvgPt = useCallback((e: React.MouseEvent): Point => {
    const r = svgRef.current?.getBoundingClientRect()
    if (!r) return { x: 0, y: 0 }
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }, [])

  // ── Mouse down ───────────────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (e.button !== 0 && e.button !== 1) return
      e.preventDefault()
      const screen = getSvgPt(e)
      const world  = screenToWorld(screen.x, screen.y, viewport.panX, viewport.panY, viewport.zoom)

      // Pan tool / middle button / spacebar
      if (e.button === 1 || activeTool === 'pan' || isSpacePressed) {
        setDrag({ type: 'panning', startX: screen.x, startY: screen.y, startPanX: viewport.panX, startPanY: viewport.panY })
        return
      }

      if (activeTool === 'annotation') {
        const snapped = snapPoint(world, { gridSize: settings.gridSpacing, snapToGrid: settings.snapToGrid })
        const newId = generateId('annotation')
        store.pushHistory()
        store.addElement({
          type: 'annotation',
          id: newId,
          text: 'Texto',
          fontSize: 150,
          position: snapped,
          locked: false,
          visible: true,
        })
        store.setActiveTool('select')
        store.setSelectedIds([newId])
        return
      }

      if (activeTool === 'select') {
        // ── Check resize handles on selected elements first ───────────────
        for (const id of selectedIds) {
          const el = elements.find((el) => el.id === id)
          if (!el) continue
          const handle = getResizeHandleAtScreen(el, screen, viewport.zoom, viewport.panX, viewport.panY)
          if (handle) {
            const b = getElementBounds(el)!
            // Capture original L-shape geometry at drag start
            let originalLGeo: { px: number; py: number; aW: number; aD: number; bW: number; bD: number } | undefined
            if (el.type === 'countertop' && (el as CountertopElement).geometry.type === 'l-shape') {
              const g = (el as CountertopElement).geometry
              if (g.type === 'l-shape') {
                originalLGeo = {
                  px: el.position.x,
                  py: el.position.y,
                  aW: g.segmentA.width,
                  aD: g.segmentA.depth,
                  bW: g.segmentB.width,
                  bD: g.segmentB.depth,
                }
              }
            }
            store.pushHistory()
            setDrag({
              type: 'resizing',
              elementId: id,
              handle,
              startWorld: world,
              originalBounds: { x: b.x, y: b.y, width: b.width, height: b.height },
              originalLGeo,
            })
            return
          }
        }

        // ── Hit test elements ──────────────────────────────────────────────
        const hit = [...elements].reverse().find((el) => hitTest(el, world))

        if (hit) {
          const alreadySelected = selectedIds.includes(hit.id)
          if (e.shiftKey) {
            store.setSelectedIds(
              alreadySelected
                ? selectedIds.filter((id: string) => id !== hit.id)
                : [...selectedIds, hit.id]
            )
          } else if (!alreadySelected) {
            store.setSelectedIds([hit.id])
          }

          const idsToMove = e.shiftKey
            ? alreadySelected
              ? selectedIds.filter((id: string) => id !== hit.id)
              : [...selectedIds, hit.id]
            : alreadySelected ? selectedIds : [hit.id]

          const origPos = new Map<string, Point>()
          // 1. Initial explicit selection
          elements.forEach((el: ProjectElement) => {
            if (idsToMove.includes(el.id)) origPos.set(el.id, { ...el.position })
          })

          // 2. Recursively add visual descendants
          let added = true
          while (added) {
            added = false
            elements.forEach((el: ProjectElement) => {
              if (origPos.has(el.id)) return
              
              if (!('parentId' in el)) return
              
              let parentId = (el as any).parentId
              
              // For accessories (not countertops, wet-areas, backsplashes), compute the visual parent
              if (el.type !== 'countertop' && el.type !== 'wet-area' && el.type !== 'backsplash') {
                const containingWetAreas = elements.filter(p => p.type === 'wet-area' && (() => {
                  const cb = getElementBounds(el)
                  const pb = getElementBounds(p)
                  return cb && pb && isInsideBounds(cb, pb)
                })())
                if (containingWetAreas.length > 0) {
                  parentId = containingWetAreas[0].id
                }
              }

              if (origPos.has(parentId)) {
                origPos.set(el.id, { ...el.position })
                added = true
              }
            })
          }

          setDrag({ type: 'moving', elementIds: idsToMove, startWorld: world, originalPositions: origPos })
        } else {
          if (!e.shiftKey) store.clearSelection()
          const snapped = snapPoint(world, { gridSize: settings.gridSpacing, snapToGrid: settings.snapToGrid })
          setDrag({ type: 'selecting', startWorld: snapped, currentWorld: snapped })
        }
      }
    },
    [activeTool, elements, getSvgPt, selectedIds, settings, store, viewport, isSpacePressed]
  )

  // ── Mouse move ───────────────────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const screen = getSvgPt(e)
      const world  = screenToWorld(screen.x, screen.y, viewport.panX, viewport.panY, viewport.zoom)

      if (drag.type === 'panning') {
        store.setViewport({ panX: drag.startPanX + screen.x - drag.startX, panY: drag.startPanY + screen.y - drag.startY })
        return
      }

      const snapped = snapPoint(world, { gridSize: settings.gridSpacing, snapToGrid: settings.snapToGrid })

      if (drag.type === 'selecting') {
        setDrag({ ...drag, currentWorld: snapped })
        return
      }

      if (drag.type === 'moving') {
        const dx = snapped.x - drag.startWorld.x
        const dy = snapped.y - drag.startWorld.y
        drag.originalPositions.forEach((orig, id) => {
          const el = elements.find(e => e.id === id)
          if (!el) return
          let nx = orig.x + dx
          let ny = orig.y + dy

          if ('parentId' in el && (el as any).parentId) {
            const parent = elements.find(p => p.id === (el as any).parentId)
            const pBounds = parent ? getElementBounds(parent) : null
            const eBounds = getElementBounds(el)
            if (pBounds && eBounds) {
               nx = Math.max(pBounds.x, Math.min(nx, pBounds.x + pBounds.width - eBounds.width))
               ny = Math.max(pBounds.y, Math.min(ny, pBounds.y + pBounds.height - eBounds.height))
            }
          }

          nx = Math.round(nx / 5) * 5
          ny = Math.round(ny / 5) * 5

          store.updateElement(id, { position: { x: nx, y: ny } })
        })
        return
      }

      if (drag.type === 'resizing') {
        const dx = snapped.x - drag.startWorld.x
        const dy = snapped.y - drag.startWorld.y
        const el = elements.find((el) => el.id === drag.elementId)
        if (el) applyResize(el, drag.handle, drag.originalBounds, dx, dy, store, elements, drag.originalLGeo)
        return
      }

      // ── Hover: check handle first, then element ────────────────────────
      if (!hoveredHandle) {
        const hit = [...elements].reverse().find((el: ProjectElement) => hitTest(el, world))
        store.setHoveredId(hit?.id ?? null)
      }
    },
    [drag, elements, getSvgPt, hoveredHandle, settings, store, viewport]
  )

  // ── Mouse up ─────────────────────────────────────────────────────────────
  const handleMouseUp = useCallback(
    (_e: React.MouseEvent<SVGSVGElement>) => {
      if (drag.type === 'selecting') {
        const sel = rectFromPoints(drag.startWorld, drag.currentWorld)
        if (sel.width > 2 && sel.height > 2) {
          const hits = elements.filter((el: ProjectElement) => {
            const b = getElementBounds(el)
            if (!b) return false
            return b.x >= sel.x && b.y >= sel.y &&
              b.x + b.width  <= sel.x + sel.width &&
              b.y + b.height <= sel.y + sel.height
          })
          store.setSelectedIds(hits.map((el: ProjectElement) => el.id))
        }
      } else if (drag.type === 'moving' || drag.type === 'resizing') {
        store.pushHistory()
      }
      setDrag({ type: 'none' })
    },
    [drag, elements, store]
  )

  const handleMouseLeave = useCallback(() => {
    store.setHoveredId(null)
    if (drag.type === 'panning') setDrag({ type: 'none' })
  }, [store, drag])

  // ── Cursor ───────────────────────────────────────────────────────────────
  let cursor = 'default'
  if (activeTool === 'annotation') {
    cursor = 'text'
  } else if (activeTool === 'pan' || isSpacePressed) {
    cursor = drag.type === 'panning' ? 'grabbing' : 'grab'
  } else if (drag.type === 'panning') {
    cursor = 'grabbing'
  } else if (drag.type === 'moving') {
    cursor = 'move'
  } else if (drag.type === 'resizing') {
    const cursors: Record<ResizeHandle, string> = {
      nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize', e: 'e-resize',
      se: 'se-resize', s: 's-resize', sw: 'sw-resize', w: 'w-resize',
    }
    cursor = cursors[drag.handle]
  } else if (hoveredHandle) {
    const h = hoveredHandle.split(':')[1] as ResizeHandle | undefined
    const cursors: Record<ResizeHandle, string> = {
      nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize', e: 'e-resize',
      se: 'se-resize', s: 's-resize', sw: 'sw-resize', w: 'w-resize',
    }
    cursor = h ? (cursors[h] ?? 'default') : 'default'
  } else if (hoveredId) {
    cursor = 'move'
  }

  // ── Rubber-band selection rect ───────────────────────────────────────────
  let selectionRect: React.ReactNode = null
  if (drag.type === 'selecting') {
    const r = rectFromPoints(drag.startWorld, drag.currentWorld)
    selectionRect = (
      <rect
        x={r.x * viewport.zoom + viewport.panX}
        y={r.y * viewport.zoom + viewport.panY}
        width={r.width * viewport.zoom}
        height={r.height * viewport.zoom}
        fill="var(--selection-fill)"
        stroke="var(--selection-color)"
        strokeWidth={1}
        strokeDasharray="4 3"
        pointerEvents="none"
      />
    )
  }

  // ── Auto-dimensions ──────────────────────────────────────────────────────
  const unit = settings.unit
  const autoDimensions = useMemo(() => {
    if (!settings.showDimensions) return []
    const parents = elements.filter((el): el is CountertopElement | WetAreaElement => el.type === 'countertop' || el.type === 'wet-area')
    
    return parents.flatMap((parent) => {
      const children = elements.filter((el) => {
        if (!('parentId' in el)) return false
        if (el.type === 'countertop' || el.type === 'backsplash') return false

        // Wet-areas just use their exact parent (the countertop)
        if (el.type === 'wet-area') {
          return parent.id === (el as any).parentId
        }

        const containingWetAreas = parents.filter(p => p.type === 'wet-area' && (() => {
          const cb = getElementBounds(el);
          const pb = getElementBounds(p);
          return cb && pb && isInsideBounds(cb, pb);
        })())
        // The visual direct parent is the wet area it is inside, otherwise its actual parent
        const visualDirectParent = containingWetAreas.length > 0 
          ? containingWetAreas[0] 
          : parents.find(p => p.id === (el as any).parentId)

        if (parent.id === visualDirectParent?.id) {
          return true
        }

        if (parent.type === 'countertop' && containingWetAreas.length > 0) {
          const rootId = (visualDirectParent as any)?.parentId
          if (rootId === parent.id) {
            return el.dimRoot === true
          }
        }
        
        return false
      }).map(el => {
        if (el.type === 'wet-area') {
           return { ...el, _isVisualDirect: true }
        }
        const containingWetAreas = parents.filter(p => p.type === 'wet-area' && (() => {
          const cb = getElementBounds(el);
          const pb = getElementBounds(p);
          return cb && pb && isInsideBounds(cb, pb);
        })())
        const visualDirectParent = containingWetAreas.length > 0 
          ? containingWetAreas[0] 
          : parents.find(p => p.id === (el as any).parentId)
          
        return { ...el, _isVisualDirect: parent.id === visualDirectParent?.id }
      })
      const countertopId = parent.type === 'countertop' ? parent.id : parent.parentId || parent.id
      return generateAutoDimensions(parent, children, unit, countertopId)
    })
  }, [elements, settings.showDimensions, unit])

  // ── Room bounds ──────────────────────────────────────────────────────────
  const roomBounds = settings.roomBounds
  const showRoom = roomBounds?.show && roomBounds.width > 0 && roomBounds.height > 0

  return (
    <svg
      ref={svgRef}
      className="editor-canvas"
      style={{ cursor, display: 'block', width: '100%', height: '100%' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      role="application"
      aria-label="Editor de bancada"
      tabIndex={0}
    >
      {/* Grid */}
      <Grid
        panX={viewport.panX} panY={viewport.panY} zoom={viewport.zoom}
        gridSize={settings.gridSpacing}
        canvasWidth={size.width} canvasHeight={size.height}
        showGrid={settings.showGrid}
      />

      {/* World-space group */}
      <g transform={`translate(${viewport.panX},${viewport.panY}) scale(${viewport.zoom})`}>

        {/* Room bounds outline */}
        {showRoom && roomBounds && (
          <RoomBoundsRenderer
            width={roomBounds.width}
            height={roomBounds.height}
            zoom={viewport.zoom}
          />
        )}

        {/* All elements */}
        {elements.map((el: ProjectElement) => {
          const hasError = warnings.some(w => w.type === 'elements-overlapping' && w.elementIds.includes(el.id))
          return (
            <g key={el.id} data-element-id={el.id}>
              <ElementRenderer
                element={el}
                selected={selectedIds.includes(el.id)}
                hovered={hoveredId === el.id}
                hasError={hasError}
                zoom={viewport.zoom}
              />
            </g>
          )
        })}

        {/* Auto-dimensions */}
        {autoDimensions.length > 0 && (
          <DimensionRenderer dimensions={autoDimensions} zoom={viewport.zoom} />
        )}

        {/* Drag Guides */}
        {drag.type === 'moving' && (
          <g className="drag-guides" pointerEvents="none" opacity={0.6}>
            {drag.elementIds.map(id => {
              const el = elements.find(e => e.id === id)
              if (!el) return null
              const b = getElementBounds(el)
              if (!b) return null
              return (
                <React.Fragment key={`guide-${id}`}>
                  <line x1={-10000} y1={b.y} x2={10000} y2={b.y} stroke="#339af0" strokeWidth={1.5/viewport.zoom} strokeDasharray="5 5" />
                  <line x1={-10000} y1={b.y + b.height} x2={10000} y2={b.y + b.height} stroke="#339af0" strokeWidth={1.5/viewport.zoom} strokeDasharray="5 5" />
                  <line x1={b.x} y1={-10000} x2={b.x} y2={10000} stroke="#339af0" strokeWidth={1.5/viewport.zoom} strokeDasharray="5 5" />
                  <line x1={b.x + b.width} y1={-10000} x2={b.x + b.width} y2={10000} stroke="#339af0" strokeWidth={1.5/viewport.zoom} strokeDasharray="5 5" />
                </React.Fragment>
              )
            })}
          </g>
        )}
      </g>

      {/* Selection overlay with resize handles (screen-space) */}
      <SelectionOverlay
        elements={elements}
        selectedIds={selectedIds}
        zoom={viewport.zoom}
        panX={viewport.panX}
        panY={viewport.panY}
        hoveredHandle={hoveredHandle}
        onHandleEnter={(key) => {
          setHoveredHandle(key)
          store.setHoveredId(null)
        }}
        onHandleLeave={() => setHoveredHandle(null)}
      />

      {/* Rubber-band selection */}
      {selectionRect}
    </svg>
  )
}

// ─── Room bounds renderer ─────────────────────────────────────────────────────

const RoomBoundsRenderer: React.FC<{ width: number; height: number; zoom: number }> = ({ width, height }) => {
  const fmtCm = (mm: number) => `${(mm / 10).toFixed(0)} cm`
  return (
    <g className="room-bounds" pointerEvents="none">
      {/* Shadow fill outside room */}
      <rect x={-2000} y={-2000} width={width + 4000} height={height + 4000}
        fill="rgba(0,0,0,0.04)" />
      {/* Room area */}
      <rect x={0} y={0} width={width} height={height}
        fill="rgba(255,255,255,0.7)" stroke="none" />
      {/* Border */}
      <rect x={0} y={0} width={width} height={height}
        fill="none" stroke="#1971c2" strokeWidth={4} strokeDasharray="20 8" opacity={0.5} />
      {/* Corner markers */}
      {[
        [0, 0], [width, 0], [0, height], [width, height]
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={10} fill="#1971c2" opacity={0.3} />
      ))}
      {/* Label */}
      <text x={width / 2} y={-30} textAnchor="middle"
        fontSize={30} fontFamily="Inter, sans-serif" fill="#1971c2" opacity={0.7} fontWeight="500">
        Cômodo: {fmtCm(width)} × {fmtCm(height)}
      </text>
    </g>
  )
}

// ─── Per-element dispatcher ───────────────────────────────────────────────────

type ElementRendererProps = {
  element:  ProjectElement
  selected: boolean
  hovered:  boolean
  hasError: boolean
  zoom:     number
}

const ElementRenderer: React.FC<ElementRendererProps> = ({ element, selected, hovered, hasError, zoom }) => {
  if (!element.visible) return null

  switch (element.type) {
    case 'countertop':
      return <CountertopRenderer element={element} selected={selected} hovered={hovered} />
    case 'sink':
      return <SinkRenderer element={element} selected={selected} hovered={hovered} hasError={hasError} zoom={zoom} />
    case 'cooktop':
      return <CooktopRenderer element={element} selected={selected} hovered={hovered} hasError={hasError} zoom={zoom} />
    case 'faucet':
      return <FaucetRenderer element={element} selected={selected} hovered={hovered} hasError={hasError} />
    case 'trash':
      return <TrashRenderer element={element} selected={selected} hovered={hovered} hasError={hasError} zoom={zoom} />
    case 'wet-area':
      return <WetAreaRenderer element={element} selected={selected} hovered={hovered} zoom={zoom} />
    case 'backsplash':
      return <BacksplashRenderer element={element} selected={selected} hovered={hovered} />
    case 'cutout':
      return <CutoutRenderer element={element} selected={selected} hovered={hovered} zoom={zoom} />
    case 'dimension':
      return null // handled via auto-dims
    case 'annotation':
      return <AnnotationRenderer element={element} selected={selected} hovered={hovered} zoom={zoom} />
    default:
      return null
  }
}
