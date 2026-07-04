import fetch from 'node-fetch';
import { config, isServiceEnabled } from '../config.js';
import { getProxyAgent } from '../utils/proxy.js';
import { logger } from '../utils/logger.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const checkVirusTotal = async (urlStr) => {
  if (!isServiceEnabled('virustotal')) {
    return { available: false, error: 'API key missing' };
  }

  const headers = {
    'x-apikey': config.keys.virusTotal,
    'Accept': 'application/json'
  };
  const agent = getProxyAgent();

  try {
    // 1. Submit URL for scanning
    const encodedParams = new URLSearchParams();
    encodedParams.set('url', urlStr);

    const submitRes = await fetch('https://www.virustotal.com/api/v3/urls', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: encodedParams,
      agent,
      signal: AbortSignal.timeout(10000)
    });

    if (!submitRes.ok) {
      if (submitRes.status === 429) {
        return { available: false, error: 'Rate limit exceeded' };
      }
      throw new Error(`Submit failed with status: ${submitRes.status}`);
    }

    const submitData = await submitRes.json();
    if (!submitData?.data?.id) throw new Error('Unexpected VT response, missing id');
    const analysisId = submitData.data.id;

    // 2. Poll for results (max 3 times, waiting 3s between)
    // For free API, sometimes it takes a while, but we can't hang the request forever.
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      await sleep(3000);
      
      const reportRes = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
        method: 'GET',
        headers,
        agent,
        signal: AbortSignal.timeout(10000)
      });

      if (!reportRes.ok) {
        throw new Error(`Report fetch failed: ${reportRes.status}`);
      }

      const reportData = await reportRes.json();
      const status = reportData.data.attributes.status;

      if (status === 'completed') {
        const stats = reportData.data.attributes.stats;
        
        // Calculate trust score based on engines
        const totalRelevant = stats.harmless + stats.malicious + stats.suspicious;
        let trustScore = 100;
        
        if (totalRelevant > 0) {
          trustScore = Math.round((stats.harmless / totalRelevant) * 100);
        }

        return {
          available: true,
          score: trustScore,
          details: {
            harmless: stats.harmless,
            malicious: stats.malicious,
            suspicious: stats.suspicious,
            undetected: stats.undetected
          }
        };
      }

      attempts++;
    }

    // If we get here, it didn't complete in time
    logger.warn(`VirusTotal timeout waiting for analysis of ${urlStr}`);
    return { available: false, error: 'Analysis timeout' };

  } catch (error) {
    logger.warn(`VirusTotal check failed for ${urlStr}: ${error.message}`);
    return { available: false, error: 'Request failed' };
  }
};
