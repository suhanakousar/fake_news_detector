// TruthLens Extension - Content Script

// Config variables
let config = {
  autoCheckEnabled: true,
  highlightFakeNews: true,
  notificationsEnabled: true
};

// State variables
let isAnalyzing = false;
let analysisResult = null;
let highlightedElements = [];

// Initialize when the page loads
window.addEventListener('load', async () => {
  // Get configuration
  chrome.runtime.sendMessage({ action: 'getConfig' }, response => {
    if (response && response.config) {
      config = response.config;
      
      // If auto-check is enabled, analyze the page
      if (config.autoCheckEnabled) {
        setTimeout(analyzeCurrentPage, 1500); // Small delay to ensure page is fully loaded
      }
    }
  });
});

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'analyzeCurrentPage') {
    analyzeCurrentPage().then(result => sendResponse(result));
    return true; // Required for async response
  }
  
  if (message.action === 'clearHighlights') {
    clearHighlights();
    sendResponse({ status: 'success' });
  }
  
  if (message.action === 'getLastAnalysisResult') {
    sendResponse({ result: analysisResult });
  }
});

// Main function to analyze the current page
async function analyzeCurrentPage() {
  if (isAnalyzing) return { status: 'already_analyzing' };
  
  try {
    isAnalyzing = true;
    
    // Extract content from the page
    const extractedContent = extractPageContent();
    
    // Send content to background script for API analysis
    const response = await new Promise(resolve => {
      chrome.runtime.sendMessage({
        action: 'analyzeContent',
        content: extractedContent.text,
        url: window.location.href
      }, resolve);
    });
    
    // Process the results
    if (response && response.success) {
      analysisResult = response.result;
      
      // Apply highlights if enabled
      if (config.highlightFakeNews && analysisResult.classification !== 'real') {
        highlightFakeNews(analysisResult, extractedContent.elements);
      }
      
      // Show notification if enabled
      if (config.notificationsEnabled) {
        showNotification(analysisResult);
      }
      
      return { 
        status: 'success',
        result: analysisResult
      };
    } else {
      console.error('Analysis failed:', response.error);
      return { 
        status: 'error',
        message: response.error || 'Unknown error occurred'
      };
    }
  } catch (error) {
    console.error('Error in content script:', error);
    return { 
      status: 'error',
      message: error.message
    };
  } finally {
    isAnalyzing = false;
  }
}

// Extract content from the page
function extractPageContent() {
  // Get the title
  const title = document.title || '';
  
  // Get the main content - prioritize article content
  const article = document.querySelector('article');
  const mainContent = article ? article : document.body;
  
  // Get all text paragraphs
  const paragraphElements = mainContent.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
  
  // Extract text
  let fullText = title + "\n\n";
  const elements = [];
  
  paragraphElements.forEach(element => {
    const text = element.textContent.trim();
    if (text.length > 10) { // Only consider substantial paragraphs
      fullText += text + "\n\n";
      elements.push(element);
    }
  });
  
  return {
    text: fullText,
    elements: elements
  };
}

// Highlight fake/misleading content
function highlightFakeNews(result, elements) {
  // Clear any existing highlights
  clearHighlights();
  
  // Determine highlight color based on classification
  let highlightColor;
  switch (result.classification) {
    case 'fake':
      highlightColor = 'rgba(255, 0, 0, 0.2)';
      break;
    case 'misleading':
      highlightColor = 'rgba(255, 165, 0, 0.2)';
      break;
    default:
      return; // Don't highlight if not fake/misleading
  }
  
  // Apply highlights to elements
  elements.forEach(element => {
    const originalStyle = element.getAttribute('style') || '';
    element.setAttribute('style', originalStyle + `; background-color: ${highlightColor} !important; padding: 2px; border-radius: 3px;`);
    element.classList.add('truthlens-highlighted');
    
    // Store for later removal if needed
    highlightedElements.push({
      element,
      originalStyle
    });
  });
  
  // Add a banner at the top of the page
  addWarningBanner(result);
}

// Clear all highlights
function clearHighlights() {
  // Remove all highlighted elements
  highlightedElements.forEach(item => {
    item.element.setAttribute('style', item.originalStyle);
    item.element.classList.remove('truthlens-highlighted');
  });
  
  // Clear the array
  highlightedElements = [];
  
  // Remove any existing banner
  const existingBanner = document.getElementById('truthlens-banner');
  if (existingBanner) {
    existingBanner.remove();
  }
}

// Add a warning banner to the top of the page
function addWarningBanner(result) {
  // Remove any existing banner
  const existingBanner = document.getElementById('truthlens-banner');
  if (existingBanner) {
    existingBanner.remove();
  }
  
  // Create a new banner
  const banner = document.createElement('div');
  banner.id = 'truthlens-banner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background-color: ${result.classification === 'fake' ? '#ffebee' : '#fff8e1'};
    border-bottom: 1px solid ${result.classification === 'fake' ? '#ffcdd2' : '#ffe082'};
    color: ${result.classification === 'fake' ? '#c62828' : '#ff8f00'};
    padding: 10px 20px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 9999;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  `;
  
  // Banner content
  const confidencePercent = Math.round(result.confidence * 100);
  const bannerText = document.createElement('div');
  bannerText.innerHTML = `
    <strong>⚠️ TruthLens Alert:</strong> 
    This content is ${confidencePercent}% likely to be 
    <strong>${result.classification.toUpperCase()}</strong>. 
    <span class="reason">${result.reasoning[0] || 'Potential misinformation detected.'}</span>
  `;
  
  // Close button
  const closeButton = document.createElement('button');
  closeButton.textContent = '✕';
  closeButton.style.cssText = `
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    color: inherit;
  `;
  closeButton.addEventListener('click', () => {
    banner.remove();
  });
  
  // More info button
  const moreInfoButton = document.createElement('button');
  moreInfoButton.textContent = 'More Info';
  moreInfoButton.style.cssText = `
    background-color: ${result.classification === 'fake' ? '#ef5350' : '#ffa726'};
    color: white;
    border: none;
    border-radius: 4px;
    padding: 5px 10px;
    margin-right: 10px;
    cursor: pointer;
    font-size: 12px;
  `;
  moreInfoButton.addEventListener('click', () => {
    // Send message to open popup with details
    chrome.runtime.sendMessage({ 
      action: 'openPopup',
      result: analysisResult
    });
  });
  
  // Add elements to the banner
  const buttonContainer = document.createElement('div');
  buttonContainer.appendChild(moreInfoButton);
  buttonContainer.appendChild(closeButton);
  
  banner.appendChild(bannerText);
  banner.appendChild(buttonContainer);
  
  // Add the banner to the page
  document.body.prepend(banner);
  
  // Adjust body padding to prevent banner from covering content
  const bannerHeight = banner.offsetHeight;
  document.body.style.paddingTop = `${bannerHeight}px`;
}

// Show in-page notification
function showNotification(result) {
  // Implementation depends on the design - can be a toast notification
  // or integrated into the banner functionality above
  console.log('Showing notification for result:', result);
}