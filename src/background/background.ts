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
      // Forward request to content script
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, message)
          .then(sendResponse)
          .catch(() => sendResponse({ forms: [] }));
      }
      return true; // Keep message channel open for async response
      
    case 'FILL_FORM':
      // Forward form data to content script for filling
      if (message.tabId) {
        chrome.tabs.sendMessage(message.tabId, message)
          .then(sendResponse)
          .catch(() => sendResponse({ success: false, error: 'Failed to fill form' }));
      }
      return true;
      
    default:
      break;
  }
});

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Form Filler extension installed');
});