const fs = require('fs');
const path = require('path');

// Directories to include in the extension package
const directories = [
  'icons',
  'popup',
  'scripts'
];

// Files to include in the root of the extension package
const rootFiles = [
  'manifest.json'
];

// Create a dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
  console.log('Created dist directory');
}

// Copy all the necessary directories
directories.forEach(dir => {
  const srcDir = path.join(__dirname, dir);
  const destDir = path.join(distDir, dir);
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir);
  }
  
  copyDirectory(srcDir, destDir);
});

// Copy root files
rootFiles.forEach(file => {
  const srcFile = path.join(__dirname, file);
  const destFile = path.join(distDir, file);
  
  if (fs.existsSync(srcFile)) {
    fs.copyFileSync(srcFile, destFile);
    console.log(`Copied ${file} to dist`);
  } else {
    console.error(`Warning: ${file} does not exist, skipping`);
  }
});

// Function to recursively copy a directory
function copyDirectory(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  entries.forEach(entry => {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath);
      }
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${srcPath} to ${destPath}`);
    }
  });
}

console.log('Build completed successfully! The extension is ready in the dist directory.');
console.log('To load the extension in Chrome, go to chrome://extensions, enable Developer mode,');
console.log('click "Load unpacked", and select the dist directory.');