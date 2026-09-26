import React, { useState } from 'react'
import { Modal, FormField, FormSection, FormActions, BtnPrimary, BtnSecondary, Callout } from '../Modal.tsx'
import { useEditorStore } from '../../store/editorStore.ts'
import { generateId } from '../../utils/helpers.ts'
import { MATERIALS } from '../../models/materials.ts'
import { useDialogUnit } from '../../utils/useDialogUnit.ts'
import type { CountertopElement } from '../../models/types.ts'

/**
 * L-shape countertop dialog.
 *
 * Top view orientation:
 *
 *   ←──── Comprimento A ────────────────────────→
 *   ┌──────────────────────────────────────────┐  ↑
 *   │              Segmento A                  │  Profundidade A
 *   └──────┬───────────────────────────────────┘  ↓
 *          │  ↑
 *   ←DepB→ │  Comprimento B   (medido a partir da borda inferior de A)
 *          │  ↓
 *   └──────┘
 *
 * Data model mapping:
 *   segmentA.width  = comprimento A  (horizontal total)
 *   segmentA.depth  = profundidade A (vertical strip height)
 *   segmentB.width  = profundidade B (horizontal depth of B, the left column)
 *   segmentB.depth  = comprimento B  (vertical extent of B BELOW A — does NOT include A.depth)
 */
