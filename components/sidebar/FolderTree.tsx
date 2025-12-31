'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react'
import { Node } from '@/types/node.types'

interface FolderTreeProps {
  nodes: Node[]
  currentNodeId: string | null
  onNodeClick: (nodeId: string) => void
}

export function FolderTree({ nodes, currentNodeId, onNodeClick }: FolderTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

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

  const renderNode = (node: Node, depth: number = 0) => {
    const children = getChildren(node.id)
    const hasChildren = children.length > 0
    const isExpanded = expandedNodes.has(node.id)
    const isCurrent = node.id === currentNodeId

    return (
      <div key={node.id}>
        {/* Node row */}
        <div
          className={`
            flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer
            transition-colors
            ${isCurrent ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-200'}
          `}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onNodeClick(node.id)}
        >
          {/* Expand/collapse button */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(node.id)
              }}
              className="p-0.5 hover:bg-gray-300 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}

          {/* Folder icon */}
          {isExpanded && hasChildren ? (
            <FolderOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-gray-500 flex-shrink-0" />
          )}

          {/* Node name */}
          <span className="text-sm font-medium truncate flex-1">
            {node.name}
          </span>

          {/* Status badge */}
          {node.status !== 'idea' && (
            <span className={`
              text-xs px-1.5 py-0.5 rounded flex-shrink-0
              ${node.status === 'complete' ? 'bg-green-100 text-green-700' : ''}
              ${node.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : ''}
              ${node.status === 'mvp' ? 'bg-blue-100 text-blue-700' : ''}
              ${node.status === 'testing' ? 'bg-purple-100 text-purple-700' : ''}
              ${node.status === 'planned' ? 'bg-gray-100 text-gray-700' : ''}
            `}>
              {node.status}
            </span>
          )}
        </div>

        {/* Children */}
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
    <div className="py-2">
      {rootNodes.map(node => renderNode(node))}
      {rootNodes.length === 0 && (
        <div className="text-center text-gray-500 text-sm py-8 px-4">
          No projects yet. Create one to get started!
        </div>
      )}
    </div>
  )
}