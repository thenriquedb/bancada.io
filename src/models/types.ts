// ─── Primitive types ────────────────────────────────────────────────────────

export type Point = {
  x: number // mm
  y: number // mm
}

export type Size = {
  width: number  // mm
  height: number // mm
}

export type Rect = Point & Size

// ─── Units ──────────────────────────────────────────────────────────────────

export type Unit = 'mm' | 'cm' | 'm'

// ─── Materials ──────────────────────────────────────────────────────────────

export type MaterialCategory = 'granito' | 'marmore' | 'quartzito' | 'porcelana' | 'outro'

export type Material = {
  id: string
  name: string
  category: MaterialCategory
  custom?: boolean
}

// ─── Thickness ──────────────────────────────────────────────────────────────

export const THICKNESS_OPTIONS = [12, 15, 20, 30] as const
export type Thickness = (typeof THICKNESS_OPTIONS)[number]

// ─── Countertop geometry ─────────────────────────────────────────────────────

export type CountertopType = 'reta' | 'l-shape' | 'u-shape'

export type CountertopGeometry =
  | {
      type: 'reta'
      width: number  // mm
      depth: number  // mm
    }
  | {
      type: 'l-shape'
      segmentA: { width: number; depth: number }
      segmentB: { width: number; depth: number }
    }

// ─── Element union ──────────────────────────────────────────────────────────

export type BaseElement = {
  id: string
  position: Point
  locked: boolean
  visible: boolean
  dimSelf?: boolean
  dimParent?: boolean
  dimRoot?: boolean
  label?: string
  rotation?: number // in degrees
}

export type CountertopElement = BaseElement & {
  type: 'countertop'
  geometry: CountertopGeometry
  thickness: number // mm
  material?: Material
}

export type SinkElement = BaseElement & {
  type: 'sink'
  width: number    // mm
  depth: number    // mm
  parentId: string // countertop or wet area element id
}

export type CooktopElement = BaseElement & {
  type: 'cooktop'
  width: number     // mm
  depth: number     // mm
  parentId: string
}

export type FaucetElement = BaseElement & {
  type: 'faucet'
  diameter: number // mm
  parentId: string
}

export type TrashElement = BaseElement & {
  type: 'trash'
  shape: 'circular' | 'retangular'
  diameter?: number // mm – when circular
  width?: number    // mm – when retangular
  depth?: number    // mm – when retangular
  parentId: string
}

export type WetAreaElement = BaseElement & {
  type: 'wet-area'
  width: number    // mm
  depth: number    // mm
  recess: number   // mm – rebaixo
  parentId?: string
}

export type BacksplashElement = BaseElement & {
  type: 'backsplash'
  height: number     // mm
  thickness: number  // mm
  length: number     // mm
  parentId: string
}

export type DimensionElement = BaseElement & {
  type: 'dimension'
  orientation: 'horizontal' | 'vertical' | 'aligned'
  startPoint: Point
  endPoint: Point
  offset: number // mm – distance from line to dim line
  auto: boolean
}

export type AnnotationElement = BaseElement & {
  type: 'annotation'
  text: string
  fontSize: number
}

export type ProjectElement =
  | CountertopElement
  | SinkElement
  | CooktopElement
  | FaucetElement
  | TrashElement
  | WetAreaElement
  | BacksplashElement
  | DimensionElement
  | AnnotationElement

// ─── Layer ──────────────────────────────────────────────────────────────────

export type Layer = {
  id: string
  name: string
  visible: boolean
  locked: boolean
  elementIds: string[]
}

// ─── Project settings ────────────────────────────────────────────────────────

export type GridSpacing = 10 | 50 | 100 | 500

export type RoomBounds = {
  width: number   // mm – room width
  height: number  // mm – room height
  show: boolean   // whether to render the room boundary
}

export type ProjectSettings = {
  unit: Unit
  showGrid: boolean
  snapToGrid: boolean
  gridSpacing: GridSpacing
  showDimensions: boolean
  roomBounds?: RoomBounds
}

// ─── Project ─────────────────────────────────────────────────────────────────

export type Project = {
  version: number
  id: string
  name: string
  clientName?: string
  environment?: string
  material?: Material
  thickness: Thickness
  elements: ProjectElement[]
  layers: Layer[]
  settings: ProjectSettings
  createdAt: string
  updatedAt: string
}

// ─── Validation ──────────────────────────────────────────────────────────────

export type WarningType =
  | 'element-outside-countertop'
  | 'element-too-close-to-edge'
  | 'elements-overlapping'
  | 'cut-too-large'

export type ValidationWarning = {
  type: WarningType
  severity: 'warning' | 'error'
  message: string
  elementIds: string[]
}
