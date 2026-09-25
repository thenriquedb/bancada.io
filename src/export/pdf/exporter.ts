import { jsPDF } from 'jspdf'
import type { Project, CountertopElement, ProjectElement } from '../../models/types.ts'
import { fitToBounds } from './layout.ts'
import { drawSidePanel } from './renderer.ts'
import 'svg2pdf.js'

export async function exportProjectPDF(project: Project): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const countertops = project.elements.filter(
    (el): el is CountertopElement => el.type === 'countertop'
  )

  const originalSvg = document.querySelector('.editor-canvas') as SVGSVGElement | null
  if (!originalSvg || countertops.length === 0) {
    doc.setFontSize(12)
    doc.text('Erro: Canvas não encontrado ou nenhuma bancada.', 148, 105, { align: 'center' })
    doc.save(getFilename(project))
    return
  }

  // Clone SVG to manipulate it
  const baseClone = originalSvg.cloneNode(true) as SVGSVGElement
  
  // Clean up UI elements we don't want in the PDF
  baseClone.querySelector('.selection-overlay')?.remove()
  baseClone.querySelector('.grid')?.remove()
  baseClone.querySelector('.background-layer')?.remove()
  baseClone.querySelector('.room-bounds')?.remove()

  // Reset viewport transforms to get true world coordinates
  const baseWorldLayer = baseClone.querySelector('.world-layer') as SVGGElement | null
  if (baseWorldLayer) {
    baseWorldLayer.setAttribute('transform', '') // remove pan and zoom
  }

  for (let pageIdx = 0; pageIdx < countertops.length; pageIdx++) {
    const ct = countertops[pageIdx]
    if (pageIdx > 0) doc.addPage('a4', 'landscape')

    const clone = baseClone.cloneNode(true) as SVGSVGElement

    // Find children specific to this countertop
    const children = project.elements.filter(el => {
      if (el.id === ct.id) return false
      // Direct children
      if ('parentId' in el && el.parentId === ct.id) return true
      // Children of wet-areas that belong to this countertop
      if ('parentId' in el) {
        const parent = project.elements.find(p => p.id === el.parentId)
        if (parent && parent.type === 'wet-area' && parent.parentId === ct.id) return true
      }
      return false
    })

    const allowedIds = new Set([ct.id, ...children.map(c => c.id)])

    // Remove elements that don't belong to this countertop
    clone.querySelectorAll('[data-element-id]').forEach(node => {
      const id = node.getAttribute('data-element-id')
      if (id && !allowedIds.has(id)) node.remove()
    })

    // Remove dimensions that don't belong to this countertop
    clone.querySelectorAll('[data-countertop-id]').forEach(node => {
      const cId = node.getAttribute('data-countertop-id')
      if (cId && cId !== ct.id) node.remove()
    })

    // Append temporarily to DOM to calculate accurate BBox
    const wrapper = document.createElement('div')
    wrapper.style.position = 'absolute'
    wrapper.style.left = '-99999px'
    wrapper.style.top = '-99999px'
    wrapper.style.width = '10000px'
    wrapper.style.height = '10000px'
    wrapper.style.overflow = 'hidden'
    wrapper.appendChild(clone)
    document.body.appendChild(wrapper)

    // Force SVG to use natural dimensions
    clone.style.width = 'auto'
    clone.style.height = 'auto'

    let bbox = { x: 0, y: 0, width: 1000, height: 1000 }
    const worldLayer = clone.querySelector('.world-layer') as SVGGElement | null
    try {
      if (worldLayer) {
        bbox = worldLayer.getBBox()
      } else {
        bbox = clone.getBBox()
      }
    } catch (e) {
      console.error("Error getting bbox", e)
    }

    // Add padding around the exported content
    const padding = 10
    clone.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`)
    clone.style.width = `${bbox.width + padding * 2}px`
    clone.style.height = `${bbox.height + padding * 2}px`
    clone.setAttribute('width', `${bbox.width + padding * 2}`)
    clone.setAttribute('height', `${bbox.height + padding * 2}`)

    // A4 Landscape is 297 x 210
    const pdfW = 297
    const pdfH = 210
    const margin = 8
    const panelW = 65
    const maxW = pdfW - margin * 3 - panelW
    const maxH = pdfH - margin * 2

    const scaleX = maxW / (bbox.width + padding * 2)
    const scaleY = maxH / (bbox.height + padding * 2)
    const finalScale = Math.min(scaleX, scaleY)

    const finalW = (bbox.width + padding * 2) * finalScale
    const finalH = (bbox.height + padding * 2) * finalScale

    const x = margin + (maxW - finalW) / 2
    const y = margin + (maxH - finalH) / 2

    doc.setFillColor('#ffffff')
    doc.rect(0, 0, pdfW, pdfH, 'F')

    try {
      // @ts-ignore
      await doc.svg(clone, {
        x,
        y,
        width: finalW,
        height: finalH
      })
    } catch (e) {
      console.error("Erro ao gerar SVG no PDF", e)
    }

    drawSidePanel(doc, project, ct, pageIdx + 1, countertops.length)

    document.body.removeChild(wrapper)
  }

  doc.save(getFilename(project))
}

export async function exportProjectImage(project: Project): Promise<void> {
  const countertops = project.elements.filter(
    (el): el is CountertopElement => el.type === 'countertop'
  )

  const originalSvg = document.querySelector('.editor-canvas') as SVGSVGElement | null
  if (!originalSvg || countertops.length === 0) {
    alert('Erro: Canvas não encontrado ou nenhuma bancada.')
    return
  }

  const ct = countertops[0]
  const clone = originalSvg.cloneNode(true) as SVGSVGElement
  
  clone.querySelector('.selection-overlay')?.remove()
  clone.querySelector('.grid')?.remove()
  clone.querySelector('.background-layer')?.remove()
  clone.querySelector('.room-bounds')?.remove()

  const worldLayer = clone.querySelector('.world-layer') as SVGGElement | null
  if (worldLayer) {
    worldLayer.setAttribute('transform', '')
  }

  const children = project.elements.filter(el => {
    if (el.id === ct.id) return false
    if ('parentId' in el && el.parentId === ct.id) return true
    if ('parentId' in el) {
      const parent = project.elements.find(p => p.id === el.parentId)
      if (parent && parent.type === 'wet-area' && parent.parentId === ct.id) return true
    }
    return false
  })

  const allowedIds = new Set([ct.id, ...children.map(c => c.id)])

  clone.querySelectorAll('[data-element-id]').forEach(node => {
    const id = node.getAttribute('data-element-id')
    if (id && !allowedIds.has(id)) node.remove()
  })

  clone.querySelectorAll('[data-countertop-id]').forEach(node => {
    const cId = node.getAttribute('data-countertop-id')
    if (cId && cId !== ct.id) node.remove()
  })

  const wrapper = document.createElement('div')
  wrapper.style.position = 'absolute'
  wrapper.style.left = '-99999px'
  wrapper.style.top = '-99999px'
  wrapper.style.width = '10000px'
  wrapper.style.height = '10000px'
  wrapper.style.overflow = 'hidden'
  wrapper.appendChild(clone)
  document.body.appendChild(wrapper)

  clone.style.width = 'auto'
  clone.style.height = 'auto'

  let bbox = { x: 0, y: 0, width: 1000, height: 1000 }
  try {
    if (worldLayer) {
      bbox = worldLayer.getBBox()
    } else {
      bbox = clone.getBBox()
    }
  } catch (e) {
    console.error("Error getting bbox", e)
  }

  const padding = 20
  clone.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`)
  
  // High resolution output
  const resScale = 4
  const finalW = (bbox.width + padding * 2) * resScale
  const finalH = (bbox.height + padding * 2) * resScale

  clone.style.width = `${finalW}px`
  clone.style.height = `${finalH}px`
  clone.setAttribute('width', finalW.toString())
  clone.setAttribute('height', finalH.toString())

  const serializer = new XMLSerializer()
  let svgString = serializer.serializeToString(clone)
  if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
  }

  const img = new Image()
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = finalW
    canvas.height = finalH
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, finalW, finalH)
      ctx.drawImage(img, 0, 0)
      
      const pngUrl = canvas.toDataURL('image/png', 1.0)
      const a = document.createElement('a')
      a.href = pngUrl
      a.download = getFilename(project).replace('.pdf', '.png')
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
    URL.revokeObjectURL(url)
    document.body.removeChild(wrapper)
  }

  img.onerror = () => {
    console.error('Falha ao renderizar SVG para imagem')
    document.body.removeChild(wrapper)
  }

  img.src = url
}

function getFilename(project: Project): string {
  const name = (project.name || 'novo-projeto').replace(/[^a-z0-9]/gi, '-').toLowerCase()
  return `${name}-bancada.pdf`
}
