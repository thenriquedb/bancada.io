import React, { useState } from 'react'
import { Modal, FormField, FormSection, FormActions, BtnPrimary, BtnSecondary, Callout } from '../Modal.tsx'
import { useEditorStore } from '../../store/editorStore.ts'
import { generateId } from '../../utils/helpers.ts'
import { useDialogUnit } from '../../utils/useDialogUnit.ts'
import type { FaucetElement } from '../../models/types.ts'
import { getValidParents, getDefaultParent } from '../../utils/elementHelpers.ts'

export const NewFaucetDialog: React.FC = () => {
  const store = useEditorStore()
  const { unit, toMm, fromMm } = useDialogUnit()
  const parents = getValidParents(store.project.elements)
  const defaultCt = getDefaultParent(parents, store.selectedIds)
  const step = unit === 'm' ? 0.001 : unit === 'cm' ? 0.1 : 1

  const [diameter, setDiameter] = useState(fromMm(35))
  const [parentId, setParentId] = useState(defaultCt?.id ?? '')
  const [posX, setPosX]         = useState(fromMm(800))
  const [posY, setPosY]         = useState(fromMm(80))

  const handleCreate = () => {
    const parent = parents.find((c) => c.id === parentId)
    const el: FaucetElement = {
      id: generateId('faucet'),
      type: 'faucet',
      position: {
        x: parent ? parent.position.x + Math.round(toMm(posX)) : Math.round(toMm(posX)),
        y: parent ? parent.position.y + Math.round(toMm(posY)) : Math.round(toMm(posY)),
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
      <FormSection title="Dimensões">
        <FormField label="Diâmetro do furo" unit={unit} tooltip="O diâmetro do furo necessário para passar a torneira.">
          <input id="faucet-diameter" type="number" min={0} step={step} value={diameter}
            onChange={(e) => setDiameter(Number(e.target.value))} />
        </FormField>
      </FormSection>
      <FormSection title="Local">
        <FormField label="Elemento Pai" tooltip="Onde o furo será feito.">
          <select id="faucet-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Selecione...</option>
            {parents.map((ct) => (
              <option key={ct.id} value={ct.id}>{ct.label ?? (ct.type === 'countertop' ? `Bancada (${ct.geometry.type})` : 'Área Molhada')}</option>
            ))}
          </select>
        </FormField>
      </FormSection>
      <FormSection title={`Posição a partir da borda (${unit})`}>
        <FormField label="Dist. esquerda X" unit={unit}>
          <input id="faucet-pos-x" type="number" min={0} step={step} value={posX}
            onChange={(e) => setPosX(Number(e.target.value))} />
        </FormField>
        <FormField label="Dist. superior Y" unit={unit}>
          <input id="faucet-pos-y" type="number" min={0} step={step} value={posY}
            onChange={(e) => setPosY(Number(e.target.value))} />
        </FormField>
      </FormSection>
      <Callout type="info">
        Dica: O furo pode ser posicionado livremente arrastando no Canvas após a inserção.
      </Callout>
      <FormActions>
        <BtnSecondary onClick={() => store.setOpenDialog(null)}>Cancelar</BtnSecondary>
        <BtnPrimary id="create-faucet-btn" onClick={handleCreate} disabled={!parentId}>
          Adicionar torneira
        </BtnPrimary>
      </FormActions>
    </Modal>
  )
}
