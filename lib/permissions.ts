import { supabase } from './supabase/client'

export type Role = 'owner' | 'editor' | 'viewer'

export async function getUserRole(workspaceId: string): Promise<Role | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  return (data?.role as Role) || null
}

export function canEdit(role: Role | null): boolean {
  return role === 'owner' || role === 'editor'
}

export function canManageMembers(role: Role | null): boolean {
  return role === 'owner'
}