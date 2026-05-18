/*
 *  Esquire frameworks (tm)
 *  Esquire Backend (BFF tier) -- unit tests
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *  mailto:mir0n.the.programmer@gmail.com
 */

import { describe, it, expect, vi } from 'vitest';
import type { Request, Response } from 'express';
import { traceMiddleware } from '../../src/util/trace.js';

interface MockRes {
  headers: Record<string, string>;
  setHeader(name: string, value: string): void;
}

function mockReq(headers: Record<string, string | string[]> = {}): Request {
  const req = { headers } as unknown as Request;
  return req;
}

function mockRes(): MockRes & Pick<Response, 'setHeader'> {
  const headers: Record<string, string> = {};
  const ret = {
    headers,
    setHeader(name: string, value: string) {
      headers[name] = value;
    },
  };
  return ret as MockRes & Pick<Response, 'setHeader'>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  it('propagates X-Correlation-ID only when the client sets it', () => {
    const reqWith = mockReq({ 'x-correlation-id': 'corr-abc' });
    const resWith = mockRes();
    traceMiddleware(reqWith, resWith as unknown as Response, vi.fn());
    expect(reqWith.esqCorrelationId).toBe('corr-abc');
    expect(resWith.headers['X-Correlation-ID']).toBe('corr-abc');

    const reqWithout = mockReq();
    const resWithout = mockRes();
    traceMiddleware(reqWithout, resWithout as unknown as Response, vi.fn());
    expect(reqWithout.esqCorrelationId).toBeUndefined();
    expect(resWithout.headers['X-Correlation-ID']).toBeUndefined();
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
});
