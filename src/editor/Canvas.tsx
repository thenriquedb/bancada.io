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
import { getElementBounds } from './geometry/bounds.ts'
import { Grid } from './rendering/Grid.tsx'
import { SelectionOverlay } from './rendering/SelectionOverlay.tsx'
import { CountertopRenderer } from './rendering/CountertopRenderer.tsx'
import { SinkRenderer } from './rendering/SinkRenderer.tsx'
import { CooktopRenderer } from './rendering/CooktopRenderer.tsx'
import { FaucetRenderer } from './rendering/FaucetRenderer.tsx'
import { TrashRenderer } from './rendering/TrashRenderer.tsx'
import { WetAreaRenderer } from './rendering/WetAreaRenderer.tsx'
import { BacksplashRenderer } from './rendering/BacksplashRenderer.tsx'
import { DimensionRenderer } from './rendering/DimensionRenderer.tsx'
import { generateAutoDimensions } from './geometry/dimensions.ts'
import type { Point, ProjectElement, CountertopElement } from '../models/types.ts'

const MIN_ZOOM = 0.04
const MAX_ZOOM = 12

// ─── Drag state ───────────────────────────────────────────────────────────────

type DragState =
  | { type: 'none' }
  | { type: 'panning'; startX: number; startY: number; startPanX: number; startPanY: number }
  | { type: 'selecting'; startWorld: Point; currentWorld: Point }
  | {
      type: 'moving'
      elementIds: string[]
      startWorld: Point
      currentWorld: Point
      originalPositions: Map<string, Point>
    }
  | {
      type: 'resizing'
      elementId: string
      handle: ResizeHandle
      startWorld: Point
      currentWorld: Point
      originalBounds: { x: number; y: number; width: number; height: number }
    }

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

// ─── Hit testing ──────────────────────────────────────────────────────────────

function hitTest(el: ProjectElement, pt: Point): boolean {
  const b = getElementBounds(el)
  if (!b) return false
  return pt.x >= b.x && pt.x <= b.x + b.width && pt.y >= b.y && pt.y <= b.y + b.height
}

function getResizeHandle(
  el: ProjectElement,
  screenPt: Point,
  zoom: number,
  panX: number,
  panY: number
): ResizeHandle | null {
  const b = getElementBounds(el)
  if (!b) return null
  const hs = 7 // handle size in px
  const handles: Array<{ name: ResizeHandle; sx: number; sy: number }> = [
    { name: 'nw', sx: b.x * zoom + panX,                    sy: b.y * zoom + panY },
    { name: 'n',  sx: (b.x + b.width / 2) * zoom + panX,    sy: b.y * zoom + panY },
    { name: 'ne', sx: (b.x + b.width) * zoom + panX,         sy: b.y * zoom + panY },
    { name: 'e',  sx: (b.x + b.width) * zoom + panX,         sy: (b.y + b.height / 2) * zoom + panY },
    { name: 'se', sx: (b.x + b.width) * zoom + panX,         sy: (b.y + b.height) * zoom + panY },
    { name: 's',  sx: (b.x + b.width / 2) * zoom + panX,    sy: (b.y + b.height) * zoom + panY },
    { name: 'sw', sx: b.x * zoom + panX,                    sy: (b.y + b.height) * zoom + panY },
    { name: 'w',  sx: b.x * zoom + panX,                    sy: (b.y + b.height / 2) * zoom + panY },
  ]
  for (const h of handles) {
    if (
      Math.abs(screenPt.x - h.sx) <= hs + 2 &&
      Math.abs(screenPt.y - h.sy) <= hs + 2
    ) return h.name
  }
  return null
}

// ─── Canvas ───────────────────────────────────────────────────────────────────

