/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
*/
import { EsqUtils } from 'src/esquire.ui/components/EsqUtils';
import { EsqEntityLayer } from 'src/esquire.ui/api/EsqEntityDictionary';

describe('EsqUtils', () => {

    afterEach(() => {
        EsqUtils.DEBUG_SKIP_VALIDATION = false;
    });

    // ── formatNumber ──────────────────────────────────────────────────────────

    describe('formatNumber()', () => {
        it('formats integer with thousands separator', () => {
            expect(EsqUtils.formatNumber(1234567, '#,##0')).toBe('1,234,567');
        });

        it('formats with two decimal places (required)', () => {
            expect(EsqUtils.formatNumber(1234.5, '#,##0.00')).toBe('1,234.50');
        });

        it('formats with optional decimals (##)', () => {
            expect(EsqUtils.formatNumber(1234.5, '#,##0.##')).toBe('1,234.5');
        });

        it('returns empty string for null', () => {
            expect(EsqUtils.formatNumber(null, '#,##0')).toBe('');
        });

        it('returns empty string for empty string', () => {
            expect(EsqUtils.formatNumber('', '#,##0')).toBe('');
        });

        it('returns input string when not a number', () => {
            expect(EsqUtils.formatNumber('abc', '#,##0')).toBe('abc');
        });
    });

    // ── parseNumber ───────────────────────────────────────────────────────────

    describe('parseNumber()', () => {
        it('parses a plain number string', () => {
            expect(EsqUtils.parseNumber('1234')).toBe(1234);
        });

        it('strips commas and parses', () => {
            expect(EsqUtils.parseNumber('1,234,567')).toBe(1234567);
        });

        it('returns null for empty string', () => {
            expect(EsqUtils.parseNumber('')).toBeNull();
        });

        it('returns null for non-numeric input', () => {
            expect(EsqUtils.parseNumber('abc')).toBeNull();
        });
    });

    // ── validateFields ────────────────────────────────────────────────────────

    describe('validateFields()', () => {
        function makeLayer(fields: any[]): EsqEntityLayer {
            return new EsqEntityLayer({ title: 'Tab', fields });
        }

        it('returns null when all required fields are filled', () => {
            var layers = [makeLayer([
                { name: 'amount', label: 'Amount', type: 'number', readwrite: 3, nullable: 'N' },
            ])];
            var result = EsqUtils.validateFields({ amount: 100 }, layers);
            expect(result).toBeNull();
        });

        it('returns error when required field is empty', () => {
            var layers = [makeLayer([
                { name: 'amount', label: 'Amount', type: 'number', readwrite: 3, nullable: 'N' },
            ])];
            var result = EsqUtils.validateFields({ amount: '' }, layers);
            expect(result).not.toBeNull();
            expect(result!.fieldName).toBe('amount');
            expect(result!.message).toContain('required');
        });

        it('skips readonly fields (readwrite < 3)', () => {
            var layers = [makeLayer([
                { name: 'id', label: 'ID', type: 'string', readwrite: 1, nullable: 'N' },
            ])];
            var result = EsqUtils.validateFields({ id: '' }, layers);
            expect(result).toBeNull();
        });

        it('skips nullable fields', () => {
            var layers = [makeLayer([
                { name: 'note', label: 'Note', type: 'string', readwrite: 3, nullable: 'Y' },
            ])];
            var result = EsqUtils.validateFields({ note: '' }, layers);
            expect(result).toBeNull();
        });

        it('validates string pattern', () => {
            var layers = [makeLayer([
                { name: 'email', label: 'Email', type: 'string', readwrite: 3, nullable: 'Y', validation: '^[^@]+@[^@]+$' },
            ])];
            var result = EsqUtils.validateFields({ email: 'not-an-email' }, layers);
            expect(result).not.toBeNull();
            expect(result!.message).toContain('invalid format');
        });

        it('validates number min/max', () => {
            var layers = [makeLayer([
                { name: 'age', label: 'Age', type: 'number', readwrite: 3, nullable: 'Y', minmax: '0,120' },
            ])];
            var result = EsqUtils.validateFields({ age: 200 }, layers);
            expect(result).not.toBeNull();
            expect(result!.message).toContain('between');
        });

        it('returns null when DEBUG_SKIP_VALIDATION is true', () => {
            EsqUtils.DEBUG_SKIP_VALIDATION = true;
            var layers = [makeLayer([
                { name: 'amount', label: 'Amount', type: 'number', readwrite: 3, nullable: 'N' },
            ])];
            expect(EsqUtils.validateFields({ amount: '' }, layers)).toBeNull();
        });
    });

    // ── deepCopy ──────────────────────────────────────────────────────────────

    describe('deepCopy()', () => {
        it('returns a new object that is not the same reference', () => {
            var original = { a: 1, b: { c: 2 } };
            var copy = EsqUtils.deepCopy(original);
            expect(copy).toEqual(original);
            expect(copy).not.toBe(original);
            expect(copy.b).not.toBe(original.b);
        });
    });

    // ── getChangedFields ──────────────────────────────────────────────────────

    describe('getChangedFields()', () => {
        it('returns null when nothing changed', () => {
            var orig = { a: 1, b: 'x' };
            var curr = { a: 1, b: 'x' };
            expect(EsqUtils.getChangedFields(orig, curr)).toBeNull();
        });

        it('returns only changed keys', () => {
            var orig = { a: 1, b: 'x' };
            var curr = { a: 2, b: 'x' };
            var changes = EsqUtils.getChangedFields(orig, curr);
            expect(changes).toEqual({ a: 2 });
        });

        it('detects array changes via JSON comparison', () => {
            var orig = { items: [1, 2] };
            var curr = { items: [1, 3] };
            var changes = EsqUtils.getChangedFields(orig, curr);
            expect(changes).toEqual({ items: [1, 3] });
        });

        it('treats null current value as a change', () => {
            var orig = { a: 1 };
            var curr = { a: null };
            var changes = EsqUtils.getChangedFields(orig, curr);
            expect(changes).toEqual({ a: null });
        });

        it('returns null when either param is null', () => {
            expect(EsqUtils.getChangedFields(null, { a: 1 })).toBeNull();
            expect(EsqUtils.getChangedFields({ a: 1 }, null)).toBeNull();
        });
    });

    // ── errorMessage ──────────────────────────────────────────────────────────

    describe('errorMessage()', () => {
        it('returns the string directly', () => {
            expect(EsqUtils.errorMessage('oops')).toBe('oops');
        });

        it('prefers detail over message', () => {
            expect(EsqUtils.errorMessage({ detail: 'detail msg', message: 'msg' })).toBe('detail msg');
        });

        it('falls back to message', () => {
            expect(EsqUtils.errorMessage({ message: 'msg' })).toBe('msg');
        });

        it('returns unknown error for null', () => {
            expect(EsqUtils.errorMessage(null)).toBe('Unknown error');
        });
    });
});
