'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { NodeType } from '@/types/node.types'
import { X } from 'lucide-react'

interface CreateNodeDialogProps {
  parentNode?: { id: string; type: NodeType; path: string[]; depth: number; workspace_id: string } | null
  workspaceId?: string
  onClose: () => void
  onCreated: () => void
}

// Template suggestions for each level
const DOMAIN_TEMPLATES = ['Hardware', 'Software', 'Operations', 'Finance', 'Data & Analytics', 'Logistics']
const SYSTEM_TEMPLATES = ['Core System', 'Integration', 'Monitoring', 'Security']
const FEATURE_TEMPLATES = ['Authentication', 'Data Sync', 'Reporting', 'Notifications']

export function CreateNodeDialog({ parentNode, workspaceId, onClose, onCreated }: CreateNodeDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [type, setType] = useState<NodeType>(
    parentNode?.type === 'project' ? 'domain' :
    parentNode?.type === 'domain' ? 'system' :
    parentNode?.type === 'system' ? 'feature' :
    parentNode?.type === 'feature' ? 'component' : 'project'
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get templates based on what we're creating
  const templates = 
    type === 'domain' ? DOMAIN_TEMPLATES :
    type === 'system' ? SYSTEM_TEMPLATES :
    type === 'feature' ? FEATURE_TEMPLATES : []

  const handleTemplateClick = (templateName: string) => {
    setName(templateName)
    setShowCustom(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const depth = parentNode ? parentNode.depth + 1 : 0
      const path = parentNode ? [...parentNode.path, parentNode.id] : []
      const finalWorkspaceId = parentNode?.workspace_id || workspaceId

      if (!finalWorkspaceId) {
        throw new Error('No workspace ID provided')
      }

      const { data: nodeData, error: nodeError } = await supabase
        .from('nodes')
        .insert({
          workspace_id: finalWorkspaceId,
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

      const { error: canvasError } = await supabase
        .from('canvas_data')
        .insert({
          node_id: nodeData.id,
          snapshot: {}
        })

      if (canvasError) throw canvasError

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
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            Add {type.charAt(0).toUpperCase() + type.slice(1)}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Template quick picks */}
          {!showCustom && templates.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Choose a template or create custom:</p>
              
              <div className="grid grid-cols-2 gap-2">
                {templates.map(template => (
                  <button
                    key={template}
                    onClick={() => handleTemplateClick(template)}
                    className="px-4 py-3 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{template}</div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowCustom(true)}
                className="w-full px-4 py-3 text-center border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors"
              >
                + Custom {type}
              </button>
            </div>
          )}

          {/* Custom form */}
          {(showCustom || templates.length === 0) && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-900">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  placeholder="Enter name..."
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-900">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  rows={3}
                  placeholder="What is this about?"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {templates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustom(false)
                      setName('')
                      setDescription('')
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}