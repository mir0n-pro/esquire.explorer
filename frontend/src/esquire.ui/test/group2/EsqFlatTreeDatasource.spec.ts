/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
*/
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { EsqFlatTreeDatasource } from 'src/esquire.ui/explorer/flatTree/EsqFlatTreeDatasource';
import { EsqSelectEntityDatasource } from 'src/esquire.ui/explorer/flatTree/EsqSelectEntityDatasource';
import { EsqRestApi } from 'src/esquire.ui/api/EsqRestApi';
import { EsqTreeNode } from 'src/esquire.ui/api/EsqTreeNode';
import { EsqObjectKindFactory } from 'src/esquire.ui/api/EsqObjectKindFactory';
import { EsqObjectKind } from 'src/esquire.ui/api/EsqObjectKind';

describe('EsqFlatTreeDatasource', () => {
    var restApi: jasmine.SpyObj<EsqRestApi>;
    var ds: EsqFlatTreeDatasource;

    var orgNodes = [
        { id: 'o1', kind: 20, name: 'Org One' },
        { id: 'o2', kind: 20, name: 'Org Two' },
        { id: 'c1', kind: 34, name: 'Client One' },
    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({}).compileComponents();
        (EsqObjectKindFactory as any)['kinds'] = [
            new EsqObjectKind({ id: 20, name: 'organization', treeFlags: 'B', org: true }),
            new EsqObjectKind({ id: 34, name: 'client', treeFlags: '' }),
        ];
        restApi = jasmine.createSpyObj<EsqRestApi>('EsqRestApi', ['esquire', 'esquirePath']);
        restApi.esquire.and.returnValue(of(orgNodes));
        ds = new EsqFlatTreeDatasource(restApi);
    });

    afterEach(() => {
        (EsqObjectKindFactory as any)['kinds'] = [];
    });

    // ── createFlatTreeSelector ────────────────────────────────────────────────

    describe('createFlatTreeSelector()', () => {
        it('returns an EsqSelectEntityDatasource instance', () => {
            var selector = ds.createFlatTreeSelector(new Set([20]));
            expect(selector).toBeInstanceOf(EsqSelectEntityDatasource);
        });

        it('returns same cached instance on second call with identical kinds', () => {
            var s1 = ds.createFlatTreeSelector(new Set([20]));
            var s2 = ds.createFlatTreeSelector(new Set([20]));
            expect(s1).toBe(s2);
        });

        it('returns a different instance for a different kinds set', () => {
            var s1 = ds.createFlatTreeSelector(new Set([20]));
            var s2 = ds.createFlatTreeSelector(new Set([34]));
            expect(s1).not.toBe(s2);
        });

        it('cache key is order-independent (same kinds, different insertion order)', () => {
            var s1 = ds.createFlatTreeSelector(new Set([20, 34]));
            var s2 = ds.createFlatTreeSelector(new Set([34, 20]));
            expect(s1).toBe(s2);
        });
    });

    // ── getOrgNodes ───────────────────────────────────────────────────────────

    describe('getOrgNodes()', () => {
        it('returns empty array before any load', () => {
            expect(ds.getOrgNodes()).toEqual([]);
        });

        it('returns only nodes whose kind.org is true', async () => {
            await ds.loadInitialData();
            var orgs = ds.getOrgNodes();
            expect(orgs.length).toBe(2);
            orgs.forEach((n: EsqTreeNode) => expect(n.kind.org).toBeTrue());
        });

        it('does not include non-org nodes', async () => {
            await ds.loadInitialData();
            var orgs = ds.getOrgNodes();
            var ids = orgs.map((n: EsqTreeNode) => n.id);
            expect(ids).not.toContain('c1');
        });
    });
});
