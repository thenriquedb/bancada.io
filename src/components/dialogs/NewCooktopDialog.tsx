import React, { useState } from 'react'
import { Modal, FormField, FormSection, FormActions, BtnPrimary, BtnSecondary, Callout } from '../Modal.tsx'
import { useEditorStore } from '../../store/editorStore.ts'
import { generateId } from '../../utils/helpers.ts'
import { useDialogUnit } from '../../utils/useDialogUnit.ts'
import type { CooktopElement } from '../../models/types.ts'
import { getValidParents, getDefaultParent, centerRelative } from '../../utils/elementHelpers.ts'

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

  const handleAutoCenter = () => {
    const parent = parents.find((c) => c.id === parentId)
    if (!parent) return
    const { x, y } = centerRelative(parent, toMm(width), toMm(depth))
    setPosX(fromMm(x))
    setPosY(fromMm(y))
  }

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
    <Modal 
      title="Novo Cooktop" 
      description="Defina as dimensões e a posição do cooktop."
      onClose={() => store.setOpenDialog(null)}
    >
      {parents.length === 0 && (
        <Callout type="warning">Crie uma bancada antes de adicionar um cooktop.</Callout>
      )}
      <FormSection title="Dimensões">
        <FormField label="Largura total" unit={unit} tooltip="A largura total externa do cooktop.">
          <input id="cooktop-width" type="number" min={0} step={step} value={width}
            onChange={(e) => setWidth(Number(e.target.value))} />
        </FormField>
        <FormField label="Profundidade" unit={unit} tooltip="A profundidade total externa do cooktop.">
          <input id="cooktop-depth" type="number" min={0} step={step} value={depth}
            onChange={(e) => setDepth(Number(e.target.value))} />
        </FormField>
      </FormSection>
      <FormSection title="Local">
        <FormField label="Elemento Pai" tooltip="Selecione onde o cooktop será instalado.">
          <select id="ct-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Selecione...</option>
            {parents.map((ct) => (
              <option key={ct.id} value={ct.id}>{ct.label ?? (ct.type === 'countertop' ? `Local (${ct.geometry.type})` : 'Área Molhada')}</option>
            ))}
          </select>
        </FormField>
      </FormSection>

      <FormSection title="Posição">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 4 }}>
          <button className="btn btn--ghost" style={{ fontSize: 11, padding: '4px 8px' }} onClick={handleAutoCenter} disabled={!parentId} type="button">
            Centralizar na área do pai
          </button>
        </div>
        <FormField label="Distância da borda esquerda" unit={unit}>
          <input id="cooktop-pos-x" type="number" min={0} step={step} value={posX}
            onChange={(e) => setPosX(Number(e.target.value))} />
        </FormField>
        <FormField label="Distância da borda superior" unit={unit}>
          <input id="cooktop-pos-y" type="number" min={0} step={step} value={posY}
            onChange={(e) => setPosY(Number(e.target.value))} />
        </FormField>
      </FormSection>
      <Callout type="warning" title="Atenção">
        Confirme o recorte no gabarito do fabricante antes da fabricação para evitar perdas.
      </Callout>
      <FormActions>
        <BtnSecondary onClick={() => store.setOpenDialog(null)}>Cancelar</BtnSecondary>
        <BtnPrimary id="create-cooktop-btn" onClick={handleCreate} disabled={!parentId}>
          Adicionar cooktop
        </BtnPrimary>
      </FormActions>
    </Modal>
  )
}
