import fetch from 'node-fetch';
import { logger } from '../utils/logger.js';

export const scrapeSearch = async (query) => {
  try {
    const searchUrl = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!res.ok) {
      throw new Error(`Yahoo returned ${res.status}`);
    }

    const html = await res.text();
    // Match Yahoo organic result redirect URLs
    const regex = /class="compTitle[^>]*>.*?href="(https:\/\/[^"]+)"/g;
    let match;
    const urls = [];
    
    while ((match = regex.exec(html)) !== null && urls.length < 5) {
      const redirectUrl = match[1];
      // Extract original URL from RU=.../RK=
      const ruMatch = redirectUrl.match(/RU=([^/]+)\//);
      if (ruMatch) {
        const decoded = decodeURIComponent(ruMatch[1]);
        if (!decoded.includes('bing.com/aclick')) { // Skip ads
          urls.push(decoded);
        }
      }
    }

    // Normalize extracted domains/URLs to https://domain format
    return urls.map(r => {
      let urlStr = r;
      if (!urlStr.startsWith('http')) {
        urlStr = `https://${urlStr}`;
      }
      return urlStr;
    });

  } catch (error) {
    logger.error(`Search scraper error: ${error.message}`);
    throw new Error('Failed to fetch search results');
  }
};
