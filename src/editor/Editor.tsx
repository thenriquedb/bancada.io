import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Toolbar } from './Toolbar.tsx'
import { ElementPalette } from './ElementPalette.tsx'
import { Canvas } from './Canvas.tsx'
import { PropertiesPanel } from './PropertiesPanel.tsx'
import { StatusBar } from './StatusBar.tsx'
import { useKeyboard } from './interactions/keyboard.ts'
import { useEditorStore, selectOpenDialog, selectElements, selectSettings } from '../store/editorStore.ts'
import { ValidationWarnings } from '../components/ValidationWarnings.tsx'
import { NewCountertopDialog } from '../components/dialogs/NewCountertopDialog.tsx'
import { NewLShapeDialog } from '../components/dialogs/NewLShapeDialog.tsx'
import { NewSinkDialog } from '../components/dialogs/NewSinkDialog.tsx'
import { NewCooktopDialog } from '../components/dialogs/NewCooktopDialog.tsx'
import { NewFaucetDialog } from '../components/dialogs/NewFaucetDialog.tsx'
import { NewTrashDialog } from '../components/dialogs/NewTrashDialog.tsx'
import { NewWetAreaDialog } from '../components/dialogs/NewWetAreaDialog.tsx'
import { NewBacksplashDialog } from '../components/dialogs/NewBacksplashDialog.tsx'
import { validateElements } from './geometry/validation.ts'
import { exportProjectPDF } from '../pdf/generator.ts'
import type { Project } from '../models/types.ts'

export const Editor: React.FC = () => {
  const store          = useEditorStore()
  const openDialog     = useEditorStore(selectOpenDialog)
  const elements       = useEditorStore(selectElements)
  const settings       = useEditorStore(selectSettings)
  const containerRef   = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

  useKeyboard()

  // ── Resize observer ────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const e = entries[0]
      if (e) setCanvasSize({ width: e.contentRect.width, height: e.contentRect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Auto-save ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = useEditorStore.subscribe(
      (s) => s.project,
      () => store.saveToLocalStorage()
    )
    return unsub
  }, [store])

  // ── Load on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    store.loadFromLocalStorage()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Validation ─────────────────────────────────────────────────────────────
  const warnings = useMemo(() => validateElements(elements), [elements])

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleNewProject = useCallback(() => {
    if (store.isDirty && !confirm('Descartar alterações e criar novo projeto?')) return
    store.newProject()
  }, [store])

  const handleExportJSON = useCallback(() => {
    const json = JSON.stringify(store.project, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${store.project.name.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [store])

  const handleImportJSON = useCallback(() => {
    const input    = document.createElement('input')
    input.type     = 'file'
    input.accept   = '.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try { store.loadProject(JSON.parse(ev.target?.result as string) as Project) }
        catch { alert('Arquivo JSON inválido.') }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [store])

  const handleExportPDF = useCallback(async () => {
    try {
      await exportProjectPDF(store.project)
    } catch (err) {
      console.error(err)
      alert('Erro ao gerar PDF. Verifique o console para detalhes.')
    }
  }, [store])

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

        <div ref={containerRef} className="canvas-container">
          <Canvas />
          {warnings.length > 0 && <ValidationWarnings warnings={warnings} />}
        </div>

        <PropertiesPanel />
      </div>

      <StatusBar />

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}
      {openDialog === 'new-countertop' && <NewCountertopDialog />}
      {openDialog === 'new-lshape'     && <NewLShapeDialog />}
      {openDialog === 'new-sink'       && <NewSinkDialog />}
      {openDialog === 'new-cooktop'    && <NewCooktopDialog />}
      {openDialog === 'new-faucet'     && <NewFaucetDialog />}
      {openDialog === 'new-trash'      && <NewTrashDialog />}
      {openDialog === 'new-wet-area'   && <NewWetAreaDialog />}
      {openDialog === 'new-backsplash' && <NewBacksplashDialog />}
    </div>
  )
}
