const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for frontend
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// European Amazon stores configuration
const STORES = [
    { id: 'de', name: 'Germany', domain: 'amazon.de', currency: 'EUR', symbol: '€' },
    { id: 'fr', name: 'France', domain: 'amazon.fr', currency: 'EUR', symbol: '€' },
    { id: 'it', name: 'Italy', domain: 'amazon.it', currency: 'EUR', symbol: '€' },
    { id: 'es', name: 'Spain', domain: 'amazon.es', currency: 'EUR', symbol: '€' },
    { id: 'nl', name: 'Netherlands', domain: 'amazon.nl', currency: 'EUR', symbol: '€' },
    { id: 'be', name: 'Belgium', domain: 'amazon.com.be', currency: 'EUR', symbol: '€' },
    { id: 'uk', name: 'United Kingdom', domain: 'amazon.co.uk', currency: 'GBP', symbol: '£' },
    { id: 'se', name: 'Sweden', domain: 'amazon.se', currency: 'SEK', symbol: 'kr' },
    { id: 'pl', name: 'Poland', domain: 'amazon.pl', currency: 'PLN', symbol: 'zł' },
];

// Rotating user agents to avoid detection
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

// Get random user agent
function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Add delay between requests to be respectful
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Parse price from various Amazon price formats
function parsePrice(priceText) {
    if (!priceText) return null;

    // Remove currency symbols and normalize
    let cleaned = priceText
        .replace(/[€£$]/g, '')
        .replace(/\s/g, '')
        .replace(/kr/gi, '')
        .replace(/zł/gi, '')
        .replace(/PLN/gi, '')
        .replace(/SEK/gi, '')
        .replace(/EUR/gi, '')
        .replace(/GBP/gi, '')
        .trim();

    // Handle European format (1.234,56) vs US format (1,234.56)
    // Check if comma appears after period (European format)
    const lastComma = cleaned.lastIndexOf(',');
    const lastPeriod = cleaned.lastIndexOf('.');

    if (lastComma > lastPeriod) {
        // European format: 1.234,56 -> 1234.56
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (lastPeriod > lastComma) {
        // US format or single decimal: 1,234.56 -> 1234.56
        cleaned = cleaned.replace(/,/g, '');
    } else if (lastComma !== -1 && lastPeriod === -1) {
        // Only comma present, likely decimal separator
        cleaned = cleaned.replace(',', '.');
    }

    const price = parseFloat(cleaned);
    return isNaN(price) ? null : price;
}

// Fetch price from a single Amazon store
async function fetchPriceFromStore(asin, store) {
    const url = `https://www.${store.domain}/dp/${asin}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': getRandomUserAgent(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9,de;q=0.8,fr;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Cache-Control': 'max-age=0',
                'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
            },
            timeout: 15000,
            maxRedirects: 5,
        });

        const $ = cheerio.load(response.data);

        // Try multiple price selectors (Amazon uses different ones)
        const priceSelectors = [
            // Main price selectors
            'span.a-price span.a-offscreen',
            '#priceblock_ourprice',
            '#priceblock_dealprice',
            '#priceblock_saleprice',
            'span.a-price-whole',
            '#corePrice_feature_div span.a-offscreen',
            '#corePriceDisplay_desktop_feature_div span.a-offscreen',
            '.a-price .a-offscreen',
            '#price_inside_buybox',
            '#newBuyBoxPrice',
            'span[data-a-color="price"] span.a-offscreen',
            '#apex_desktop span.a-offscreen',
            '.apexPriceToPay span.a-offscreen',
        ];

        let priceText = null;
        let priceValue = null;

        for (const selector of priceSelectors) {
            const element = $(selector).first();
            if (element.length > 0) {
                priceText = element.text().trim();
                priceValue = parsePrice(priceText);
                if (priceValue !== null && priceValue > 0) {
                    break;
                }
            }
        }

        // Try to get product title for verification
        const title = $('#productTitle').text().trim() ||
                      $('h1#title span').text().trim() ||
                      $('h1.a-size-large').text().trim();

        // Check if product is available
        const availabilityText = $('#availability span').text().trim().toLowerCase() ||
                                 $('#outOfStock span').text().trim().toLowerCase();

        const isUnavailable = availabilityText.includes('unavailable') ||
                              availabilityText.includes('not available') ||
                              availabilityText.includes('currently unavailable') ||
                              $('#outOfStock').length > 0;

        if (isUnavailable && !priceValue) {
            return {
                store: store.id,
                storeName: store.name,
                domain: store.domain,
                currency: store.currency,
                symbol: store.symbol,
                price: null,
                priceText: null,
                title: title || null,
                available: false,
                error: null,
                url: url,
            };
        }

        return {
            store: store.id,
            storeName: store.name,
            domain: store.domain,
            currency: store.currency,
            symbol: store.symbol,
            price: priceValue,
            priceText: priceText,
            title: title || null,
            available: priceValue !== null,
            error: null,
            url: url,
        };

    } catch (error) {
        let errorMessage = 'Failed to fetch';

        if (error.response) {
            if (error.response.status === 404) {
                errorMessage = 'Product not found';
            } else if (error.response.status === 503) {
                errorMessage = 'Service unavailable (rate limited)';
            } else {
                errorMessage = `HTTP ${error.response.status}`;
            }
        } else if (error.code === 'ECONNABORTED') {
            errorMessage = 'Request timeout';
        } else if (error.code === 'ENOTFOUND') {
            errorMessage = 'Store not reachable';
        }

        return {
            store: store.id,
            storeName: store.name,
            domain: store.domain,
            currency: store.currency,
            symbol: store.symbol,
            price: null,
            priceText: null,
            title: null,
            available: false,
            error: errorMessage,
            url: `https://www.${store.domain}/dp/${asin}`,
        };
    }
}

