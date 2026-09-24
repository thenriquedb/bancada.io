import React, { useState } from 'react'
import { Modal, FormField, FormSection, FormActions, BtnPrimary, BtnSecondary, Callout } from '../Modal.tsx'
import { useEditorStore } from '../../store/editorStore.ts'
import { generateId } from '../../utils/helpers.ts'
import { useDialogUnit } from '../../utils/useDialogUnit.ts'
import type { TrashElement } from '../../models/types.ts'
import { getValidParents, getDefaultParent } from '../../utils/elementHelpers.ts'

export const NewTrashDialog: React.FC = () => {
  const store = useEditorStore()
  const { unit, toMm, fromMm } = useDialogUnit()
  const parents = getValidParents(store.project.elements)
  const defaultCt = getDefaultParent(parents, store.selectedIds)
  const step = unit === 'm' ? 0.005 : unit === 'cm' ? 0.5 : 5

  const [shape, setShape]       = useState<'circular' | 'retangular'>('circular')
  const [diameter, setDiameter] = useState(fromMm(250))
  const [width, setWidth]       = useState(fromMm(300))
  const [depth, setDepth]       = useState(fromMm(250))
  const [parentId, setParentId] = useState(defaultCt?.id ?? '')
  const [posX, setPosX]         = useState(fromMm(200))
  const [posY, setPosY]         = useState(fromMm(200))

  const handleCreate = () => {
    const parent = parents.find((c) => c.id === parentId)
    const el: TrashElement = {
      id: generateId('trash'),
      type: 'trash',
      position: {
        x: parent ? parent.position.x + Math.round(toMm(posX)) : Math.round(toMm(posX)),
        y: parent ? parent.position.y + Math.round(toMm(posY)) : Math.round(toMm(posY)),
      },
      locked: false,
      visible: true,
      shape,
      ...(shape === 'circular'
        ? { diameter: Math.round(toMm(diameter)) }
        : { width: Math.round(toMm(width)), depth: Math.round(toMm(depth)) }),
      parentId,
    }
    store.addElement(el)
    store.setOpenDialog(null)
  }

  return (
    <Modal title="Nova Lixeira Embutida" onClose={() => store.setOpenDialog(null)}>
      <FormSection title="Formato">
        <div className="radio-group">
          <label className="radio-option">
            <input type="radio" name="trash-shape" value="circular" checked={shape === 'circular'}
              onChange={() => setShape('circular')} /> Circular
          </label>
          <label className="radio-option">
            <input type="radio" name="trash-shape" value="retangular" checked={shape === 'retangular'}
              onChange={() => setShape('retangular')} /> Retangular
          </label>
        </div>
        {shape === 'circular' ? (
          <FormField label="Diâmetro do furo" unit={unit} tooltip="Diâmetro necessário para encaixar a lixeira.">
            <input id="trash-diameter" type="number" min={0} step={step} value={diameter}
              onChange={(e) => setDiameter(Number(e.target.value))} />
          </FormField>
        ) : (
          <>
            <FormField label="Largura" unit={unit} tooltip="A largura total da lixeira.">
              <input id="trash-width" type="number" min={0} step={step} value={width}
                onChange={(e) => setWidth(Number(e.target.value))} />
            </FormField>
            <FormField label="Profundidade" unit={unit} tooltip="A profundidade total da lixeira.">
              <input id="trash-depth" type="number" min={0} step={step} value={depth}
                onChange={(e) => setDepth(Number(e.target.value))} />
            </FormField>
          </>
        )}
      </FormSection>
      <FormSection title="Local">
        <FormField label="Elemento Pai" tooltip="Onde a lixeira será instalada.">
          <select id="trash-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Selecione...</option>
            {parents.map((ct) => (
              <option key={ct.id} value={ct.id}>{ct.label ?? (ct.type === 'countertop' ? `Bancada (${ct.geometry.type})` : 'Área Molhada')}</option>
            ))}
          </select>
        </FormField>
      </FormSection>

      <FormSection title={`Posição a partir da borda (${unit})`}>
        <FormField label="Centro X" unit={unit}>
          <input id="trash-pos-x" type="number" min={0} step={step} value={posX}
            onChange={(e) => setPosX(Number(e.target.value))} />
        </FormField>
        <FormField label="Centro Y" unit={unit}>
          <input id="trash-pos-y" type="number" min={0} step={step} value={posY}
            onChange={(e) => setPosY(Number(e.target.value))} />
        </FormField>
      </FormSection>
      <Callout type="info">
        Dica: Arraste a lixeira no Canvas para reposicioná-la com mais facilidade.
      </Callout>
      <FormActions>
        <BtnSecondary onClick={() => store.setOpenDialog(null)}>Cancelar</BtnSecondary>
        <BtnPrimary id="create-trash-btn" onClick={handleCreate} disabled={!parentId}>
          Adicionar lixeira
        </BtnPrimary>
      </FormActions>
    </Modal>
  )
}