export const NewLShapeDialog: React.FC = () => {
  const store = useEditorStore()
  const project = store.project
  const { viewport } = store
  const { unit, toMm, fromMm } = useDialogUnit()

  const step = unit === 'm' ? 0.01 : unit === 'cm' ? 1 : 10
  const min  = unit === 'm' ? 0.1  : unit === 'cm' ? 10 : 100

  // Segment A
  const [aComprimento, setAComprimento] = useState(fromMm(2600)) // horizontal length
  const [aProfundidade, setAProfundidade] = useState(fromMm(700)) // front-to-back depth

  // Segment B
  // comprimento = how far B goes DOWN from A's bottom edge (does NOT include A's depth)
  const [bComprimento, setBComprimento] = useState(fromMm(1500))
  // profundidade = front-to-back depth of the left column
  const [bProfundidade, setBProfundidade] = useState(fromMm(700))

  const [thickness, setThickness]   = useState<12 | 15 | 20 | 30>(project.thickness as 12 | 15 | 20 | 30)
  const [materialId, setMaterialId] = useState(project.material?.id ?? MATERIALS[0].id)

  // Millimeter values for the stored model
  const aWmm = Math.round(toMm(aComprimento))   // segmentA.width
  const aDmm = Math.round(toMm(aProfundidade))  // segmentA.depth
  const bWmm = Math.round(toMm(bProfundidade))  // segmentB.width  (horizontal depth of B column)
  const bDmm = Math.round(toMm(bComprimento))   // segmentB.depth  (vertical extent below A)

  const totalW = aWmm          // full horizontal span = A's length
  const totalH = aDmm + bDmm   // full vertical span = A's depth + B's length

  const handleCreate = () => {
    const cx = (window.innerWidth * 0.6 / 2 - viewport.panX) / viewport.zoom
    const cy = (window.innerHeight / 2 - viewport.panY) / viewport.zoom
    const px = Math.max(0, Math.round((cx - totalW / 2) / 10) * 10)
    const py = Math.max(0, Math.round((cy - totalH / 2) / 10) * 10)

    const material = MATERIALS.find((m) => m.id === materialId) ?? MATERIALS[0]

    const el: CountertopElement = {
      id: generateId('countertop'),
      type: 'countertop',
      position: { x: px, y: py },
      locked: false,
      visible: true,
      geometry: {
        type: 'l-shape',
        segmentA: { width: aWmm, depth: aDmm },
        segmentB: { width: bWmm, depth: bDmm },
      },
      thickness,
      material,
    }

    store.addElement(el)
    store.setOpenDialog(null)
  }

  // ── Proportional SVG diagram ──────────────────────────────────────────────
  const dW = 260, dH = 180
  const pad = 24
  const s = Math.min((dW - pad * 2) / totalW, (dH - pad * 2 - 20) / totalH)
  const ox = pad, oy = pad

  const saW = aWmm * s
  const saH = aDmm * s
  const sbW = bWmm * s  // left column width
  const sbH = bDmm * s  // B extension height

  const pts = [
    [ox,          oy],
    [ox + saW,    oy],
    [ox + saW,    oy + saH],
    [ox + sbW,    oy + saH],
    [ox + sbW,    oy + saH + sbH],
    [ox,          oy + saH + sbH],
  ].map(([x, y]) => `${x},${y}`).join(' ')

  // Dimension label helpers
  const midAx = ox + saW / 2
  const midAy = oy + saH / 2
  const midBx = ox + sbW / 2
  const midBy = oy + saH + sbH / 2

  return (
    <Modal 
      title="Nova Bancada em L" 
      description="Defina as dimensões dos dois segmentos da bancada."
      onClose={() => store.setOpenDialog(null)} 
      width={480}
    >
      {/* Proportional diagram */}
      <div className="lshape-diagram" aria-hidden="true">
        <svg viewBox={`0 0 ${dW} ${dH}`} width={dW} height={dH}>
          <polygon points={pts} fill="#f8fafc" stroke="#64748b" strokeWidth="2" strokeLinejoin="round" />

          {/* Segment A label */}
          {saW > 40 && saH > 12 && (
            <text x={midAx} y={midAy} textAnchor="middle" dominantBaseline="middle"
              fontSize="10" fill="#64748b" fontWeight="600">SEGMENTO A</text>
          )}
          {/* Segment B label */}
          {sbW > 20 && sbH > 12 && (
            <text x={midBx} y={midBy} textAnchor="middle" dominantBaseline="middle"
              fontSize="10" fill="#64748b" fontWeight="600">SEGMENTO B</text>
          )}

          {/* A.depth dimension (left side, full) */}
          <line x1={ox - 8} y1={oy} x2={ox - 8} y2={oy + saH}
            stroke="#2563eb" strokeWidth="1.5" />
          <line x1={ox - 12} y1={oy}   x2={ox - 4} y2={oy}   stroke="#2563eb" strokeWidth="1.5" />
          <line x1={ox - 12} y1={oy + saH} x2={ox - 4} y2={oy + saH} stroke="#2563eb" strokeWidth="1.5" />
          <text x={ox - 16} y={(oy + oy + saH) / 2} textAnchor="end" dominantBaseline="middle"
            fontSize="9" fill="#2563eb" fontWeight="500">
            {aProfundidade.toFixed(unit === 'mm' ? 0 : 0)}{unit}
          </text>

          {/* B.length dimension (left side, below A) */}
          <line x1={ox - 8} y1={oy + saH} x2={ox - 8} y2={oy + saH + sbH}
            stroke="#2563eb" strokeWidth="1.5" />
          <line x1={ox - 12} y1={oy + saH}      x2={ox - 4} y2={oy + saH}      stroke="#2563eb" strokeWidth="1.5" />
          <line x1={ox - 12} y1={oy + saH + sbH} x2={ox - 4} y2={oy + saH + sbH} stroke="#2563eb" strokeWidth="1.5" />
          {sbH > 10 && (
            <text x={ox - 16} y={oy + saH + sbH / 2} textAnchor="end" dominantBaseline="middle"
              fontSize="9" fill="#2563eb" fontWeight="500">
              {bComprimento.toFixed(unit === 'mm' ? 0 : 0)}{unit}
            </text>
          )}

          {/* A.width dimension (top) */}
          <line x1={ox} y1={oy - 8} x2={ox + saW} y2={oy - 8}
            stroke="#2563eb" strokeWidth="1.5" />
          <line x1={ox}       y1={oy - 12} x2={ox}       y2={oy - 4} stroke="#2563eb" strokeWidth="1.5" />
          <line x1={ox + saW} y1={oy - 12} x2={ox + saW} y2={oy - 4} stroke="#2563eb" strokeWidth="1.5" />
          {saW > 30 && (
            <text x={ox + saW / 2} y={oy - 16} textAnchor="middle" dominantBaseline="auto"
              fontSize="9" fill="#2563eb" fontWeight="500">
              {aComprimento.toFixed(unit === 'mm' ? 0 : 0)}{unit}
            </text>
          )}
        </svg>
      </div>

      {/* ── Segment A ─────────────────────────────────────────── */}
      <FormSection title="Segmento A (faixa horizontal)">
        <FormField label="Comprimento" unit={unit} tooltip="A largura total da parte superior (Seg A).">
          <input id="la-comprimento" type="number" min={min} step={step} value={aComprimento}
            onChange={(e) => setAComprimento(Number(e.target.value))} />
        </FormField>
        <FormField label="Profundidade" unit={unit} tooltip="A profundidade (de trás para frente) da parte superior (Seg A).">
          <input id="la-profundidade" type="number" min={min} step={step} value={aProfundidade}
            onChange={(e) => setAProfundidade(Number(e.target.value))} />
        </FormField>
      </FormSection>

      {/* ── Segment B ─────────────────────────────────────────── */}
      <FormSection title="Segmento B (retorno)">
        <FormField
          label="Comprimento"
          unit={unit}
          tooltip="Atenção: Medido a partir da borda inferior de A. Não inclui a profundidade do Seg A!"
        >
          <input id="lb-comprimento" type="number" min={min} step={step} value={bComprimento}
            onChange={(e) => setBComprimento(Number(e.target.value))} />
        </FormField>
        <FormField label="Profundidade" unit={unit} tooltip="A largura da perna do L (Seg B).">
          <input id="lb-profundidade" type="number" min={min} step={step} value={bProfundidade}
            onChange={(e) => setBProfundidade(Number(e.target.value))} />
        </FormField>
      </FormSection>

      <FormSection title="Detalhes">
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

      <Callout type="info" title="Dimensões Totais">
        Esta bancada ocupará um espaço total de <strong>{aComprimento.toFixed(0)} × {(aProfundidade + bComprimento).toFixed(0)} {unit}</strong>.
      </Callout>

      <FormActions>
        <BtnSecondary onClick={() => store.setOpenDialog(null)}>Cancelar</BtnSecondary>
        <BtnPrimary id="create-lshape-btn" onClick={handleCreate}>Criar bancada em L</BtnPrimary>
      </FormActions>
    </Modal>
  )
}
