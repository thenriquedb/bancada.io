import { jsPDF } from 'jspdf'
import type { Project, ProjectElement, CountertopElement } from '../../models/types.ts'
import { getElementBounds } from '../../editor/geometry/bounds.ts'
import { PDF_THEME } from './theme.ts'
import type { PdfLayout } from './layout.ts'
import type { PdfDimension } from './dimensions.ts'

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val))

export function renderPdfPage(
  doc: jsPDF,
  project: Project,
  ct: CountertopElement,
  children: ProjectElement[],
  dims: PdfDimension[],
  pageIdx: number,
  totalPages: number,
  layout: PdfLayout
) {
  drawPageBorder(doc)
  drawCountertop(doc, ct, layout)

  // Draw wet areas first so they are under other components
  children.filter(c => c.type === 'wet-area').forEach(c => drawChild(doc, c, layout))
  children.filter(c => c.type !== 'wet-area').forEach(c => drawChild(doc, c, layout))

  if (project.settings.showDimensions !== false) {
    dims.forEach(dim => drawDimension(doc, dim, layout))
  }

  drawSidePanel(doc, project, ct, pageIdx, totalPages)
  drawScaleAndFooter(doc, layout, pageIdx, totalPages)
}

function drawPageBorder(doc: jsPDF) {
  doc.setDrawColor(PDF_THEME.colors.black)
  doc.setLineWidth(PDF_THEME.lineWidths.border)
  const drawAreaW = PDF_THEME.page.width - PDF_THEME.page.margin * 2 - PDF_THEME.panel.width
  const drawAreaH = PDF_THEME.page.height - PDF_THEME.page.margin * 2
  doc.rect(PDF_THEME.page.margin, PDF_THEME.page.margin, drawAreaW, drawAreaH)
}

function drawCountertop(doc: jsPDF, ct: CountertopElement, layout: PdfLayout) {
  const { scale, offsetX, offsetY } = layout
  doc.setDrawColor(PDF_THEME.colors.countertopStroke)
  doc.setLineWidth(PDF_THEME.lineWidths.countertop)
  doc.setFillColor(PDF_THEME.colors.countertopFill)

  const p = ct.position
  const g = ct.geometry

  if (g.type === 'reta') {
    const x = p.x * scale + offsetX
    const y = p.y * scale + offsetY
    const w = g.width * scale
    const h = g.depth * scale
    doc.rect(x, y, w, h, 'FD')
  } else if (g.type === 'l-shape') {
    const { segmentA, segmentB } = g
    const x = p.x * scale + offsetX
    const y = p.y * scale + offsetY
    const aW = segmentA.width * scale
    const aH = segmentA.depth * scale
    const bW = segmentB.width * scale
    const bH = segmentB.depth * scale

    doc.rect(x, y, aW, aH, 'FD')
    doc.rect(x, y + aH, bW, bH, 'FD')

    // Erase the overlapping line between segments
    doc.setDrawColor(PDF_THEME.colors.countertopFill)
    doc.setLineWidth(PDF_THEME.lineWidths.countertop * 1.5)
    doc.line(x + PDF_THEME.lineWidths.countertop, y + aH, x + bW - PDF_THEME.lineWidths.countertop, y + aH)
  }
}

