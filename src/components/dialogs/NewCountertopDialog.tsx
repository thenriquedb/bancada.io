import React, { useState } from 'react'
import { Modal, FormField, FormSection, FormActions, BtnPrimary, BtnSecondary } from '../Modal.tsx'
import { useEditorStore } from '../../store/editorStore.ts'
import { generateId } from '../../utils/helpers.ts'
import { MATERIALS } from '../../models/materials.ts'
import type { CountertopElement, EdgeFinishes } from '../../models/types.ts'

const DEFAULT_EDGE: EdgeFinishes = {
  front: 'boleado',
  back: 'reto',
  left: 'reto',
  right: 'reto',
}

export const NewCountertopDialog: React.FC = () => {
  const store = useEditorStore()
  const project = store.project
  const { viewport } = store

  const [width, setWidth]       = useState(3600)
  const [depth, setDepth]       = useState(620)
  const [thickness, setThickness] = useState<12 | 15 | 20 | 30>(project.thickness as 12 | 15 | 20 | 30)
  const [materialId, setMaterialId] = useState(project.material?.id ?? MATERIALS[0].id)

  const handleCreate = () => {
    // Position centered in current viewport
    const cx = (window.innerWidth * 0.6 / 2 - viewport.panX) / viewport.zoom
    const cy = (window.innerHeight / 2 - viewport.panY) / viewport.zoom
    const px = Math.max(0, cx - width / 2)
    const py = Math.max(0, cy - depth / 2)

    const material = MATERIALS.find((m) => m.id === materialId) ?? MATERIALS[0]

    const el: CountertopElement = {
      id: generateId('countertop'),
      type: 'countertop',
      position: { x: Math.round(px / 10) * 10, y: Math.round(py / 10) * 10 },
      locked: false,
      visible: true,
      geometry: { type: 'reta', width, depth },
      thickness,
      material,
      edgeFinishes: DEFAULT_EDGE,
    }

    store.addElement(el)
    store.setOpenDialog(null)
  }

  return (
    <Modal title="Nova Bancada Reta" onClose={() => store.setOpenDialog(null)}>
      <FormSection>
        <FormField label="Comprimento" unit="mm">
          <input
            id="ct-width"
            type="number"
            min={100}
            max={10000}
            step={10}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
          />
        </FormField>
        <FormField label="Profundidade" unit="mm">
          <input
            id="ct-depth"
            type="number"
            min={100}
            max={2000}
            step={10}
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
          />
        </FormField>
        <FormField label="Espessura" unit="mm">
          <select
            id="ct-thickness"
            value={thickness}
            onChange={(e) => setThickness(Number(e.target.value) as 12 | 15 | 20 | 30)}
          >
            {[12, 15, 20, 30].map((t) => (
              <option key={t} value={t}>{t} mm</option>
            ))}
          </select>
        </FormField>
      </FormSection>

      <FormSection title="Material">
        <FormField label="Material">
          <select
            id="ct-material"
            value={materialId}
            onChange={(e) => setMaterialId(e.target.value)}
          >
            {MATERIALS.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </FormField>
      </FormSection>

      <div className="form-preview">
        <span className="form-preview__label">Pré-visualização:</span>
        <span className="form-preview__value">{width} × {depth} × {thickness} mm</span>
      </div>

      <FormActions>
        <BtnSecondary onClick={() => store.setOpenDialog(null)}>Cancelar</BtnSecondary>
        <BtnPrimary id="create-countertop-btn" onClick={handleCreate}>Criar bancada</BtnPrimary>
      </FormActions>
    </Modal>
  )
}
