'use client'

import { useCallback, useEffect, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  NodeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { supabase } from '@/lib/supabase/client'
import { StickyNote, Image as ImageIcon, Minus, Type } from 'lucide-react'

interface InfiniteCanvasProps {
  nodeId: string
}

// Editable Note Node
function NoteNode({ data, id }: { data: any; id: string }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(data.content || '')

  return (
    <div className="px-4 py-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg shadow-md min-w-[200px] max-w-[300px]">
      {editing ? (
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => {
            data.onUpdate?.(id, text)
            setEditing(false)
          }}
          className="w-full min-h-[80px] bg-transparent border-none outline-none resize-none text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setEditing(false)
            }
          }}
        />
      ) : (
        <div
          onDoubleClick={() => setEditing(true)}
          className="text-sm text-gray-800 whitespace-pre-wrap cursor-text min-h-[80px]"
        >
          {text || 'Double-click to edit...'}
        </div>
      )}
    </div>
  )
}

// Editable Text Node
function TextNode({ data, id }: { data: any; id: string }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(data.content || '')

  return (
    <div className="px-4 py-2 bg-white border-2 border-gray-300 rounded shadow-sm">
      {editing ? (
        <input
          autoFocus
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => {
            data.onUpdate?.(id, text)
            setEditing(false)
          }}
          className="w-full bg-transparent border-none outline-none text-sm font-medium"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setEditing(false)
            if (e.key === 'Enter') {
              data.onUpdate?.(id, text)
              setEditing(false)
            }
          }}
        />
      ) : (
        <div
          onDoubleClick={() => setEditing(true)}
          className="text-sm font-medium text-gray-900 cursor-text"
        >
          {text || 'Double-click to edit...'}
        </div>
      )}
    </div>
  )
}

// Image Node
function ImageNode({ data }: { data: any }) {
  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg shadow-md overflow-hidden">
      {data.imageUrl ? (
        <img 
          src={data.imageUrl} 
          alt="Canvas image"
          className="max-w-[300px] max-h-[300px] object-contain"
        />
      ) : (
        <div className="w-[200px] h-[150px] flex items-center justify-center bg-gray-100">
          <ImageIcon className="w-12 h-12 text-gray-400" />
        </div>
      )}
    </div>
  )
}

const nodeTypes: NodeTypes = {
  note: NoteNode,
  text: TextNode,
  image: ImageNode,
}

export function InfiniteCanvas({ nodeId }: InfiniteCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCanvas()
  }, [nodeId])

  // Auto-save every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (nodes.length > 0 || edges.length > 0) {
        saveCanvas()
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [nodes, edges])

  async function loadCanvas() {
    try {
      const { data } = await supabase
        .from('canvas_data')
        .select('snapshot')
        .eq('node_id', nodeId)
        .maybeSingle()

      if (data?.snapshot) {
        if (data.snapshot.nodes) {
          // Add onUpdate callback to each node
          const nodesWithCallbacks = data.snapshot.nodes.map((node: Node) => ({
            ...node,
            data: {
              ...node.data,
              onUpdate: handleNodeUpdate
            }
          }))
          setNodes(nodesWithCallbacks)
        }
        if (data.snapshot.edges) setEdges(data.snapshot.edges)
      }
      setLoading(false)
    } catch (err) {
      console.error('Load error:', err)
      setLoading(false)
    }
  }

  async function saveCanvas() {
    try {
      // Remove callbacks before saving
      const nodesToSave = nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onUpdate: undefined
        }
      }))

      await supabase
        .from('canvas_data')
        .upsert({
          node_id: nodeId,
          snapshot: { nodes: nodesToSave, edges },
          updated_at: new Date().toISOString()
        })
    } catch (err) {
      console.error('Save error:', err)
    }
  }

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  function handleNodeUpdate(id: string, content: string) {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, content }
          }
        }
        return node
      })
    )
  }

  function addNote() {
    const newNode: Node = {
      id: `note-${Date.now()}`,
      type: 'note',
      position: { x: 100 + nodes.length * 30, y: 100 + nodes.length * 30 },
      data: { 
        content: '',
        onUpdate: handleNodeUpdate
      },
    }
    setNodes((nds) => [...nds, newNode])
  }

  function addText() {
    const newNode: Node = {
      id: `text-${Date.now()}`,
      type: 'text',
      position: { x: 150 + nodes.length * 30, y: 150 + nodes.length * 30 },
      data: { 
        content: '',
        onUpdate: handleNodeUpdate
      },
    }
    setNodes((nds) => [...nds, newNode])
  }

  function addImageNode() {
    const url = prompt('Enter image URL:')
    if (!url) return

    const newNode: Node = {
      id: `image-${Date.now()}`,
      type: 'image',
      position: { x: 150 + nodes.length * 30, y: 150 + nodes.length * 30 },
      data: { 
        imageUrl: url
      },
    }
    setNodes((nds) => [...nds, newNode])
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading canvas...</div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      {/* Clean Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex gap-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
        <button
          onClick={addNote}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Add Note"
        >
          <StickyNote className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={addText}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Add Text"
        >
          <Type className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={addImageNode}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Add Image"
        >
          <ImageIcon className="w-5 h-5 text-gray-700" />
        </button>
        <div className="w-px bg-gray-300" />
        <button
          onClick={() => setEdges([])}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Clear Connections"
        >
          <Minus className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            if (node.type === 'note') return '#fef3c7'
            if (node.type === 'text') return '#ffffff'
            if (node.type === 'image') return '#bfdbfe'
            return '#e5e7eb'
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  )
}