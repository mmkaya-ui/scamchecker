import fetch from 'node-fetch';
import { config, isServiceEnabled } from '../config.js';
import { getProxyAgent } from '../utils/proxy.js';
import { logger } from '../utils/logger.js';
import { extractDomain } from '../utils/sanitize.js';

export const checkScamAdviser = async (urlStr) => {
  if (!isServiceEnabled('scamadviser')) {
    return { available: false, error: 'API key missing' };
  }

  const domain = extractDomain(urlStr);
  if (!domain) {
    return { available: false, error: 'Invalid domain' };
  }

  try {
    const apiUrl = `https://scamadviser-fraud-check.p.rapidapi.com/v1/trust-score?domain=${encodeURIComponent(domain)}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': config.keys.scamAdviser,
        'x-rapidapi-host': 'scamadviser-fraud-check.p.rapidapi.com'
      },
      agent: getProxyAgent(),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      if (response.status === 429) {
        return { available: false, error: 'Rate limit exceeded' };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Assuming the API returns a 'score' field between 0 and 100
    // Based on ScamAdviser docs
    const score = data.score ?? null;

    return {
      available: true,
      score: score,
      details: {
        status: data.status || 'unknown',
        risk: data.isHighRisk ? 'High' : 'Low'
      }
    };
  } catch (error) {
    logger.warn(`ScamAdviser check failed for ${urlStr}: ${error.message}`);
    return { available: false, error: 'Request failed' };
  }
};
