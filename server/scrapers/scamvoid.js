import { getPage } from './browser.js';
import { logger } from '../utils/logger.js';
import { extractDomain } from '../utils/sanitize.js';

export const scrapeScamVoid = async (urlStr) => {
  const domain = extractDomain(urlStr);
  if (!domain) return { available: false, error: 'Invalid domain' };

  let page = null;
  try {
    page = await getPage();
    await page.goto(`https://www.scamvoid.net/check/${domain}/`, { waitUntil: 'domcontentloaded' });
    
    // Wait for the main results container
    await page.waitForSelector('.panel-body', { timeout: 10000 });

    const results = await page.evaluate(() => {
      const blocklistTable = document.querySelector('.table.table-striped');
      if (!blocklistTable) return null;

      const rows = Array.from(blocklistTable.querySelectorAll('tbody tr'));
      let detectedCount = 0;
      let totalCount = 0;

      rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        if (text.includes('not detected')) {
          totalCount++;
        } else if (text.includes('detected')) {
          totalCount++;
          detectedCount++;
        }
      });

      return {
        detected: detectedCount,
        total: totalCount
      };
    });

    if (!results || results.total === 0) {
      return { available: false, error: 'No blocklist results found' };
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
    logger.warn(`ScamVoid scrape failed for ${domain}: ${error.message}`);
    return { available: false, error: 'Scraping failed' };
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (e) {
        // Ignore close errors
      }
    }
  }
};
