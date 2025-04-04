// TruthLens Extension - Popup Script

// DOM Elements
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const resultsState = document.getElementById('resultsState');
const noContentState = document.getElementById('noContentState');
const enableExtensionToggle = document.getElementById('enableExtension');
const resultIcon = document.getElementById('resultIcon');
const resultTitle = document.getElementById('resultTitle');
const confidenceIndicator = document.getElementById('confidenceIndicator');
const confidenceValue = document.getElementById('confidenceValue');
const reasoningList = document.getElementById('reasoningList');
const factChecksList = document.getElementById('factChecksList');
const highlightButton = document.getElementById('highlightButton');
const highlightButtonText = document.getElementById('highlightButtonText');
const reportButton = document.getElementById('reportButton');
const errorMessage = document.getElementById('errorMessage');
const retryButton = document.getElementById('retryButton');
const settingsButton = document.getElementById('settingsButton');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const saveSettings = document.getElementById('saveSettings');
const autoCheckSetting = document.getElementById('autoCheckSetting');
const highlightSetting = document.getElementById('highlightSetting');
const notificationsSetting = document.getElementById('notificationsSetting');
const apiUrlSetting = document.getElementById('apiUrlSetting');

// State variables
let currentTab = null;
let currentAnalysisResult = null;
let isHighlightingEnabled = false;
let config = {
  autoCheckEnabled: true,
  highlightFakeNews: true,
  notificationsEnabled: true,
  apiUrl: 'https://truthlens-api.replit.app'
};

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
  // Show loading state initially
  showState('loading');
  
  // Load configuration
  loadConfig();
  
  // Get current tab
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (tabs.length === 0) return;
    currentTab = tabs[0];
    
    // Check if the page has content we can analyze
    if (
      !currentTab.url || 
      currentTab.url.startsWith('chrome://') || 
      currentTab.url.startsWith('chrome-extension://') ||
      currentTab.url.startsWith('about:')
    ) {
      showState('noContent');
      return;
    }
    
    // Check if we already have results for this tab
    if (currentTab.id) {
      chrome.tabs.sendMessage(
        currentTab.id,
        { action: 'getLastAnalysisResult' },
        (response) => {
          // If we have a result, display it
          if (response && response.result) {
            currentAnalysisResult = response.result;
            displayResults(response.result);
          } else {
            // Otherwise analyze the page
            analyzeCurrentPage();
          }
        }
      );
    }
  });
  
  // Set up event listeners
  setupEventListeners();
});

// Load configuration from storage
function loadConfig() {
  chrome.storage.sync.get(['config'], (result) => {
    if (result.config) {
      config = result.config;
      
      // Update UI based on config
      enableExtensionToggle.checked = config.autoCheckEnabled;
      autoCheckSetting.checked = config.autoCheckEnabled;
      highlightSetting.checked = config.highlightFakeNews;
      notificationsSetting.checked = config.notificationsEnabled;
      apiUrlSetting.value = config.apiUrl || 'https://truthlens-api.replit.app';
    }
  });
}

// Set up event listeners
function setupEventListeners() {
  // Extension toggle
  enableExtensionToggle.addEventListener('change', () => {
    config.autoCheckEnabled = enableExtensionToggle.checked;
    updateConfig();
  });
  
  // Retry button
  retryButton.addEventListener('click', () => {
    showState('loading');
    analyzeCurrentPage();
  });
  
  // Highlight button
  highlightButton.addEventListener('click', () => {
    toggleHighlighting();
  });
  
  // Report button
  reportButton.addEventListener('click', () => {
    if (currentTab && currentTab.id) {
      chrome.tabs.create({ url: `https://truthlens.replit.app/report?url=${encodeURIComponent(currentTab.url)}` });
    }
  });
  
  // Settings button
  settingsButton.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
  });
  
  // Close settings button
  closeSettings.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
  });
  
  // Close settings when clicking outside
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.add('hidden');
    }
  });
  
  // Save settings button
  saveSettings.addEventListener('click', () => {
    config.autoCheckEnabled = autoCheckSetting.checked;
    config.highlightFakeNews = highlightSetting.checked;
    config.notificationsEnabled = notificationsSetting.checked;
    config.apiUrl = apiUrlSetting.value;
    
    updateConfig();
    settingsModal.classList.add('hidden');
  });
}

// Update configuration in storage
function updateConfig() {
  chrome.storage.sync.set({ config }, () => {
    // Notify content script of config change
    if (currentTab && currentTab.id) {
      chrome.tabs.sendMessage(
        currentTab.id,
        { action: 'updateConfig', config }
      );
    }
  });
}

