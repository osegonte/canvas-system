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

const getNodeStyle = (status: NodeStatus) => ({
  background: getStatusColor(status),
  color: status === 'idea' || status === 'planned' ? '#374151' : '#ffffff',
  border: `2px solid ${getStatusColor(status)}`,
  borderRadius: '8px',
  padding: '10px 15px',
  fontSize: '12px',
  fontWeight: '600',
})

export function MindMapView({ nodeId }: MindMapViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)

  const buildMindMap = useCallback(async () => {
    try {
      // Get the current node
      const { data: currentNode } = await supabase
        .from('nodes')
        .select('*')
        .eq('id', nodeId)
        .single()

      if (!currentNode) return

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

      // Layout configuration
      const levelWidth = 200
      const levelHeight = 100
      const nodesPerLevel: Record<number, number> = {}

      relevantNodes.forEach((dbNode: DBNode) => {
        const relativeDepth = dbNode.depth - currentNode.depth
        
        // Count nodes at each level for positioning
        if (!nodesPerLevel[relativeDepth]) {
          nodesPerLevel[relativeDepth] = 0
        }
        const indexAtLevel = nodesPerLevel[relativeDepth]++

        // Calculate position
        const x = relativeDepth * levelWidth
        const y = indexAtLevel * levelHeight

        flowNodes.push({
          id: dbNode.id,
          type: 'default',
          data: { 
            label: dbNode.name,
          },
          position: { x, y },
          style: getNodeStyle(dbNode.status),
        })

        // Create edge to parent
        if (dbNode.parent_id && relevantNodes.find(n => n.id === dbNode.parent_id)) {
          flowEdges.push({
            id: `${dbNode.parent_id}-${dbNode.id}`,
            source: dbNode.parent_id,
            target: dbNode.id,
            type: 'smoothstep',
            animated: dbNode.status === 'in_progress',
            style: { stroke: getStatusColor(dbNode.status), strokeWidth: 2 },
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
      <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-gray-500 text-sm">Loading mind map...</div>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 text-2xl mb-2">🗺️</div>
          <div className="text-gray-600 text-sm">No structure yet</div>
          <div className="text-gray-500 text-xs mt-1">Use Auto to generate</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-96 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap 
          nodeColor={(node) => node.style?.background as string || '#e5e7eb'}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg text-xs">
        <div className="font-bold text-gray-900 mb-2">Status</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Complete</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>In Progress</span>
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
    </div>
  )
}