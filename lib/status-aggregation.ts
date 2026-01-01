import { supabase } from './supabase/client'
import { NodeStatus } from '@/types/node.types'

// Status priority (higher = more complete)
const STATUS_PRIORITY: Record<NodeStatus, number> = {
  'idea': 0,
  'planned': 1,
  'in_progress': 2,
  'mvp': 3,
  'testing': 4,
  'complete': 5,
  'archived': -1
}

interface NodeWithChildren {
  id: string
  status: NodeStatus
  auto_status: boolean
  is_critical: boolean
  parent_id: string | null
}

/**
 * Calculate what a parent's status should be based on its children
 */
export function calculateAggregatedStatus(children: NodeWithChildren[]): NodeStatus {
  // Filter to only critical children
  const criticalChildren = children.filter(c => c.is_critical)
  
  if (criticalChildren.length === 0) {
    return 'idea' // No critical children = default to idea
  }

  // Get all statuses
  const statuses = criticalChildren.map(c => c.status)
  
  // If ALL critical children are complete → parent is complete
  const allComplete = statuses.every(s => s === 'complete')
  if (allComplete) return 'complete'

  // If ALL critical children are at least MVP → parent is MVP
  const allMvpOrBetter = statuses.every(s => 
    STATUS_PRIORITY[s] >= STATUS_PRIORITY['mvp']
  )
  if (allMvpOrBetter) return 'mvp'

  // If ALL critical children are at least testing → parent is testing
  const allTestingOrBetter = statuses.every(s => 
    STATUS_PRIORITY[s] >= STATUS_PRIORITY['testing']
  )
  if (allTestingOrBetter) return 'testing'

  // If ANY child is in_progress → parent is in_progress
  const anyInProgress = statuses.some(s => s === 'in_progress')
  if (anyInProgress) return 'in_progress'

  // If ALL are at least planned → parent is planned
  const allPlanned = statuses.every(s => 
    STATUS_PRIORITY[s] >= STATUS_PRIORITY['planned']
  )
  if (allPlanned) return 'planned'

  // Default to idea
  return 'idea'
}

/**
 * Get progress stats for a node based on its children
 */
export async function getNodeProgress(nodeId: string): Promise<{
  total: number
  complete: number
  inProgress: number
  percentage: number
}> {
  const { data: children } = await supabase
    .from('nodes')
    .select('status, is_critical')
    .eq('parent_id', nodeId)

  if (!children || children.length === 0) {
    return { total: 0, complete: 0, inProgress: 0, percentage: 0 }
  }

  const criticalChildren = children.filter(c => c.is_critical)
  const total = criticalChildren.length
  const complete = criticalChildren.filter(c => c.status === 'complete').length
  const inProgress = criticalChildren.filter(c => c.status === 'in_progress').length
  const percentage = total > 0 ? Math.round((complete / total) * 100) : 0

  return { total, complete, inProgress, percentage }
}

/**
 * Update a node's status and propagate up the tree
 */
export async function updateNodeStatusWithPropagation(
  nodeId: string,
  newStatus: NodeStatus
): Promise<void> {
  // Update this node's status
  await supabase
    .from('nodes')
    .update({ 
      status: newStatus,
      auto_status: false, // Manual override
      updated_at: new Date().toISOString()
    })
    .eq('id', nodeId)

  // Get the node to find its parent
  const { data: node } = await supabase
    .from('nodes')
    .select('parent_id')
    .eq('id', nodeId)
    .single()

  if (!node?.parent_id) return // Root node, nothing to propagate

  // Propagate up the tree
  await propagateStatusUp(node.parent_id)
}

/**
 * Recursively update parent statuses based on children
 */
async function propagateStatusUp(nodeId: string): Promise<void> {
  // Get the node
  const { data: node } = await supabase
    .from('nodes')
    .select('id, parent_id, auto_status')
    .eq('id', nodeId)
    .single()

  if (!node) return

  // Only auto-update if auto_status is enabled
  if (!node.auto_status) return

  // Get all children
  const { data: children } = await supabase
    .from('nodes')
    .select('status, is_critical, auto_status')
    .eq('parent_id', nodeId)

  if (!children || children.length === 0) return

  // Calculate new status
  const newStatus = calculateAggregatedStatus(children as NodeWithChildren[])

  // Update this node
  await supabase
    .from('nodes')
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', nodeId)

  // Continue up the tree
  if (node.parent_id) {
    await propagateStatusUp(node.parent_id)
  }
}

/**
 * Enable auto-status for a node (re-calculate from children)
 */
export async function enableAutoStatus(nodeId: string): Promise<void> {
  await supabase
    .from('nodes')
    .update({ auto_status: true })
    .eq('id', nodeId)

  await propagateStatusUp(nodeId)
}

/**
 * Toggle if a node is critical (affects parent status)
 */
export async function toggleNodeCritical(nodeId: string): Promise<void> {
  const { data: node } = await supabase
    .from('nodes')
    .select('is_critical, parent_id')
    .eq('id', nodeId)
    .single()

  if (!node) return

  await supabase
    .from('nodes')
    .update({ is_critical: !node.is_critical })
    .eq('id', nodeId)

  // Update parent if exists
  if (node.parent_id) {
    await propagateStatusUp(node.parent_id)
  }
}