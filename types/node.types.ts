// Types of nodes in the hierarchy
export type NodeType = 'project' | 'domain' | 'system' | 'feature' | 'component'

// Status a node can be in
export type NodeStatus = 
  | 'idea' 
  | 'planned' 
  | 'in_progress' 
  | 'mvp' 
  | 'testing' 
  | 'complete' 
  | 'archived'

// Importance level
export type NodeImportance = 'critical' | 'important' | 'optional'

// The Node interface - matches your database schema
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
  auto_status: boolean  // ✅ Added
  is_critical: boolean  // ✅ Added
}

// For creating new nodes (subset of Node)
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
  auto_status?: boolean
  is_critical?: boolean
}