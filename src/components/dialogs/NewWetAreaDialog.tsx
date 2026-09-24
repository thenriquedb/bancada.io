import React, { useState } from 'react'
import { Modal, FormField, FormSection, FormActions, BtnPrimary, BtnSecondary } from '../Modal.tsx'
import { useEditorStore } from '../../store/editorStore.ts'
import { generateId } from '../../utils/helpers.ts'
import type { WetAreaElement } from '../../models/types.ts'
import { getCountertops, getDefaultParent } from '../../utils/elementHelpers.ts'

export const NewWetAreaDialog: React.FC = () => {
  const store = useEditorStore()
  const countertops = getCountertops(store.project.elements)
  const defaultCt = getDefaultParent(countertops, store.selectedIds)

  const [width, setWidth]   = useState(800)
  const [depth, setDepth]   = useState(450)
  const [recess, setRecess] = useState(4)
  const [parentId, setParentId] = useState(defaultCt?.id ?? '')
  const [posX, setPosX]     = useState(100)
  const [posY, setPosY]     = useState(80)

  const handleCreate = () => {
    const ct = countertops.find((c) => c.id === parentId)
    const el: WetAreaElement = {
      id: generateId('wet-area'),
      type: 'wet-area',
      position: {
        x: ct ? ct.position.x + posX : posX,
        y: ct ? ct.position.y + posY : posY,
      },
      locked: false,
      visible: true,
      width,
      depth,
      recess,
      parentId,
    }
    store.addElement(el)
    store.setOpenDialog(null)
  }

  return (
    <Modal title="Nova Área Molhada" onClose={() => store.setOpenDialog(null)}>
      <FormSection title="Bancada">
        <FormField label="Bancada">
          <select id="wa-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Selecione...</option>
            {countertops.map((ct) => (
              <option key={ct.id} value={ct.id}>{ct.label ?? `Bancada (${ct.geometry.type})`}</option>
            ))}
          </select>
        </FormField>
      </FormSection>

      <FormSection>
        <FormField label="Largura" unit="mm">
          <input id="wa-width" type="number" min={100} step={10} value={width}
            onChange={(e) => setWidth(Number(e.target.value))} />
        </FormField>
        <FormField label="Profundidade" unit="mm">
          <input id="wa-depth" type="number" min={100} step={10} value={depth}
            onChange={(e) => setDepth(Number(e.target.value))} />
        </FormField>
        <FormField label="Rebaixo" unit="mm" hint="Profundidade do rebaixo da área molhada">
          <input id="wa-recess" type="number" min={1} max={20} step={0.5} value={recess}
            onChange={(e) => setRecess(Number(e.target.value))} />
        </FormField>
      </FormSection>

      <FormSection title="Posição a partir da borda da bancada">
        <FormField label="X" unit="mm">
          <input id="wa-pos-x" type="number" min={0} step={10} value={posX}
            onChange={(e) => setPosX(Number(e.target.value))} />
        </FormField>
        <FormField label="Y" unit="mm">
          <input id="wa-pos-y" type="number" min={0} step={10} value={posY}
            onChange={(e) => setPosY(Number(e.target.value))} />
        </FormField>
      </FormSection>

      <FormActions>
        <BtnSecondary onClick={() => store.setOpenDialog(null)}>Cancelar</BtnSecondary>
        <BtnPrimary id="create-wet-area-btn" onClick={handleCreate} disabled={!parentId}>
          Adicionar área molhada
        </BtnPrimary>
      </FormActions>
    </Modal>
  )
}
