import React, { useCallback, useEffect, useRef, useState } from 'react'
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
import type { Point, ProjectElement } from '../models/types.ts'

const MIN_ZOOM = 0.05
const MAX_ZOOM = 10

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

/** Hit-test a world-space point against an element. */
function hitTest(el: ProjectElement, worldPt: Point): boolean {
  const bounds = getElementBounds(el)
  if (!bounds) return false
  return (
    worldPt.x >= bounds.x &&
    worldPt.x <= bounds.x + bounds.width &&
    worldPt.y >= bounds.y &&
    worldPt.y <= bounds.y + bounds.height
  )
}

export const Canvas: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [drag, setDrag] = useState<DragState>({ type: 'none' })

  const viewport = useEditorStore(selectViewport)
  const activeTool = useEditorStore(selectActiveTool)
  const selectedIds = useEditorStore(selectSelectedIds)
  const settings = useEditorStore(selectSettings)
  const elements = useEditorStore(selectElements)
  const hoveredId = useEditorStore(selectHoveredId)

  const store = useEditorStore()

  // ── Resize observer ────────────────────────────────────────────────────────
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Zoom from mouse wheel ──────────────────────────────────────────────────
  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault()
      const rect = svgRef.current?.getBoundingClientRect()
      if (!rect) return
      const originX = e.clientX - rect.left
      const originY = e.clientY - rect.top
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.min(Math.max(viewport.zoom * delta, MIN_ZOOM), MAX_ZOOM)
      store.setZoom(newZoom, originX, originY)
    },
    [viewport.zoom, store]
  )

  // ── Get SVG-relative coordinates from a mouse event ───────────────────────
  const getSvgPoint = useCallback((e: React.MouseEvent): Point => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  // ── Pointer down ──────────────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (e.button !== 0 && e.button !== 1) return
      e.preventDefault()
      const screen = getSvgPoint(e)
      const world = screenToWorld(screen.x, screen.y, viewport.panX, viewport.panY, viewport.zoom)

      // Middle button or pan tool → pan
      if (e.button === 1 || activeTool === 'pan') {
        setDrag({
          type: 'panning',
          startX: screen.x,
          startY: screen.y,
          startPanX: viewport.panX,
          startPanY: viewport.panY,
        })
        return
      }

      // Select tool
      if (activeTool === 'select') {
        const hit = [...elements].reverse().find((el) => hitTest(el, world))

        if (hit) {
          const alreadySelected = selectedIds.includes(hit.id)
          if (e.shiftKey) {
            if (alreadySelected) {
              store.setSelectedIds(selectedIds.filter((sid: string) => sid !== hit.id))
            } else {
              store.setSelectedIds([...selectedIds, hit.id])
            }
          } else if (!alreadySelected) {
            store.setSelectedIds([hit.id])
          }

          const idsToMove = e.shiftKey
            ? alreadySelected
              ? selectedIds.filter((sid: string) => sid !== hit.id)
              : [...selectedIds, hit.id]
            : alreadySelected
              ? selectedIds
              : [hit.id]

          const originalPositions = new Map<string, Point>()
          elements.forEach((el: ProjectElement) => {
            if (idsToMove.includes(el.id)) {
              originalPositions.set(el.id, { ...el.position })
            }
          })

          setDrag({
            type: 'moving',
            elementIds: idsToMove,
            startWorld: world,
            currentWorld: world,
            originalPositions,
          })
        } else {
          if (!e.shiftKey) store.clearSelection()
          const snapped = snapPoint(world, {
            gridSize: settings.gridSpacing,
            snapToGrid: settings.snapToGrid,
          })
          setDrag({ type: 'selecting', startWorld: snapped, currentWorld: snapped })
        }
      }
    },
    [activeTool, elements, getSvgPoint, selectedIds, settings, store, viewport]
  )

  // ── Pointer move ──────────────────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const screen = getSvgPoint(e)
      const world = screenToWorld(screen.x, screen.y, viewport.panX, viewport.panY, viewport.zoom)

      if (drag.type === 'panning') {
        store.setViewport({
          panX: drag.startPanX + screen.x - drag.startX,
          panY: drag.startPanY + screen.y - drag.startY,
        })
        return
      }

      if (drag.type === 'selecting') {
        const snapped = snapPoint(world, {
          gridSize: settings.gridSpacing,
          snapToGrid: settings.snapToGrid,
        })
        setDrag({ ...drag, currentWorld: snapped })
        return
      }

      if (drag.type === 'moving') {
        const snapped = snapPoint(world, {
          gridSize: settings.gridSpacing,
          snapToGrid: settings.snapToGrid,
        })
        setDrag({ ...drag, currentWorld: snapped })

        const dx = snapped.x - drag.startWorld.x
        const dy = snapped.y - drag.startWorld.y

        drag.elementIds.forEach((id: string) => {
          const orig = drag.originalPositions.get(id)
          if (!orig) return
          store.updateElement(id, {
            position: { x: orig.x + dx, y: orig.y + dy },
          })
        })
        return
      }

      // Hover detection
      const hit = [...elements].reverse().find((el: ProjectElement) => hitTest(el, world))
      store.setHoveredId(hit?.id ?? null)
    },
    [drag, elements, getSvgPoint, settings, store, viewport]
  )

  // ── Pointer up ────────────────────────────────────────────────────────────
  const handleMouseUp = useCallback(
    (_e: React.MouseEvent<SVGSVGElement>) => {
      if (drag.type === 'selecting') {
        const selRect = rectFromPoints(drag.startWorld, drag.currentWorld)
        if (selRect.width > 2 && selRect.height > 2) {
          const hits = elements.filter((el: ProjectElement) => {
            const b = getElementBounds(el)
            if (!b) return false
            return (
              b.x >= selRect.x &&
              b.y >= selRect.y &&
              b.x + b.width <= selRect.x + selRect.width &&
              b.y + b.height <= selRect.y + selRect.height
            )
          })
          store.setSelectedIds(hits.map((el: ProjectElement) => el.id))
        }
        setDrag({ type: 'none' })
        return
      }

      if (drag.type === 'moving') {
        store.pushHistory()
        setDrag({ type: 'none' })
        return
      }

      setDrag({ type: 'none' })
    },
    [drag, elements, store]
  )

  const handleMouseLeave = useCallback(() => {
    store.setHoveredId(null)
  }, [store])

  // ── Cursor style ──────────────────────────────────────────────────────────
  let cursor = 'default'
  if (activeTool === 'pan') cursor = drag.type === 'panning' ? 'grabbing' : 'grab'
  else if (drag.type === 'panning') cursor = 'grabbing'
  else if (drag.type === 'moving') cursor = 'move'
  else if (hoveredId) cursor = 'move'

  // ── Rubber-band selection rect ────────────────────────────────────────────
  let selectionRect: React.ReactNode = null
  if (drag.type === 'selecting') {
    const r = rectFromPoints(drag.startWorld, drag.currentWorld)
    const sx = r.x * viewport.zoom + viewport.panX
    const sy = r.y * viewport.zoom + viewport.panY
    const sw = r.width * viewport.zoom
    const sh = r.height * viewport.zoom
    selectionRect = (
      <rect
        x={sx}
        y={sy}
        width={sw}
        height={sh}
        fill="var(--selection-fill)"
        stroke="var(--selection-color)"
        strokeWidth={1}
        strokeDasharray="4 3"
        pointerEvents="none"
      />
    )
  }

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
      {/* Grid (screen-space lines) */}
      <Grid
        panX={viewport.panX}
        panY={viewport.panY}
        zoom={viewport.zoom}
        gridSize={settings.gridSpacing}
        canvasWidth={size.width}
        canvasHeight={size.height}
        showGrid={settings.showGrid}
      />

      {/* World-space group: all elements rendered here */}
      <g
        transform={`translate(${viewport.panX}, ${viewport.panY}) scale(${viewport.zoom})`}
        className="world-group"
      >
        {elements.map((el: ProjectElement) => (
          <ElementRenderer
            key={el.id}
            element={el}
            selected={selectedIds.includes(el.id)}
            hovered={hoveredId === el.id}
          />
        ))}
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

// ─── Per-element renderer ─────────────────────────────────────────────────────

type ElementRendererProps = {
  element: ProjectElement
  selected: boolean
  hovered: boolean
}

const ElementRenderer: React.FC<ElementRendererProps> = ({ element, selected, hovered }) => {
  const bounds = getElementBounds(element)
  if (!bounds) return null

  return (
    <g className={`element element--${element.type}`}>
      <rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        fill={
          selected
            ? 'var(--element-selected-fill)'
            : hovered
              ? 'var(--element-hover-fill)'
              : 'var(--element-fill)'
        }
        stroke={selected ? 'var(--selection-color)' : 'var(--element-stroke)'}
        strokeWidth={selected ? 2 : 1}
        rx={0}
      />
      <text
        x={bounds.x + bounds.width / 2}
        y={bounds.y + bounds.height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={Math.min(bounds.width, bounds.height) * 0.08}
        fill="var(--element-label)"
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        {element.label ?? element.type}
      </text>
    </g>
  )
}
