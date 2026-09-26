import React from 'react'
import { Modal, FormActions, BtnPrimary, BtnSecondary } from '../Modal.tsx'
import { useEditorStore } from '../../store/editorStore.ts'

export const ConfirmDeleteDialog: React.FC = () => {
  const store = useEditorStore()
  const pendingDelete = store.pendingDelete

  if (!pendingDelete) return null

  return (
    <Modal 
      title="Confirmar Exclusão" 
      description="Você está prestes a excluir um elemento que possui filhos."
      onClose={() => store.cancelDelete()} 
      width={420}
    >
      <div style={{ color: 'var(--text-1)', fontSize: 14, lineHeight: 1.5, marginBottom: 8 }}>
        Atenção: A exclusão deste elemento removerá também <strong>{pendingDelete.additionalCount}</strong> elemento(s) filho(s) contidos nela.
        <br /><br />
        Deseja continuar com a exclusão?
      </div>
      <FormActions>
        <BtnSecondary onClick={() => store.cancelDelete()}>Cancelar</BtnSecondary>
        <BtnPrimary onClick={() => store.confirmDelete()} style={{ background: '#ef4444', borderColor: '#ef4444' }}>Excluir Tudo</BtnPrimary>
      </FormActions>
    </Modal>
  )
}
