import React, { useState } from 'react'
import { Modal, FormField, FormSection, FormActions, BtnPrimary, BtnSecondary } from '../Modal.tsx'
import { useEditorStore } from '../../store/editorStore.ts'
import { generateId } from '../../utils/helpers.ts'
import type { FaucetElement } from '../../models/types.ts'
import { getCountertops, getDefaultParent } from '../../utils/elementHelpers.ts'

export const NewFaucetDialog: React.FC = () => {
  const store = useEditorStore()
  const countertops = getCountertops(store.project.elements)
  const defaultCt = getDefaultParent(countertops, store.selectedIds)

  const [diameter, setDiameter] = useState(35)
  const [parentId, setParentId]   = useState(defaultCt?.id ?? '')
  const [posX, setPosX]           = useState(800)
  const [posY, setPosY]           = useState(80)

  const handleCreate = () => {
    const ct = countertops.find((c) => c.id === parentId)
    const el: FaucetElement = {
      id: generateId('faucet'),
      type: 'faucet',
      position: {
        x: ct ? ct.position.x + posX : posX,
        y: ct ? ct.position.y + posY : posY,
      },
      locked: false,
      visible: true,
      diameter,
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
        <FormField label="Diâmetro" unit="mm">
          <input id="faucet-diameter" type="number" min={20} max={100} step={1} value={diameter}
            onChange={(e) => setDiameter(Number(e.target.value))} />
        </FormField>
      </FormSection>

      <FormSection title="Posição a partir da borda da bancada">
        <FormField label="Distância esquerda (X)" unit="mm">
          <input id="faucet-pos-x" type="number" min={0} step={5} value={posX}
            onChange={(e) => setPosX(Number(e.target.value))} />
        </FormField>
        <FormField label="Distância superior (Y)" unit="mm">
          <input id="faucet-pos-y" type="number" min={0} step={5} value={posY}
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
