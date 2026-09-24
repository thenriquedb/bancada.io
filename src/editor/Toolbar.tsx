import React from 'react'
import {
  useEditorStore,
  selectActiveTool,
  selectCanUndo,
  selectCanRedo,
  selectViewport,
  selectIsDirty,
  selectProject,
  selectSettings,
} from '../store/editorStore.ts'
import type { EditorTool } from '../store/editorStore.ts'

type ToolbarProps = {
  onNewProject: () => void
  onExportJSON: () => void
  onImportJSON: () => void
  onExportPDF:  () => void
  canvasWidth:  number
  canvasHeight: number
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onNewProject, onExportJSON, onImportJSON, onExportPDF, canvasWidth, canvasHeight,
}) => {
  const activeTool = useEditorStore(selectActiveTool)
  const canUndo    = useEditorStore(selectCanUndo)
  const canRedo    = useEditorStore(selectCanRedo)
  const viewport   = useEditorStore(selectViewport)
  const isDirty    = useEditorStore(selectIsDirty)
  const project    = useEditorStore(selectProject)
  const settings   = useEditorStore(selectSettings)
  const store      = useEditorStore()

  const setTool = (tool: EditorTool) => store.setActiveTool(tool)
  const zoomPct = Math.round(viewport.zoom * 100)

  return (
    <div className="toolbar" role="toolbar" aria-label="Barra de ferramentas">
      {/* Brand */}
      <div className="toolbar__brand">
        <span className="toolbar__logo">◈</span>
        <span className="toolbar__title">Countertop Designer BR</span>
        {isDirty && <span className="toolbar__dirty" title="Alterações não salvas">•</span>}
      </div>

      {/* Menus */}
      <div className="toolbar__menus">
        <ToolbarMenu label="Arquivo">
          <ToolbarMenuItem onClick={onNewProject}>Novo projeto</ToolbarMenuItem>
          <ToolbarMenuItem onClick={onImportJSON}>Abrir projeto…</ToolbarMenuItem>
          <ToolbarMenuDivider />
          <ToolbarMenuItem onClick={() => store.saveToLocalStorage()}>Salvar  (Ctrl+S)</ToolbarMenuItem>
          <ToolbarMenuItem onClick={onExportJSON}>Exportar JSON</ToolbarMenuItem>
          <ToolbarMenuDivider />
          <ToolbarMenuItem onClick={onExportPDF}>⬇ Exportar PDF  (Ctrl+E)</ToolbarMenuItem>
        </ToolbarMenu>

        <ToolbarMenu label="Editar">
          <ToolbarMenuItem onClick={store.undo} disabled={!canUndo}>Desfazer  (Ctrl+Z)</ToolbarMenuItem>
          <ToolbarMenuItem onClick={store.redo} disabled={!canRedo}>Refazer  (Ctrl+Shift+Z)</ToolbarMenuItem>
          <ToolbarMenuDivider />
          <ToolbarMenuItem onClick={store.selectAll}>Selecionar tudo  (Ctrl+A)</ToolbarMenuItem>
          <ToolbarMenuItem onClick={store.clearSelection}>Limpar seleção  (Esc)</ToolbarMenuItem>
          <ToolbarMenuDivider />
          <ToolbarMenuItem
            onClick={() => store.selectedIds.length > 0 && store.duplicateElements(store.selectedIds)}
            disabled={store.selectedIds.length === 0}>
            Duplicar  (Ctrl+D)
          </ToolbarMenuItem>
          <ToolbarMenuItem
            onClick={() => store.selectedIds.length > 0 && store.removeElements(store.selectedIds)}
            disabled={store.selectedIds.length === 0}>
            Excluir  (Delete)
          </ToolbarMenuItem>
        </ToolbarMenu>

        <ToolbarMenu label="Visualizar">
          <ToolbarMenuItem onClick={() => store.fitToScreen(canvasWidth, canvasHeight)}>
            Ajustar à tela
          </ToolbarMenuItem>
          <ToolbarMenuItem onClick={() => store.setZoom(1)}>100%</ToolbarMenuItem>
          <ToolbarMenuDivider />
          <ToolbarMenuItem onClick={() => store.updateSettings({ showGrid: !settings.showGrid })}>
            {settings.showGrid ? '✓ ' : ''}Mostrar grade
          </ToolbarMenuItem>
          <ToolbarMenuItem onClick={() => store.updateSettings({ snapToGrid: !settings.snapToGrid })}>
            {settings.snapToGrid ? '✓ ' : ''}Snap ao grid
          </ToolbarMenuItem>
          <ToolbarMenuItem onClick={() => store.updateSettings({ showDimensions: !settings.showDimensions })}>
            {settings.showDimensions ? '✓ ' : ''}Mostrar cotas
          </ToolbarMenuItem>
          <ToolbarMenuDivider />
          <ToolbarMenuItem
            onClick={() => {
              if (settings.roomBounds) {
                store.updateSettings({ roomBounds: { ...settings.roomBounds, show: !settings.roomBounds.show } })
              }
            }}
            disabled={!settings.roomBounds}>
            {settings.roomBounds?.show ? '✓ ' : ''}Mostrar cômodo
          </ToolbarMenuItem>
        </ToolbarMenu>

        <ToolbarMenu label="Adicionar">
          <ToolbarMenuItem onClick={() => store.setOpenDialog('new-countertop')}>▭ Bancada reta</ToolbarMenuItem>
          <ToolbarMenuItem onClick={() => store.setOpenDialog('new-lshape')}>⌐ Bancada em L</ToolbarMenuItem>
          <ToolbarMenuDivider />
          <ToolbarMenuItem onClick={() => store.setOpenDialog('new-sink')}>⬚ Cuba</ToolbarMenuItem>
          <ToolbarMenuItem onClick={() => store.setOpenDialog('new-cooktop')}>⊞ Cooktop</ToolbarMenuItem>
          <ToolbarMenuItem onClick={() => store.setOpenDialog('new-faucet')}>○ Torneira</ToolbarMenuItem>
          <ToolbarMenuItem onClick={() => store.setOpenDialog('new-trash')}>⊙ Lixeira</ToolbarMenuItem>
          <ToolbarMenuDivider />
          <ToolbarMenuItem onClick={() => store.setOpenDialog('new-wet-area')}>≋ Área Molhada</ToolbarMenuItem>
          <ToolbarMenuItem onClick={() => store.setOpenDialog('new-backsplash')}>‖ Rodabanca</ToolbarMenuItem>
        </ToolbarMenu>
      </div>

      {/* Tool buttons */}
      <div className="toolbar__tools">
        <ToolBtn id="tool-select" title="Selecionar (V)" active={activeTool === 'select'} onClick={() => setTool('select')}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 1l10 7-5.5 1.5L6 14 3 1z"/>
          </svg>
        </ToolBtn>
        <ToolBtn id="tool-pan" title="Mover canvas (H)" active={activeTool === 'pan'} onClick={() => setTool('pan')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>
          </svg>
        </ToolBtn>
      </div>

      {/* Zoom */}
      <div className="toolbar__zoom">
        <button className="toolbar-btn" onClick={() => store.setZoom(viewport.zoom * 0.8)} title="Zoom out (Ctrl+-)">−</button>
        <span className="toolbar__zoom-label">{zoomPct}%</span>
        <button className="toolbar-btn" onClick={() => store.setZoom(viewport.zoom * 1.25)} title="Zoom in (Ctrl++)">+</button>
        <button className="toolbar-btn toolbar-btn--sm" onClick={() => store.fitToScreen(canvasWidth, canvasHeight)} title="Ajustar à tela">⊞</button>
      </div>

      {/* Project name badge */}
      <div className="toolbar__project-name" title={project.name}>{project.name}</div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const ToolBtn: React.FC<{ id: string; title: string; active: boolean; onClick: () => void; children: React.ReactNode }> = (
  { id, title, active, onClick, children }
) => (
  <button id={id} className={`tool-btn${active ? ' tool-btn--active' : ''}`}
    title={title} onClick={onClick} aria-pressed={active}>
    {children}
  </button>
)

const ToolbarMenu: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  return (
    <div ref={ref} className="toolbar-menu">
      <button className={`toolbar-menu__trigger${open ? ' toolbar-menu__trigger--open' : ''}`}
        onClick={() => setOpen((v) => !v)}>
        {label}
      </button>
      {open && (
        <div className="toolbar-menu__dropdown" role="menu">
          {React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement<{ onClick?: () => void }>, {
                  onClick: () => { setOpen(false); (child as React.ReactElement<{ onClick?: () => void }>).props.onClick?.() },
                })
              : child
          )}
        </div>
      )}
    </div>
  )
}

const ToolbarMenuItem: React.FC<{ onClick?: () => void; disabled?: boolean; children: React.ReactNode }> = (
  { onClick, disabled, children }
) => (
  <button className="toolbar-menu__item" onClick={onClick} disabled={disabled} role="menuitem">
    {children}
  </button>
)

const ToolbarMenuDivider: React.FC = () => <div className="toolbar-menu__divider" role="separator" />
