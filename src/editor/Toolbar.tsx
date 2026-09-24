import React, { useCallback } from 'react'
import {
  useEditorStore,
  selectActiveTool,
  selectCanUndo,
  selectCanRedo,
  selectViewport,
  selectIsDirty,
  selectProject,
} from '../store/editorStore.ts'
import type { EditorTool } from '../store/editorStore.ts'

type ToolbarProps = {
  onNewProject: () => void
  onExportJSON: () => void
  onImportJSON: () => void
  onExportPDF: () => void
  canvasWidth: number
  canvasHeight: number
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onNewProject,
  onExportJSON,
  onImportJSON,
  onExportPDF,
  canvasWidth,
  canvasHeight,
}) => {
  const activeTool = useEditorStore(selectActiveTool)
  const canUndo = useEditorStore(selectCanUndo)
  const canRedo = useEditorStore(selectCanRedo)
  const viewport = useEditorStore(selectViewport)
  const isDirty = useEditorStore(selectIsDirty)
  const project = useEditorStore(selectProject)

  const store = useEditorStore()

  const setTool = useCallback(
    (tool: EditorTool) => store.setActiveTool(tool),
    [store]
  )

  const zoomPercent = Math.round(viewport.zoom * 100)

  return (
    <div className="toolbar" role="toolbar" aria-label="Barra de ferramentas">
      {/* Brand */}
      <div className="toolbar__brand">
        <span className="toolbar__logo">◈</span>
        <span className="toolbar__title">Countertop Designer</span>
        {isDirty && <span className="toolbar__dirty" title="Alterações não salvas">•</span>}
      </div>

      {/* Menu groups */}
      <div className="toolbar__menus">
        <ToolbarMenu label="Arquivo">
          <ToolbarMenuItem onClick={onNewProject}>Novo projeto</ToolbarMenuItem>
          <ToolbarMenuItem onClick={onImportJSON}>Abrir projeto…</ToolbarMenuItem>
          <ToolbarMenuDivider />
          <ToolbarMenuItem onClick={() => store.saveToLocalStorage()}>Salvar  (Ctrl+S)</ToolbarMenuItem>
          <ToolbarMenuItem onClick={onExportJSON}>Exportar JSON</ToolbarMenuItem>
          <ToolbarMenuDivider />
          <ToolbarMenuItem onClick={onExportPDF}>Exportar PDF  (Ctrl+E)</ToolbarMenuItem>
        </ToolbarMenu>

        <ToolbarMenu label="Editar">
          <ToolbarMenuItem onClick={store.undo} disabled={!canUndo}>Desfazer  (Ctrl+Z)</ToolbarMenuItem>
          <ToolbarMenuItem onClick={store.redo} disabled={!canRedo}>Refazer  (Ctrl+Shift+Z)</ToolbarMenuItem>
          <ToolbarMenuDivider />
          <ToolbarMenuItem onClick={store.selectAll}>Selecionar tudo  (Ctrl+A)</ToolbarMenuItem>
          <ToolbarMenuItem onClick={store.clearSelection}>Limpar seleção  (Esc)</ToolbarMenuItem>
        </ToolbarMenu>

        <ToolbarMenu label="Visualizar">
          <ToolbarMenuItem onClick={() => store.fitToScreen(canvasWidth, canvasHeight)}>
            Ajustar à tela
          </ToolbarMenuItem>
          <ToolbarMenuItem onClick={() => store.setZoom(1)}>100%</ToolbarMenuItem>
          <ToolbarMenuDivider />
          <ToolbarMenuItem onClick={() => store.updateSettings({ showGrid: !project.settings.showGrid })}>
            {project.settings.showGrid ? '✓ ' : ''}Mostrar grid
          </ToolbarMenuItem>
          <ToolbarMenuItem onClick={() => store.updateSettings({ snapToGrid: !project.settings.snapToGrid })}>
            {project.settings.snapToGrid ? '✓ ' : ''}Snap ao grid
          </ToolbarMenuItem>
        </ToolbarMenu>
      </div>

      {/* Tool buttons */}
      <div className="toolbar__tools">
        <ToolButton
          id="tool-select"
          title="Selecionar (V)"
          active={activeTool === 'select'}
          onClick={() => setTool('select')}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 1l10 7-5.5 1.5L6 14 3 1z"/>
          </svg>
        </ToolButton>
        <ToolButton
          id="tool-pan"
          title="Mover canvas (H)"
          active={activeTool === 'pan'}
          onClick={() => setTool('pan')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>
          </svg>
        </ToolButton>
      </div>

      {/* Zoom controls */}
      <div className="toolbar__zoom">
        <button
          className="toolbar-btn"
          onClick={() => store.setZoom(viewport.zoom * 0.8)}
          title="Diminuir zoom (Ctrl+-)"
        >
          −
        </button>
        <span className="toolbar__zoom-label">{zoomPercent}%</span>
        <button
          className="toolbar-btn"
          onClick={() => store.setZoom(viewport.zoom * 1.25)}
          title="Aumentar zoom (Ctrl++)"
        >
          +
        </button>
        <button
          className="toolbar-btn toolbar-btn--sm"
          onClick={() => store.fitToScreen(canvasWidth, canvasHeight)}
          title="Ajustar à tela"
        >
          ⊞
        </button>
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

type ToolButtonProps = {
  id: string
  title: string
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

const ToolButton: React.FC<ToolButtonProps> = ({ id, title, active, onClick, children }) => (
  <button
    id={id}
    className={`tool-btn${active ? ' tool-btn--active' : ''}`}
    title={title}
    onClick={onClick}
    aria-pressed={active}
  >
    {children}
  </button>
)

type ToolbarMenuProps = {
  label: string
  children: React.ReactNode
}

const ToolbarMenu: React.FC<ToolbarMenuProps> = ({ label, children }) => {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={ref} className="toolbar-menu">
      <button
        className={`toolbar-menu__trigger${open ? ' toolbar-menu__trigger--open' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>
      {open && (
        <div className="toolbar-menu__dropdown" role="menu">
          {React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement<{ onClick?: () => void }>, {
                  onClick: () => {
                    setOpen(false)
                    ;(child as React.ReactElement<{ onClick?: () => void }>).props.onClick?.()
                  },
                })
              : child
          )}
        </div>
      )}
    </div>
  )
}

type ToolbarMenuItemProps = {
  onClick?: () => void
  disabled?: boolean
  children: React.ReactNode
}

const ToolbarMenuItem: React.FC<ToolbarMenuItemProps> = ({ onClick, disabled, children }) => (
  <button
    className="toolbar-menu__item"
    onClick={onClick}
    disabled={disabled}
    role="menuitem"
  >
    {children}
  </button>
)

const ToolbarMenuDivider: React.FC = () => <div className="toolbar-menu__divider" role="separator" />
