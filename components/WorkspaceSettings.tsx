'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { X, UserPlus, Settings as SettingsIcon } from 'lucide-react'
import { MembersList } from './MembersList'
import { InviteMemberDialog } from './InviteMemberDialog'

interface WorkspaceSettingsProps {
  workspaceId: string
  workspaceName: string
  currentUserId: string
  onClose: () => void
  onUpdated: () => void
}

export function WorkspaceSettings({ 
  workspaceId, 
  workspaceName, 
  currentUserId, 
  onClose, 
  onUpdated 
}: WorkspaceSettingsProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'settings'>('members')
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [userRole, setUserRole] = useState<'owner' | 'editor' | 'viewer' | null>(null)
  const [name, setName] = useState(workspaceName)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadUserRole()
  }, [workspaceId, currentUserId])

  async function loadUserRole() {
    const { data } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', currentUserId)
      .single()

    if (data) {
      setUserRole(data.role)
    }
  }

  async function updateWorkspaceName() {
    setLoading(true)

    const { error } = await supabase
      .from('workspaces')
      .update({ name })
      .eq('id', workspaceId)

    if (!error) {
      onUpdated()
    }
    setLoading(false)
  }

  async function leaveWorkspace() {
    if (!confirm('Are you sure you want to leave this workspace?')) return

    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', currentUserId)

    if (!error) {
      onClose()
      onUpdated()
      window.location.reload()
    }
  }

  async function deleteWorkspace() {
    if (!confirm('⚠️ DELETE ENTIRE WORKSPACE? This will delete all projects, domains, systems, and features. This cannot be undone!')) return
    if (!confirm('Are you ABSOLUTELY sure? Type DELETE to confirm:') === true) return

    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId)

    if (!error) {
      onClose()
      window.location.reload()
    }
  }

  const isOwner = userRole === 'owner'

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-bold text-gray-900">
              Workspace Settings
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('members')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'members'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Members
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'settings'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Settings
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'members' && (
              <div className="space-y-4">
                {isOwner && (
                  <button
                    onClick={() => setShowInviteDialog(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <UserPlus className="w-5 h-5" />
                    Invite Member
                  </button>
                )}

                <MembersList
                  workspaceId={workspaceId}
                  currentUserId={currentUserId}
                  onMemberRemoved={onUpdated}
                />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-900">
                    Workspace Name
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                      disabled={!isOwner}
                    />
                    {isOwner && (
                      <button
                        onClick={updateWorkspaceName}
                        disabled={loading || name === workspaceName}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Danger Zone</h3>
                  
                  {!isOwner && (
                    <button
                      onClick={leaveWorkspace}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Leave Workspace
                    </button>
                  )}

                  {isOwner && (
                    <button
                      onClick={deleteWorkspace}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Delete Workspace
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showInviteDialog && (
        <InviteMemberDialog
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          onClose={() => setShowInviteDialog(false)}
          onInvited={() => {
            setShowInviteDialog(false)
            onUpdated()
          }}
        />
      )}
    </>
  )
}