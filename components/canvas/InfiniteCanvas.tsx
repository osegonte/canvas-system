'use client'

import { Tldraw, Editor } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import './canvas.css'  // Add this line
import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

interface InfiniteCanvasProps {
  nodeId: string
}

export function InfiniteCanvas({ nodeId }: InfiniteCanvasProps) {
  const editorRef = useRef<Editor | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const handleMount = (editor: Editor) => {
    editorRef.current = editor

    // Load saved canvas (async but don't block mount)
    loadCanvas(editor)

    // Auto-save on changes
    const cleanup = editor.store.listen(() => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveCanvas(editor)
      }, 2000)
    }, { scope: 'document' })

    // Return cleanup function
    return cleanup
  }

  const loadCanvas = async (editor: Editor) => {
    try {
      const { data } = await supabase
        .from('canvas_data')
        .select('snapshot')
        .eq('node_id', nodeId)
        .single()

      if (data?.snapshot && typeof data.snapshot === 'object') {
        const snapshot = data.snapshot as any
        if (snapshot.store && snapshot.schema) {
          editor.store.loadSnapshot(snapshot)
          console.log('📥 Canvas loaded')
        }
      } else {
        console.log('📄 New canvas')
      }
    } catch (err) {
      console.log('📄 New canvas')
    }
  }

  const saveCanvas = async (editor: Editor) => {
    try {
      const snapshot = editor.store.getStoreSnapshot()

      const { error } = await supabase
        .from('canvas_data')
        .update({
          snapshot: snapshot as any,
          updated_at: new Date().toISOString()
        })
        .eq('node_id', nodeId)

      if (error) {
        console.error('❌ Error saving:', error)
      } else {
        console.log('✅ Canvas saved')
      }
    } catch (err) {
      console.error('Error saving:', err)
    }
  }

  return (
    <div className="w-full h-full">
      <Tldraw 
        onMount={handleMount}
        key={nodeId}
      />
    </div>
  )
}