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
import { EsqTreeViewDatasource } from 'src/esquire.ui/explorer/flatTree/EsqTreeViewDatasource';
import { EsqRestApi } from 'src/esquire.ui/api/EsqRestApi';
import { EsqObjectKindFactory } from 'src/esquire.ui/api/EsqObjectKindFactory';
import { EsqObjectKind } from 'src/esquire.ui/api/EsqObjectKind';

describe('EsqTreeViewDatasource', () => {
    var restApi: jasmine.SpyObj<EsqRestApi>;
    var ds: EsqTreeViewDatasource;

    var rootJson = [
        { id: 'r1', kind: 20, name: 'Root Org' },
        { id: 'r2', kind: 20, name: 'Second Org' },
    ];
    var childJson = [
        { id: 'c1', kind: 20, parentId: 'r1', name: 'Child Org' },
    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({}).compileComponents();
        (EsqObjectKindFactory as any)['kinds'] = [
            new EsqObjectKind({ id: 20, name: 'organization', treeFlags: 'B' }),
        ];
        restApi = jasmine.createSpyObj<EsqRestApi>('EsqRestApi', ['esquire', 'esquirePath']);
        restApi.esquire.and.returnValue(of(rootJson));
        ds = new EsqTreeViewDatasource(restApi);
    });

    afterEach(() => {
        (EsqObjectKindFactory as any)['kinds'] = [];
    });

    // ── loadInitialData ───────────────────────────────────────────────────────

    describe('loadInitialData()', () => {
        it('populates internal nodes from REST response', async () => {
            await ds.loadInitialData();
            expect(ds.getAll().length).toBe(2);
        });

        it('sets node id from REST JSON', async () => {
            await ds.loadInitialData();
            var all = ds.getAll();
            expect(all[0].id).toBe('r1');
            expect(all[1].id).toBe('r2');
        });

        it('calls REST with no arguments for root load', async () => {
            await ds.loadInitialData();
            expect(restApi.esquire).toHaveBeenCalledWith();
        });
    });

    // ── getAll ────────────────────────────────────────────────────────────────

    describe('getAll()', () => {
        it('returns empty array before any load', () => {
            expect(ds.getAll()).toEqual([]);
        });

        it('returns a copy — mutating the result does not affect internal state', async () => {
            await ds.loadInitialData();
            var copy = ds.getAll();
            copy.splice(0, copy.length);
            expect(ds.getAll().length).toBe(2);
        });
    });

    // ── getById ───────────────────────────────────────────────────────────────

    describe('getById()', () => {
        it('returns undefined before any load', () => {
            expect(ds.getById('r1')).toBeUndefined();
        });

        it('finds a loaded node by id', async () => {
            await ds.loadInitialData();
            var node = ds.getById('r1');
            expect(node).toBeDefined();
            expect(node!.id).toBe('r1');
        });

        it('returns undefined for unknown id', async () => {
            await ds.loadInitialData();
            expect(ds.getById('nope')).toBeUndefined();
        });
    });

    // ── toggleNode ────────────────────────────────────────────────────────────

    describe('toggleNode()', () => {
        it('loads children when expanding a node with no existing children', async () => {
            restApi.esquire.and.callFake((id?: string) => {
                if (!id) return of(rootJson);
                return of(childJson);
            });
            await ds.loadInitialData();
            var root = ds.getById('r1')!;
            expect(root.expandable()).toBeTrue();
            await ds.toggleNode(root);
            expect(root.expanded()).toBeTrue();
            // Child should be in internal data after toggle
            expect(ds.getById('c1')).toBeDefined();
        });

        it('collapses a previously expanded node', async () => {
            restApi.esquire.and.callFake((id?: string) => {
                if (!id) return of(rootJson);
                return of(childJson);
            });
            await ds.loadInitialData();
            var root = ds.getById('r1')!;
            await ds.toggleNode(root); // expand
            await ds.toggleNode(root); // collapse
            expect(root.expanded()).toBeFalse();
        });

        it('does nothing for a non-expandable node', async () => {
            (EsqObjectKindFactory as any)['kinds'] = [
                new EsqObjectKind({ id: 20, name: 'organization', treeFlags: '' }),
            ];
            await ds.loadInitialData();
            var root = ds.getById('r1')!;
            expect(root.expandable()).toBeFalse();
            await ds.toggleNode(root);
            // REST should only have been called once (loadInitialData), not again
            expect(restApi.esquire).toHaveBeenCalledTimes(1);
        });
    });
});
