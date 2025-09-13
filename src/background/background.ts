// Background script for AI Form Filler extension

// Handle extension icon click - open side panel
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    // Open sidepanel for the active tab
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Listen for tab updates to refresh form data
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Notify sidepanel that page has changed
    chrome.runtime.sendMessage({
      type: 'TAB_UPDATED',
      tabId,
      url: tab.url
    }).catch(() => {
      // Ignore errors if sidepanel is not open
    });
  }
});

// Handle messages from content script and sidepanel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_FORMS':
      // Handle request from sidepanel - forward to appropriate tab's content script
      if (message.tabId) {
        // Request from sidepanel with specific tab ID
        chrome.tabs.sendMessage(message.tabId, { type: 'GET_FORMS' })
          .then(sendResponse)
          .catch((error) => {
            console.error('Failed to get forms:', error)
            sendResponse({ forms: [], error: 'Could not connect to page content. Try refreshing the page.' })
          })
      } else if (sender.tab?.id) {
        // Direct request from content script (shouldn't normally happen)
        chrome.tabs.sendMessage(sender.tab.id, message)
          .then(sendResponse)
          .catch(() => sendResponse({ forms: [] }))
      }
      return true // Keep message channel open for async response
      
    case 'FILL_FORM':
      // Forward form data to content script for filling
      if (message.tabId) {
        chrome.tabs.sendMessage(message.tabId, {
          type: 'FILL_FORM',
          formId: message.formId,
          fieldData: message.fieldData
        })
          .then(sendResponse)
          .catch((error) => {
            console.error('Failed to fill form:', error)
            sendResponse({ success: false, error: 'Could not connect to page content. Try refreshing the page.' })
          })
      }
      return true
      
    case 'CONTENT_SCRIPT_READY':
      // Content script notification - no response needed
      console.log('Content script ready on tab:', sender.tab?.id)
      break
      
    default:
      break
  }
})

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Form Filler extension installed');
});