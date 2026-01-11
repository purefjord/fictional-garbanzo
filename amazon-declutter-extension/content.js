// Amazon Declutter - Make Amazon Actually Usable
// Removes sponsored garbage, algorithmic slop, and UI clutter

(function() {
  'use strict';

  // Default settings
  const DEFAULT_SETTINGS = {
    removeSponsored: true,
    removeRecommendations: true,
    removeBrandStories: true,
    removeVideoAds: true,
    removeEditorialPicks: true,
    removeFrequentlyBought: false, // Some people like this
    removeClimateLabels: false,    // Keep by default, they're sometimes useful
    removeAmazonChoice: true,      // These badges are meaningless
    removeBestSeller: false,       // Actually useful sometimes
    highlightSuspiciousReviews: true,
    cleanProductPage: true,
    hideAlsoBought: true,
    hideViewingHistory: true,
    hideBrowsingHistory: true,
    enabled: true
  };

  let settings = { ...DEFAULT_SETTINGS };

  // Load settings from storage
  function loadSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.get(DEFAULT_SETTINGS, (stored) => {
        settings = { ...DEFAULT_SETTINGS, ...stored };
        if (settings.enabled) {
          runDeclutter();
        }
      });
    } else {
      runDeclutter();
    }
  }

  // Selectors for garbage content
  const GARBAGE_SELECTORS = {
    // Sponsored products - the worst offenders
    sponsored: [
      '[data-component-type="sp-sponsored-result"]',
      '.s-sponsored-label-info-icon',
      '.puis-sponsored-label-text',
      '.s-result-item[data-asin]:has(.puis-sponsored-label-text)',
      '.s-result-item:has(.s-sponsored-label-info-icon)',
      '[data-cel-widget*="SPONSORED"]',
      '[data-cel-widget*="sponsored"]',
      '.AdHolder',
      '[data-ad-feedback]',
      '.s-result-item:has([data-component-type="s-ads-feedback-slot"])',
      'div[class*="AdHolder"]',
      '.sbv-product:has(.puis-sponsored-label-text)',
      '[data-component-type="s-impression-logger"]:has(.puis-sponsored-label-text)'
    ],

    // "Inspired by your browsing/shopping history" - no thanks
    recommendations: [
      '[data-component-type="s-reorder-card"]',
      '#desktop-bargain-billboard-singleRec',
      '[data-cel-widget*="persolResults"]',
      '[data-cel-widget*="MAIN-FEATURED_ASINS"]',
      '[data-cel-widget*="PERSONALIZED"]',
      '[data-cel-widget*="personalized"]',
      '.rhf-frame',
      '#rhf',
      '[data-component-type="s-merchandised-results"]',
      '#sims-consolidated-widget_feature_div',
      '[data-cel-widget*="recommendations"]',
      '[data-cel-widget*="shopping-history"]'
    ],

    // Brand stories - literally just ads dressed up as content
    brandStories: [
      '[data-cel-widget*="brand-story"]',
      '#aplus_feature_div',
      '#aplus3p_feature_div',
      '.apm-brand-story-hero',
      '.apm-brand-story-carousel-container',
      '[data-cel-widget*="brand_story"]',
      '#brandByline_feature_div',
      '[data-cel-widget*="BRAND_BANNER"]'
    ],

    // Video ads in search results
    videoAds: [
      '[data-cel-widget*="VIDEO_SINGLE"]',
      '[data-component-type="s-video-single"]',
      '.sbv-video-container',
      '[data-cel-widget*="sb-video"]'
    ],

    // "Editorial picks" (paid placements pretending to be curated)
    editorialPicks: [
      '[data-cel-widget*="editorial"]',
      '#editorial_pick_card',
      '.s-border-bottom:has(.a-text-bold:contains("Editorial"))',
      '[data-cel-widget*="EDITORIAL"]'
    ],

    // "Frequently bought together" - sometimes useful but often pressure tactics
    frequentlyBought: [
      '#sims-fbt',
      '#frequently-bought-together_feature_div',
      '[data-cel-widget*="frequently-bought-together"]'
    ],

    // Climate pledge labels (optional - they can be useful)
    climateLabels: [
      '.climate-pledge-friendly-badge',
      '[data-cel-widget*="climate"]'
    ],

    // Amazon's Choice badge - algorithmically meaningless
    amazonChoice: [
      '.a-badge-supplementary-text:contains("Amazon")',
      '.ac-badge-wrapper',
      '[data-cel-widget*="amazons-choice"]',
      '.s-result-item .a-badge:has(.a-badge-text:contains("Amazon"))'
    ],

    // "Customers also bought/viewed" - the infinite rabbit hole
    alsoBought: [
      '#purchase-sims-feature',
      '[data-cel-widget*="similarities"]',
      '[data-cel-widget*="session-sims"]',
      '#sp_detail',
      '#sp_detail2',
      '#dp-similar-products',
      '[data-cel-widget*="similar"]',
      '[data-cel-widget*="SIMILARITY"]'
    ],

    // Viewing history reminders
    viewingHistory: [
      '#rhf-shoveler',
      '[data-cel-widget*="your-history"]',
      '[data-cel-widget*="viewed_feature"]',
      '#s-today-deals-rhf'
    ],

    // "Based on your browsing history"
    browsingHistory: [
      '#browsing-history-widget',
      '[data-cel-widget*="browsing-history"]',
      '[data-cel-widget*="BROWSING_HISTORY"]',
      '#desktop-ad-center-1'
    ],

    // General cruft
    generalCruft: [
      '#navSwmHoliday',           // Holiday banner spam
      '#nav-swmslot',             // Promotional banners
      '[data-cel-widget*="ADV"]', // Generic ad containers
      '.a-declarative[data-action="vse-copilot"]', // Copilot popups
      '#ape_Detail_top-selling-item_Desktop_placement', // Top selling upsells
      '#ape_Detail_desktop-loom-merchandised-recs_Desktop_placement',
      '[data-cel-widget*="HERO"]', // Hero banners
      '#superleaf', // Top banner ads
      '#skiplink ~ div[id^="merchandised"]', // Merchandised sections
      '.a-carousel-container:has([data-a-carousel-options*="sponsored"])'
    ]
  };

  // Additional text-based detection for things that slip through
  const GARBAGE_TEXT_PATTERNS = [
    /^Sponsored$/i,
    /^Ad$/i,
    /^Featured from our brands$/i,
    /^Highly rated$/i,
    /^Top rated from our brands$/i,
    /^Related products$/i,
    /^Customers who bought this item also bought$/i,
    /^Inspired by your browsing history$/i,
    /^Inspired by your shopping trends$/i,
    /^Based on your recent shopping trends$/i,
    /^Related to items you've viewed$/i,
    /^More to consider from our brands$/i
  ];

  // Remove an element with optional animation
  function removeElement(el, animate = false) {
    if (!el || el.dataset.declutterRemoved) return;

    el.dataset.declutterRemoved = 'true';

    if (animate) {
      el.style.transition = 'opacity 0.2s, max-height 0.3s';
      el.style.opacity = '0';
      el.style.maxHeight = el.offsetHeight + 'px';
      el.style.overflow = 'hidden';

      setTimeout(() => {
        el.style.maxHeight = '0';
        setTimeout(() => el.remove(), 300);
      }, 200);
    } else {
      el.remove();
    }
  }

  // Hide an element (for things we might want to show later)
  function hideElement(el) {
    if (!el || el.dataset.declutterHidden) return;
    el.dataset.declutterHidden = 'true';
    el.classList.add('declutter-hidden');
  }

  // Process garbage selectors
  function removeBySelectors(selectorArray, animate = false) {
    selectorArray.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(el => removeElement(el, animate));
      } catch (e) {
        // Some selectors might not be valid in all browsers
      }
    });
  }

  // Check for sponsored labels in product cards
  function findAndRemoveSponsoredProducts() {
    // Find all result items and check for sponsored indicators
    document.querySelectorAll('.s-result-item[data-asin]').forEach(item => {
      const text = item.textContent || '';

      // Check for "Sponsored" text anywhere in the item
      if (text.includes('Sponsored') ||
          text.includes('Ad feedback') ||
          item.querySelector('[data-component-type*="sp-"]')) {
        removeElement(item);
      }
    });

    // Also check for the sponsored label specifically
    document.querySelectorAll('.puis-sponsored-label-text, .s-sponsored-label-info-icon').forEach(label => {
      // Walk up to the product container
      let parent = label.closest('.s-result-item') ||
                   label.closest('[data-cel-widget]') ||
                   label.closest('.sbv-product');
      if (parent) {
        removeElement(parent);
      }
    });
  }

  // Remove sections with garbage text headers
  function removeGarbageSections() {
    // Find headers with garbage text
    const headers = document.querySelectorAll('h2, h3, .a-text-bold, .a-size-medium');

    headers.forEach(header => {
      const text = header.textContent?.trim() || '';

      for (const pattern of GARBAGE_TEXT_PATTERNS) {
        if (pattern.test(text)) {
          // Try to find the containing widget/section
          const section = header.closest('[data-cel-widget]') ||
                         header.closest('.a-section') ||
                         header.closest('.a-carousel-container') ||
                         header.closest('[class*="widget"]');

          if (section) {
            removeElement(section);
          }
          break;
        }
      }
    });
  }

  // Highlight products with suspicious review patterns
  function highlightSuspiciousReviews() {
    if (!settings.highlightSuspiciousReviews) return;

    document.querySelectorAll('.s-result-item[data-asin]').forEach(item => {
      if (item.dataset.declutterReviewChecked) return;
      item.dataset.declutterReviewChecked = 'true';

      // Get review count and rating
      const ratingEl = item.querySelector('.a-icon-star-small, .a-icon-star');
      const reviewCountEl = item.querySelector('.a-size-base.s-underline-text, [data-csa-c-content-id="reviewsMedley"] .a-size-base');

      if (!ratingEl || !reviewCountEl) return;

      const ratingText = ratingEl.querySelector('.a-icon-alt')?.textContent || '';
      const ratingMatch = ratingText.match(/([\d.]+)/);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;

      const countText = reviewCountEl.textContent || '';
      const countMatch = countText.replace(/,/g, '').match(/(\d+)/);
      const reviewCount = countMatch ? parseInt(countMatch[1]) : 0;

      // Suspicious patterns:
      // 1. Perfect 5.0 rating with many reviews (statistically unlikely)
      // 2. Very high rating with suspiciously round number of reviews
      // 3. New products with impossibly high review counts

      let suspicious = false;
      let reason = '';

      if (rating === 5.0 && reviewCount > 100) {
        suspicious = true;
        reason = 'Perfect 5.0 rating seems suspicious';
      } else if (rating >= 4.8 && reviewCount > 1000 && reviewCount % 100 === 0) {
        suspicious = true;
        reason = 'Suspiciously round review count';
      }

      if (suspicious) {
        const badge = document.createElement('div');
        badge.className = 'declutter-suspicious-badge';
        badge.textContent = '⚠️ ' + reason;
        badge.title = 'This product may have manipulated reviews. Exercise caution.';

        const container = item.querySelector('.a-section.a-spacing-small') || item;
        container.insertBefore(badge, container.firstChild);
      }
    });
  }

  // Clean up product detail pages
  function cleanProductPage() {
    if (!settings.cleanProductPage) return;
    if (!window.location.pathname.includes('/dp/')) return;

    // Remove "Compare with similar items" if it's just an ad matrix
    const compareSection = document.querySelector('#HLCXComparisonWidget_feature_div');
    if (compareSection) {
      const header = compareSection.querySelector('h2');
      if (!header || !header.textContent.includes('Compare')) {
        removeElement(compareSection);
      }
    }

    // Remove "Products related to this item" (often irrelevant)
    removeBySelectors([
      '#dp-similar-products',
      '[data-cel-widget*="RELATED_PRODUCTS"]'
    ]);
  }

  // Make prices more prominent and comparable
  function enhancePrices() {
    // Find price per unit and make it more visible
    document.querySelectorAll('.a-price-per-unit, .a-size-small:has(.a-price)').forEach(priceUnit => {
      if (priceUnit.dataset.declutterEnhanced) return;
      priceUnit.dataset.declutterEnhanced = 'true';
      priceUnit.classList.add('declutter-price-enhanced');
    });
  }

  // Main declutter function
  function runDeclutter() {
    if (!settings.enabled) return;

    // Core removals that most people will want
    if (settings.removeSponsored) {
      removeBySelectors(GARBAGE_SELECTORS.sponsored);
      findAndRemoveSponsoredProducts();
    }

    if (settings.removeRecommendations) {
      removeBySelectors(GARBAGE_SELECTORS.recommendations);
    }

    if (settings.removeBrandStories) {
      removeBySelectors(GARBAGE_SELECTORS.brandStories);
    }

    if (settings.removeVideoAds) {
      removeBySelectors(GARBAGE_SELECTORS.videoAds);
    }

    if (settings.removeEditorialPicks) {
      removeBySelectors(GARBAGE_SELECTORS.editorialPicks);
    }

    if (settings.removeFrequentlyBought) {
      removeBySelectors(GARBAGE_SELECTORS.frequentlyBought);
    }

    if (settings.removeClimateLabels) {
      removeBySelectors(GARBAGE_SELECTORS.climateLabels);
    }

    if (settings.removeAmazonChoice) {
      removeBySelectors(GARBAGE_SELECTORS.amazonChoice);
    }

    if (settings.hideAlsoBought) {
      removeBySelectors(GARBAGE_SELECTORS.alsoBought);
    }

    if (settings.hideViewingHistory) {
      removeBySelectors(GARBAGE_SELECTORS.viewingHistory);
    }

    if (settings.hideBrowsingHistory) {
      removeBySelectors(GARBAGE_SELECTORS.browsingHistory);
    }

    // Always remove general cruft
    removeBySelectors(GARBAGE_SELECTORS.generalCruft);

    // Text-based cleanup
    removeGarbageSections();

    // Enhancements
    highlightSuspiciousReviews();
    cleanProductPage();
    enhancePrices();
  }

  // Observe for dynamically loaded content
  function observeChanges() {
    const observer = new MutationObserver((mutations) => {
      let shouldRun = false;

      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              shouldRun = true;
              break;
            }
          }
        }
        if (shouldRun) break;
      }

      if (shouldRun) {
        // Debounce the declutter run
        clearTimeout(window.declutterTimeout);
        window.declutterTimeout = setTimeout(runDeclutter, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Listen for settings changes
  function listenForSettingsChanges() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync') {
          for (const key in changes) {
            settings[key] = changes[key].newValue;
          }
          if (settings.enabled) {
            runDeclutter();
          } else {
            // Reload page to restore removed content
            location.reload();
          }
        }
      });
    }
  }

  // Initialize
  function init() {
    loadSettings();
    observeChanges();
    listenForSettingsChanges();

    // Run again after a short delay for late-loading content
    setTimeout(runDeclutter, 1000);
    setTimeout(runDeclutter, 3000);
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
