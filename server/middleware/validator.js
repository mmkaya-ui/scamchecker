import { isSafeDomain } from '../utils/sanitize.js';

export const validateUrls = async (req, res, next) => {
  const { urls } = req.body;

  if (!urls || !Array.isArray(urls)) {
    return res.status(400).json({ error: 'Body must contain a "urls" array.' });
  }

  if (urls.length === 0 || urls.length > 10) {
    return res.status(400).json({ error: 'Provide between 1 and 10 URLs.' });
  }

  const validUrls = [];
  for (let urlStr of urls) {
    if (typeof urlStr !== 'string') {
      return res.status(400).json({ error: 'All URLs must be strings.' });
    }

    if (urlStr.length > 2048) {
      return res.status(400).json({ error: 'URL exceeds maximum length of 2048 characters.' });
    }

    let urlObj;
    try {
      const withProto = urlStr.startsWith('http') ? urlStr : `https://${urlStr}`;
      urlObj = new URL(withProto);
    } catch {
      return res.status(400).json({ error: `Invalid URL format: ${urlStr}` });
    }

    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return res.status(400).json({ error: `Only HTTP and HTTPS protocols are supported: ${urlStr}` });
    }

    const domain = urlObj.hostname;
    
    // SSRF Check - blocks private IPs
    const safe = await isSafeDomain(domain);
    if (!safe) {
      return res.status(400).json({ error: `Invalid or restricted domain/IP: ${domain}` });
    }

    validUrls.push({
      original: urlStr,
      normalized: urlObj.href,
      domain: domain
    });
  }

  // Attach validated array to request
  req.validUrls = validUrls;
  next();
};
