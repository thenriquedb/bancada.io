import React, { useState } from 'react'
import type { AnnotationElement } from '../../models/types.ts'
import { useEditorStore } from '../../store/editorStore.ts'

type AnnotationRendererProps = {
  element: AnnotationElement
  selected: boolean
  hovered: boolean
  zoom: number
}

export const AnnotationRenderer: React.FC<AnnotationRendererProps> = ({ element, selected, hovered, zoom }) => {
  const { position, text, fontSize, rotation = 0 } = element
  const store = useEditorStore()

  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(text)

  // We can roughly estimate text width to create a proper hit area
  const estWidth = Math.max(text.length, editText.length) * (fontSize * 0.55) + 10
  const estHeight = fontSize * 1.2
  
  // Hit area should be slightly larger for easy clicking, scaled with zoom
  const hitPadding = 10 / zoom

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setEditText(text)
  }

  const saveAndClose = () => {
    if (isEditing) {
      store.pushHistory()
      store.updateElement(element.id, { text: editText.trim() || 'Texto' })
      setIsEditing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation() // prevent canvas keyboard handlers from taking over
    if (e.key === 'Enter') {
      e.preventDefault()
      saveAndClose()
    }
    if (e.key === 'Escape') {
      setIsEditing(false)
      setEditText(text)
    }
  }

  return (
    <g 
      transform={`translate(${position.x}, ${position.y}) rotate(${rotation})`}
      onDoubleClick={handleDoubleClick}
    >
      {/* Hit Area */}
      <rect
        x={-hitPadding}
        y={-fontSize * 0.8 - hitPadding}
        width={estWidth + hitPadding * 2}
        height={estHeight + hitPadding * 2}
        fill="transparent"
        stroke={selected && !isEditing ? '#1971c2' : hovered && !isEditing ? '#ccc' : 'transparent'}
        strokeWidth={1 / zoom}
        strokeDasharray="4 4"
      />
      
      {isEditing ? (
        <foreignObject
          x={-hitPadding}
          y={-fontSize * 0.8 - hitPadding}
          width={Math.max(estWidth + hitPadding * 2, 400)} // Ensure we have enough width to type
          height={estHeight + hitPadding * 2 + 10}
        >
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={saveAndClose}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{
              width: '100%',
              height: '100%',
              fontSize: `${fontSize}px`,
              fontFamily: 'Inter, sans-serif',
              background: 'rgba(255, 255, 255, 0.9)',
              color: '#333',
              border: `1px dashed #1971c2`,
              outline: 'none',
              padding: 0,
              margin: 0,
              boxSizing: 'border-box'
            }}
          />
        </foreignObject>
      ) : (
        <text
          x={0}
          y={0}
          fontSize={fontSize}
          fontFamily="Inter, sans-serif"
          fill="#333"
          style={{ userSelect: 'none' }}
        >
          {text}
        </text>
      )}
    </g>
  )
}
