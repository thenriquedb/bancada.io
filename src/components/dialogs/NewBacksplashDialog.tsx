import React, { useState } from 'react'
import { Modal, FormField, FormSection, FormActions, BtnPrimary, BtnSecondary } from '../Modal.tsx'
import { useEditorStore } from '../../store/editorStore.ts'
import { generateId } from '../../utils/helpers.ts'
import { useDialogUnit } from '../../utils/useDialogUnit.ts'
import type { BacksplashElement } from '../../models/types.ts'
import { getCountertops, getDefaultParent } from '../../utils/elementHelpers.ts'

export const NewBacksplashDialog: React.FC = () => {
  const store = useEditorStore()
  const { unit, toMm, fromMm } = useDialogUnit()
  const countertops = getCountertops(store.project.elements)
  const defaultCt = getDefaultParent(countertops, store.selectedIds)
  const step = unit === 'm' ? 0.005 : unit === 'cm' ? 0.5 : 5

  const [height, setHeight]         = useState(fromMm(100))
  const [thickness, setThickness]   = useState(20)  // always mm
  const [parentId, setParentId]     = useState(defaultCt?.id ?? '')

  const getLength = () => {
    const ct = countertops.find((c) => c.id === parentId)
    if (!ct) return 0
    const mm = ct.geometry.type === 'reta' ? ct.geometry.width : ct.geometry.segmentA.width
    return fromMm(mm)
  }

  const handleCreate = () => {
    const ct = countertops.find((c) => c.id === parentId)
    const lengthMm = ct
      ? (ct.geometry.type === 'reta' ? ct.geometry.width : ct.geometry.segmentA.width)
      : 1000
    const py = ct ? ct.position.y - Math.round(toMm(height)) : 0
    const px = ct ? ct.position.x : 0

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
      <FormSection title="Bancada">
        <FormField label="Bancada" hint="A rodabanca será criada na parte traseira da bancada">
          <select id="bs-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Selecione...</option>
            {countertops.map((ct) => (
              <option key={ct.id} value={ct.id}>{ct.label ?? `Bancada (${ct.geometry.type})`}</option>
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
