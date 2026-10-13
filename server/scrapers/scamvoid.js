import fetch from 'node-fetch';
import { logger } from '../utils/logger.js';
import { extractDomain } from '../utils/sanitize.js';
import { getProxyAgent } from '../utils/proxy.js';

export const scrapeScamVoid = async (urlStr) => {
  const domain = extractDomain(urlStr);
  if (!domain) return { available: false, error: 'Invalid domain' };

  try {
    const res = await fetch(`https://www.scamvoid.net/check/${domain}/`, {
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
    const rows = html.match(/<tr>[\s\S]*?<\/tr>/gi) || [];
    let detected = 0;
    let total = 0;

    for (const r of rows) {
      const text = r.toLowerCase();
      if (text.includes('not detected')) {
        total++;
      } else if (text.includes('detected') && !text.includes('reverse dns')) {
        total++;
        detected++;
      }
    }

    if (total === 0) {
      return { available: false, error: 'No blocklist results found' };
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
    logger.warn(`ScamVoid scrape failed for ${domain}: ${error.message}`);
    return { available: false, error: 'Scraping failed' };
  }
};
