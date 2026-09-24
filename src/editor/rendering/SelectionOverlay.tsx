import React from 'react'
import type { ProjectElement } from '../../models/types.ts'
import { getElementBounds } from '../geometry/bounds.ts'

type SelectionOverlayProps = {
  elements: ProjectElement[]
  selectedIds: string[]
  zoom: number
  panX: number
  panY: number
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  elements, selectedIds, zoom, panX, panY,
}) => {
  if (selectedIds.length === 0) return null

  const selectedElements = elements.filter((el) => selectedIds.includes(el.id))

  return (
    <>
      {selectedElements.map((el) => {
        const bounds = getElementBounds(el)
        if (!bounds) return null

        const x = bounds.x * zoom + panX
        const y = bounds.y * zoom + panY
        const w = bounds.width * zoom
        const h = bounds.height * zoom

        const handleSize = 7
        const half = handleSize / 2

        const handles = [
          { cx: x,         cy: y,         cursor: 'nw-resize' },
          { cx: x + w / 2, cy: y,         cursor: 'n-resize'  },
          { cx: x + w,     cy: y,         cursor: 'ne-resize' },
          { cx: x + w,     cy: y + h / 2, cursor: 'e-resize'  },
          { cx: x + w,     cy: y + h,     cursor: 'se-resize' },
          { cx: x + w / 2, cy: y + h,     cursor: 's-resize'  },
          { cx: x,         cy: y + h,     cursor: 'sw-resize' },
          { cx: x,         cy: y + h / 2, cursor: 'w-resize'  },
        ]

        return (
          <g key={el.id} className="selection-overlay">
            <rect x={x} y={y} width={w} height={h} fill="none"
              stroke="var(--selection-color)" strokeWidth={1.5} strokeDasharray="4 3" pointerEvents="none" />
            {handles.map((handle, i) => (
              <rect key={i} x={handle.cx - half} y={handle.cy - half}
                width={handleSize} height={handleSize} fill="white"
                stroke="var(--selection-color)" strokeWidth={1.5} rx={1}
                style={{ cursor: handle.cursor }} pointerEvents="all" />
            ))}
          </g>
        )
      })}
    </>
  )
}
