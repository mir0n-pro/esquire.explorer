/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
*/
import { EsqObjectKind } from 'src/esquire.ui/api/EsqObjectKind';

describe('EsqObjectKind', () => {

    describe('constructor', () => {
        it('sets defaults when constructed with no args', () => {
            var kind = new EsqObjectKind();
            expect(kind.id).toBe(-1);
            expect(kind.name).toBe('unknown');
            expect(kind.org).toBeFalse();
            expect(kind.acct).toBeFalse();
            expect(kind.commands).toEqual([]);
            expect(kind.childKinds).toEqual([]);
        });

        it('maps JSON fields correctly', () => {
            var kind = new EsqObjectKind({
                id: 20, name: 'organization', title: 'Organization',
                org: true, acct: false, icon: 'img/org.ico',
                commands: ['default', 'new'], childKinds: [34, 50],
            });
            expect(kind.id).toBe(20);
            expect(kind.name).toBe('organization');
            expect(kind.title).toBe('Organization');
            expect(kind.org).toBeTrue();
            expect(kind.icon).toBe('img/org.ico');
            expect(kind.commands).toEqual(['default', 'new']);
            expect(kind.childKinds).toEqual([34, 50]);
        });
    });

    describe('isCommandAllowed()', () => {
        it('returns true when cmd is in commands[]', () => {
            var kind = new EsqObjectKind({ id: 20, commands: ['default', 'new'] });
            expect(kind.isCommandAllowed('default')).toBeTrue();
            expect(kind.isCommandAllowed('new')).toBeTrue();
        });

        it('returns false when cmd is not in commands[]', () => {
            var kind = new EsqObjectKind({ id: 20, commands: ['default'] });
            expect(kind.isCommandAllowed('delete')).toBeFalse();
        });

        it('returns false when commands[] is empty', () => {
            var kind = new EsqObjectKind({ id: 20 });
            expect(kind.isCommandAllowed('default')).toBeFalse();
        });
    });

    describe('isNewAllowed()', () => {
        it('returns true when childKinds is non-empty', () => {
            var kind = new EsqObjectKind({ id: 20, childKinds: [34] });
            expect(kind.isNewAllowed()).toBeTrue();
        });

        it('returns false when childKinds is empty', () => {
            var kind = new EsqObjectKind({ id: 20, childKinds: [] });
            expect(kind.isNewAllowed()).toBeFalse();
        });

        it('returns false when childKinds is not provided', () => {
            var kind = new EsqObjectKind({ id: 20 });
            expect(kind.isNewAllowed()).toBeFalse();
        });
    });
});
