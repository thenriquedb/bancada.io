import React from 'react'

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

  for (let x = offsetX; x <= canvasWidth; x += cellPx) {
    verticals.push(
      <line key={`v-${x.toFixed(2)}`} x1={x} y1={0} x2={x} y2={canvasHeight}
        stroke="var(--grid-line)" strokeWidth={0.5} />
    )
  }
  for (let y = offsetY; y <= canvasHeight; y += cellPx) {
    horizontals.push(
      <line key={`h-${y.toFixed(2)}`} x1={0} y1={y} x2={canvasWidth} y2={y}
        stroke="var(--grid-line)" strokeWidth={0.5} />
    )
  }

  const ox = panX
  const oy = panY

  return (
    <g role="presentation" aria-hidden="true">
      {verticals}
      {horizontals}
      {ox >= 0 && ox <= canvasWidth && (
        <line x1={ox} y1={0} x2={ox} y2={canvasHeight} stroke="var(--grid-origin)" strokeWidth={1} />
      )}
      {oy >= 0 && oy <= canvasHeight && (
        <line x1={0} y1={oy} x2={canvasWidth} y2={oy} stroke="var(--grid-origin)" strokeWidth={1} />
      )}
    </g>
  )
}
