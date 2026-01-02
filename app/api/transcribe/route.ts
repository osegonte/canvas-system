import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Transcribe using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en', // Can be auto-detected by removing this
    })

    return NextResponse.json({
      success: true,
      text: transcription.text
    })

  } catch (error: unknown) {
    console.error('❌ Transcription error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Transcription failed'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}