function drawChild(doc: jsPDF, el: ProjectElement, layout: PdfLayout) {
  const bounds = getElementBounds(el)
  if (!bounds) return
  const { scale, offsetX, offsetY } = layout

  const x = bounds.x * scale + offsetX
  const y = bounds.y * scale + offsetY
  const w = bounds.width * scale
  const h = bounds.height * scale

  doc.setLineWidth(PDF_THEME.lineWidths.component)
  const fontSize = clamp(10 * scale, PDF_THEME.typography.componentLabelMin, PDF_THEME.typography.componentLabelMax)

  switch (el.type) {
    case 'sink': {
      doc.setDrawColor(PDF_THEME.colors.sinkStroke)
      doc.setFillColor(PDF_THEME.colors.sinkFill)
      doc.rect(x, y, w, h, 'FD')
      doc.setFontSize(fontSize)
      doc.setTextColor(PDF_THEME.colors.sinkStroke)
      doc.text(`Cuba`, x + w / 2, y + h / 2 - 1, { align: 'center' })
      doc.text(`${el.width} × ${el.depth} mm`, x + w / 2, y + h / 2 + fontSize * 0.4, { align: 'center' })
      break
    }
    case 'cooktop': {
      doc.setDrawColor(PDF_THEME.colors.cooktopStroke)
      doc.setFillColor(PDF_THEME.colors.cooktopFill)
      doc.rect(x, y, w, h, 'FD')
      doc.setFontSize(fontSize)
      doc.setTextColor(PDF_THEME.colors.cooktopStroke)
      doc.text(`Cooktop`, x + w / 2, y + h / 2 - 1, { align: 'center' })
      doc.text(`${el.width} × ${el.depth} mm`, x + w / 2, y + h / 2 + fontSize * 0.4, { align: 'center' })
      break
    }
    case 'trash': {
      doc.setDrawColor(PDF_THEME.colors.trashStroke)
      doc.setFillColor(PDF_THEME.colors.trashFill)
      if (el.shape === 'circular') {
        const r = ((el.diameter ?? 250) / 2) * scale
        const cx = bounds.x * scale + offsetX + r
        const cy = bounds.y * scale + offsetY + r
        doc.circle(cx, cy, r, 'FD')
        doc.setFontSize(fontSize)
        doc.setTextColor(PDF_THEME.colors.grayDark)
        doc.text(`Lixeira`, cx, cy - 1, { align: 'center' })
        doc.text(`Ø${el.diameter} mm`, cx, cy + fontSize * 0.4, { align: 'center' })
      } else {
        doc.rect(x, y, w, h, 'FD')
        doc.setFontSize(fontSize)
        doc.setTextColor(PDF_THEME.colors.grayDark)
        doc.text('Lixeira', x + w / 2, y + h / 2 - 1, { align: 'center' })
        doc.text(`${el.width} × ${el.depth} mm`, x + w / 2, y + h / 2 + fontSize * 0.4, { align: 'center' })
      }
      break
    }
    case 'wet-area': {
      doc.setDrawColor(PDF_THEME.colors.wetAreaStroke)
      doc.setFillColor(PDF_THEME.colors.wetAreaFill)
      doc.setLineDashPattern([2, 2], 0)
      doc.rect(x, y, w, h, 'FD')
      doc.setLineDashPattern([], 0)
      doc.setFontSize(fontSize)
      doc.setTextColor(PDF_THEME.colors.wetAreaStroke)
      doc.text(`ÁREA MOLHADA`, x + w / 2, y + h / 2 - 1, { align: 'center' })
      if (el.recess) {
        doc.text(`Rebaixo ${el.recess} mm`, x + w / 2, y + h / 2 + fontSize * 0.4, { align: 'center' })
      }
      break
    }
    case 'backsplash': {
      doc.setDrawColor(PDF_THEME.colors.trashStroke)
      doc.setFillColor(PDF_THEME.colors.trashFill)
      doc.rect(x, y, w, h, 'FD')
      doc.setFontSize(fontSize)
      doc.setTextColor(PDF_THEME.colors.grayDark)
      doc.text(`Rodabanca ${el.height} mm`, x + w / 2, y + h / 2, { align: 'center' })
      break
    }
  }
}

