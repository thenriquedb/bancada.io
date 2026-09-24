import React from 'react'
import { useEditorStore, selectProject, selectSettings } from '../store/editorStore.ts'

/**
 * Left sidebar – element palette.
 */
export const ElementPalette: React.FC = () => {
  const settings = useEditorStore(selectSettings)
  const project = useEditorStore(selectProject)

  const store = useEditorStore()

  const gridOptions: Array<{ label: string; value: 10 | 50 | 100 | 500 }> = [
    { label: '10 mm', value: 10 },
    { label: '50 mm', value: 50 },
    { label: '100 mm', value: 100 },
    { label: '500 mm', value: 500 },
  ]

  return (
    <aside className="element-palette" aria-label="Painel de elementos">
      {/* Elements section */}
      <section className="palette-section">
        <h2 className="palette-section__title">Elementos</h2>
        <div className="palette-items">
          <PaletteItem icon="▭" label="Bancada Reta" disabled tooltip="Disponível na Fase 3" />
          <PaletteItem icon="⌐" label="Bancada em L" disabled tooltip="Disponível na Fase 3" />
          <PaletteItem icon="⬚" label="Cuba" disabled tooltip="Disponível na Fase 4" />
          <PaletteItem icon="⊞" label="Cooktop" disabled tooltip="Disponível na Fase 4" />
          <PaletteItem icon="○" label="Torneira" disabled tooltip="Disponível na Fase 4" />
          <PaletteItem icon="⊙" label="Lixeira" disabled tooltip="Disponível na Fase 4" />
          <PaletteItem icon="≋" label="Área Molhada" disabled tooltip="Disponível na Fase 6" />
          <PaletteItem icon="‖" label="Rodabanca" disabled tooltip="Disponível na Fase 6" />
        </div>
      </section>

      {/* Grid settings section */}
      <section className="palette-section">
        <h2 className="palette-section__title">Grade</h2>
        <div className="palette-controls">
          <label className="palette-control">
            <input
              id="toggle-grid"
              type="checkbox"
              checked={settings.showGrid}
              onChange={(e) => store.updateSettings({ showGrid: e.target.checked })}
            />
            <span>Mostrar grade</span>
          </label>
          <label className="palette-control">
            <input
              id="toggle-snap"
              type="checkbox"
              checked={settings.snapToGrid}
              onChange={(e) => store.updateSettings({ snapToGrid: e.target.checked })}
            />
            <span>Snap à grade</span>
          </label>
          <label className="palette-control palette-control--column">
            <span>Espaçamento</span>
            <select
              id="grid-spacing"
              value={settings.gridSpacing}
              onChange={(e) =>
                store.updateSettings({ gridSpacing: Number(e.target.value) as 10 | 50 | 100 | 500 })
              }
            >
              {gridOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Unit section */}
      <section className="palette-section">
        <h2 className="palette-section__title">Unidade</h2>
        <div className="palette-units">
          {(['mm', 'cm', 'm'] as const).map((u) => (
            <button
              key={u}
              id={`unit-${u}`}
              className={`unit-btn${settings.unit === u ? ' unit-btn--active' : ''}`}
              onClick={() => store.setUnit(u)}
              aria-pressed={settings.unit === u}
            >
              {u}
            </button>
          ))}
        </div>
      </section>

      {/* Project info */}
      <section className="palette-section palette-section--grow">
        <h2 className="palette-section__title">Projeto</h2>
        <div className="palette-controls">
          <label className="palette-control palette-control--column">
            <span>Nome</span>
            <input
              id="project-name"
              type="text"
              value={project.name}
              onChange={(e) => store.updateProjectMeta({ name: e.target.value })}
              placeholder="Nome do projeto"
            />
          </label>
          <label className="palette-control palette-control--column">
            <span>Espessura</span>
            <select
              id="project-thickness"
              value={project.thickness}
              onChange={(e) =>
                store.updateProjectMeta({ thickness: Number(e.target.value) as 12 | 15 | 20 | 30 })
              }
            >
              {[12, 15, 20, 30].map((t) => (
                <option key={t} value={t}>{t} mm</option>
              ))}
            </select>
          </label>
        </div>
      </section>
    </aside>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

type PaletteItemProps = {
  icon: string
  label: string
  disabled?: boolean
  tooltip?: string
  onClick?: () => void
}

const PaletteItem: React.FC<PaletteItemProps> = ({ icon, label, disabled, tooltip, onClick }) => (
  <button
    className={`palette-item${disabled ? ' palette-item--disabled' : ''}`}
    onClick={onClick}
    disabled={disabled}
    title={tooltip ?? label}
    aria-label={label}
  >
    <span className="palette-item__icon">{icon}</span>
    <span className="palette-item__label">{label}</span>
  </button>
)
