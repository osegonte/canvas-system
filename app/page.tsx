'use client'

import { useState } from 'react'
import { WorkspaceSidebar } from '@/components/sidebar/WorkspaceSidebar'
import { NodeView } from '@/components/NodeView'

export default function HomePage() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <WorkspaceSidebar
        selectedNodeId={selectedNodeId}
        onNodeSelect={setSelectedNodeId}
      />

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {selectedNodeId ? (
          <NodeView nodeId={selectedNodeId} />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center">
              <div className="text-6xl mb-4">👋</div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                Welcome to Canvas Project System
              </h2>
              <p className="text-gray-500">
                Select a node from the sidebar or create a new project to get started
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}