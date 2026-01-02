'use client'

import { useState } from 'react'
import { Briefcase, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'

interface SkillsSectionProps {
  nodeId: string
  nodeName: string
  nodeType: string
  nodeDescription?: string
}

export function SkillsSection({ nodeId, nodeName, nodeType, nodeDescription }: SkillsSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const [skills, setSkills] = useState<string[]>([])
  const [coordinatorRole, setCoordinatorRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)

  const generateSkills = async () => {
    setLoading(true)
    
    try {
      // Call AI to generate context-aware skills
      const response = await fetch('/api/generate-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId,
          nodeName,
          nodeType,
          nodeDescription
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate skills')
      }

      setSkills(data.skills || [])
      setCoordinatorRole(data.coordinatorRole || null)
      setGenerated(true)
      setExpanded(true)
    } catch (error: any) {
      console.error('Error generating skills:', error)
      alert(error.message || 'Failed to generate skills')
    } finally {
      setLoading(false)
    }
  }

  // Only show for features and systems
  if (nodeType !== 'feature' && nodeType !== 'system') {
    return null
  }

  return (
    <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => {
          if (!generated) {
            generateSkills()
          } else {
            setExpanded(!expanded)
          }
        }}
        className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-bold text-purple-900">
            {nodeType === 'system' ? 'Coordinator Role' : 'Skills Needed'}
          </span>
          {!generated && (
            <Sparkles className="w-3 h-3 text-purple-600" />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {loading && (
            <div className="text-xs text-purple-600">Analyzing...</div>
          )}
          {generated ? (
            expanded ? <ChevronUp className="w-4 h-4 text-purple-600" /> : <ChevronDown className="w-4 h-4 text-purple-600" />
          ) : (
            <span className="text-xs text-purple-600">Click to generate</span>
          )}
        </div>
      </button>

      {expanded && generated && (
        <div className="p-4 bg-white">
          {/* System Level - Coordinator Role */}
          {nodeType === 'system' && coordinatorRole && (
            <div>
              <div className="text-sm font-medium text-gray-900 mb-2">
                {coordinatorRole}
              </div>
              <div className="text-xs text-gray-600">
                Coordinates all work within this system
              </div>
            </div>
          )}

          {/* Feature Level - Technical Skills */}
          {nodeType === 'feature' && skills.length > 0 && (
            <div>
              <div className="space-y-1">
                {skills.map((skill, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                    <span className="text-sm text-gray-900">{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Level - Also show aggregated skills */}
          {nodeType === 'system' && skills.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs font-bold text-gray-700 mb-2">
                REQUIRED SKILLS ACROSS FEATURES:
              </div>
              <div className="space-y-1">
                {skills.map((skill, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    <span className="text-xs text-gray-700">{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!skills || skills.length === 0) && !coordinatorRole && (
            <div className="text-sm text-gray-500">
              No specific skills identified for this {nodeType}
            </div>
          )}
        </div>
      )}
    </div>
  )
}