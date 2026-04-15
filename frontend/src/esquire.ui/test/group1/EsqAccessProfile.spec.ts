/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
*/
import { EsqAccessProfile } from 'src/esquire.ui/api/EsqAccessProfile';
import { EsqUtils } from 'src/esquire.ui/components/EsqUtils';
import { EsqExplorerCallApi } from 'src/esquire.ui/api/EsqExplorerCallApi';
import { EsqObjectKindFactory } from 'src/esquire.ui/api/EsqObjectKindFactory';

describe('EsqAccessProfile', () => {

    afterEach(() => {
        EsqUtils.DEBUG_SKIP_PERMISSION = false;
    });

    function makeProfile(id: string, adminPerms: any[]): EsqAccessProfile {
        return new EsqAccessProfile({
            id,
            kind: 34,
            name: 'Test User',
            admin: adminPerms,
        });
    }

    // ── constructor ───────────────────────────────────────────────────────────

    describe('constructor', () => {
        it('maps basic fields from JSON', () => {
            var p = new EsqAccessProfile({ id: 'u1', name: 'Alice', loginId: 'alice' });
            expect(p.id).toBe('u1');
            expect(p.name).toBe('Alice');
            expect(p.loginId).toBe('alice');
        });

        it('maps roles and permissions arrays', () => {
            var p = new EsqAccessProfile({
                id: 'u1',
                roles: [{ id: 1, name: 'admin', adminFlg: 'Y' }],
                admin: [{ id: 'e1', kind: 20, name: 'org', flags: ['Y', 'Y', 'N', 'N'] }],
            });
            expect(p.roles.length).toBe(1);
            expect(p.roles[0].name).toBe('admin');
            expect(p.admin.length).toBe(1);
            expect(p.admin[0].flags).toEqual(['Y', 'Y', 'N', 'N']);
        });
    });

    // ── isCommandAllowed — personal mode ──────────────────────────────────────

    describe('isCommandAllowed() — personal mode', () => {
        it('returns true when entityId matches own id (personal mode)', () => {
            var profile = makeProfile('user-1', []);
            expect(profile.isCommandAllowed(EsqExplorerCallApi.CMD_DEFAULT, 'user-1', 34)).toBeTrue();
        });
    });

    // ── isCommandAllowed — permission flags ───────────────────────────────────

    describe('isCommandAllowed() — flag checks', () => {
        // flags[0]=new, flags[1]=default/view, flags[2]=delete, flags[3]=key
        var permKind = 20;

        it('returns true when CMD_DEFAULT flag is Y', () => {
            var profile = makeProfile('u1', [
                { id: 'e1', kind: permKind, flags: ['N', 'Y', 'N', 'N'] },
            ]);
            expect(profile.isCommandAllowed(EsqExplorerCallApi.CMD_DEFAULT, 'other', permKind)).toBeTrue();
        });

        it('returns false when CMD_DEFAULT flag is N', () => {
            var profile = makeProfile('u1', [
                { id: 'e1', kind: permKind, flags: ['Y', 'N', 'N', 'N'] },
            ]);
            expect(profile.isCommandAllowed(EsqExplorerCallApi.CMD_DEFAULT, 'other', permKind)).toBeFalse();
        });

        it('returns true when CMD_NEW flag is Y', () => {
            var profile = makeProfile('u1', [
                { id: 'e1', kind: permKind, flags: ['Y', 'N', 'N', 'N'] },
            ]);
            expect(profile.isCommandAllowed(EsqExplorerCallApi.CMD_NEW, 'other', permKind)).toBeTrue();
        });

        it('returns true when CMD_DELETE flag is Y', () => {
            var profile = makeProfile('u1', [
                { id: 'e1', kind: permKind, flags: ['N', 'N', 'Y', 'N'] },
            ]);
            expect(profile.isCommandAllowed(EsqExplorerCallApi.CMD_DELETE, 'other', permKind)).toBeTrue();
        });

        it('normalizes odd kind before lookup', () => {
            // kind 21 → normalized to 20; should find permission for kind 20
            var profile = makeProfile('u1', [
                { id: 'e1', kind: EsqObjectKindFactory.normalize(21), flags: ['N', 'Y', 'N', 'N'] },
            ]);
            expect(profile.isCommandAllowed(EsqExplorerCallApi.CMD_DEFAULT, 'other', 21)).toBeTrue();
        });

        it('returns false when no permission entry exists for kind', () => {
            var profile = makeProfile('u1', []);
            expect(profile.isCommandAllowed(EsqExplorerCallApi.CMD_DEFAULT, 'other', permKind)).toBeFalse();
        });
    });

    // ── isCommandAllowed — debug skip ─────────────────────────────────────────

    describe('isCommandAllowed() — DEBUG_SKIP_PERMISSION', () => {
        it('returns true regardless of permissions when flag is set', () => {
            EsqUtils.DEBUG_SKIP_PERMISSION = true;
            var profile = makeProfile('u1', []); // no permissions
            expect(profile.isCommandAllowed(EsqExplorerCallApi.CMD_DELETE, 'other', 20)).toBeTrue();
        });
    });

    // ── addFlagIndex ──────────────────────────────────────────────────────────

    describe('addFlagIndex()', () => {
        var testFlag = '__test_cmd__';

        afterEach(() => {
            // Remove test entry from static flagIndexes
            var arr: any[] = (EsqAccessProfile as any)['flagIndexes'];
            var idx = arr.findIndex((o: any) => o.hasOwnProperty(testFlag));
            if (idx >= 0) arr.splice(idx, 1);
        });

        it('adds a new flag index entry', () => {
            EsqAccessProfile.addFlagIndex(testFlag, 2);
            var profile = makeProfile('u1', [
                { id: 'e1', kind: 20, flags: ['N', 'N', 'Y', 'N'] },
            ]);
            expect(profile.isCommandAllowed(testFlag, 'other', 20)).toBeTrue();
        });

        it('updates an existing flag index entry', () => {
            EsqAccessProfile.addFlagIndex(testFlag, 0);
            EsqAccessProfile.addFlagIndex(testFlag, 2); // update to index 2
            var profile = makeProfile('u1', [
                { id: 'e1', kind: 20, flags: ['N', 'N', 'Y', 'N'] },
            ]);
            expect(profile.isCommandAllowed(testFlag, 'other', 20)).toBeTrue();
        });
    });
});
