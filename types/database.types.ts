// Supabase database types

export interface Database {
  public: {
    Tables: {
      workspaces: WorkspaceTable
      workspace_members: WorkspaceMemberTable
      workspace_invites: WorkspaceInviteTable
      nodes: NodeTable
      canvas_data: CanvasDataTable
    }
  }
}

export interface WorkspaceTable {
  Row: {
    id: string
    name: string
    description: string | null
    user_id: string
    is_default: boolean
    created_at: string
    updated_at: string
  }
  Insert: Omit<WorkspaceTable['Row'], 'id' | 'created_at' | 'updated_at'>
  Update: Partial<WorkspaceTable['Insert']>
}

export interface WorkspaceMemberTable {
  Row: {
    id: string
    workspace_id: string
    user_id: string
    role: 'owner' | 'editor' | 'viewer'
    created_at: string
  }
  Insert: Omit<WorkspaceMemberTable['Row'], 'id' | 'created_at'>
  Update: Partial<WorkspaceMemberTable['Insert']>
}

export interface WorkspaceInviteTable {
  Row: {
    id: string
    workspace_id: string
    email: string
    role: 'editor' | 'viewer'
    token: string
    invited_by: string
    accepted: boolean
    expires_at: string
    created_at: string
  }
  Insert: Omit<WorkspaceInviteTable['Row'], 'id' | 'created_at'>
  Update: Partial<WorkspaceInviteTable['Insert']>
}

export interface NodeTable {
  Row: {
    id: string
    workspace_id: string
    parent_id: string | null
    type: 'project' | 'domain' | 'system' | 'feature' | 'component'
    name: string
    description: string | null
    path: string[]
    depth: number
    status: 'idea' | 'planned' | 'in_progress' | 'mvp' | 'testing' | 'complete' | 'archived'
    importance: 'critical' | 'important' | 'optional' | null
    owner_id: string | null
    created_at: string
    updated_at: string
    created_by: string | null
    auto_status: boolean
    is_critical: boolean
    ai_suggested: boolean
    ai_confidence: number | null
    confirmed: boolean
  }
  Insert: Omit<NodeTable['Row'], 'id' | 'created_at' | 'updated_at'>
  Update: Partial<NodeTable['Insert']>
}

export interface CanvasDataTable {
  Row: {
    id: string
    node_id: string
    snapshot: Record<string, unknown>
    created_at: string
    updated_at: string
  }
  Insert: Omit<CanvasDataTable['Row'], 'id' | 'created_at' | 'updated_at'>
  Update: Partial<CanvasDataTable['Insert']>
}