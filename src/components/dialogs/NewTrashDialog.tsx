import React, { useState } from 'react'
import { Modal, FormField, FormSection, FormActions, BtnPrimary, BtnSecondary } from '../Modal.tsx'
import { useEditorStore } from '../../store/editorStore.ts'
import { generateId } from '../../utils/helpers.ts'
import type { TrashElement } from '../../models/types.ts'
import { getCountertops, getDefaultParent } from '../../utils/elementHelpers.ts'

export const NewTrashDialog: React.FC = () => {
  const store = useEditorStore()
  const countertops = getCountertops(store.project.elements)
  const defaultCt = getDefaultParent(countertops, store.selectedIds)

  const [shape, setShape]       = useState<'circular' | 'retangular'>('circular')
  const [diameter, setDiameter] = useState(250)
  const [width, setWidth]       = useState(300)
  const [depth, setDepth]       = useState(250)
  const [parentId, setParentId]   = useState(defaultCt?.id ?? '')
  const [posX, setPosX]           = useState(200)
  const [posY, setPosY]           = useState(200)

  const handleCreate = () => {
    const ct = countertops.find((c) => c.id === parentId)
    const el: TrashElement = {
      id: generateId('trash'),
      type: 'trash',
      position: {
        x: ct ? ct.position.x + posX : posX,
        y: ct ? ct.position.y + posY : posY,
      },
      locked: false,
      visible: true,
      shape,
      ...(shape === 'circular' ? { diameter } : { width, depth }),
      parentId,
    }
    store.addElement(el)
    store.setOpenDialog(null)
  }

  return (
    <Modal title="Nova Lixeira Embutida" onClose={() => store.setOpenDialog(null)}>
      <FormSection title="Bancada">
        <FormField label="Bancada">
          <select id="trash-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Selecione...</option>
            {countertops.map((ct) => (
              <option key={ct.id} value={ct.id}>{ct.label ?? `Bancada (${ct.geometry.type})`}</option>
            ))}
          </select>
        </FormField>
      </FormSection>

      <FormSection title="Formato">
        <div className="radio-group">
          <label className="radio-option">
            <input type="radio" name="trash-shape" value="circular" checked={shape === 'circular'}
              onChange={() => setShape('circular')} />
            Circular
          </label>
          <label className="radio-option">
            <input type="radio" name="trash-shape" value="retangular" checked={shape === 'retangular'}
              onChange={() => setShape('retangular')} />
            Retangular
          </label>
        </div>

        {shape === 'circular' ? (
          <FormField label="Diâmetro" unit="mm">
            <input id="trash-diameter" type="number" min={100} max={500} step={5} value={diameter}
              onChange={(e) => setDiameter(Number(e.target.value))} />
          </FormField>
        ) : (
          <>
            <FormField label="Largura" unit="mm">
              <input id="trash-width" type="number" min={100} step={5} value={width}
                onChange={(e) => setWidth(Number(e.target.value))} />
            </FormField>
            <FormField label="Profundidade" unit="mm">
              <input id="trash-depth" type="number" min={100} step={5} value={depth}
                onChange={(e) => setDepth(Number(e.target.value))} />
            </FormField>
          </>
        )}
      </FormSection>

      <FormSection title="Posição a partir da borda da bancada">
        <FormField label="Centro X" unit="mm">
          <input id="trash-pos-x" type="number" min={0} step={10} value={posX}
            onChange={(e) => setPosX(Number(e.target.value))} />
        </FormField>
        <FormField label="Centro Y" unit="mm">
          <input id="trash-pos-y" type="number" min={0} step={10} value={posY}
            onChange={(e) => setPosY(Number(e.target.value))} />
        </FormField>
      </FormSection>

      <FormActions>
        <BtnSecondary onClick={() => store.setOpenDialog(null)}>Cancelar</BtnSecondary>
        <BtnPrimary id="create-trash-btn" onClick={handleCreate} disabled={!parentId}>
          Adicionar lixeira
        </BtnPrimary>
      </FormActions>
    </Modal>
  )
}
