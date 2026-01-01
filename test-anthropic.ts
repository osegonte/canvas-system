import Anthropic from '@anthropic-ai/sdk'

async function testConnection() {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!
  })

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: 'Say hello!'
    }]
  })

  console.log('✅ Anthropic connected!', message.content)
}

testConnection()