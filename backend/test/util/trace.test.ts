/*
 *  Esquire frameworks (tm)
 *  Esquire Backend (BFF tier) -- unit tests
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *  mailto:mir0n.the.programmer@gmail.com
 */

import { describe, it, expect, vi } from 'vitest';
import type { Request, Response } from 'express';
import { traceMiddleware, isTracedPath } from '../../src/util/trace.js';

interface MockRes {
  headers: Record<string, string>;
  listeners: Record<string, () => void>;
  statusCode: number;
  setHeader(name: string, value: string): void;
  on(event: string, listener: () => void): void;
}

function mockReq(
  headers: Record<string, string | string[]> = {},
  path = '/api/esq',
  method = 'GET',
): Request {
  const req = { headers, path, method } as unknown as Request;
  return req;
}

function mockRes(): MockRes & Pick<Response, 'setHeader'> {
  const headers: Record<string, string> = {};
  const listeners: Record<string, () => void> = {};
  const ret = {
    headers,
    listeners,
    statusCode: 200,
    setHeader(name: string, value: string) {
      headers[name] = value;
    },
    on(event: string, listener: () => void) {
      listeners[event] = listener;
    },
  };
  return ret as unknown as MockRes & Pick<Response, 'setHeader'>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const W3C_TRACE_ID_RE = /^[0-9a-f]{32}$/;
const TRACEPARENT_RE = /^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/;

describe('traceMiddleware', () => {
  it('generates a UUID Request ID when none is supplied', () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    traceMiddleware(req, res as unknown as Response, next);

    expect(req.esqRequestId).toMatch(UUID_RE);
    expect(res.headers['X-Request-ID']).toBe(req.esqRequestId);
    expect(next).toHaveBeenCalledOnce();
  });

  it('preserves an incoming X-Request-ID without rewriting it', () => {
    const req = mockReq({ 'x-request-id': 'client-supplied-id-001' });
    const res = mockRes();

    traceMiddleware(req, res as unknown as Response, vi.fn());

    expect(req.esqRequestId).toBe('client-supplied-id-001');
    expect(res.headers['X-Request-ID']).toBe('client-supplied-id-001');
  });

  it('keeps an incoming W3C-shaped correlation id verbatim', () => {
    const w3c = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
    const req = mockReq({ 'x-correlation-id': w3c });
    const res = mockRes();

    traceMiddleware(req, res as unknown as Response, vi.fn());

    expect(req.esqCorrelationId).toBe(w3c);
    expect(res.headers['X-Correlation-ID']).toBe(w3c);
  });

  it('converts a non-W3C correlation id deterministically', () => {
    const first = mockReq({ 'x-correlation-id': 'corr-abc' });
    const second = mockReq({ 'x-correlation-id': 'corr-abc' });
    traceMiddleware(first, mockRes() as unknown as Response, vi.fn());
    traceMiddleware(second, mockRes() as unknown as Response, vi.fn());

    expect(first.esqCorrelationId).toMatch(W3C_TRACE_ID_RE);
    expect(first.esqCorrelationId).not.toBe('corr-abc');
    expect(second.esqCorrelationId).toBe(first.esqCorrelationId);
  });

  it('settles a fresh correlation id when the client sets none', () => {
    const req = mockReq();
    const res = mockRes();

    traceMiddleware(req, res as unknown as Response, vi.fn());

    expect(req.esqCorrelationId).toMatch(W3C_TRACE_ID_RE);
    expect(res.headers['X-Correlation-ID']).toBe(req.esqCorrelationId);
  });

  it('never seeds the correlation id from the request id', () => {
    const req = mockReq({ 'x-request-id': 'client-supplied-id-001' });

    traceMiddleware(req, mockRes() as unknown as Response, vi.fn());

    const seededFromRequestId = mockReq({ 'x-correlation-id': 'client-supplied-id-001' });
    traceMiddleware(seededFromRequestId, mockRes() as unknown as Response, vi.fn());

    expect(req.esqCorrelationId).not.toBe(seededFromRequestId.esqCorrelationId);
  });

  it('exposes a traceparent carrying the settled correlation id as its trace id', () => {
    const req = mockReq();
    traceMiddleware(req, mockRes() as unknown as Response, vi.fn());

    expect(req.esqTraceparent).toMatch(TRACEPARENT_RE);
    expect(req.esqTraceparent.split('-')[1]).toBe(req.esqCorrelationId);
  });

  it('reads the first value when a header arrives as an array', () => {
    const req = mockReq({ 'x-request-id': ['first', 'second'] });
    const res = mockRes();

    traceMiddleware(req, res as unknown as Response, vi.fn());

    expect(req.esqRequestId).toBe('first');
    expect(res.headers['X-Request-ID']).toBe('first');
  });

  it('treats an empty-string header as absent (generates fresh UUID)', () => {
    const req = mockReq({ 'x-request-id': '' });
    const res = mockRes();

    traceMiddleware(req, res as unknown as Response, vi.fn());

    expect(req.esqRequestId).toMatch(UUID_RE);
  });

  it('registers a response finish hook on a traced path', () => {
    const req = mockReq({}, '/api/esq');
    const res = mockRes();

    traceMiddleware(req, res as unknown as Response, vi.fn());

    expect(res.listeners['finish']).toBeDefined();
  });

  it('opens no span on an untraced path but still settles the ids', () => {
    const req = mockReq({}, '/main-4RTFGH.js');
    const res = mockRes();

    traceMiddleware(req, res as unknown as Response, vi.fn());

    expect(res.listeners['finish']).toBeUndefined();
    expect(req.esqRequestId).toMatch(UUID_RE);
    expect(req.esqCorrelationId).toMatch(W3C_TRACE_ID_RE);
    expect(req.esqTraceparent).toMatch(TRACEPARENT_RE);
    expect(res.headers['X-Correlation-ID']).toBe(req.esqCorrelationId);
  });
});

describe('isTracedPath', () => {
  it('traces the Esquire API proxy and the KeyCloak sign-in routes', () => {
    expect(isTracedPath('/api')).toBe(true);
    expect(isTracedPath('/api/esq')).toBe(true);
    expect(isTracedPath('/api/esq-cmd-new')).toBe(true);
    expect(isTracedPath('/auth')).toBe(true);
    expect(isTracedPath('/auth/login')).toBe(true);
    expect(isTracedPath('/auth/callback')).toBe(true);
    expect(isTracedPath('/auth/me')).toBe(true);
  });

  it('does not trace the SPA shell, its static assets or the health probes', () => {
    expect(isTracedPath('/')).toBe(false);
    expect(isTracedPath('/index.html')).toBe(false);
    expect(isTracedPath('/main-4RTFGH.js')).toBe(false);
    expect(isTracedPath('/styles-8KLMNO.css')).toBe(false);
    expect(isTracedPath('/favicon.ico')).toBe(false);
    expect(isTracedPath('/assets/helm.svg')).toBe(false);
    expect(isTracedPath('/healthz')).toBe(false);
    expect(isTracedPath('/readyz')).toBe(false);
  });

  it('does not trace a path that merely starts with a traced prefix', () => {
    expect(isTracedPath('/apidocs')).toBe(false);
    expect(isTracedPath('/authenticate')).toBe(false);
  });
});
