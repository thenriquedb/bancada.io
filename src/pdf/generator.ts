import { jsPDF } from 'jspdf'
import type { Project, ProjectElement, CountertopElement } from '../models/types.ts'
import { getElementBounds } from '../editor/geometry/bounds.ts'

// ─── A4 landscape dimensions (mm) ────────────────────────────────────────────
const PAGE_W = 297
const PAGE_H = 210
const MARGIN = 15
const TITLE_BLOCK_W = 70
const DRAW_AREA_W = PAGE_W - MARGIN * 2 - TITLE_BLOCK_W
const DRAW_AREA_H = PAGE_H - MARGIN * 2
const DRAW_X = MARGIN
const DRAW_Y = MARGIN

// ─── Technical scales ────────────────────────────────────────────────────────
const TECHNICAL_SCALES = [1 / 5, 1 / 10, 1 / 20, 1 / 25, 1 / 50, 1 / 100]

function chooseBestScale(contentW: number, contentH: number): number {
  for (const scale of TECHNICAL_SCALES) {
    if (contentW * scale <= DRAW_AREA_W - 10 && contentH * scale <= DRAW_AREA_H - 10) {
      return scale
    }
  }
  return TECHNICAL_SCALES[TECHNICAL_SCALES.length - 1]
}

function scaleLabel(scale: number): string {
  const inv = Math.round(1 / scale)
  return `ESCALA 1:${inv}`
}

// ─── Colors ──────────────────────────────────────────────────────────────────
const COL_BLACK   = '#000000'
const COL_GRAY    = '#888888'
const COL_BLUE    = '#1a5ca8'
const COL_FILL_CT = '#f5f0e8'
const COL_FILL_SINK = '#c8e6fa'
const COL_FILL_WET  = '#d4edda'

// ─── Main export function ─────────────────────────────────────────────────────

export async function exportProjectPDF(project: Project): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const countertops = project.elements.filter(
    (el): el is CountertopElement => el.type === 'countertop'
  )

  if (countertops.length === 0) {
    // Draw blank page with message
    drawTitleBlock(doc, project, 1, 1, null)
    doc.setFontSize(12)
    doc.setTextColor(COL_GRAY)
    doc.text('Nenhuma bancada no projeto.', DRAW_X + DRAW_AREA_W / 2, DRAW_Y + DRAW_AREA_H / 2, { align: 'center' })
    doc.save(getFilename(project))
    return
  }

  countertops.forEach((ct, pageIdx) => {
    if (pageIdx > 0) doc.addPage('a4', 'landscape')

    // Compute content bounding box
    const ctBounds = getElementBounds(ct)
    if (!ctBounds) return

    // Include children in bounding box
    const children = project.elements.filter((el) => {
      if (!('parentId' in el)) return false
      return (el as { parentId: string }).parentId === ct.id
    })

    let minX = ctBounds.x, minY = ctBounds.y
    let maxX = ctBounds.x + ctBounds.width, maxY = ctBounds.y + ctBounds.height

    children.forEach((child) => {
      const b = getElementBounds(child)
      if (!b) return
      minX = Math.min(minX, b.x)
      minY = Math.min(minY, b.y)
      maxX = Math.max(maxX, b.x + b.width)
      maxY = Math.max(maxY, b.y + b.height)
    })

    const contentW = maxX - minX + 100  // padding
    const contentH = maxY - minY + 100

    const scale = chooseBestScale(contentW, contentH)

    // Offset so content starts at DRAW_X + 10
    const offsetX = DRAW_X + 10 - minX * scale + 40
    const offsetY = DRAW_Y + 10 - minY * scale + 40

    // ── Draw page border ────────────────────────────────────────────────────
    doc.setDrawColor(COL_BLACK)
    doc.setLineWidth(0.3)
    doc.rect(DRAW_X, DRAW_Y, DRAW_AREA_W, DRAW_AREA_H)

    // ── Draw elements ───────────────────────────────────────────────────────
    drawCountertop(doc, ct, scale, offsetX, offsetY)
    children.forEach((child) => drawChild(doc, child, scale, offsetX, offsetY))
    drawDimensions(doc, ct, children, scale, offsetX, offsetY)

    // ── Title block ─────────────────────────────────────────────────────────
    drawTitleBlock(doc, project, pageIdx + 1, countertops.length, ct)

    // ── Scale label ─────────────────────────────────────────────────────────
    doc.setFontSize(7)
    doc.setTextColor(COL_GRAY)
    doc.text(scaleLabel(scale), DRAW_X + DRAW_AREA_W - 5, DRAW_Y + DRAW_AREA_H - 3, { align: 'right' })
  })

  doc.save(getFilename(project))
}

