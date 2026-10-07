import { useEffect } from 'react'
import { useEditorStore } from '../../store/editorStore.ts'

export function useKeyboard() {
  const store = useEditorStore()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta   = e.ctrlKey || e.metaKey
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return

      // Tools
      if (!meta && e.key === 'v') { store.setActiveTool('select'); return }
      if (!meta && e.key === 'h') { store.setActiveTool('pan'); return }
      if (!meta && (e.key === 't' || e.key === 'T')) { store.setActiveTool('annotation'); return }
      if (!meta && (e.key === 'a' || e.key === 'A')) { store.setActiveTool('arrow'); return }

      if (e.key === 'Escape') {
        store.clearSelection()
        store.setActiveTool('select')
        store.setOpenDialog(null)
        return
      }

      // Selection
      if (meta && e.key === 'a') { e.preventDefault(); store.selectAll(); return }

      // Delete
      if ((e.key === 'Delete' || e.key === 'Backspace') && store.selectedIds.length > 0) {
        store.removeElements(store.selectedIds)
        return
      }

      // Undo / Redo
      if (meta && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); store.undo(); return }
      if (meta && e.shiftKey && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); store.redo(); return }
      if (meta && e.key === 'y') { e.preventDefault(); store.redo(); return }

      // Save
      if (meta && !e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        store.saveToLocalStorage()
        return
      }

      // Copy / Cut / Paste
      if (meta && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault()
        if (store.selectedIds.length > 0) store.copyToClipboard(store.selectedIds)
        return
      }
      if (meta && (e.key === 'x' || e.key === 'X')) {
        e.preventDefault()
        if (store.selectedIds.length > 0) {
          store.copyToClipboard(store.selectedIds)
          store.removeElements(store.selectedIds)
        }
        return
      }
      if (meta && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault()
        store.pasteFromClipboard()
        return
      }

      // Duplicate
      if (meta && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault()
        if (store.selectedIds.length > 0) store.duplicateElements(store.selectedIds)
        return
      }

      // Zoom
      if (meta && (e.key === '=' || e.key === '+')) { e.preventDefault(); store.setZoom(store.viewport.zoom * 1.2); return }
      if (meta && e.key === '-')  { e.preventDefault(); store.setZoom(store.viewport.zoom * 0.8); return }
      if (meta && e.key === '0')  { e.preventDefault(); store.resetZoom(); return }

      // Arrow nudge (10mm)
      const nudge = e.shiftKey ? 100 : 10
      if (store.selectedIds.length > 0 && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
        e.preventDefault()
        store.selectedIds.forEach((id: string) => {
          const el = store.project.elements.find((el) => el.id === id)
          if (!el) return
          const pos = { ...el.position }
          if (e.key === 'ArrowLeft')  pos.x -= nudge
          if (e.key === 'ArrowRight') pos.x += nudge
          if (e.key === 'ArrowUp')    pos.y -= nudge
          if (e.key === 'ArrowDown')  pos.y += nudge
          store.updateElement(id, { position: pos })
        })
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [store])
}
