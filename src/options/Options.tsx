import { useState, useEffect } from 'react'
import { AIConfig } from '../types'

const defaultConfig: AIConfig = {
  provider: 'openai',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 500
}

function Options() {
  const [config, setConfig] = useState<AIConfig>(defaultConfig)
  const [showApiKey, setShowApiKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Load saved configuration
    chrome.storage.sync.get(['aiConfig'], (result) => {
      if (result.aiConfig) {
        setConfig({ ...defaultConfig, ...result.aiConfig })
      }
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    
    try {
      // Validate configuration
      if (config.provider !== 'local' && !config.apiKey?.trim()) {
        throw new Error('API key is required for external providers')
      }

      if (config.temperature < 0 || config.temperature > 2) {
        throw new Error('Temperature must be between 0 and 2')
      }

      if (config.maxTokens < 1 || config.maxTokens > 4000) {
        throw new Error('Max tokens must be between 1 and 4000')
      }

      // Save configuration
      await chrome.storage.sync.set({ aiConfig: config })
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleProviderChange = (provider: AIConfig['provider']) => {
    let model = defaultConfig.model
    
    // Set default models for different providers
    switch (provider) {
      case 'openai':
        model = 'gpt-3.5-turbo'
        break
      case 'anthropic':
        model = 'claude-3-haiku-20240307'
        break
      case 'local':
        model = 'llama2'
        break
    }
    
    setConfig(prev => ({ ...prev, provider, model }))
  }

  const getProviderInfo = () => {
    switch (config.provider) {
      case 'openai':
        return (
          <div className="provider-info">
            <h4>OpenAI Configuration</h4>
            <p>Get your API key from <code>https://platform.openai.com/api-keys</code></p>
            <p>Recommended models: gpt-3.5-turbo, gpt-4</p>
          </div>
        )
      case 'anthropic':
        return (
          <div className="provider-info">
            <h4>Anthropic Configuration</h4>
            <p>Get your API key from <code>https://console.anthropic.com/</code></p>
            <p>Recommended models: claude-3-haiku-20240307, claude-3-sonnet-20240229</p>
          </div>
        )
      case 'local':
        return (
          <div className="provider-info">
            <h4>Local Model Configuration</h4>
            <p>This will use a local AI model (not yet implemented)</p>
            <p>No API key required for local inference</p>
          </div>
        )
    }
  }

  return (
    <div className="options-container">
      <h1 className="options-title">AI Form Filler Configuration</h1>
      
      {saved && <div className="success-message">Configuration saved successfully!</div>}
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-section">
        <h2 className="section-title">AI Provider Settings</h2>
        
        <div className="form-group">
          <label className="form-label">AI Provider</label>
          <select 
            className="form-select"
            value={config.provider}
            onChange={(e) => handleProviderChange(e.target.value as AIConfig['provider'])}
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic Claude</option>
            <option value="local">Local Model (Coming Soon)</option>
          </select>
          <div className="form-description">
            Choose your preferred AI provider for form suggestions
          </div>
        </div>

        {config.provider !== 'local' && (
          <div className="form-group">
            <label className="form-label">API Key</label>
            <div className="password-input">
              <input
                type={showApiKey ? 'text' : 'password'}
                className="form-input"
                value={config.apiKey || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Enter your API key"
              />
              <button 
                type="button"
                className="toggle-password"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="form-description">
              Your API key is stored locally and never shared
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Model</label>
          <input
            type="text"
            className="form-input"
            value={config.model}
            onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
            placeholder="Model name"
          />
          <div className="form-description">
            The specific AI model to use for form suggestions
          </div>
        </div>

        {getProviderInfo()}
      </div>

      <div className="form-section">
        <h2 className="section-title">Generation Settings</h2>
        
        <div className="form-group">
          <label className="form-label">Temperature ({config.temperature})</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={config.temperature}
            onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
            className="form-input"
          />
          <div className="form-description">
            Controls randomness: 0 = focused, 2 = creative
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Max Tokens</label>
          <input
            type="number"
            min="1"
            max="4000"
            className="form-input"
            value={config.maxTokens}
            onChange={(e) => setConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 500 }))}
          />
          <div className="form-description">
            Maximum number of tokens for AI responses (1-4000)
          </div>
        </div>
      </div>

      <button 
        className="save-btn"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save Configuration'}
      </button>
    </div>
  )
}

export default Options