function drawDimension(doc: jsPDF, dim: PdfDimension, layout: PdfLayout) {
  const { scale, offsetX, offsetY } = layout
  const x1 = dim.start.x * scale + offsetX
  const y1 = dim.start.y * scale + offsetY
  const x2 = dim.end.x * scale + offsetX
  const y2 = dim.end.y * scale + offsetY

  // Physical offset taking scale into account, but bounded
  const scaledOffset = dim.offset * scale
  const physicalOffset = dim.offset === 0 ? 0 : clamp(scaledOffset, dim.offset < 0 ? -15 : 5, dim.offset < 0 ? -5 : 15)

  let lx1 = x1, ly1 = y1, lx2 = x2, ly2 = y2
  if (dim.type === 'horizontal') {
    ly1 += physicalOffset
    ly2 += physicalOffset
  } else {
    lx1 += physicalOffset
    lx2 += physicalOffset
  }

  // Extension lines
  doc.setDrawColor(PDF_THEME.colors.dimLine)
  doc.setLineWidth(PDF_THEME.lineWidths.dimension / 2)
  if (dim.offset !== 0) {
    doc.setLineDashPattern([1, 1], 0)
    if (dim.type === 'horizontal') {
      doc.line(x1, y1, lx1, ly1 - (dim.offset > 0 ? 1 : -1))
      doc.line(x2, y2, lx2, ly2 - (dim.offset > 0 ? 1 : -1))
    } else {
      doc.line(x1, y1, lx1 - (dim.offset > 0 ? 1 : -1), ly1)
      doc.line(x2, y2, lx2 - (dim.offset > 0 ? 1 : -1), ly2)
    }
    doc.setLineDashPattern([], 0)
  }

  // Main dim line
  doc.setLineWidth(PDF_THEME.lineWidths.dimension)
  doc.line(lx1, ly1, lx2, ly2)

  // Ticks and text
  doc.setTextColor(PDF_THEME.colors.dimText)
  const fontSize = clamp(9 * scale, PDF_THEME.typography.dimSizeMin, PDF_THEME.typography.dimSizeMax)
  doc.setFontSize(fontSize)

  if (dim.type === 'horizontal') {
    doc.line(lx1, ly1 - 1.5, lx1, ly1 + 1.5)
    doc.line(lx2, ly2 - 1.5, lx2, ly2 + 1.5)
    doc.text(`${dim.label} mm`, (lx1 + lx2) / 2, ly1 - 1, { align: 'center' })
  } else {
    doc.line(lx1 - 1.5, ly1, lx1 + 1.5, ly1)
    doc.line(lx2 - 1.5, ly2, lx2 + 1.5, ly2)
    doc.text(`${dim.label} mm`, lx1 - 1, (ly1 + ly2) / 2, { angle: 90, align: 'center' })
  }
}

