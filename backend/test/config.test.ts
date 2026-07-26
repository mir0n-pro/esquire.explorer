/*
 *  Esquire frameworks (tm)
 *  Esquire Backend (BFF tier) -- unit tests
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *  mailto:mir0n.the.programmer@gmail.com
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from '../src/config.js';

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // Security secrets are REQUIRED (no code fallback) -- set them so loadConfig() succeeds. The fail-closed
    // behaviour when they are ABSENT gets its own test below.
    process.env.KC_CLIENT_SECRET = 'test-kc-client-secret';
    process.env.SESSION_SECRET = 'test-session-secret';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('falls back to documented defaults for the OPTIONAL vars (secrets are required separately)', () => {
    delete process.env.PORT;
    delete process.env.NODE_ENV;
    delete process.env.PUBLIC_BASE_URL;
    delete process.env.ALLOWED_ORIGINS;
    delete process.env.KC_ISSUER;
    delete process.env.KC_CLIENT_ID;
    delete process.env.GATEWAY_URL;
    delete process.env.SESSION_MAX_AGE_MS;
    delete process.env.REDIS_URL;
    delete process.env.ESQ_DICT_CACHE_TTL_MS;
    delete process.env.ESQ_DICT_CACHE_MAX;

    const cfg = loadConfig();

    expect(cfg.port).toBe(3000);
    expect(cfg.nodeEnv).toBe('development');
    expect(cfg.publicBaseUrl).toBe('http://localhost:3000');
    expect(cfg.allowedOrigins).toEqual(['http://localhost:3000']);
    expect(cfg.kc.issuer).toBe('http://localhost:8080/kc-auth/realms/esquire');
    expect(cfg.kc.clientId).toBe('esq-angular');
    expect(cfg.gateway.url).toBe('http://localhost:7070');
    expect(cfg.session.cookieName).toBe('esq.sid');
    expect(cfg.session.maxAgeMs).toBe(12 * 60 * 60 * 1000);
    expect(cfg.session.redisUrl).toBe('');
    expect(cfg.cache.ttlMs).toBe(60 * 60 * 1000);
    expect(cfg.cache.maxEntries).toBe(64);
  });

  it('parses ALLOWED_ORIGINS, dedupes, and always includes publicBaseUrl', () => {
    process.env.PUBLIC_BASE_URL = 'https://esquire.mir0n.pro';
    process.env.ALLOWED_ORIGINS = 'https://esquire.mir0n.pro,http://localhost:4200, http://localhost:3000';

    const cfg = loadConfig();

    expect(cfg.allowedOrigins).toContain('https://esquire.mir0n.pro');
    expect(cfg.allowedOrigins).toContain('http://localhost:4200');
    expect(cfg.allowedOrigins).toContain('http://localhost:3000');
    const seen = new Set(cfg.allowedOrigins);
    expect(seen.size).toBe(cfg.allowedOrigins.length);
    expect(cfg.allowedOrigins.indexOf('https://esquire.mir0n.pro')).toBe(0);
  });

  it('ignores blank entries in ALLOWED_ORIGINS', () => {
    process.env.PUBLIC_BASE_URL = 'http://localhost:3000';
    process.env.ALLOWED_ORIGINS = ',,http://localhost:4200,,,';

    const cfg = loadConfig();

    expect(cfg.allowedOrigins).toEqual(['http://localhost:3000', 'http://localhost:4200']);
  });

  it('parses numeric env vars via Number()', () => {
    process.env.PORT = '4000';
    process.env.SESSION_MAX_AGE_MS = '1800000';
    process.env.ESQ_DICT_CACHE_TTL_MS = '5000';
    process.env.ESQ_DICT_CACHE_MAX = '32';

    const cfg = loadConfig();

    expect(cfg.port).toBe(4000);
    expect(cfg.session.maxAgeMs).toBe(1800000);
    expect(cfg.cache.ttlMs).toBe(5000);
    expect(cfg.cache.maxEntries).toBe(32);
  });

  it('honors NODE_ENV=production for secure-cookie selection downstream', () => {
    process.env.NODE_ENV = 'production';
    const cfg = loadConfig();
    expect(cfg.nodeEnv).toBe('production');
  });

  it('reads REDIS_URL into session.redisUrl (shared store) and defaults to empty', () => {
    delete process.env.REDIS_URL;
    expect(loadConfig().session.redisUrl).toBe('');

    process.env.REDIS_URL = 'redis://esquire-infra-redis:6379';
    expect(loadConfig().session.redisUrl).toBe('redis://esquire-infra-redis:6379');
  });

  it('fails CLOSED: throws when KC_CLIENT_SECRET is missing (no committed fallback)', () => {
    delete process.env.KC_CLIENT_SECRET;
    expect(() => loadConfig()).toThrow(/KC_CLIENT_SECRET/);
  });

  it('fails CLOSED: throws when SESSION_SECRET is missing (no committed fallback)', () => {
    delete process.env.SESSION_SECRET;
    expect(() => loadConfig()).toThrow(/SESSION_SECRET/);
  });
});
