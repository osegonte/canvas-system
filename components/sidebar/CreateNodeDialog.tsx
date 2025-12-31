'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { NodeType } from '@/types/node.types'
import { X } from 'lucide-react'

interface CreateNodeDialogProps {
  parentNode?: { id: string; type: NodeType; path: string[]; depth: number } | null
  onClose: () => void
  onCreated: () => void
}

export function CreateNodeDialog({ parentNode, onClose, onCreated }: CreateNodeDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<NodeType>(
    parentNode?.type === 'project' ? 'domain' :
    parentNode?.type === 'domain' ? 'system' :
    parentNode?.type === 'system' ? 'feature' :
    parentNode?.type === 'feature' ? 'component' : 'project'
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Calculate depth and path
      const depth = parentNode ? parentNode.depth + 1 : 0
      const path = parentNode ? [...parentNode.path, parentNode.id] : []

      // Insert into nodes table
      const { data: nodeData, error: nodeError } = await supabase
        .from('nodes')
        .insert({
          workspace_id: '00000000-0000-0000-0000-000000000001',
          parent_id: parentNode?.id || null,
          type,
          name,
          description: description || null,
          path,
          depth,
          status: 'idea',
          created_by: 'default_user'
        })
        .select()
        .single()

      if (nodeError) throw nodeError

      // Create canvas_data for this node
      const { error: canvasError } = await supabase
        .from('canvas_data')
        .insert({
          node_id: nodeData.id,
          snapshot: {}
        })

      if (canvasError) throw canvasError

      // Success!
      onCreated()
      onClose()
    } catch (err: any) {
      console.error('Error creating node:', err)
      setError(err.message || 'Failed to create node')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Create New {type.charAt(0).toUpperCase() + type.slice(1)}
          </h2>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Name field */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Enter name..."
              required
              autoFocus
            />
          </div>

          {/* Description field */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              rows={3}
              placeholder="What is this about?"
            />
          </div>

          {/* Type field - only show if creating a root node */}
          {!parentNode && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as NodeType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="project">Project</option>
                <option value="domain">Domain</option>
                <option value="system">System</option>
                <option value="feature">Feature</option>
                <option value="component">Component</option>
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}