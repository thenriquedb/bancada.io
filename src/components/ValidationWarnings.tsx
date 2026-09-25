import React from 'react'
import type { ValidationWarning } from '../models/types.ts'

type ValidationWarningsProps = {
  warnings: ValidationWarning[]
}

export const ValidationWarnings: React.FC<ValidationWarningsProps> = ({ warnings }) => {
  const displayWarnings = warnings.filter(w => w.type !== 'elements-overlapping')
  if (displayWarnings.length === 0) return null

  return (
    <div className="validation-warnings" role="alert" aria-live="polite">
      {displayWarnings.map((w, i) => (
        <div key={i} className={`validation-warning validation-warning--${w.severity}`}>
          <span className="validation-warning__icon">
            {w.severity === 'error' ? '✕' : '⚠'}
          </span>
          <span className="validation-warning__msg">{w.message}</span>
        </div>
      ))}
    </div>
  )
}
