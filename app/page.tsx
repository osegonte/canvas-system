'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { WorkspaceSidebar } from '@/components/sidebar/WorkspaceSidebar'
import { NodeView } from '@/components/NodeView'
import { WorkspaceSelector } from '@/components/WorkspaceSelector'
import { LogOut, Menu, X } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
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

    // Check if user has profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      router.push('/setup-profile')
      return
    }

    setUser(user)
    await ensureWorkspace(user.id)
    setLoading(false)
  }

  async function ensureWorkspace(userId: string) {
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (workspaces && workspaces.length > 0) {
      setCurrentWorkspaceId(workspaces[0].id)
    } else {
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
    setSelectedNodeId(null)
    setRefreshKey(prev => prev + 1)
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
      <div className="bg-white border-b px-3 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          {/* Hamburger - only on mobile */}
          <button
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
          >
            {showMobileSidebar ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
          {/* Hide "Canvas Project System" on mobile, show on desktop */}
          <h1 className="hidden md:block text-lg font-semibold text-gray-900">
            Canvas
          </h1>
          {/* Workspace selector - show on desktop in header */}
          <div className="hidden md:block">
            <WorkspaceSelector
              currentWorkspaceId={currentWorkspaceId}
              onWorkspaceChange={handleWorkspaceChange}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden lg:block text-sm text-gray-600">
            {user.email}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile workspace selector - full width below header */}
      <div className="md:hidden bg-white border-b px-3 py-2">
        <WorkspaceSelector
          currentWorkspaceId={currentWorkspaceId}
          onWorkspaceChange={handleWorkspaceChange}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay */}
        {showMobileSidebar && (
          <div 
            className="md:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed md:relative inset-y-0 left-0 z-40
          transform transition-transform duration-200 ease-in-out
          ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          w-[280px] md:w-64
        `}>
          <WorkspaceSidebar
            key={`${refreshKey}-${currentWorkspaceId}`}
            workspaceId={currentWorkspaceId}
            selectedNodeId={selectedNodeId}
            onNodeSelect={(id) => {
              setSelectedNodeId(id)
              setShowMobileSidebar(false)
            }}
          />
        </div>

        <main className="flex-1 overflow-hidden bg-gray-50">
          {selectedNodeId ? (
            <NodeView 
              nodeId={selectedNodeId} 
              onNodeCreated={handleNodeCreated}
            />
          ) : (
            <div className="flex items-center justify-center h-full px-4">
              <div className="text-center">
                <div className="text-5xl sm:text-6xl mb-4">👋</div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">
                  Welcome to Canvas
                </h2>
                <p className="text-sm sm:text-base text-gray-500">
                  Tap the menu to select a project
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}