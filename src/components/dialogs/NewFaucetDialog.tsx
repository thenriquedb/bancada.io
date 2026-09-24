import React, { useState } from 'react'
import { Modal, FormField, FormSection, FormActions, BtnPrimary, BtnSecondary } from '../Modal.tsx'
import { useEditorStore } from '../../store/editorStore.ts'
import { generateId } from '../../utils/helpers.ts'
import { useDialogUnit } from '../../utils/useDialogUnit.ts'
import type { FaucetElement } from '../../models/types.ts'
import { getCountertops, getDefaultParent } from '../../utils/elementHelpers.ts'

export const NewFaucetDialog: React.FC = () => {
  const store = useEditorStore()
  const { unit, toMm, fromMm } = useDialogUnit()
  const countertops = getCountertops(store.project.elements)
  const defaultCt = getDefaultParent(countertops, store.selectedIds)
  const step = unit === 'm' ? 0.001 : unit === 'cm' ? 0.1 : 1

  const [diameter, setDiameter] = useState(fromMm(35))
  const [parentId, setParentId] = useState(defaultCt?.id ?? '')
  const [posX, setPosX]         = useState(fromMm(800))
  const [posY, setPosY]         = useState(fromMm(80))

  const handleCreate = () => {
    const ct = countertops.find((c) => c.id === parentId)
    const el: FaucetElement = {
      id: generateId('faucet'),
      type: 'faucet',
      position: {
        x: ct ? ct.position.x + Math.round(toMm(posX)) : Math.round(toMm(posX)),
        y: ct ? ct.position.y + Math.round(toMm(posY)) : Math.round(toMm(posY)),
      },
      locked: false,
      visible: true,
      diameter: Math.round(toMm(diameter)),
      parentId,
    }
    store.addElement(el)
    store.setOpenDialog(null)
  }

  return (
    <Modal title="Novo Furo de Torneira" onClose={() => store.setOpenDialog(null)}>
      <FormSection>
        <FormField label="Bancada">
          <select id="faucet-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Selecione...</option>
            {countertops.map((ct) => (
              <option key={ct.id} value={ct.id}>{ct.label ?? `Bancada (${ct.geometry.type})`}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Diâmetro" unit={unit}>
          <input id="faucet-diameter" type="number" min={0} step={step} value={diameter}
            onChange={(e) => setDiameter(Number(e.target.value))} />
        </FormField>
      </FormSection>
      <FormSection title={`Posição a partir da borda (${unit})`}>
        <FormField label="X" unit={unit}>
          <input id="faucet-pos-x" type="number" min={0} step={step} value={posX}
            onChange={(e) => setPosX(Number(e.target.value))} />
        </FormField>
        <FormField label="Y" unit={unit}>
          <input id="faucet-pos-y" type="number" min={0} step={step} value={posY}
            onChange={(e) => setPosY(Number(e.target.value))} />
        </FormField>
      </FormSection>
      <FormActions>
        <BtnSecondary onClick={() => store.setOpenDialog(null)}>Cancelar</BtnSecondary>
        <BtnPrimary id="create-faucet-btn" onClick={handleCreate} disabled={!parentId}>
          Adicionar torneira
        </BtnPrimary>
      </FormActions>
    </Modal>
  )
}
