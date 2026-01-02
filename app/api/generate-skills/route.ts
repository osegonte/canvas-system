import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface GenerateSkillsRequest {
  nodeId: string
  nodeName: string
  nodeType: string
  nodeDescription?: string
}

export async function POST(request: Request) {
  try {
    const body: GenerateSkillsRequest = await request.json()
    const { nodeId, nodeName, nodeType, nodeDescription } = body

    if (!nodeId || !nodeName || !nodeType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get node with full context
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

    // Get ALL ancestor nodes
    const ancestorIds = node.path || []
    let ancestors: any[] = []
    if (ancestorIds.length > 0) {
      const { data } = await supabase
        .from('nodes')
        .select('*')
        .in('id', ancestorIds)
      
      if (data) {
        ancestors = ancestorIds.map(id => data.find(n => n.id === id)).filter(Boolean)
      }
    }

    // Build hierarchical context
    const pathContext = ancestors.map(a => `${a.name} (${a.type})`).join(' → ')
    const fullPath = pathContext ? `${pathContext} → ${nodeName}` : nodeName

    // Determine domain
    const domainNode = ancestors.find(a => a.type === 'domain')
    const isHardware = domainNode?.name?.toLowerCase().includes('hardware')
    const isSoftware = domainNode?.name?.toLowerCase().includes('software')

    // Get project context
    const rootId = ancestorIds.length > 0 ? ancestorIds[0] : node.id
    const { data: project } = await supabase
      .from('nodes')
      .select('*')
      .eq('id', rootId)
      .single()

    let prompt = ''

    if (nodeType === 'feature') {
      prompt = `You are analyzing a feature to determine the PRACTICAL SKILLS needed.

Project: ${project?.name || 'Unknown'}
Full Path: ${fullPath}
Feature: ${nodeName}
${nodeDescription ? `Description: ${nodeDescription}` : ''}
Domain: ${isHardware ? 'HARDWARE' : isSoftware ? 'SOFTWARE' : 'GENERAL'}

INSTRUCTIONS:

${isHardware ? `
HARDWARE feature - List PHYSICAL/TRADE skills:
- Examples: "Plumbing", "Welding", "Electrical wiring", "Sensor installation", "pH system setup", "Vertical farm design"
- Focus on hands-on worker skills
- Include techniques (e.g., "PVC pipe installation" not "PVC pipes")
` : isSoftware ? `
SOFTWARE feature - List PROGRAMMING/TECHNICAL skills:
- Examples: "React", "TypeScript", "Python", "PostgreSQL", "REST APIs"
- Languages, frameworks, libraries, tools
- Be specific
` : `List specific skills needed for this feature`}

Rules:
- Maximum 6 skills
- Concise and actionable
- Return ONLY a JSON array

Example (Hardware): ["Plumbing", "PVC pipe installation", "Pressure valve setup", "Drip irrigation"]
Example (Software): ["React", "TypeScript", "Tailwind CSS", "REST APIs"]

Return ONLY JSON array.`

    } else if (nodeType === 'system') {
      prompt = `Analyze this system for coordinator role and key skills.

Project: ${project?.name || 'Unknown'}
Full Path: ${fullPath}
System: ${nodeName}
${nodeDescription ? `Description: ${nodeDescription}` : ''}
Domain: ${isHardware ? 'HARDWARE' : isSoftware ? 'SOFTWARE' : 'GENERAL'}

Task:
1. Coordinator/architect role for this system
2. High-level skills across features

${isHardware ? `
HARDWARE system:
- Coordinator: Physical construction/installation lead
- Skills: Physical/trade skills
` : isSoftware ? `
SOFTWARE system:
- Coordinator: Software architect
- Skills: Technical skills
` : ``}

Return JSON:
{
  "coordinatorRole": "Frontend Architect",
  "skills": ["React", "TypeScript", "UI/UX", "API Integration"]
}

Return ONLY JSON.`
    }

    // Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })

    const assistantMessage = response.content[0]
    if (assistantMessage.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    // Parse JSON
    const cleanedResponse = assistantMessage.text.trim()
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const result = JSON.parse(cleanedResponse)

    // Save to database
    if (nodeType === 'feature') {
      if (!Array.isArray(result)) {
        throw new Error('Invalid response format')
      }

      await supabase
        .from('nodes')
        .update({ skills: result })
        .eq('id', nodeId)

      return NextResponse.json({
        success: true,
        skills: result,
        coordinatorRole: null
      })

    } else if (nodeType === 'system') {
      await supabase
        .from('nodes')
        .update({
          skills: result.skills || [],
          coordinator_role: result.coordinatorRole || null
        })
        .eq('id', nodeId)

      return NextResponse.json({
        success: true,
        skills: result.skills || [],
        coordinatorRole: result.coordinatorRole || null
      })
    }

    return NextResponse.json({
      success: true,
      skills: [],
      coordinatorRole: null
    })

  } catch (error: unknown) {
    console.error('❌ Skills generation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}