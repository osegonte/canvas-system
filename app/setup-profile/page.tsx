'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { createUserProfile, checkUsernameAvailable } from '@/lib/auth/profile'
import { Check, X, Loader2 } from 'lucide-react'

export default function SetupProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [username, setUsername] = useState('')
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (username.length >= 3) {
        checkUsername()
      } else {
        setAvailable(null)
      }
    }, 300)

    return () => clearTimeout(debounce)
  }, [username])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)

    // Pre-fill username suggestion from email or name
    let suggestedUsername = 
      user.user_metadata?.preferred_username ||
      user.user_metadata?.user_name ||
      user.email?.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_') ||
      ''
    
    if (suggestedUsername) {
      // Check if this username is already taken
      const isAvailable = await checkUsernameAvailable(suggestedUsername)
      
      if (!isAvailable) {
        // Username taken - add random number suffix
        const randomSuffix = Math.floor(1000 + Math.random() * 9000) // 1000-9999
        suggestedUsername = `${suggestedUsername}${randomSuffix}`
      }
      
      setUsername(suggestedUsername)
    }
  }

  async function checkUsername() {
    if (username.length < 3 || username.length > 20) {
      setAvailable(false)
      return
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      setAvailable(false)
      return
    }

    setChecking(true)
    const isAvailable = await checkUsernameAvailable(username)
    setAvailable(isAvailable)
    setChecking(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!available || !user) return

    setLoading(true)
    setError(null)

    try {
      // Get display name from OAuth metadata
      const displayName = 
        user.user_metadata?.full_name || 
        user.user_metadata?.name || 
        user.email?.split('@')[0] || 
        'User'

      const avatarUrl = 
        user.user_metadata?.avatar_url || 
        user.user_metadata?.picture || 
        null

      // Create profile
      const profile = await createUserProfile(user.id, username, displayName, avatarUrl)

      console.log('✅ Profile created:', profile)

      // Create default workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name: 'My Workspace',
          description: 'Your personal workspace',
          user_id: user.id,
          is_default: true
        })
        .select()
        .single()

      if (workspaceError) {
        console.error('Workspace error:', workspaceError)
        throw workspaceError
      }

      if (workspace) {
        // Add user as owner
        const { error: memberError } = await supabase
          .from('workspace_members')
          .insert({
            workspace_id: workspace.id,
            user_id: user.id,
            role: 'owner'
          })

        if (memberError) {
          console.error('Member error:', memberError)
          throw memberError
        }
      }

      console.log('✅ Workspace created:', workspace)

      // Success! Redirect to app
      router.push('/')
      router.refresh()

    } catch (err: any) {
      console.error('❌ Error creating profile:', err)
      setError(err.message || 'Failed to create profile')
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          {user.user_metadata?.avatar_url && (
            <img 
              src={user.user_metadata.avatar_url} 
              alt="Avatar"
              className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-gray-200"
            />
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Canvas!
          </h1>
          <p className="text-gray-600">
            Choose your username to get started
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-900">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-gray-900"
                  placeholder="your_username"
                  required
                  minLength={3}
                  maxLength={20}
                  pattern="[a-z0-9_]+"
                  autoFocus
                  disabled={loading}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checking && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
                  {!checking && available === true && <Check className="w-5 h-5 text-green-600" />}
                  {!checking && available === false && <X className="w-5 h-5 text-red-600" />}
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Lowercase letters, numbers, and underscores only (3-20 characters)
              </div>
              {!checking && available === false && username.length >= 3 && (
                <div className="mt-1 text-xs text-red-600">
                  {/^[a-z0-9_]+$/.test(username) 
                    ? 'Username already taken - try adding numbers or changing it' 
                    : 'Invalid format'}
                </div>
              )}
              {!checking && available === true && (
                <div className="mt-1 text-xs text-green-600">
                  Username available!
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!available || loading}
              className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating profile...' : 'Continue'}
            </button>
          </form>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          You'll receive a unique user number after setup
        </div>
      </div>
    </div>
  )
}