export const Canvas: React.FC = () => {
  const svgRef  = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [drag, setDrag] = useState<DragState>({ type: 'none' })

  const viewport    = useEditorStore(selectViewport)
  const activeTool  = useEditorStore(selectActiveTool)
  const selectedIds = useEditorStore(selectSelectedIds)
  const settings    = useEditorStore(selectSettings)
  const elements    = useEditorStore(selectElements)
  const hoveredId   = useEditorStore(selectHoveredId)
  const store       = useEditorStore()

  // ── Resize observer ────────────────────────────────────────────────────────
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

  // ── Wheel zoom ─────────────────────────────────────────────────────────────
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

  // ── SVG-relative mouse position ────────────────────────────────────────────
  const getSvgPt = useCallback((e: React.MouseEvent): Point => {
    const r = svgRef.current?.getBoundingClientRect()
    if (!r) return { x: 0, y: 0 }
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }, [])

  // ── Mouse down ─────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (e.button !== 0 && e.button !== 1) return
      e.preventDefault()
      const screen = getSvgPt(e)
      const world  = screenToWorld(screen.x, screen.y, viewport.panX, viewport.panY, viewport.zoom)

      // Pan tool / middle button
      if (e.button === 1 || activeTool === 'pan') {
        setDrag({ type: 'panning', startX: screen.x, startY: screen.y, startPanX: viewport.panX, startPanY: viewport.panY })
        return
      }

      // Select tool
      if (activeTool === 'select') {
        // Check resize handles on selected elements first
        for (const id of selectedIds) {
          const el = elements.find((el) => el.id === id)
          if (!el) continue
          const handle = getResizeHandle(el, screen, viewport.zoom, viewport.panX, viewport.panY)
          if (handle) {
            const b = getElementBounds(el)!
            setDrag({
              type: 'resizing',
              elementId: id,
              handle,
              startWorld: world,
              currentWorld: world,
              originalBounds: { x: b.x, y: b.y, width: b.width, height: b.height },
            })
            return
          }
        }

        // Hit test elements (top-most first)
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
          // Include the moved elements
          elements.forEach((el: ProjectElement) => {
            if (idsToMove.includes(el.id)) origPos.set(el.id, { ...el.position })
          })
          // Also include children of any countertop being moved
          elements.forEach((el: ProjectElement) => {
            if (
              'parentId' in el &&
              !origPos.has(el.id) &&
              idsToMove.includes((el as { parentId: string }).parentId)
            ) {
              origPos.set(el.id, { ...el.position })
            }
          })

          setDrag({ type: 'moving', elementIds: idsToMove, startWorld: world, currentWorld: world, originalPositions: origPos })
        } else {
          if (!e.shiftKey) store.clearSelection()
          const snapped = snapPoint(world, { gridSize: settings.gridSpacing, snapToGrid: settings.snapToGrid })
          setDrag({ type: 'selecting', startWorld: snapped, currentWorld: snapped })
        }
      }
    },
    [activeTool, elements, getSvgPt, selectedIds, settings, store, viewport]
  )

  // ── Mouse move ─────────────────────────────────────────────────────────────
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
        setDrag({ ...drag, currentWorld: snapped })
        const dx = snapped.x - drag.startWorld.x
        const dy = snapped.y - drag.startWorld.y
        // originalPositions includes both selected and their children
        drag.originalPositions.forEach((orig, id) => {
          store.updateElement(id, { position: { x: orig.x + dx, y: orig.y + dy } })
        })
        return
      }

      if (drag.type === 'resizing') {
        setDrag({ ...drag, currentWorld: snapped })
        const { originalBounds: ob, handle, elementId } = drag
        let nx = ob.x, ny = ob.y, nw = ob.width, nh = ob.height

        const dx = snapped.x - drag.startWorld.x
        const dy = snapped.y - drag.startWorld.y

        if (handle.includes('e')) nw = Math.max(50, ob.width + dx)
        if (handle.includes('s')) nh = Math.max(50, ob.height + dy)
        if (handle.includes('w')) { nx = ob.x + dx; nw = Math.max(50, ob.width - dx) }
        if (handle.includes('n')) { ny = ob.y + dy; nh = Math.max(50, ob.height - dy) }

        const el = elements.find((el) => el.id === elementId)
        if (el && el.type === 'countertop') {
          if (el.geometry.type === 'reta') {
            store.updateElement(elementId, {
              position: { x: nx, y: ny },
              geometry: { type: 'reta', width: Math.round(nw), depth: Math.round(nh) },
            } as Partial<CountertopElement>)
          }
        } else if (el) {
          // For other element types, just move position
          store.updateElement(elementId, { position: { x: nx, y: ny } })
        }
        return
      }

      // Hover detection
      const hit = [...elements].reverse().find((el: ProjectElement) => hitTest(el, world))
      store.setHoveredId(hit?.id ?? null)
    },
    [drag, elements, getSvgPt, settings, store, viewport]
  )

  // ── Mouse up ───────────────────────────────────────────────────────────────
  const handleMouseUp = useCallback(
    (_e: React.MouseEvent<SVGSVGElement>) => {
      if (drag.type === 'selecting') {
        const sel = rectFromPoints(drag.startWorld, drag.currentWorld)
        if (sel.width > 2 && sel.height > 2) {
          const hits = elements.filter((el: ProjectElement) => {
            const b = getElementBounds(el)
            if (!b) return false
            return b.x >= sel.x && b.y >= sel.y &&
              b.x + b.width <= sel.x + sel.width &&
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

  // ── Cursor ─────────────────────────────────────────────────────────────────
  let cursor = 'default'
  if (activeTool === 'pan') cursor = drag.type === 'panning' ? 'grabbing' : 'grab'
  else if (drag.type === 'panning') cursor = 'grabbing'
  else if (drag.type === 'moving') cursor = 'move'
  else if (drag.type === 'resizing') {
    const cursors: Record<ResizeHandle, string> = {
      nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize', e: 'e-resize',
      se: 'se-resize', s: 's-resize', sw: 'sw-resize', w: 'w-resize',
    }
    cursor = cursors[drag.type === 'resizing' ? drag.handle : 'se']
  } else if (hoveredId) cursor = 'move'

  // ── Rubber-band rect ───────────────────────────────────────────────────────
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

  // ── Auto-dimensions ────────────────────────────────────────────────────────
  const unit = settings.unit
  const autoDimensions = useMemo(() => {
    if (!settings.showDimensions) return []
    const countertops = elements.filter((el): el is CountertopElement => el.type === 'countertop')
    return countertops.flatMap((ct) => {
      const children = elements.filter((el) => 'parentId' in el && (el as { parentId: string }).parentId === ct.id)
      return generateAutoDimensions(ct, children, unit)
    })
  }, [elements, settings.showDimensions, unit])

  // ── Room bounds ────────────────────────────────────────────────────────────
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
        {elements.map((el: ProjectElement) => (
          <ElementRenderer
            key={el.id}
            element={el}
            selected={selectedIds.includes(el.id)}
            hovered={hoveredId === el.id}
          />
        ))}

        {/* Auto-dimensions */}
        {autoDimensions.length > 0 && (
          <DimensionRenderer dimensions={autoDimensions} zoom={viewport.zoom} />
        )}
      </g>

      {/* Selection overlay (screen-space handles) */}
      <SelectionOverlay
        elements={elements}
        selectedIds={selectedIds}
        zoom={viewport.zoom}
        panX={viewport.panX}
        panY={viewport.panY}
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
  element: ProjectElement
  selected: boolean
  hovered: boolean
}

const ElementRenderer: React.FC<ElementRendererProps> = ({ element, selected, hovered }) => {
  if (!element.visible) return null

  switch (element.type) {
    case 'countertop':
      return <CountertopRenderer element={element} selected={selected} hovered={hovered} />
    case 'sink':
      return <SinkRenderer element={element} selected={selected} hovered={hovered} />
    case 'cooktop':
      return <CooktopRenderer element={element} selected={selected} hovered={hovered} />
    case 'faucet':
      return <FaucetRenderer element={element} selected={selected} hovered={hovered} />
    case 'trash':
      return <TrashRenderer element={element} selected={selected} hovered={hovered} />
    case 'wet-area':
      return <WetAreaRenderer element={element} selected={selected} hovered={hovered} />
    case 'backsplash':
      return <BacksplashRenderer element={element} selected={selected} hovered={hovered} />
    case 'dimension':
      return null // handled via auto-dims
    case 'annotation':
      return (
        <text
          x={element.position.x} y={element.position.y}
          fontSize={element.fontSize} fontFamily="Inter, sans-serif"
          fill={selected ? '#1971c2' : '#333'}
          style={{ userSelect: 'none' }}
        >
          {element.text}
        </text>
      )
    default:
      return null
  }
}
