// __tests__/lib/ssrf-guard.test.ts

import { describe, it, expect } from 'vitest';
import { validateUrl, isPrivateIp } from '@/lib/ssrf-guard';

describe('ssrf-guard', () => {
  it('correctly identifies private and loopback IP addresses', () => {
    expect(isPrivateIp('127.0.0.1')).toBe(true);
    expect(isPrivateIp('10.0.0.1')).toBe(true);
    expect(isPrivateIp('172.20.10.5')).toBe(true);
    expect(isPrivateIp('192.168.1.100')).toBe(true);
    expect(isPrivateIp('169.254.169.254')).toBe(true);
    expect(isPrivateIp('::1')).toBe(true);

    // Public IPs
    expect(isPrivateIp('8.8.8.8')).toBe(false);
    expect(isPrivateIp('1.1.1.1')).toBe(false);
    expect(isPrivateIp('151.101.65.140')).toBe(false);
  });

  it('rejects forbidden protocols', async () => {
    const fileResult = await validateUrl('file:///etc/passwd');
    expect(fileResult.valid).toBe(false);

    const ftpResult = await validateUrl('ftp://example.com/file.pdf');
    expect(ftpResult.valid).toBe(false);
  });

  it('rejects direct localhost and loopback hostnames', async () => {
    const res1 = await validateUrl('http://localhost:3000/api');
    expect(res1.valid).toBe(false);

    const res2 = await validateUrl('http://127.0.0.1/test.pdf');
    expect(res2.valid).toBe(false);
  });

  it('rejects cloud metadata IP addresses', async () => {
    const res = await validateUrl('http://169.254.169.254/latest/meta-data');
    expect(res.valid).toBe(false);
  });

  it('permits valid public HTTPS research links', async () => {
    const res = await validateUrl('https://arxiv.org/pdf/1706.03762.pdf');
    expect(res.valid).toBe(true);
  });
});
