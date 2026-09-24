import type { ProjectElement, ValidationWarning } from '../../models/types.ts'
import { getElementBounds } from './bounds.ts'
import { rectsOverlap, rectContains } from '../../utils/helpers.ts'

const MIN_EDGE_DISTANCE = 50  // mm – minimum distance from countertop edge

/**
 * Run all validation checks and return a list of warnings.
 */
export function validateElements(elements: ProjectElement[]): ValidationWarning[] {
  const warnings: ValidationWarning[] = []

  const countertops = elements.filter((el) => el.type === 'countertop')
  const children    = elements.filter((el) =>
    el.type === 'sink' || el.type === 'cooktop' || el.type === 'faucet' ||
    el.type === 'trash' || el.type === 'wet-area'
  )

  children.forEach((child) => {
    const childBounds = getElementBounds(child)
    if (!childBounds) return

    // Find parent countertop
    const parentId = 'parentId' in child ? child.parentId : null
    const parent = countertops.find((ct) => ct.id === parentId)
    if (!parent) return

    const parentBounds = getElementBounds(parent)
    if (!parentBounds) return

    // ── Child outside parent ────────────────────────────────────────────────
    if (!rectsOverlap(childBounds, parentBounds)) {
      warnings.push({
        type: 'element-outside-countertop',
        severity: 'error',
        message: `Elemento fora da bancada.`,
        elementIds: [child.id, parent.id],
      })
      return
    }

    // ── Too close to edge ───────────────────────────────────────────────────
    const distLeft   = childBounds.x - parentBounds.x
    const distRight  = (parentBounds.x + parentBounds.width) - (childBounds.x + childBounds.width)
    const distTop    = childBounds.y - parentBounds.y
    const distBottom = (parentBounds.y + parentBounds.height) - (childBounds.y + childBounds.height)

    if (
      distLeft   < MIN_EDGE_DISTANCE || distRight  < MIN_EDGE_DISTANCE ||
      distTop    < MIN_EDGE_DISTANCE || distBottom < MIN_EDGE_DISTANCE
    ) {
      const minDist = Math.min(distLeft, distRight, distTop, distBottom)
      warnings.push({
        type: 'element-too-close-to-edge',
        severity: 'warning',
        message: `Distância mínima da borda: ${Math.round(minDist)} mm (mínimo recomendado: ${MIN_EDGE_DISTANCE} mm).`,
        elementIds: [child.id],
      })
    }

    // ── Child partially outside ─────────────────────────────────────────────
    if (!rectContains(parentBounds, childBounds) && rectsOverlap(childBounds, parentBounds)) {
      warnings.push({
        type: 'element-outside-countertop',
        severity: 'error',
        message: `Elemento ultrapassa os limites da bancada.`,
        elementIds: [child.id, parent.id],
      })
    }
  })

  // ── Overlapping cuts ────────────────────────────────────────────────────────
  const cuts = children.filter((el) =>
    el.type === 'sink' || el.type === 'cooktop' || el.type === 'trash'
  )

  for (let i = 0; i < cuts.length; i++) {
    for (let j = i + 1; j < cuts.length; j++) {
      const a = getElementBounds(cuts[i])
      const b = getElementBounds(cuts[j])
      if (a && b && rectsOverlap(a, b)) {
        warnings.push({
          type: 'elements-overlapping',
          severity: 'error',
          message: 'Recortes sobrepostos detectados.',
          elementIds: [cuts[i].id, cuts[j].id],
        })
      }
    }
  }

  return warnings
}
