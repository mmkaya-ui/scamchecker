import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  proxyUrl: process.env.PROXY_URL || null,
  keys: {
    ipqs: process.env.IPQS_API_KEY || null,
    googleSafeBrowsing: process.env.GOOGLE_SAFE_BROWSING_KEY || null,
    virusTotal: process.env.VIRUSTOTAL_API_KEY || null,
    scamAdviser: process.env.SCAMADVISER_RAPIDAPI_KEY || null,
  }
};

export const isServiceEnabled = (serviceName) => {
  switch (serviceName) {
    case 'ipqs': return !!config.keys.ipqs;
    case 'safebrowsing': return !!config.keys.googleSafeBrowsing;
    case 'virustotal': return !!config.keys.virusTotal;
    case 'scamadviser': return !!config.keys.scamAdviser;
    default: return true; // Non-API services are always enabled
  }
};
