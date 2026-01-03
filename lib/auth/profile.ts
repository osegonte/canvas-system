import { supabase } from '@/lib/supabase/client'

export async function createUserProfile(
  userId: string,
  username: string,
  displayName: string,
  avatarUrl?: string
) {
  // Get next user number
  const { data: numberData, error: numberError } = await supabase
    .rpc('get_next_user_number')

  if (numberError) {
    throw new Error('Failed to generate user number')
  }

  const userNumber = numberData as string

  // Save username + assign ID
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      user_id: userId,
      username: username.toLowerCase(),
      user_number: userNumber,
      display_name: displayName,
      avatar_url: avatarUrl || null
    })
    .select()
    .single()

  if (error) throw error

  return data
}

export async function getUserByNumber(userNumber: string) {
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_number', userNumber)
    .single()

  return data
}

export async function searchUsers(query: string) {
  const cleanQuery = query.replace(/^[@#]/, '').toLowerCase()

  // Search by user number (unique)
  if (/^\d+$/.test(cleanQuery)) {
    const paddedNumber = cleanQuery.padStart(4, '0')
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_number', paddedNumber)
      .single()
    
    return data ? [data] : []
  }

  // Search by username (may return multiple)
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .ilike('username', `%${cleanQuery}%`)
    .limit(10)

  return data || []
}