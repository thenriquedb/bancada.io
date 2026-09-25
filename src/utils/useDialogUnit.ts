import { useEditorStore } from '../store/editorStore.ts'
import { toMm, fromMm } from './units.ts'
import type { Unit } from '../models/types.ts'

/**
 * Hook for dialog inputs that need unit-aware display and mm storage.
 *
 * Usage:
 *   const { unit, toMm, fromMm, fmt } = useDialogUnit()
 *   // user inputs in `unit`, stored internally as mm
 */
export function useDialogUnit() {
  const unit = useEditorStore((s) => s.project.settings.unit)

  return {
    unit,
    /** Convert a display-unit value to mm for storage */
    toMm: (v: number) => toMm(v, unit),
    /** Convert a mm storage value to display-unit for UI */
    fromMm: (mm: number) => fromMm(mm, unit),
    /** Round to a reasonable number of decimals for the current unit */
    round: (mm: number) => {
      const v = fromMm(mm, unit)
      if (unit === 'm')  return Math.round(v * 1000) / 1000
      if (unit === 'cm') return Math.round(v * 10) / 10
      return Math.round(v)
    },
  }
}

