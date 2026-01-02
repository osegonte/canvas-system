'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { NodeType } from '@/types/node.types'
import { X } from 'lucide-react'
import { TAXONOMY } from '@/lib/scaffold/taxonomy'

interface CreateNodeDialogProps {
  parentNode?: { id: string; type: NodeType; path: string[]; depth: number; workspace_id: string; name?: string } | null
  workspaceId?: string
  onClose: () => void
  onCreated: () => void
}

export function CreateNodeDialog({ parentNode, workspaceId, onClose, onCreated }: CreateNodeDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCustom, setIsCustom] = useState(false)
  const [parentNodeData, setParentNodeData] = useState<any>(null)
  
  const type: NodeType = 
    parentNode?.type === 'project' ? 'domain' :
    parentNode?.type === 'domain' ? 'system' :
    parentNode?.type === 'system' ? 'feature' :
    parentNode?.type === 'feature' ? 'component' : 'project'

  const isProjectCreation = type === 'project'

  useEffect(() => {
    if (parentNode?.id) {
      loadParentNode()
    }
  }, [parentNode?.id])

  async function loadParentNode() {
    if (!parentNode?.id) return
    
    const { data } = await supabase
      .from('nodes')
      .select('*')
      .eq('id', parentNode.id)
      .single()
    
    if (data) {
      setParentNodeData(data)
    }
  }

  const getOptions = (): string[] => {
    if (type === 'domain') {
      return Object.keys(TAXONOMY)
    }
    
    if (type === 'system' && parentNodeData?.name) {
      const domain = TAXONOMY[parentNodeData.name]
      if (domain?.subdomains) {
        return Object.keys(domain.subdomains)
      }
    }
    
    if (type === 'feature' && parentNodeData?.name) {
      for (const domain of Object.values(TAXONOMY)) {
        for (const [subdomainName, subdomain] of Object.entries(domain.subdomains)) {
          if (subdomainName === parentNodeData.name && subdomain.systems) {
            return Object.keys(subdomain.systems)
          }
        }
      }
    }
    
    return []
  }

  const options = getOptions()
  const showOptions = options.length > 0 && !isProjectCreation

  const handleAutoGenerate = async () => {
    if (!description.trim()) {
      setError('Description is required for auto-generate')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const finalWorkspaceId = parentNode?.workspace_id || workspaceId

      if (!finalWorkspaceId) {
        throw new Error('No workspace ID provided')
      }

      const response = await fetch('/api/generate-scaffold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          projectName: name || undefined,
          workspaceId: finalWorkspaceId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate scaffold')
      }

      onCreated()
      onClose()
    } catch (err: any) {
      console.error('Error generating scaffold:', err)
      setError(err.message || 'Failed to generate scaffold')
    } finally {
      setLoading(false)
    }
  }

  const handleManualCreate = async () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const finalWorkspaceId = parentNode?.workspace_id || workspaceId

      if (!finalWorkspaceId) {
        throw new Error('No workspace ID provided')
      }

      const depth = parentNode ? parentNode.depth + 1 : 0
      const path = parentNode ? [...parentNode.path, parentNode.id] : []

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
          is_critical: true,
          skills: [],
          coordinator_role: null
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

      if (type === 'feature' || type === 'system') {
        generateSkillsInBackground(nodeData.id, name, type, description || undefined)
      }

      onCreated()
      onClose()
    } catch (err: any) {
      console.error('Error creating node:', err)
      setError(err.message || 'Failed to create node')
    } finally {
      setLoading(false)
    }
  }

  const generateSkillsInBackground = async (
    nodeId: string,
    nodeName: string,
    nodeType: string,
    nodeDescription?: string
  ) => {
    try {
      await fetch('/api/generate-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId, nodeName, nodeType, nodeDescription })
      })
    } catch (error) {
      console.error('Background skills generation failed:', error)
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

          <div className="space-y-4">
            {showOptions && (
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-900">
                  Quick Select
                </label>
                <select
                  value={isCustom ? 'custom' : name}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustom(true)
                      setName('')
                    } else {
                      setIsCustom(false)
                      setName(e.target.value)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                >
                  <option value="">Select an option...</option>
                  {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                  <option value="custom">✏️ Custom (type your own)</option>
                </select>
              </div>
            )}

            {(!showOptions || isCustom) && (
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-900">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  placeholder="Enter name..."
                  autoFocus
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-900">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                rows={3}
                placeholder="Describe this component..."
              />
            </div>

            {(type === 'feature' || type === 'system') && (
              <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                💡 Skills will be auto-generated after creation
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                disabled={loading}
              >
                Cancel
              </button>

              {isProjectCreation && (
                <button
                  type="button"
                  onClick={handleAutoGenerate}
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Auto-generate'}
                </button>
              )}

              <button
                type="button"
                onClick={handleManualCreate}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}