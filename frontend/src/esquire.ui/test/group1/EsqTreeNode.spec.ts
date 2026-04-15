/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
*/
import { TestBed } from '@angular/core/testing';
import { EsqTreeNode } from 'src/esquire.ui/api/EsqTreeNode';
import { EsqObjectKindFactory } from 'src/esquire.ui/api/EsqObjectKindFactory';
import { EsqObjectKind } from 'src/esquire.ui/api/EsqObjectKind';

describe('EsqTreeNode', () => {

    beforeEach(async () => {
        await TestBed.configureTestingModule({}).compileComponents();
        // Register a minimal kind so nodes can resolve their kind
        (EsqObjectKindFactory as any)['kinds'] = [
            new EsqObjectKind({ id: 20, name: 'organization', treeFlags: 'B' }),
        ];
    });

    afterEach(() => {
        (EsqObjectKindFactory as any)['kinds'] = [];
    });

    // ── constructor / signals ─────────────────────────────────────────────────

    describe('constructor', () => {
        it('initializes signals to false by default', () => {
            var node = new EsqTreeNode({ id: 'n1', kind: 20 });
            expect(node.loading()).toBeFalse();
            expect(node.expanded()).toBeFalse();
            expect(node.selected()).toBeFalse();
        });

        it('sets expandable=true when treeFlags contains B', () => {
            var node = new EsqTreeNode({ id: 'n1', kind: 20 });
            expect(node.expandable()).toBeTrue();
        });

        it('sets expandable=false when kind has no B treeFlag', () => {
            (EsqObjectKindFactory as any)['kinds'] = [
                new EsqObjectKind({ id: 34, name: 'client', treeFlags: '' }),
            ];
            var node = new EsqTreeNode({ id: 'n1', kind: 34 });
            expect(node.expandable()).toBeFalse();
        });

        it('sets parent reference when provided', () => {
            var parent = new EsqTreeNode({ id: 'p1', kind: 20 });
            var child  = new EsqTreeNode({ id: 'c1', kind: 20 }, parent);
            expect(child.parent).toBe(parent);
        });
    });

    // ── setLoading ────────────────────────────────────────────────────────────

    describe('setLoading()', () => {
        it('sets loading signal to true on enter', async () => {
            var node = new EsqTreeNode({ id: 'n1', kind: 20 });
            await node.setLoading(true);
            expect(node.loading()).toBeTrue();
        });

        it('clears loading signal on exit', async () => {
            var node = new EsqTreeNode({ id: 'n1', kind: 20 });
            await node.setLoading(true);
            await node.setLoading(false);
            expect(node.loading()).toBeFalse();
        });

        it('sequential load/unload cycles work correctly', async () => {
            var node = new EsqTreeNode({ id: 'n1', kind: 20 });
            await node.setLoading(true);
            await node.setLoading(false);
            await node.setLoading(true);
            expect(node.loading()).toBeTrue();
            await node.setLoading(false);
            expect(node.loading()).toBeFalse();
        });
    });
});
