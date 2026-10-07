import React from 'react'
import {
  useEditorStore,
  selectProject,
  selectSelectedIds,
  selectElements,
} from '../store/editorStore.ts'
import { formatMeasurement, fromMm, toMm } from '../utils/units.ts'
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
  ArrowElement
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
    <aside className="properties-panel">
      <div className="properties-header">
        <h3 className="properties-title">Múltiplos elementos</h3>
      </div>
      <div className="properties-body">
        <p className="properties-hint">{selectedIds.length} elementos selecionados</p>
        <PropDivider />
        <DeleteBtn ids={selectedIds} />
      </div>
    </aside>
  )
}

// ─── Project properties ───────────────────────────────────────────────────────

const ProjectProperties: React.FC = () => {
  const project = useEditorStore(selectProject)
  const store   = useEditorStore()
  const room    = project.settings.roomBounds

  return (
    <aside className="properties-panel" aria-label="Propriedades do projeto">
      <div className="properties-header">
        <h3 className="properties-title">Projeto</h3>
      </div>
      <div className="properties-body">
        <PropGroup title="Identificação">
          <PropField label="Nome">
            <input id="pp-name" type="text" value={project.name}
              onChange={(e) => store.updateProjectMeta({ name: e.target.value })} />
          </PropField>
          <PropField label="Cliente">
            <input id="pp-client" type="text" value={project.clientName ?? ''}
              onChange={(e) => store.updateProjectMeta({ clientName: e.target.value })}
              placeholder="(opcional)" />
          </PropField>
          <PropField label="Ambiente">
            <input id="pp-env" type="text" value={project.environment ?? ''}
              onChange={(e) => store.updateProjectMeta({ environment: e.target.value })}
              placeholder="ex: Cozinha" />
          </PropField>
        </PropGroup>

        <PropGroup title="Padrão">
          <PropField label="Espessura">
            <select id="pp-thickness" value={project.thickness}
              onChange={(e) => store.updateProjectMeta({ thickness: Number(e.target.value) as 12 | 15 | 20 | 30 })}>
              {[12, 15, 20, 30].map((t) => <option key={t} value={t}>{t} mm</option>)}
            </select>
          </PropField>
          <PropField label="Material">
            <select id="pp-material" value={project.material?.id ?? ''}
              onChange={(e) => {
                const m = MATERIALS.find((m) => m.id === e.target.value)
                if (m) store.updateProjectMeta({ material: m })
              }}>
              {MATERIALS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </PropField>
        </PropGroup>

        {room && (
          <PropGroup title="Cômodo">
            <PropField label="Largura"><span className="prop-value">{room.width} mm</span></PropField>
            <PropField label="Comprimento"><span className="prop-value">{room.height} mm</span></PropField>
            <PropField label="Área"><span className="prop-value">{((room.width * room.height) / 1_000_000).toFixed(2)} m²</span></PropField>
          </PropGroup>
        )}

        <div className="prop-hint">Selecione um elemento para ver suas propriedades.</div>
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
    countertop: 'Bancada', sink: 'Cuba', cooktop: 'Cooktop', faucet: 'Torneira',
    trash: 'Lixeira', 'wet-area': 'Área Molhada', backsplash: 'Rodabanca',
    cutout: 'Recorte', dimension: 'Cota', annotation: 'Anotação',
  }

  return (
    <aside className="properties-panel" aria-label={`Propriedades: ${typeLabel[element.type]}`}>
      <div className="properties-header">
        <h3 className="properties-title">{typeLabel[element.type]}</h3>
        <span className="properties-type-tag">{element.type}</span>
      </div>
      <div className="properties-body">
        {/* Position & Alignment */}
        {element.type !== 'countertop' && (
          <PropGroup title="Posição">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-2)' }}>Alinhamento</span>
                <AlignmentToolbar element={element} store={store} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-2)' }}>Coordenadas</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ display: 'flex', flex: 1, background: 'var(--surface-2)', borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden', alignItems: 'center' }}>
                    <span style={{ padding: '6px 8px', color: 'var(--text-3)', fontSize: 12, fontWeight: 600, borderRight: '1px solid var(--border)', userSelect: 'none' }}>X</span>
                    <input type="number" step={1} value={Math.round(element.position.x)} onChange={(e) => updatePos('x', e.target.value)} 
                      style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', padding: '6px 8px', color: 'var(--text-1)', fontSize: 13, fontWeight: 500 }} />
                  </div>
                  <div style={{ display: 'flex', flex: 1, background: 'var(--surface-2)', borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden', alignItems: 'center' }}>
                    <span style={{ padding: '6px 8px', color: 'var(--text-3)', fontSize: 12, fontWeight: 600, borderRight: '1px solid var(--border)', userSelect: 'none' }}>Y</span>
                    <input type="number" step={1} value={Math.round(element.position.y)} onChange={(e) => updatePos('y', e.target.value)} 
                      style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', padding: '6px 8px', color: 'var(--text-1)', fontSize: 13, fontWeight: 500 }} />
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-2)' }}>Rotação</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ display: 'flex', flex: 1, background: 'var(--surface-2)', borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden', alignItems: 'center' }}>
                    <span style={{ padding: '6px 8px', color: 'var(--text-3)', display: 'flex', borderRight: '1px solid var(--border)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21H3v-5c0-4.4 3.6-8 8-8h9"/><path d="M17 4l4 4-4 4"/></svg>
                    </span>
                    <input type="number" step={1} value={element.rotation || 0}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value)
                        if (isNaN(v)) return
                        store.pushHistory()
                        store.updateElement(element.id, { rotation: v % 360 })
                      }}
                      style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', padding: '6px 8px', color: 'var(--text-1)', fontSize: 13, fontWeight: 500 }} />
                  </div>
                  <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <button className="align-btn" type="button" style={{ padding: '6px 8px' }} onClick={() => {
                      store.pushHistory()
                      store.updateElement(element.id, { rotation: ((element.rotation || 0) - 90) % 360 })
                    }} title="Girar -90°">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18"/><path d="M12 3v18"/><path d="M16 8l-4-4-4 4"/></svg>
                    </button>
                    <button className="align-btn" type="button" style={{ padding: '6px 8px', borderLeft: '1px solid var(--border)' }} onClick={() => {
                      store.pushHistory()
                      store.updateElement(element.id, { rotation: ((element.rotation || 0) + 90) % 360 })
                    }} title="Girar +90°">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12H3"/><path d="M16 16l-4 4-4-4"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </PropGroup>
        )}
        
        {'parentId' in element && (() => {
          const parents = getValidParents(store.project.elements)
          return (
            <PropGroup title="Vínculo">
              <PropField label="Elemento Pai">
                <select 
                  value={(element as any).parentId} 
                  onChange={(e) => {
                    store.pushHistory()
                    store.updateElement(element.id, { parentId: e.target.value })
                  }}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                >
                  <option value="">Selecione...</option>
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


        {/* Type-specific */}
        {element.type === 'countertop' && <CountertopProps el={element} unit={unit} store={store} />}
        {element.type === 'sink'       && <SinkProps el={element} unit={unit} store={store} />}
        {element.type === 'cooktop'    && <CooktopProps el={element} unit={unit} store={store} />}
        {element.type === 'faucet'     && <FaucetProps el={element} unit={unit} store={store} />}
        {element.type === 'trash'      && <TrashProps el={element} unit={unit} store={store} />}
        {element.type === 'wet-area'   && <WetAreaProps el={element} unit={unit} store={store} />}
        {element.type === 'backsplash' && <BacksplashProps el={element} unit={unit} store={store} />}
        {element.type === 'cutout'     && <CutoutProps el={element} unit={unit} store={store} />}
        {element.type === 'annotation' && <AnnotationProps el={element as AnnotationElement} store={store} />}
        {element.type === 'arrow' && <ArrowProps el={element as ArrowElement} store={store} />}

        <PropGroup title="Cotas Visíveis">
          <PropField label="Dimensões">
            <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <input type="checkbox"
                checked={element.dimSelf !== false}
                onChange={(e) => {
                  store.pushHistory()
                  store.updateElement(element.id, { dimSelf: e.target.checked })
                }} />
            </div>
          </PropField>
          
          {'parentId' in element && (
            <>
              <PropField label="Ao Topo">
                <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                  <input type="checkbox"
                    checked={element.dimTop !== false}
                    onChange={(e) => {
                      store.pushHistory()
                      store.updateElement(element.id, { dimTop: e.target.checked })
                    }} />
                </div>
              </PropField>
              <PropField label="À Base">
                <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                  <input type="checkbox"
                    checked={element.dimBottom !== false}
                    onChange={(e) => {
                      store.pushHistory()
                      store.updateElement(element.id, { dimBottom: e.target.checked })
                    }} />
                </div>
              </PropField>
              <PropField label="À Esquerda">
                <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                  <input type="checkbox"
                    checked={element.dimLeft !== false}
                    onChange={(e) => {
                      store.pushHistory()
                      store.updateElement(element.id, { dimLeft: e.target.checked })
                    }} />
                </div>
              </PropField>
              <PropField label="À Direita">
                <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                  <input type="checkbox"
                    checked={element.dimRight !== false}
                    onChange={(e) => {
                      store.pushHistory()
                      store.updateElement(element.id, { dimRight: e.target.checked })
                    }} />
                </div>
              </PropField>
            </>
          )}

          {'parentId' in element && (() => {
            const parent = store.project.elements.find(e => e.id === (element as any).parentId)
            if (parent?.type === 'wet-area') {
              return (
                <PropField label="À Bancada">
                  <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <input type="checkbox"
                      checked={element.dimRoot === true}
                      onChange={(e) => {
                        store.pushHistory()
                        store.updateElement(element.id, { dimRoot: e.target.checked })
                      }} />
                  </div>
                </PropField>
              )
            }
            return null
          })()}
        </PropGroup>

        <PropDivider />
        <DeleteBtn ids={[element.id]} />
      </div>
    </aside>
  )
}

const AlignmentToolbar: React.FC<{ element: ProjectElement; store: ReturnType<typeof useEditorStore> }> = ({ element, store }) => {
  if (!('parentId' in element)) return null
  const parentId = (element as any).parentId
  if (!parentId) return null

  const handleAlign = (alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
    let parent = store.project.elements.find((e: ProjectElement) => e.id === parentId)
    if (!parent) return

    const childBounds = getElementBounds(element)
    if (!childBounds) return

    // Find visual parent (e.g. wet-area) if the current parent is a countertop, and the element itself is not a wet-area
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
    
    // Find all visual descendants to move them together
    const idsToMove = [element.id]
    const elementsToUpdate = new Map<string, ProjectElement>()
    elementsToUpdate.set(element.id, element)
    
    let added = true
    while (added) {
      added = false
      store.project.elements.forEach((el) => {
        if (elementsToUpdate.has(el.id)) return
        if (!('parentId' in el)) return
        
        let pId = (el as any).parentId
        if (el.type !== 'countertop' && el.type !== 'wet-area' && el.type !== 'backsplash') {
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
        }
      }
    }))
    
    store.updateElements(updates)
  }

  return (
    <div className="alignment-toolbar" style={{ display: 'flex', gap: 8 }}>
      <div style={{ display: 'flex', flex: 1, background: 'var(--surface-2)', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <button className="align-btn" onClick={() => handleAlign('left')} title="Alinhar à Esquerda" type="button" style={{ flex: 1, padding: '8px 0' }}>
          <svg width="18" height="18" viewBox="0 0 14 14" stroke="currentColor"><line x1="2" y1="1" x2="2" y2="13" strokeWidth="1.5"/><rect x="4" y="3" width="6" height="3" fill="currentColor" stroke="none"/><rect x="4" y="8" width="4" height="3" fill="currentColor" stroke="none"/></svg>
        </button>
        <button className="align-btn" onClick={() => handleAlign('center-h')} title="Centralizar Horizontalmente" type="button" style={{ flex: 1, padding: '8px 0', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
          <svg width="18" height="18" viewBox="0 0 14 14" stroke="currentColor"><line x1="7" y1="1" x2="7" y2="13" strokeWidth="1.5"/><rect x="4" y="3" width="6" height="3" fill="currentColor" stroke="none"/><rect x="5" y="8" width="4" height="3" fill="currentColor" stroke="none"/></svg>
        </button>
        <button className="align-btn" onClick={() => handleAlign('right')} title="Alinhar à Direita" type="button" style={{ flex: 1, padding: '8px 0' }}>
          <svg width="18" height="18" viewBox="0 0 14 14" stroke="currentColor"><line x1="12" y1="1" x2="12" y2="13" strokeWidth="1.5"/><rect x="4" y="3" width="6" height="3" fill="currentColor" stroke="none"/><rect x="6" y="8" width="4" height="3" fill="currentColor" stroke="none"/></svg>
        </button>
      </div>
      <div style={{ display: 'flex', flex: 1, background: 'var(--surface-2)', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <button className="align-btn" onClick={() => handleAlign('top')} title="Alinhar ao Topo" type="button" style={{ flex: 1, padding: '8px 0' }}>
          <svg width="18" height="18" viewBox="0 0 14 14" stroke="currentColor"><line x1="1" y1="2" x2="13" y2="2" strokeWidth="1.5"/><rect x="3" y="4" width="3" height="6" fill="currentColor" stroke="none"/><rect x="8" y="4" width="3" height="4" fill="currentColor" stroke="none"/></svg>
        </button>
        <button className="align-btn" onClick={() => handleAlign('center-v')} title="Centralizar Verticalmente" type="button" style={{ flex: 1, padding: '8px 0', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
          <svg width="18" height="18" viewBox="0 0 14 14" stroke="currentColor"><line x1="1" y1="7" x2="13" y2="7" strokeWidth="1.5"/><rect x="3" y="4" width="3" height="6" fill="currentColor" stroke="none"/><rect x="8" y="5" width="3" height="4" fill="currentColor" stroke="none"/></svg>
        </button>
        <button className="align-btn" onClick={() => handleAlign('bottom')} title="Alinhar à Base" type="button" style={{ flex: 1, padding: '8px 0' }}>
          <svg width="18" height="18" viewBox="0 0 14 14" stroke="currentColor"><line x1="1" y1="12" x2="13" y2="12" strokeWidth="1.5"/><rect x="3" y="4" width="3" height="6" fill="currentColor" stroke="none"/><rect x="8" y="6" width="3" height="4" fill="currentColor" stroke="none"/></svg>
        </button>
      </div>
    </div>
  )
}

// ─── Type-specific property editors ──────────────────────────────────────────

type PropsHelper = { unit: string; store: ReturnType<typeof useEditorStore> }

const CountertopProps: React.FC<{ el: CountertopElement } & PropsHelper> = ({ el, unit, store }) => {
  // Unit helpers for this panel (values in model are always mm)
  const toU  = (mm: number) => parseFloat(fromMm(mm, unit as 'mm' | 'cm' | 'm').toFixed(unit === 'mm' ? 0 : 1))
  const toMmU = (v: number) => Math.round(toMm(v, unit as 'mm' | 'cm' | 'm'))
  const g = el.geometry

  return (
    <>
      {g.type === 'reta' && (
        <PropGroup title="Dimensões">
          <PropField label="Comprimento">
            <input id="ct-prop-w" type="number" step={unit === 'mm' ? 10 : 1} value={toU(g.width)}
              onChange={(e) => store.updateElement(el.id, { geometry: { ...g, width: toMmU(Number(e.target.value)) } })} />
            <span className="prop-unit">{unit}</span>
          </PropField>
          <PropField label="Profundidade">
            <input id="ct-prop-d" type="number" step={unit === 'mm' ? 10 : 1} value={toU(g.depth)}
              onChange={(e) => store.updateElement(el.id, { geometry: { ...g, depth: toMmU(Number(e.target.value)) } })} />
            <span className="prop-unit">{unit}</span>
          </PropField>
        </PropGroup>
      )}
      {g.type === 'l-shape' && (
        <PropGroup title="Segmentos">
          <PropField label="Seg.A compr.">
            <input type="number" step={unit === 'mm' ? 10 : 1} value={toU(g.segmentA.width)}
              onChange={(e) => store.updateElement(el.id, {
                geometry: { ...g, segmentA: { ...g.segmentA, width: toMmU(Number(e.target.value)) } },
              })} />
            <span className="prop-unit">{unit}</span>
          </PropField>
          <PropField label="Seg.A prof.">
            <input type="number" step={unit === 'mm' ? 10 : 1} value={toU(g.segmentA.depth)}
              onChange={(e) => {
                const newAD = toMmU(Number(e.target.value))
                const ext   = g.segmentB.width - g.segmentA.depth   // preserve user extension
                store.updateElement(el.id, {
                  geometry: {
                    ...g,
                    segmentA: { ...g.segmentA, depth: newAD },
                    segmentB: { ...g.segmentB, width: newAD + ext },
                  },
                })
              }} />
            <span className="prop-unit">{unit}</span>
          </PropField>
          {/* B extension: measured from A's inner edge (stored = aDepth + ext) */}
          <PropField label="Seg.B ext." hint="A partir da borda interna de A">
            <input type="number" step={unit === 'mm' ? 10 : 1}
              value={toU(Math.max(0, g.segmentB.width - g.segmentA.depth))}
              onChange={(e) => {
                const ext = toMmU(Number(e.target.value))
                store.updateElement(el.id, {
                  geometry: { ...g, segmentB: { ...g.segmentB, width: g.segmentA.depth + ext } },
                })
              }} />
            <span className="prop-unit">{unit}</span>
          </PropField>
          <PropField label="Seg.B prof.">
            <input type="number" step={unit === 'mm' ? 10 : 1} value={toU(g.segmentB.depth)}
              onChange={(e) => store.updateElement(el.id, {
                geometry: { ...g, segmentB: { ...g.segmentB, depth: toMmU(Number(e.target.value)) } },
              })} />
            <span className="prop-unit">{unit}</span>
          </PropField>
          <div className="prop-hint">
            Compr. total de B: {toU(g.segmentB.width)} {unit}
          </div>
        </PropGroup>
      )}
      <PropGroup title="Material">
        <PropField label="Material">
          <select value={el.material?.id ?? ''}
            onChange={(e) => {
              const m = MATERIALS.find((m) => m.id === e.target.value)
              if (m) store.updateElement(el.id, { material: m })
            }}>
            {MATERIALS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </PropField>
        <PropField label="Espessura">
          <select value={el.thickness}
            onChange={(e) => store.updateElement(el.id, { thickness: Number(e.target.value) })}>
            {[12, 15, 20, 30].map((t) => <option key={t} value={t}>{t} mm</option>)}
          </select>
        </PropField>
      </PropGroup>
      <PropGroup title="Área / Volume">
        {g.type === 'reta' && (
          <>
            <PropField label="Área">
              <span className="prop-value">{formatMeasurement(g.width * g.depth / 1_000_000, 'm', 3)} m²</span>
            </PropField>
            <PropField label="Comprimento × Profundidade">
              <span className="prop-value">{g.width} × {g.depth} mm</span>
            </PropField>
          </>
        )}
      </PropGroup>
    </>
  )
}

const SinkProps: React.FC<{ el: SinkElement } & PropsHelper> = ({ el, store }) => (
  <PropGroup title="Cuba">
    <PropField label="Tipo"><span className="prop-value">{el.sinkType}</span></PropField>
    <PropField label="Largura total">
      <input type="number" step={5} value={el.width}
        onChange={(e) => store.updateElement(el.id, { width: Number(e.target.value) })} />
      <span className="prop-unit">mm</span>
    </PropField>
    <PropField label="Prof. total">
      <input type="number" step={5} value={el.depth}
        onChange={(e) => store.updateElement(el.id, { depth: Number(e.target.value) })} />
      <span className="prop-unit">mm</span>
    </PropField>
  </PropGroup>
)

const CooktopProps: React.FC<{ el: CooktopElement } & PropsHelper> = ({ el, store }) => (
  <PropGroup title="Cooktop">
    <PropField label="Largura total">
      <input type="number" step={5} value={el.width}
        onChange={(e) => store.updateElement(el.id, { width: Number(e.target.value) })} />
      <span className="prop-unit">mm</span>
    </PropField>
    <PropField label="Prof. total">
      <input type="number" step={5} value={el.depth}
        onChange={(e) => store.updateElement(el.id, { depth: Number(e.target.value) })} />
      <span className="prop-unit">mm</span>
    </PropField>
    <PropField label="Recorte L">
      <input type="number" step={5} value={el.cutWidth}
        onChange={(e) => store.updateElement(el.id, { cutWidth: Number(e.target.value) })} />
      <span className="prop-unit">mm</span>
    </PropField>
    <PropField label="Recorte P">
      <input type="number" step={5} value={el.cutDepth}
        onChange={(e) => store.updateElement(el.id, { cutDepth: Number(e.target.value) })} />
      <span className="prop-unit">mm</span>
    </PropField>
    <PropField label="Exibição">
      <select
        value={el.displayMode || 'cooktop'}
        onChange={(e) => store.updateElement(el.id, { displayMode: e.target.value as 'cooktop' | 'cutout' })}
      >
        <option value="cooktop">Fogão completo</option>
        <option value="cutout">Apenas Nicho (Recorte)</option>
      </select>
    </PropField>
  </PropGroup>
)

const FaucetProps: React.FC<{ el: FaucetElement } & PropsHelper> = ({ el, store }) => (
  <PropGroup title="Furo">
    <PropField label="Diâmetro">
      <input type="number" step={1} value={el.diameter}
        onChange={(e) => store.updateElement(el.id, { diameter: Number(e.target.value) })} />
      <span className="prop-unit">mm</span>
    </PropField>
  </PropGroup>
)

const TrashProps: React.FC<{ el: TrashElement } & PropsHelper> = ({ el, store }) => (
  <PropGroup title="Lixeira">
    <PropField label="Formato"><span className="prop-value">{el.shape}</span></PropField>
    {el.shape === 'circular' && (
      <PropField label="Diâmetro">
        <input type="number" step={5} value={el.diameter ?? 250}
          onChange={(e) => store.updateElement(el.id, { diameter: Number(e.target.value) })} />
        <span className="prop-unit">mm</span>
      </PropField>
    )}
    {el.shape === 'retangular' && (
      <>
        <PropField label="Largura">
          <input type="number" step={5} value={el.width ?? 300}
            onChange={(e) => store.updateElement(el.id, { width: Number(e.target.value) })} />
          <span className="prop-unit">mm</span>
        </PropField>
        <PropField label="Profundidade">
          <input type="number" step={5} value={el.depth ?? 250}
            onChange={(e) => store.updateElement(el.id, { depth: Number(e.target.value) })} />
          <span className="prop-unit">mm</span>
        </PropField>
      </>
    )}
  </PropGroup>
)

const WetAreaProps: React.FC<{ el: WetAreaElement } & PropsHelper> = ({ el, store }) => (
  <PropGroup title="Área Molhada">
    <PropField label="Largura">
      <input type="number" step={10} value={el.width}
        onChange={(e) => store.updateElement(el.id, { width: Number(e.target.value) })} />
      <span className="prop-unit">mm</span>
    </PropField>
    <PropField label="Profundidade">
      <input type="number" step={10} value={el.depth}
        onChange={(e) => store.updateElement(el.id, { depth: Number(e.target.value) })} />
      <span className="prop-unit">mm</span>
    </PropField>
    <PropField label="Rebaixo">
      <input type="number" step={0.5} value={el.recess}
        onChange={(e) => store.updateElement(el.id, { recess: Number(e.target.value) })} />
      <span className="prop-unit">mm</span>
    </PropField>
  </PropGroup>
)

const BacksplashProps: React.FC<{ el: BacksplashElement } & PropsHelper> = ({ el, store }) => (
  <PropGroup title="Rodabanca">
    <PropField label="Altura">
      <input type="number" step={10} value={el.height}
        onChange={(e) => store.updateElement(el.id, { height: Number(e.target.value) })} />
      <span className="prop-unit">mm</span>
    </PropField>
    <PropField label="Comprimento">
      <input type="number" step={10} value={el.length}
        onChange={(e) => store.updateElement(el.id, { length: Number(e.target.value) })} />
      <span className="prop-unit">mm</span>
    </PropField>
    <PropField label="Espessura">
      <select value={el.thickness}
        onChange={(e) => store.updateElement(el.id, { thickness: Number(e.target.value) })}>
        {[12, 15, 20, 30].map((t) => <option key={t} value={t}>{t} mm</option>)}
      </select>
    </PropField>
  </PropGroup>
)

const CutoutProps: React.FC<{ el: CutoutElement } & PropsHelper> = ({ el, store }) => (
  <>
    <PropGroup title="Aparência">
      <PropField label="Nome">
        <input type="text" value={el.label ?? 'RECORTE'}
          onChange={(e) => store.updateElement(el.id, { label: e.target.value })} />
      </PropField>
      <PropField label="Cor">
        <input type="color" value={el.color ?? '#ffffff'}
          onChange={(e) => store.updateElement(el.id, { color: e.target.value })} style={{ padding: 0, height: 32 }} />
      </PropField>
    </PropGroup>
    <PropGroup title="Recorte">
      <PropField label="Formato">
        <select value={el.shape}
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
          }}>
          <option value="circular">Circular</option>
          <option value="retangular">Retangular</option>
          <option value="retangular-arredondado">Ret. Arredondado</option>
        </select>
      </PropField>
      {el.shape === 'circular' && (
        <PropField label="Diâmetro">
          <input type="number" step={5} value={el.diameter ?? 100}
            onChange={(e) => store.updateElement(el.id, { diameter: Number(e.target.value) })} />
          <span className="prop-unit">mm</span>
        </PropField>
      )}
      {(el.shape === 'retangular' || el.shape === 'retangular-arredondado') && (
        <>
          <PropField label="Largura">
            <input type="number" step={5} value={el.width ?? 200}
              onChange={(e) => store.updateElement(el.id, { width: Number(e.target.value) })} />
            <span className="prop-unit">mm</span>
          </PropField>
          <PropField label="Profundidade">
            <input type="number" step={5} value={el.depth ?? 200}
              onChange={(e) => store.updateElement(el.id, { depth: Number(e.target.value) })} />
            <span className="prop-unit">mm</span>
          </PropField>
        </>
      )}
      {el.shape === 'retangular-arredondado' && (
        <PropField label="Raio (Curva)">
          <input type="number" step={5} value={el.radius ?? 30}
            onChange={(e) => store.updateElement(el.id, { radius: Number(e.target.value) })} />
          <span className="prop-unit">mm</span>
        </PropField>
      )}
    </PropGroup>
  </>
)

// ─── Shared UI helpers ────────────────────────────────────────────────────────
const AnnotationProps: React.FC<{ el: AnnotationElement } & Omit<PropsHelper, 'unit'>> = ({ el, store }) => (
  <PropGroup title="Texto">
    <PropField label="Conteúdo">
      <input type="text" value={el.text}
        onChange={(e) => store.updateElement(el.id, { text: e.target.value })} />
    </PropField>
    <PropField label="Tamanho da Fonte">
      <input type="number" step={10} value={el.fontSize}
        onChange={(e) => store.updateElement(el.id, { fontSize: Number(e.target.value) })} />
      <span className="prop-unit">px</span>
    </PropField>
    <PropField label="Cor do Texto">
      <input type="color" value={el.color || '#333333'}
        onChange={(e) => store.updateElement(el.id, { color: e.target.value })} />
    </PropField>
    <PropField label="Estilo">
      <select value={el.weight || 'normal'} onChange={(e) => store.updateElement(el.id, { weight: e.target.value })}>
        <option value="normal">Normal</option>
        <option value="bold">Negrito</option>
      </select>
    </PropField>
    <PropField label="Realce">
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
        <input type="checkbox" checked={el.highlight || false}
          onChange={(e) => store.updateElement(el.id, { highlight: e.target.checked })} />
        <span style={{ fontSize: 13, color: 'var(--gray-7)' }}>Marca texto amarelo</span>
      </label>
    </PropField>
  </PropGroup>
)

const ArrowProps: React.FC<{ el: ArrowElement } & Omit<PropsHelper, 'unit'>> = ({ el, store }) => (
  <PropGroup title="Seta">
    <PropField label="Cor">
      <input type="color" value={el.color || '#ff0000'}
        onChange={(e) => store.updateElement(el.id, { color: e.target.value })} />
    </PropField>
  </PropGroup>
)


const PropGroup: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="prop-group">
    {title && <div className="prop-group__title">{title}</div>}
    {children}
  </div>
)

const PropField: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
  <div className="prop-field">
    <label className="prop-field__label">{label}</label>
    <div className="prop-field__control">{children}</div>
    {hint && <span className="prop-field__hint">{hint}</span>}
  </div>
)

const PropDivider: React.FC = () => <div className="prop-divider" />

const DeleteBtn: React.FC<{ ids: string[] }> = ({ ids }) => {
  const store = useEditorStore()
  return (
    <button id="prop-delete-btn" className="prop-delete-btn"
      onClick={() => store.removeElements(ids)}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
      Remover {ids.length > 1 ? `${ids.length} elementos` : 'elemento'}
    </button>
  )
}
