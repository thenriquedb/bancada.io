import React, { useState } from 'react'
import { Modal, FormField, FormSection, FormActions, BtnPrimary, BtnSecondary } from '../Modal.tsx'
import { useEditorStore } from '../../store/editorStore.ts'
import { generateId } from '../../utils/helpers.ts'
import type { CooktopElement } from '../../models/types.ts'
import { getCountertops, getDefaultParent } from '../../utils/elementHelpers.ts'

export const NewCooktopDialog: React.FC = () => {
  const store = useEditorStore()
  const countertops = getCountertops(store.project.elements)
  const defaultCt = getDefaultParent(countertops, store.selectedIds)

  const [width, setWidth]       = useState(560)
  const [depth, setDepth]       = useState(490)
  const [cutWidth, setCutWidth]   = useState(530)
  const [cutDepth, setCutDepth]   = useState(460)
  const [parentId, setParentId]   = useState(defaultCt?.id ?? '')
  const [posX, setPosX]           = useState(500)
  const [posY, setPosY]           = useState(80)

  const handleCreate = () => {
    const ct = countertops.find((c) => c.id === parentId)
    const el: CooktopElement = {
      id: generateId('cooktop'),
      type: 'cooktop',
      position: {
        x: ct ? ct.position.x + posX : posX,
        y: ct ? ct.position.y + posY : posY,
      },
      locked: false,
      visible: true,
      width,
      depth,
      cutWidth,
      cutDepth,
      parentId,
    }
    store.addElement(el)
    store.setOpenDialog(null)
  }

  return (
    <Modal title="Novo Cooktop" onClose={() => store.setOpenDialog(null)}>
      {countertops.length === 0 && (
        <div className="dialog-warning">⚠ Crie uma bancada antes de adicionar um cooktop.</div>
      )}

      <FormSection title="Bancada">
        <FormField label="Bancada">
          <select id="ct-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Selecione...</option>
            {countertops.map((ct) => (
              <option key={ct.id} value={ct.id}>{ct.label ?? `Bancada (${ct.geometry.type})`}</option>
            ))}
          </select>
        </FormField>
      </FormSection>

      <FormSection title="Equipamento">
        <FormField label="Largura total" unit="mm">
          <input id="cooktop-width" type="number" min={100} step={5} value={width}
            onChange={(e) => setWidth(Number(e.target.value))} />
        </FormField>
        <FormField label="Profundidade total" unit="mm">
          <input id="cooktop-depth" type="number" min={100} step={5} value={depth}
            onChange={(e) => setDepth(Number(e.target.value))} />
        </FormField>
      </FormSection>

      <FormSection title="Recorte">
        <FormField label="Largura" unit="mm">
          <input id="cooktop-cut-width" type="number" min={100} step={5} value={cutWidth}
            onChange={(e) => setCutWidth(Number(e.target.value))} />
        </FormField>
        <FormField label="Profundidade" unit="mm">
          <input id="cooktop-cut-depth" type="number" min={100} step={5} value={cutDepth}
            onChange={(e) => setCutDepth(Number(e.target.value))} />
        </FormField>
      </FormSection>

      <FormSection title="Posição a partir da borda da bancada">
        <FormField label="Distância esquerda (X)" unit="mm">
          <input id="cooktop-pos-x" type="number" min={0} step={10} value={posX}
            onChange={(e) => setPosX(Number(e.target.value))} />
        </FormField>
        <FormField label="Distância superior (Y)" unit="mm">
          <input id="cooktop-pos-y" type="number" min={0} step={10} value={posY}
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
