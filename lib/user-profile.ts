import { supabase } from './supabase/client'
import { UserProfile, RoleType } from '@/types/user.types'

export async function getUserProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return data as UserProfile | null
}

export async function getUserRoleType(): Promise<RoleType | null> {
  const profile = await getUserProfile()
  return profile?.role_type || null
}

export async function updateUserProfile(updates: Partial<UserProfile>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .select()
    .single()

  return { data, error }
}