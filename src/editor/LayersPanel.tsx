import React, { useState } from 'react'
import { useEditorStore, selectElements, selectSelectedIds } from '../store/editorStore.ts'
import type { ProjectElement, CountertopElement } from '../models/types.ts'

// ─── SVG Icons for Layer Elements ─────────────────────────────────────────────

const ElementIcon: React.FC<{ type: string }> = ({ type }) => {
  const iconProps = {
    width: 15,
    height: 15,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (type) {
    case 'countertop':
      return (
        <svg {...iconProps}>
          <rect x="3" y="7" width="18" height="10" rx="1.5" />
          <line x1="3" y1="10" x2="21" y2="10" opacity="0.4" />
        </svg>
      )
    case 'sink':
      return (
        <svg {...iconProps}>
          <rect x="4" y="4" width="16" height="16" rx="2.5" />
          <ellipse cx="12" cy="12" rx="5" ry="4" strokeDasharray="1 1" />
          <circle cx="12" cy="12" r="1.5" />
        </svg>
      )
    case 'cooktop':
      return (
        <svg {...iconProps}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="8" cy="9.5" r="1.5" />
          <circle cx="16" cy="9.5" r="1.5" />
          <circle cx="8" cy="14.5" r="1.5" />
          <circle cx="16" cy="14.5" r="1.5" />
        </svg>
      )
    case 'faucet':
      return (
        <svg {...iconProps}>
          <path d="M12 21v-8a4 4 0 0 1 4-4h2v3" />
          <path d="M8 21h8" />
          <circle cx="18" cy="15" r="1" />
        </svg>
      )
    case 'trash':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3" strokeDasharray="2 1" />
        </svg>
      )
    case 'wet-area':
      return (
        <svg {...iconProps}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <rect x="6" y="9" width="12" height="6" rx="1" strokeDasharray="2 1" />
        </svg>
      )
    case 'backsplash':
      return (
        <svg {...iconProps}>
          <rect x="3" y="6" width="18" height="4" rx="1" />
          <line x1="3" y1="15" x2="21" y2="15" />
        </svg>
      )
    case 'cutout':
      return (
        <svg {...iconProps}>
          <rect x="4" y="4" width="16" height="16" rx="2" strokeDasharray="3 2" />
        </svg>
      )
    case 'annotation':
      return (
        <svg {...iconProps}>
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      )
    case 'arrow':
      return (
        <svg {...iconProps}>
          <line x1="5" y1="19" x2="19" y2="5" />
          <polyline points="9 5 19 5 19 15" />
        </svg>
      )
    case 'dimension':
      return (
        <svg {...iconProps}>
          <line x1="4" y1="12" x2="20" y2="12" />
          <polyline points="7 9 4 12 7 15" />
          <polyline points="17 9 20 12 17 15" />
        </svg>
      )
    default:
      return (
        <svg {...iconProps}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      )
  }
}

const labels: Record<string, string> = {
  countertop: 'Bancada',
  sink:       'Cuba',
  cooktop:    'Cooktop',
  faucet:     'Torneira',
  trash:      'Lixeira',
  'wet-area': 'Área Molhada',
  backsplash: 'Rodabanca',
  cutout:     'Recorte',
  annotation: 'Anotação',
  arrow:      'Seta',
  dimension:  'Cota',
}

// ─── Layer item ───────────────────────────────────────────────────────────────

type LayerItemProps = {
  el:           ProjectElement
  selected:     boolean
  depth:        number
  expanded?:    boolean
  hasChildren?: boolean
  onToggle?:    () => void
  onSelect:     (id: string, multi: boolean) => void
  onVisibility: (id: string) => void
  onLock:       (id: string) => void
  onDelete:     (id: string) => void
}

