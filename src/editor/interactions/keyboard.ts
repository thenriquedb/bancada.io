import { useEffect } from 'react'
import { useEditorStore } from '../../store/editorStore.ts'

/**
 * Global keyboard shortcuts for the editor.
 */
export function useKeyboard() {
  const store = useEditorStore()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.ctrlKey || e.metaKey
      const target = e.target as HTMLElement

      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (!meta && e.key === 'v') { store.setActiveTool('select'); return }
      if (!meta && e.key === 'h') { store.setActiveTool('pan'); return }

      if (e.key === 'Escape') {
        store.clearSelection()
        store.setActiveTool('select')
        return
      }

      if (meta && e.key === 'a') {
        e.preventDefault()
        store.selectAll()
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selectedIds } = store
        if (selectedIds.length > 0) store.removeElements(selectedIds)
        return
      }

      if (meta && !e.shiftKey && e.key === 'z') { e.preventDefault(); store.undo(); return }
      if (meta && e.shiftKey && e.key === 'z') { e.preventDefault(); store.redo(); return }
      if (meta && e.key === 'y') { e.preventDefault(); store.redo(); return }

      if (meta && !e.shiftKey && e.key === 's') {
        e.preventDefault()
        store.saveToLocalStorage()
        return
      }

      if (meta && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        store.setZoom(store.viewport.zoom * 1.2)
        return
      }
      if (meta && e.key === '-') {
        e.preventDefault()
        store.setZoom(store.viewport.zoom * 0.8)
        return
      }
      if (meta && e.key === '0') {
        e.preventDefault()
        store.resetZoom()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [store])
}
