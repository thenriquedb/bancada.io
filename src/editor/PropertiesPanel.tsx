import React, { useState } from 'react'
import {
  useEditorStore,
  selectProject,
  selectSelectedIds,
  selectElements,
} from '../store/editorStore.ts'
import type { EditorStore } from '../store/editorStore.ts'
import { fromMm, toMm } from '../utils/units.ts'
import { MATERIALS } from '../models/materials.ts'
import type {
  ProjectElement,
  CountertopElement,
  SinkElement,
  CooktopElement,
  FaucetElement,
  TrashElement,
  WetAreaElement,
  BacksplashElement,
  CutoutElement,
  AnnotationElement,
  ArrowElement,
  CalloutPosition,
  DimSide,
} from '../models/types.ts'
import { getElementBounds, isInsideBounds } from './geometry/bounds.ts'
import { getValidParents } from '../utils/elementHelpers.ts'

export const PropertiesPanel: React.FC = () => {
  const selectedIds = useEditorStore(selectSelectedIds)
  const elements    = useEditorStore(selectElements)
  const selected    = elements.filter((el: ProjectElement) => selectedIds.includes(el.id))

  if (selectedIds.length === 0) return <ProjectProperties />
  if (selectedIds.length === 1) return <ElementProperties element={selected[0]} />

  return (
    <aside className="properties-panel" aria-label="Propriedades dos elementos selecionados">
      <div className="properties-header">
        <div className="properties-header__title-group">
          <h3 className="properties-title">Seleção Múltipla</h3>
          <span className="properties-subtitle">{selectedIds.length} elementos selecionados</span>
        </div>
      </div>
      <div className="properties-body">
        <div className="properties-multi-summary">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
          <span>Edição de grupo ou remoção em massa.</span>
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <DeleteBtn ids={selectedIds} />
        </div>
      </div>
    </aside>
  )
}

// ─── Project properties (No selection state) ───────────────────────────────────

