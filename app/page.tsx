'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { WorkspaceSidebar } from '@/components/sidebar/WorkspaceSidebar'
import { NodeView } from '@/components/NodeView'
import { WorkspaceSelector } from '@/components/WorkspaceSelector'
import { LogOut } from 'lucide-react'

export default function HomePage() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    initializeUser()
  }, [])

  async function initializeUser() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)
    await ensureWorkspace(user.id)
    setLoading(false)
  }

  async function ensureWorkspace(userId: string) {
    // Check if user has any workspaces
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (workspaces && workspaces.length > 0) {
      setCurrentWorkspaceId(workspaces[0].id)
    } else {
      // Create default workspace
      const { data: newWorkspace } = await supabase
        .from('workspaces')
        .insert({
          name: 'My Workspace',
          description: 'Your personal workspace',
          user_id: userId,
          is_default: true
        })
        .select()
        .single()

      if (newWorkspace) {
        setCurrentWorkspaceId(newWorkspace.id)
      }
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleNodeCreated = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleWorkspaceChange = (workspaceId: string) => {
    setCurrentWorkspaceId(workspaceId)
    setSelectedNodeId(null) // Clear selection when switching workspaces
    setRefreshKey(prev => prev + 1) // Refresh sidebar
  }

  if (loading || !currentWorkspaceId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden flex-col">
      {/* Top bar */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-900">
            Canvas Project System
          </h1>
          <WorkspaceSelector
            currentWorkspaceId={currentWorkspaceId}
            onWorkspaceChange={handleWorkspaceChange}
          />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user.email}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <WorkspaceSidebar
          key={`${refreshKey}-${currentWorkspaceId}`}
          workspaceId={currentWorkspaceId}
          selectedNodeId={selectedNodeId}
          onNodeSelect={setSelectedNodeId}
        />

        <main className="flex-1 overflow-hidden">
          {selectedNodeId ? (
            <NodeView 
              nodeId={selectedNodeId} 
              onNodeCreated={handleNodeCreated}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="text-center">
                <div className="text-6xl mb-4">👋</div>
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                  Welcome to Canvas Project System
                </h2>
                <p className="text-gray-500">
                  Select a node from the sidebar or create a new project to get started
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}