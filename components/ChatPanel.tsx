'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Plus, Mic, Send, Loader2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatPanelProps {
  nodeId: string
  nodeName: string
  onClose: () => void
  onGenerateStructure: (messages: Message[]) => void
}

export function ChatPanel({ nodeId, nodeName, onClose, onGenerateStructure }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() && uploadedImages.length === 0) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId,
          messages: [...messages, userMessage],
          images: uploadedImages.length > 0 ? uploadedImages : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Chat failed')
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      setUploadedImages([])

    } catch (error: any) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to send message'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support microphone access. Please use Chrome, Edge, or Safari.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.start()
      setRecording(true)

    } catch (error: any) {
      console.error('Error starting recording:', error)
      
      let errorMsg = 'Could not access microphone.'
      if (error.name === 'NotAllowedError') {
        errorMsg = 'Microphone access denied. Please allow microphone access in your browser settings.'
      } else if (error.name === 'NotFoundError') {
        errorMsg = 'No microphone found. Please connect a microphone.'
      } else if (error.message) {
        errorMsg = error.message
      }
      
      alert(errorMsg)
    }
  }

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return

    mediaRecorderRef.current.stop()
    setRecording(false)

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      
      setLoading(true)
      try {
        const formData = new FormData()
        formData.append('audio', audioBlob, 'recording.webm')

        const response = await fetch('/api/transcribe', {
          method: 'POST',
          body: formData
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Transcription failed')
        }

        setInput(data.text)
      } catch (error: any) {
        console.error('Transcription error:', error)
        alert(error.message || 'Failed to transcribe audio')
      } finally {
        setLoading(false)
      }

      mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop())
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setRecording(false)
      audioChunksRef.current = []
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImages(prev => [...prev, event.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-2xl flex flex-col z-50">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h3 className="font-bold text-gray-900">AI Assistant</h3>
          <p className="text-xs text-gray-500">{nodeName}</p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-8">
            <div className="text-4xl mb-2">💬</div>
            <p>Start planning your {nodeName}</p>
            <p className="text-xs mt-2">Ask questions, share ideas, or upload images</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {uploadedImages.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 flex gap-2 overflow-x-auto">
          {uploadedImages.map((img, idx) => (
            <div key={idx} className="relative">
              <img src={img} alt="Upload" className="w-16 h-16 object-cover rounded" />
              <button
                onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 border-t border-gray-200">
        {!recording ? (
          <div className="bg-gray-50 rounded-full flex items-center gap-2 px-4 py-3 border border-gray-200">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1 hover:bg-gray-200 rounded-full flex-shrink-0"
              title="Upload image"
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask anything"
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400"
              disabled={loading}
            />

            <button
              onClick={startRecording}
              className="p-1 hover:bg-gray-200 rounded-full flex-shrink-0"
              title="Voice input"
              disabled={loading}
            >
              <Mic className="w-5 h-5 text-gray-600" />
            </button>

            {input.trim() && (
              <button
                onClick={sendMessage}
                disabled={loading}
                className="p-1 hover:bg-gray-200 rounded-full flex-shrink-0"
              >
                <Send className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
        ) : (
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mic className="w-5 h-5 text-white animate-pulse" />
                <span className="text-white text-sm font-medium">
                  Listening<span className="animate-pulse">...</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={cancelRecording}
                  className="p-2 hover:bg-gray-800 rounded-full flex-shrink-0"
                  title="Cancel"
                >
                  <X className="w-5 h-5 text-white" />
                </button>

                <button
                  onClick={stopRecording}
                  className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full flex-shrink-0"
                  title="Send"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <button
            onClick={() => onGenerateStructure(messages)}
            className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Generate Structure from Chat
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  )
}