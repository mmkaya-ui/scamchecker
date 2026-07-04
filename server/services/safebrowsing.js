import fetch from 'node-fetch';
import { config, isServiceEnabled } from '../config.js';
import { getProxyAgent } from '../utils/proxy.js';
import { logger } from '../utils/logger.js';

export const checkSafeBrowsing = async (urlStr) => {
  if (!isServiceEnabled('safebrowsing')) {
    return { available: false, error: 'API key missing' };
  }

  try {
    const apiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${config.keys.googleSafeBrowsing}`;
    
    const payload = {
      client: {
        clientId: "trustedlens",
        clientVersion: "1.0.0"
      },
      threatInfo: {
        threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: [
          { url: urlStr }
        ]
      }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      agent: getProxyAgent(),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // If matches is undefined/empty, URL is safe
    const hasMatches = data.matches && data.matches.length > 0;
    
    // GSB is binary. 100 for clean, 0 for threat
    const trustScore = hasMatches ? 0 : 100;

    return {
      available: true,
      score: trustScore,
      details: {
        clean: !hasMatches,
        threats: hasMatches ? data.matches.map(m => m.threatType) : []
      }
    };
  } catch (error) {
    logger.warn(`SafeBrowsing check failed for ${urlStr}: ${error.message.replace(config.keys.googleSafeBrowsing, '***')}`);
    return { available: false, error: 'Request failed' };
  }
};
