import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SVG icon template with magnifying glass and checkmark symbolizing verification
const svgTemplate = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size/8}" fill="#1a5fb4" />
  
  <!-- Magnifying glass -->
  <circle cx="${size*0.4}" cy="${size*0.4}" r="${size*0.25}" fill="none" stroke="white" stroke-width="${size/16}" />
  <line x1="${size*0.58}" y1="${size*0.58}" x2="${size*0.75}" y2="${size*0.75}" stroke="white" stroke-width="${size/16}" stroke-linecap="round" />
  
  <!-- Checkmark -->
  <path d="M${size*0.65} ${size*0.65} L${size*0.75} ${size*0.8} L${size*0.9} ${size*0.6}" fill="none" stroke="#50fa7b" stroke-width="${size/20}" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

// Write SVG files for icon sizes
const iconSizes = [16, 48, 128];

iconSizes.forEach(size => {
  const svgContent = svgTemplate(size);
  const filename = path.join(__dirname, `icon${size}.svg`);
  fs.writeFileSync(filename, svgContent);
  console.log(`Created ${filename}`);
});

console.log('SVG icons created successfully. Convert these to PNG files for Chrome compatibility.');
console.log('You can use online converters or an image editing program to convert the SVG files to PNG.');