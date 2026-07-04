import tls from 'tls';
import { extractDomain } from '../utils/sanitize.js';
import { logger } from '../utils/logger.js';

export const checkSsl = (urlStr) => {
  return new Promise((resolve) => {
    const domain = extractDomain(urlStr);
    if (!domain) {
      return resolve({ available: false, error: 'Invalid domain' });
    }

    const options = {
      host: domain,
      port: 443,
      servername: domain,
      rejectUnauthorized: false, // We want to inspect the cert even if invalid
    };

    const socket = tls.connect(options, () => {
      const cert = socket.getPeerCertificate(true);
      
      if (!cert || Object.keys(cert).length === 0) {
        socket.end();
        return resolve({ available: true, score: 0, details: { valid: false, error: 'No certificate provided' } });
      }

      const isAuthorized = socket.authorized;
      const issuer = cert.issuer ? cert.issuer.O : 'Unknown';
      const isSelfSigned = cert.issuerCertificate === cert || (cert.issuer && cert.subject && cert.issuer.CN === cert.subject.CN);
      
      const validFrom = new Date(cert.valid_from);
      const validTo = new Date(cert.valid_to);
      const now = new Date();
      const isExpired = now > validTo;
      
      socket.end();

      let score = 0;
      if (isAuthorized && !isExpired) {
        score = 100;
      } else if (isExpired) {
        score = 0; // Expired certs are inherently untrustworthy
      } else if (isSelfSigned) {
        score = 30; // Self-signed is better than nothing, but not much
      } else if (!isAuthorized) {
        score = 0; // Invalid CA or mismatch
      }

      // Let's Encrypt is valid, but slightly lower trust than extended validation? 
      // Actually modern web uses LE everywhere, so keep it 100.

      resolve({
        available: true,
        score,
        details: {
          valid: isAuthorized && !isExpired,
          issuer,
          selfSigned: isSelfSigned,
          expired: isExpired,
          validTo: cert.valid_to
        }
      });
    });

    socket.on('error', (error) => {
      logger.warn(`SSL check failed for ${domain}: ${error.message}`);
      // Usually means no HTTPS on port 443
      resolve({ available: true, score: 0, details: { valid: false, error: 'No HTTPS support' } });
    });

    // 5s timeout
    socket.setTimeout(5000, () => {
      socket.destroy();
      logger.warn(`SSL check timed out for ${domain}`);
      resolve({ available: true, score: 0, details: { valid: false, error: 'Connection timeout' } });
    });
  });
};
