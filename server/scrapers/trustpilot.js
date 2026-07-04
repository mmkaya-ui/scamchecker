import fetch from 'node-fetch';
import { getProxyAgent } from '../utils/proxy.js';
import { logger } from '../utils/logger.js';
import { extractDomain } from '../utils/sanitize.js';

export const scrapeTrustpilot = async (urlStr) => {
  const domain = extractDomain(urlStr);
  if (!domain) return { available: false, error: 'Invalid domain' };

  try {
    const url = `https://www.trustpilot.com/review/${domain}`;
    const response = await fetch(url, {
      agent: getProxyAgent(),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 10000
    });

    if (response.status === 404) {
      // 404 means the domain is not registered on Trustpilot. We handle this gracefully.
      return { available: false, error: 'Not found on Trustpilot' };
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    // Extract __NEXT_DATA__ JSON
    const scriptRegex = /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s;
    const match = html.match(scriptRegex);
    
    if (!match || !match[1]) {
      throw new Error('__NEXT_DATA__ not found in page');
    }

    const data = JSON.parse(match[1]);
    
    // Navigate through the Next.js props
    // This structure might change, but typically it's under props.pageProps
    let businessUnit = null;
    
    // Look for business unit data in pageProps or Apollo state
    if (data?.props?.pageProps?.businessUnit) {
      businessUnit = data.props.pageProps.businessUnit;
    } else {
      // Deep search for trustScore if structure changed
      const searchForScore = (obj, depth = 0) => {
        if (!obj || typeof obj !== 'object' || depth > 20) return null;
        if (obj.trustScore !== undefined && obj.numberOfReviews !== undefined) return obj;
        for (const key of Object.keys(obj)) {
          const res = searchForScore(obj[key], depth + 1);
          if (res) return res;
        }
        return null;
      };
      businessUnit = searchForScore(data);
    }

    if (!businessUnit || typeof businessUnit.trustScore === 'undefined') {
      throw new Error('Could not extract trust score from data');
    }

    const scoreStars = businessUnit.trustScore; // 1 to 5
    // Trustpilot score is out of 5
    const score100 = (scoreStars / 5.0) * 100;

    return {
      available: true,
      score: score100,
      details: {
        trustScore: scoreStars,
        reviews: businessUnit.numberOfReviews,
        displayName: businessUnit.displayName || domain
      }
    };
  } catch (error) {
    logger.warn(`Trustpilot scrape failed for ${domain}: ${error.message}`);
    return { available: false, error: 'Scraping failed' };
  }
};
