'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Node } from '@/types/node.types'

interface NodeViewProps {
  nodeId: string
}

export function NodeView({ nodeId }: NodeViewProps) {
  const [node, setNode] = useState<Node | null>(null)
  const [loading, setLoading] = useState(true)

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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 uppercase mb-1">
              {node.type}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {node.name}
            </h1>
            {node.description && (
              <p className="text-gray-600 mt-2">
                {node.description}
              </p>
            )}
          </div>
          
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span className={`
              px-3 py-1 text-sm rounded-full
              ${node.status === 'complete' ? 'bg-green-100 text-green-700' : ''}
              ${node.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : ''}
              ${node.status === 'mvp' ? 'bg-blue-100 text-blue-700' : ''}
              ${node.status === 'testing' ? 'bg-purple-100 text-purple-700' : ''}
              ${node.status === 'planned' ? 'bg-gray-100 text-gray-700' : ''}
              ${node.status === 'idea' ? 'bg-gray-50 text-gray-500' : ''}
            `}>
              {node.status}
            </span>
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-4 flex gap-4 text-sm text-gray-500">
          <div>
            <span className="font-medium">Depth:</span> {node.depth}
          </div>
          {node.importance && (
            <div>
              <span className="font-medium">Importance:</span> {node.importance}
            </div>
          )}
          <div>
            <span className="font-medium">Created:</span>{' '}
            {new Date(node.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Canvas placeholder */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎨</div>
          <div className="text-gray-400 text-lg">
            Canvas will appear here
          </div>
          <div className="text-gray-500 text-sm mt-2">
            (Stage 2 - Coming soon!)
          </div>
        </div>
      </div>
    </div>
  )
}