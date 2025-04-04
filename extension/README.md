# TruthLens Browser Extension

This browser extension allows users to automatically check news and articles for potential misinformation while browsing the web.

## Features

- **Automatic Content Analysis**: Analyzes web pages for potential misinformation
- **Visual Highlighting**: Highlights potentially misleading content on the page
- **Fact Checking**: Provides sources and fact checks when available
- **User Settings**: Customizable preferences for behavior and notifications

## Installation

### For Development

1. Clone or download this repository
2. Navigate to `chrome://extensions/` in Chrome or `about:debugging#/runtime/this-firefox` in Firefox
3. Enable Developer Mode (Chrome)
4. Click "Load unpacked" (Chrome) or "Load Temporary Add-on" (Firefox)
5. Select the extension directory

### For Distribution

1. Run `node build.js` to create a distribution package
2. Upload the `truthlens-extension.zip` file to the Chrome Web Store or Firefox Add-ons

## Usage

The extension works automatically when you visit news websites or articles:

- **View Analysis**: Click the extension icon to see a detailed analysis of the current page
- **Highlighting**: Toggle content highlighting on or off
- **Settings**: Customize the extension's behavior

## Configuration

You can adjust the following settings in the extension popup:

- **Auto-Check Pages**: Enable/disable automatic analysis
- **Highlight Content**: Toggle content highlighting
- **Show Notifications**: Enable/disable notifications
- **API Endpoint**: Change the TruthLens API server URL

## Development

This extension is built using standard web technologies:

- **JavaScript**: Core extension functionality
- **HTML/CSS**: Popup and UI components
- **API Integration**: Connects to the TruthLens backend API

## License

This extension is part of the TruthLens project.

## Privacy

This extension only sends page content to the TruthLens API for analysis. No personal data is collected unless you are logged in to the TruthLens service.