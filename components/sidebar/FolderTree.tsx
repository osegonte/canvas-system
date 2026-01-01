'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronRight, ChevronDown, FolderKanban, Boxes, Package, Puzzle, Component } from 'lucide-react'
import { Node } from '@/types/node.types'
import { CreateNodeDialog } from './CreateNodeDialog'
import { canEdit, type Role } from '@/lib/permissions'
import { getNodeProgress } from '@/lib/status-aggregation'

interface FolderTreeProps {
  nodes: Node[]
  currentNodeId: string | null
  onNodeClick: (nodeId: string) => void
  onNodeCreated: () => void
  searchQuery?: string
  userRole?: Role | null
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

export function FolderTree({ nodes, currentNodeId, onNodeClick, onNodeCreated, searchQuery, userRole }: FolderTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [creatingChildFor, setCreatingChildFor] = useState<Node | null>(null)
  const [nodeProgress, setNodeProgress] = useState<Record<string, { percentage: number, complete: number, total: number }>>({})

  useEffect(() => {
    loadProgress()
  }, [nodes])

  async function loadProgress() {
    const progressMap: Record<string, { percentage: number, complete: number, total: number }> = {}
    
    for (const node of nodes) {
      const stats = await getNodeProgress(node.id)
      if (stats.total > 0) {
        progressMap[node.id] = {
          percentage: stats.percentage,
          complete: stats.complete,
          total: stats.total
        }
      }
    }
    
    setNodeProgress(progressMap)
  }

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
    // Only allow adding children if user can edit AND node is not a component
    if (node.type !== 'component' && canEdit(userRole)) {
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
    const progress = nodeProgress[node.id]

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
          title={canEdit(userRole) ? "Double-click to add child" : ""}
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

          {/* Progress bar - show if node has children */}
          {progress && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-8 text-right">
                {progress.complete}/{progress.total}
              </span>
            </div>
          )}

          {/* Status & Critical Indicators - USE COLOR DOTS, NO TEXT */}
          {!progress && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Critical dot - Orange for critical */}
              {node.is_critical && (
                <div 
                  className="w-2 h-2 rounded-full bg-orange-500" 
                  title="Critical - affects parent status"
                />
              )}
              
              {/* Status dot - only if status is not idea */}
              {node.status !== 'idea' && (
                <div 
                  className={`
                    w-2 h-2 rounded-full
                    ${node.status === 'complete' ? 'bg-green-500' : ''}
                    ${node.status === 'in_progress' ? 'bg-yellow-500' : ''}
                    ${node.status === 'mvp' ? 'bg-blue-500' : ''}
                    ${node.status === 'testing' ? 'bg-purple-500' : ''}
                    ${node.status === 'planned' ? 'bg-gray-400' : ''}
                  `}
                  title={`Status: ${node.status}`}
                />
              )}
            </div>
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
                {canEdit(userRole) ? (
                  <div className="text-gray-500 text-xs">
                    Click the + button to create one
                  </div>
                ) : (
                  <div className="text-gray-500 text-xs">
                    Ask an owner or editor to create projects
                  </div>
                )}
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