export const extractDomain = (urlStr) => {
  try {
    const url = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
    return url.hostname;
  } catch {
    return null;
  }
};

export const parseUrlList = (text) => {
  if (!text) return [];
  
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // Basic validation to ensure it looks somewhat like a domain/url
      const domain = extractDomain(line);
      return {
        original: line,
        domain: domain,
        isValid: !!domain && domain.includes('.')
      };
    });
};
