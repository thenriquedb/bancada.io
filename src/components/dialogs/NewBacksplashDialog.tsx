import React, { useState } from 'react'
import { Modal, FormField, FormSection, FormActions, BtnPrimary, BtnSecondary } from '../Modal.tsx'
import { useEditorStore } from '../../store/editorStore.ts'
import { generateId } from '../../utils/helpers.ts'
import { useDialogUnit } from '../../utils/useDialogUnit.ts'
import type { BacksplashElement } from '../../models/types.ts'
import { getValidParents, getDefaultParent } from '../../utils/elementHelpers.ts'

export const NewBacksplashDialog: React.FC = () => {
  const store = useEditorStore()
  const { unit, toMm, fromMm } = useDialogUnit()
  const parents = getValidParents(store.project.elements)
  const defaultCt = getDefaultParent(parents, store.selectedIds)
  const step = unit === 'm' ? 0.005 : unit === 'cm' ? 0.5 : 5

  const [height, setHeight]         = useState(fromMm(100))
  const [thickness, setThickness]   = useState(20)  // always mm
  const [parentId, setParentId]     = useState(defaultCt?.id ?? '')

  const getLength = () => {
    const p = parents.find((c) => c.id === parentId)
    if (!p) return 0
    let mm = 0
    if (p.type === 'countertop') {
      mm = p.geometry.type === 'reta' ? p.geometry.width : p.geometry.segmentA.width
    } else {
      mm = p.width
    }
    return fromMm(mm)
  }

  const handleCreate = () => {
    const p = parents.find((c) => c.id === parentId)
    let lengthMm = 1000
    if (p) {
      if (p.type === 'countertop') {
        lengthMm = p.geometry.type === 'reta' ? p.geometry.width : p.geometry.segmentA.width
      } else {
        lengthMm = p.width
      }
    }
    const py = p ? p.position.y - Math.round(toMm(height)) : 0
    const px = p ? p.position.x : 0

    const el: BacksplashElement = {
      id: generateId('backsplash'),
      type: 'backsplash',
      position: { x: px, y: py },
      locked: false,
      visible: true,
      height:    Math.round(toMm(height)),
      thickness, // always mm
      length:    lengthMm,
      parentId,
    }
    store.addElement(el)
    store.setOpenDialog(null)
  }

  const len = getLength()

  return (
    <Modal title="Nova Rodabanca" onClose={() => store.setOpenDialog(null)}>
      <FormSection title="Local">
        <FormField label="Pai (Bancada/Área Molhada)" hint="A rodabanca será criada na parte traseira">
          <select id="bs-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Selecione...</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>{p.label ?? (p.type === 'countertop' ? `Bancada (${p.geometry.type})` : 'Área Molhada')}</option>
            ))}
          </select>
        </FormField>
      </FormSection>
      <FormSection>
        <FormField label="Altura" unit={unit}>
          <input id="bs-height" type="number" min={0} step={step} value={height}
            onChange={(e) => setHeight(Number(e.target.value))} />
        </FormField>
        <FormField label="Espessura" unit="mm">
          <select id="bs-thickness" value={thickness}
            onChange={(e) => setThickness(Number(e.target.value))}>
            {[12, 15, 20, 30].map((t) => <option key={t} value={t}>{t} mm</option>)}
          </select>
        </FormField>
        <FormField label="Comprimento (auto)" unit={unit}>
          <span className="prop-value">{len > 0 ? len.toFixed(unit === 'mm' ? 0 : 1) : '—'}</span>
        </FormField>
      </FormSection>
      <FormActions>
        <BtnSecondary onClick={() => store.setOpenDialog(null)}>Cancelar</BtnSecondary>
        <BtnPrimary id="create-backsplash-btn" onClick={handleCreate} disabled={!parentId}>
          Adicionar rodabanca
        </BtnPrimary>
      </FormActions>
    </Modal>
  )
}
