'use client'

import { useState } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'

interface SkillsBadgesProps {
  nodeId: string
  skills: string[]
  coordinatorRole: string | null
  onSkillsUpdated: () => void
}

export function SkillsBadges({ nodeId, skills, coordinatorRole, onSkillsUpdated }: SkillsBadgesProps) {
  const [generating, setGenerating] = useState(false)

  const regenerateSkills = async () => {
    setGenerating(true)
    
    try {
      const response = await fetch('/api/regenerate-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId })
      })

      if (!response.ok) {
        throw new Error('Failed to regenerate skills')
      }

      onSkillsUpdated()
    } catch (error: any) {
      console.error('Error regenerating skills:', error)
      alert(error.message || 'Failed to regenerate skills')
    } finally {
      setGenerating(false)
    }
  }

  // Show coordinator role for systems
  if (coordinatorRole) {
    return (
      <div className="flex items-center gap-2 flex-wrap mt-3">
        <span className="text-xs font-bold text-gray-700">Coordinator:</span>
        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
          {coordinatorRole}
        </span>
        
        {skills.length > 0 && (
          <>
            <span className="text-xs font-bold text-gray-700 ml-2">Skills:</span>
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
              >
                {skill}
              </span>
            ))}
          </>
        )}

        <button
          onClick={regenerateSkills}
          disabled={generating}
          className="ml-auto p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
          title="Regenerate skills"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
        </button>
      </div>
    )
  }

  // Show skills for features
  if (!skills || skills.length === 0) {
    return (
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs text-gray-500">
          <Sparkles className="w-3 h-3 inline mr-1" />
          Generating skills...
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap mt-3">
      <span className="text-xs font-bold text-gray-700">Skills:</span>
      
      {skills.map((skill, idx) => (
        <span
          key={idx}
          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
        >
          {skill}
        </span>
      ))}

      <button
        onClick={regenerateSkills}
        disabled={generating}
        className="ml-auto p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
        title="Regenerate skills"
      >
        <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
      </button>
    </div>
  )
}