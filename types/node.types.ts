export type NodeType = 'project' | 'domain' | 'system' | 'feature' | 'component'

export type NodeStatus = 
  | 'idea' 
  | 'planned' 
  | 'in_progress' 
  | 'mvp' 
  | 'testing' 
  | 'complete' 
  | 'archived'

export type NodeImportance = 'critical' | 'important' | 'optional'

export interface Node {
  id: string
  workspace_id: string
  parent_id: string | null
  type: NodeType
  name: string
  description: string | null
  path: string[]
  depth: number
  status: NodeStatus
  importance: NodeImportance | null
  owner_id: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  is_critical: boolean
  skills: string[]
  coordinator_role: string | null
}

export interface CreateNodeInput {
  workspace_id: string
  parent_id: string | null
  type: NodeType
  name: string
  description?: string
  path: string[]
  depth: number
  status?: NodeStatus
  importance?: NodeImportance
  owner_id?: string
  created_by?: string
  is_critical?: boolean
  skills?: string[]
  coordinator_role?: string
}