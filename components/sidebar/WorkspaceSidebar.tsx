'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Node } from '@/types/node.types'
import { FolderTree } from './FolderTree'
import { CreateNodeDialog } from './CreateNodeDialog'
import { Plus, Search, X } from 'lucide-react'
import { getUserRole, canEdit, type Role } from '@/lib/permissions'

interface WorkspaceSidebarProps {
  workspaceId: string
  selectedNodeId: string | null
  onNodeSelect: (nodeId: string) => void
}

export function WorkspaceSidebar({ workspaceId, selectedNodeId, onNodeSelect }: WorkspaceSidebarProps) {
  const [nodes, setNodes] = useState<Node[]>([])
  const [filteredNodes, setFilteredNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userRole, setUserRole] = useState<Role | null>(null)

  useEffect(() => {
    loadNodes()
    loadRole()
  }, [workspaceId])

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const filtered = nodes.filter(node => 
        node.name.toLowerCase().includes(query) ||
        node.description?.toLowerCase().includes(query)
      )
      setFilteredNodes(filtered)
    } else {
      setFilteredNodes(nodes)
    }
  }, [searchQuery, nodes])

  async function loadRole() {
    const role = await getUserRole(workspaceId)
    setUserRole(role)
  }

  async function loadNodes() {
    setLoading(true)
    
    const { data, error } = await supabase
      .from('nodes')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading nodes:', error)
    } else if (data) {
      setNodes(data as Node[])
      setFilteredNodes(data as Node[])
    }
    
    setLoading(false)
  }

  return (
    <>
      <div className="w-64 border-r h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Projects</h2>
            {canEdit(userRole) && (
              <button
                onClick={() => setShowCreateDialog(true)}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="New Project"
              >
                <Plus className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search nodes..."
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            )}
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
              nodes={filteredNodes}
              currentNodeId={selectedNodeId}
              onNodeClick={onNodeSelect}
              onNodeCreated={loadNodes}
              searchQuery={searchQuery}
              userRole={userRole}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-white">
          <div className="text-xs text-gray-500">
            {searchQuery ? `${filteredNodes.length} of ${nodes.length}` : `${nodes.length}`} {nodes.length === 1 ? 'node' : 'nodes'}
          </div>
          {userRole && (
            <div className="text-xs text-gray-400 mt-1 capitalize">
              Role: {userRole}
            </div>
          )}
        </div>
      </div>

      {/* Create root project dialog */}
      {showCreateDialog && (
        <CreateNodeDialog
          parentNode={null}
          workspaceId={workspaceId}
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