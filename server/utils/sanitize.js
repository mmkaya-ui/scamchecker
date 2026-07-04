import dns from 'dns';
import net from 'net';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);

export const extractDomain = (urlStr) => {
  try {
    const url = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
    return url.hostname;
  } catch {
    return null;
  }
};

export const isPrivateIP = (ip) => {
  if (!net.isIP(ip)) return false;

  // IPv4 checks
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    // 10.0.0.0/8
    if (parts[0] === 10) return true;
    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 127.0.0.0/8 (Loopback)
    if (parts[0] === 127) return true;
    // 169.254.0.0/16 (Link-local)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 0.0.0.0/8
    if (parts[0] === 0) return true;
  }

  // IPv6 checks
  if (net.isIPv6(ip)) {
    const ipLower = ip.toLowerCase();
    // Loopback
    if (ipLower === '::1') return true;
    // Unique Local Address (fc00::/7)
    if (ipLower.startsWith('fc') || ipLower.startsWith('fd')) return true;
    // Link-local (fe80::/10)
    if (ipLower.startsWith('fe8') || ipLower.startsWith('fe9') || ipLower.startsWith('fea') || ipLower.startsWith('feb')) return true;
    // IPv4-mapped loopback (::ffff:127.0.0.1)
    if (ipLower.includes('127.0.0.1')) return true;
  }

  return false;
};

export const isSafeDomain = async (domain) => {
  try {
    // Check if domain itself is an IP or encodes an IP (hex/octal) that resolves to private
    if (net.isIP(domain) || /^\d+$/.test(domain) || /^0x[0-9a-fA-F]+$/.test(domain)) {
      // It's safer to just lookup any potential IP representation
      const { address } = await lookup(domain);
      return !isPrivateIP(address);
    }
    
    // Resolve DNS (lookup uses OS resolver, which handles /etc/hosts and IPv6 natively)
    const { address } = await lookup(domain);
    if (!address) return false;
    
    // Check if the resolved IP is private
    return !isPrivateIP(address);
  } catch (error) {
    // If DNS resolution fails, we can't be sure it's safe to fetch
    return false;
  }
};

