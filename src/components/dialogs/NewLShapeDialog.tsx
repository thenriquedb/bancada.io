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

export const NewLShapeDialog: React.FC = () => {
  const store = useEditorStore()
  const project = store.project
  const { viewport } = store

  const [aWidth, setAWidth]   = useState(2400)
  const [aDepth, setADepth]   = useState(620)
  const [bWidth, setBWidth]   = useState(1600)
  const [bDepth, setBDepth]   = useState(620)
  const [thickness, setThickness] = useState<12 | 15 | 20 | 30>(project.thickness as 12 | 15 | 20 | 30)
  const [materialId, setMaterialId] = useState(project.material?.id ?? MATERIALS[0].id)

  const handleCreate = () => {
    const cx = (window.innerWidth * 0.6 / 2 - viewport.panX) / viewport.zoom
    const cy = (window.innerHeight / 2 - viewport.panY) / viewport.zoom
    const totalW = Math.max(aWidth, bWidth)
    const totalH = aDepth + bDepth
    const px = Math.max(0, cx - totalW / 2)
    const py = Math.max(0, cy - totalH / 2)

    const material = MATERIALS.find((m) => m.id === materialId) ?? MATERIALS[0]

    const el: CountertopElement = {
      id: generateId('countertop'),
      type: 'countertop',
      position: { x: Math.round(px / 10) * 10, y: Math.round(py / 10) * 10 },
      locked: false,
      visible: true,
      geometry: {
        type: 'l-shape',
        segmentA: { width: aWidth, depth: aDepth },
        segmentB: { width: bWidth, depth: bDepth },
      },
      thickness,
      material,
      edgeFinishes: DEFAULT_EDGE,
    }

    store.addElement(el)
    store.setOpenDialog(null)
  }

  return (
    <Modal title="Nova Bancada em L" onClose={() => store.setOpenDialog(null)} width={460}>
      <div className="lshape-diagram" aria-hidden="true">
        <svg viewBox="0 0 200 160" width="200" height="160">
          <rect x="40" y="10" width="120" height="40" fill="#e8f4fd" stroke="#1971c2" strokeWidth="1.5"/>
          <rect x="40" y="50" width="60" height="90" fill="#e8f4fd" stroke="#1971c2" strokeWidth="1.5"/>
          <text x="100" y="34" textAnchor="middle" fontSize="9" fill="#1971c2">Segmento A</text>
          <text x="70" y="100" textAnchor="middle" fontSize="9" fill="#1971c2">Segmento B</text>
        </svg>
      </div>

      <FormSection title="Segmento A (horizontal superior)">
        <FormField label="Comprimento" unit="mm">
          <input id="la-width" type="number" min={200} max={8000} step={10} value={aWidth}
            onChange={(e) => setAWidth(Number(e.target.value))} />
        </FormField>
        <FormField label="Profundidade" unit="mm">
          <input id="la-depth" type="number" min={200} max={2000} step={10} value={aDepth}
            onChange={(e) => setADepth(Number(e.target.value))} />
        </FormField>
      </FormSection>

      <FormSection title="Segmento B (vertical)">
        <FormField label="Comprimento" unit="mm">
          <input id="lb-width" type="number" min={200} max={8000} step={10} value={bWidth}
            onChange={(e) => setBWidth(Number(e.target.value))} />
        </FormField>
        <FormField label="Profundidade" unit="mm">
          <input id="lb-depth" type="number" min={200} max={2000} step={10} value={bDepth}
            onChange={(e) => setBDepth(Number(e.target.value))} />
        </FormField>
      </FormSection>

      <FormSection>
        <FormField label="Espessura" unit="mm">
          <select id="ll-thickness" value={thickness}
            onChange={(e) => setThickness(Number(e.target.value) as 12 | 15 | 20 | 30)}>
            {[12, 15, 20, 30].map((t) => <option key={t} value={t}>{t} mm</option>)}
          </select>
        </FormField>
        <FormField label="Material">
          <select id="ll-material" value={materialId}
            onChange={(e) => setMaterialId(e.target.value)}>
            {MATERIALS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </FormField>
      </FormSection>

      <FormActions>
        <BtnSecondary onClick={() => store.setOpenDialog(null)}>Cancelar</BtnSecondary>
        <BtnPrimary id="create-lshape-btn" onClick={handleCreate}>Criar bancada em L</BtnPrimary>
      </FormActions>
    </Modal>
  )
}
