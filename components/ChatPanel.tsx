'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
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
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [recording, setRecording] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load chat history when component mounts
  useEffect(() => {
    loadChatHistory()
  }, [nodeId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadChatHistory() {
    try {
      setLoadingHistory(true)

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('node_id', nodeId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading chat history:', error)
      } else if (data) {
        const loadedMessages: Message[] = data.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at)
        }))
        setMessages(loadedMessages)
      }
    } catch (err) {
      console.error('Failed to load chat history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  async function saveMessage(role: 'user' | 'assistant', content: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('chat_messages')
        .insert({
          node_id: nodeId,
          user_id: user.id,
          role,
          content
        })
    } catch (err) {
      console.error('Failed to save message:', err)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() && uploadedImages.length === 0) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    
    // Save user message to database
    await saveMessage('user', input)
    
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
      
      // Save assistant message to database
      await saveMessage('assistant', data.message)
      
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
        throw new Error('Your browser does not support microphone access.')
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
      alert(error.message || 'Could not access microphone')
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

  async function clearHistory() {
    if (!confirm('Clear all chat history for this node? This cannot be undone.')) return

    try {
      await supabase
        .from('chat_messages')
        .delete()
        .eq('node_id', nodeId)

      setMessages([])
    } catch (err) {
      console.error('Failed to clear history:', err)
      alert('Failed to clear history')
    }
  }

  if (loadingHistory) {
    return (
      <div className="fixed inset-0 md:right-0 md:left-auto md:w-96 bg-white md:border-l border-gray-200 md:shadow-2xl flex items-center justify-center z-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading chat history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 md:right-0 md:left-auto md:w-96 bg-white md:border-l border-gray-200 md:shadow-2xl flex flex-col z-50">
      {/* Header - Mobile friendly */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-white">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">AI Assistant</h3>
          <p className="text-xs text-gray-500 truncate">{nodeName}</p>
        </div>
        <div className="flex items-center gap-2 ml-2">
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-xs text-gray-500 hover:text-red-600 px-2 py-1"
              title="Clear history"
            >
              Clear
            </button>
          )}
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-gray-100 rounded flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages - scrollable */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-8">
            <div className="text-3xl sm:text-4xl mb-2">💬</div>
            <p>Start planning your {nodeName}</p>
            <p className="text-xs mt-2">Your conversation is saved automatically</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
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

      {/* Image previews */}
      {uploadedImages.length > 0 && (
        <div className="px-3 sm:px-4 py-2 border-t border-gray-200 flex gap-2 overflow-x-auto">
          {uploadedImages.map((img, idx) => (
            <div key={idx} className="relative flex-shrink-0">
              <img src={img} alt="Upload" className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded" />
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

      {/* Input area - Mobile optimized */}
      <div className="p-3 sm:p-4 border-t border-gray-200 bg-white">
        {!recording ? (
          <>
            <div className="bg-gray-50 rounded-full flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border border-gray-200">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1 hover:bg-gray-200 rounded-full flex-shrink-0"
                title="Upload image"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask anything..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400"
                disabled={loading}
              />

              <button
                onClick={startRecording}
                className="p-1 hover:bg-gray-200 rounded-full flex-shrink-0"
                title="Voice input"
                disabled={loading}
              >
                <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>

              {input.trim() && (
                <button
                  onClick={sendMessage}
                  disabled={loading}
                  className="p-1 hover:bg-gray-200 rounded-full flex-shrink-0"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>
              )}
            </div>

            {messages.length > 0 && (
              <button
                onClick={() => onGenerateStructure(messages)}
                className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs sm:text-sm font-medium"
              >
                Generate Structure from Chat
              </button>
            )}
          </>
        ) : (
          <div className="bg-gray-900 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
                <span className="text-white text-xs sm:text-sm font-medium">
                  Listening<span className="animate-pulse">...</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={cancelRecording}
                  className="p-1.5 sm:p-2 hover:bg-gray-800 rounded-full flex-shrink-0"
                  title="Cancel"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>

                <button
                  onClick={stopRecording}
                  className="p-1.5 sm:p-2 bg-blue-600 hover:bg-blue-700 rounded-full flex-shrink-0"
                  title="Send"
                >
                  <Send className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
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