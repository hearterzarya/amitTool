# GrowTools Browser Extension

This extension enables automatic cookie injection and tool access for GrowTools users.

## Features

- 🔐 Automatic cookie injection for premium tools
- 🚀 One-click tool access from dashboard
- 🔄 Session management
- ✅ Secure communication with web app

## Installation

### For Development

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extention` folder from this project
5. The extension should now be installed

### For Production

1. Package the extension (zip the folder)
2. Submit to Chrome Web Store (or distribute manually)
3. Users can install from the store

## How It Works

1. **Content Script** (`content.js`): Listens for messages from the web app
2. **Background Script** (`background.js`): Handles cookie injection and tab management
3. **Popup** (`popup.html`): Shows extension status and quick actions

## Message Protocol

The extension communicates with the web app using `window.postMessage`:

### From Web App to Extension

```javascript
// Check if extension is installed
window.postMessage({ type: "GROWTOOLS_CHECK" }, "*");

// Request tool access
window.postMessage({
  type: "GROWTOOLS_ACCESS",
  toolId: "tool-id",
  url: "https://tool.example.com",
  cookies: "base64-encoded-cookies-json"
}, "*");
```

### From Extension to Web App

```javascript
// Extension installed confirmation
{ type: "GROWTOOLS_INSTALLED" }

// Access success
{ type: "GROWTOOLS_ACCESS_SUCCESS", toolId: "tool-id" }

// Access error
{ type: "GROWTOOLS_ACCESS_ERROR", error: "error message", toolId: "tool-id" }
```

## File Structure

```
extention/
├── manifest.json      # Extension configuration
├── background.js     # Service worker (cookie injection)
├── content.js        # Content script (message relay)
├── popup.html        # Extension popup UI
├── popup.js          # Popup script
├── logo.png          # Extension icon
└── lib/              # Third-party libraries
    ├── crypto-js.min.js
    ├── jquery-v3.3.1.min.js
    └── underscore.min.js
```

## Permissions

- `cookies`: To inject cookies for tool access
- `tabs`: To open tool URLs in new tabs
- `storage`: To store extension settings
- `activeTab`: To interact with current tab
- `scripting`: To inject content scripts
- `<all_urls>`: To work with all tool domains

## Development

### Testing

1. Load the extension in developer mode
2. Open the GrowTools web app
3. Navigate to dashboard
4. Click "Access Tool" on any tool
5. Verify cookies are injected and tool opens

### Debugging

- Open `chrome://extensions/` and click "Inspect views: service worker" for background script
- Use browser DevTools console to see content script logs
- Check popup by clicking extension icon

## Security Notes

- Cookies are encrypted in the database
- Extension only injects cookies when explicitly requested by the web app
- Content script validates message sources
- No sensitive data is stored in extension storage

## Troubleshooting

### Extension not detected
- Ensure extension is loaded and enabled
- Check that content script is running (DevTools console)
- Verify manifest.json is valid

### Cookies not injecting
- Check browser console for errors
- Verify cookie format is correct
- Ensure domain permissions are granted

### Tool not opening
- Check if URL is valid
- Verify tab permissions are granted
- Check background script logs

## Support

For issues or questions, contact the GrowTools support team.

