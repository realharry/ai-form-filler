import { useState, useEffect, useCallback } from 'react'
import { DetectedForm, FormField, AIConfig } from '../types'

interface FormValues {
  [formId: string]: {
    [fieldId: string]: string
  }
}

function App() {
  const [forms, setForms] = useState<DetectedForm[]>([])
  const [formValues, setFormValues] = useState<FormValues>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null)

  // Load AI configuration
  const loadAIConfig = useCallback(async () => {
    try {
      const result = await chrome.storage.sync.get(['aiConfig'])
      if (result.aiConfig) {
        setAiConfig(result.aiConfig)
      }
    } catch (err) {
      console.error('Failed to load AI config:', err)
    }
  }, [])

  // Get current tab and fetch forms
  const fetchForms = useCallback(async () => {
    setLoading(true)
    setError('')
    
    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (!tab.id) {
        throw new Error('No active tab found')
      }

      // Request forms from content script
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_FORMS' })
      
      if (response.error) {
        throw new Error(response.error)
      }

      setForms(response.forms || [])
      
      // Initialize form values
      const initialValues: FormValues = {}
      response.forms?.forEach((form: DetectedForm) => {
        initialValues[form.id] = {}
        form.fields.forEach((field: FormField) => {
          initialValues[form.id][field.id] = field.value
        })
      })
      setFormValues(initialValues)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch forms'
      setError(errorMessage)
      setForms([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Initialize on component mount
  useEffect(() => {
    loadAIConfig()
    fetchForms()
  }, [loadAIConfig, fetchForms])

  // Handle field value changes
  const handleFieldChange = (formId: string, fieldId: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [formId]: {
        ...prev[formId],
        [fieldId]: value
      }
    }))
  }

  // Fill form with current values
  const fillForm = async (formId: string) => {
    try {
      setError('')
      setSuccess('')
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab.id) {
        throw new Error('No active tab found')
      }

      const fieldData = formValues[formId] || {}
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'FILL_FORM',
        formId,
        fieldData
      })

      if (response.success) {
        setSuccess('Form filled successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        throw new Error(response.error || 'Failed to fill form')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fill form'
      setError(errorMessage)
    }
  }

  // AI suggestion placeholder (to be implemented)
  const suggestWithAI = async (_formId: string) => {
    if (!aiConfig) {
      setError('AI not configured. Please set up AI in the options page.')
      return
    }
    
    // TODO: Implement AI suggestions
    setError('AI suggestions not yet implemented. Coming soon!')
  }

  // AI auto-fill placeholder (to be implemented)
  const autoFillWithAI = async (_formId: string) => {
    if (!aiConfig) {
      setError('AI not configured. Please set up AI in the options page.')
      return
    }
    
    // TODO: Implement AI auto-fill
    setError('AI auto-fill not yet implemented. Coming soon!')
  }

  const openOptions = () => {
    chrome.runtime.openOptionsPage()
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading forms...</div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">AI Form Filler</h1>
        <button className="refresh-btn" onClick={fetchForms}>
          Refresh
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {forms.length === 0 ? (
        <div className="no-forms">
          <p>No forms detected on this page.</p>
          <p>Try refreshing or navigating to a page with forms.</p>
          <button 
            onClick={openOptions}
            style={{ 
              marginTop: '16px', 
              padding: '8px 16px', 
              background: '#6b7280', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer' 
            }}
          >
            Configure AI
          </button>
        </div>
      ) : (
        forms.map((form) => (
          <div key={form.id} className="form-card">
            <h2 className="form-title">Form {form.id}</h2>
            <div className="form-meta">
              {form.action && `Action: ${form.action}`} | Method: {form.method.toUpperCase()}
            </div>

            {form.fields.map((field) => (
              <div key={field.id} className="field-group">
                <label className="field-label">
                  {field.label}
                  {field.required && <span className="field-required"> *</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    className="field-input"
                    placeholder={field.placeholder}
                    value={formValues[form.id]?.[field.id] || ''}
                    onChange={(e) => handleFieldChange(form.id, field.id, e.target.value)}
                  />
                ) : field.type === 'select' ? (
                  <select
                    className="field-input"
                    value={formValues[form.id]?.[field.id] || ''}
                    onChange={(e) => handleFieldChange(form.id, field.id, e.target.value)}
                  >
                    <option value="">Select...</option>
                    {/* TODO: Get options from original select element */}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    className="field-input"
                    placeholder={field.placeholder}
                    value={formValues[form.id]?.[field.id] || ''}
                    onChange={(e) => handleFieldChange(form.id, field.id, e.target.value)}
                  />
                )}
              </div>
            ))}

            <div className="ai-buttons">
              <button 
                className="ai-btn ai-btn-suggest"
                onClick={() => suggestWithAI(form.id)}
              >
                AI Suggest
              </button>
              <button 
                className="ai-btn ai-btn-fill"
                onClick={() => autoFillWithAI(form.id)}
              >
                AI Fill
              </button>
            </div>

            <button 
              className="fill-btn"
              onClick={() => fillForm(form.id)}
            >
              Fill Form on Page
            </button>
          </div>
        ))
      )}
    </div>
  )
}

export default App