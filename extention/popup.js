// AliDigitalSolution Extension - Popup Script

// Get extension version from manifest
const manifest = chrome.runtime.getManifest();
document.getElementById('version').textContent = manifest.version;

// Get dashboard URL from storage or use default
async function getDashboardUrl() {
  try {
    const result = await chrome.storage.sync.get(['dashboardUrl']);
    return result.dashboardUrl || 'https://alidigitalsolution.in/dashboard';
  } catch (error) {
    return 'https://alidigitalsolution.in/dashboard';
  }
}

// Open dashboard button
document.getElementById('openDashboard').addEventListener('click', async () => {
  const dashboardUrl = await getDashboardUrl();
  chrome.tabs.create({ url: dashboardUrl });
});

// Refresh status button
document.getElementById('refresh').addEventListener('click', () => {
  // Check if extension is working
  chrome.runtime.sendMessage({ type: 'GROWTOOLS_CHECK' }, (response) => {
    if (response && response.installed) {
      document.getElementById('status').textContent = 'Active';
      document.getElementById('status').classList.add('active');
    } else {
      document.getElementById('status').textContent = 'Error';
      document.getElementById('status').classList.remove('active');
    }
  });
});

// Check status on load
chrome.runtime.sendMessage({ type: 'GROWTOOLS_CHECK' }, (response) => {
  if (response && response.installed) {
    document.getElementById('status').textContent = 'Active';
    document.getElementById('status').classList.add('active');
  }
});

