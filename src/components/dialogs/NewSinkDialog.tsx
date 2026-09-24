import React, { useState } from 'react'
import { Modal, FormField, FormSection, FormActions, BtnPrimary, BtnSecondary } from '../Modal.tsx'
import { useEditorStore } from '../../store/editorStore.ts'
import { generateId } from '../../utils/helpers.ts'
import type { SinkElement, SinkType, CutShape } from '../../models/types.ts'
import { getCountertops, getDefaultParent, centerInCountertop } from '../../utils/elementHelpers.ts'

export const NewSinkDialog: React.FC = () => {
  const store = useEditorStore()
  const countertops = getCountertops(store.project.elements)
  const defaultCt = getDefaultParent(countertops, store.selectedIds)

  const [sinkType, setSinkType] = useState<SinkType>('undermount')
  const [width, setWidth]       = useState(700)
  const [depth, setDepth]       = useState(450)
  const [cutWidth, setCutWidth]   = useState(700)
  const [cutDepth, setCutDepth]   = useState(450)
  const [cutShape, setCutShape]   = useState<CutShape>('retangular')
  const [parentId, setParentId]   = useState(defaultCt?.id ?? '')
  const [posX, setPosX]           = useState(() => {
    if (!defaultCt || defaultCt.geometry.type !== 'reta') return 650
    return Math.round((defaultCt.geometry.width - 700) / 2)
  })
  const [posY, setPosY] = useState(80)

  const canCreate = parentId !== ''

  const handleCreate = () => {
    const ct = countertops.find((c) => c.id === parentId)
    const pos = ct ? centerInCountertop(ct, width, depth) : { x: posX, y: posY }

    const el: SinkElement = {
      id: generateId('sink'),
      type: 'sink',
      position: { x: pos.x + posX - (ct ? Math.round((ct.geometry.type === 'reta' ? ct.geometry.width - width : 0) / 2) : 0), y: pos.y + posY - (ct ? 0 : 0) },
      locked: false,
      visible: true,
      width,
      depth,
      cutWidth,
      cutDepth,
      cutShape,
      sinkType,
      parentId,
    }

    // Use absolute position based on parent + user offsets
    if (ct) {
      el.position = {
        x: ct.position.x + posX,
        y: ct.position.y + posY,
      }
    }

    store.addElement(el)
    store.setOpenDialog(null)
  }

  return (
    <Modal title="Nova Cuba" onClose={() => store.setOpenDialog(null)}>
      {countertops.length === 0 && (
        <div className="dialog-warning">⚠ Crie uma bancada antes de adicionar uma cuba.</div>
      )}

      <FormSection title="Bancada">
        <FormField label="Bancada">
          <select id="sink-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Selecione...</option>
            {countertops.map((ct) => (
              <option key={ct.id} value={ct.id}>{ct.label ?? `Bancada (${ct.geometry.type})`}</option>
            ))}
          </select>
        </FormField>
      </FormSection>

      <FormSection title="Cuba">
        <FormField label="Tipo">
          <select id="sink-type" value={sinkType} onChange={(e) => setSinkType(e.target.value as SinkType)}>
            <option value="embutir">Embutir</option>
            <option value="sobrepor">Sobrepor</option>
            <option value="undermount">Undermount</option>
            <option value="esculpida">Esculpida</option>
            <option value="personalizada">Personalizada</option>
          </select>
        </FormField>
        <FormField label="Largura" unit="mm">
          <input id="sink-width" type="number" min={100} max={2000} step={5} value={width}
            onChange={(e) => { const v = Number(e.target.value); setWidth(v); setCutWidth(v) }} />
        </FormField>
        <FormField label="Profundidade" unit="mm">
          <input id="sink-depth" type="number" min={100} max={1000} step={5} value={depth}
            onChange={(e) => { const v = Number(e.target.value); setDepth(v); setCutDepth(v) }} />
        </FormField>
      </FormSection>

      <FormSection title="Recorte">
        <FormField label="Formato">
          <select id="sink-cut-shape" value={cutShape} onChange={(e) => setCutShape(e.target.value as CutShape)}>
            <option value="retangular">Retangular</option>
            <option value="arredondado">Arredondado</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </FormField>
        <FormField label="Largura" unit="mm">
          <input id="sink-cut-width" type="number" min={100} max={2000} step={5} value={cutWidth}
            onChange={(e) => setCutWidth(Number(e.target.value))} />
        </FormField>
        <FormField label="Profundidade" unit="mm">
          <input id="sink-cut-depth" type="number" min={100} max={1000} step={5} value={cutDepth}
            onChange={(e) => setCutDepth(Number(e.target.value))} />
        </FormField>
      </FormSection>

      <FormSection title="Posição a partir da borda da bancada">
        <FormField label="Distância esquerda (X)" unit="mm">
          <input id="sink-pos-x" type="number" min={0} step={10} value={posX}
            onChange={(e) => setPosX(Number(e.target.value))} />
        </FormField>
        <FormField label="Distância superior (Y)" unit="mm">
          <input id="sink-pos-y" type="number" min={0} step={10} value={posY}
            onChange={(e) => setPosY(Number(e.target.value))} />
        </FormField>
      </FormSection>

      <div className="form-hint">
        ⚠ Confirme o recorte no gabarito do fabricante antes da fabricação.
      </div>

      <FormActions>
        <BtnSecondary onClick={() => store.setOpenDialog(null)}>Cancelar</BtnSecondary>
        <BtnPrimary id="create-sink-btn" onClick={handleCreate} disabled={!canCreate}>
          Adicionar cuba
        </BtnPrimary>
      </FormActions>
    </Modal>
  )
}
