import type { ProjectElement, Rect } from '../../models/types.ts'

/**
 * Return the bounding rect (in mm) of any element.
 * Returns null for elements without a fixed bounding box (e.g. annotations).
 */
function getUnrotatedBounds(el: ProjectElement): Rect | null {
  switch (el.type) {
    case 'countertop': {
      const g = el.geometry
      if (g.type === 'reta') {
        return { x: el.position.x, y: el.position.y, width: g.width, height: g.depth }
      }
      if (g.type === 'l-shape') {
        const totalW = Math.max(g.segmentA.width, g.segmentB.width)
        const totalH = g.segmentA.depth + g.segmentB.depth
        return { x: el.position.x, y: el.position.y, width: totalW, height: totalH }
      }
      return null
    }
    case 'sink':
      return { x: el.position.x, y: el.position.y, width: el.width, height: el.depth }
    case 'cooktop':
      return { x: el.position.x, y: el.position.y, width: el.width, height: el.depth }
    case 'faucet':
      return {
        x: el.position.x - el.diameter / 2,
        y: el.position.y - el.diameter / 2,
        width: el.diameter,
        height: el.diameter,
      }
    case 'trash': {
      const d = el.shape === 'circular' ? (el.diameter ?? 250) : (el.width ?? 200)
      const h = el.shape === 'circular' ? (el.diameter ?? 250) : (el.depth ?? 250)
      return { x: el.position.x - d / 2, y: el.position.y - h / 2, width: d, height: h }
    }
    case 'cutout': {
      if (el.shape === 'circular') {
        const d = el.diameter ?? 100
        return { x: el.position.x, y: el.position.y, width: d, height: d }
      }
      return { x: el.position.x, y: el.position.y, width: el.width ?? 200, height: el.depth ?? 200 }
    }
    case 'wet-area':
      return { x: el.position.x, y: el.position.y, width: el.width, height: el.depth }
    case 'backsplash':
      return { x: el.position.x, y: el.position.y, width: el.length, height: el.height }
    case 'annotation': {
      const estWidth = el.text.length * (el.fontSize * 0.55)
      const estHeight = el.fontSize
      return { x: el.position.x, y: el.position.y - el.fontSize * 0.8, width: estWidth, height: estHeight }
    }
    case 'dimension':
      return null
    default:
      return null
  }
}

export function getElementBounds(el: ProjectElement): Rect | null {
  const rect = getUnrotatedBounds(el);
  if (!rect || !el.rotation) return rect;

  const rad = (el.rotation * Math.PI) / 180;
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const corners = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x, y: rect.y + rect.height },
    { x: rect.x + rect.width, y: rect.y + rect.height },
  ].map(p => ({
    x: cos * (p.x - cx) - sin * (p.y - cy) + cx,
    y: sin * (p.x - cx) + cos * (p.y - cy) + cy,
  }));

  const minX = Math.min(...corners.map(p => p.x));
  const maxX = Math.max(...corners.map(p => p.x));
  const minY = Math.min(...corners.map(p => p.y));
  const maxY = Math.max(...corners.map(p => p.y));

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Return a bounding rect encompassing all elements.
 */
function getGroupBounds(elements: ProjectElement[]): Rect | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  let any = false
  for (const el of elements) {
    const r = getElementBounds(el)
    if (!r) continue
    any = true
    minX = Math.min(minX, r.x)
    minY = Math.min(minY, r.y)
    maxX = Math.max(maxX, r.x + r.width)
    maxY = Math.max(maxY, r.y + r.height)
  }
  if (!any) return null
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

/**
 * Returns all descendants of a given element recursively.
 */
function getDescendants(elId: string, elements: ProjectElement[]): ProjectElement[] {
  const children = elements.filter(e => 'parentId' in e && (e as any).parentId === elId)
  let result = [...children]
  for (const child of children) {
    result = result.concat(getDescendants(child.id, elements))
  }
  return result
}

/**
 * Returns the bounding rect encompassing all descendants of an element.
 */
export function getChildrenBounds(elId: string, elements: ProjectElement[]): Rect | null {
  const descendants = getDescendants(elId, elements)
  if (descendants.length === 0) return null
  return getGroupBounds(descendants)
}



/**
 * Checks if the center of element `child` is completely inside the bounds of `parent`.
 */
export function isInsideBounds(childBounds: Rect, parentBounds: Rect): boolean {
  const cx = childBounds.x + childBounds.width / 2
  const cy = childBounds.y + childBounds.height / 2
  return cx >= parentBounds.x && cx <= parentBounds.x + parentBounds.width &&
         cy >= parentBounds.y && cy <= parentBounds.y + parentBounds.height
}

/**
 * Returns the bounds of the given element constrained to its parent's bounds.
 */
export function clampChildToParent(childEl: ProjectElement, elements: ProjectElement[]): Rect | null {
  const childBounds = getElementBounds(childEl)
  if (!childBounds || !('parentId' in childEl) || !(childEl as any).parentId) return childBounds

  let parentId = (childEl as any).parentId
  
  if (childEl.type !== 'countertop' && childEl.type !== 'wet-area' && childEl.type !== 'backsplash') {
    const containingWetAreas = elements.filter(p => p.type === 'wet-area' && (() => {
      const cb = getElementBounds(childEl)
      const pb = getElementBounds(p)
      return cb && pb && isInsideBounds(cb, pb)
    })())
    if (containingWetAreas.length > 0) {
      parentId = containingWetAreas[0].id
    }
  }

  const parentEl = elements.find(el => el.id === parentId)
  if (!parentEl) return childBounds

  const parentBounds = getElementBounds(parentEl)
  if (!parentBounds) return childBounds

  // For L-shape we clamp to the overall bounding box for simplicity, 
  // but it guarantees it won't exceed the outer limits.
  return clampRectToBounds(childBounds, parentBounds)
}
