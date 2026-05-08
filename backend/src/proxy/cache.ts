/*
 *  Esquire frameworks (tm)
 *  Esquire Backend (BFF tier)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.me
 *  mailto:mir0n.the.programmer@gmail.com
 *
 *  History:
 * 05/07/2026 mir0n  created: in-memory dictionary cache; TTL + max-entries; key by path + sorted query; per-process (no cross-pod sync)
 */

import { LRUCache } from 'lru-cache';
import type { BackendConfig } from '../config.js';

export interface CachedResponse {
  status: number;
  contentType: string;
  body: Buffer;
}

export interface DictCache {
  get: (key: string) => CachedResponse | undefined;
  set: (key: string, value: CachedResponse) => void;
  size: () => number;
  keyForRequest: (path: string, query: Record<string, string | string[] | undefined>) => string | null;
}

export function buildDictCache(config: BackendConfig): DictCache {
  const lru = new LRUCache<string, CachedResponse>({
    max: config.cache.maxEntries,
    ttl: config.cache.ttlMs,
  });
  const ret: DictCache = {
    get: (key) => lru.get(key),
    set: (key, value) => { lru.set(key, value); },
    size: () => lru.size,
    keyForRequest: (path, query) => keyForRequest(path, query),
  };
  return ret;
}

function keyForRequest(path: string, query: Record<string, string | string[] | undefined>): string | null {
  let ret: string | null = null;
  if (path === '/esq-kinds' || path === '/esq-kinds/') {
    ret = 'kinds:';
  } else if (path === '/esq-dict' || path === '/esq-dict/') {
    const kindRaw = query['kind'];
    const kind = Array.isArray(kindRaw) ? kindRaw[0] : kindRaw;
    if (kind !== undefined) {
      ret = `dict:${kind}`;
    }
  }
  return ret;
}
