/*
 *  Esquire frameworks (tm)
 *  Esquire Backend (BFF tier) -- unit tests
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *  mailto:mir0n.the.programmer@gmail.com
 */

// I35 -- the W3C trace-id shape (traceId == correlationId) is computed in TWO languages that must never drift:
// this file's src/util/trace.ts and the Java common.EsqUtils. These VECTORS are the cross-language contract; the
// Java side asserts the SAME input->output pairs in
// common/src/test/java/pro/mir0n/esquire/backend/o11y/EsqW3cIdConformanceTest.java. Change a vector here, change it
// there -- if the two languages disagree, one side's build fails, so the log<->trace join cannot break silently.

import { describe, it, expect } from 'vitest';
import { toW3cTraceId, isW3cTraceId, settleCorrelationId } from '../../src/util/trace.js';

// toW3cTraceId: SHA-256(input, UTF-8), first 16 bytes -> 32 lowercase hex. [input, expected]
const TO_W3C: [string, string][] = [
  ['esquire',           '355593035828b00bd3db642efe0b29a3'],
  ['X-Request-ID:7f3a', 'b8b06019e070ae5645aaa89b4e95eabf'],
  ['user-42',           '6d894aa3ee802549d7f340e7c1cf0d1c'],
  ['hello world',       'b94d27b9934d3e08a52e52d7da7dabfa'],
];

// isW3cTraceId: 32 LOWERCASE hex, not all zero. [input, expected]
const IS_W3C: [string, boolean][] = [
  ['3f8a1c2e4b6d8f0a1c2e4b6d8f0a1c2e', true],
  ['3F8A1C2E4B6D8F0A1C2E4B6D8F0A1C2E', false],  // upper-case -> not W3C (the drift that would break the join)
  ['00000000000000000000000000000000', false],
  ['abc',                              false],
  ['3f8a1c2e4b6d8f0a1c2e4b6d8f0a1c2',  false],  // 31 chars
];

describe('W3C trace-id shape -- cross-language conformance with Java EsqUtils (I35)', () => {
  it('toW3cTraceId matches the contract', () => {
    for (const [input, expected] of TO_W3C) {
      expect(toW3cTraceId(input), `toW3cTraceId(${input})`).toBe(expected);
    }
  });

  it('isW3cTraceId matches the contract', () => {
    for (const [input, expected] of IS_W3C) {
      expect(isW3cTraceId(input), `isW3cTraceId(${input})`).toBe(expected);
    }
  });

  it('settleCorrelationId keeps a W3C id, converts a non-W3C one, generates a W3C-shaped id when blank', () => {
    const w3c = '3f8a1c2e4b6d8f0a1c2e4b6d8f0a1c2e';
    expect(settleCorrelationId(w3c)).toBe(w3c);                                   // kept
    expect(settleCorrelationId('user-42')).toBe('6d894aa3ee802549d7f340e7c1cf0d1c'); // converted (== toW3cTraceId)
    expect(isW3cTraceId(settleCorrelationId(undefined))).toBe(true);              // generated -> shape only
  });
});
