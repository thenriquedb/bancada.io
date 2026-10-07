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
    <aside className="element-palette" aria-label="Painel de Ferramentas">
      {/* ── BANCADAS ──────────────────────────────────────────────────────── */}
      <section className="palette-section">
        <h2 className="palette-section__title">Bancadas</h2>
        <div className="palette-items">
          <PaletteItem
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="7" width="18" height="10" rx="1.5" />
                <line x1="3" y1="10" x2="21" y2="10" opacity="0.4" />
              </svg>
            }
            label="Reta"
            tooltip="Adicionar bancada reta"
            onClick={() => store.setOpenDialog('new-countertop')}
          />
          <PaletteItem
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16v6h-9v10H4V4z" />
              </svg>
            }
            label="Em L"
            tooltip="Adicionar bancada em L"
            onClick={() => store.setOpenDialog('new-lshape')}
          />
        </div>
      </section>

      {/* ── RECORTES ──────────────────────────────────────────────────────── */}
      <section className="palette-section">
        <h2 className="palette-section__title">Recortes</h2>
        <div className="palette-items">
          <PaletteItem
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2.5" />
                <ellipse cx="12" cy="12" rx="5" ry="4" strokeDasharray="1 1" />
                <circle cx="12" cy="12" r="1.5" />
              </svg>
            }
            label="Cuba"
            tooltip="Adicionar cuba"
            onClick={() => store.setOpenDialog('new-sink')}
          />
          <PaletteItem
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="8" cy="9.5" r="1.75" />
                <circle cx="16" cy="9.5" r="1.75" />
                <circle cx="8" cy="14.5" r="1.75" />
                <circle cx="16" cy="14.5" r="1.75" />
              </svg>
            }
            label="Cooktop"
            tooltip="Adicionar cooktop"
            onClick={() => store.setOpenDialog('new-cooktop')}
          />
          <PaletteItem
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21v-8a4 4 0 0 1 4-4h2v3" />
                <path d="M8 21h8" />
                <circle cx="18" cy="15" r="1" />
              </svg>
            }
            label="Torneira"
            tooltip="Adicionar furo para torneira"
            onClick={() => store.setOpenDialog('new-faucet')}
          />
          <PaletteItem
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="8" />
                <circle cx="12" cy="12" r="3.5" strokeDasharray="2 1.5" />
                <circle cx="12" cy="12" r="1" fill="currentColor" />
              </svg>
            }
            label="Lixeira"
            tooltip="Adicionar lixeira embutida"
            onClick={() => store.setOpenDialog('new-trash')}
          />
          <PaletteItem
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" strokeDasharray="3 2" />
                <line x1="4" y1="4" x2="20" y2="20" strokeDasharray="2 2" opacity="0.4" />
              </svg>
            }
            label="Recorte"
            tooltip="Adicionar recorte genérico"
            onClick={() => store.setOpenDialog('new-cutout')}
          />
        </div>
      </section>

      {/* ── ACABAMENTOS ───────────────────────────────────────────────────── */}
      <section className="palette-section">
        <h2 className="palette-section__title">Acabamentos</h2>
        <div className="palette-items">
          <PaletteItem
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="6" width="18" height="12" rx="2" />
                <rect x="6" y="9" width="12" height="6" rx="1" strokeDasharray="2 1" />
              </svg>
            }
            label="Área Molhada"
            tooltip="Adicionar rebaixo / área molhada"
            onClick={() => store.setOpenDialog('new-wet-area')}
          />
          <PaletteItem
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="6" width="18" height="4" rx="1" />
                <line x1="3" y1="15" x2="21" y2="15" />
                <line x1="3" y1="18" x2="21" y2="18" opacity="0.4" />
              </svg>
            }
            label="Rodabanca"
            tooltip="Adicionar rodabanca"
            onClick={() => store.setOpenDialog('new-backsplash')}
          />
        </div>
      </section>

      {/* ── ANOTAÇÕES ─────────────────────────────────────────────────────── */}
      <section className="palette-section">
        <h2 className="palette-section__title">Anotações</h2>
        <div className="palette-items">
          <PaletteItem
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 7 4 4 20 4 20 7" />
                <line x1="12" y1="4" x2="12" y2="20" />
                <line x1="8" y1="20" x2="16" y2="20" />
              </svg>
            }
            label="Texto"
            tooltip="Ferramenta de texto"
            onClick={() => store.setActiveTool('annotation')}
            active={activeTool === 'annotation'}
          />
          <PaletteItem
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="19" x2="19" y2="5" />
                <polyline points="9 5 19 5 19 15" />
              </svg>
            }
            label="Seta"
            tooltip="Ferramenta de seta"
            onClick={() => store.setActiveTool('arrow')}
            active={activeTool === 'arrow'}
          />
        </div>
      </section>

      {/* ── CÔMODO ────────────────────────────────────────────────────────── */}
      <section className="palette-section palette-section--room">
        <div className="palette-section__header-row">
          <h2 className="palette-section__title" style={{ marginBottom: 0 }}>Cômodo</h2>
          {hasRoom && <span className="palette-badge">Ativo</span>}
        </div>
        <p className="palette-hint">
          Área real do ambiente para escala e enquadramento.
        </p>
        <div className="palette-controls">
          <label className="palette-control palette-control--column">
            <span className="palette-control__label">Largura</span>
            <div className="palette-control__input-wrapper">
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
            <span className="palette-control__label">Comprimento</span>
            <div className="palette-control__input-wrapper">
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
          <label className="palette-checkbox-label" style={{ marginTop: 8 }}>
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
            className="btn btn--primary btn--sm"
            onClick={applyRoomBounds}
            title="Aplicar dimensões do cômodo"
          >
            {hasRoom ? 'Atualizar cômodo' : 'Definir cômodo'}
          </button>
          {hasRoom && (
            <button
              id="clear-room-btn"
              className="btn btn--ghost btn--sm"
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
            className="btn btn--outline btn--sm btn--full"
            style={{ marginTop: 6 }}
            onClick={() => {
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

      {/* ── GRADE ─────────────────────────────────────────────────────────── */}
      <section className="palette-section">
        <h2 className="palette-section__title">Grade</h2>
        <div className="palette-controls">
          <label className="palette-checkbox-label">
            <input
              id="toggle-grid"
              type="checkbox"
              checked={settings.showGrid}
              onChange={(e) => store.updateSettings({ showGrid: e.target.checked })}
            />
            <span>Mostrar grade</span>
          </label>
          <label className="palette-checkbox-label">
            <input
              id="toggle-snap"
              type="checkbox"
              checked={settings.snapToGrid}
              onChange={(e) => store.updateSettings({ snapToGrid: e.target.checked })}
            />
            <span>Snap à grade</span>
          </label>
          <label className="palette-checkbox-label">
            <input
              id="toggle-dims"
              type="checkbox"
              checked={settings.showDimensions}
              onChange={(e) => store.updateSettings({ showDimensions: e.target.checked })}
            />
            <span>Mostrar cotas</span>
          </label>
          <label className="palette-control palette-control--column" style={{ marginTop: 4 }}>
            <span className="palette-control__label">Espaçamento</span>
            <select
              id="grid-spacing"
              value={settings.gridSpacing}
              onChange={(e) => store.updateSettings({ gridSpacing: Number(e.target.value) as GridSpacing })}
            >
              {gridOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* ── UNIDADE ───────────────────────────────────────────────────────── */}
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

      {/* ── PROJETO ───────────────────────────────────────────────────────── */}
      <section className="palette-section palette-section--grow">
        <h2 className="palette-section__title">Projeto</h2>
        <div className="palette-controls">
          <label className="palette-control palette-control--column">
            <span className="palette-control__label">Nome</span>
            <input
              id="project-name"
              type="text"
              value={project.name}
              onChange={(e) => store.updateProjectMeta({ name: e.target.value })}
              placeholder="Nome do projeto"
            />
          </label>
          <label className="palette-control palette-control--column">
            <span className="palette-control__label">Espessura padrão</span>
            <select
              id="project-thickness"
              value={project.thickness}
              onChange={(e) => store.updateProjectMeta({ thickness: Number(e.target.value) as 12 | 15 | 20 | 30 })}
            >
              {[12, 15, 20, 30].map((t) => (
                <option key={t} value={t}>
                  {t} mm
                </option>
              ))}
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