const ProjectProperties: React.FC = () => {
  const project = useEditorStore(selectProject)
  const store   = useEditorStore()
  const room    = project.settings.roomBounds

  return (
    <aside className="properties-panel" aria-label="Propriedades do Projeto">
      <div className="properties-header">
        <div className="properties-header__title-group">
          <h3 className="properties-title">Projeto</h3>
          <span className="properties-subtitle">Configurações globais</span>
        </div>
      </div>

      <div className="properties-body">
        <div className="properties-empty-hint">
          <div className="properties-empty-hint__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div className="properties-empty-hint__text">
            <strong>Nenhum elemento selecionado</strong>
            <span>Clique em um item no projeto para editar suas propriedades.</span>
          </div>
        </div>

        <PropGroup title="Identificação" defaultOpen={true}>
          <PropField label="Nome do Projeto">
            <input
              id="pp-name"
              type="text"
              value={project.name}
              onChange={(e) => store.updateProjectMeta({ name: e.target.value })}
              placeholder="Nome do projeto"
            />
          </PropField>
          <PropField label="Cliente">
            <input
              id="pp-client"
              type="text"
              value={project.clientName ?? ''}
              onChange={(e) => store.updateProjectMeta({ clientName: e.target.value })}
              placeholder="(opcional)"
            />
          </PropField>
          <PropField label="Ambiente">
            <input
              id="pp-env"
              type="text"
              value={project.environment ?? ''}
              onChange={(e) => store.updateProjectMeta({ environment: e.target.value })}
              placeholder="ex: Cozinha"
            />
          </PropField>
        </PropGroup>

        <PropGroup title="Padrões do Material" defaultOpen={true}>
          <PropField label="Material">
            <select
              id="pp-material"
              value={project.material?.id ?? ''}
              onChange={(e) => {
                const m = MATERIALS.find((mat) => mat.id === e.target.value)
                if (m) store.updateProjectMeta({ material: m })
              }}
            >
              {MATERIALS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </PropField>
          <PropField label="Espessura">
            <div className="prop-control-with-unit">
              <select
                id="pp-thickness"
                value={project.thickness}
                onChange={(e) => store.updateProjectMeta({ thickness: Number(e.target.value) as 12 | 15 | 20 | 30 })}
              >
                {[12, 15, 20, 30].map((t) => (
                  <option key={t} value={t}>
                    {t} mm
                  </option>
                ))}
              </select>
            </div>
          </PropField>
        </PropGroup>

        {room && (
          <PropGroup title="Dimensões do Cômodo" defaultOpen={true}>
            <PropField label="Largura">
              <span className="prop-value">{room.width} mm</span>
            </PropField>
            <PropField label="Comprimento">
              <span className="prop-value">{room.height} mm</span>
            </PropField>
            <PropField label="Área Total">
              <span className="prop-value">{((room.width * room.height) / 1_000_000).toFixed(2)} m²</span>
            </PropField>
          </PropGroup>
        )}
      </div>
    </aside>
  )
}

// ─── Element properties ───────────────────────────────────────────────────────

const ElementProperties: React.FC<{ element: ProjectElement }> = ({ element }) => {
  const project = useEditorStore(selectProject)
  const store   = useEditorStore()
  const unit    = project.settings.unit

  const updatePos = (axis: 'x' | 'y', raw: string) => {
    const v = parseFloat(raw)
    if (isNaN(v)) return
    store.pushHistory()
    store.updateElement(element.id, { position: { ...element.position, [axis]: v } })
  }

  const typeLabel: Record<ProjectElement['type'], string> = {
    countertop: 'Bancada',
    sink:       'Cuba',
    cooktop:    'Cooktop',
    faucet:     'Torneira',
    trash:      'Lixeira',
    'wet-area': 'Área Molhada',
    backsplash: 'Rodabanca',
    cutout:     'Recorte',
    dimension:  'Cota',
    annotation: 'Anotação',
    arrow:      'Seta',
  }

  const isCountertop = element.type === 'countertop'

  return (
    <aside className="properties-panel" aria-label={`Propriedades: ${typeLabel[element.type]}`}>
      <div className="properties-header">
        <div className="properties-header__title-group">
          <h3 className="properties-title">{element.label ?? typeLabel[element.type]}</h3>
          <span className="properties-subtitle">{typeLabel[element.type]}</span>
        </div>
        <span className="properties-type-tag">{element.type}</span>
      </div>

      <div className="properties-body">
        {/* 1. Dimensões & Geometria específicas */}
        {element.type === 'countertop' && <CountertopProps el={element} unit={unit} store={store} />}
        {element.type === 'sink'       && <SinkProps el={element} unit={unit} store={store} />}
        {element.type === 'cooktop'    && <CooktopProps el={element} unit={unit} store={store} />}
        {element.type === 'faucet'     && <FaucetProps el={element} unit={unit} store={store} />}
        {element.type === 'trash'      && <TrashProps el={element} unit={unit} store={store} />}
        {element.type === 'wet-area'   && <WetAreaProps el={element} unit={unit} store={store} />}
        {element.type === 'backsplash' && <BacksplashProps el={element} unit={unit} store={store} />}
        {element.type === 'cutout'     && <CutoutProps el={element} unit={unit} store={store} />}
        {element.type === 'annotation' && <AnnotationProps el={element as AnnotationElement} store={store} />}
        {element.type === 'arrow'      && <ArrowProps el={element as ArrowElement} store={store} />}

        {/* 2. Posição, Alinhamento e Rotação (para elementos móveis) */}
        {!isCountertop && (
          <PropGroup title="Posição & Alinhamento" defaultOpen={true}>
            <div className="prop-stack">
              {'parentId' in element && (element as any).parentId && (
                <div className="prop-subgroup">
                  <span className="prop-subgroup__label">Alinhamento Rápido</span>
                  <AlignmentToolbar element={element} store={store} />
                </div>
              )}

              <div className="prop-subgroup">
                <span className="prop-subgroup__label">Coordenadas (Posição)</span>
                <div className="prop-coords-grid">
                  <div className="prop-coord-box">
                    <span className="prop-coord-box__axis">X</span>
                    <input
                      type="number"
                      step={1}
                      value={Math.round(element.position.x)}
                      onChange={(e) => updatePos('x', e.target.value)}
                      title="Posição horizontal X em mm"
                    />
                    <span className="prop-coord-box__unit">mm</span>
                  </div>
                  <div className="prop-coord-box">
                    <span className="prop-coord-box__axis">Y</span>
                    <input
                      type="number"
                      step={1}
                      value={Math.round(element.position.y)}
                      onChange={(e) => updatePos('y', e.target.value)}
                      title="Posição vertical Y em mm"
                    />
                    <span className="prop-coord-box__unit">mm</span>
                  </div>
                </div>
              </div>

              <div className="prop-subgroup">
                <span className="prop-subgroup__label">Rotação</span>
                <div className="prop-rotation-row">
                  <div className="prop-coord-box" style={{ flex: 1 }}>
                    <span className="prop-coord-box__axis">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                        <polyline points="21 3 21 8 16 8" />
                      </svg>
                    </span>
                    <input
                      type="number"
                      step={1}
                      value={element.rotation || 0}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value)
                        if (isNaN(v)) return
                        store.pushHistory()
                        store.updateElement(element.id, { rotation: v % 360 })
                      }}
                      title="Graus de rotação"
                    />
                    <span className="prop-coord-box__unit">°</span>
                  </div>
                  <div className="prop-rotation-buttons">
                    <button
                      className="btn-rotate"
                      type="button"
                      onClick={() => {
                        store.pushHistory()
                        store.updateElement(element.id, { rotation: ((element.rotation || 0) - 90) % 360 })
                      }}
                      title="Girar -90° (Anti-horário)"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <polyline points="3 3 3 8 8 8" />
                      </svg>
                    </button>
                    <button
                      className="btn-rotate"
                      type="button"
                      onClick={() => {
                        store.pushHistory()
                        store.updateElement(element.id, { rotation: ((element.rotation || 0) + 90) % 360 })
                      }}
                      title="Girar +90° (Horário)"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                        <polyline points="21 3 21 8 16 8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </PropGroup>
        )}

        {/* 3. Vínculo com Elemento Pai */}
        {'parentId' in element && (() => {
          const parents = getValidParents(store.project.elements)
          return (
            <PropGroup title="Vínculo" defaultOpen={true}>
              <PropField label="Elemento Pai">
                <select
                  value={(element as any).parentId ?? ''}
                  onChange={(e) => {
                    store.pushHistory()
                    store.updateElement(element.id, { parentId: e.target.value })
                  }}
                >
                  <option value="">Nenhum (Solto)</option>
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label ?? (p.type === 'countertop' ? `Bancada (${p.geometry.type})` : 'Área Molhada')}
                    </option>
                  ))}
                </select>
              </PropField>
            </PropGroup>
          )
        })()}

        {/* 4. Identificação (Callout) */}
        {(element.type === 'faucet' || element.type === 'trash' || element.type === 'cutout') && (
          <PropGroup title="Identificação (Callout)" defaultOpen={true}>
            <PropField label="Posição">
              <select
                value={element.calloutPosition ?? 'auto'}
                onChange={(e) => {
                  store.pushHistory()
                  const v = e.target.value
                  store.updateElement(element.id, { calloutPosition: v === 'auto' ? undefined : (v as CalloutPosition) })
                }}
              >
                <option value="auto">Automático</option>
                <option value="top-right">Acima à direita</option>
                <option value="top-left">Acima à esquerda</option>
                <option value="right">À direita</option>
                <option value="left">À esquerda</option>
                <option value="bottom-right">Abaixo à direita</option>
                <option value="bottom-left">Abaixo à esquerda</option>
              </select>
            </PropField>
          </PropGroup>
        )}

        {/* 5. Cotas Visíveis */}
        <PropGroup title="Cotas Visíveis" defaultOpen={true}>
          <PropField label="Dimensões">
            <div className="prop-cota-row">
              <input
                type="checkbox"
                checked={element.dimSelf !== false}
                onChange={(e) => {
                  store.pushHistory()
                  store.updateElement(element.id, { dimSelf: e.target.checked })
                }}
              />
              {element.dimSelf !== false && (
                <select
                  className="prop-cota-select"
                  value={element.dimSelfPos ?? 'auto'}
                  onChange={(e) => {
                    store.pushHistory()
                    const v = e.target.value
                    store.updateElement(element.id, { dimSelfPos: v === 'auto' ? undefined : (v as DimSide) })
                  }}
                >
                  <option value="auto">Posição Auto</option>
                  <option value="top">Acima</option>
                  <option value="bottom">Abaixo</option>
                  {element.type !== 'countertop' && <option value="center">Ao centro</option>}
                </select>
              )}
            </div>
          </PropField>

          {element.type === 'countertop' && element.dimSelf !== false && (
            <PropField label="Profundidade">
              <div className="prop-cota-row">
                <select
                  className="prop-cota-select"
                  value={element.dimSelfPosV ?? 'auto'}
                  onChange={(e) => {
                    store.pushHistory()
                    const v = e.target.value
                    store.updateElement(element.id, { dimSelfPosV: v === 'auto' ? undefined : (v as DimSide) })
                  }}
                >
                  <option value="auto">Posição Auto</option>
                  <option value="left">À esquerda</option>
                  <option value="right">À direita</option>
                </select>
              </div>
            </PropField>
          )}

          {'parentId' in element && (
            <>
              <PropField label="Cota ao Topo">
                <div className="prop-cota-row">
                  <input
                    type="checkbox"
                    checked={element.dimTop !== false}
                    onChange={(e) => {
                      store.pushHistory()
                      store.updateElement(element.id, { dimTop: e.target.checked })
                    }}
                  />
                  {element.dimTop !== false && (
                    <select
                      className="prop-cota-select"
                      value={element.dimTopPos ?? 'auto'}
                      onChange={(e) => {
                        store.pushHistory()
                        const v = e.target.value
                        store.updateElement(element.id, { dimTopPos: v === 'auto' ? undefined : (v as DimSide) })
                      }}
                    >
                      <option value="auto">Auto</option>
                      <option value="right">À direita</option>
                      <option value="left">À esquerda</option>
                      <option value="center">Ao centro</option>
                    </select>
                  )}
                </div>
              </PropField>

              <PropField label="Cota à Base">
                <div className="prop-cota-row">
                  <input
                    type="checkbox"
                    checked={element.dimBottom !== false}
                    onChange={(e) => {
                      store.pushHistory()
                      store.updateElement(element.id, { dimBottom: e.target.checked })
                    }}
                  />
                  {element.dimBottom !== false && (
                    <select
                      className="prop-cota-select"
                      value={element.dimBottomPos ?? 'auto'}
                      onChange={(e) => {
                        store.pushHistory()
                        const v = e.target.value
                        store.updateElement(element.id, { dimBottomPos: v === 'auto' ? undefined : (v as DimSide) })
                      }}
                    >
                      <option value="auto">Auto</option>
                      <option value="right">À direita</option>
                      <option value="left">À esquerda</option>
                      <option value="center">Ao centro</option>
                    </select>
                  )}
                </div>
              </PropField>

              <PropField label="Cota à Esquerda">
                <div className="prop-cota-row">
                  <input
                    type="checkbox"
                    checked={element.dimLeft !== false}
                    onChange={(e) => {
                      store.pushHistory()
                      store.updateElement(element.id, { dimLeft: e.target.checked })
                    }}
                  />
                  {element.dimLeft !== false && (
                    <select
                      className="prop-cota-select"
                      value={element.dimLeftPos ?? 'auto'}
                      onChange={(e) => {
                        store.pushHistory()
                        const v = e.target.value
                        store.updateElement(element.id, { dimLeftPos: v === 'auto' ? undefined : (v as DimSide) })
                      }}
                    >
                      <option value="auto">Auto</option>
                      <option value="top">Acima</option>
                      <option value="bottom">Abaixo</option>
                      <option value="center">Ao centro</option>
                    </select>
                  )}
                </div>
              </PropField>

              <PropField label="Cota à Direita">
                <div className="prop-cota-row">
                  <input
                    type="checkbox"
                    checked={element.dimRight !== false}
                    onChange={(e) => {
                      store.pushHistory()
                      store.updateElement(element.id, { dimRight: e.target.checked })
                    }}
                  />
                  {element.dimRight !== false && (
                    <select
                      className="prop-cota-select"
                      value={element.dimRightPos ?? 'auto'}
                      onChange={(e) => {
                        store.pushHistory()
                        const v = e.target.value
                        store.updateElement(element.id, { dimRightPos: v === 'auto' ? undefined : (v as DimSide) })
                      }}
                    >
                      <option value="auto">Auto</option>
                      <option value="top">Acima</option>
                      <option value="bottom">Abaixo</option>
                      <option value="center">Ao centro</option>
                    </select>
                  )}
                </div>
              </PropField>
            </>
          )}

          {'parentId' in element && (() => {
            const parent = store.project.elements.find(e => e.id === (element as any).parentId)
            if (parent?.type === 'wet-area') {
              return (
                <PropField label="Cota à Bancada">
                  <div className="prop-cota-row">
                    <input
                      type="checkbox"
                      checked={element.dimRoot === true}
                      onChange={(e) => {
                        store.pushHistory()
                        store.updateElement(element.id, { dimRoot: e.target.checked })
                      }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Medir até a borda externa</span>
                  </div>
                </PropField>
              )
            }
            return null
          })()}
        </PropGroup>

        {/* 6. Botão de Remoção */}
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <DeleteBtn ids={[element.id]} />
        </div>
      </div>
    </aside>
  )
}

