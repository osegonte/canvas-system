'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Trash2, Crown, Edit, Eye } from 'lucide-react'

interface Member {
  id: string
  user_id: string
  role: 'owner' | 'editor' | 'viewer'
  created_at: string
  email?: string
}

interface MembersListProps {
  workspaceId: string
  currentUserId: string
  onMemberRemoved: () => void
}

export function MembersList({ workspaceId, currentUserId, onMemberRemoved }: MembersListProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMembers()
  }, [workspaceId])

  async function loadMembers() {
    setLoading(true)

    // Get members
    const { data: membersData } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true })

    if (membersData) {
      // Get user emails from auth (would need Supabase admin API in production)
      // For now, just show user IDs
      setMembers(membersData)
    }

    setLoading(false)
  }

  async function removeMember(memberId: string, memberUserId: string) {
    if (!confirm('Remove this member from the workspace?')) return

    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', memberId)

    if (!error) {
      onMemberRemoved()
      loadMembers()
    }
  }

  async function changeRole(memberId: string, newRole: 'editor' | 'viewer') {
    const { error } = await supabase
      .from('workspace_members')
      .update({ role: newRole })
      .eq('id', memberId)

    if (!error) {
      loadMembers()
    }
  }

  const currentUserMember = members.find(m => m.user_id === currentUserId)
  const isOwner = currentUserMember?.role === 'owner'

  if (loading) {
    return <div className="text-sm text-gray-500">Loading members...</div>
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-gray-900 mb-3">
        Members ({members.length})
      </h3>

      {members.map(member => {
        const isCurrentUser = member.user_id === currentUserId
        const canModify = isOwner && !isCurrentUser && member.role !== 'owner'

        return (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium">
                {member.user_id.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {member.email || member.user_id.slice(0, 8)}...
                  {isCurrentUser && <span className="text-gray-500 ml-2">(You)</span>}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  {member.role === 'owner' && <Crown className="w-3 h-3 text-yellow-600" />}
                  {member.role === 'editor' && <Edit className="w-3 h-3" />}
                  {member.role === 'viewer' && <Eye className="w-3 h-3" />}
                  <span className="capitalize">{member.role}</span>
                </div>
              </div>
            </div>

            {canModify && (
              <div className="flex items-center gap-2">
                {member.role !== 'viewer' && (
                  <button
                    onClick={() => changeRole(member.id, 'viewer')}
                    className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-200 rounded"
                    title="Make viewer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                {member.role !== 'editor' && (
                  <button
                    onClick={() => changeRole(member.id, 'editor')}
                    className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-200 rounded"
                    title="Make editor"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => removeMember(member.id, member.user_id)}
                  className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                  title="Remove member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}