import React, { useState } from 'react'
import { Modal, FormField, FormSection, FormActions, BtnPrimary, BtnSecondary } from '../Modal.tsx'
import { useEditorStore } from '../../store/editorStore.ts'
import { generateId } from '../../utils/helpers.ts'
import { useDialogUnit } from '../../utils/useDialogUnit.ts'
import type { CooktopElement } from '../../models/types.ts'
import { getValidParents, getDefaultParent } from '../../utils/elementHelpers.ts'

export const NewCooktopDialog: React.FC = () => {
  const store = useEditorStore()
  const { unit, toMm, fromMm } = useDialogUnit()
  const parents = getValidParents(store.project.elements)
  const defaultCt = getDefaultParent(parents, store.selectedIds)
  const step = unit === 'm' ? 0.005 : unit === 'cm' ? 0.5 : 5

  const [width, setWidth]       = useState(fromMm(560))
  const [depth, setDepth]       = useState(fromMm(490))
  const [parentId, setParentId] = useState(defaultCt?.id ?? '')
  const [posX, setPosX]         = useState(fromMm(500))
  const [posY, setPosY]         = useState(fromMm(80))

  const handleCreate = () => {
    const parent = parents.find((c) => c.id === parentId)
    const el: CooktopElement = {
      id: generateId('cooktop'),
      type: 'cooktop',
      position: {
        x: parent ? parent.position.x + Math.round(toMm(posX)) : Math.round(toMm(posX)),
        y: parent ? parent.position.y + Math.round(toMm(posY)) : Math.round(toMm(posY)),
      },
      locked: false,
      visible: true,
      width:    Math.round(toMm(width)),
      depth:    Math.round(toMm(depth)),
      parentId,
    }
    store.addElement(el)
    store.setOpenDialog(null)
  }

  return (
    <Modal title="Novo Cooktop" onClose={() => store.setOpenDialog(null)}>
      {parents.length === 0 && (
        <div className="dialog-warning">⚠ Crie uma bancada antes de adicionar um cooktop.</div>
      )}
      <FormSection title="Bancada">
        <FormField label="Bancada">
          <select id="ct-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Selecione...</option>
            {parents.map((ct) => (
              <option key={ct.id} value={ct.id}>{ct.label ?? (ct.type === 'countertop' ? `Local (${ct.geometry.type})` : 'Área Molhada')}</option>
            ))}
          </select>
        </FormField>
      </FormSection>
      <FormSection title="Equipamento">
        <FormField label="Largura total" unit={unit}>
          <input id="cooktop-width" type="number" min={0} step={step} value={width}
            onChange={(e) => setWidth(Number(e.target.value))} />
        </FormField>
        <FormField label="Profundidade" unit={unit}>
          <input id="cooktop-depth" type="number" min={0} step={step} value={depth}
            onChange={(e) => setDepth(Number(e.target.value))} />
        </FormField>
      </FormSection>

      <FormSection title={`Posição a partir da borda (${unit})`}>
        <FormField label="X" unit={unit}>
          <input id="cooktop-pos-x" type="number" min={0} step={step} value={posX}
            onChange={(e) => setPosX(Number(e.target.value))} />
        </FormField>
        <FormField label="Y" unit={unit}>
          <input id="cooktop-pos-y" type="number" min={0} step={step} value={posY}
            onChange={(e) => setPosY(Number(e.target.value))} />
        </FormField>
      </FormSection>
      <div className="form-hint">⚠ Confirme o recorte no gabarito do fabricante antes da fabricação.</div>
      <FormActions>
        <BtnSecondary onClick={() => store.setOpenDialog(null)}>Cancelar</BtnSecondary>
        <BtnPrimary id="create-cooktop-btn" onClick={handleCreate} disabled={!parentId}>
          Adicionar cooktop
        </BtnPrimary>
      </FormActions>
    </Modal>
  )
}
