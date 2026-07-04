import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { config } from '../config.js';

let cachedAgent = null;

export const getProxyAgent = () => {
  if (!config.proxyUrl) return undefined;
  
  if (!cachedAgent) {
    if (config.proxyUrl.startsWith('socks')) {
      cachedAgent = new SocksProxyAgent(config.proxyUrl);
    } else {
      cachedAgent = new HttpsProxyAgent(config.proxyUrl);
    }
  }
  
  return cachedAgent;
};
