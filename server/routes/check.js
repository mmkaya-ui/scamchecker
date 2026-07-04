import express from 'express';
import { validateUrls } from '../middleware/validator.js';
import { aggregateScore } from '../utils/scorer.js';
import { logger } from '../utils/logger.js';

// Services
import { checkIpqs } from '../services/ipqs.js';
import { checkSafeBrowsing } from '../services/safebrowsing.js';
import { checkVirusTotal } from '../services/virustotal.js';
import { checkScamAdviser } from '../services/scamadviser.js';
import { checkWhois } from '../services/whois.js';
import { checkSsl } from '../services/ssl.js';

// Scrapers
import { scrapeScamVoid } from '../scrapers/scamvoid.js';
import { scrapeUrlVoid } from '../scrapers/urlvoid.js';
import { scrapeTrustpilot } from '../scrapers/trustpilot.js';

// Simple in-memory cache (in production, use Redis)
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 900 }); // 15 minutes

const router = express.Router();

export const runAllChecks = async (urlStr, domain) => {
  // Execute all checks in parallel, wrapped in allSettled so one failure doesn't kill the batch
  const promises = {
    ipqs: checkIpqs(urlStr),
    safebrowsing: checkSafeBrowsing(urlStr),
    virustotal: checkVirusTotal(urlStr),
    scamadviser: checkScamAdviser(urlStr),
    scamvoid: scrapeScamVoid(urlStr),
    urlvoid: scrapeUrlVoid(urlStr),
    trustpilot: scrapeTrustpilot(urlStr),
    whois: checkWhois(urlStr),
    ssl: checkSsl(urlStr)
  };

  const entries = Object.entries(promises);
  const resultsArr = await Promise.allSettled(entries.map(e => e[1]));
  
  const results = {};
  entries.forEach(([key], index) => {
    const outcome = resultsArr[index];
    if (outcome.status === 'fulfilled') {
      results[key] = outcome.value;
    } else {
      logger.error(`Service ${key} threw an unhandled error: ${outcome.reason}`);
      results[key] = { available: false, error: 'Internal error' };
    }
  });

  return results;
};

router.post('/', validateUrls, async (req, res, next) => {
  try {
    const { validUrls } = req;
    
    const responses = await Promise.all(validUrls.map(async (u) => {
      const cacheKey = `trustedlens_${u.normalized}`;
      let checkResults = cache.get(cacheKey);

      if (!checkResults) {
        checkResults = await runAllChecks(u.normalized, u.domain);
        cache.set(cacheKey, checkResults);
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

    // Generate ranking (if more than 1 URL)
    let ranking = [];
    if (responses.length > 1) {
      // Sort by trustScore descending, nulls at the end
      const sorted = [...responses].sort((a, b) => {
        if (a.trustScore === null) return 1;
        if (b.trustScore === null) return -1;
        return b.trustScore - a.trustScore;
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

    res.json({
      results: responses,
      ranking: ranking
    });
  } catch (error) {
    next(error);
  }
});

export default router;
