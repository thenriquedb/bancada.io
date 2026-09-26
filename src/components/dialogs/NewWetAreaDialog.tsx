import React, { useState } from 'react'
import { Modal, FormField, FormSection, FormActions, BtnPrimary, BtnSecondary, Callout } from '../Modal.tsx'
import { useEditorStore } from '../../store/editorStore.ts'
import { generateId } from '../../utils/helpers.ts'
import { useDialogUnit } from '../../utils/useDialogUnit.ts'
import type { WetAreaElement } from '../../models/types.ts'
import { getCountertops, getDefaultParent, centerRelative } from '../../utils/elementHelpers.ts'

export const NewWetAreaDialog: React.FC = () => {
  const store = useEditorStore()
  const { unit, toMm, fromMm } = useDialogUnit()
  const countertops = getCountertops(store.project.elements)
  const defaultCt = getDefaultParent(countertops, store.selectedIds)
  const step = unit === 'm' ? 0.01 : unit === 'cm' ? 1 : 10

  const [width, setWidth]     = useState(fromMm(800))
  const [depth, setDepth]     = useState(fromMm(450))
  const [recess, setRecess]   = useState(4)  // always mm
  const [parentId, setParentId] = useState(defaultCt?.id ?? '')
  const [posX, setPosX]       = useState(fromMm(100))
  const [posY, setPosY]       = useState(fromMm(80))

  const handleAutoCenter = () => {
    const ct = countertops.find((c) => c.id === parentId)
    if (!ct) return
    const { x, y } = centerRelative(ct, toMm(width), toMm(depth))
    setPosX(fromMm(x))
    setPosY(fromMm(y))
  }

  const handleCreate = () => {
    const ct = countertops.find((c) => c.id === parentId)
    const el: WetAreaElement = {
      id: generateId('wet-area'),
      type: 'wet-area',
      position: {
        x: ct ? ct.position.x + Math.round(toMm(posX)) : Math.round(toMm(posX)),
        y: ct ? ct.position.y + Math.round(toMm(posY)) : Math.round(toMm(posY)),
      },
      locked: false,
      visible: true,
      width:  Math.round(toMm(width)),
      depth:  Math.round(toMm(depth)),
      recess, // rebaixo always in mm
      parentId: parentId || undefined,
    }
    store.addElement(el)
    store.setOpenDialog(null)
  }

  return (
    <Modal 
      title="Nova Área Molhada" 
      description="Defina a área molhada (rebaixo) da bancada."
      onClose={() => store.setOpenDialog(null)}
    >
      <FormSection title="Dimensões">
        <FormField label="Largura" unit={unit} tooltip="A largura total da área com rebaixo.">
          <input id="wa-width" type="number" min={0} step={step} value={width}
            onChange={(e) => setWidth(Number(e.target.value))} />
        </FormField>
        <FormField label="Profundidade" unit={unit} tooltip="A profundidade total da área molhada.">
          <input id="wa-depth" type="number" min={0} step={step} value={depth}
            onChange={(e) => setDepth(Number(e.target.value))} />
        </FormField>
        <FormField label="Rebaixo" unit="mm" hint="Profundidade do rebaixo (desnível)" tooltip="A quantos milímetros a área molhada afunda em relação ao resto da bancada.">
          <input id="wa-recess" type="number" min={1} max={20} step={0.5} value={recess}
            onChange={(e) => setRecess(Number(e.target.value))} />
        </FormField>
      </FormSection>
      <FormSection title="Local">
        <FormField label="Elemento Pai" tooltip="A qual bancada esta área molhada pertence.">
          <select id="wa-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Nenhuma (Solta no ambiente)</option>
            {countertops.map((ct) => (
              <option key={ct.id} value={ct.id}>{ct.label ?? `Bancada (${ct.geometry.type})`}</option>
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
          <input id="wa-pos-x" type="number" min={0} step={step} value={posX}
            onChange={(e) => setPosX(Number(e.target.value))} />
        </FormField>
        <FormField label="Distância da borda superior" unit={unit}>
          <input id="wa-pos-y" type="number" min={0} step={step} value={posY}
            onChange={(e) => setPosY(Number(e.target.value))} />
        </FormField>
      </FormSection>

      <Callout type="info">
        Dica: Elementos adicionados dentro desta área estarão confinados aos limites dela.
      </Callout>

      <FormActions>
        <BtnSecondary onClick={() => store.setOpenDialog(null)}>Cancelar</BtnSecondary>
        <BtnPrimary id="create-wet-area-btn" onClick={handleCreate}>
          Adicionar área molhada
        </BtnPrimary>
      </FormActions>
    </Modal>
  )
}