// ─── Alignment Toolbar ────────────────────────────────────────────────────────

const AlignmentToolbar: React.FC<{ element: ProjectElement; store: EditorStore }> = ({ element, store }) => {
  if (!('parentId' in element)) return null
  const parentId = (element as any).parentId
  if (!parentId) return null

  const handleAlign = (alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
    let parent = store.project.elements.find((e: ProjectElement) => e.id === parentId)
    if (!parent) return

    const childBounds = getElementBounds(element)
    if (!childBounds) return

    // Find visual parent (e.g. wet-area) if current parent is countertop and element is inside wet-area
    if (parent.type === 'countertop' && element.type !== 'wet-area') {
      const wetAreas = store.project.elements.filter((e: ProjectElement) => e.type === 'wet-area' && ('parentId' in e) && e.parentId === parent!.id)
      for (const wa of wetAreas) {
        const waBounds = getElementBounds(wa)
        if (waBounds && isInsideBounds(childBounds, waBounds)) {
          parent = wa
          break
        }
      }
    }

    let parentBounds = getElementBounds(parent)
    if (!parentBounds) return

    if (parent.type === 'countertop' && parent.geometry.type === 'l-shape') {
      const g = parent.geometry
      const cx = childBounds.x + childBounds.width / 2
      const cy = childBounds.y + childBounds.height / 2

      if (cx < parent.position.x + g.segmentB.width && cy > parent.position.y + g.segmentA.depth) {
        parentBounds = {
          x: parent.position.x,
          y: parent.position.y + g.segmentA.depth,
          width: g.segmentB.width,
          height: g.segmentB.depth,
        }
      } else {
        parentBounds = {
          x: parent.position.x,
          y: parent.position.y,
          width: g.segmentA.width,
          height: g.segmentA.depth,
        }
      }
    }

    let dx = 0
    let dy = 0

    switch (alignment) {
      case 'left':
        dx = parentBounds.x - childBounds.x
        break
      case 'center-h':
        dx = (parentBounds.x + parentBounds.width / 2) - (childBounds.x + childBounds.width / 2)
        break
      case 'right':
        dx = (parentBounds.x + parentBounds.width) - (childBounds.x + childBounds.width)
        break
      case 'top':
        dy = parentBounds.y - childBounds.y
        break
      case 'center-v':
        dy = (parentBounds.y + parentBounds.height / 2) - (childBounds.y + childBounds.height / 2)
        break
      case 'bottom':
        dy = (parentBounds.y + parentBounds.height) - (childBounds.y + childBounds.height)
        break
    }

    if (dx === 0 && dy === 0) return

    store.pushHistory()

    const elementsToUpdate = new Map<string, ProjectElement>()
    elementsToUpdate.set(element.id, element)

    let added = true
    while (added) {
      added = false
      store.project.elements.forEach((el) => {
        if (elementsToUpdate.has(el.id)) return
        if (!('parentId' in el)) return

        let pId = (el as any).parentId
        if ((el as any).type !== 'countertop' && el.type !== 'wet-area' && el.type !== 'backsplash') {
          const containingWetAreas = store.project.elements.filter(p => p.type === 'wet-area' && (() => {
            const cb = getElementBounds(el)
            const pb = getElementBounds(p)
            return cb && pb && isInsideBounds(cb, pb)
          })())
          if (containingWetAreas.length > 0) {
            pId = containingWetAreas[0].id
          }
        }

        if (elementsToUpdate.has(pId)) {
          elementsToUpdate.set(el.id, el)
          added = true
        }
      })
    }

    const updates = Array.from(elementsToUpdate.values()).map(el => ({
      id: el.id,
      patch: {
        position: {
          x: Math.round(el.position.x + dx),
          y: Math.round(el.position.y + dy),
        },
      },
    }))

    store.updateElements(updates)
  }

  return (
    <div className="alignment-toolbar">
      <div className="alignment-group" title="Alinhamento Horizontal">
        <button className="align-btn" onClick={() => handleAlign('left')} title="Alinhar à Esquerda" type="button">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="2" y1="1" x2="2" y2="15" strokeWidth="2" />
            <rect x="4" y="3.5" width="8" height="3" fill="currentColor" fillOpacity="0.2" rx="0.5" />
            <rect x="4" y="9.5" width="5" height="3" fill="currentColor" fillOpacity="0.2" rx="0.5" />
          </svg>
        </button>
        <button className="align-btn" onClick={() => handleAlign('center-h')} title="Centralizar Horizontalmente" type="button">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="8" y1="1" x2="8" y2="15" strokeWidth="2" strokeDasharray="2 1" />
            <rect x="4" y="3.5" width="8" height="3" fill="currentColor" fillOpacity="0.2" rx="0.5" />
            <rect x="5.5" y="9.5" width="5" height="3" fill="currentColor" fillOpacity="0.2" rx="0.5" />
          </svg>
        </button>
        <button className="align-btn" onClick={() => handleAlign('right')} title="Alinhar à Direita" type="button">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="14" y1="1" x2="14" y2="15" strokeWidth="2" />
            <rect x="4" y="3.5" width="8" height="3" fill="currentColor" fillOpacity="0.2" rx="0.5" />
            <rect x="7" y="9.5" width="5" height="3" fill="currentColor" fillOpacity="0.2" rx="0.5" />
          </svg>
        </button>
      </div>

      <div className="alignment-group" title="Alinhamento Vertical">
        <button className="align-btn" onClick={() => handleAlign('top')} title="Alinhar ao Topo" type="button">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="1" y1="2" x2="15" y2="2" strokeWidth="2" />
            <rect x="3.5" y="4" width="3" height="8" fill="currentColor" fillOpacity="0.2" rx="0.5" />
            <rect x="9.5" y="4" width="3" height="5" fill="currentColor" fillOpacity="0.2" rx="0.5" />
          </svg>
        </button>
        <button className="align-btn" onClick={() => handleAlign('center-v')} title="Centralizar Verticalmente" type="button">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="1" y1="8" x2="15" y2="8" strokeWidth="2" strokeDasharray="2 1" />
            <rect x="3.5" y="4" width="3" height="8" fill="currentColor" fillOpacity="0.2" rx="0.5" />
            <rect x="9.5" y="5.5" width="3" height="5" fill="currentColor" fillOpacity="0.2" rx="0.5" />
          </svg>
        </button>
        <button className="align-btn" onClick={() => handleAlign('bottom')} title="Alinhar à Base" type="button">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="1" y1="14" x2="15" y2="14" strokeWidth="2" />
            <rect x="3.5" y="4" width="3" height="8" fill="currentColor" fillOpacity="0.2" rx="0.5" />
            <rect x="9.5" y="7" width="3" height="5" fill="currentColor" fillOpacity="0.2" rx="0.5" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─── Type-specific property editors ──────────────────────────────────────────

type PropsHelper = { unit: string; store: EditorStore }

const CountertopProps: React.FC<{ el: CountertopElement } & PropsHelper> = ({ el, unit, store }) => {
  const toU  = (mm: number) => parseFloat(fromMm(mm, unit as 'mm' | 'cm' | 'm').toFixed(unit === 'mm' ? 0 : 1))
  const toMmU = (v: number) => Math.round(toMm(v, unit as 'mm' | 'cm' | 'm'))
  const g = el.geometry

  return (
    <>
      {g.type === 'reta' && (
        <PropGroup title="Dimensões da Bancada" defaultOpen={true}>
          <PropField label="Comprimento">
            <div className="prop-control-with-unit">
              <input
                id="ct-prop-w"
                type="number"
                step={unit === 'mm' ? 10 : 1}
                value={toU(g.width)}
                onChange={(e) => store.updateElement(el.id, { geometry: { ...g, width: toMmU(Number(e.target.value)) } })}
              />
              <span className="prop-unit">{unit}</span>
            </div>
          </PropField>
          <PropField label="Profundidade">
            <div className="prop-control-with-unit">
              <input
                id="ct-prop-d"
                type="number"
                step={unit === 'mm' ? 10 : 1}
                value={toU(g.depth)}
                onChange={(e) => store.updateElement(el.id, { geometry: { ...g, depth: toMmU(Number(e.target.value)) } })}
              />
              <span className="prop-unit">{unit}</span>
            </div>
          </PropField>
        </PropGroup>
      )}

      {g.type === 'l-shape' && (
        <PropGroup title="Segmentos da Bancada em L" defaultOpen={true}>
          <PropField label="Segmento A (Comprimento)">
            <div className="prop-control-with-unit">
              <input
                type="number"
                step={unit === 'mm' ? 10 : 1}
                value={toU(g.segmentA.width)}
                onChange={(e) => store.updateElement(el.id, {
                  geometry: { ...g, segmentA: { ...g.segmentA, width: toMmU(Number(e.target.value)) } },
                })}
              />
              <span className="prop-unit">{unit}</span>
            </div>
          </PropField>
          <PropField label="Segmento A (Profundidade)">
            <div className="prop-control-with-unit">
              <input
                type="number"
                step={unit === 'mm' ? 10 : 1}
                value={toU(g.segmentA.depth)}
                onChange={(e) => {
                  const newAD = toMmU(Number(e.target.value))
                  const ext   = g.segmentB.width - g.segmentA.depth
                  store.updateElement(el.id, {
                    geometry: {
                      ...g,
                      segmentA: { ...g.segmentA, depth: newAD },
                      segmentB: { ...g.segmentB, width: newAD + ext },
                    },
                  })
                }}
              />
              <span className="prop-unit">{unit}</span>
            </div>
          </PropField>

          <PropField label="Extensão do Retorno (B)" hint="Medido a partir da borda interna de A">
            <div className="prop-control-with-unit">
              <input
                type="number"
                step={unit === 'mm' ? 10 : 1}
                value={toU(Math.max(0, g.segmentB.width - g.segmentA.depth))}
                onChange={(e) => {
                  const ext = toMmU(Number(e.target.value))
                  store.updateElement(el.id, {
                    geometry: { ...g, segmentB: { ...g.segmentB, width: g.segmentA.depth + ext } },
                  })
                }}
              />
              <span className="prop-unit">{unit}</span>
            </div>
          </PropField>

          <PropField label="Segmento B (Profundidade)">
            <div className="prop-control-with-unit">
              <input
                type="number"
                step={unit === 'mm' ? 10 : 1}
                value={toU(g.segmentB.depth)}
                onChange={(e) => store.updateElement(el.id, {
                  geometry: { ...g, segmentB: { ...g.segmentB, depth: toMmU(Number(e.target.value)) } },
                })}
              />
              <span className="prop-unit">{unit}</span>
            </div>
          </PropField>

          <div className="prop-callout-info">
            <span>Comprimento total do braço B: <strong>{toU(g.segmentB.width)} {unit}</strong></span>
          </div>
        </PropGroup>
      )}

      <PropGroup title="Material & Acabamento" defaultOpen={true}>
        <PropField label="Material">
          <select
            value={el.material?.id ?? ''}
            onChange={(e) => {
              const m = MATERIALS.find((mat) => mat.id === e.target.value)
              if (m) store.updateElement(el.id, { material: m })
            }}
          >
            {MATERIALS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </PropField>
        <PropField label="Espessura">
          <div className="prop-control-with-unit">
            <select
              value={el.thickness}
              onChange={(e) => store.updateElement(el.id, { thickness: Number(e.target.value) })}
            >
              {[12, 15, 20, 30].map((t) => (
                <option key={t} value={t}>
                  {t} mm
                </option>
              ))}
            </select>
          </div>
        </PropField>
      </PropGroup>

      {g.type === 'reta' && (
        <PropGroup title="Área & Volume" defaultOpen={true}>
          <PropField label="Área de Superfície">
            <span className="prop-value">{((g.width * g.depth) / 1_000_000).toFixed(2)} m²</span>
          </PropField>
          <PropField label="Dimensões">
            <span className="prop-value">{g.width} × {g.depth} mm</span>
          </PropField>
        </PropGroup>
      )}
    </>
  )
}

const SinkProps: React.FC<{ el: SinkElement } & PropsHelper> = ({ el, store }) => (
  <PropGroup title="Dimensões da Cuba" defaultOpen={true}>
    {(el as any).sinkType && (
      <PropField label="Tipo da Cuba">
        <span className="prop-value" style={{ textTransform: 'capitalize' }}>{(el as any).sinkType}</span>
      </PropField>
    )}
    <PropField label="Largura Total">
      <div className="prop-control-with-unit">
        <input
          type="number"
          step={5}
          value={el.width}
          onChange={(e) => store.updateElement(el.id, { width: Number(e.target.value) })}
        />
        <span className="prop-unit">mm</span>
      </div>
    </PropField>
    <PropField label="Profundidade Total">
      <div className="prop-control-with-unit">
        <input
          type="number"
          step={5}
          value={el.depth}
          onChange={(e) => store.updateElement(el.id, { depth: Number(e.target.value) })}
        />
        <span className="prop-unit">mm</span>
      </div>
    </PropField>
  </PropGroup>
)

const CooktopProps: React.FC<{ el: CooktopElement } & PropsHelper> = ({ el, store }) => (
  <PropGroup title="Dimensões do Cooktop" defaultOpen={true}>
    <PropField label="Largura Total">
      <div className="prop-control-with-unit">
        <input
          type="number"
          step={5}
          value={el.width}
          onChange={(e) => store.updateElement(el.id, { width: Number(e.target.value) })}
        />
        <span className="prop-unit">mm</span>
      </div>
    </PropField>
    <PropField label="Profundidade Total">
      <div className="prop-control-with-unit">
        <input
          type="number"
          step={5}
          value={el.depth}
          onChange={(e) => store.updateElement(el.id, { depth: Number(e.target.value) })}
        />
        <span className="prop-unit">mm</span>
      </div>
    </PropField>
    <PropField label="Largura do Nicho">
      <div className="prop-control-with-unit">
        <input
          type="number"
          step={5}
          value={el.cutWidth}
          onChange={(e) => store.updateElement(el.id, { cutWidth: Number(e.target.value) })}
        />
        <span className="prop-unit">mm</span>
      </div>
    </PropField>
    <PropField label="Profundidade do Nicho">
      <div className="prop-control-with-unit">
        <input
          type="number"
          step={5}
          value={el.cutDepth}
          onChange={(e) => store.updateElement(el.id, { cutDepth: Number(e.target.value) })}
        />
        <span className="prop-unit">mm</span>
      </div>
    </PropField>
    <PropField label="Modo de Exibição">
      <select
        value={el.displayMode || 'cooktop'}
        onChange={(e) => store.updateElement(el.id, { displayMode: e.target.value as 'cooktop' | 'cutout' })}
      >
        <option value="cooktop">Fogão Completo (Com Queimadores)</option>
        <option value="cutout">Apenas Nicho (Recorte)</option>
      </select>
    </PropField>
  </PropGroup>
)

const FaucetProps: React.FC<{ el: FaucetElement } & PropsHelper> = ({ el, store }) => (
  <PropGroup title="Furo da Torneira" defaultOpen={true}>
    <PropField label="Diâmetro do Furo">
      <div className="prop-control-with-unit">
        <input
          type="number"
          step={1}
          value={el.diameter}
          onChange={(e) => store.updateElement(el.id, { diameter: Number(e.target.value) })}
        />
        <span className="prop-unit">mm</span>
      </div>
    </PropField>
  </PropGroup>
)

const TrashProps: React.FC<{ el: TrashElement } & PropsHelper> = ({ el, store }) => (
  <PropGroup title="Dimensões da Lixeira" defaultOpen={true}>
    <PropField label="Formato">
      <span className="prop-value" style={{ textTransform: 'capitalize' }}>{el.shape}</span>
    </PropField>
    {el.shape === 'circular' && (
      <PropField label="Diâmetro">
        <div className="prop-control-with-unit">
          <input
            type="number"
            step={5}
            value={el.diameter ?? 250}
            onChange={(e) => store.updateElement(el.id, { diameter: Number(e.target.value) })}
          />
          <span className="prop-unit">mm</span>
        </div>
      </PropField>
    )}
    {el.shape === 'retangular' && (
      <>
        <PropField label="Largura">
          <div className="prop-control-with-unit">
            <input
              type="number"
              step={5}
              value={el.width ?? 300}
              onChange={(e) => store.updateElement(el.id, { width: Number(e.target.value) })}
            />
            <span className="prop-unit">mm</span>
          </div>
        </PropField>
        <PropField label="Profundidade">
          <div className="prop-control-with-unit">
            <input
              type="number"
              step={5}
              value={el.depth ?? 250}
              onChange={(e) => store.updateElement(el.id, { depth: Number(e.target.value) })}
            />
            <span className="prop-unit">mm</span>
          </div>
        </PropField>
      </>
    )}
  </PropGroup>
)

const WetAreaProps: React.FC<{ el: WetAreaElement } & PropsHelper> = ({ el, store }) => (
  <PropGroup title="Dimensões da Área Molhada" defaultOpen={true}>
    <PropField label="Largura">
      <div className="prop-control-with-unit">
        <input
          type="number"
          step={10}
          value={el.width}
          onChange={(e) => store.updateElement(el.id, { width: Number(e.target.value) })}
        />
        <span className="prop-unit">mm</span>
      </div>
    </PropField>
    <PropField label="Profundidade">
      <div className="prop-control-with-unit">
        <input
          type="number"
          step={10}
          value={el.depth}
          onChange={(e) => store.updateElement(el.id, { depth: Number(e.target.value) })}
        />
        <span className="prop-unit">mm</span>
      </div>
    </PropField>
    <PropField label="Rebaixo">
      <div className="prop-control-with-unit">
        <input
          type="number"
          step={0.5}
          value={el.recess}
          onChange={(e) => store.updateElement(el.id, { recess: Number(e.target.value) })}
        />
        <span className="prop-unit">mm</span>
      </div>
    </PropField>
  </PropGroup>
)

const BacksplashProps: React.FC<{ el: BacksplashElement } & PropsHelper> = ({ el, store }) => (
  <PropGroup title="Dimensões da Rodabanca" defaultOpen={true}>
    <PropField label="Altura">
      <div className="prop-control-with-unit">
        <input
          type="number"
          step={10}
          value={el.height}
          onChange={(e) => store.updateElement(el.id, { height: Number(e.target.value) })}
        />
        <span className="prop-unit">mm</span>
      </div>
    </PropField>
    <PropField label="Comprimento">
      <div className="prop-control-with-unit">
        <input
          type="number"
          step={10}
          value={el.length}
          onChange={(e) => store.updateElement(el.id, { length: Number(e.target.value) })}
        />
        <span className="prop-unit">mm</span>
      </div>
    </PropField>
    <PropField label="Espessura">
      <div className="prop-control-with-unit">
        <select
          value={el.thickness}
          onChange={(e) => store.updateElement(el.id, { thickness: Number(e.target.value) })}
        >
          {[12, 15, 20, 30].map((t) => (
            <option key={t} value={t}>
              {t} mm
            </option>
          ))}
        </select>
      </div>
    </PropField>
  </PropGroup>
)

const CutoutProps: React.FC<{ el: CutoutElement } & PropsHelper> = ({ el, store }) => (
  <>
    <PropGroup title="Identificação do Recorte" defaultOpen={true}>
      <PropField label="Rótulo / Nome">
        <input
          type="text"
          value={el.label ?? 'RECORTE'}
          onChange={(e) => store.updateElement(el.id, { label: e.target.value })}
        />
      </PropField>
      <PropField label="Cor de Destaque">
        <input
          type="color"
          value={el.color ?? '#ffffff'}
          onChange={(e) => store.updateElement(el.id, { color: e.target.value })}
          style={{ padding: 2, height: 28, cursor: 'pointer' }}
        />
      </PropField>
    </PropGroup>

    <PropGroup title="Geometria do Recorte" defaultOpen={true}>
      <PropField label="Formato">
        <select
          value={el.shape}
          onChange={(e) => {
            const newShape = e.target.value as 'circular' | 'retangular' | 'retangular-arredondado'
            const updates: Partial<CutoutElement> = { shape: newShape }
            if (newShape === 'circular' && el.diameter === undefined) updates.diameter = Math.max(el.width ?? 200, el.depth ?? 200)
            if (newShape !== 'circular' && (el.width === undefined || el.depth === undefined)) {
              updates.width = el.diameter ?? 200
              updates.depth = el.diameter ?? 200
            }
            if (newShape === 'retangular-arredondado' && el.radius === undefined) updates.radius = 30
            store.updateElement(el.id, updates)
          }}
        >
          <option value="circular">Circular</option>
          <option value="retangular">Retangular</option>
          <option value="retangular-arredondado">Retangular Arredondado</option>
        </select>
      </PropField>
      {el.shape === 'circular' && (
        <PropField label="Diâmetro">
          <div className="prop-control-with-unit">
            <input
              type="number"
              step={5}
              value={el.diameter ?? 100}
              onChange={(e) => store.updateElement(el.id, { diameter: Number(e.target.value) })}
            />
            <span className="prop-unit">mm</span>
          </div>
        </PropField>
      )}
      {(el.shape === 'retangular' || el.shape === 'retangular-arredondado') && (
        <>
          <PropField label="Largura">
            <div className="prop-control-with-unit">
              <input
                type="number"
                step={5}
                value={el.width ?? 200}
                onChange={(e) => store.updateElement(el.id, { width: Number(e.target.value) })}
              />
              <span className="prop-unit">mm</span>
            </div>
          </PropField>
          <PropField label="Profundidade">
            <div className="prop-control-with-unit">
              <input
                type="number"
                step={5}
                value={el.depth ?? 200}
                onChange={(e) => store.updateElement(el.id, { depth: Number(e.target.value) })}
              />
              <span className="prop-unit">mm</span>
            </div>
          </PropField>
        </>
      )}
      {el.shape === 'retangular-arredondado' && (
        <PropField label="Raio do Canto">
          <div className="prop-control-with-unit">
            <input
              type="number"
              step={5}
              value={el.radius ?? 30}
              onChange={(e) => store.updateElement(el.id, { radius: Number(e.target.value) })}
            />
            <span className="prop-unit">mm</span>
          </div>
        </PropField>
      )}
    </PropGroup>
  </>
)

const AnnotationProps: React.FC<{ el: AnnotationElement; store: EditorStore }> = ({ el, store }) => (
  <PropGroup title="Propriedades do Texto" defaultOpen={true}>
    <PropField label="Texto">
      <input
        type="text"
        value={el.text}
        onChange={(e) => store.updateElement(el.id, { text: e.target.value })}
      />
    </PropField>
    <PropField label="Tamanho da Fonte">
      <div className="prop-control-with-unit">
        <input
          type="number"
          step={2}
          value={el.fontSize}
          onChange={(e) => store.updateElement(el.id, { fontSize: Number(e.target.value) })}
        />
        <span className="prop-unit">px</span>
      </div>
    </PropField>
    <PropField label="Cor do Texto">
      <input
        type="color"
        value={el.color || '#333333'}
        onChange={(e) => store.updateElement(el.id, { color: e.target.value })}
        style={{ padding: 2, height: 28, cursor: 'pointer' }}
      />
    </PropField>
    <PropField label="Estilo">
      <select value={el.weight || 'normal'} onChange={(e) => store.updateElement(el.id, { weight: e.target.value as 'normal' | 'bold' })}>
        <option value="normal">Normal</option>
        <option value="bold">Negrito</option>
      </select>
    </PropField>
    <PropField label="Realce">
      <label className="prop-checkbox-label">
        <input
          type="checkbox"
          checked={el.highlight || false}
          onChange={(e) => store.updateElement(el.id, { highlight: e.target.checked })}
        />
        <span>Marca-texto amarelo</span>
      </label>
    </PropField>
  </PropGroup>
)

const ArrowProps: React.FC<{ el: ArrowElement; store: EditorStore }> = ({ el, store }) => (
  <PropGroup title="Propriedades da Seta" defaultOpen={true}>
    <PropField label="Cor da Seta">
      <input
        type="color"
        value={el.color || '#ff0000'}
        onChange={(e) => store.updateElement(el.id, { color: e.target.value })}
        style={{ padding: 2, height: 28, cursor: 'pointer' }}
      />
    </PropField>
  </PropGroup>
)

// ─── Shared UI Helpers ────────────────────────────────────────────────────────

const PropGroup: React.FC<{
  title?: string
  children: React.ReactNode
  defaultOpen?: boolean
}> = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  if (!title) {
    return <div className="prop-group">{children}</div>
  }

  return (
    <div className="prop-group">
      <button
        type="button"
        className="prop-group__header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="prop-group__title">{title}</span>
        <svg
          className="prop-group__chevron"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.18s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && <div className="prop-group__content">{children}</div>}
    </div>
  )
}

const PropField: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
  <div className="prop-field">
    <label className="prop-field__label">{label}</label>
    <div className="prop-field__control">{children}</div>
    {hint && <span className="prop-field__hint">{hint}</span>}
  </div>
)

const DeleteBtn: React.FC<{ ids: string[] }> = ({ ids }) => {
  const store = useEditorStore()
  return (
    <button
      id="prop-delete-btn"
      className="btn btn--delete-outline btn--full"
      onClick={() => store.removeElements(ids)}
      title="Remover elemento selecionado"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
      Remover {ids.length > 1 ? `${ids.length} elementos` : 'elemento'}
    </button>
  )
}
