// AliDigitalSolution Extension - Background Service Worker
// Handles cookie injection and tool access

/**
 * Clear existing cookies for a domain before injecting new ones
 */
async function clearExistingCookies(url) {
  try {
    // Validate URL
    if (!url || typeof url !== 'string' || url.trim() === '') {
      throw new Error('Invalid URL provided for clearing cookies');
    }

    // Ensure URL has protocol
    let validUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      validUrl = 'https://' + url;
    }

    const urlObj = new URL(validUrl);
    const cookies = await chrome.cookies.getAll({ url: validUrl });
    
    for (const cookie of cookies) {
      // Construct proper URL for cookie removal
      const protocol = urlObj.protocol;
      const cookieDomain = cookie.domain || urlObj.hostname;
      const cookiePath = cookie.path || '/';
      
      // Remove leading dot from domain if present
      const cleanDomain = cookieDomain.startsWith('.') 
        ? cookieDomain.substring(1) 
        : cookieDomain;
      
      const cookieUrl = protocol + '//' + cleanDomain + cookiePath;
      
      try {
        await chrome.cookies.remove({
          url: cookieUrl,
          name: cookie.name
        });
      } catch (removeError) {
        console.warn('Error removing cookie:', cookie.name, removeError);
      }
    }
  } catch (error) {
    console.error('Error clearing cookies:', error);
    // Don't throw - continue even if clearing fails
  }
}

/**
 * Handle paste session - inject cookies and open tool
 */
