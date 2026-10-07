import React, { useState } from 'react'
import { LayersPanel } from './LayersPanel.tsx'
import { PropertiesPanel } from './PropertiesPanel.tsx'

export const RightSidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'properties' | 'layers'>('properties')

  return (
    <aside className="right-sidebar" aria-label="Painel Lateral Direito">
      <nav className="right-sidebar__tabs" role="tablist" aria-label="Abas do painel lateral">
        <button
          role="tab"
          id="tab-properties"
          aria-selected={activeTab === 'properties'}
          aria-controls="panel-properties"
          className={`right-sidebar__tab ${activeTab === 'properties' ? 'active' : ''}`}
          onClick={() => setActiveTab('properties')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          <span>Propriedades</span>
        </button>
        <button
          role="tab"
          id="tab-layers"
          aria-selected={activeTab === 'layers'}
          aria-controls="panel-layers"
          className={`right-sidebar__tab ${activeTab === 'layers' ? 'active' : ''}`}
          onClick={() => setActiveTab('layers')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <span>Camadas</span>
        </button>
      </nav>

      <div
        className="right-sidebar__content"
        role="tabpanel"
        id={activeTab === 'properties' ? 'panel-properties' : 'panel-layers'}
        aria-labelledby={activeTab === 'properties' ? 'tab-properties' : 'tab-layers'}
      >
        {activeTab === 'properties' ? <PropertiesPanel /> : <LayersPanel />}
      </div>
    </aside>
  )
}
