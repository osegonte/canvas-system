// Canvas-related types for the infinite canvas feature (future implementation)

export interface CanvasData {
  snapshot: Record<string, unknown>
  version?: string
}

export interface CanvasNode {
  id: string
  node_id: string
  snapshot: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export type CanvasPosition = {
  x: number
  y: number
}

export type CanvasSize = {
  width: number
  height: number
}