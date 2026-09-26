import React, { useState } from 'react'
import { Modal, FormField, FormSection, FormActions, BtnPrimary, BtnSecondary, Callout } from '../Modal.tsx'
import { useEditorStore } from '../../store/editorStore.ts'
import { generateId } from '../../utils/helpers.ts'
import { useDialogUnit } from '../../utils/useDialogUnit.ts'
import type { CutoutElement } from '../../models/types.ts'
import { getValidParents, getDefaultParent, centerRelative } from '../../utils/elementHelpers.ts'

export const NewCutoutDialog: React.FC = () => {
  const store = useEditorStore()
  const { unit, toMm, fromMm } = useDialogUnit()
  const parents = getValidParents(store.project.elements)
  const defaultCt = getDefaultParent(parents, store.selectedIds)
  const step = unit === 'm' ? 0.005 : unit === 'cm' ? 0.5 : 5

  const [shape, setShape]       = useState<'circular' | 'retangular' | 'retangular-arredondado'>('retangular')
  const [diameter, setDiameter] = useState(fromMm(100))
  const [width, setWidth]       = useState(fromMm(200))
  const [depth, setDepth]       = useState(fromMm(200))
  const [radius, setRadius]     = useState(fromMm(30))
  const [label, setLabel]       = useState('RECORTE')
  const [color, setColor]       = useState('#ffffff')
  const [parentId, setParentId] = useState(defaultCt?.id ?? '')
  const [posX, setPosX]         = useState(fromMm(200))
  const [posY, setPosY]         = useState(fromMm(200))

  const handleAutoCenter = () => {
    const parent = parents.find((c) => c.id === parentId)
    if (!parent) return
    const w = shape === 'circular' ? diameter : width
    const d = shape === 'circular' ? diameter : depth
    const { x, y } = centerRelative(parent, toMm(w), toMm(d))
    setPosX(fromMm(x))
    setPosY(fromMm(y))
  }

  const handleCreate = () => {
    const parent = parents.find((c) => c.id === parentId)
    const el: CutoutElement = {
      id: generateId('cutout'),
      type: 'cutout',
      position: {
        x: parent ? parent.position.x + Math.round(toMm(posX)) : Math.round(toMm(posX)),
        y: parent ? parent.position.y + Math.round(toMm(posY)) : Math.round(toMm(posY)),
      },
      locked: false,
      visible: true,
      label,
      color,
      shape,
      ...(shape === 'circular'
        ? { diameter: Math.round(toMm(diameter)) }
        : { width: Math.round(toMm(width)), depth: Math.round(toMm(depth)), ...(shape === 'retangular-arredondado' ? { radius: Math.round(toMm(radius)) } : {}) }),
      parentId,
    }
    store.addElement(el)
    store.setOpenDialog(null)
  }

  return (
    <Modal title="Novo Recorte" onClose={() => store.setOpenDialog(null)}>
      <FormSection title="Formato">
        <div className="radio-group" style={{ flexDirection: 'column', gap: '8px' }}>
          <label className="radio-option">
            <input type="radio" name="cutout-shape" value="circular" checked={shape === 'circular'}
              onChange={() => setShape('circular')} /> Circular
          </label>
          <label className="radio-option">
            <input type="radio" name="cutout-shape" value="retangular" checked={shape === 'retangular'}
              onChange={() => setShape('retangular')} /> Retangular Reto
          </label>
          <label className="radio-option">
            <input type="radio" name="cutout-shape" value="retangular-arredondado" checked={shape === 'retangular-arredondado'}
              onChange={() => setShape('retangular-arredondado')} /> Retangular Arredondado
          </label>
        </div>
        
        {shape === 'circular' ? (
          <FormField label="Diâmetro do furo" unit={unit} tooltip="Diâmetro do recorte.">
            <input id="cutout-diameter" type="number" min={0} step={step} value={diameter}
              onChange={(e) => setDiameter(Number(e.target.value))} />
          </FormField>
        ) : (
          <>
            <FormField label="Largura" unit={unit}>
              <input id="cutout-width" type="number" min={0} step={step} value={width}
                onChange={(e) => setWidth(Number(e.target.value))} />
            </FormField>
            <FormField label="Profundidade" unit={unit}>
              <input id="cutout-depth" type="number" min={0} step={step} value={depth}
                onChange={(e) => setDepth(Number(e.target.value))} />
            </FormField>
            {shape === 'retangular-arredondado' && (
              <FormField label="Raio (Curva)" unit={unit}>
                <input id="cutout-radius" type="number" min={0} step={step} value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))} />
              </FormField>
            )}
          </>
        )}
      </FormSection>
      
      <FormSection title="Aparência">
        <FormField label="Nome" tooltip="Nome do recorte.">
          <input id="cutout-name" type="text" value={label}
            onChange={(e) => setLabel(e.target.value)} />
        </FormField>
        <FormField label="Cor" tooltip="Cor de preenchimento.">
          <input id="cutout-color" type="color" value={color}
            onChange={(e) => setColor(e.target.value)} style={{ padding: 0, height: 32 }} />
        </FormField>
      </FormSection>

      <FormSection title="Local">
        <FormField label="Elemento Pai" tooltip="Onde o recorte será inserido.">
          <select id="cutout-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Selecione...</option>
            {parents.map((ct) => (
              <option key={ct.id} value={ct.id}>{ct.label ?? (ct.type === 'countertop' ? `Bancada (${ct.geometry.type})` : 'Área Molhada')}</option>
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
        <FormField label="Centro X" unit={unit}>
          <input id="cutout-pos-x" type="number" min={0} step={step} value={posX}
            onChange={(e) => setPosX(Number(e.target.value))} />
        </FormField>
        <FormField label="Centro Y" unit={unit}>
          <input id="cutout-pos-y" type="number" min={0} step={step} value={posY}
            onChange={(e) => setPosY(Number(e.target.value))} />
        </FormField>
      </FormSection>
      
      <Callout type="info">
        Dica: Arraste o recorte no Canvas para reposicioná-lo com mais facilidade.
      </Callout>
      
      <FormActions>
        <BtnSecondary onClick={() => store.setOpenDialog(null)}>Cancelar</BtnSecondary>
        <BtnPrimary id="create-cutout-btn" onClick={handleCreate} disabled={!parentId}>
          Adicionar Recorte
        </BtnPrimary>
      </FormActions>
    </Modal>
  )
}
