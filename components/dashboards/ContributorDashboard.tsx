'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Node } from '@/types/node.types'
import { UserProfile } from '@/types/user.types'
import { Target, BookOpen, Trophy, LucideIcon } from 'lucide-react'

interface ContributorDashboardProps {
  workspaceId: string
  profile: UserProfile
}

export function ContributorDashboard({ workspaceId, profile }: ContributorDashboardProps) {
  const [availableTasks, setAvailableTasks] = useState<Node[]>([])
  const [myTasks, setMyTasks] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTasks()
  }, [workspaceId, profile.user_id])

  async function loadTasks() {
    setLoading(true)

    const { data: available } = await supabase
      .from('nodes')
      .select('*')
      .eq('workspace_id', workspaceId)
      .is('claimed_by', null)
      .in('type', ['feature', 'component'])
      .limit(10)

    const { data: claimed } = await supabase
      .from('nodes')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('claimed_by', profile.user_id)

    setAvailableTasks(available || [])
    setMyTasks(claimed || [])
    setLoading(false)
  }

  async function claimTask(taskId: string) {
    const { error } = await supabase
      .from('nodes')
      .update({
        claimed_by: profile.user_id,
        claimed_at: new Date().toISOString(),
        submission_status: 'in_progress'
      })
      .eq('id', taskId)

    if (!error) {
      loadTasks()
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading dashboard...</div>
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {profile.display_name}!
              </h1>
              <p className="text-gray-600 mt-1">
                {profile.skill_level || 'beginner'} • {profile.completed_features} features completed
              </p>
            </div>

            <div className="flex gap-4">
              <StatCard
                icon={Target}
                label="My Tasks"
                value={myTasks.length}
                color="blue"
              />
              <StatCard
                icon={Trophy}
                label="Completed"
                value={profile.completed_features}
                color="green"
              />
              <StatCard
                icon={BookOpen}
                label="Skills"
                value={profile.skills_learned?.length || 0}
                color="purple"
              />
            </div>
          </div>
        </div>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            My Current Tasks ({myTasks.length})
          </h2>
          
          {myTasks.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="text-4xl mb-2">🎯</div>
              <p className="text-gray-600">No tasks claimed yet</p>
              <p className="text-sm text-gray-500 mt-1">Browse available tasks below</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myTasks.map(task => (
                <TaskCard key={task.id} task={task} showClaim={false} />
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Available Tasks ({availableTasks.length})
          </h2>

          {availableTasks.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="text-4xl mb-2">✨</div>
              <p className="text-gray-600">No tasks available</p>
              <p className="text-sm text-gray-500 mt-1">Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  showClaim={true}
                  onClaim={() => claimTask(task.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number
  color: 'blue' | 'green' | 'purple'
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colors: Record<'blue' | 'green' | 'purple', string> = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700'
  }

  return (
    <div className={`${colors[color]} rounded-lg p-4 min-w-[120px]`}>
      <Icon className="w-5 h-5 mb-2" />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm">{label}</div>
    </div>
  )
}

interface TaskCardProps {
  task: Node
  showClaim: boolean
  onClaim?: () => void
}

function TaskCard({ task, showClaim, onClaim }: TaskCardProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{task.name}</h3>
          {task.description && (
            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
          )}

          <div className="flex items-center gap-2 mt-3">
            {task.difficulty && (
              <span className={`
                px-2 py-1 text-xs rounded-full font-medium
                ${task.difficulty === 'beginner' ? 'bg-green-100 text-green-700' : ''}
                ${task.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' : ''}
                ${task.difficulty === 'advanced' ? 'bg-red-100 text-red-700' : ''}
              `}>
                {task.difficulty}
              </span>
            )}

            {task.skills && task.skills.length > 0 && (
              <div className="flex gap-1">
                {task.skills.slice(0, 3).map((skill: string, idx: number) => (
                  <span key={idx} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            )}

            {task.learning_outcomes && task.learning_outcomes.length > 0 && (
              <span className="text-xs text-gray-500">
                📚 {task.learning_outcomes.length} skills to learn
              </span>
            )}
          </div>
        </div>

        {showClaim && onClaim && (
          <button
            onClick={onClaim}
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex-shrink-0"
          >
            Claim Task
          </button>
        )}

        {!showClaim && task.submission_status && (
          <span className={`
            ml-4 px-3 py-1 text-xs rounded-full font-medium flex-shrink-0
            ${task.submission_status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : ''}
            ${task.submission_status === 'submitted' ? 'bg-blue-100 text-blue-700' : ''}
            ${task.submission_status === 'approved' ? 'bg-green-100 text-green-700' : ''}
          `}>
            {task.submission_status.replace('_', ' ')}
          </span>
        )}
      </div>
    </div>
  )
}