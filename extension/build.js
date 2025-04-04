// Simple script to bundle the extension for distribution
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create a dist directory for the packaged extension
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Copy all files except build scripts and dist directory
function copyDirectory(src, dest) {
  const files = fs.readdirSync(src);
  
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    // Skip the build script and dist directory
    if (file === 'build.js' || file === 'dist') {
      continue;
    }
    
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Main build process
try {
  console.log('🔨 Building TruthLens Browser Extension...');
  
  // Clean any existing build
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
  }
  fs.mkdirSync(distDir);
  
  // Copy files
  copyDirectory(__dirname, distDir);
  
  // Create a zip file for distribution
  console.log('📦 Creating extension package...');
  
  // Use zip command if available, or provide instructions
  try {
    execSync(`cd ${distDir} && zip -r ../truthlens-extension.zip .`);
    console.log('✅ Extension package created: truthlens-extension.zip');
  } catch (error) {
    console.log('⚠️ Could not create zip file automatically.');
    console.log('Please manually zip the contents of the "dist" directory for distribution.');
  }
  
  console.log('🎉 Build complete!');
  console.log('');
  console.log('To load the extension in Chrome:');
  console.log('1. Open Chrome and navigate to chrome://extensions/');
  console.log('2. Enable "Developer mode" (toggle in the top-right)');
  console.log('3. Click "Load unpacked" and select the "dist" directory');
  console.log('');
  console.log('To load the extension in Firefox:');
  console.log('1. Open Firefox and navigate to about:debugging#/runtime/this-firefox');
  console.log('2. Click "Load Temporary Add-on" and select the "manifest.json" file in the dist directory');
  
} catch (error) {
  console.error('❌ Build failed:', error);
}