async function handlePasteSession(message) {
  try {
    // Validate cookies data
    if (!message.cookies) {
      throw new Error('No cookies provided');
    }

    let cookiesData;
    
    // Try to decode base64, if it fails, assume it's already JSON
    try {
      // Check if it's a valid base64 string
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (base64Regex.test(message.cookies) && message.cookies.length > 0) {
        cookiesData = JSON.parse(atob(message.cookies));
      } else {
        // Not base64, try parsing as JSON directly
        cookiesData = typeof message.cookies === 'string' 
          ? JSON.parse(message.cookies) 
          : message.cookies;
      }
    } catch (decodeError) {
      // If base64 decode fails, try parsing as JSON directly
      try {
        cookiesData = typeof message.cookies === 'string' 
          ? JSON.parse(message.cookies) 
          : message.cookies;
      } catch (parseError) {
        throw new Error(`Failed to decode cookies: ${decodeError.message}`);
      }
    }
    
    // Validate and clear existing cookies if URL is provided
    if (message.url) {
      // Validate URL format
      if (typeof message.url !== 'string' || message.url.trim() === '') {
        throw new Error('Invalid URL provided');
      }
      
      // Ensure URL has protocol
      let validUrl = message.url.trim();
      if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
        validUrl = 'https://' + validUrl;
      }
      
      // Validate URL is properly formatted
      try {
        new URL(validUrl);
      } catch (urlError) {
        throw new Error(`Invalid URL format: ${message.url}`);
      }
      
      await clearExistingCookies(validUrl);
    }
    
    // Get tool URL and domain for cookie injection
    let toolUrl = null;
    let toolDomain = null;
    let toolProtocol = 'https:';
    
    if (message.url) {
      let validUrl = message.url.trim();
      if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
        validUrl = 'https://' + validUrl;
      }
      
      try {
        const urlObj = new URL(validUrl);
        toolUrl = validUrl;
        toolDomain = urlObj.hostname;
        toolProtocol = urlObj.protocol;
      } catch (urlError) {
        throw new Error(`Invalid URL format: ${message.url}`);
      }
    }

    // Convert cookies array or object to array
    const cookiesArray = Array.isArray(cookiesData) ? cookiesData : [cookiesData];
    
    // Inject each cookie and track success
    const cookiePromises = [];
    const injectedCookies = [];
    
    for (const cookie of cookiesArray) {
      // Validate cookie has required fields
      if (!cookie || !cookie.name) {
        console.warn('Skipping invalid cookie:', cookie);
        continue;
      }

      // Get domain - use from cookie or extract from tool URL
      let cookieDomain = cookie.domain;
      let domainForUrl = toolDomain; // For constructing URL
      
      if (!cookieDomain && toolDomain) {
        // If cookie doesn't have domain, use tool domain
        cookieDomain = toolDomain;
        domainForUrl = toolDomain;
      } else if (cookieDomain) {
        // Cookie has domain - use it
        // Remove leading dot for URL construction
        domainForUrl = cookieDomain.startsWith('.') 
          ? cookieDomain.substring(1) 
          : cookieDomain;
      }

      if (!domainForUrl || domainForUrl.trim() === '') {
        console.warn('Skipping cookie with no domain:', cookie.name);
        continue;
      }

      // Determine protocol - use tool protocol if cookie doesn't specify
      const protocol = cookie.secure !== false ? 'https:' : (toolProtocol || 'https:');
      const path = cookie.path || '/';
      
      // Construct valid URL for cookie (must match domain)
      const cookieUrl = protocol + '//' + domainForUrl + path;
      
      // Validate URL before using
      try {
        new URL(cookieUrl);
      } catch (urlError) {
        console.warn('Invalid cookie URL:', cookieUrl, urlError);
        continue;
      }
      
      // Prepare cookie data for Chrome API
      const cookieData = {
        name: cookie.name,
        value: cookie.value || '',
        url: cookieUrl, // Required: must be a valid URL for the domain
        // Domain handling:
        // - If cookie.domain starts with '.', include it (for subdomain cookies)
        // - If cookie.domain doesn't start with '.', don't set domain field (Chrome will use URL's domain)
        // - If no cookie.domain, don't set it (Chrome will use URL's domain)
        domain: cookieDomain && cookieDomain.startsWith('.') ? cookieDomain : undefined,
        path: cookie.path || '/',
        // Session cookies: if expirationDate is not provided or is 0, don't set it
        expirationDate: cookie.expirationDate && cookie.expirationDate > 0 
          ? (typeof cookie.expirationDate === 'number' 
              ? cookie.expirationDate 
              : new Date(cookie.expirationDate).getTime() / 1000)
          : undefined,
        secure: cookie.secure !== false && cookie.secure !== undefined,
        httpOnly: cookie.httpOnly || false,
        sameSite: cookie.sameSite || 'lax'
      };
      
      // Add cookie injection to promises array
      const cookiePromise = chrome.cookies.set(cookieData)
        .then((setCookie) => {
          if (setCookie) {
            injectedCookies.push(cookie.name);
            console.log(`✓ Cookie set: ${cookie.name} for ${domainForUrl}`);
            return { success: true, name: cookie.name };
          } else {
            throw new Error(`Failed to set cookie: ${cookie.name}`);
          }
        })
        .catch((error) => {
          console.error(`✗ Error setting cookie ${cookie.name}:`, error.message, cookieData);
          return { success: false, name: cookie.name, error: error.message };
        });
      
      cookiePromises.push(cookiePromise);
    }
    
    // Wait for all cookies to be injected
    const results = await Promise.all(cookiePromises);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`✓ Injected ${successCount} cookies successfully${failCount > 0 ? `, ✗ ${failCount} failed` : ''}`);
    
    if (failCount > 0) {
      const failedCookies = results.filter(r => !r.success).map(r => r.name);
      console.warn('Failed cookies:', failedCookies);
    }
    
    // Wait a bit longer to ensure cookies are fully persisted
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Verify cookies are set before opening tab
    if (toolUrl && injectedCookies.length > 0) {
      try {
        const verifyCookies = await chrome.cookies.getAll({ url: toolUrl });
        console.log(`✓ Verified ${verifyCookies.length} cookies for domain ${toolDomain}`);
        
        // Check if session cookies are present
        const sessionCookies = verifyCookies.filter(c => !c.expirationDate);
        if (sessionCookies.length > 0) {
          console.log(`✓ Found ${sessionCookies.length} session cookies`);
        }
      } catch (verifyError) {
        console.warn('Could not verify cookies:', verifyError);
      }
    }
    
    // Open the tool URL in a new tab AFTER cookies are injected and verified
    if (toolUrl) {
      try {
        // Create tab and wait for it to be created
        const tab = await chrome.tabs.create({ url: toolUrl });
        console.log(`✓ Opened tool URL in tab ${tab.id}:`, toolUrl);
        
        // Optional: Wait for tab to load and then verify cookies are accessible
        // This ensures the session is active when the page loads
        if (tab.id) {
          chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
            if (tabId === tab.id && changeInfo.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(listener);
              // Cookies should now be active in the loaded page
              console.log('✓ Tab loaded with session cookies');
            }
          });
        }
      } catch (tabError) {
        console.error('Error opening tab:', tabError);
        throw new Error(`Failed to open tab: ${tabError.message}`);
      }
    } else {
      throw new Error('No URL provided to open');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to paste session:', error);
    return { success: false, error: error.message };
  }
}

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GROWTOOLS_ACCESS') {
    handlePasteSession(message)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (message.type === 'GROWTOOLS_CHECK') {
    sendResponse({ installed: true });
    return true;
  }
  
  return false;
});

// Listen for connections from content script
chrome.runtime.onConnect.addListener((port) => {
  if (!port) {
    console.error('Port is undefined');
    return;
  }
  
  port.onMessage.addListener(async (message) => {
    if (message.type === 'GROWTOOLS_CHECK') {
      // Respond to check request
      port.postMessage({ installed: true });
    } else if (message.type === 'GROWTOOLS_ACCESS') {
      const result = await handlePasteSession(message);
      port.postMessage(result);
    }
  });
});
