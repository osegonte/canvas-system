'use client'

import { useEffect, useState, useCallback } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { supabase } from '@/lib/supabase/client'
import { Node as DBNode, NodeStatus } from '@/types/node.types'

interface MindMapViewProps {
  nodeId: string
}

const getStatusColor = (status: NodeStatus): string => {
  switch (status) {
    case 'complete': return '#22c55e' // Green
    case 'testing': return '#8b5cf6' // Purple
    case 'mvp': return '#3b82f6' // Blue
    case 'in_progress': return '#eab308' // Yellow
    case 'planned': return '#6b7280' // Gray
    case 'idea': return '#d1d5db' // Light gray
    default: return '#e5e7eb'
  }
}

const getNodeStyle = (status: NodeStatus, isCritical: boolean, depth: number) => {
  // Size based on depth (higher = more important)
  const baseSize = depth === 0 ? 18 : depth === 1 ? 14 : 12
  
  return {
    background: getStatusColor(status),
    color: status === 'idea' || status === 'planned' ? '#374151' : '#ffffff',
    border: isCritical ? `3px solid #f97316` : `2px solid ${getStatusColor(status)}`,
    borderRadius: '8px',
    padding: depth === 0 ? '15px 20px' : depth === 1 ? '12px 16px' : '10px 15px',
    fontSize: `${baseSize}px`,
    fontWeight: isCritical ? '700' : '600',
    minWidth: depth === 0 ? '180px' : depth === 1 ? '140px' : '120px',
  }
}

export function MindMapView({ nodeId }: MindMapViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)
  const [projectSummary, setProjectSummary] = useState<string>('')

  const buildMindMap = useCallback(async () => {
    try {
      // Get the current node
      const { data: currentNode } = await supabase
        .from('nodes')
        .select('*')
        .eq('id', nodeId)
        .single()

      if (!currentNode) return

      setProjectSummary(currentNode.description || currentNode.name)

      // Get all children (3 levels deep)
      const { data: allNodes } = await supabase
        .from('nodes')
        .select('*')
        .eq('workspace_id', currentNode.workspace_id)
        .order('depth', { ascending: true })

      if (!allNodes) return

      // Filter to get nodes in the tree starting from current node
      const relevantNodes = allNodes.filter((node: DBNode) => {
        if (node.id === currentNode.id) return true
        return node.path.includes(currentNode.id)
      })

      // Build React Flow nodes
      const flowNodes: Node[] = []
      const flowEdges: Edge[] = []

      // Better layout configuration for 16:9
      const levelWidth = 280 // Wider spacing
      const levelHeight = 120 // Taller spacing
      const nodesPerLevel: Record<number, number> = {}

      relevantNodes.forEach((dbNode: DBNode) => {
        const relativeDepth = dbNode.depth - currentNode.depth
        
        // Count nodes at each level for positioning
        if (!nodesPerLevel[relativeDepth]) {
          nodesPerLevel[relativeDepth] = 0
        }
        const indexAtLevel = nodesPerLevel[relativeDepth]++

        // Calculate position - center vertically
        const totalAtLevel = relevantNodes.filter(n => n.depth - currentNode.depth === relativeDepth).length
        const verticalOffset = (totalAtLevel - 1) * levelHeight / 2

        const x = relativeDepth * levelWidth
        const y = indexAtLevel * levelHeight - verticalOffset

        // Create label with description hint
        const label = dbNode.name + (dbNode.description ? ' ℹ️' : '')

        flowNodes.push({
          id: dbNode.id,
          type: 'default',
          data: { 
            label,
          },
          position: { x, y },
          style: getNodeStyle(dbNode.status, dbNode.is_critical, relativeDepth),
        })

        // Create edge to parent
        if (dbNode.parent_id && relevantNodes.find(n => n.id === dbNode.parent_id)) {
          flowEdges.push({
            id: `${dbNode.parent_id}-${dbNode.id}`,
            source: dbNode.parent_id,
            target: dbNode.id,
            type: 'smoothstep',
            animated: dbNode.status === 'in_progress',
            style: { 
              stroke: dbNode.is_critical ? '#f97316' : getStatusColor(dbNode.status), 
              strokeWidth: dbNode.is_critical ? 3 : 2 
            },
          })
        }
      })

      setNodes(flowNodes)
      setEdges(flowEdges)
      setLoading(false)
    } catch (error) {
      console.error('Error building mind map:', error)
      setLoading(false)
    }
  }, [nodeId, setNodes, setEdges])

  useEffect(() => {
    buildMindMap()
  }, [buildMindMap])

  if (loading) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-gray-500 text-sm">Loading mind map...</div>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 text-2xl mb-2">🗺️</div>
          <div className="text-gray-600 text-sm">No structure yet</div>
          <div className="text-gray-500 text-xs mt-1">Use Auto to generate</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Project Summary Section */}
      {projectSummary && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-bold text-blue-900 mb-2">Why This Project Matters</h4>
          <p className="text-sm text-blue-800 leading-relaxed">
            {projectSummary}
          </p>
        </div>
      )}

      {/* Mind Map - 16:9 ratio */}
      <div className="w-full h-[500px] bg-gray-50 rounded-lg border border-gray-200 overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls />
          <MiniMap 
            nodeColor={(node) => node.style?.background as string || '#e5e7eb'}
            maskColor="rgba(0, 0, 0, 0.1)"
            position="bottom-right"
          />
        </ReactFlow>

        {/* Enhanced Legend */}
        <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg text-xs border border-gray-200">
          <div className="font-bold text-gray-900 mb-2">Legend</div>
          <div className="space-y-2">
            {/* Status Colors */}
            <div>
              <div className="font-semibold text-gray-700 mb-1">Status:</div>
              <div className="space-y-1 pl-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Complete</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>MVP</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span>Planned</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                  <span>Idea</span>
                </div>
              </div>
            </div>

            {/* Critical Indicator */}
            <div className="pt-2 border-t">
              <div className="font-semibold text-gray-700 mb-1">Critical:</div>
              <div className="pl-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded border-2 border-orange-500" />
                  <span>Orange border</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Tooltip */}
        <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-lg shadow text-xs text-gray-600 border border-gray-200">
          💡 Larger nodes = higher importance | ℹ️ = has description
        </div>
      </div>
    </div>
  )
}