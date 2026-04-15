/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
*/
import { EsqObjectKindFactory } from 'src/esquire.ui/api/EsqObjectKindFactory';
import { EsqObjectKind } from 'src/esquire.ui/api/EsqObjectKind';

describe('EsqObjectKindFactory', () => {

    beforeEach(() => {
        // Reset static kinds between tests
        (EsqObjectKindFactory as any)['kinds'] = [];
    });

    // ── normalize ─────────────────────────────────────────────────────────────

    describe('normalize()', () => {
        it('returns even kind unchanged', () => {
            expect(EsqObjectKindFactory.normalize(50)).toBe(50);
            expect(EsqObjectKindFactory.normalize(0)).toBe(0);
        });

        it('rounds odd kind down to even', () => {
            expect(EsqObjectKindFactory.normalize(51)).toBe(50);
            expect(EsqObjectKindFactory.normalize(1)).toBe(0);
        });

        it('rounds any link-variant to its entity kind', () => {
            expect(EsqObjectKindFactory.normalize(53)).toBe(52);
            expect(EsqObjectKindFactory.normalize(55)).toBe(54);
        });
    });

    // ── instanceOf ────────────────────────────────────────────────────────────

    describe('instanceOf()', () => {
        it('returns UNKNOWN when kinds are not initialized', () => {
            expect(EsqObjectKindFactory.instanceOf(20)).toBe(EsqObjectKindFactory.UNKNOWN);
        });

        it('returns MORE for kind 999 (hardcoded)', () => {
            expect(EsqObjectKindFactory.instanceOf(999)).toBe(EsqObjectKindFactory.MORE);
        });

        it('returns the registered kind when found', () => {
            (EsqObjectKindFactory as any)['kinds'] = [
                new EsqObjectKind({ id: 20, name: 'organization' }),
            ];
            var result = EsqObjectKindFactory.instanceOf(20);
            expect(result.id).toBe(20);
            expect(result.name).toBe('organization');
        });

        it('returns UNKNOWN for an unregistered kind', () => {
            (EsqObjectKindFactory as any)['kinds'] = [
                new EsqObjectKind({ id: 20, name: 'organization' }),
            ];
            expect(EsqObjectKindFactory.instanceOf(99)).toBe(EsqObjectKindFactory.UNKNOWN);
        });
    });

    // ── getAllowedChildTypes ───────────────────────────────────────────────────

    describe('getAllowedChildTypes()', () => {
        it('returns empty array for null parent', () => {
            expect(EsqObjectKindFactory.getAllowedChildTypes(null)).toEqual([]);
        });

        it('returns empty array when parent has no childKinds', () => {
            var node = { kind: new EsqObjectKind({ id: 20, childKinds: [] }) } as any;
            expect(EsqObjectKindFactory.getAllowedChildTypes(node)).toEqual([]);
        });

        it('returns registered child kinds', () => {
            var childKind = new EsqObjectKind({ id: 34, name: 'client' });
            (EsqObjectKindFactory as any)['kinds'] = [childKind];
            var node = { kind: new EsqObjectKind({ id: 20, childKinds: [34] }) } as any;
            var result = EsqObjectKindFactory.getAllowedChildTypes(node);
            expect(result.length).toBe(1);
            expect(result[0].id).toBe(34);
        });

        it('filters out unregistered child kinds (maps to UNKNOWN)', () => {
            (EsqObjectKindFactory as any)['kinds'] = [];
            var node = { kind: new EsqObjectKind({ id: 20, childKinds: [34] }) } as any;
            var result = EsqObjectKindFactory.getAllowedChildTypes(node);
            expect(result).toEqual([]);
        });
    });
});
