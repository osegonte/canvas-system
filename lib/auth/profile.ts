import { supabase } from '@/lib/supabase/client'

export async function getOrCreateUserProfile(userId: string) {
  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  return existingProfile
}

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
    console.error('Error getting user number:', numberError)
    throw new Error('Failed to generate user number')
  }

  const userNumber = numberData as string

  // Create profile
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

  if (error) {
    console.error('Error creating profile:', error)
    throw error
  }

  return data
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('username')
    .eq('username', username.toLowerCase())
    .single()

  return !data && !error
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
  // Support searching by:
  // - User number: #0042 or 0042
  // - Username: victor or @victor
  
  const cleanQuery = query.replace(/^[@#]/, '').toLowerCase()

  // Try user number first
  if (/^\d+$/.test(cleanQuery)) {
    const paddedNumber = cleanQuery.padStart(4, '0')
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_number', paddedNumber)
      .single()
    
    return data ? [data] : []
  }

  // Search by username
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .ilike('username', `%${cleanQuery}%`)
    .limit(10)

  return data || []
}