import type { ProjectElement, CountertopElement } from '../../models/types.ts'
import { getElementBounds } from '../../editor/geometry/bounds.ts'
import { PDF_THEME } from './theme.ts'

export type PdfLayout = {
  scale: number
  offsetX: number
  offsetY: number
  minX: number
  minY: number
  maxX: number
  maxY: number
  bestTechnicalScale?: number
}

export function fitToBounds(elements: ProjectElement[], ct: CountertopElement): PdfLayout {
  let minX = Infinity, minY = Infinity
  let maxX = -Infinity, maxY = -Infinity

  // We only care about the countertop and its children for bounds
  const relevantElements = [ct, ...elements.filter(el => {
    if ('parentId' in el && el.parentId === ct.id) return true
    if ('parentId' in el) {
      // Check if it belongs to a wet-area that belongs to this countertop
      const parent = elements.find(p => p.id === el.parentId)
      if (parent && 'parentId' in parent && parent.parentId === ct.id) return true
    }
    return false
  })]

  relevantElements.forEach(el => {
    const b = getElementBounds(el)
    if (b) {
      minX = Math.min(minX, b.x)
      minY = Math.min(minY, b.y)
      maxX = Math.max(maxX, b.x + b.width)
      maxY = Math.max(maxY, b.y + b.height)
    }
  })

  // Add virtual padding in mm
  const paddingX = 600
  const paddingY = 600
  
  const contentW = (maxX - minX) + paddingX
  const contentH = (maxY - minY) + paddingY

  const drawAreaW = PDF_THEME.page.width - PDF_THEME.page.margin * 2 - PDF_THEME.panel.width
  const drawAreaH = PDF_THEME.page.height - PDF_THEME.page.margin * 2

  const scaleX = drawAreaW / contentW
  const scaleY = drawAreaH / contentH
  let scale = Math.min(scaleX, scaleY)

  const TECHNICAL_SCALES = [1/5, 1/10, 1/15, 1/20, 1/25, 1/30, 1/40, 1/50, 1/75, 1/100]
  let bestTechnicalScale: number | undefined
  for (const ts of TECHNICAL_SCALES) {
    if (ts <= scale) {
      bestTechnicalScale = ts
      break
    }
  }

  // Use bestTechnicalScale if we found one, otherwise fallback to the calculated scale
  const finalScale = bestTechnicalScale ?? scale

  const actualW = (maxX - minX) * finalScale
  const actualH = (maxY - minY) * finalScale

  const offsetX = PDF_THEME.page.margin + (drawAreaW - actualW) / 2 - minX * finalScale
  const offsetY = PDF_THEME.page.margin + (drawAreaH - actualH) / 2 - minY * finalScale

  return { scale: finalScale, offsetX, offsetY, minX, minY, maxX, maxY, bestTechnicalScale }
}

export function resolveCollisions() {
  // Simple heuristic collision resolution will be applied at render time if necessary,
  // but for dimensions, we will position them carefully in dimensions.ts
}
