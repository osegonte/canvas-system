'use client'

import { useEffect } from 'react'

interface InfiniteCanvasProps {
  nodeId: string
}

export function InfiniteCanvas({ nodeId }: InfiniteCanvasProps) {
  useEffect(() => {
    console.log('Canvas for node:', nodeId)
  }, [nodeId])

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-4xl mb-3">🎨</div>
        <div className="text-gray-600 font-medium">Canvas Area</div>
        <div className="text-sm text-gray-500 mt-1">Coming soon</div>
      </div>
    </div>
  )
}