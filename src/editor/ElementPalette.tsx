import React, { useState } from 'react'
import { useEditorStore, selectProject, selectSettings, selectActiveTool } from '../store/editorStore.ts'
import { useDialogUnit } from '../utils/useDialogUnit.ts'
import type { GridSpacing } from '../models/types.ts'

export const ElementPalette: React.FC = () => {
  const settings = useEditorStore(selectSettings)
  const project  = useEditorStore(selectProject)
  const activeTool = useEditorStore(selectActiveTool)
  const store    = useEditorStore()
  const { unit, fromMm, toMm } = useDialogUnit()

  const [roomW, setRoomW] = useState(String(fromMm(settings.roomBounds?.width ?? 3000)))
  const [roomH, setRoomH] = useState(String(fromMm(settings.roomBounds?.height ?? 2500)))

  const gridOptions: Array<{ label: string; value: GridSpacing }> = [
    { label: '10 mm',  value: 10  },
    { label: '50 mm',  value: 50  },
    { label: '100 mm', value: 100 },
    { label: '500 mm', value: 500 },
  ]

  const applyRoomBounds = () => {
    const w = Math.round(toMm(parseFloat(roomW)))
    const h = Math.round(toMm(parseFloat(roomH)))
    if (!w || !h || w < 100 || h < 100) return
    store.updateSettings({
      roomBounds: { width: w, height: h, show: true },
    })
  }

  const clearRoomBounds = () => {
    store.updateSettings({ roomBounds: undefined })
  }

  const hasRoom = !!settings.roomBounds?.show

  return (
    <aside className="element-palette" aria-label="Painel de elementos">

      {/* ── Elements ─────────────────────────────────────────────────────── */}
      <section className="palette-section">
        <h2 className="palette-section__title">Bancada</h2>
        <div className="palette-items">
          <PaletteItem icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="6" width="18" height="12" rx="2"/></svg>} label="Reta" onClick={() => store.setOpenDialog('new-countertop')} />
          <PaletteItem icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 5h14v5h-9v9H5V5z" strokeLinejoin="round"/></svg>} label="Em L"  onClick={() => store.setOpenDialog('new-lshape')} />
        </div>
      </section>

      <section className="palette-section">
        <h2 className="palette-section__title">Recortes</h2>
        <div className="palette-items">
          <PaletteItem icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="12" cy="12" r="2"/></svg>} label="Cuba"     onClick={() => store.setOpenDialog('new-sink')} />
          <PaletteItem icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8" cy="10" r="1.5"/><circle cx="16" cy="10" r="1.5"/><circle cx="8" cy="14" r="1.5"/><circle cx="16" cy="14" r="1.5"/></svg>} label="Cooktop"  onClick={() => store.setOpenDialog('new-cooktop')} />
          <PaletteItem icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22v-7l-2-2v-4a4 4 0 0 1 8 0v4l-2 2v7"/><path d="M9 7h6"/><path d="M12 2v2"/></svg>} label="Torneira" onClick={() => store.setOpenDialog('new-faucet')} />
          <PaletteItem icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>} label="Lixeira"  onClick={() => store.setOpenDialog('new-trash')} />
          <PaletteItem icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="5" width="14" height="14" rx="2"/><path d="M5 5l14 14"/><path d="M19 5L5 19"/></svg>} label="Recorte"  onClick={() => store.setOpenDialog('new-cutout')} />
        </div>
      </section>

      <section className="palette-section">
        <h2 className="palette-section__title">Acabamentos</h2>
        <div className="palette-items">
          <PaletteItem icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="7" width="18" height="10" rx="2"/><path d="M6 12h12"/></svg>} label="Área Molhada" onClick={() => store.setOpenDialog('new-wet-area')} />
          <PaletteItem icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18v3H3z"/><path d="M3 15h18v3H3z"/></svg>} label="Rodabanca"    onClick={() => store.setOpenDialog('new-backsplash')} />
        </div>
      </section>

      <section className="palette-section">
        <h2 className="palette-section__title">Anotações</h2>
        <div className="palette-items">
          <PaletteItem 
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>} 
            label="Texto" 
            onClick={() => store.setActiveTool('annotation')} 
            active={activeTool === 'annotation'}
          />
        </div>
      </section>

      {/* ── Cômodo ──────────────────────────────────────────────────────── */}
      <section className="palette-section palette-section--room">
        <h2 className="palette-section__title">
          <span>Cômodo</span>
          {hasRoom && <span className="palette-badge">Ativo</span>}
        </h2>
        <p className="palette-hint">
          Defina a área real do cômodo para usar como referência de escala.
        </p>
        <div className="palette-controls">
          <label className="palette-control palette-control--column">
            <span>Largura</span>
            <div className="palette-control__row">
              <input
                id="room-width"
                type="number"
                min={unit === 'm' ? 0.5 : unit === 'cm' ? 50 : 500}
                step={unit === 'm' ? 0.1 : unit === 'cm' ? 10 : 100}
                value={roomW}
                onChange={(e) => setRoomW(e.target.value)}
                placeholder={unit === 'm' ? 'ex: 4.2' : unit === 'cm' ? 'ex: 420' : 'ex: 4200'}
              />
              <span className="palette-unit">{unit}</span>
            </div>
          </label>
          <label className="palette-control palette-control--column">
            <span>Comprimento</span>
            <div className="palette-control__row">
              <input
                id="room-height"
                type="number"
                min={unit === 'm' ? 0.5 : unit === 'cm' ? 50 : 500}
                step={unit === 'm' ? 0.1 : unit === 'cm' ? 10 : 100}
                value={roomH}
                onChange={(e) => setRoomH(e.target.value)}
                placeholder={unit === 'm' ? 'ex: 3.6' : unit === 'cm' ? 'ex: 360' : 'ex: 3600'}
              />
              <span className="palette-unit">{unit}</span>
            </div>
          </label>
        </div>

        {hasRoom && (
          <label className="palette-control">
            <input
              id="toggle-room"
              type="checkbox"
              checked={settings.roomBounds?.show ?? false}
              onChange={(e) =>
                store.updateSettings({
                  roomBounds: settings.roomBounds
                    ? { ...settings.roomBounds, show: e.target.checked }
                    : undefined,
                })
              }
            />
            <span>Mostrar limite do cômodo</span>
          </label>
        )}

        <div className="palette-actions">
          <button
            id="apply-room-btn"
            className="btn btn--room"
            onClick={applyRoomBounds}
            title="Aplicar dimensões do cômodo"
          >
            {hasRoom ? 'Atualizar cômodo' : 'Definir cômodo'}
          </button>
          {hasRoom && (
            <button
              id="clear-room-btn"
              className="btn btn--ghost"
              onClick={clearRoomBounds}
              title="Remover limite do cômodo"
            >
              Remover
            </button>
          )}
        </div>

        {hasRoom && settings.roomBounds && (
          <button
            id="fit-room-btn"
            className="btn btn--ghost btn--full"
            onClick={() => {
              /* fit viewport to room */
              const rb = settings.roomBounds!
              const canvasW = document.querySelector('.canvas-container')?.clientWidth ?? 800
              const canvasH = document.querySelector('.canvas-container')?.clientHeight ?? 600
              const margin = 60
              const zoom = Math.min(
                (canvasW - margin * 2) / rb.width,
                (canvasH - margin * 2) / rb.height
              )
              store.setViewport({ zoom, panX: margin, panY: margin })
            }}
          >
            Enquadrar cômodo
          </button>
        )}
      </section>

      {/* ── Grade ────────────────────────────────────────────────────────── */}
      <section className="palette-section">
        <h2 className="palette-section__title">Grade</h2>
        <div className="palette-controls">
          <label className="palette-control">
            <input id="toggle-grid" type="checkbox" checked={settings.showGrid}
              onChange={(e) => store.updateSettings({ showGrid: e.target.checked })} />
            <span>Mostrar grade</span>
          </label>
          <label className="palette-control">
            <input id="toggle-snap" type="checkbox" checked={settings.snapToGrid}
              onChange={(e) => store.updateSettings({ snapToGrid: e.target.checked })} />
            <span>Snap à grade</span>
          </label>
          <label className="palette-control">
            <input id="toggle-dims" type="checkbox" checked={settings.showDimensions}
              onChange={(e) => store.updateSettings({ showDimensions: e.target.checked })} />
            <span>Mostrar cotas</span>
          </label>
          <label className="palette-control palette-control--column">
            <span>Espaçamento</span>
            <select id="grid-spacing" value={settings.gridSpacing}
              onChange={(e) => store.updateSettings({ gridSpacing: Number(e.target.value) as GridSpacing })}>
              {gridOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      {/* ── Unidade ──────────────────────────────────────────────────────── */}
      <section className="palette-section">
        <h2 className="palette-section__title">Unidade</h2>
        <div className="palette-units">
          {(['mm', 'cm', 'm'] as const).map((u) => (
            <button key={u} id={`unit-${u}`}
              className={`unit-btn${settings.unit === u ? ' unit-btn--active' : ''}`}
              onClick={() => store.setUnit(u)} aria-pressed={settings.unit === u}>
              {u}
            </button>
          ))}
        </div>
      </section>

      {/* ── Projeto ──────────────────────────────────────────────────────── */}
      <section className="palette-section palette-section--grow">
        <h2 className="palette-section__title">Projeto</h2>
        <div className="palette-controls">
          <label className="palette-control palette-control--column">
            <span>Nome</span>
            <input id="project-name" type="text" value={project.name}
              onChange={(e) => store.updateProjectMeta({ name: e.target.value })}
              placeholder="Nome do projeto" />
          </label>
          <label className="palette-control palette-control--column">
            <span>Espessura padrão</span>
            <select id="project-thickness" value={project.thickness}
              onChange={(e) => store.updateProjectMeta({ thickness: Number(e.target.value) as 12 | 15 | 20 | 30 })}>
              {[12, 15, 20, 30].map((t) => <option key={t} value={t}>{t} mm</option>)}
            </select>
          </label>
        </div>
      </section>
    </aside>
  )
}

type PaletteItemProps = {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  disabled?: boolean
  tooltip?: string
  active?: boolean
}

const PaletteItem: React.FC<PaletteItemProps> = ({ icon, label, onClick, disabled, tooltip, active }) => (
  <button
    className={`palette-item${disabled ? ' palette-item--disabled' : ''}${active ? ' palette-item--active' : ''}`}
    onClick={onClick}
    disabled={disabled}
    title={tooltip ?? label}
    aria-label={label}
  >
    <span className="palette-item__icon">{icon}</span>
    <span className="palette-item__label">{label}</span>
  </button>
)
