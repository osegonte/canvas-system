export type RoleType = 'student' | 'professional' | 'investor' | 'coordinator' | 'contributor'
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export interface UserProfile {
  user_id: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  role_type: RoleType | null
  skill_level: SkillLevel | null
  skills_learned: string[]
  completed_features: number
  team_ids: string[]
  specialty: string | null
  investment_amount: number | null
  equity_percentage: number | null
  created_at: string
  updated_at: string
}