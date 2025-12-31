'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Node, NodeStatus } from '@/types/node.types'
import { Edit2, Trash2, ChevronRight } from 'lucide-react'
import { InfiniteCanvas } from './canvas/InfiniteCanvas'

interface NodeViewProps {
  nodeId: string
  onNodeCreated: () => void
}

export function NodeView({ nodeId, onNodeCreated }: NodeViewProps) {
  const [node, setNode] = useState<Node | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    loadNode()
  }, [nodeId])

  async function loadNode() {
    setLoading(true)
    
    const { data, error } = await supabase
      .from('nodes')
      .select('*')
      .eq('id', nodeId)
      .single()

    if (error) {
      console.error('Error loading node:', error)
    } else if (data) {
      setNode(data as Node)
      await loadBreadcrumbs(data as Node)
    }
    
    setLoading(false)
  }

  async function loadBreadcrumbs(currentNode: Node) {
    if (currentNode.path.length === 0) {
      setBreadcrumbs([currentNode])
      return
    }

    const { data } = await supabase
      .from('nodes')
      .select('*')
      .in('id', currentNode.path)

    if (data) {
      const orderedBreadcrumbs = currentNode.path.map(id => 
        data.find(n => n.id === id)
      ).filter(Boolean) as Node[]
      
      setBreadcrumbs([...orderedBreadcrumbs, currentNode])
    }
  }

  async function updateStatus(newStatus: NodeStatus) {
    if (!node) return

    const { error } = await supabase
      .from('nodes')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', node.id)

    if (!error) {
      setNode({ ...node, status: newStatus })
      onNodeCreated()
    }
  }

  async function deleteNode() {
    if (!node) return

    const { error } = await supabase
      .from('nodes')
      .delete()
      .eq('id', node.id)

    if (!error) {
      onNodeCreated()
      // Navigate to parent or home
      window.location.reload()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!node) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Node not found</div>
      </div>
    )
  }

  return (
    <>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          {/* Breadcrumbs */}
          {breadcrumbs.length > 1 && (
            <div className="flex items-center gap-2 text-sm mb-3 text-gray-600">
              {breadcrumbs.map((crumb, idx) => (
                <div key={crumb.id} className="flex items-center gap-2">
                  {idx > 0 && <ChevronRight className="w-4 h-4" />}
                  <button
                    onClick={() => window.location.href = `/?node=${crumb.id}`}
                    className={`hover:text-blue-600 ${idx === breadcrumbs.length - 1 ? 'font-medium text-gray-900' : ''}`}
                  >
                    {crumb.name}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 border-b-2 border-gray-300 inline-block pb-1">
            {node.name}
          </h1>
          
          {/* Description */}
          {node.description && (
            <p className="text-gray-600 mt-3 text-base">
              {node.description}
            </p>
          )}

          {/* Metadata row */}
          <div className="mt-4 flex items-center gap-4 text-sm flex-wrap">
            {/* Status dropdown */}
            <select
              value={node.status}
              onChange={(e) => updateStatus(e.target.value as NodeStatus)}
              className={`
                px-3 py-1 text-sm rounded-full font-medium border-2 cursor-pointer
                ${node.status === 'complete' ? 'bg-green-100 text-green-700 border-green-300' : ''}
                ${node.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : ''}
                ${node.status === 'mvp' ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}
                ${node.status === 'testing' ? 'bg-purple-100 text-purple-700 border-purple-300' : ''}
                ${node.status === 'planned' ? 'bg-gray-100 text-gray-700 border-gray-300' : ''}
                ${node.status === 'idea' ? 'bg-gray-50 text-gray-600 border-gray-200' : ''}
              `}
            >
              <option value="idea">Idea</option>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="mvp">MVP</option>
              <option value="testing">Testing</option>
              <option value="complete">Complete</option>
            </select>

            <div className="text-gray-500">
              <span className="font-medium">Type:</span> {node.type}
            </div>
            
            <div className="text-gray-500">
              <span className="font-medium">Depth:</span> {node.depth}
            </div>
            
            {node.importance && (
              <div className="text-gray-500">
                <span className="font-medium">Importance:</span> {node.importance}
              </div>
            )}
            
            <div className="text-gray-500">
              <span className="font-medium">Created:</span>{' '}
              {new Date(node.created_at).toLocaleDateString()}
            </div>

            {/* Edit & Delete buttons */}
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => setShowEditDialog(true)}
                className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>

              <button
                onClick={() => setShowDeleteDialog(true)}
                className="px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1">
          <InfiniteCanvas nodeId={nodeId} />
        </div>
      </div>

      {/* Edit dialog */}
      {showEditDialog && (
        <EditNodeDialog
          node={node}
          onClose={() => setShowEditDialog(false)}
          onUpdated={() => {
            loadNode()
            onNodeCreated()
            setShowEditDialog(false)
          }}
        />
      )}

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Delete {node.name}?
              </h2>
              <p className="text-gray-600 mb-4">
                This will permanently delete this {node.type} and all of its children. This action cannot be undone.
              </p>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteNode}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Edit dialog component
function EditNodeDialog({ 
  node, 
  onClose, 
  onUpdated 
}: { 
  node: Node
  onClose: () => void
  onUpdated: () => void
}) {
  const [name, setName] = useState(node.name)
  const [description, setDescription] = useState(node.description || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('nodes')
      .update({
        name,
        description: description || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', node.id)

    if (!error) {
      onUpdated()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            Edit {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-900">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-gray-900">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}