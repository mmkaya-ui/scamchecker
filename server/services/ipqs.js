import fetch from 'node-fetch';
import { config, isServiceEnabled } from '../config.js';
import { getProxyAgent } from '../utils/proxy.js';
import { logger } from '../utils/logger.js';

export const checkIpqs = async (urlStr) => {
  if (!isServiceEnabled('ipqs')) {
    return { available: false, error: 'API key missing' };
  }

  // The API key is in the URL path.
  // We must ensure if we log or throw, we don't leak it.
  const apiUrl = `https://www.ipqualityscore.com/api/json/url/${config.keys.ipqs}/${encodeURIComponent(urlStr)}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
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

    if (!data.success) {
      return { available: false, error: data.message || 'API reported failure' };
    }

    // IPQS risk score is 0 (clean) to 100 (malicious). 
    // We convert it to a trust score: 100 - risk
    let score = 100 - (data.risk_score || 0);
    score = Math.max(0, Math.min(100, score)); // Clamp between 0 and 100

    return {
      available: true,
      score: score,
      details: {
        riskScore: data.risk_score,
        malware: data.malware,
        phishing: data.phishing,
        suspicious: data.suspicious
      }
    };
  } catch (error) {
    logger.warn(`IPQS check failed for ${urlStr}: ${error.message.replace(config.keys.ipqs, '***')}`);
    return { available: false, error: 'Request failed' };
  }
};
