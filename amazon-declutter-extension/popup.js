// Popup settings controller for Amazon Declutter

const SETTINGS_KEYS = [
  'enabled',
  'removeSponsored',
  'removeRecommendations',
  'removeBrandStories',
  'removeVideoAds',
  'removeEditorialPicks',
  'removeFrequentlyBought',
  'removeClimateLabels',
  'removeAmazonChoice',
  'removeBestSeller',
  'highlightSuspiciousReviews',
  'cleanProductPage',
  'hideAlsoBought',
  'hideViewingHistory',
  'hideBrowsingHistory'
];

const DEFAULT_SETTINGS = {
  enabled: true,
  removeSponsored: true,
  removeRecommendations: true,
  removeBrandStories: true,
  removeVideoAds: true,
  removeEditorialPicks: true,
  removeFrequentlyBought: false,
  removeClimateLabels: false,
  removeAmazonChoice: true,
  removeBestSeller: false,
  highlightSuspiciousReviews: true,
  cleanProductPage: true,
  hideAlsoBought: true,
  hideViewingHistory: true,
  hideBrowsingHistory: true
};

// Load settings and update UI
function loadSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    SETTINGS_KEYS.forEach(key => {
      const checkbox = document.getElementById(key);
      if (checkbox) {
        checkbox.checked = settings[key];
      }
    });
    updateDisabledState(settings.enabled);
  });
}

// Save a single setting
function saveSetting(key, value) {
  chrome.storage.sync.set({ [key]: value }, () => {
    showStatus('Settings saved!');
  });
}

// Show status message
function showStatus(message, isWarning = false) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = 'status visible' + (isWarning ? ' warning' : '');

  setTimeout(() => {
    status.classList.remove('visible');
  }, 1500);
}

// Update disabled state of other options when master toggle changes
function updateDisabledState(enabled) {
  SETTINGS_KEYS.forEach(key => {
    if (key !== 'enabled') {
      const checkbox = document.getElementById(key);
      if (checkbox) {
        checkbox.disabled = !enabled;
      }
    }
  });
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();

  // Add event listeners to all checkboxes
  SETTINGS_KEYS.forEach(key => {
    const checkbox = document.getElementById(key);
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        saveSetting(key, e.target.checked);

        // Special handling for master toggle
        if (key === 'enabled') {
          updateDisabledState(e.target.checked);
          if (!e.target.checked) {
            showStatus('Extension disabled - refresh to restore content', true);
          }
        }
      });
    }
  });
});
