// AliDigitalSolution Extension - Content Script
// Listens for messages from the web app and forwards them to background script

// Check if extension APIs are available
function isExtensionContext() {
  return typeof chrome !== 'undefined' && 
         chrome.runtime && 
         chrome.runtime.connect;
}

// Listen for messages from the web page
window.addEventListener('message', (event) => {
  // Security: Only accept messages from same origin or trusted sources
  if (event.source !== window) return;
  
  // Check if extension context is available
  if (!isExtensionContext()) {
    console.warn('AliDigitalSolution extension context not available');
    return;
  }
  
  const messageTypes = ['GROWTOOLS_ACCESS', 'GROWTOOLS_CHECK'];
  
  if (messageTypes.includes(event.data && event.data.type)) {
    try {
      // Connect to background script
      const port = chrome.runtime.connect({ name: 'alitool_content' });
      
      if (!port) {
        console.error('Failed to connect to background script');
        return;
      }
    
    if (event.data.type === 'GROWTOOLS_CHECK') {
      // Check if extension is installed
      port.postMessage({ type: 'GROWTOOLS_CHECK' });
      
      const messageHandler = (response) => {
        if (response && response.installed) {
          // Notify the web page that extension is installed
          window.postMessage({ type: 'GROWTOOLS_INSTALLED' }, '*');
        }
        port.onMessage.removeListener(messageHandler);
        port.disconnect();
      };
      
      port.onMessage.addListener(messageHandler);
      
      // Fallback: if no response in 1 second, assume extension is working
      setTimeout(() => {
        port.onMessage.removeListener(messageHandler);
        if (port) {
          window.postMessage({ type: 'GROWTOOLS_INSTALLED' }, '*');
          port.disconnect();
        }
      }, 1000);
    } else if (event.data.type === 'GROWTOOLS_ACCESS') {
      // Forward access request to background script
      port.postMessage({
        type: 'GROWTOOLS_ACCESS',
        toolId: event.data.toolId,
        url: event.data.url,
        cookies: event.data.cookies
      });
      
      port.onMessage.addListener((response) => {
        if (response && response.success) {
          // Notify the web page of success
          window.postMessage({ 
            type: 'GROWTOOLS_ACCESS_SUCCESS',
            toolId: event.data.toolId 
          }, '*');
        } else {
          // Notify the web page of failure
          window.postMessage({ 
            type: 'GROWTOOLS_ACCESS_ERROR',
            error: response && response.error ? response.error : 'Unknown error',
            toolId: event.data.toolId 
          }, '*');
        }
        port.disconnect();
      });
      
      // Handle port disconnection
      port.onDisconnect.addListener(() => {
        if (chrome.runtime.lastError) {
          console.error('Port disconnected:', chrome.runtime.lastError.message);
        }
      });
    }
    } catch (error) {
      console.error('Error in content script:', error);
      // Notify web page of error
      if (event.data.type === 'GROWTOOLS_CHECK') {
        // Don't send error for check, just fail silently
      } else if (event.data.type === 'GROWTOOLS_ACCESS') {
        window.postMessage({
          type: 'GROWTOOLS_ACCESS_ERROR',
          error: error.message || 'Extension communication failed',
          toolId: event.data.toolId
        }, '*');
      }
    }
  }
});
