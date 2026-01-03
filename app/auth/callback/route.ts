import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    try {
      // Exchange code for session
      const { data: { user }, error: authError } = await supabase.auth.exchangeCodeForSession(code)

      if (authError) {
        console.error('Auth error:', authError)
        throw authError
      }

      if (user) {
        // Check if user has profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (!profile) {
          // No profile yet - redirect to setup
          return NextResponse.redirect(new URL('/setup-profile', requestUrl.origin))
        }

        // Profile exists - redirect to app
        return NextResponse.redirect(new URL('/', requestUrl.origin))
      }

    } catch (error) {
      console.error('Error in auth callback:', error)
      // Redirect to login with error
      return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin))
    }
  }

  // No code - redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}