// ─── Drawing helpers ──────────────────────────────────────────────────────────

function drawCountertop(doc: jsPDF, ct: CountertopElement, scale: number, ox: number, oy: number) {
  doc.setDrawColor(COL_BLACK)
  doc.setLineWidth(0.5)
  doc.setFillColor(COL_FILL_CT)

  const p = ct.position
  const g = ct.geometry

  if (g.type === 'reta') {
    const x = p.x * scale + ox
    const y = p.y * scale + oy
    const w = g.width * scale
    const h = g.depth * scale
    doc.rect(x, y, w, h, 'FD')

    // Material label
    doc.setFontSize(8)
    doc.setTextColor(COL_BLACK)
    const label = ct.material?.name ?? 'Material'
    doc.text(label, x + w / 2, y + h / 2 - 2, { align: 'center' })
    doc.setFontSize(7)
    doc.setTextColor(COL_GRAY)
    doc.text(`${g.width} × ${g.depth} mm`, x + w / 2, y + h / 2 + 4, { align: 'center' })
  } else if (g.type === 'l-shape') {
    const { segmentA, segmentB } = g
    const x = p.x * scale + ox
    const y = p.y * scale + oy
    const aW = segmentA.width * scale
    const aH = segmentA.depth * scale
    const bW = segmentB.width * scale
    const bH = segmentB.depth * scale

    // Draw segment A (top)
    doc.rect(x, y, aW, aH, 'FD')
    // Draw segment B (bottom-left)
    doc.rect(x, y + aH, bW, bH, 'FD')

    doc.setFontSize(7)
    doc.setTextColor(COL_BLACK)
    doc.text(`${segmentA.width}×${segmentA.depth}`, x + aW / 2, y + aH / 2, { align: 'center' })
    doc.text(`${segmentB.width}×${segmentB.depth}`, x + bW / 2, y + aH + bH / 2, { align: 'center' })
  }
}

