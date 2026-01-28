# Copy Cookies Extension

Simple browser extension to extract and copy cookies from the current tab.

## Features

- **One-click cookie extraction**: Extract all cookies from the current tab
- **Copy to clipboard**: Automatically copies cookies as JSON to your clipboard
- **Simple interface**: Clean, minimal UI with just one button

## Installation

1. Download the extension ZIP file from the admin panel (`/admin/extension`)
2. Extract the ZIP file to a folder on your computer
3. Open Chrome/Edge and navigate to `chrome://extensions/`
4. Enable "Developer mode" (toggle in the top right)
5. Click "Load unpacked" button
6. Select the extracted folder
7. The extension icon will appear in your browser toolbar

## Usage

1. Navigate to the website you want to extract cookies from (e.g., `https://chat.openai.com`)
2. Log in to the website if needed
3. Click the extension icon
4. Click "Copy Cookies to Clipboard"
5. Cookies are now copied as JSON to your clipboard
6. Paste the cookies JSON wherever you need them

## Cookie Format

Cookies are copied in the following JSON format:

```json
[
  {
    "name": "session_id",
    "value": "abc123...",
    "domain": ".example.com",
    "path": "/",
    "secure": true,
    "httpOnly": true,
    "sameSite": "lax",
    "expirationDate": 1234567890
  }
]
```

## Permissions

The extension requires:
- `cookies` - To read cookies from websites
- `tabs` - To access the current tab
- `activeTab` - To interact with the current tab

## Support

For issues or questions, contact the development team.
