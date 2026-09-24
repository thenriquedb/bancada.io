import React, { useState } from 'react'
import { Modal, FormField, FormSection, FormActions, BtnPrimary, BtnSecondary, Callout } from '../Modal.tsx'
import { useEditorStore } from '../../store/editorStore.ts'
import { generateId } from '../../utils/helpers.ts'
import { useDialogUnit } from '../../utils/useDialogUnit.ts'
import type { SinkElement } from '../../models/types.ts'
import { getValidParents, getDefaultParent, centerRelative } from '../../utils/elementHelpers.ts'

export const NewSinkDialog: React.FC = () => {
  const store = useEditorStore()
  const { unit, toMm, fromMm } = useDialogUnit()
  const parents = getValidParents(store.project.elements)
  const defaultCt = getDefaultParent(parents, store.selectedIds)

  const step = unit === 'm' ? 0.005 : unit === 'cm' ? 0.5 : 5

  const [width, setWidth]         = useState(fromMm(700))
  const [depth, setDepth]         = useState(fromMm(450))
  const [parentId, setParentId]   = useState(defaultCt?.id ?? '')
  const [posX, setPosX]           = useState(fromMm(650))
  const [posY, setPosY]           = useState(fromMm(80))

  const canCreate = parentId !== ''

  const handleAutoCenter = () => {
    const parent = parents.find((c) => c.id === parentId)
    if (!parent) return
    const { x, y } = centerRelative(parent, toMm(width), toMm(depth))
    setPosX(fromMm(x))
    setPosY(fromMm(y))
  }

  const handleCreate = () => {
    const parent = parents.find((c) => c.id === parentId)
    const el: SinkElement = {
      id: generateId('sink'),
      type: 'sink',
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
    <Modal title="Nova Cuba" onClose={() => store.setOpenDialog(null)}>
      {parents.length === 0 && (
        <div className="dialog-warning">⚠ Crie uma bancada ou área molhada antes de adicionar uma cuba.</div>
      )}

      <FormSection title="Dimensões">
        <FormField label="Largura" unit={unit} tooltip="Tamanho da cuba da esquerda para a direita.">
          <input id="sink-width" type="number" min={0} step={step} value={width}
            onChange={(e) => setWidth(Number(e.target.value))} />
        </FormField>
        <FormField label="Profundidade" unit={unit} tooltip="Tamanho da cuba de trás para frente.">
          <input id="sink-depth" type="number" min={0} step={step} value={depth}
            onChange={(e) => setDepth(Number(e.target.value))} />
        </FormField>
      </FormSection>

      <FormSection title="Local">
        <FormField label="Elemento Pai" tooltip="Selecione a bancada ou área molhada onde a cuba será instalada.">
          <select id="sink-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Selecione...</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>{p.label ?? (p.type === 'countertop' ? `Bancada (${p.geometry.type})` : 'Área Molhada')}</option>
            ))}
          </select>
        </FormField>
      </FormSection>




      <FormSection title={`Posição a partir da borda (${unit})`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Ajuste fino da posição:</span>
          <button className="btn btn--ghost" style={{ fontSize: 11, padding: '4px 8px' }} onClick={handleAutoCenter} disabled={!parentId} type="button">
            Centralizar Automaticamente
          </button>
        </div>
        <FormField label="Dist. esquerda X" unit={unit}>
          <input id="sink-pos-x" type="number" min={0} step={step} value={posX}
            onChange={(e) => setPosX(Number(e.target.value))} />
        </FormField>
        <FormField label="Dist. superior Y" unit={unit}>
          <input id="sink-pos-y" type="number" min={0} step={step} value={posY}
            onChange={(e) => setPosY(Number(e.target.value))} />
        </FormField>
      </FormSection>

      <Callout type="warning" title="Atenção">
        Confirme o recorte no gabarito do fabricante antes da fabricação para evitar perdas de material.
      </Callout>

      <FormActions>
        <BtnSecondary onClick={() => store.setOpenDialog(null)}>Cancelar</BtnSecondary>
        <BtnPrimary id="create-sink-btn" onClick={handleCreate} disabled={!canCreate}>
          Adicionar cuba
        </BtnPrimary>
      </FormActions>
    </Modal>
  )
}
