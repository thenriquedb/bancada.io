import React from 'react'
import {
  useEditorStore,
  selectProject,
  selectSelectedIds,
  selectElements,
} from '../store/editorStore.ts'
import { formatMeasurement } from '../utils/units.ts'
import type { ProjectElement } from '../models/types.ts'

/**
 * Right properties panel.
 * Shows project info when nothing is selected, or element properties.
 */
export const PropertiesPanel: React.FC = () => {
  const selectedIds = useEditorStore(selectSelectedIds)
  const elements = useEditorStore(selectElements)

  const selectedElements = elements.filter((el: ProjectElement) => selectedIds.includes(el.id))

  if (selectedIds.length === 0) {
    return <ProjectProperties />
  }

  if (selectedIds.length === 1) {
    return <ElementProperties element={selectedElements[0]} />
  }

  return (
    <aside className="properties-panel" aria-label="Painel de propriedades">
      <div className="properties-header">
        <h3 className="properties-title">Múltiplos elementos</h3>
      </div>
      <div className="properties-body">
        <p className="properties-hint">{selectedIds.length} elementos selecionados</p>
      </div>
    </aside>
  )
}

// ─── Project properties (no selection) ───────────────────────────────────────

const ProjectProperties: React.FC = () => {
  const project = useEditorStore(selectProject)
  const store = useEditorStore()

  return (
    <aside className="properties-panel" aria-label="Propriedades do projeto">
      <div className="properties-header">
        <h3 className="properties-title">Projeto</h3>
      </div>
      <div className="properties-body">
        <PropField label="Nome">
          <input
            id="prop-project-name"
            type="text"
            value={project.name}
            onChange={(e) => store.updateProjectMeta({ name: e.target.value })}
          />
        </PropField>

        <PropField label="Cliente">
          <input
            id="prop-client-name"
            type="text"
            value={project.clientName ?? ''}
            onChange={(e) => store.updateProjectMeta({ clientName: e.target.value })}
            placeholder="(opcional)"
          />
        </PropField>

        <PropField label="Ambiente">
          <input
            id="prop-environment"
            type="text"
            value={project.environment ?? ''}
            onChange={(e) => store.updateProjectMeta({ environment: e.target.value })}
            placeholder="Ex: Cozinha"
          />
        </PropField>

        <PropDivider />

        <PropField label="Espessura">
          <select
            id="prop-thickness"
            value={project.thickness}
            onChange={(e) =>
              store.updateProjectMeta({ thickness: Number(e.target.value) as 12 | 15 | 20 | 30 })
            }
          >
            {[12, 15, 20, 30].map((t) => (
              <option key={t} value={t}>{t} mm</option>
            ))}
          </select>
        </PropField>

        <PropDivider />

        <div className="prop-hint">
          Selecione um elemento para ver suas propriedades.
        </div>
      </div>
    </aside>
  )
}

// ─── Element-specific properties ─────────────────────────────────────────────

const ElementProperties: React.FC<{ element: ProjectElement }> = ({ element }) => {
  const project = useEditorStore(selectProject)
  const store = useEditorStore()
  const unit = project.settings.unit

  const updatePos = (axis: 'x' | 'y', raw: string) => {
    const val = parseFloat(raw)
    if (isNaN(val)) return
    store.pushHistory()
    if (axis === 'x') {
      store.updateElement(element.id, { position: { ...element.position, x: val } })
    } else {
      store.updateElement(element.id, { position: { ...element.position, y: val } })
    }
  }

  const label = (() => {
    switch (element.type) {
      case 'countertop': return 'Bancada'
      case 'sink': return 'Cuba'
      case 'cooktop': return 'Cooktop'
      case 'faucet': return 'Torneira'
      case 'trash': return 'Lixeira'
      case 'wet-area': return 'Área Molhada'
      case 'backsplash': return 'Rodabanca'
      case 'dimension': return 'Cota'
      case 'annotation': return 'Anotação'
      default: return 'Elemento'
    }
  })()

  return (
    <aside className="properties-panel" aria-label={`Propriedades: ${label}`}>
      <div className="properties-header">
        <h3 className="properties-title">{label}</h3>
        <span className="properties-type-tag">{element.type}</span>
      </div>
      <div className="properties-body">
        {/* Position */}
        <PropGroup title="Posição">
          <PropField label="X">
            <input
              id="prop-pos-x"
              type="number"
              step={1}
              value={Number(element.position.x.toFixed(1))}
              onChange={(e) => updatePos('x', e.target.value)}
            />
            <span className="prop-unit">{unit}</span>
          </PropField>
          <PropField label="Y">
            <input
              id="prop-pos-y"
              type="number"
              step={1}
              value={Number(element.position.y.toFixed(1))}
              onChange={(e) => updatePos('y', e.target.value)}
            />
            <span className="prop-unit">{unit}</span>
          </PropField>
        </PropGroup>

        {/* Countertop specific */}
        {element.type === 'countertop' && element.geometry.type === 'reta' && (
          <PropGroup title="Dimensões">
            <PropField label="Comprimento">
              <span className="prop-value">{formatMeasurement(element.geometry.width, unit)}</span>
            </PropField>
            <PropField label="Profundidade">
              <span className="prop-value">{formatMeasurement(element.geometry.depth, unit)}</span>
            </PropField>
            <PropField label="Espessura">
              <span className="prop-value">{element.thickness} mm</span>
            </PropField>
          </PropGroup>
        )}

        {/* Delete */}
        <PropDivider />
        <button
          id="prop-delete-element"
          className="prop-delete-btn"
          onClick={() => store.removeElement(element.id)}
        >
          Remover elemento
        </button>
      </div>
    </aside>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────

const PropGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="prop-group">
    <div className="prop-group__title">{title}</div>
    {children}
  </div>
)

const PropField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="prop-field">
    <label className="prop-field__label">{label}</label>
    <div className="prop-field__control">{children}</div>
  </div>
)

const PropDivider: React.FC = () => <div className="prop-divider" />