// Analyze current page
function analyzeCurrentPage() {
  if (!currentTab || !currentTab.id) {
    showState('error', 'No active tab found');
    return;
  }
  
  chrome.tabs.sendMessage(
    currentTab.id,
    { action: 'analyzeCurrentPage' },
    (response) => {
      if (chrome.runtime.lastError) {
        showState('error', 'Could not connect to page. The page may need to be refreshed.');
        return;
      }
      
      if (!response) {
        showState('error', 'No response from content script');
        return;
      }
      
      if (response.status === 'error') {
        showState('error', response.message || 'An error occurred during analysis');
        return;
      }
      
      if (response.status === 'already_analyzing') {
        showState('loading');
        // Check again after a short delay
        setTimeout(() => analyzeCurrentPage(), 1000);
        return;
      }
      
      if (response.status === 'success' && response.result) {
        currentAnalysisResult = response.result;
        displayResults(response.result);
      } else {
        showState('error', 'Invalid response from content script');
      }
    }
  );
}

// Display analysis results
function displayResults(result) {
  if (!result) {
    showState('error', 'No analysis results found');
    return;
  }
  
  // Update result icon and title
  switch (result.classification) {
    case 'fake':
      resultsState.className = 'content-section fake-state';
      resultIcon.textContent = '❌';
      resultTitle.textContent = 'Content appears to be fake';
      break;
    case 'misleading':
      resultsState.className = 'content-section misleading-state';
      resultIcon.textContent = '⚠️';
      resultTitle.textContent = 'Content may be misleading';
      break;
    case 'real':
      resultsState.className = 'content-section real-state';
      resultIcon.textContent = '✓';
      resultTitle.textContent = 'Content appears to be reliable';
      break;
    default:
      resultsState.className = 'content-section';
      resultIcon.textContent = '❓';
      resultTitle.textContent = 'Content analysis';
  }
  
  // Update confidence indicator
  const confidencePercentage = Math.round(result.confidence * 100);
  confidenceIndicator.style.width = `${confidencePercentage}%`;
  confidenceValue.textContent = `${confidencePercentage}%`;
  
  // Update reasoning list
  reasoningList.innerHTML = '';
  if (result.reasoning && result.reasoning.length > 0) {
    result.reasoning.forEach(reason => {
      const li = document.createElement('li');
      li.textContent = reason;
      reasoningList.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.textContent = 'No specific reasoning provided.';
    reasoningList.appendChild(li);
  }
  
  // Update fact checks
  factChecksList.innerHTML = '';
  if (result.factChecks && result.factChecks.length > 0) {
    result.factChecks.forEach(factCheck => {
      const factCheckItem = document.createElement('div');
      factCheckItem.className = 'fact-check-item';
      
      const source = document.createElement('div');
      source.className = 'fact-check-source';
      source.textContent = factCheck.source;
      
      const title = document.createElement('div');
      title.className = 'fact-check-title';
      title.textContent = factCheck.title;
      
      const link = document.createElement('a');
      link.className = 'fact-check-link';
      link.href = factCheck.url;
      link.textContent = 'Read full fact check';
      link.target = '_blank';
      
      factCheckItem.appendChild(source);
      factCheckItem.appendChild(title);
      factCheckItem.appendChild(link);
      
      factChecksList.appendChild(factCheckItem);
    });
  } else {
    const noFactChecks = document.createElement('p');
    noFactChecks.className = 'no-fact-checks';
    noFactChecks.textContent = 'No specific fact checks found for this content.';
    factChecksList.appendChild(noFactChecks);
  }
  
  // Update highlight button state
  updateHighlightButtonState();
  
  // Show results state
  showState('results');
}

// Toggle content highlighting
function toggleHighlighting() {
  if (!currentTab || !currentTab.id) return;
  
  isHighlightingEnabled = !isHighlightingEnabled;
  
  chrome.tabs.sendMessage(
    currentTab.id,
    { 
      action: isHighlightingEnabled ? 'analyzeCurrentPage' : 'clearHighlights'
    }
  );
  
  updateHighlightButtonState();
}

// Update the highlight button state
function updateHighlightButtonState() {
  if (isHighlightingEnabled) {
    highlightButtonText.textContent = 'Remove Highlights';
    highlightButton.classList.add('secondary');
  } else {
    highlightButtonText.textContent = 'Highlight Misleading Content';
    highlightButton.classList.remove('secondary');
  }
}

// Show appropriate state in the popup
function showState(state, message) {
  // Hide all states
  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
  resultsState.classList.add('hidden');
  noContentState.classList.add('hidden');
  
  // Show requested state
  switch (state) {
    case 'loading':
      loadingState.classList.remove('hidden');
      break;
    case 'error':
      if (message) {
        errorMessage.textContent = message;
      }
      errorState.classList.remove('hidden');
      break;
    case 'results':
      resultsState.classList.remove('hidden');
      break;
    case 'noContent':
      noContentState.classList.remove('hidden');
      break;
  }
}