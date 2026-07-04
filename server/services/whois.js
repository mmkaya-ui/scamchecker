import whois from 'whois-json';
import { logger } from '../utils/logger.js';
import { extractDomain } from '../utils/sanitize.js';

export const checkWhois = async (urlStr) => {
  const domain = extractDomain(urlStr);
  if (!domain) {
    return { available: false, error: 'Invalid domain' };
  }

  try {
    // whois-json does not support proxy agent out of the box, it connects via TCP
    const results = await Promise.race([
      whois(domain),
      new Promise((_, reject) => setTimeout(() => reject(new Error('WHOIS timeout')), 10000))
    ]);
    
    // Different registrars return different keys. Common ones:
    const creationDateStr = results.creationDate || results.domainRegistrationDate || results.createdDate;
    
    if (!creationDateStr) {
      return { available: false, error: 'Creation date not found' };
    }

    const creationDate = new Date(creationDateStr);
    const now = new Date();
    
    if (isNaN(creationDate.getTime())) {
      return { available: false, error: 'Invalid creation date format' };
    }

    const ageInMs = now.getTime() - creationDate.getTime();
    const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
    const ageInYears = (ageInDays / 365.25).toFixed(1);
    
    // Score scaling: 0 days = 0 score, 3 years (1095 days) = 100 score
    const maxDays = 1095; 
    let score = Math.round((ageInDays / maxDays) * 100);
    
    // Clamp between 0 and 100
    score = Math.max(0, Math.min(100, score));

    return {
      available: true,
      score: score,
      details: {
        ageDays: ageInDays,
        ageHuman: ageInDays > 365 ? `${ageInYears} years` : `${ageInDays} days`,
        registrar: results.registrar || 'Unknown'
      }
    };
  } catch (error) {
    logger.warn(`WHOIS check failed for ${domain}: ${error.message}`);
    return { available: false, error: 'Request failed' };
  }
};
