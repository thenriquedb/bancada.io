import React, { useState } from 'react'
import { LayersPanel } from './LayersPanel.tsx'
import { PropertiesPanel } from './PropertiesPanel.tsx'

export const RightSidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'properties' | 'layers'>('properties')

  return (
    <aside className="right-sidebar">
      <div className="right-sidebar__tabs">
        <button
          className={`right-sidebar__tab ${activeTab === 'properties' ? 'active' : ''}`}
          onClick={() => setActiveTab('properties')}
        >
          Propriedades
        </button>
        <button
          className={`right-sidebar__tab ${activeTab === 'layers' ? 'active' : ''}`}
          onClick={() => setActiveTab('layers')}
        >
          Camadas
        </button>
      </div>
      <div className="right-sidebar__content">
        {activeTab === 'properties' ? <PropertiesPanel /> : <LayersPanel />}
      </div>
    </aside>
  )
}
