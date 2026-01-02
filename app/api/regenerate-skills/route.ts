import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const { nodeId } = await request.json()

    if (!nodeId) {
      return NextResponse.json(
        { error: 'Missing nodeId' },
        { status: 400 }
      )
    }

    // Get node details
    const { data: node } = await supabase
      .from('nodes')
      .select('*')
      .eq('id', nodeId)
      .single()

    if (!node) {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      )
    }

    // Call generate-skills API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/generate-skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        nodeDescription: node.description
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to regenerate skills')
    }

    return NextResponse.json({
      success: true,
      skills: data.skills,
      coordinatorRole: data.coordinatorRole
    })

  } catch (error: unknown) {
    console.error('❌ Regenerate skills error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}