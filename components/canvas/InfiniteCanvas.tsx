'use client'

import { Tldraw, Editor, TLStoreSnapshot } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
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

  const handleMount = async (editor: Editor) => {
    editorRef.current = editor

    // Load saved canvas
    try {
      const { data } = await supabase
        .from('canvas_data')
        .select('snapshot')
        .eq('node_id', nodeId)
        .single()

      if (data?.snapshot && Object.keys(data.snapshot).length > 0) {
        // Check if snapshot has valid structure
        if (data.snapshot.store || data.snapshot.schema) {
          editor.store.loadSnapshot(data.snapshot)
          console.log('📥 Canvas loaded')
        }
      } else {
        console.log('📄 New canvas')
      }
    } catch (err) {
      console.log('📄 New canvas (error loading):', err)
    }

    // Auto-save on changes
    const handleChange = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveCanvas(editor)
      }, 2000)
    }

    editor.store.listen(handleChange, { scope: 'document' })
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
        // Clean UI like Overflow
        hideUi={false}
        // You can customize components here for even cleaner UI
      />
    </div>
  )
}