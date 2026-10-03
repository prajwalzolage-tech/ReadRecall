// src/lib/ssrf-guard.ts
// SSRF protection guard blocking private IPs, cloud metadata endpoints, and invalid protocols

import dns from 'dns';
import { promisify } from 'util';

const lookupAsync = promisify(dns.lookup);

/**
 * Check if an IPv4 or IPv6 address belongs to a private, loopback, or reserved range.
 */
export function isPrivateIp(ip: string): boolean {
  // IPv6 loopback and private
  if (ip === '::1' || ip === '::' || ip.startsWith('fe80:') || ip.startsWith('fc00:')) {
    return true;
  }

  // IPv4 mapped IPv6 (::ffff:127.0.0.1)
  const cleanIp = ip.replace(/^::ffff:/i, '');

  const parts = cleanIp.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }

  const [a, b] = parts;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 10.0.0.0/8 (Private network)
  if (a === 10) return true;

  // 172.16.0.0/12 (Private network: 172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 (Private network)
  if (a === 192 && b === 168) return true;

  // 169.254.0.0/16 (Link-local & AWS/GCP/Azure Metadata 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 0.0.0.0/8
  if (a === 0) return true;

  return false;
}

/**
 * Validate that a URL is safe to fetch (HTTP/HTTPS, non-private host, non-metadata endpoint).
 */
export async function validateUrl(
  urlString: string
): Promise<{ valid: boolean; reason?: string; resolvedIp?: string }> {
  try {
    const parsed = new URL(urlString);

    // Protocol check
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        valid: false,
        reason: `Unsupported protocol '${parsed.protocol}'. Only HTTP and HTTPS are permitted.`,
      };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Direct localhost checks
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.endsWith('.localhost')
    ) {
      return { valid: false, reason: 'Requests to localhost are blocked.' };
    }

    // Direct private IP literal check
    if (isPrivateIp(hostname)) {
      return { valid: false, reason: 'Requests to private IP addresses are blocked.' };
    }

    // DNS resolution check against DNS rebinding
    try {
      const { address } = await lookupAsync(hostname);
      if (isPrivateIp(address)) {
        return {
          valid: false,
          reason: `Resolved IP (${address}) belongs to a private network.`,
          resolvedIp: address,
        };
      }
      return { valid: true, resolvedIp: address };
    } catch {
      return { valid: false, reason: 'Failed to resolve hostname DNS.' };
    }
  } catch {
    return { valid: false, reason: 'Malformed URL.' };
  }
}
