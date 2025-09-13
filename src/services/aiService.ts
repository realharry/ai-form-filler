// AI Service for form filling suggestions

import { AIConfig, DetectedForm, AIFormSuggestions } from '../types'

export class AIService {
  private config: AIConfig | null = null

  async loadConfig(): Promise<AIConfig | null> {
    try {
      const result = await chrome.storage.sync.get(['aiConfig'])
      this.config = result.aiConfig || null
      return this.config
    } catch (error) {
      console.error('Failed to load AI config:', error)
      return null
    }
  }

  async suggestFormValues(form: DetectedForm): Promise<AIFormSuggestions> {
    if (!this.config) {
      await this.loadConfig()
    }

    if (!this.config) {
      throw new Error('AI configuration not found')
    }

    switch (this.config.provider) {
      case 'openai':
        return this.getOpenAISuggestions(form)
      case 'anthropic':
        return this.getAnthropicSuggestions(form)
      case 'local':
        return this.getLocalSuggestions(form)
      default:
        throw new Error(`Unsupported AI provider: ${this.config.provider}`)
    }
  }

  private async getOpenAISuggestions(form: DetectedForm): Promise<AIFormSuggestions> {
    if (!this.config?.apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const prompt = this.createFormPrompt(form)
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that suggests realistic form field values. Always respond with valid JSON containing field suggestions.'
            },
            {
              role: 'user', 
              content: prompt
            }
          ],
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const aiResponse = data.choices[0]?.message?.content?.trim()
      
      if (!aiResponse) {
        throw new Error('No response from OpenAI')
      }

      return this.parseAIResponse(aiResponse, form)
    } catch (error) {
      console.error('OpenAI API error:', error)
      throw new Error('Failed to get AI suggestions from OpenAI')
    }
  }

  private async getAnthropicSuggestions(form: DetectedForm): Promise<AIFormSuggestions> {
    if (!this.config?.apiKey) {
      throw new Error('Anthropic API key not configured')
    }

    const prompt = this.createFormPrompt(form)
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          messages: [
            {
              role: 'user',
              content: `You are a helpful assistant that suggests realistic form field values. Always respond with valid JSON containing field suggestions.\n\n${prompt}`
            }
          ]
        })
      })

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const aiResponse = data.content[0]?.text?.trim()
      
      if (!aiResponse) {
        throw new Error('No response from Anthropic')
      }

      return this.parseAIResponse(aiResponse, form)
    } catch (error) {
      console.error('Anthropic API error:', error)
      throw new Error('Failed to get AI suggestions from Anthropic')
    }
  }

  private async getLocalSuggestions(_form: DetectedForm): Promise<AIFormSuggestions> {
    // Placeholder for local AI model
    // In a real implementation, this would call a local inference endpoint
    throw new Error('Local AI models not yet implemented')
  }

  private createFormPrompt(form: DetectedForm): string {
    const formDescription = `
Form ID: ${form.id}
Form Action: ${form.action}
Form Method: ${form.method}

Fields:
${form.fields.map(field => 
  `- ${field.label} (${field.type}): ${field.placeholder || 'No placeholder'} ${field.required ? '[REQUIRED]' : ''}`
).join('\n')}

Please suggest realistic values for this form. Consider the context and field types.
Respond with a JSON object where keys are field IDs and values are objects with:
- suggestedValue: the suggested field value
- confidence: a number between 0 and 1 indicating confidence
- reasoning: brief explanation for the suggestion

Example format:
{
  "firstName": {
    "suggestedValue": "John",
    "confidence": 0.9,
    "reasoning": "Common first name appropriate for forms"
  }
}

Field IDs to suggest for:
${form.fields.map(f => f.id).join(', ')}
`
    return formDescription.trim()
  }

  private parseAIResponse(aiResponse: string, form: DetectedForm): AIFormSuggestions {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response')
      }

      const suggestions = JSON.parse(jsonMatch[0])
      
      // Validate that suggestions match our form fields
      const validSuggestions: AIFormSuggestions = {}
      
      form.fields.forEach(field => {
        if (suggestions[field.id]) {
          const suggestion = suggestions[field.id]
          validSuggestions[field.id] = {
            suggestedValue: suggestion.suggestedValue || '',
            confidence: Math.max(0, Math.min(1, suggestion.confidence || 0.5)),
            reasoning: suggestion.reasoning || 'AI suggestion'
          }
        }
      })

      return validSuggestions
    } catch (error) {
      console.error('Failed to parse AI response:', error)
      console.error('AI Response:', aiResponse)
      
      // Fallback: return empty suggestions
      return {}
    }
  }
}

// Create a singleton instance
export const aiService = new AIService()