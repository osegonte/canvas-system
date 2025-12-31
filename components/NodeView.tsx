'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Node } from '@/types/node.types'
import { Edit2 } from 'lucide-react'
import { InfiniteCanvas } from './canvas/InfiniteCanvas'

interface NodeViewProps {
  nodeId: string
  onNodeCreated: () => void
}

export function NodeView({ nodeId, onNodeCreated }: NodeViewProps) {
  const [node, setNode] = useState<Node | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditDialog, setShowEditDialog] = useState(false)

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
    }
    
    setLoading(false)
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
          <div className="mt-4 flex items-center gap-4 text-sm">
            {/* Status badge */}
            <span className={`
              px-3 py-1 text-sm rounded-full font-medium
              ${node.status === 'complete' ? 'bg-green-100 text-green-700' : ''}
              ${node.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : ''}
              ${node.status === 'mvp' ? 'bg-blue-100 text-blue-700' : ''}
              ${node.status === 'testing' ? 'bg-purple-100 text-purple-700' : ''}
              ${node.status === 'planned' ? 'bg-gray-100 text-gray-700' : ''}
              ${node.status === 'idea' ? 'bg-gray-100 text-gray-600' : ''}
            `}>
              {node.status}
            </span>

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

            {/* Edit button */}
            <button
              onClick={() => setShowEditDialog(true)}
              className="ml-auto px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          </div>
        </div>

        {/* Canvas - replaces placeholder */}
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
    </>
  )
}

// Edit dialog component (unchanged)
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