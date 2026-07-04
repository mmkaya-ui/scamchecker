import { getPage } from './browser.js';
import { logger } from '../utils/logger.js';

export const scrapeSearch = async (query) => {
  let page;
  try {
    page = await getPage();
    // Use DuckDuckGo HTML version for fast, JS-free scraping
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
    
    const results = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('.result__url'));
      return anchors.map(el => {
        // textContent contains spaces and newlines sometimes, split by space and take first
        const text = el.textContent.trim().split(' ')[0];
        return text;
      }).slice(0, 5); // Take top 5
    });
    
    if (page) await page.close();
    
    // Normalize extracted domains/URLs to https://domain format
    return results.map(r => {
      let urlStr = r;
      if (!urlStr.startsWith('http')) {
        urlStr = `https://${urlStr}`;
      }
      return urlStr;
    });

  } catch (error) {
    logger.error(`DuckDuckGo scraper error: ${error.message}`);
    if (page) await page.close().catch(() => {});
    throw new Error('Failed to fetch search results');
  }
};
