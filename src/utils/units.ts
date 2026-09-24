import type { Unit } from '../models/types.ts'

// ─── Unit conversion ─────────────────────────────────────────────────────────

/** Convert millimeters to centimeters */
export function mmToCm(mm: number): number {
  return mm / 10
}

/** Convert centimeters to millimeters */
export function cmToMm(cm: number): number {
  return cm * 10
}

/** Convert millimeters to meters */
export function mmToM(mm: number): number {
  return mm / 1000
}

/** Convert meters to millimeters */
export function mToMm(m: number): number {
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

/** Parse a string like "3600", "360 cm", "3.6m" → mm */
export function parseMeasurement(input: string, defaultUnit: Unit = 'mm'): number | null {
  const trimmed = input.trim()
  const match = trimmed.match(/^([\d.,]+)\s*(mm|cm|m)?$/)
  if (!match) return null
  const rawValue = parseFloat(match[1].replace(',', '.'))
  if (isNaN(rawValue)) return null
  const unit = (match[2] as Unit | undefined) ?? defaultUnit
  return toMm(rawValue, unit)
}
