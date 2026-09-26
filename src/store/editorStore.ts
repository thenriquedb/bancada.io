import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  Project,
  ProjectElement,
  ProjectSettings,
  Unit,
} from '../models/types.ts'
import { generateId, nowISO } from '../utils/helpers.ts'
import { DEFAULT_MATERIAL } from '../models/materials.ts'
import { getElementBounds, isInsideBounds } from '../editor/geometry/bounds.ts'

// ─── Viewport ────────────────────────────────────────────────────────────────

type Viewport = {
  panX: number
  panY: number
  zoom: number
}

// ─── Editor tool ─────────────────────────────────────────────────────────────

export type EditorTool = 'select' | 'pan'

// ─── Dialogs ─────────────────────────────────────────────────────────────────

type EditorDialog =
  | 'new-countertop'
  | 'new-lshape'
  | 'new-sink'
  | 'new-cooktop'
  | 'new-faucet'
  | 'new-trash'
  | 'new-wet-area'
  | 'new-backsplash'
  | 'new-cutout'
  | 'new-annotation'

// ─── History ─────────────────────────────────────────────────────────────────

type HistoryEntry = { elements: ProjectElement[] }
const MAX_HISTORY = 50

// ─── Store ───────────────────────────────────────────────────────────────────

type EditorState = {
  project: Project
  viewport: Viewport
  activeTool: EditorTool
  selectedIds: string[]
  hoveredId: string | null
  openDialog: EditorDialog | null
  pendingDelete: { idsToDelete: Set<string>; additionalCount: number } | null
  clipboard: ProjectElement[]
  past: HistoryEntry[]
  future: HistoryEntry[]
  isDirty: boolean
}

type EditorActions = {
  // Project
  newProject: (name?: string) => void
  loadProject: (project: Project) => void
  updateProjectMeta: (meta: Partial<Pick<Project, 'name' | 'clientName' | 'environment' | 'material' | 'thickness'>>) => void
  updateSettings: (settings: Partial<ProjectSettings>) => void
  setUnit: (unit: Unit) => void

  // Elements
  addElement: (element: ProjectElement) => void
  updateElement: (id: string, patch: Partial<ProjectElement>) => void
  updateElements: (updates: { id: string; patch: Partial<ProjectElement> }[]) => void
  removeElement: (id: string) => void
  removeElements: (ids: string[]) => void
  confirmDelete: () => void
  cancelDelete: () => void
  duplicateElements: (ids: string[]) => void

  // Selection
  setSelectedIds: (ids: string[]) => void
  selectAll: () => void
  clearSelection: () => void
  setHoveredId: (id: string | null) => void

  // Dialog
  setOpenDialog: (dialog: EditorDialog | null) => void

  // Clipboard
  copyToClipboard: (ids: string[]) => void
  pasteFromClipboard: () => void

  // Viewport
  setViewport: (vp: Partial<Viewport>) => void
  setZoom: (zoom: number, originX?: number, originY?: number) => void
  fitToScreen: (canvasWidth: number, canvasHeight: number) => void
  resetZoom: () => void

  // Tool
  setActiveTool: (tool: EditorTool) => void

  // History
  pushHistory: () => void
  undo: () => void
  redo: () => void

  // Persistence
  saveToLocalStorage: () => void
  loadFromLocalStorage: () => boolean
}

export type EditorStore = EditorState & EditorActions

// ─── Default project factory ──────────────────────────────────────────────────

function createDefaultProject(): Project {
  return {
    version: 1,
    id: generateId('proj'),
    name: 'Novo Projeto',
    material: DEFAULT_MATERIAL,
    thickness: 20,
    elements: [],
    layers: [
      { id: 'layer-bancada',  name: 'Bancada',   visible: true, locked: false, elementIds: [] },
      { id: 'layer-recortes', name: 'Recortes',  visible: true, locked: false, elementIds: [] },
      { id: 'layer-cotas',    name: 'Cotas',     visible: true, locked: false, elementIds: [] },
      { id: 'layer-anotacoes',name: 'Anotações', visible: true, locked: false, elementIds: [] },
    ],
    settings: {
      unit: 'cm',
      showGrid: true,
      snapToGrid: true,
      gridSpacing: 100,
      showDimensions: true,
    },
    createdAt: nowISO(),
    updatedAt: nowISO(),
  }
}

const LOCALSTORAGE_KEY = 'bancada-io-project'

// ─── Store implementation ─────────────────────────────────────────────────────

