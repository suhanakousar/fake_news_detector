// TruthLens Extension - Background Script

// Configuration (can be moved to options page later)
let config = {
  apiUrl: 'https://truthlens-api.replit.app', // Replace with your actual deployed API URL
  autoCheckEnabled: true,
  highlightFakeNews: true,
  notificationsEnabled: true
};

// Initialize settings from storage or defaults
chrome.storage.sync.get(['config'], (result) => {
  if (result.config) {
    config = { ...config, ...result.config };
  } else {
    chrome.storage.sync.set({ config });
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'analyzeContent') {
    analyzeContent(message.content, message.url)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Required for async response
  }
  
  if (message.action === 'updateConfig') {
    config = { ...config, ...message.config };
    chrome.storage.sync.set({ config });
    sendResponse({ status: 'success' });
  }
  
  if (message.action === 'getConfig') {
    sendResponse({ config });
  }
});

// Function to analyze content by sending to TruthLens API
async function analyzeContent(content, url) {
  try {
    // If content is too large, truncate it
    const truncatedContent = content.substring(0, 5000);
    
    // Make API request to TruthLens backend
    const response = await fetch(`${config.apiUrl}/api/analyze/extension`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: truncatedContent,
        url: url
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    return {
      success: true,
      result
    };
  } catch (error) {
    console.error('Error analyzing content:', error);
    return {
      success: false,
      error: error.message
    };
  }
}