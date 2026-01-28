// Simple Cookie Copier Extension

document.addEventListener('DOMContentLoaded', () => {
  const copyBtn = document.getElementById('copy-cookies-btn');
  const statusEl = document.getElementById('status');
  const infoText = document.getElementById('info-text');
  
  copyBtn.addEventListener('click', copyCookies);
  
  // Load current tab info
  loadCurrentTabInfo();
});

async function loadCurrentTabInfo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const url = new URL(tab.url);
      document.getElementById('info-text').textContent = `Current: ${url.hostname}`;
    }
  } catch (error) {
    console.error('Error loading tab info:', error);
  }
}

async function copyCookies() {
  const copyBtn = document.getElementById('copy-cookies-btn');
  const statusEl = document.getElementById('status');
  
  try {
    copyBtn.disabled = true;
    showStatus('info', 'Extracting cookies...');
    
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url) {
      throw new Error('No active tab found');
    }
    
    // Parse URL to get domain
    let urlObj;
    try {
      urlObj = new URL(tab.url);
    } catch (e) {
      throw new Error('Invalid URL');
    }
    
    // Try multiple methods to get cookies
    let cookies = [];
    const cookieSet = new Set(); // Use Set to avoid duplicates
    
    // Method 1: Get cookies for the exact URL
    try {
      const urlCookies = await chrome.cookies.getAll({ url: tab.url });
      urlCookies.forEach(cookie => {
        cookieSet.add(`${cookie.name}:${cookie.domain}:${cookie.path}`);
        cookies.push(cookie);
      });
    } catch (e) {
      console.warn('Error getting cookies for URL:', e);
    }
    
    // Method 2: Get cookies for the origin (protocol + host)
    try {
      const origin = `${urlObj.protocol}//${urlObj.host}`;
      const originCookies = await chrome.cookies.getAll({ url: origin });
      originCookies.forEach(cookie => {
        const key = `${cookie.name}:${cookie.domain}:${cookie.path}`;
        if (!cookieSet.has(key)) {
          cookieSet.add(key);
          cookies.push(cookie);
        }
      });
    } catch (e) {
      console.warn('Error getting cookies for origin:', e);
    }
    
    // Method 3: Get cookies for domain (with and without subdomain)
    try {
      const domain = urlObj.hostname;
      const domainCookies = await chrome.cookies.getAll({ domain: domain });
      domainCookies.forEach(cookie => {
        const key = `${cookie.name}:${cookie.domain}:${cookie.path}`;
        if (!cookieSet.has(key)) {
          cookieSet.add(key);
          cookies.push(cookie);
        }
      });
    } catch (e) {
      console.warn('Error getting cookies for domain:', e);
    }
    
    // Method 4: Get all cookies and filter by domain
    try {
      const allCookies = await chrome.cookies.getAll({});
      const domainParts = urlObj.hostname.split('.');
      const baseDomain = domainParts.length >= 2 
        ? domainParts.slice(-2).join('.') 
        : domainParts[0];
      
      allCookies.forEach(cookie => {
        const cookieDomain = cookie.domain.startsWith('.') 
          ? cookie.domain.substring(1) 
          : cookie.domain;
        
        // Check if cookie domain matches current domain or is a parent domain
        if (cookieDomain === urlObj.hostname || 
            cookieDomain === baseDomain ||
            urlObj.hostname.endsWith('.' + cookieDomain) ||
            cookieDomain.endsWith('.' + baseDomain)) {
          const key = `${cookie.name}:${cookie.domain}:${cookie.path}`;
          if (!cookieSet.has(key)) {
            cookieSet.add(key);
            cookies.push(cookie);
          }
        }
      });
    } catch (e) {
      console.warn('Error getting all cookies:', e);
    }
    
    if (cookies.length === 0) {
      showStatus('error', 'No cookies found for this website. Make sure you are logged in and the website uses cookies.');
      copyBtn.disabled = false;
      return;
    }
    
    // Format cookies for export
    const formattedCookies = cookies.map(cookie => ({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path || '/',
      secure: cookie.secure || false,
      httpOnly: cookie.httpOnly || false,
      sameSite: cookie.sameSite || 'lax',
      expirationDate: cookie.expirationDate && cookie.expirationDate > 0 
        ? cookie.expirationDate 
        : undefined
    }));
    
    // Convert to JSON string
    const cookiesJson = JSON.stringify(formattedCookies, null, 2);
    
    // Copy to clipboard
    await navigator.clipboard.writeText(cookiesJson);
    
    showStatus('success', `✓ Copied ${cookies.length} cookies to clipboard!`);
    copyBtn.disabled = false;
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      statusEl.className = 'status';
      statusEl.textContent = '';
    }, 3000);
    
  } catch (error) {
    showStatus('error', `Error: ${error.message}`);
    copyBtn.disabled = false;
  }
}

function showStatus(type, message) {
  const statusEl = document.getElementById('status');
  statusEl.className = `status ${type}`;
  statusEl.textContent = message;
}
