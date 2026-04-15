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
import { EsqSelectEntityDatasource } from 'src/esquire.ui/explorer/flatTree/EsqSelectEntityDatasource';
import { EsqTreeViewDatasource } from 'src/esquire.ui/explorer/flatTree/EsqTreeViewDatasource';
import { EsqRestApi } from 'src/esquire.ui/api/EsqRestApi';
import { EsqObjectKindFactory } from 'src/esquire.ui/api/EsqObjectKindFactory';
import { EsqObjectKind } from 'src/esquire.ui/api/EsqObjectKind';
import { EsqTreeNode } from 'src/esquire.ui/api/EsqTreeNode';

describe('EsqSelectEntityDatasource', () => {
    var restApi: jasmine.SpyObj<EsqRestApi>;
    var treeDs: jasmine.SpyObj<EsqTreeViewDatasource>;
    var kinds: Set<number>;
    var ds: EsqSelectEntityDatasource;

    function makeNode(id: string, entityId?: string): EsqTreeNode {
        return new EsqTreeNode({ id, kind: 20, entityId: entityId ?? '' });
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({}).compileComponents();
        (EsqObjectKindFactory as any)['kinds'] = [
            new EsqObjectKind({ id: 20, name: 'organization', treeFlags: 'B' }),
        ];
        restApi = jasmine.createSpyObj<EsqRestApi>('EsqRestApi', ['esquire', 'esquirePath']);
        restApi.esquire.and.returnValue(of([]));

        treeDs = jasmine.createSpyObj<EsqTreeViewDatasource>('EsqTreeViewDatasource', [
            'getAll', 'loadInitialData', 'toggleNode', 'getPath',
        ]);
        treeDs.getAll.and.returnValue([]);
        treeDs.loadInitialData.and.returnValue(Promise.resolve());
        treeDs.toggleNode.and.returnValue(Promise.resolve());
        treeDs.getPath.and.returnValue(Promise.resolve([]));

        kinds = new Set([20]);
        ds = new EsqSelectEntityDatasource(treeDs, restApi, kinds);
    });

    afterEach(() => {
        (EsqObjectKindFactory as any)['kinds'] = [];
    });

    // ── findByNodeId ──────────────────────────────────────────────────────────

    describe('findByNodeId()', () => {
        it('returns null when no nodes are loaded', () => {
            expect(ds.findByNodeId('n1')).toBeNull();
        });

        it('returns the node whose id matches', () => {
            var node = makeNode('n1');
            treeDs.getAll.and.returnValue([node]);
            expect(ds.findByNodeId('n1')).toBe(node);
        });

        it('returns null when id does not match any node', () => {
            treeDs.getAll.and.returnValue([makeNode('n1')]);
            expect(ds.findByNodeId('n999')).toBeNull();
        });
    });

    // ── findByEntityId ────────────────────────────────────────────────────────

    describe('findByEntityId()', () => {
        it('returns null when no nodes are loaded', () => {
            expect(ds.findByEntityId('e1')).toBeNull();
        });

        it('returns the node whose entityId matches', () => {
            var node = makeNode('n1', 'e1');
            treeDs.getAll.and.returnValue([node]);
            expect(ds.findByEntityId('e1')).toBe(node);
        });

        it('does not return a node with empty entityId', () => {
            var node = makeNode('n1'); // entityId = ''
            treeDs.getAll.and.returnValue([node]);
            expect(ds.findByEntityId('')).toBeNull();
        });

        it('returns null when entityId does not match', () => {
            treeDs.getAll.and.returnValue([makeNode('n1', 'e1')]);
            expect(ds.findByEntityId('e999')).toBeNull();
        });
    });

    // ── reset ─────────────────────────────────────────────────────────────────

    describe('reset()', () => {
        it('clears loaded state so ensureLoaded triggers a reload', async () => {
            treeDs.getAll.and.returnValue([makeNode('n1')]);
            await ds.ensureLoaded();
            // After reset, ensureLoaded should call loadInitialData again
            // (treeDs.getAll returns [] to trigger loadInitialData call)
            treeDs.getAll.and.returnValue([]);
            ds.reset();
            await ds.ensureLoaded();
            expect(treeDs.loadInitialData).toHaveBeenCalledTimes(1);
        });
    });

    // ── isExpandable ──────────────────────────────────────────────────────────

    describe('isExpandable()', () => {
        it('returns true by default (no isLeaf callback)', () => {
            var node = makeNode('n1');
            expect(ds.isExpandable(node)).toBeTrue();
        });

        it('returns false when isLeaf callback returns true for the node', () => {
            ds = new EsqSelectEntityDatasource(treeDs, restApi, kinds, () => true);
            var node = makeNode('n1');
            expect(ds.isExpandable(node)).toBeFalse();
        });

        it('returns true when isLeaf callback returns false for the node', () => {
            ds = new EsqSelectEntityDatasource(treeDs, restApi, kinds, () => false);
            var node = makeNode('n1');
            expect(ds.isExpandable(node)).toBeTrue();
        });
    });
});
