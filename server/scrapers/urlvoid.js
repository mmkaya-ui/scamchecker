import fetch from 'node-fetch';
import { logger } from '../utils/logger.js';
import { extractDomain } from '../utils/sanitize.js';
import { getProxyAgent } from '../utils/proxy.js';

export const scrapeUrlVoid = async (urlStr) => {
  const domain = extractDomain(urlStr);
  if (!domain) return { available: false, error: 'Invalid domain' };

  try {
    const res = await fetch(`https://www.urlvoid.com/scan/${domain}/`, {
      agent: getProxyAgent(),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) {
      return { available: false, error: `HTTP ${res.status}` };
    }

    const html = await res.text();
    const uvMatch = html.match(/Detections Counts[\s\S]*?>\s*(\d+)\s*\/\s*(\d+)\s*</i);

    if (!uvMatch) {
      return { available: false, error: 'Detection ratio not found' };
    }

    const detected = parseInt(uvMatch[1], 10);
    const total = parseInt(uvMatch[2], 10);

    if (total === 0 || isNaN(total)) {
      return { available: false, error: 'Invalid count' };
    }

    const cleanCount = total - detected;
    const score = Math.round((cleanCount / total) * 100);

    return {
      available: true,
      score,
      details: {
        clean: cleanCount,
        flagged: detected,
        total
      }
    };
  } catch (error) {
    logger.warn(`URLVoid scrape failed for ${domain}: ${error.message}`);
    return { available: false, error: 'Scraping failed' };
  }
};
