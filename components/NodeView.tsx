'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Node, NodeStatus } from '@/types/node.types'
import { Edit2, Trash2, ChevronRight, MessageSquare } from 'lucide-react'
import { InfiniteCanvas } from './canvas/InfiniteCanvas'
import { MindMapView } from './MindMapView'
import { ChatPanel } from './ChatPanel'
import { SkillsBadges } from './SkillsBadges'
import { getUserRole, canEdit, type Role } from '@/lib/permissions'
import { updateNodeStatusWithPropagation, enableAutoStatus, toggleNodeCritical, getNodeProgress } from '@/lib/status-aggregation'

interface NodeViewProps {
  nodeId: string
  onNodeCreated: () => void
}

export function NodeView({ nodeId, onNodeCreated }: NodeViewProps) {
  const [node, setNode] = useState<Node | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [userRole, setUserRole] = useState<Role | null>(null)
  const [progress, setProgress] = useState({ total: 0, complete: 0, inProgress: 0, percentage: 0 })

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
      await loadBreadcrumbs(data as Node)
      await loadRole(data.workspace_id)
      
      const stats = await getNodeProgress(data.id)
      setProgress(stats)
    }
    
    setLoading(false)
  }

  async function loadRole(workspaceId: string) {
    const role = await getUserRole(workspaceId)
    setUserRole(role)
  }

  async function loadBreadcrumbs(currentNode: Node) {
    if (currentNode.path.length === 0) {
      setBreadcrumbs([currentNode])
      return
    }

    const { data } = await supabase
      .from('nodes')
      .select('*')
      .in('id', currentNode.path)

    if (data) {
      const orderedBreadcrumbs = currentNode.path.map(id => 
        data.find(n => n.id === id)
      ).filter(Boolean) as Node[]
      
      setBreadcrumbs([...orderedBreadcrumbs, currentNode])
    }
  }

  async function updateStatus(newStatus: NodeStatus) {
    if (!node || !canEdit(userRole)) return
    await updateNodeStatusWithPropagation(node.id, newStatus)
    await loadNode()
    onNodeCreated()
  }

  async function deleteNode() {
    if (!node || !canEdit(userRole)) return

    const { error } = await supabase
      .from('nodes')
      .delete()
      .eq('id', node.id)

    if (!error) {
      onNodeCreated()
      // Navigate to parent instead of reloading
      if (node.parent_id) {
        const event = new CustomEvent('nodeSelect', { detail: node.parent_id })
        window.dispatchEvent(event)
      } else {
        // If root node deleted, deselect
        const event = new CustomEvent('nodeSelect', { detail: null })
        window.dispatchEvent(event)
      }
    } else {
      alert('Failed to delete node: ' + error.message)
    }
  }

  const handleBreadcrumbClick = (crumbId: string) => {
    const event = new CustomEvent('nodeSelect', { detail: crumbId })
    window.dispatchEvent(event)
  }

  const handleGenerateFromChat = async (messages: any[]) => {
    console.log('Generate structure from chat:', messages)
    alert('Generating structure from conversation... (Coming soon)')
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
    <>
      <div className="h-full flex flex-col">
        <div className="bg-white border-b px-3 sm:px-6 py-3 sm:py-4 overflow-y-auto">
          {breadcrumbs.length > 1 && (
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm mb-2 sm:mb-3 text-gray-600 overflow-x-auto pb-1">
              {breadcrumbs.map((crumb, idx) => (
                <div key={crumb.id} className="flex items-center gap-2">
                  {idx > 0 && <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />}
                  <button
                    onClick={() => handleBreadcrumbClick(crumb.id)}
                    className={`hover:text-blue-600 ${idx === breadcrumbs.length - 1 ? 'font-medium text-gray-900' : ''}`}
                  >
                    {crumb.name}
                  </button>
                </div>
              ))}
            </div>
          )}

          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 border-b-2 border-gray-300 inline-block pb-1 break-words">
            {node.name}
          </h1>
          
          {node.description && (
            <p className="text-gray-600 mt-2 sm:mt-3 text-sm sm:text-base">
              {node.description}
            </p>
          )}

          {/* Mind Map - Only for projects */}
          {node.type === 'project' && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Project Structure</h3>
              <MindMapView nodeId={node.id} />
            </div>
          )}

          {/* Skills Badges - Inline for features and systems */}
          {(node.type === 'feature' || node.type === 'system') && (
            <SkillsBadges
              nodeId={node.id}
              skills={node.skills || []}
              coordinatorRole={node.coordinator_role || null}
              onSkillsUpdated={loadNode}
            />
          )}

          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
            {canEdit(userRole) ? (
              <select
                value={node.status}
                onChange={(e) => updateStatus(e.target.value as NodeStatus)}
                className={`
                  px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full font-medium border-2 cursor-pointer w-full sm:w-auto
                  ${node.status === 'complete' ? 'bg-green-100 text-green-700 border-green-300' : ''}
                  ${node.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : ''}
                  ${node.status === 'mvp' ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}
                  ${node.status === 'testing' ? 'bg-purple-100 text-purple-700 border-purple-300' : ''}
                  ${node.status === 'planned' ? 'bg-gray-100 text-gray-700 border-gray-300' : ''}
                  ${node.status === 'idea' ? 'bg-gray-50 text-gray-600 border-gray-200' : ''}
                `}
              >
                <option value="idea">Idea</option>
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="mvp">MVP</option>
                <option value="testing">Testing</option>
                <option value="complete">Complete</option>
              </select>
            ) : (
              <span className={`
                px-3 py-1 text-sm rounded-full font-medium
                ${node.status === 'complete' ? 'bg-green-100 text-green-700' : ''}
                ${node.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : ''}
                ${node.status === 'mvp' ? 'bg-blue-100 text-blue-700' : ''}
                ${node.status === 'testing' ? 'bg-purple-100 text-purple-700' : ''}
                ${node.status === 'planned' ? 'bg-gray-100 text-gray-700' : ''}
                ${node.status === 'idea' ? 'bg-gray-100 text-gray-600' : ''}
              `}>
                {node.status}
              </span>
            )}

            {progress.total > 0 && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex-1 sm:w-24 md:w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600">
                  {progress.complete}/{progress.total}
                </span>
              </div>
            )}

            {canEdit(userRole) && node.is_critical !== undefined && node.parent_id && (
              <button
                onClick={async () => {
                  await toggleNodeCritical(node.id)
                  await loadNode()
                  onNodeCreated()
                }}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                  node.is_critical 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${
                  node.is_critical ? 'bg-orange-500' : 'bg-gray-400'
                }`} />
                {node.is_critical ? 'Critical' : 'Optional'}
              </button>
            )}

            <div className="text-gray-500">
              <span className="font-medium">Type:</span> {node.type}
            </div>
            
            <div className="text-gray-500">
              <span className="font-medium">Depth:</span> {node.depth}
            </div>
            
            <div className="text-gray-500">
              <span className="font-medium">Created:</span>{' '}
              {new Date(node.created_at).toLocaleDateString()}
            </div>

            {canEdit(userRole) && (
              <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
                <button
                  onClick={() => setShowChat(true)}
                  className="flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm text-blue-700 border border-blue-300 rounded-md hover:bg-blue-50 flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="sm:inline">Chat</span>
                </button>

                <button
                  onClick={() => setShowEditDialog(true)}
                  className="flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span className="sm:inline">Edit</span>
                </button>

                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="sm:inline">Delete</span>
                </button>
              </div>
            )}

            {userRole === 'viewer' && (
              <div className="ml-auto">
                <span className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                  Read-only
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1">
          <InfiniteCanvas nodeId={nodeId} />
        </div>
      </div>

      {showChat && (
        <ChatPanel
          nodeId={node.id}
          nodeName={node.name}
          onClose={() => setShowChat(false)}
          onGenerateStructure={handleGenerateFromChat}
        />
      )}

      {showEditDialog && (
        <EditNodeDialog
          node={node}
          onClose={() => setShowEditDialog(false)}
          onUpdated={() => {
            loadNode()
            onNodeCreated()
            setShowEditDialog(false)
          }}
        />
      )}

      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                Delete {node.name}?
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                This will permanently delete this {node.type} and all of its children. This action cannot be undone.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  className="w-full sm:w-auto px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteNode}
                  className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function EditNodeDialog({ 
  node, 
  onClose, 
  onUpdated 
}: { 
  node: Node
  onClose: () => void
  onUpdated: () => void
}) {
  const [name, setName] = useState(node.name)
  const [description, setDescription] = useState(node.description || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('nodes')
      .update({
        name,
        description: description || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', node.id)

    if (!error) {
      onUpdated()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            Edit {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-900">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-gray-900">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}