function drawChild(doc: jsPDF, el: ProjectElement, scale: number, ox: number, oy: number) {
  const bounds = getElementBounds(el)
  if (!bounds) return

  const x = bounds.x * scale + ox
  const y = bounds.y * scale + oy
  const w = bounds.width * scale
  const h = bounds.height * scale

  doc.setLineWidth(0.4)

  switch (el.type) {
    case 'sink': {
      doc.setDrawColor(COL_BLUE)
      doc.setFillColor(COL_FILL_SINK)
      doc.rect(x, y, w, h, 'FD')
      // Inner cut
      const inner = 2
      doc.setFillColor('#a8d8f0')
      doc.rect(x + inner, y + inner, w - inner * 2, h - inner * 2, 'FD')
      doc.setFontSize(5)
      doc.setTextColor(COL_BLUE)
      doc.text(`Cuba`, x + w / 2, y + h / 2 - 1, { align: 'center' })
      doc.text(`${el.cutWidth}×${el.cutDepth}`, x + w / 2, y + h / 2 + 3, { align: 'center' })
      break
    }
    case 'cooktop': {
      doc.setDrawColor('#e67700')
      doc.setFillColor('#fff8e1')
      doc.rect(x, y, w, h, 'FD')
      // Dashed inner
      doc.setLineDashPattern([1, 1], 0)
      doc.rect(x + 2, y + 2, w - 4, h - 4)
      doc.setLineDashPattern([], 0)
      doc.setFontSize(5)
      doc.setTextColor('#e67700')
      doc.text(`Cooktop ${el.cutWidth}×${el.cutDepth}`, x + w / 2, y + h / 2, { align: 'center' })
      break
    }
    case 'faucet': {
      const r = (el.diameter / 2) * scale
      const cx = bounds.x * scale + ox
      const cy = bounds.y * scale + oy
      doc.setDrawColor(COL_GRAY)
      doc.setFillColor('#e0e0e0')
      doc.circle(cx, cy, r, 'FD')
      // Cross
      doc.line(cx - r * 0.6, cy, cx + r * 0.6, cy)
      doc.line(cx, cy - r * 0.6, cx, cy + r * 0.6)
      doc.setFontSize(4)
      doc.setTextColor(COL_GRAY)
      doc.text(`Ø${el.diameter}`, cx, cy + r + 3, { align: 'center' })
      break
    }
    case 'trash': {
      doc.setDrawColor(COL_GRAY)
      doc.setFillColor('#e8e8e8')
      if (el.shape === 'circular') {
        const r = ((el.diameter ?? 250) / 2) * scale
        const cx = bounds.x * scale + ox + r
        const cy = bounds.y * scale + oy + r
        doc.circle(cx, cy, r, 'FD')
      } else {
        doc.rect(x, y, w, h, 'FD')
        doc.line(x, y, x + w, y + h)
        doc.line(x + w, y, x, y + h)
      }
      doc.setFontSize(5)
      doc.setTextColor(COL_GRAY)
      doc.text('Lixeira', x + w / 2, y + h / 2, { align: 'center' })
      break
    }
    case 'wet-area': {
      doc.setDrawColor('#2f9e44')
      doc.setFillColor(COL_FILL_WET)
      doc.setLineDashPattern([2, 2], 0)
      doc.rect(x, y, w, h, 'FD')
      doc.setLineDashPattern([], 0)
      doc.setFontSize(5)
      doc.setTextColor('#2f9e44')
      doc.text(`Área Molhada`, x + w / 2, y + h / 2 - 1, { align: 'center' })
      doc.text(`Rebaixo ${el.recess} mm`, x + w / 2, y + h / 2 + 3, { align: 'center' })
      break
    }
    case 'backsplash': {
      doc.setDrawColor(COL_GRAY)
      doc.setFillColor('#ece9e0')
      doc.rect(x, y, w, h, 'FD')
      doc.setFontSize(5)
      doc.setTextColor(COL_GRAY)
      doc.text(`Rodabanca ${el.height} mm`, x + w / 2, y + h / 2, { align: 'center' })
      break
    }
    default:
      break
  }
}

function drawDimensions(
  doc: jsPDF,
  ct: CountertopElement,
  _children: ProjectElement[],
  scale: number,
  ox: number,
  oy: number
) {
  doc.setDrawColor(COL_BLUE)
  doc.setTextColor(COL_BLUE)
  doc.setFontSize(6)
  doc.setLineWidth(0.2)

  const p = ct.position
  const g = ct.geometry

  const ctW = g.type === 'reta' ? g.width : Math.max(g.segmentA.width, g.segmentB.width)
  const ctH = g.type === 'reta' ? g.depth : g.segmentA.depth + g.segmentB.depth

  const x0 = p.x * scale + ox
  const y0 = p.y * scale + oy
  const x1 = (p.x + ctW) * scale + ox
  const y1 = (p.y + ctH) * scale + oy

  // Top dimension (width)
  const topY = y0 - 8
  drawDimLine(doc, x0, topY, x1, topY, `${ctW}`, 'h')

  // Right dimension (depth)
  const rightX = x1 + 8
  drawDimLine(doc, rightX, y0, rightX, y1, `${ctH}`, 'v')
}

function drawDimLine(doc: jsPDF, x1: number, y1: number, x2: number, y2: number, label: string, dir: 'h' | 'v') {
  const COL = '#1a5ca8'
  doc.setDrawColor(COL)
  doc.setTextColor(COL)
  doc.setLineWidth(0.2)

  // Main dim line
  doc.line(x1, y1, x2, y2)

  // Ticks
  if (dir === 'h') {
    doc.line(x1, y1 - 2, x1, y1 + 2)
    doc.line(x2, y2 - 2, x2, y2 + 2)
    doc.setFontSize(5)
    doc.text(label, (x1 + x2) / 2, y1 - 1.5, { align: 'center' })
    // Extension lines
    doc.setLineDashPattern([1, 1], 0)
    doc.line(x1, y1 + 3, x1, y1 + 6)
    doc.line(x2, y2 + 3, x2, y2 + 6)
    doc.setLineDashPattern([], 0)
  } else {
    doc.line(x1 - 2, y1, x1 + 2, y1)
    doc.line(x2 - 2, y2, x2 + 2, y2)
    doc.setFontSize(5)
    // Rotate text for vertical
    const mid = (y1 + y2) / 2
    doc.text(label, x1 - 1.5, mid, { angle: 90, align: 'center' })
    doc.setLineDashPattern([1, 1], 0)
    doc.line(x1 - 3, y1, x1 - 6, y1)
    doc.line(x2 - 3, y2, x2 - 6, y2)
    doc.setLineDashPattern([], 0)
  }
}

