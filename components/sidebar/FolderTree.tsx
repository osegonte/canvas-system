'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react'
import { Node } from '@/types/node.types'
import { CreateNodeDialog } from './CreateNodeDialog'

interface FolderTreeProps {
  nodes: Node[]
  currentNodeId: string | null
  onNodeClick: (nodeId: string) => void
  onNodeCreated: () => void
}

export function FolderTree({ nodes, currentNodeId, onNodeClick, onNodeCreated }: FolderTreeProps) {
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
    // Only allow adding children if not a component (leaf node)
    if (node.type !== 'component') {
      setCreatingChildFor(node)
    }
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
          onDoubleClick={() => handleDoubleClick(node)}
          title="Double-click to add child"
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
    <>
      <div className="py-2">
        {rootNodes.map(node => renderNode(node))}
        {rootNodes.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8 px-4">
            No projects yet. Create one to get started!
          </div>
        )}
      </div>

      {/* Create child dialog */}
      {creatingChildFor && (
        <CreateNodeDialog
          parentNode={{
            id: creatingChildFor.id,
            type: creatingChildFor.type,
            path: creatingChildFor.path,
            depth: creatingChildFor.depth
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