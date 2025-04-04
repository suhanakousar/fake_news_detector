document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const mainPanel = document.getElementById('mainPanel');
  const settingsPanel = document.getElementById('settingsPanel');
  const loadingStatus = document.getElementById('loadingStatus');
  const errorStatus = document.getElementById('errorStatus');
  const resultPanel = document.getElementById('result');
  
  const tabs = document.querySelectorAll('.tab');
  const settingsToggle = document.getElementById('settingsToggle');
  const analyzeButton = document.getElementById('analyzeButton');
  const saveSettingsButton = document.getElementById('saveSettings');
  const cancelAnalysisButton = document.getElementById('cancelAnalysis');
  const backFromErrorButton = document.getElementById('backFromError');
  const backToMainButton = document.getElementById('backToMain');
  
  const autoDetectCheckbox = document.getElementById('autoDetect');
  const highlightContentCheckbox = document.getElementById('highlightContent');
  const showBannersCheckbox = document.getElementById('showBanners');
  const apiEndpointInput = document.getElementById('apiEndpoint');
  
  // Load configuration from storage
  loadConfig();
  
  // Set up event listeners
  setupEventListeners();
  
  // Function to load configuration from storage
  function loadConfig() {
    chrome.storage.sync.get({
      autoDetect: true,
      highlightContent: true,
      showBanners: true,
      apiEndpoint: 'http://localhost:5000/api/analyze/extension'
    }, function(config) {
      autoDetectCheckbox.checked = config.autoDetect;
      highlightContentCheckbox.checked = config.highlightContent;
      showBannersCheckbox.checked = config.showBanners;
      apiEndpointInput.value = config.apiEndpoint;
      
      // Update highlighting state on load
      updateHighlightButtonState();
    });
  }
  
  // Setup event listeners
  function setupEventListeners() {
    // Tab switching
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        const tabName = this.getAttribute('data-tab');
        
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        // Show correct panel
        if (tabName === 'main') {
          mainPanel.style.display = 'block';
          settingsPanel.style.display = 'none';
        } else if (tabName === 'settings') {
          mainPanel.style.display = 'none';
          settingsPanel.style.display = 'block';
        }
      });
    });
    
    // Settings toggle button
    settingsToggle.addEventListener('click', function() {
      // Find and click the settings tab
      document.querySelector('.tab[data-tab="settings"]').click();
    });
    
    // Settings save button
    saveSettingsButton.addEventListener('click', function() {
      updateConfig();
    });
    
    // Auto-highlighting toggle
    highlightContentCheckbox.addEventListener('change', function() {
      updateConfig();
    });
    
    // Auto-detection toggle
    autoDetectCheckbox.addEventListener('change', function() {
      updateConfig();
    });
    
    // Banner toggle
    showBannersCheckbox.addEventListener('change', function() {
      updateConfig();
    });
    
    // Analyze button
    analyzeButton.addEventListener('click', function() {
      analyzeCurrentPage();
    });
    
    // Back buttons
    backToMainButton.addEventListener('click', function() {
      resultPanel.style.display = 'none';
      mainPanel.style.display = 'block';
      document.querySelector('.tab[data-tab="main"]').click();
    });
    
    backFromErrorButton.addEventListener('click', function() {
      errorStatus.style.display = 'none';
      mainPanel.style.display = 'block';
      document.querySelector('.tab[data-tab="main"]').click();
    });
    
    cancelAnalysisButton.addEventListener('click', function() {
      loadingStatus.style.display = 'none';
      mainPanel.style.display = 'block';
      document.querySelector('.tab[data-tab="main"]').click();
      
      // Send message to cancel analysis
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "cancelAnalysis"});
      });
    });
  }
  
  // Update configuration in storage
  function updateConfig() {
    const config = {
      autoDetect: autoDetectCheckbox.checked,
      highlightContent: highlightContentCheckbox.checked,
      showBanners: showBannersCheckbox.checked,
      apiEndpoint: apiEndpointInput.value
    };
    
    chrome.storage.sync.set(config, function() {
      // Update active tab highlighting
      updateHighlightButtonState();
      
      // Send updated config to content script
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "updateConfig", 
          config: config
        });
      });
    });
  }
  
  // Analyze current page
  function analyzeCurrentPage() {
    // Show loading state
    mainPanel.style.display = 'none';
    loadingStatus.style.display = 'block';
    
    // Send message to content script to analyze the page
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "analyze"}, function(response) {
        if (chrome.runtime.lastError) {
          // Handle error - content script might not be loaded
          loadingStatus.style.display = 'none';
          errorStatus.style.display = 'block';
          return;
        }
        
        if (response && response.status === 'analyzing') {
          // Wait for analysis to complete
          chrome.runtime.onMessage.addListener(function listener(message) {
            if (message.action === 'analysisComplete') {
              chrome.runtime.onMessage.removeListener(listener);
              loadingStatus.style.display = 'none';
              
              if (message.error) {
                errorStatus.style.display = 'block';
              } else {
                displayResults(message.result);
              }
            }
          });
        } else {
          // Error occurred
          loadingStatus.style.display = 'none';
          errorStatus.style.display = 'block';
        }
      });
    });
  }
  
  // Display analysis results
  function displayResults(result) {
    // Set classification
    const classificationElem = document.getElementById('classification');
    classificationElem.textContent = result.classification.charAt(0).toUpperCase() + result.classification.slice(1);
    classificationElem.className = 'classification ' + result.classification.toLowerCase();
    
    // Set confidence
    document.getElementById('confidence').textContent = 'Confidence: ' + Math.round(result.confidence * 100) + '%';
    
    // Set reasoning
    const reasoningContainer = document.getElementById('reasoning');
    reasoningContainer.innerHTML = '';
    
    if (result.reasoning && result.reasoning.length > 0) {
      result.reasoning.forEach(reason => {
        const reasonElem = document.createElement('div');
        reasonElem.className = 'reasoning-item';
        reasonElem.textContent = reason;
        reasoningContainer.appendChild(reasonElem);
      });
    } else {
      const noReasonElem = document.createElement('div');
      noReasonElem.textContent = 'No specific reasoning provided.';
      reasoningContainer.appendChild(noReasonElem);
    }
    
    // Set source info
    const sourceContainer = document.getElementById('source');
    if (result.sourceCredibility) {
      const source = result.sourceCredibility;
      sourceContainer.innerHTML = `
        <div class="source-title">${source.name || 'Unknown Source'}</div>
        <div class="source-score">
          Credibility Score: ${Math.round(source.score * 100)}% (${source.level})
        </div>
      `;
    } else {
      sourceContainer.innerHTML = 'Source information not available.';
    }
    
    // Show results panel
    mainPanel.style.display = 'none';
    resultPanel.style.display = 'block';
  }
  
  // Toggle highlighting
  function toggleHighlighting() {
    const isEnabled = highlightContentCheckbox.checked;
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: isEnabled ? "enableHighlighting" : "disableHighlighting"
      });
    });
  }
  
  // Update the highlight button state
  function updateHighlightButtonState() {
    toggleHighlighting();
  }
  
  // Show different states
  function showState(state, message) {
    mainPanel.style.display = 'none';
    loadingStatus.style.display = 'none';
    errorStatus.style.display = 'none';
    resultPanel.style.display = 'none';
    
    if (state === 'main') {
      mainPanel.style.display = 'block';
    } else if (state === 'loading') {
      loadingStatus.style.display = 'block';
      if (message) {
        document.querySelector('#loadingStatus .status-message').textContent = message;
      }
    } else if (state === 'error') {
      errorStatus.style.display = 'block';
      if (message) {
        document.querySelector('#errorStatus .status-message').textContent = message;
      }
    } else if (state === 'result') {
      resultPanel.style.display = 'block';
    }
  }
});