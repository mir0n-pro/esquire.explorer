/*
 *  Esquire frameworks (tm)
 *  Esquire Backend (BFF tier) -- unit tests
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *  mailto:mir0n.the.programmer@gmail.com
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildDictCache, type CachedResponse } from '../../src/proxy/cache.js';
import type { BackendConfig } from '../../src/config.js';

function baseConfig(overrides: Partial<BackendConfig['cache']> = {}): BackendConfig {
  return {
    port: 3000,
    nodeEnv: 'test',
    publicBaseUrl: 'http://localhost:3000',
    allowedOrigins: ['http://localhost:3000'],
    kc: { issuer: 'x', clientId: 'x', clientSecret: 'x' },
    gateway: { url: 'http://localhost:7070' },
    session: { secret: 's', cookieName: 'esq.sid', maxAgeMs: 60_000 },
    cache: { ttlMs: 60_000, maxEntries: 16, ...overrides },
  };
}

function sample(): CachedResponse {
  return { status: 200, contentType: 'application/json', body: Buffer.from('{}') };
}

describe('DictCache.keyForRequest', () => {
  const cache = buildDictCache(baseConfig());

  it('returns "kinds:" for /esq-kinds', () => {
    expect(cache.keyForRequest('/esq-kinds', {})).toBe('kinds:');
    expect(cache.keyForRequest('/esq-kinds/', {})).toBe('kinds:');
  });

  it('returns "dict:<kind>" for /esq-dict with a kind query', () => {
    expect(cache.keyForRequest('/esq-dict', { kind: '32' })).toBe('dict:32');
    expect(cache.keyForRequest('/esq-dict/', { kind: '34' })).toBe('dict:34');
  });

  it('reads the first value of an array-shaped kind query', () => {
    expect(cache.keyForRequest('/esq-dict', { kind: ['50', '32'] })).toBe('dict:50');
  });

  it('returns null for /esq-dict when kind is missing', () => {
    expect(cache.keyForRequest('/esq-dict', {})).toBeNull();
  });

  it('returns null for paths that are not dictionary endpoints', () => {
    expect(cache.keyForRequest('/esq-cmd-tree', { kind: '32' })).toBeNull();
    expect(cache.keyForRequest('/random', {})).toBeNull();
    expect(cache.keyForRequest('/', {})).toBeNull();
  });
});

describe('DictCache.get/set', () => {
  it('HIT/MISS: returns undefined before set, the value after set', () => {
    const cache = buildDictCache(baseConfig());
    expect(cache.get('kinds:')).toBeUndefined();
    const stored = sample();
    cache.set('kinds:', stored);
    expect(cache.get('kinds:')).toBe(stored);
  });

  it('keeps distinct entries per kind (no cross-pollution)', () => {
    const cache = buildDictCache(baseConfig());
    const a: CachedResponse = { status: 200, contentType: 'application/json', body: Buffer.from('A') };
    const b: CachedResponse = { status: 200, contentType: 'application/json', body: Buffer.from('B') };
    cache.set('dict:32', a);
    cache.set('dict:34', b);
    expect(cache.get('dict:32')?.body.toString()).toBe('A');
    expect(cache.get('dict:34')?.body.toString()).toBe('B');
  });

  it('reports its size', () => {
    const cache = buildDictCache(baseConfig());
    expect(cache.size()).toBe(0);
    cache.set('kinds:', sample());
    cache.set('dict:32', sample());
    expect(cache.size()).toBe(2);
  });

  it('evicts entries past maxEntries (LRU)', () => {
    const cache = buildDictCache(baseConfig({ maxEntries: 2 }));
    cache.set('a', sample());
    cache.set('b', sample());
    cache.set('c', sample());
    expect(cache.size()).toBe(2);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBeDefined();
    expect(cache.get('c')).toBeDefined();
  });

  it('evicts entries past ttlMs', async () => {
    // Short TTL + real timer so we exercise the actual lru-cache time
    // source (perf_hooks, not Date.now). Vitest's useFakeTimers does not
    // fake performance.now by default in this configuration.
    const cache = buildDictCache(baseConfig({ ttlMs: 30 }));
    cache.set('kinds:', sample());
    expect(cache.get('kinds:')).toBeDefined();
    await new Promise((r) => setTimeout(r, 60));
    expect(cache.get('kinds:')).toBeUndefined();
  });
});

beforeEach(() => {
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
});
