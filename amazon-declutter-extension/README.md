# Amazon Declutter

A browser extension that makes Amazon actually browsable by removing sponsored garbage, algorithmic clutter, and predatory UI patterns.

## What It Removes

### Advertising
- **Sponsored Products** - Those "Sponsored" search results that are really just ads
- **Video Ads** - Autoplay video advertisements in search results
- **Brand Stories** - Those "From the brand" sections that are just fancy ads
- **Editorial Picks** - Paid placements disguised as curated recommendations

### Algorithmic Garbage
- **"Inspired by your browsing history"** - No, Amazon, I don't want to see that thing I looked at once 3 years ago
- **"Customers who viewed this also viewed"** - The endless rabbit hole of distraction
- **"Frequently bought together"** - Pressure tactics (optional, off by default)
- **Viewing/browsing history widgets** - Stop reminding me of my mistakes

### Meaningless Badges
- **Amazon's Choice** - An algorithmically-assigned badge that means nothing
- **Best Seller badges** - (Optional, actually useful sometimes)
- **Climate Pledge badges** - (Optional, can be informative)

## What It Adds

### Suspicious Review Detection
Flags products with potentially manipulated reviews:
- Perfect 5.0 ratings with hundreds of reviews (statistically suspicious)
- Suspiciously round review counts
- Other patterns indicating review manipulation

### Cleaner UI
- Better visual separation between products
- Enhanced price-per-unit visibility
- Cleaner product detail pages

## Installation

### Chrome / Edge / Brave
1. Open `generate-icons.html` in your browser and download the icon files
2. Go to `chrome://extensions/` (or equivalent)
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `amazon-declutter-extension` folder

### Firefox
1. Go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select the `manifest.json` file

Note: Firefox requires Manifest V2 for permanent installation. This extension uses Manifest V3, so it will work temporarily in Firefox developer mode.

## Configuration

Click the extension icon to access settings. You can toggle individual features on/off:

- **Extension Enabled** - Master on/off switch
- **Sponsored Products** - Remove sponsored search results
- **Video Ads** - Remove video advertisements
- **Brand Stories** - Remove promotional brand content
- **Editorial Picks** - Remove paid editorial placements
- **Personalized Recommendations** - Remove "for you" suggestions
- **Browsing/Viewing History** - Hide history-based widgets
- **"Also Bought" Sections** - Remove endless suggestions
- **Frequently Bought Together** - Remove bundle suggestions
- **Amazon's Choice** - Remove meaningless badge
- **Best Seller Badges** - Remove (off by default)
- **Climate Labels** - Remove (off by default)
- **Suspicious Review Detection** - Flag potentially fake reviews
- **Clean Product Pages** - Remove clutter from product pages

## Why This Exists

Amazon's search results have become an obstacle course of:
1. Sponsored products that aren't what you searched for
2. Algorithmic recommendations designed to distract you
3. Psychological tricks to make you buy more
4. Fake badges that create false urgency

This extension strips all that away so you can actually find what you're looking for.

## Privacy

This extension:
- Does NOT collect any data
- Does NOT send data anywhere
- Only runs on Amazon domains
- Stores settings locally in your browser

## License

MIT - Do whatever you want with it.