// API endpoint to fetch prices from all stores
app.get('/api/prices/:asin', async (req, res) => {
    const { asin } = req.params;

    // Validate ASIN
    if (!asin || !/^[A-Z0-9]{10}$/i.test(asin)) {
        return res.status(400).json({
            error: 'Invalid ASIN format. Must be 10 alphanumeric characters.',
        });
    }

    console.log(`\n🔍 Fetching prices for ASIN: ${asin.toUpperCase()}`);
    console.log('━'.repeat(50));

    const results = [];
    const startTime = Date.now();

    // Fetch prices sequentially with delays to avoid rate limiting
    for (let i = 0; i < STORES.length; i++) {
        const store = STORES[i];
        console.log(`📦 Checking ${store.name} (${store.domain})...`);

        const result = await fetchPriceFromStore(asin.toUpperCase(), store);
        results.push(result);

        if (result.price) {
            console.log(`   ✅ ${result.symbol}${result.price.toFixed(2)} ${result.currency}`);
        } else if (result.error) {
            console.log(`   ❌ ${result.error}`);
        } else {
            console.log(`   ⚠️  Price not found`);
        }

        // Add delay between requests (except for last one)
        if (i < STORES.length - 1) {
            await delay(500 + Math.random() * 500); // 500-1000ms delay
        }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('━'.repeat(50));
    console.log(`✨ Completed in ${duration}s\n`);

    // Sort results by price (available items first, then by price)
    results.sort((a, b) => {
        if (a.price === null && b.price === null) return 0;
        if (a.price === null) return 1;
        if (b.price === null) return -1;
        return a.price - b.price;
    });

    res.json({
        asin: asin.toUpperCase(),
        timestamp: new Date().toISOString(),
        duration: `${duration}s`,
        results: results,
    });
});

// API endpoint to fetch price from a single store
app.get('/api/price/:asin/:storeId', async (req, res) => {
    const { asin, storeId } = req.params;

    // Validate ASIN
    if (!asin || !/^[A-Z0-9]{10}$/i.test(asin)) {
        return res.status(400).json({
            error: 'Invalid ASIN format. Must be 10 alphanumeric characters.',
        });
    }

    const store = STORES.find(s => s.id === storeId.toLowerCase());
    if (!store) {
        return res.status(400).json({
            error: `Invalid store ID. Valid options: ${STORES.map(s => s.id).join(', ')}`,
        });
    }

    console.log(`🔍 Fetching price for ASIN ${asin.toUpperCase()} from ${store.name}...`);

    const result = await fetchPriceFromStore(asin.toUpperCase(), store);

    if (result.price) {
        console.log(`✅ ${result.symbol}${result.price.toFixed(2)} ${result.currency}`);
    } else {
        console.log(`❌ ${result.error || 'Price not found'}`);
    }

    res.json(result);
});

// Get list of supported stores
app.get('/api/stores', (req, res) => {
    res.json(STORES);
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'amazon-price-comparison.html'));
});

// Start server
app.listen(PORT, () => {
    console.log('\n' + '═'.repeat(50));
    console.log('🛒 Amazon EU Price Comparison Server');
    console.log('═'.repeat(50));
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 API endpoint: http://localhost:${PORT}/api/prices/{ASIN}`);
    console.log(`🌐 Frontend: http://localhost:${PORT}/\n`);
    console.log('Supported stores:');
    STORES.forEach(store => {
        console.log(`   ${store.id.toUpperCase().padEnd(3)} - ${store.name} (${store.domain})`);
    });
    console.log('\n' + '═'.repeat(50) + '\n');
});
