import React, { createContext, useContext, useMemo } from 'react'
import { useEditorStore } from '../../store/editorStore.ts'
import {
  SMALL_ELEMENT_THRESHOLD,
  MIN_VISUAL_SIZE,
  HIT_AREA_SIZE,
  computeCalloutLayouts,
  getVisualMode,
  shortLabel,
  type CalloutLayout,
} from '../geometry/calloutLayout.ts'

export { SMALL_ELEMENT_THRESHOLD, MIN_VISUAL_SIZE, HIT_AREA_SIZE }

/** Dev-only layout diagnostics. Enable with `?debugLayout` in the URL (dev builds only). */
export const DEBUG_LAYOUT: boolean =
  import.meta.env.DEV && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debugLayout')

/** Layouts are computed once per frame by the Canvas (it knows about the dimensions). */
export const CalloutLayoutContext = createContext<Map<string, CalloutLayout> | null>(null)

// Callouts are identification only: neutral slate, thin, no arrowheads.
const CALLOUT_LINE = '#94a3b8'
const CALLOUT_TITLE = '#475569'
const CALLOUT_SUB = '#64748b'
const CALLOUT_ACTIVE = '#0f172a'
const HIDE_TEXT_BELOW_ZOOM = 0.12

type SmallElementLabelProps = {
  elementId: string
  cx: number
  cy: number
  worldWidth: number
  worldHeight: number
  zoom: number
  title: string
  subtitle: string
  color?: string
  selected?: boolean
  hovered?: boolean
}

export const SmallElementLabel: React.FC<SmallElementLabelProps> = ({
  elementId,
  cx,
  cy,
  worldWidth,
  worldHeight,
  zoom,
  title,
  subtitle,
  color = '#64748b',
  selected = false,
  hovered = false,
}) => {
  const store = useEditorStore()
  const elements = store.project.elements
  const ctxLayouts = useContext(CalloutLayoutContext)

  const screenW = worldWidth * zoom
  const screenH = worldHeight * zoom
  const mode = getVisualMode(screenW, screenH)
  const active = selected || hovered
  const px = 1 / zoom

  // Fallback when rendered outside the Canvas provider
  const fallback = useMemo(
    () => (mode === 'callout' && !ctxLayouts ? computeCalloutLayouts(elements, zoom) : null),
    [mode, ctxLayouts, elements, zoom],
  )

  if (mode !== 'callout') {
    const compact = mode === 'compact'
    const t = compact ? shortLabel(title) : title
    return (
      <text x={cx} y={cy - (compact ? 5 : 6) * px} textAnchor="middle" dominantBaseline="middle"
        fontSize={(compact ? 11 : 14) * px} fontFamily="Inter, sans-serif" fill="#1e293b"
        style={{ userSelect: 'none', pointerEvents: 'none', fontWeight: 600 }}
        stroke="#ffffff" strokeWidth={3 * px} paintOrder="stroke fill" strokeOpacity={0.8}>
        {t}
        <tspan x={cx} dy={(compact ? 13 : 16) * px} fontWeight="400" fontSize={(compact ? 9 : 11) * px} fill="#475569">{subtitle}</tspan>
      </text>
    )
  }

  const layout = (ctxLayouts ?? fallback)?.get(elementId)
  const tooSmall = Math.min(screenW, screenH) < MIN_VISUAL_SIZE
  const showText = zoom >= HIDE_TEXT_BELOW_ZOOM || active

  const lineColor = selected ? color : hovered ? CALLOUT_TITLE : CALLOUT_LINE
  const lineW = (selected ? 1.25 : hovered ? 1 : 0.75) * px

  return (
    <g className="callout" style={{ pointerEvents: 'none', userSelect: 'none' }}>
      {/* Minimum visual marker – real geometry is untouched */}
      {tooSmall && (
        <circle cx={cx} cy={cy} r={(MIN_VISUAL_SIZE / 2) * px} fill="#ffffff" fillOpacity={0.7}
          stroke={color} strokeWidth={(active ? 1.5 : 1.2) * px} />
      )}

      {layout && showText && (
        <>
          <polyline
            points={layout.linePath.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none" stroke={lineColor} strokeWidth={lineW} strokeLinejoin="round" />
          <circle cx={layout.start.x} cy={layout.start.y} r={2.2 * px}
            fill="#ffffff" stroke={lineColor} strokeWidth={lineW} />

          <text x={layout.end.x + (layout.textAnchor === 'start' ? 3 : -3) * px} y={layout.end.y - 2 * px}
            textAnchor={layout.textAnchor} dominantBaseline="alphabetic"
            fontSize={10 * px} fontFamily="Inter, sans-serif" fontWeight={active ? 700 : 600}
            fill={active ? CALLOUT_ACTIVE : CALLOUT_TITLE}
            stroke="#ffffff" strokeWidth={3 * px} paintOrder="stroke fill" strokeOpacity={0.85}>
            {shortLabel(title)}
          </text>
          <text x={layout.end.x + (layout.textAnchor === 'start' ? 3 : -3) * px} y={layout.end.y + 9 * px}
            textAnchor={layout.textAnchor} dominantBaseline="alphabetic"
            fontSize={9 * px} fontFamily="Inter, sans-serif" fontWeight={400}
            fill={active ? CALLOUT_TITLE : CALLOUT_SUB}
            stroke="#ffffff" strokeWidth={3 * px} paintOrder="stroke fill" strokeOpacity={0.85}>
            {subtitle}
          </text>
        </>
      )}
    </g>
  )
}

/** Development overlay: global bounds, segment bounds, element bounds, anchors, label boxes, leaders. */
export const CalloutDebugLayer: React.FC<{ layouts: Map<string, CalloutLayout>; zoom: number }> = ({ layouts, zoom }) => {
  const px = 1 / zoom
  return (
    <g className="callout-debug" pointerEvents="none" fill="none" strokeWidth={1 * px}>
      {[...layouts.values()].map(l => (
        <g key={l.elementId}>
          {l.globalBounds && (
            <rect x={l.globalBounds.x} y={l.globalBounds.y} width={l.globalBounds.width} height={l.globalBounds.height}
              stroke="#ef4444" strokeDasharray={`${6 * px} ${4 * px}`} />
          )}
          {l.segmentBounds && (
            <rect x={l.segmentBounds.left} y={l.segmentBounds.top}
              width={l.segmentBounds.right - l.segmentBounds.left} height={l.segmentBounds.bottom - l.segmentBounds.top}
              stroke="#f97316" />
          )}
          <rect x={l.elementBounds.x} y={l.elementBounds.y} width={l.elementBounds.width} height={l.elementBounds.height} stroke="#22c55e" />
          <rect x={l.labelBox.x} y={l.labelBox.y} width={l.labelBox.width} height={l.labelBox.height}
            stroke={l.collisions > 0 ? '#ef4444' : '#a855f7'} />
          <circle cx={l.anchor.x} cy={l.anchor.y} r={2 * px} fill="#d946ef" />
          <polyline points={l.linePath.map(p => `${p.x},${p.y}`).join(' ')} stroke="#d946ef" />
        </g>
      ))}
    </g>
  )
}
