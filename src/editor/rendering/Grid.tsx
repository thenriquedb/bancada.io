import React from 'react'
import { GRID_LINE_WIDTH_MINOR, GRID_LINE_WIDTH_MAJOR } from './constants.ts'

type GridProps = {
  panX: number
  panY: number
  zoom: number
  gridSize: number
  canvasWidth: number
  canvasHeight: number
  showGrid: boolean
}

export const Grid: React.FC<GridProps> = ({
  panX, panY, zoom, gridSize, canvasWidth, canvasHeight, showGrid,
}) => {
  if (!showGrid) return null

  const cellPx = gridSize * zoom
  const offsetX = ((panX % cellPx) + cellPx) % cellPx
  const offsetY = ((panY % cellPx) + cellPx) % cellPx

  const verticals: React.ReactNode[] = []
  const horizontals: React.ReactNode[] = []

  // Very light gray for grid lines to reduce clutter
  const gridColorMinor = "rgba(0, 0, 0, 0.02)"
  const gridColorMajor = "rgba(0, 0, 0, 0.06)"

  for (let x = offsetX; x <= canvasWidth; x += cellPx) {
    const isMajor = Math.abs((x - panX) % (cellPx * 5)) < 1;
    verticals.push(
      <line key={`v-${x.toFixed(2)}`} x1={x} y1={0} x2={x} y2={canvasHeight}
        stroke={isMajor ? gridColorMajor : gridColorMinor} strokeWidth={isMajor ? GRID_LINE_WIDTH_MAJOR : GRID_LINE_WIDTH_MINOR} />
    )
  }
  for (let y = offsetY; y <= canvasHeight; y += cellPx) {
    const isMajor = Math.abs((y - panY) % (cellPx * 5)) < 1;
    horizontals.push(
      <line key={`h-${y.toFixed(2)}`} x1={0} y1={y} x2={canvasWidth} y2={y}
        stroke={isMajor ? gridColorMajor : gridColorMinor} strokeWidth={isMajor ? GRID_LINE_WIDTH_MAJOR : GRID_LINE_WIDTH_MINOR} />
    )
  }

  const ox = panX
  const oy = panY

  return (
    <g className="grid" role="presentation" aria-hidden="true" style={{ pointerEvents: 'none' }}>
      {verticals}
      {horizontals}
      {ox >= 0 && ox <= canvasWidth && (
        <line x1={ox} y1={0} x2={ox} y2={canvasHeight} stroke="rgba(0, 0, 0, 0.2)" strokeWidth={1} />
      )}
      {oy >= 0 && oy <= canvasHeight && (
        <line x1={0} y1={oy} x2={canvasWidth} y2={oy} stroke="rgba(0, 0, 0, 0.2)" strokeWidth={1} />
      )}
    </g>
  )
}
