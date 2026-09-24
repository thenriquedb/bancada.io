import React, { useState } from 'react'
import { useEditorStore, selectElements, selectSelectedIds } from '../store/editorStore.ts'
import type { ProjectElement, CountertopElement } from '../models/types.ts'

// ─── Icons ────────────────────────────────────────────────────────────────────

const icons: Record<string, string> = {
  countertop: '🪨',
  sink:       '🚰',
  cooktop:    '🔥',
  faucet:     '💧',
  trash:      '🗑️',
  'wet-area': '💦',
  backsplash: '🧱',
  annotation: '📝',
  dimension:  '📐',
}

const labels: Record<string, string> = {
  countertop: 'Bancada',
  sink:       'Cuba',
  cooktop:    'Cooktop',
  faucet:     'Torneira',
  trash:      'Lixeira',
  'wet-area': 'Área Molhada',
  backsplash: 'Rodabanca',
  annotation: 'Anotação',
  dimension:  'Cota',
}

// ─── Layer item ───────────────────────────────────────────────────────────────

type LayerItemProps = {
  el:         ProjectElement
  selected:   boolean
  depth:      number
  expanded?:  boolean
  hasChildren?: boolean
  onToggle?:  () => void
  onSelect:   (id: string, multi: boolean) => void
  onVisibility: (id: string) => void
  onLock:     (id: string) => void
  onDelete:   (id: string) => void
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
      ? 'Forma em L'
      : ''

  return (
    <div
      className={[
        'layer-item',
        selected  ? 'layer-item--selected'  : '',
        el.locked ? 'layer-item--locked'    : '',
        !el.visible ? 'layer-item--hidden'  : '',
      ].join(' ')}
      style={{ paddingLeft: 8 + depth * 18 }}
      onClick={(e) => onSelect(el.id, e.shiftKey || e.ctrlKey || e.metaKey)}
      title={el.label ?? labels[el.type] ?? el.type}
    >
      {/* Expand toggle for countertops */}
      {hasChildren ? (
        <button
          className="layer-toggle"
          onClick={(e) => { e.stopPropagation(); onToggle?.() }}
          aria-label={expanded ? 'Recolher' : 'Expandir'}
        >
          {expanded ? '▾' : '▸'}
        </button>
      ) : (
        <span className="layer-toggle layer-toggle--leaf" />
      )}

      {/* Icon */}
      <span className="layer-icon" aria-hidden="true">{icons[el.type] ?? '□'}</span>

      {/* Name */}
      <span className="layer-name">
        {el.label ?? labels[el.type] ?? el.type}
        {subLabel && <span className="layer-sublabel">{subLabel}</span>}
      </span>

      {/* Controls */}
      <span className="layer-actions" onClick={(e) => e.stopPropagation()}>
        <button
          className={`layer-btn ${!el.visible ? 'layer-btn--off' : ''}`}
          title={el.visible ? 'Ocultar' : 'Mostrar'}
          onClick={() => onVisibility(el.id)}
          aria-label={el.visible ? 'Ocultar camada' : 'Mostrar camada'}
        >
          {el.visible ? '👁' : '👁‍🗨'}
        </button>
        <button
          className={`layer-btn ${el.locked ? 'layer-btn--active' : ''}`}
          title={el.locked ? 'Desbloquear' : 'Bloquear'}
          onClick={() => onLock(el.id)}
          aria-label={el.locked ? 'Desbloquear camada' : 'Bloquear camada'}
        >
          {el.locked ? '🔒' : '🔓'}
        </button>
        <button
          className="layer-btn layer-btn--danger"
          title="Remover"
          onClick={() => onDelete(el.id)}
          aria-label="Remover camada"
        >
          ✕
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
    // Start all root valid parents expanded
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
    // Collect all descendants to delete
    const idsToDelete = new Set<string>([id])
    let added = true
    while (added) {
      added = false
      elements.forEach(el => {
        if ('parentId' in el && el.parentId && idsToDelete.has(el.parentId) && !idsToDelete.has(el.id)) {
          idsToDelete.add(el.id)
          added = true
        }
      })
    }
    store.removeElements(Array.from(idsToDelete))
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
    <aside className="layers-panel" aria-label="Camadas">
      <div className="layers-panel__header">
        <span className="layers-panel__title">Camadas</span>
        <span className="layers-panel__count">{elements.length}</span>
      </div>

      <div className="layers-panel__list">
        {elements.length === 0 && (
          <div className="layers-empty">
            <span>Nenhum elemento</span>
            <small>Adicione uma bancada ou área molhada</small>
          </div>
        )}

        {rootElements.map(el => renderTree(el, 0))}
      </div>
    </aside>
  )
}
