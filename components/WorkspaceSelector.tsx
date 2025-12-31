'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ChevronDown, Plus, Check } from 'lucide-react'

interface Workspace {
  id: string
  name: string
  description: string | null
}

interface WorkspaceSelectorProps {
  currentWorkspaceId: string
  onWorkspaceChange: (workspaceId: string) => void
}

export function WorkspaceSelector({ currentWorkspaceId, onWorkspaceChange }: WorkspaceSelectorProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    loadWorkspaces()
  }, [])

  async function loadWorkspaces() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('workspaces')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (data) {
      setWorkspaces(data)
    }
  }

  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId)

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
      >
        <span className="font-medium text-gray-900">
          {currentWorkspace?.name || 'Select workspace'}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute top-full mt-2 left-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-2">
              {workspaces.map(workspace => (
                <button
                  key={workspace.id}
                  onClick={() => {
                    onWorkspaceChange(workspace.id)
                    setShowDropdown(false)
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 rounded"
                >
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">{workspace.name}</div>
                    {workspace.description && (
                      <div className="text-xs text-gray-500">{workspace.description}</div>
                    )}
                  </div>
                  {workspace.id === currentWorkspaceId && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>

            <div className="border-t p-2">
              <button
                onClick={() => {
                  setShowCreateDialog(true)
                  setShowDropdown(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded"
              >
                <Plus className="w-4 h-4" />
                <span className="font-medium">New workspace</span>
              </button>
            </div>
          </div>
        </>
      )}

      {showCreateDialog && (
        <CreateWorkspaceDialog
          onClose={() => setShowCreateDialog(false)}
          onCreated={(workspaceId) => {
            loadWorkspaces()
            onWorkspaceChange(workspaceId)
            setShowCreateDialog(false)
          }}
        />
      )}
    </div>
  )
}

function CreateWorkspaceDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('workspaces')
      .insert({
        name,
        description: description || null,
        user_id: user.id
      })
      .select()
      .single()

    if (!error && data) {
      onCreated(data.id)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Create Workspace</h2>
        </div>

        <form onSubmit={handleCreate} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-900">
              Workspace Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              placeholder="My Team"
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
              rows={2}
              placeholder="What's this workspace for?"
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
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}