export function drawSidePanel(doc: jsPDF, project: Project, ct: CountertopElement, pageIdx: number, totalPages: number) {
  const panelX = PDF_THEME.page.width - PDF_THEME.page.margin - PDF_THEME.panel.width
  const panelY = PDF_THEME.page.margin
  const panelH = PDF_THEME.page.height - PDF_THEME.page.margin * 2

  doc.setDrawColor(PDF_THEME.colors.black)
  doc.setLineWidth(PDF_THEME.lineWidths.border)
  doc.rect(panelX, panelY, PDF_THEME.panel.width, panelH)

  // Header
  doc.setFillColor(PDF_THEME.colors.panelHeaderBg)
  doc.rect(panelX, panelY, PDF_THEME.panel.width, 10, 'F')
  doc.setFontSize(PDF_THEME.typography.valueSize)
  doc.setTextColor(PDF_THEME.colors.panelBg)
  doc.setFont(PDF_THEME.typography.fontFamily, 'bold')
  doc.text('bancada.io', panelX + PDF_THEME.panel.width / 2, panelY + 6.5, { align: 'center' })
  doc.setFont(PDF_THEME.typography.fontFamily, 'normal')

  let cursorY = panelY + 16

  const addTitle = (text: string) => {
    doc.setFontSize(PDF_THEME.typography.sectionSize)
    doc.setTextColor(PDF_THEME.colors.black)
    doc.setFont(PDF_THEME.typography.fontFamily, 'bold')
    doc.text(text.toUpperCase(), panelX + 3, cursorY)
    doc.setFont(PDF_THEME.typography.fontFamily, 'normal')
    cursorY += 4
  }

  const addField = (label: string, value: string) => {
    doc.setFontSize(PDF_THEME.typography.labelSize)
    doc.setTextColor(PDF_THEME.colors.grayDark)
    doc.text(label, panelX + 3, cursorY)
    doc.setFontSize(PDF_THEME.typography.valueSize)
    doc.setTextColor(PDF_THEME.colors.black)
    doc.text(value, panelX + 3, cursorY + 4)
    cursorY += 8
  }

  const addDivider = () => {
    doc.setDrawColor(PDF_THEME.colors.grayLight)
    doc.setLineWidth(0.15)
    doc.line(panelX + 2, cursorY, panelX + PDF_THEME.panel.width - 2, cursorY)
    cursorY += 4
  }

  addTitle('PROJETO')
  addField('Projeto:', project.name || '—')
  addField('Cliente:', project.clientName || '—')
  addField('Ambiente:', project.environment || '—')
  addDivider()

  addTitle('MATERIAL')
  addField('Material:', project.material?.name || '—')
  addField('Espessura:', `${project.thickness} mm`)
  // Acabamento is not natively in project yet? We will just show espessura and material
  addDivider()

  addTitle('UNIDADE')
  addField('Trabalho:', 'mm')
  addDivider()

  addTitle(`PEÇA ${String(pageIdx + 1).padStart(2, '0')}`)
  let dims = ''
  if (ct.geometry.type === 'reta') {
    dims = `${ct.geometry.width} × ${ct.geometry.depth} mm`
  } else {
    dims = `${ct.geometry.segmentA.width} × ${ct.geometry.segmentA.depth + ct.geometry.segmentB.depth} mm`
  }
  addField('Dimensões totais:', dims)

  // Warnings
  const warningY = panelY + panelH - 22
  doc.setFillColor(PDF_THEME.colors.panelWarningBg)
  doc.rect(panelX + 1, warningY, PDF_THEME.panel.width - 2, 21, 'F')
  doc.setFontSize(5)
  doc.setTextColor(PDF_THEME.colors.panelWarningText)
  doc.setFont(PDF_THEME.typography.fontFamily, 'bold')
  doc.text('OBSERVAÇÕES', panelX + PDF_THEME.panel.width / 2, warningY + 4, { align: 'center' })
  doc.setFont(PDF_THEME.typography.fontFamily, 'normal')
  const warnings = [
    'Medidas apresentadas para solicitação de orçamento.',
    'Medidas finais devem ser conferidas no local.',
    'Recortes de equipamentos seguem o fabricante.'
  ]
  warnings.forEach((w, i) => {
    doc.text(w, panelX + PDF_THEME.panel.width / 2, warningY + 9 + i * 4, { align: 'center' })
  })
}

function drawScaleAndFooter(doc: jsPDF, layout: PdfLayout, pageIdx: number, totalPages: number) {
  doc.setFontSize(PDF_THEME.typography.sectionSize)
  doc.setTextColor(PDF_THEME.colors.grayDark)

  const footerY = PDF_THEME.page.height - PDF_THEME.page.margin + 4
  const panelX = PDF_THEME.page.width - PDF_THEME.page.margin - PDF_THEME.panel.width

  if (layout.bestTechnicalScale) {
    const inv = Math.round(1 / layout.bestTechnicalScale)
    doc.text(`ESCALA 1:${inv}`, PDF_THEME.page.margin, footerY)
  }

  doc.text('NÃO MEDIR PELO DESENHO', PDF_THEME.page.margin + 30, footerY)

  const dateStr = new Date().toLocaleDateString('pt-BR')
  doc.text(`DATA: ${dateStr}`, panelX, footerY)

  doc.text(`FOLHA ${pageIdx + 1}/${totalPages}`, PDF_THEME.page.width - PDF_THEME.page.margin, footerY, { align: 'right' })
}