export const useEditorStore = create<EditorStore>()(
  subscribeWithSelector((set, get) => ({
    project: createDefaultProject(),
    viewport: { panX: 40, panY: 40, zoom: 0.5 },
    activeTool: 'select',
    selectedIds: [],
    hoveredId: null,
    openDialog: null,
    clipboard: [],
    past: [],
    future: [],
    isDirty: false,

    // ── Project ───────────────────────────────────────────────────────────
    newProject: (name) => {
      const p = createDefaultProject()
      if (name) p.name = name
      set({ project: p, selectedIds: [], past: [], future: [], isDirty: false, pendingDelete: null })
    },

    loadProject: (project) => {
      set({ project, selectedIds: [], past: [], future: [], isDirty: false, pendingDelete: null })
    },

    updateProjectMeta: (meta) =>
      set((s) => ({ project: { ...s.project, ...meta, updatedAt: nowISO() }, isDirty: true })),

    updateSettings: (settings) =>
      set((s) => ({
        project: { ...s.project, settings: { ...s.project.settings, ...settings }, updatedAt: nowISO() },
      })),

    setUnit: (unit) =>
      set((s) => ({
        project: { ...s.project, settings: { ...s.project.settings, unit }, updatedAt: nowISO() },
      })),

    // ── Elements ──────────────────────────────────────────────────────────
    addElement: (element) => {
      get().pushHistory()
      set((s) => ({
        project: { ...s.project, elements: [...s.project.elements, element], updatedAt: nowISO() },
        selectedIds: [element.id],
        isDirty: true,
      }))
    },

    updateElement: (id, patch) =>
      set((s) => ({
        project: {
          ...s.project,
          elements: s.project.elements.map((el) =>
            el.id === id ? ({ ...el, ...patch } as ProjectElement) : el
          ),
          updatedAt: nowISO(),
        },
        isDirty: true,
      })),

    updateElements: (updates) =>
      set((s) => {
        const updateMap = new Map(updates.map(u => [u.id, u.patch]))
        return {
          project: {
            ...s.project,
            elements: s.project.elements.map((el) => {
              const patch = updateMap.get(el.id)
              return patch ? ({ ...el, ...patch } as ProjectElement) : el
            }),
            updatedAt: nowISO(),
          },
          isDirty: true,
        }
      }),

    removeElement: (id) => {
      get().removeElements([id])
    },

    removeElements: (ids) => {
      const { elements } = get().project
      const idsToDelete = new Set(ids)
      let added = true

      while (added) {
        added = false
        elements.forEach((el) => {
          if (idsToDelete.has(el.id)) return
          if (!('parentId' in el)) return

          let pId = (el as any).parentId
          if (el.type !== 'countertop' && el.type !== 'wet-area' && el.type !== 'backsplash') {
            const containingWetAreas = elements.filter(p => p.type === 'wet-area' && (() => {
              const cb = getElementBounds(el)
              const pb = getElementBounds(p)
              return cb && pb && isInsideBounds(cb, pb)
            })())
            if (containingWetAreas.length > 0) {
              pId = containingWetAreas[0].id
            }
          }

          if (idsToDelete.has(pId)) {
            idsToDelete.add(el.id)
            added = true
          }
        })
      }

      const additionalCount = idsToDelete.size - ids.length
      if (additionalCount > 0) {
        set({ pendingDelete: { idsToDelete, additionalCount } })
        return
      }

      get().pushHistory()
      set((s) => ({
        project: { ...s.project, elements: s.project.elements.filter((el) => !idsToDelete.has(el.id)), updatedAt: nowISO() },
        selectedIds: s.selectedIds.filter((sid) => !idsToDelete.has(sid)),
        isDirty: true,
      }))
    },

    confirmDelete: () => {
      const { pendingDelete } = get()
      if (!pendingDelete) return
      const { idsToDelete } = pendingDelete
      get().pushHistory()
      set((s) => ({
        project: { ...s.project, elements: s.project.elements.filter((el) => !idsToDelete.has(el.id)), updatedAt: nowISO() },
        selectedIds: s.selectedIds.filter((sid) => !idsToDelete.has(sid)),
        isDirty: true,
        pendingDelete: null,
      }))
    },

    cancelDelete: () => set({ pendingDelete: null }),

    duplicateElements: (ids) => {
      get().pushHistory()
      const { elements } = get().project
      const originals = elements.filter((el) => ids.includes(el.id))
      const offset = 20
      const copies = originals.map((el) => ({
        ...el,
        id: generateId(el.type),
        position: { x: el.position.x + offset, y: el.position.y + offset },
      })) as ProjectElement[]
      set((s) => ({
        project: { ...s.project, elements: [...s.project.elements, ...copies], updatedAt: nowISO() },
        selectedIds: copies.map((c) => c.id),
        isDirty: true,
      }))
    },

    // ── Selection ─────────────────────────────────────────────────────────
    setSelectedIds: (ids) => set({ selectedIds: ids }),
    selectAll: () => set((s) => ({ selectedIds: s.project.elements.map((el) => el.id) })),
    clearSelection: () => set({ selectedIds: [] }),
    setHoveredId: (id) => set({ hoveredId: id }),

    // ── Dialog ────────────────────────────────────────────────────────────
    setOpenDialog: (dialog) => set({ openDialog: dialog }),

    // ── Clipboard ─────────────────────────────────────────────────────────
    copyToClipboard: (ids) => {
      const { elements } = get().project
      const items = elements.filter((el) => ids.includes(el.id))
      set({ clipboard: items })
    },

    pasteFromClipboard: () => {
      const { clipboard } = get()
      if (clipboard.length === 0) return
      get().pushHistory()
      const offset = 30
      const copies = clipboard.map((el) => ({
        ...el,
        id: generateId(el.type),
        position: { x: el.position.x + offset, y: el.position.y + offset },
      })) as ProjectElement[]
      set((s) => ({
        project: { ...s.project, elements: [...s.project.elements, ...copies], updatedAt: nowISO() },
        selectedIds: copies.map((c) => c.id),
        isDirty: true,
      }))
    },

    // ── Viewport ──────────────────────────────────────────────────────────
    setViewport: (vp) => set((s) => ({ viewport: { ...s.viewport, ...vp } })),

    setZoom: (zoom, originX = 0, originY = 0) => {
      const clamped = Math.min(Math.max(zoom, 0.05), 10)
      set((s) => {
        const scale = clamped / s.viewport.zoom
        return {
          viewport: {
            zoom: clamped,
            panX: originX - (originX - s.viewport.panX) * scale,
            panY: originY - (originY - s.viewport.panY) * scale,
          },
        }
      })
    },

    fitToScreen: (canvasWidth, canvasHeight) => {
      const { elements } = get().project
      if (elements.length === 0) {
        set({ viewport: { panX: canvasWidth / 2 - 200, panY: canvasHeight / 2 - 150, zoom: 0.4 } })
        return
      }
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      elements.forEach((el) => {
        minX = Math.min(minX, el.position.x)
        minY = Math.min(minY, el.position.y)
        if (el.type === 'countertop') {
          const g = el.geometry
          if (g.type === 'reta') {
            maxX = Math.max(maxX, el.position.x + g.width)
            maxY = Math.max(maxY, el.position.y + g.depth)
          } else if (g.type === 'l-shape') {
            maxX = Math.max(maxX, el.position.x + Math.max(g.segmentA.width, g.segmentB.width))
            maxY = Math.max(maxY, el.position.y + g.segmentA.depth + g.segmentB.depth)
          }
        }
      })
      if (!isFinite(minX)) return
      const padding = 80
      const contentW = maxX - minX
      const contentH = maxY - minY
      const zoom = Math.min(
        (canvasWidth - padding * 2) / (contentW || 1),
        (canvasHeight - padding * 2) / (contentH || 1),
        2
      )
      set({ viewport: { zoom, panX: padding - minX * zoom, panY: padding - minY * zoom } })
    },

    resetZoom: () => set((s) => ({ viewport: { ...s.viewport, zoom: 1 } })),

    // ── Tool ─────────────────────────────────────────────────────────────
    setActiveTool: (tool) => set({ activeTool: tool }),

    // ── History ───────────────────────────────────────────────────────────
    pushHistory: () =>
      set((s) => ({
        past: [...s.past.slice(-MAX_HISTORY + 1), { elements: s.project.elements }],
        future: [],
      })),

    undo: () => {
      const { past, project } = get()
      if (past.length === 0) return
      const previous = past[past.length - 1]
      set((s) => ({
        past: s.past.slice(0, -1),
        future: [{ elements: project.elements }, ...s.future],
        project: { ...project, elements: previous.elements, updatedAt: nowISO() },
        selectedIds: [],
      }))
    },

    redo: () => {
      const { future, project } = get()
      if (future.length === 0) return
      const next = future[0]
      set((s) => ({
        past: [...s.past, { elements: project.elements }],
        future: s.future.slice(1),
        project: { ...project, elements: next.elements, updatedAt: nowISO() },
        selectedIds: [],
      }))
    },

    // ── Persistence ───────────────────────────────────────────────────────
    saveToLocalStorage: () => {
      try { localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(get().project)) }
      catch { console.warn('Failed to save to localStorage') }
    },

    loadFromLocalStorage: () => {
      try {
        const raw = localStorage.getItem(LOCALSTORAGE_KEY)
        if (!raw) return false
        get().loadProject(JSON.parse(raw) as Project)
        return true
      } catch { return false }
    },
  }))
)

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectProject      = (s: EditorStore) => s.project
export const selectElements     = (s: EditorStore) => s.project.elements
export const selectSettings     = (s: EditorStore) => s.project.settings
export const selectViewport     = (s: EditorStore) => s.viewport
export const selectActiveTool   = (s: EditorStore) => s.activeTool
export const selectSelectedIds  = (s: EditorStore) => s.selectedIds
export const selectHoveredId    = (s: EditorStore) => s.hoveredId
export const selectOpenDialog   = (s: EditorStore) => s.openDialog
export const selectCanUndo      = (s: EditorStore) => s.past.length > 0
export const selectCanRedo      = (s: EditorStore) => s.future.length > 0
export const selectIsDirty      = (s: EditorStore) => s.isDirty
