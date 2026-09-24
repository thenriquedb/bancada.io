import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Toolbar } from './Toolbar.tsx'
import { ElementPalette } from './ElementPalette.tsx'
import { Canvas } from './Canvas.tsx'
import { PropertiesPanel } from './PropertiesPanel.tsx'
import { StatusBar } from './StatusBar.tsx'
import { useKeyboard } from './interactions/keyboard.ts'
import { useEditorStore } from '../store/editorStore.ts'
import type { Project } from '../models/types.ts'

/**
 * Root editor component.
 */
export const Editor: React.FC = () => {
  const store = useEditorStore()
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

  useKeyboard()

  useEffect(() => {
    const container = canvasContainerRef.current
    if (!container) return
    const ro = new ResizeObserver((entries) => {
      const e = entries[0]
      if (e) setCanvasSize({ width: e.contentRect.width, height: e.contentRect.height })
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  // Auto-save on project changes
  useEffect(() => {
    const unsubscribe = useEditorStore.subscribe(
      (s) => s.project,
      () => { store.saveToLocalStorage() }
    )
    return unsubscribe
  }, [store])

  // Load from localStorage on first mount
  useEffect(() => {
    store.loadFromLocalStorage()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleNewProject = useCallback(() => {
    if (store.isDirty) {
      if (!confirm('Descartar alterações e criar novo projeto?')) return
    }
    store.newProject()
  }, [store])

  const handleExportJSON = useCallback(() => {
    const json = JSON.stringify(store.project, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${store.project.name.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [store])

  const handleImportJSON = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const project = JSON.parse(ev.target?.result as string) as Project
          store.loadProject(project)
        } catch {
          alert('Arquivo JSON inválido.')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [store])

  const handleExportPDF = useCallback(() => {
    alert('Exportação de PDF será implementada na Fase 9.')
  }, [])

  return (
    <div className="editor-layout" role="main">
      <Toolbar
        onNewProject={handleNewProject}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        onExportPDF={handleExportPDF}
        canvasWidth={canvasSize.width}
        canvasHeight={canvasSize.height}
      />

      <div className="editor-body">
        <ElementPalette />
        <div ref={canvasContainerRef} className="canvas-container">
          <Canvas />
        </div>
        <PropertiesPanel />
      </div>

      <StatusBar />
    </div>
  )
}
