'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Node } from '@/types/node.types'
import { FolderTree } from './FolderTree'
import { CreateNodeDialog } from './CreateNodeDialog'
import { Plus } from 'lucide-react'

interface WorkspaceSidebarProps {
  selectedNodeId: string | null
  onNodeSelect: (nodeId: string) => void
}

export function WorkspaceSidebar({ selectedNodeId, onNodeSelect }: WorkspaceSidebarProps) {
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    loadNodes()
  }, [])

  async function loadNodes() {
    setLoading(true)
    
    const { data, error } = await supabase
      .from('nodes')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading nodes:', error)
    } else if (data) {
      setNodes(data as Node[])
    }
    
    setLoading(false)
  }

  return (
    <>
      <div className="w-64 border-r h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Projects</h2>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="New Project"
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Tree */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="text-center text-gray-500 text-sm py-8">
              Loading...
            </div>
          ) : (
            <FolderTree
              nodes={nodes}
              currentNodeId={selectedNodeId}
              onNodeClick={onNodeSelect}
              onNodeCreated={loadNodes}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-white">
          <div className="text-xs text-gray-500">
            {nodes.length} {nodes.length === 1 ? 'node' : 'nodes'}
          </div>
        </div>
      </div>

      {/* Create root project dialog */}
      {showCreateDialog && (
        <CreateNodeDialog
          parentNode={null}
          onClose={() => setShowCreateDialog(false)}
          onCreated={() => {
            loadNodes()
            setShowCreateDialog(false)
          }}
        />
      )}
    </>
  )
}