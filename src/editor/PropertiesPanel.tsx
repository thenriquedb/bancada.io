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
  EdgeFinish,
} from '../models/types.ts'

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
    dimension: 'Cota', annotation: 'Anotação',
  }

  return (
    <aside className="properties-panel" aria-label={`Propriedades: ${typeLabel[element.type]}`}>
      <div className="properties-header">
        <h3 className="properties-title">{typeLabel[element.type]}</h3>
        <span className="properties-type-tag">{element.type}</span>
      </div>
      <div className="properties-body">
        {/* Position */}
        <PropGroup title="Posição">
          <PropField label="X">
            <input id="ep-x" type="number" step={1} value={Math.round(element.position.x)}
              onChange={(e) => updatePos('x', e.target.value)} />
            <span className="prop-unit">{unit}</span>
          </PropField>
          <PropField label="Y">
            <input id="ep-y" type="number" step={1} value={Math.round(element.position.y)}
              onChange={(e) => updatePos('y', e.target.value)} />
            <span className="prop-unit">{unit}</span>
          </PropField>
        </PropGroup>

        {/* Type-specific */}
        {element.type === 'countertop' && <CountertopProps el={element} unit={unit} store={store} />}
        {element.type === 'sink'       && <SinkProps el={element} unit={unit} store={store} />}
        {element.type === 'cooktop'    && <CooktopProps el={element} unit={unit} store={store} />}
        {element.type === 'faucet'     && <FaucetProps el={element} unit={unit} store={store} />}
        {element.type === 'trash'      && <TrashProps el={element} unit={unit} store={store} />}
        {element.type === 'wet-area'   && <WetAreaProps el={element} unit={unit} store={store} />}
        {element.type === 'backsplash' && <BacksplashProps el={element} unit={unit} store={store} />}

        <PropDivider />
        <DeleteBtn ids={[element.id]} />
      </div>
    </aside>
  )
}

// ─── Type-specific property editors ──────────────────────────────────────────

type PropsHelper = { unit: string; store: ReturnType<typeof useEditorStore> }

const CountertopProps: React.FC<{ el: CountertopElement } & PropsHelper> = ({ el, unit, store }) => {
  // Unit helpers for this panel (values in model are always mm)
  const toU  = (mm: number) => parseFloat(fromMm(mm, unit as 'mm' | 'cm' | 'm').toFixed(unit === 'mm' ? 0 : 1))
  const toMmU = (v: number) => Math.round(toMm(v, unit as 'mm' | 'cm' | 'm'))
  const g = el.geometry
  const EDGE_OPTIONS: EdgeFinish[] = ['reto', 'polido', 'boleado', 'chanfrado', '45graus', 'meia-esquadria', 'encostada-parede', 'nenhum']

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
      <PropGroup title="Acabamentos de Borda">
        {(['front', 'back', 'left', 'right'] as const).map((side) => {
          const labels: Record<string, string> = { front: 'Frente', back: 'Fundo', left: 'Esq.', right: 'Dir.' }
          return (
            <PropField key={side} label={labels[side]}>
              <select value={el.edgeFinishes[side]}
                onChange={(e) => store.updateElement(el.id, {
                  edgeFinishes: { ...el.edgeFinishes, [side]: e.target.value as EdgeFinish },
                })}>
                {EDGE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </PropField>
          )
        })}
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

// ─── Shared UI helpers ────────────────────────────────────────────────────────

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
      🗑 Remover {ids.length > 1 ? `${ids.length} elementos` : 'elemento'}
    </button>
  )
}
