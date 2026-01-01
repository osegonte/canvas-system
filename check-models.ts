import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'

async function checkModels() {
  const envContent = fs.readFileSync('.env.local', 'utf-8')
  const apiKey = envContent.split('\n')
    .find(line => line.startsWith('ANTHROPIC_API_KEY='))
    ?.split('=')[1]
    ?.trim()

  const anthropic = new Anthropic({ apiKey })

  // Try different model names
  const modelsToTry = [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-latest',
    'claude-3-5-sonnet-20240620',
    'claude-3-sonnet-20240229',
    'claude-sonnet-4-20250514',
    'claude-sonnet-4-20250107'
  ]

  for (const model of modelsToTry) {
    try {
      console.log(`\n🧪 Testing: ${model}`)
      const message = await anthropic.messages.create({
        model,
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Hi' }]
      })
      console.log(`✅ SUCCESS! Model works: ${model}`)
      return
    } catch (error: any) {
      console.log(`❌ Failed: ${error.error?.error?.message || error.message}`)
    }
  }
}

checkModels()