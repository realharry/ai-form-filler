// Shared types for the AI Form Filler extension

export interface FormField {
  id: string;
  name: string;
  type: string;
  label: string;
  placeholder: string;
  value: string;
  required: boolean;
}

export interface DetectedForm {
  id: string;
  action: string;
  method: string;
  fields: FormField[];
}

export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'local';
  apiKey?: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface FormFillRequest {
  formId: string;
  fieldData: { [fieldId: string]: string };
}

export interface Message {
  type: string;
  [key: string]: any;
}

export interface AIFormSuggestions {
  [fieldId: string]: {
    suggestedValue: string;
    confidence: number;
    reasoning?: string;
  };
}