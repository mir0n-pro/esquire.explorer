/*
 *  Esquire frameworks (tm)
 *  Esquire Backend (BFF tier)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.me
 *  mailto:mir0n.the.programmer@gmail.com
 *
 *  History:
 * 05/07/2026 mir0n  created: serves baked Angular SPA from /app/public; SPA fallback to index.html for client-side routes
 */

import express, { type RequestHandler } from 'express';
import { existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { log } from '../util/log.js';

/**
 * Serves the Angular SPA (frontend/dist) when present.
 *
 *   Step 1 (local dev) -- the dist directory is absent; this returns null and
 *                         the caller skips mounting. Frontend runs separately
 *                         on :4200 with a proxy.conf.json forwarding /api+/auth.
 *   Step 2+ (docker)    -- the dist is baked into the backend image at /app/public.
 *
 * The directory location is resolved from STATIC_DIR (env, absolute) or the
 * default ../public relative to the running module.
 */
export function buildSpaHandler(): RequestHandler | null {
  let ret: RequestHandler | null = null;
  const dir = resolveStaticDir();
  if (dir !== null) {
    log.info({ dir }, 'serving SPA from static directory');
    const staticHandler = express.static(dir, { index: false, fallthrough: true });
    const indexFile = join(dir, 'index.html');
    ret = (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        next();
        return;
      }
      staticHandler(req, res, (err) => {
        if (err !== undefined) {
          next(err);
        } else if (req.path.includes('.')) {
          // Asset path with file extension that wasn't matched -- 404 not SPA fallback.
          next();
        } else {
          res.sendFile(indexFile);
        }
      });
    };
  }
  return ret;
}

function resolveStaticDir(): string | null {
  let ret: string | null = null;
  const envDir = process.env['STATIC_DIR'];
  const candidates = envDir !== undefined ? [envDir] : ['public', '../public', 'dist/public'];
  for (const candidate of candidates) {
    const abs = resolve(candidate);
    if (existsSync(abs) && statSync(abs).isDirectory() && existsSync(join(abs, 'index.html'))) {
      ret = abs;
      break;
    }
  }
  return ret;
}
