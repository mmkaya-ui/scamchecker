import { getPage } from './browser.js';
import { logger } from '../utils/logger.js';
import { extractDomain } from '../utils/sanitize.js';

export const scrapeUrlVoid = async (urlStr) => {
  const domain = extractDomain(urlStr);
  if (!domain) return { available: false, error: 'Invalid domain' };

  let page = null;
  try {
    page = await getPage();
    await page.goto(`https://www.urlvoid.com/scan/${domain}/`, { waitUntil: 'domcontentloaded' });
    
    // Wait for the results panel
    await page.waitForSelector('.panel-default', { timeout: 10000 });

    const results = await page.evaluate(() => {
      // Find the detection counts (e.g. "0/39")
      const textElements = Array.from(document.querySelectorAll('td'));
      let detectedCount = null;
      let totalCount = null;

      for (let td of textElements) {
        if (td.innerText.includes('Engine Detections')) {
          const countBadge = td.nextElementSibling;
          if (countBadge) {
            const match = countBadge.innerText.match(/(\d+)\s*\/\s*(\d+)/);
            if (match) {
              detectedCount = parseInt(match[1], 10);
              totalCount = parseInt(match[2], 10);
              break;
            }
          }
        }
      }

      return {
        detected: detectedCount,
        total: totalCount
      };
    });

    if (results.total === null || results.total === 0) {
      return { available: false, error: 'Detection ratio not found' };
    }

    const cleanCount = results.total - results.detected;
    const score = (cleanCount / results.total) * 100;

    return {
      available: true,
      score: score,
      details: {
        clean: cleanCount,
        flagged: results.detected,
        total: results.total
      }
    };
  } catch (error) {
    logger.warn(`URLVoid scrape failed for ${domain}: ${error.message}`);
    return { available: false, error: 'Scraping failed' };
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (e) {}
    }
  }
};
