import { jsPDF } from 'jspdf'
import type { Project, CountertopElement, ProjectElement } from '../../models/types.ts'
import { fitToBounds } from './layout.ts'
import { generatePdfDimensions } from './dimensions.ts'
import { renderPdfPage } from './renderer.ts'

export async function exportProjectPDF(project: Project): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const countertops = project.elements.filter(
    (el): el is CountertopElement => el.type === 'countertop'
  )

  if (countertops.length === 0) {
    doc.setFontSize(12)
    doc.text('Nenhuma bancada no projeto.', 148, 105, { align: 'center' })
    doc.save(getFilename(project))
    return
  }

  countertops.forEach((ct, pageIdx) => {
    if (pageIdx > 0) doc.addPage('a4', 'landscape')

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

    const layout = fitToBounds(children, ct)
    const dims = generatePdfDimensions(ct, children)

    renderPdfPage(doc, project, ct, children, dims, pageIdx, countertops.length, layout)
  })

  doc.save(getFilename(project))
}

function getFilename(project: Project): string {
  const name = (project.name || 'novo-projeto').replace(/[^a-z0-9]/gi, '-').toLowerCase()
  return `${name}-bancada.pdf`
}
