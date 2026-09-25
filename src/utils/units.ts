import type { Unit } from '../models/types.ts'

// ─── Unit conversion ─────────────────────────────────────────────────────────

/** Convert millimeters to centimeters */
function mmToCm(mm: number): number {
  return mm / 10
}

/** Convert centimeters to millimeters */
function cmToMm(cm: number): number {
  return cm * 10
}

/** Convert millimeters to meters */
function mmToM(mm: number): number {
  return mm / 1000
}

/** Convert meters to millimeters */
function mToMm(m: number): number {
  return m * 1000
}

/** Convert any unit value to millimeters */
export function toMm(value: number, unit: Unit): number {
  switch (unit) {
    case 'mm': return value
    case 'cm': return cmToMm(value)
    case 'm':  return mToMm(value)
  }
}

/** Convert millimeters to any unit */
export function fromMm(mm: number, unit: Unit): number {
  switch (unit) {
    case 'mm': return mm
    case 'cm': return mmToCm(mm)
    case 'm':  return mmToM(mm)
  }
}

/** Format a mm value for display in the given unit */
export function formatMeasurement(mm: number, unit: Unit, decimals?: number): string {
  const value = fromMm(mm, unit)
  const d = decimals ?? (unit === 'm' ? 3 : unit === 'cm' ? 1 : 0)
  return `${value.toFixed(d)} ${unit}`
}


