/*
 *  Esquire frameworks (tm)
 *  Esquire Backend (BFF tier) -- unit tests
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *  mailto:mir0n.the.programmer@gmail.com
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request } from 'express';
import type { BackendConfig } from '../../src/config.js';
import type { OidcTokens } from '../../src/auth/sessionStore.js';

// Hoisted mock: openidClient module. tokens.ts imports getOidcClient from
// ./openidClient.js, so we replace that whole module with a stub whose
// refresh() returns whatever the test arranged.
const refreshFn = vi.fn();
vi.mock('../../src/auth/openidClient.js', () => ({
  getOidcClient: async () => ({ refresh: refreshFn }),
}));

// Import under test must come AFTER vi.mock so the stub is in effect.
const { getValidAccessToken, NoSessionError, RefreshFailedError } = await import('../../src/auth/tokens.js');

function fakeConfig(): BackendConfig {
  return {
    port: 3000,
    nodeEnv: 'test',
    publicBaseUrl: 'http://localhost:3000',
    allowedOrigins: ['http://localhost:3000'],
    kc: { issuer: 'http://kc', clientId: 'x', clientSecret: 'x' },
    gateway: { url: 'http://gw' },
    session: { secret: 's', cookieName: 'esq.sid', maxAgeMs: 60_000 },
    cache: { ttlMs: 60_000, maxEntries: 16 },
  };
}

interface FakeSession {
  tokens?: OidcTokens;
  save(cb: (err: unknown) => void): void;
}

function fakeReq(tokens: OidcTokens | undefined): Request {
  const saved: Array<OidcTokens | undefined> = [];
  const session: FakeSession = {
    tokens,
    save(cb) {
      saved.push(session.tokens);
      cb(null);
    },
  };
  return { session, sessionID: 'sid-1' } as unknown as Request;
}

const NOW = 1_778_000_000;

describe('getValidAccessToken', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW * 1000);
    refreshFn.mockReset();
  });

  it('throws NoSessionError when the session has no tokens', async () => {
    const req = fakeReq(undefined);
    await expect(getValidAccessToken(req, fakeConfig())).rejects.toBeInstanceOf(NoSessionError);
  });

  it('returns the current access_token when it is far from expiring', async () => {
    const req = fakeReq({ access_token: 'CURRENT', expires_at: NOW + 600 });
    const result = await getValidAccessToken(req, fakeConfig());
    expect(result).toBe('CURRENT');
    expect(refreshFn).not.toHaveBeenCalled();
  });

  it('refreshes when the token is within the 30s leeway', async () => {
    refreshFn.mockResolvedValueOnce({
      access_token: 'REFRESHED',
      expires_at: NOW + 600,
      refresh_token: 'RT-NEW',
    });
    const req = fakeReq({
      access_token: 'STALE',
      refresh_token: 'RT-OLD',
      expires_at: NOW + 10,
    });

    const result = await getValidAccessToken(req, fakeConfig());

    expect(result).toBe('REFRESHED');
    expect(refreshFn).toHaveBeenCalledWith('RT-OLD');
    expect(req.session.tokens?.access_token).toBe('REFRESHED');
    expect(req.session.tokens?.refresh_token).toBe('RT-NEW');
  });

  it('refreshes when the token is already past expiry', async () => {
    refreshFn.mockResolvedValueOnce({
      access_token: 'REFRESHED',
      expires_at: NOW + 600,
    });
    const req = fakeReq({
      access_token: 'EXPIRED',
      refresh_token: 'RT',
      expires_at: NOW - 60,
    });
    const result = await getValidAccessToken(req, fakeConfig());
    expect(result).toBe('REFRESHED');
  });

  it('throws NoSessionError when expiring without a refresh_token', async () => {
    const req = fakeReq({
      access_token: 'STALE',
      expires_at: NOW + 5,
    });
    await expect(getValidAccessToken(req, fakeConfig())).rejects.toBeInstanceOf(NoSessionError);
    expect(refreshFn).not.toHaveBeenCalled();
  });

  it('wraps an openid-client refresh failure in RefreshFailedError', async () => {
    refreshFn.mockRejectedValueOnce(new Error('upstream KC 401'));
    const req = fakeReq({
      access_token: 'STALE',
      refresh_token: 'RT',
      expires_at: NOW + 5,
    });
    await expect(getValidAccessToken(req, fakeConfig())).rejects.toBeInstanceOf(RefreshFailedError);
  });

  it('throws RefreshFailedError when the refresh response is missing access_token', async () => {
    refreshFn.mockResolvedValueOnce({ expires_at: NOW + 600 });
    const req = fakeReq({
      access_token: 'STALE',
      refresh_token: 'RT',
      expires_at: NOW + 5,
    });
    await expect(getValidAccessToken(req, fakeConfig())).rejects.toBeInstanceOf(RefreshFailedError);
  });

  it('preserves the old refresh_token when the response omits one', async () => {
    refreshFn.mockResolvedValueOnce({
      access_token: 'REFRESHED',
      expires_at: NOW + 600,
    });
    const req = fakeReq({
      access_token: 'STALE',
      refresh_token: 'RT-KEEP',
      expires_at: NOW + 5,
    });
    await getValidAccessToken(req, fakeConfig());
    expect(req.session.tokens?.refresh_token).toBe('RT-KEEP');
  });
});
