import React, { useState } from 'react'
import {
  useEditorStore,
  selectViewport,
  selectActiveTool,
  selectSelectedIds,
  selectElements,
} from '../store/editorStore.ts'
import { formatMeasurement } from '../utils/units.ts'
import { screenToWorld } from './geometry/coordinates.ts'

/**
 * Bottom status bar.
 * Shows: tool, cursor position, selected count, zoom level.
 */
export const StatusBar: React.FC = () => {
  const viewport = useEditorStore(selectViewport)
  const activeTool = useEditorStore(selectActiveTool)
  const selectedIds = useEditorStore(selectSelectedIds)
  const elements = useEditorStore(selectElements)
  const store = useEditorStore()

  const [cursorScreen, setCursorScreen] = useState({ x: 0, y: 0 })

  React.useEffect(() => {
    const handler = (e: CustomEvent<{ x: number; y: number }>) => {
      setCursorScreen(e.detail)
    }
    window.addEventListener('canvas:cursor', handler as EventListener)
    return () => window.removeEventListener('canvas:cursor', handler as EventListener)
  }, [])

  const worldCursor = screenToWorld(
    cursorScreen.x,
    cursorScreen.y,
    viewport.panX,
    viewport.panY,
    viewport.zoom
  )

  const unit = store.project.settings.unit
  const zoomPercent = Math.round(viewport.zoom * 100)

  const toolLabel: Record<string, string> = {
    select: 'Selecionar',
    pan: 'Mover',
  }

  return (
    <div className="status-bar" role="status" aria-live="polite">
      <span className="status-bar__tool">{toolLabel[activeTool] ?? activeTool}</span>

      <span className="status-bar__sep">|</span>

      <span className="status-bar__coords">
        X: <strong>{formatMeasurement(worldCursor.x, unit, 0)}</strong>
        &nbsp;&nbsp;
        Y: <strong>{formatMeasurement(worldCursor.y, unit, 0)}</strong>
      </span>

      <span className="status-bar__sep">|</span>

      {selectedIds.length > 0 ? (
        <span className="status-bar__selection">
          {selectedIds.length === 1
            ? `1 elemento selecionado`
            : `${selectedIds.length} elementos selecionados`}
        </span>
      ) : (
        <span className="status-bar__elements">{elements.length} elemento(s)</span>
      )}

      <span className="status-bar__spacer" />

      <span className="status-bar__zoom">Zoom: {zoomPercent}%</span>
    </div>
  )
}
