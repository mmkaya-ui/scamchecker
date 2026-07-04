import fetch from 'node-fetch';
import { logger } from '../utils/logger.js';

export const scrapeSearch = async (query) => {
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    if (!res.ok) {
      throw new Error(`DuckDuckGo returned ${res.status}`);
    }

    const html = await res.text();
    const regex = /class="result__url[^>]*href="[^"]*uddg=([^&"]+)/g;
    
    let match;
    const urls = [];
    while ((match = regex.exec(html)) !== null && urls.length < 5) {
      urls.push(decodeURIComponent(match[1]));
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
    logger.error(`DuckDuckGo scraper error: ${error.message}`);
    throw new Error('Failed to fetch search results');
  }
};