const LayerItem: React.FC<LayerItemProps> = ({
  el, selected, depth, expanded, hasChildren, onToggle,
  onSelect, onVisibility, onLock, onDelete,
}) => {
  const isCountertop = el.type === 'countertop'
  const geo = isCountertop ? (el as CountertopElement).geometry : null
  const subLabel = geo?.type === 'reta'
    ? `${Math.round((geo.width / 10))}×${Math.round((geo.depth / 10))} cm`
    : geo?.type === 'l-shape'
      ? 'Em L'
      : ''

  return (
    <div
      className={[
        'layer-item',
        selected    ? 'layer-item--selected' : '',
        el.locked   ? 'layer-item--locked'   : '',
        !el.visible ? 'layer-item--hidden'   : '',
      ].filter(Boolean).join(' ')}
      style={{ paddingLeft: 8 + depth * 18 }}
      onClick={(e) => onSelect(el.id, e.shiftKey || e.ctrlKey || e.metaKey)}
      title={el.label ?? labels[el.type] ?? el.type}
    >
      {/* Expand/Collapse Chevron for parents */}
      {hasChildren ? (
        <button
          className="layer-toggle"
          onClick={(e) => { e.stopPropagation(); onToggle?.() }}
          aria-label={expanded ? 'Recolher grupo' : 'Expandir grupo'}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease',
            }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      ) : (
        <span className="layer-toggle layer-toggle--leaf" />
      )}

      {/* Domain Vector Icon */}
      <span className="layer-icon" aria-hidden="true">
        <ElementIcon type={el.type} />
      </span>

      {/* Name and Sublabel */}
      <span className="layer-name">
        <span className="layer-name__text">{el.label ?? labels[el.type] ?? el.type}</span>
        {subLabel && <span className="layer-sublabel">{subLabel}</span>}
      </span>

      {/* Actions: Visibility, Lock, Delete */}
      <span className="layer-actions" onClick={(e) => e.stopPropagation()}>
        <button
          className={`layer-btn ${!el.visible ? 'layer-btn--off' : ''}`}
          title={el.visible ? 'Ocultar camada' : 'Mostrar camada'}
          onClick={() => onVisibility(el.id)}
          aria-label={el.visible ? 'Ocultar camada' : 'Mostrar camada'}
        >
          {el.visible ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          )}
        </button>

        <button
          className={`layer-btn ${el.locked ? 'layer-btn--active' : ''}`}
          title={el.locked ? 'Desbloquear camada' : 'Bloquear camada'}
          onClick={() => onLock(el.id)}
          aria-label={el.locked ? 'Desbloquear camada' : 'Bloquear camada'}
        >
          {el.locked ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 9.9-1" />
            </svg>
          )}
        </button>

        <button
          className="layer-btn layer-btn--danger"
          title="Remover elemento"
          onClick={() => onDelete(el.id)}
          aria-label="Remover camada"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </span>
    </div>
  )
}

// ─── Layers Panel ─────────────────────────────────────────────────────────────

export const LayersPanel: React.FC = () => {
  const elements    = useEditorStore(selectElements)
  const selectedIds = useEditorStore(selectSelectedIds)
  const store       = useEditorStore()

  // Track which groups are expanded
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    elements.forEach((el) => {
      if (el.type === 'countertop' || el.type === 'wet-area') init[el.id] = true
    })
    return init
  })

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleSelect = (id: string, multi: boolean) => {
    if (multi) {
      store.setSelectedIds(
        selectedIds.includes(id)
          ? selectedIds.filter((s) => s !== id)
          : [...selectedIds, id]
      )
    } else {
      store.setSelectedIds([id])
    }
  }

  const handleVisibility = (id: string) => {
    const el = elements.find((e) => e.id === id)
    if (el) store.updateElement(id, { visible: !el.visible })
  }

  const handleLock = (id: string) => {
    const el = elements.find((e) => e.id === id)
    if (el) store.updateElement(id, { locked: !el.locked })
  }

  const handleDelete = (id: string) => {
    store.removeElement(id)
  }

  // ── Render Tree ───────────────────────────────────────────────────────────
  const getChildren = (parentId: string) =>
    elements.filter((el) => 'parentId' in el && (el as { parentId?: string }).parentId === parentId)

  const renderTree = (el: ProjectElement, depth: number) => {
    const children = getChildren(el.id)
    const isOpen = expanded[el.id] !== false

    return (
      <React.Fragment key={el.id}>
        <LayerItem
          el={el}
          selected={selectedIds.includes(el.id)}
          depth={depth}
          hasChildren={children.length > 0}
          expanded={isOpen}
          onToggle={() => toggleExpanded(el.id)}
          onSelect={handleSelect}
          onVisibility={handleVisibility}
          onLock={handleLock}
          onDelete={handleDelete}
        />
        {isOpen && children.map(child => renderTree(child, depth + 1))}
      </React.Fragment>
    )
  }

  // Find root elements (no parentId)
  const rootElements = elements.filter(el => !('parentId' in el) || !(el as { parentId?: string }).parentId)

  return (
    <aside className="layers-panel" aria-label="Painel de Camadas">
      <div className="layers-panel__header">
        <span className="layers-panel__title">Estrutura do Projeto</span>
        <span className="layers-panel__count">
          {elements.length} {elements.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      <div className="layers-panel__list">
        {elements.length === 0 ? (
          <div className="layers-empty">
            <div className="layers-empty__icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <span className="layers-empty__title">Nenhum elemento no projeto</span>
            <small className="layers-empty__desc">Adicione uma bancada ou elemento no painel à esquerda.</small>
          </div>
        ) : (
          rootElements.map(el => renderTree(el, 0))
        )}
      </div>
    </aside>
  )
}
