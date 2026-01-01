import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { detectIndustry } from '@/lib/scaffold/matcher'
import { buildScaffoldPrompt } from '@/lib/scaffold/prompts'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

interface GenerateScaffoldRequest {
  description: string
  workspaceId: string
  projectName?: string
}

export async function POST(request: Request) {
  try {
    const body: GenerateScaffoldRequest = await request.json()
    const { description, workspaceId, projectName } = body

    if (!description || !workspaceId) {
      return NextResponse.json(
        { error: 'Missing description or workspaceId' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Detect industry
    const industry = detectIndustry(description)
    console.log('🔍 Detected industry:', industry)

    // Build AI prompt
    const prompt = buildScaffoldPrompt(description, industry)
    console.log('📝 Prompt built, calling AI...')

    // Call Anthropic API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    // Extract JSON from response
    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from AI')
    }

    let scaffoldData
    try {
      scaffoldData = JSON.parse(content.text)
    } catch (parseError) {
      const jsonMatch = content.text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        scaffoldData = JSON.parse(jsonMatch[1])
      } else {
        throw new Error('Could not parse AI response as JSON')
      }
    }

    console.log('✅ AI generated scaffold:', scaffoldData)

    // Create project node
    const { data: projectNode, error: projectError } = await supabase
      .from('nodes')
      .insert({
        workspace_id: workspaceId,
        type: 'project',
        name: projectName || scaffoldData.projectName,
        description: scaffoldData.projectSummary,
        path: [],
        depth: 0,
        status: 'idea',
        auto_status: true,
        is_critical: true,
        ai_suggested: false,
        confirmed: true
      })
      .select()
      .single()

    if (projectError) {
      console.error('Error creating project:', projectError)
      throw projectError
    }

    console.log('📦 Created project:', projectNode.id)

    // Create ghost nodes
    const createdNodes = []

    for (const domain of scaffoldData.domains) {
      const { data: domainNode, error: domainError } = await supabase
        .from('nodes')
        .insert({
          workspace_id: workspaceId,
          parent_id: projectNode.id,
          type: 'domain',
          name: domain.name,
          description: null,
          path: [projectNode.id],
          depth: 1,
          status: 'idea',
          auto_status: true,
          is_critical: true,
          ai_suggested: true,
          ai_confidence: 0.9,
          confirmed: false
        })
        .select()
        .single()

      if (domainError) {
        console.error('Error creating domain:', domainError)
        continue
      }

      createdNodes.push(domainNode)

      for (const subdomain of domain.subdomains) {
        const { data: subdomainNode, error: subdomainError } = await supabase
          .from('nodes')
          .insert({
            workspace_id: workspaceId,
            parent_id: domainNode.id,
            type: 'system',
            name: subdomain.name,
            description: null,
            path: [projectNode.id, domainNode.id],
            depth: 2,
            status: 'idea',
            auto_status: true,
            is_critical: true,
            ai_suggested: true,
            ai_confidence: 0.85,
            confirmed: false
          })
          .select()
          .single()

        if (subdomainError) {
          console.error('Error creating subdomain:', subdomainError)
          continue
        }

        createdNodes.push(subdomainNode)

        for (const system of subdomain.systems || []) {
          const { data: systemNode, error: systemError } = await supabase
            .from('nodes')
            .insert({
              workspace_id: workspaceId,
              parent_id: subdomainNode.id,
              type: 'feature',
              name: system.name,
              description: null,
              path: [projectNode.id, domainNode.id, subdomainNode.id],
              depth: 3,
              status: 'idea',
              auto_status: true,
              is_critical: system.isCritical,
              ai_suggested: true,
              ai_confidence: 0.8,
              confirmed: false
            })
            .select()
            .single()

          if (systemError) {
            console.error('Error creating system:', systemError)
            continue
          }

          createdNodes.push(systemNode)
        }
      }
    }

    console.log(`✅ Created ${createdNodes.length} ghost nodes`)

    return NextResponse.json({
      success: true,
      projectId: projectNode.id,
      projectName: projectNode.name,
      summary: scaffoldData.projectSummary,
      industry: scaffoldData.industry,
      ghostNodesCount: createdNodes.length
    })

  } catch (error: unknown) {
    console.error('❌ Error generating scaffold:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate scaffold'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}