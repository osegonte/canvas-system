'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { X, Mail, Copy, Check } from 'lucide-react'

interface InviteMemberDialogProps {
  workspaceId: string
  workspaceName: string
  onClose: () => void
  onInvited: () => void
}

export function InviteMemberDialog({ workspaceId, workspaceName, onClose, onInvited }: InviteMemberDialogProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'editor' | 'viewer'>('editor')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Generate unique token
      const token = crypto.randomUUID()

      // Create invite
      const { error: inviteError } = await supabase
        .from('workspace_invites')
        .insert({
          workspace_id: workspaceId,
          email: email.toLowerCase(),
          role,
          invited_by: user.id,
          token
        })

      if (inviteError) throw inviteError

      // Generate invite link
      const inviteUrl = `${window.location.origin}/invite/${token}`
      setInviteLink(inviteUrl)

      // TODO: Send email via Supabase Edge Function (optional)
      // For now, just show the link

      onInvited()
    } catch (err: any) {
      setError(err.message || 'Failed to create invite')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            Invite to {workspaceName}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {inviteLink ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <Mail className="w-5 h-5" />
                  <span className="font-medium">Invite created!</span>
                </div>
                <p className="text-sm text-green-600">
                  Share this link with {email}
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-gray-50"
                />
                <button
                  onClick={copyLink}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setInviteLink(null)
                    setEmail('')
                  }}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md"
                >
                  Invite another
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-900">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  placeholder="colleague@company.com"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-900">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                >
                  <option value="editor">Editor - Can create and edit</option>
                  <option value="viewer">Viewer - Read only</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  {loading ? 'Creating invite...' : 'Create invite link'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}