// ─── Title block ──────────────────────────────────────────────────────────────

function drawTitleBlock(
  doc: jsPDF,
  project: Project,
  page: number,
  totalPages: number,
  ct: CountertopElement | null
) {
  const tbX = PAGE_W - MARGIN - TITLE_BLOCK_W
  const tbY = MARGIN
  const tbH = DRAW_AREA_H

  doc.setDrawColor(COL_BLACK)
  doc.setLineWidth(0.4)
  doc.rect(tbX, tbY, TITLE_BLOCK_W, tbH)

  // Header
  doc.setFillColor('#1a1a2e')
  doc.rect(tbX, tbY, TITLE_BLOCK_W, 12, 'F')
  doc.setFontSize(8)
  doc.setTextColor('#ffffff')
  doc.setFont('helvetica', 'bold')
  doc.text('COUNTERTOP DESIGNER BR', tbX + TITLE_BLOCK_W / 2, tbY + 7, { align: 'center' })
  doc.setFont('helvetica', 'normal')

  doc.setTextColor(COL_BLACK)
  let rowY = tbY + 18

  const addRow = (label: string, value: string) => {
    doc.setFontSize(6)
    doc.setTextColor(COL_GRAY)
    doc.text(label.toUpperCase(), tbX + 3, rowY)
    doc.setFontSize(7)
    doc.setTextColor(COL_BLACK)
    doc.text(value, tbX + 3, rowY + 4)
    doc.setLineWidth(0.15)
    doc.setDrawColor('#dddddd')
    doc.line(tbX + 1, rowY + 7, tbX + TITLE_BLOCK_W - 1, rowY + 7)
    rowY += 10
  }

  addRow('Projeto', project.name)
  addRow('Cliente', project.clientName ?? '—')
  addRow('Ambiente', project.environment ?? '—')
  addRow('Material', project.material?.name ?? '—')
  addRow('Espessura', `${project.thickness} mm`)
  addRow('Unidade', project.settings.unit.toUpperCase())
  addRow('Data', new Date().toLocaleDateString('pt-BR'))

  if (ct) {
    doc.setLineWidth(0.3)
    doc.setDrawColor(COL_BLACK)
    doc.line(tbX, rowY, tbX + TITLE_BLOCK_W, rowY)
    rowY += 6
    doc.setFontSize(7)
    doc.setTextColor(COL_BLACK)
    doc.setFont('helvetica', 'bold')
    doc.text(`PEÇA ${String(page).padStart(2, '0')}`, tbX + TITLE_BLOCK_W / 2, rowY, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    rowY += 6

    const g = ct.geometry
    let dims = ''
    if (g.type === 'reta') dims = `${g.width} × ${g.depth} × ${ct.thickness} mm`
    else dims = `${g.segmentA.width} × ${g.segmentA.depth + g.segmentB.depth} × ${ct.thickness} mm`
    addRow('Dimensões', dims)
  }

  // Warning footer
  rowY = tbY + tbH - 20
  doc.setFillColor('#fff8e1')
  doc.rect(tbX + 1, rowY, TITLE_BLOCK_W - 2, 18, 'F')
  doc.setFontSize(4.5)
  doc.setTextColor('#7c4e00')
  const warning = 'ATENÇÃO: Confirme os recortes de\nequipamentos no gabarito do fabricante\nantes da fabricação.'
  doc.text(warning, tbX + TITLE_BLOCK_W / 2, rowY + 4, { align: 'center' })

  // Page
  doc.setFontSize(6)
  doc.setTextColor(COL_GRAY)
  doc.text(`Folha ${page}/${totalPages}`, tbX + TITLE_BLOCK_W / 2, tbY + tbH - 3, { align: 'center' })
}

function getFilename(project: Project): string {
  const name = project.name.replace(/\s+/g, '-').toLowerCase()
  return `${name}-bancada.pdf`
}
