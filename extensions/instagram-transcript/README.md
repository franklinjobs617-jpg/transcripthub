# Instagram Transcript Chrome Extension

A Chrome extension that generates transcripts for Instagram Reels, videos, and TV posts with one click.

## Features

- **One-click transcript generation** - Automatically detect Instagram videos and generate transcripts
- **Free daily quota** - 2 free transcripts every day
- **Quick copy** - One-click copy transcript to clipboard
- **Beautiful UI** - Modern, responsive design matching Instagram's aesthetic

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right corner)
3. Click "Load unpacked"
4. Select the `extensions/instagram-transcript` folder
5. The extension icon will appear in your Chrome toolbar

## Usage

1. Open any Instagram Reel, video, or TV post in Chrome
2. Click the extension icon in the toolbar, or use the floating button on the video page
3. Click "Generate Transcript" to create a transcript
4. Copy the transcript or click "More" to open the full experience on the website

## Development

### Project Structure

```
extensions/
└── instagram-transcript/
    ├── manifest.json          # Extension manifest
    ├── background/
    │   └── background.js      # Background service worker
    ├── content/
    │   ├── content.js         # Content script (injected into pages)
    │   └── content.css        # Floating button styles
    ├── popup/
    │   ├── popup.html         # Popup UI
    │   ├── popup.css          # Popup styles
    │   └── popup.js           # Popup logic
    └── icons/                 # Extension icons
```

### API Configuration

Update the `API_BASE` constant in `background/background.js` to point to your backend:

```javascript
const API_BASE = 'https://transcripthub.com';
```

## License

MIT
