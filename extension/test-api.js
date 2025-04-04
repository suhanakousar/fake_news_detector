// Simple script to test the TruthLens API endpoint for the browser extension

const fetch = require('node-fetch');

// API endpoint to test
const API_URL = 'http://localhost:5000/api/analyze/extension'; // Replace with your actual server URL

// Sample content to analyze
const testContent = {
  text: `
  BREAKING NEWS: Scientists discover that drinking water causes cancer! 
  A new study from an unknown research institute claims that people who drink water 
  have a 100% chance of dying at some point in their lives. This shocking discovery 
  has been hidden from the public by big water companies for decades. Share this 
  important information with everyone you know!
  `,
  url: 'https://example.com/fake-news-article'
};

// Function to test the text analysis
async function testTextAnalysis() {
  try {
    console.log('Testing text analysis...');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: testContent.text })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ Text analysis successful!');
    console.log('Classification:', result.classification);
    console.log('Confidence:', Math.round(result.confidence * 100) + '%');
    console.log('Reasoning (sample):', result.reasoning[0]);
    console.log('\nFull result:', JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Text analysis failed:', error.message);
    return false;
  }
}

// Function to test the URL analysis
async function testUrlAnalysis() {
  try {
    console.log('\nTesting URL analysis...');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: testContent.url })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ URL analysis successful!');
    console.log('Classification:', result.classification);
    console.log('Confidence:', Math.round(result.confidence * 100) + '%');
    console.log('Reasoning (sample):', result.reasoning[0]);
    console.log('\nFull result:', JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.error('❌ URL analysis failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🧪 TESTING TRUTHLENS EXTENSION API');
  console.log('=================================\n');
  
  const textTestSuccess = await testTextAnalysis();
  const urlTestSuccess = await testUrlAnalysis();
  
  console.log('\n=================================');
  if (textTestSuccess && urlTestSuccess) {
    console.log('🎉 All tests passed! The API is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please check your server configuration.');
  }
}

runTests();