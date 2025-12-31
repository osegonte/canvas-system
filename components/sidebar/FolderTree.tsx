'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, FolderKanban, Boxes, Package, Puzzle, Component } from 'lucide-react'
import { Node } from '@/types/node.types'
import { CreateNodeDialog } from './CreateNodeDialog'

interface FolderTreeProps {
  nodes: Node[]
  currentNodeId: string | null
  onNodeClick: (nodeId: string) => void
  onNodeCreated: () => void
  searchQuery?: string
}

const NODE_ICONS = {
  project: FolderKanban,
  domain: Boxes,
  system: Package,
  feature: Puzzle,
  component: Component
}

const NODE_COLORS = {
  project: 'text-blue-600',
  domain: 'text-purple-600',
  system: 'text-green-600',
  feature: 'text-orange-600',
  component: 'text-pink-600'
}

export function FolderTree({ nodes, currentNodeId, onNodeClick, onNodeCreated, searchQuery }: FolderTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [creatingChildFor, setCreatingChildFor] = useState<Node | null>(null)

  const toggleExpanded = (nodeId: string) => {
    const newSet = new Set(expandedNodes)
    if (newSet.has(nodeId)) {
      newSet.delete(nodeId)
    } else {
      newSet.add(nodeId)
    }
    setExpandedNodes(newSet)
  }

  const getChildren = (parentId: string | null) => {
    return nodes.filter(n => n.parent_id === parentId)
  }

  const handleDoubleClick = (node: Node) => {
    if (node.type !== 'component') {
      setCreatingChildFor(node)
    }
  }

  const renderNode = (node: Node, depth: number = 0) => {
    const children = getChildren(node.id)
    const hasChildren = children.length > 0
    const isExpanded = expandedNodes.has(node.id)
    const isCurrent = node.id === currentNodeId

    const Icon = NODE_ICONS[node.type]
    const iconColor = NODE_COLORS[node.type]

    return (
      <div key={node.id}>
        <div
          className={`
            flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer
            transition-colors
            ${isCurrent ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-200'}
          `}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => onNodeClick(node.id)}
          onDoubleClick={() => handleDoubleClick(node)}
          title="Double-click to add child"
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(node.id)
              }}
              className="p-0.5 hover:bg-gray-300 rounded flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-5 flex-shrink-0" />
          )}

          <Icon className={`w-4 h-4 flex-shrink-0 ${isCurrent ? '' : iconColor}`} />

          <span className="text-sm font-medium truncate flex-1">
            {node.name}
          </span>

          {node.status !== 'idea' && (
            <div className={`
              w-2 h-2 rounded-full flex-shrink-0
              ${node.status === 'complete' ? 'bg-green-500' : ''}
              ${node.status === 'in_progress' ? 'bg-yellow-500' : ''}
              ${node.status === 'mvp' ? 'bg-blue-500' : ''}
              ${node.status === 'testing' ? 'bg-purple-500' : ''}
              ${node.status === 'planned' ? 'bg-gray-400' : ''}
            `} />
          )}
        </div>

        {isExpanded && hasChildren && (
          <div>
            {children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const rootNodes = getChildren(null)

  return (
    <>
      <div className="py-2">
        {rootNodes.map(node => renderNode(node))}
        {rootNodes.length === 0 && (
          <div className="text-center py-12 px-4">
            {searchQuery ? (
              <div>
                <div className="text-gray-400 text-4xl mb-2">🔍</div>
                <div className="text-gray-600 text-sm">
                  No nodes match "{searchQuery}"
                </div>
              </div>
            ) : (
              <div>
                <div className="text-gray-400 text-4xl mb-2">📁</div>
                <div className="text-gray-600 text-sm font-medium mb-1">
                  No projects yet
                </div>
                <div className="text-gray-500 text-xs">
                  Click the + button to create one
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {creatingChildFor && (
        <CreateNodeDialog
          parentNode={{
            id: creatingChildFor.id,
            type: creatingChildFor.type,
            path: creatingChildFor.path,
            depth: creatingChildFor.depth,
            workspace_id: creatingChildFor.workspace_id
          }}
          onClose={() => setCreatingChildFor(null)}
          onCreated={() => {
            onNodeCreated()
            setCreatingChildFor(null)
          }}
        />
      )}
    </>
  )
}