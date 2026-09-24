import React, { useState } from 'react'
import { Modal, FormField, FormSection, FormActions, BtnPrimary, BtnSecondary } from '../Modal.tsx'
import { useEditorStore } from '../../store/editorStore.ts'
import { generateId } from '../../utils/helpers.ts'
import { useDialogUnit } from '../../utils/useDialogUnit.ts'
import type { SinkElement, SinkType, CutShape } from '../../models/types.ts'
import { getCountertops, getDefaultParent } from '../../utils/elementHelpers.ts'

export const NewSinkDialog: React.FC = () => {
  const store = useEditorStore()
  const { unit, toMm, fromMm } = useDialogUnit()
  const countertops = getCountertops(store.project.elements)
  const defaultCt = getDefaultParent(countertops, store.selectedIds)

  const step = unit === 'm' ? 0.005 : unit === 'cm' ? 0.5 : 5

  const [sinkType, setSinkType]   = useState<SinkType>('undermount')
  const [width, setWidth]         = useState(fromMm(700))
  const [depth, setDepth]         = useState(fromMm(450))
  const [cutWidth, setCutWidth]   = useState(fromMm(700))
  const [cutDepth, setCutDepth]   = useState(fromMm(450))
  const [cutShape, setCutShape]   = useState<CutShape>('retangular')
  const [parentId, setParentId]   = useState(defaultCt?.id ?? '')
  const [posX, setPosX]           = useState(fromMm(650))
  const [posY, setPosY]           = useState(fromMm(80))

  const canCreate = parentId !== ''

  const handleCreate = () => {
    const ct = countertops.find((c) => c.id === parentId)
    const el: SinkElement = {
      id: generateId('sink'),
      type: 'sink',
      position: {
        x: ct ? ct.position.x + Math.round(toMm(posX)) : Math.round(toMm(posX)),
        y: ct ? ct.position.y + Math.round(toMm(posY)) : Math.round(toMm(posY)),
      },
      locked: false,
      visible: true,
      width:    Math.round(toMm(width)),
      depth:    Math.round(toMm(depth)),
      cutWidth: Math.round(toMm(cutWidth)),
      cutDepth: Math.round(toMm(cutDepth)),
      cutShape,
      sinkType,
      parentId,
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
        <FormField label="Largura" unit={unit}>
          <input id="sink-width" type="number" min={0} step={step} value={width}
            onChange={(e) => { const v = Number(e.target.value); setWidth(v); setCutWidth(v) }} />
        </FormField>
        <FormField label="Profundidade" unit={unit}>
          <input id="sink-depth" type="number" min={0} step={step} value={depth}
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
        <FormField label="Largura" unit={unit}>
          <input id="sink-cut-width" type="number" min={0} step={step} value={cutWidth}
            onChange={(e) => setCutWidth(Number(e.target.value))} />
        </FormField>
        <FormField label="Profundidade" unit={unit}>
          <input id="sink-cut-depth" type="number" min={0} step={step} value={cutDepth}
            onChange={(e) => setCutDepth(Number(e.target.value))} />
        </FormField>
      </FormSection>

      <FormSection title={`Posição a partir da borda (${unit})`}>
        <FormField label="Dist. esquerda X" unit={unit}>
          <input id="sink-pos-x" type="number" min={0} step={step} value={posX}
            onChange={(e) => setPosX(Number(e.target.value))} />
        </FormField>
        <FormField label="Dist. superior Y" unit={unit}>
          <input id="sink-pos-y" type="number" min={0} step={step} value={posY}
            onChange={(e) => setPosY(Number(e.target.value))} />
        </FormField>
      </FormSection>

      <div className="form-hint">⚠ Confirme o recorte no gabarito do fabricante antes da fabricação.</div>

      <FormActions>
        <BtnSecondary onClick={() => store.setOpenDialog(null)}>Cancelar</BtnSecondary>
        <BtnPrimary id="create-sink-btn" onClick={handleCreate} disabled={!canCreate}>
          Adicionar cuba
        </BtnPrimary>
      </FormActions>
    </Modal>
  )
}
