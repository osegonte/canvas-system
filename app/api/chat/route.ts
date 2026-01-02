import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string | Array<{ type: 'text' | 'image', text?: string, source?: any }>
}

interface ChatRequest {
  nodeId: string
  messages: ChatMessage[]
  images?: string[] // Base64 encoded images
}

export async function POST(request: Request) {
  try {
    const body: ChatRequest = await request.json()
    const { nodeId, messages, images } = body

    if (!nodeId || !messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Missing nodeId or messages' },
        { status: 400 }
      )
    }

    // Get node context
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

    // Get project context (root node)
    const rootId = node.path.length > 0 ? node.path[0] : node.id
    const { data: project } = await supabase
      .from('nodes')
      .select('*')
      .eq('id', rootId)
      .single()

    // Build context message
    const contextMessage = `You are helping plan the structure for: "${node.name}" (${node.type})

Project: ${project?.name || 'Unknown'}
${project?.description ? `Project Description: ${project.description}` : ''}

Current Node: ${node.name}
Type: ${node.type}
${node.description ? `Description: ${node.description}` : ''}

Your role: Help the user plan what should be built for this ${node.type}. Suggest components, features, or systems as appropriate. Be specific and practical.`

    // Build Claude messages
    const claudeMessages: any[] = [
      {
        role: 'user',
        content: contextMessage
      },
      {
        role: 'assistant',
        content: 'I understand the context. How can I help you plan this component?'
      }
    ]

    // Add conversation history
    for (const msg of messages) {
      if (msg.role === 'user' && images && images.length > 0) {
        // Handle images
        const content: any[] = [
          { type: 'text', text: msg.content as string }
        ]
        
        for (const imageBase64 of images) {
          content.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: imageBase64.split(',')[1] // Remove data:image/png;base64, prefix
            }
          })
        }
        
        claudeMessages.push({
          role: 'user',
          content
        })
      } else {
        claudeMessages.push({
          role: msg.role,
          content: msg.content
        })
      }
    }

    // Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: claudeMessages
    })

    const assistantMessage = response.content[0]
    if (assistantMessage.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    return NextResponse.json({
      success: true,
      message: assistantMessage.text
    })

  } catch (error: unknown) {
    console.error('❌ Chat error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Chat failed'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}