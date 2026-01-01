'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Check, X, Loader2 } from 'lucide-react'

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('')

  useEffect(() => {
    acceptInvite()
  }, [token])

  async function acceptInvite() {
    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Redirect to login with return URL
        router.push(`/login?redirect=/invite/${token}`)
        return
      }

      // Get invite details
      const { data: invite, error: inviteError } = await supabase
        .from('workspace_invites')
        .select('*, workspaces(name)')
        .eq('token', token)
        .single()

      if (inviteError || !invite) {
        throw new Error('Invalid or expired invite')
      }

      if (invite.accepted) {
        throw new Error('This invite has already been used')
      }

      if (new Date(invite.expires_at) < new Date()) {
        throw new Error('This invite has expired')
      }

      // Check if user email matches
      if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
        throw new Error(`This invite is for ${invite.email}. Please log in with that account.`)
      }

      setWorkspaceName((invite.workspaces as any).name)

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', invite.workspace_id)
        .eq('user_id', user.id)
        .single()

      if (existingMember) {
        throw new Error('You are already a member of this workspace')
      }

      // Add user to workspace
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: invite.workspace_id,
          user_id: user.id,
          role: invite.role
        })

      if (memberError) throw memberError

      // Mark invite as accepted
      await supabase
        .from('workspace_invites')
        .update({ accepted: true })
        .eq('id', invite.id)

      setSuccess(true)

      // Redirect to workspace after 2 seconds
      setTimeout(() => {
        router.push('/')
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Failed to accept invite')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {loading && (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-gray-900">
              Accepting invite...
            </h2>
          </div>
        )}

        {success && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Welcome to {workspaceName}!
            </h2>
            <p className="text-gray-600">
              Redirecting you to the workspace...
            </p>
          </div>
        )}

        {error && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Invite Error
            </h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}