import express from 'express';
import { scrapeSearch } from '../scrapers/duckduckgo.js';
import { runAllChecks } from './check.js';
import { isSafeDomain } from '../utils/sanitize.js';
import { aggregateScore } from '../utils/scorer.js';
import { logger } from '../utils/logger.js';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 900 }); // 15 minutes
const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required.' });
    }
    
    if (query.length > 200) {
      return res.status(400).json({ error: 'Search query is too long.' });
    }

    const cacheKey = `search_${query.trim().toLowerCase()}`;
    let cachedResponse = cache.get(cacheKey);
    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    // 1. Scrape DDG for top URLs
    const urls = await scrapeSearch(query);
    
    if (urls.length === 0) {
      return res.status(404).json({ error: 'No results found for that query.' });
    }

    // 2. Validate and convert URLs
    const validUrls = [];
    for (let urlStr of urls) {
      try {
        const urlObj = new URL(urlStr);
        if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') continue;
        
        const domain = urlObj.hostname;
        const safe = await isSafeDomain(domain);
        if (safe) {
          validUrls.push({
            original: urlStr,
            normalized: urlObj.href,
            domain: domain
          });
        }
      } catch (e) {
        // Skip invalid urls
      }
    }

    if (validUrls.length === 0) {
      return res.status(400).json({ error: 'No safe URLs found in search results.' });
    }

    // 3. Run Checks (reusing check.js logic)
    const responses = await Promise.all(validUrls.map(async (u) => {
      const urlCacheKey = `trustedlens_${u.normalized}`;
      let checkResults = cache.get(urlCacheKey);

      if (!checkResults) {
        checkResults = await runAllChecks(u.normalized, u.domain);
        cache.set(urlCacheKey, checkResults);
      }

      const aggregated = aggregateScore(checkResults);

      return {
        url: u.original,
        domain: u.domain,
        trustScore: aggregated.trustScore,
        trustLevel: aggregated.trustLevel,
        trustBadge: aggregated.trustBadge,
        trustColor: aggregated.trustColor,
        servicesAvailable: aggregated.availableCount,
        services: checkResults,
        manualCheckLinks: {
          scamwise: 'https://scamwise.com/',
          fakeshopfinder: 'https://www.verbraucherzentrale.de/fakeshopfinder-71560',
          asksilver: 'https://www.asksilver.com/',
          scamadviser: `https://www.scamadviser.com/check-website/${u.domain}`,
          trustpilot: `https://www.trustpilot.com/review/${u.domain}`,
          urlvoid: `https://www.urlvoid.com/scan/${u.domain}/`,
          scamvoid: `https://www.scamvoid.net/check/${u.domain}/`
        }
      };
    }));

    // 4. Rank Results
    let ranking = [];
    if (responses.length > 1) {
      const sorted = [...responses].sort((a, b) => {
        if (a.trustScore === null) return 1;
        if (b.trustScore === null) return -1;
        return b.trustScore - a.trustScore; // Descending
      });

      ranking = sorted.map((r, i) => ({
        url: r.url,
        domain: r.domain,
        trustScore: r.trustScore,
        trustLevel: r.trustLevel,
        trustColor: r.trustColor,
        rank: i + 1
      }));
    }

    const finalResponse = {
      results: responses,
      ranking: ranking
    };

    cache.set(cacheKey, finalResponse);
    res.json(finalResponse);

  } catch (error) {
    next(error);
  }
});

export default router;
