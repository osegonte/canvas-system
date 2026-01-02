'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getUserProfile } from '@/lib/user-profile'
import { UserProfile } from '@/types/user.types'
import { WorkspaceSidebar } from '@/components/sidebar/WorkspaceSidebar'
import { NodeView } from '@/components/NodeView'
import { WorkspaceSelector } from '@/components/WorkspaceSelector'
import { ContributorDashboard } from '@/components/dashboards/ContributorDashboard'
import { LogOut } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
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
    
    // Load user profile
    const userProfile = await getUserProfile()
    console.log('User profile loaded:', userProfile)
    setProfile(userProfile)

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

  // Show dashboard if no node selected AND user has a profile
  const showDashboard = !selectedNodeId && profile

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

        <main className="flex-1 overflow-hidden bg-gray-50">
          {selectedNodeId ? (
            <NodeView 
              nodeId={selectedNodeId} 
              onNodeCreated={handleNodeCreated}
            />
          ) : showDashboard ? (
            <ContributorDashboard 
              workspaceId={currentWorkspaceId}
              profile={profile}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">👋</div>
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                  Welcome to Canvas
                </h2>
                <p className="text-gray-500">
                  {profile ? 'Loading dashboard...' : 'Setting up your profile...'}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}