// Content script for detecting and filling forms

interface FormField {
  id: string;
  name: string;
  type: string;
  label: string;
  placeholder: string;
  value: string;
  required: boolean;
  element?: HTMLElement;
}

interface DetectedForm {
  id: string;
  action: string;
  method: string;
  fields: FormField[];
}

// Find all forms on the page
function detectForms(): DetectedForm[] {
  const forms = document.querySelectorAll('form');
  const formData: DetectedForm[] = [];

  forms.forEach((form, index) => {
    const fields: FormField[] = [];
    
    // Find all form fields
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach((input, fieldIndex) => {
      const element = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      
      // Skip buttons and hidden fields
      if (element.type === 'button' || element.type === 'submit' || element.type === 'hidden') {
        return;
      }
      
      // Get label for the field
      let label = '';
      const labelElement = form.querySelector(`label[for="${element.id}"]`);
      if (labelElement) {
        label = labelElement.textContent?.trim() || '';
      } else {
        // Try to find label by proximity
        const parent = element.parentElement;
        if (parent) {
          const nearbyLabel = parent.querySelector('label');
          if (nearbyLabel) {
            label = nearbyLabel.textContent?.trim() || '';
          }
        }
      }
      
      // If no label found, use name or placeholder
      if (!label) {
        label = element.getAttribute('placeholder') || element.name || `Field ${fieldIndex + 1}`;
      }
      
      fields.push({
        id: element.id || `field_${index}_${fieldIndex}`,
        name: element.name || '',
        type: element.type || element.tagName.toLowerCase(),
        label,
        placeholder: element.getAttribute('placeholder') || '',
        value: element.value || '',
        required: element.hasAttribute('required'),
        element
      });
    });
    
    if (fields.length > 0) {
      formData.push({
        id: form.id || `form_${index}`,
        action: form.action || '',
        method: form.method || 'GET',
        fields
      });
    }
  });
  
  return formData;
}

// Fill form fields with provided data
function fillForm(formId: string, fieldData: { [key: string]: string }): boolean {
  try {
    const forms = detectForms();
    const targetForm = forms.find(f => f.id === formId);
    
    if (!targetForm) {
      console.error('Form not found:', formId);
      return false;
    }
    
    // Fill each field
    Object.entries(fieldData).forEach(([fieldId, value]) => {
      const field = targetForm.fields.find(f => f.id === fieldId);
      if (field && field.element) {
        const element = field.element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        
        // Set value based on field type
        if (element.type === 'checkbox' || element.type === 'radio') {
          (element as HTMLInputElement).checked = value === 'true' || value === '1';
        } else if (element.tagName.toLowerCase() === 'select') {
          (element as HTMLSelectElement).value = value;
        } else {
          element.value = value;
        }
        
        // Trigger change event to notify any listeners
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error filling form:', error);
    return false;
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'GET_FORMS':
      try {
        const forms = detectForms();
        // Remove element references before sending (can't serialize DOM elements)
        const serializedForms = forms.map(form => ({
          ...form,
          fields: form.fields.map(field => {
            const { element, ...fieldWithoutElement } = field;
            return fieldWithoutElement;
          })
        }));
        sendResponse({ forms: serializedForms });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        sendResponse({ forms: [], error: errorMessage });
      }
      return true;
      
    case 'FILL_FORM':
      try {
        const success = fillForm(message.formId, message.fieldData);
        sendResponse({ success });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        sendResponse({ success: false, error: errorMessage });
      }
      return true;
      
    default:
      break;
  }
});

// Notify background script that content script is ready
chrome.runtime.sendMessage({ type: 'CONTENT_SCRIPT_READY' }).catch(() => {
  // Ignore error if background script is not ready
});

console.log('AI Form Filler content script loaded');