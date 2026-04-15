/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
*/
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject } from 'rxjs';
import { EsqMoveDialog } from 'src/esquire.ui/explorer/flatTree/components/EsqMoveDialog';
import { EsqFlatTreeSelector, EsqFlatTreeSelectorFactory } from 'src/esquire.ui/explorer/flatTree/EsqFlatTreeSelector';
import { EsqRestApi } from 'src/esquire.ui/api/EsqRestApi';
import { EsqExplorerCallApi } from 'src/esquire.ui/api/EsqExplorerCallApi';
import { EsqObjectKindFactory } from 'src/esquire.ui/api/EsqObjectKindFactory';
import { EsqObjectKind } from 'src/esquire.ui/api/EsqObjectKind';
import { EsqTreeNode } from 'src/esquire.ui/api/EsqTreeNode';

describe('EsqMoveDialog', () => {
    var fixture: ComponentFixture<EsqMoveDialog>;
    var component: EsqMoveDialog;
    var treeDsSpy: jasmine.SpyObj<EsqFlatTreeSelector>;
    var selectorFactory: jasmine.SpyObj<EsqFlatTreeSelectorFactory>;
    var movingNode: EsqTreeNode;
    var orgParentNode: EsqTreeNode;

    beforeEach(async () => {
        (EsqObjectKindFactory as any)['kinds'] = [
            new EsqObjectKind({ id: 0,  name: 'root',         treeFlags: 'B', org: false }),
            new EsqObjectKind({ id: 20, name: 'organization', treeFlags: 'B', org: true  }),
            new EsqObjectKind({ id: 34, name: 'client',       treeFlags: '',  org: false }),
        ];

        treeDsSpy = jasmine.createSpyObj<EsqFlatTreeSelector>('EsqFlatTreeSelector', [
            'ensureLoaded', 'toggleNode', 'isExpandable', 'expandToNode',
            'findByNodeId', 'findByEntityId', 'reset',
        ]);
        treeDsSpy.ensureLoaded.and.returnValue(Promise.resolve());
        treeDsSpy.expandToNode.and.returnValue(Promise.resolve(null));
        (treeDsSpy as any).selectDs = {
            connect: () => new BehaviorSubject<EsqTreeNode[]>([]).asObservable(),
            disconnect: () => {},
        };
        (treeDsSpy as any).levelAccessor = (n: EsqTreeNode) => n.level;

        selectorFactory = jasmine.createSpyObj<EsqFlatTreeSelectorFactory>('EsqFlatTreeSelectorFactory', [
            'createFlatTreeSelector',
        ]);
        selectorFactory.createFlatTreeSelector.and.returnValue(treeDsSpy);

        var restApiSpy = jasmine.createSpyObj<EsqRestApi>('EsqRestApi', ['esquireCmdMove']);
        var callApiSpy = jasmine.createSpyObj<EsqExplorerCallApi>('EsqExplorerCallApi', [
            'registerHost', 'unregisterHost', 'confirmDlg',
        ]);

        // orgParentNode is an org-kind node with entityId
        orgParentNode = new EsqTreeNode({ id: 'org-tree-1', kind: 20, entityId: 'org-entity-1' });
        // movingNode is a client node whose parent is the org node
        movingNode = new EsqTreeNode({ id: 'c1', kind: 34, entityId: 'client-e1', name: 'Client 1' }, orgParentNode);

        var dialogRefSpy = jasmine.createSpyObj<MatDialogRef<EsqMoveDialog>>(
            'MatDialogRef', ['close', 'addPanelClass', 'updateSize']
        );
        Object.defineProperty(dialogRefSpy, 'disableClose', { get: () => false, set: () => {} });

        await TestBed.configureTestingModule({
            imports: [EsqMoveDialog, NoopAnimationsModule],
            providers: [
                { provide: MatDialogRef, useValue: dialogRefSpy },
                {
                    provide: MAT_DIALOG_DATA, useValue: {
                        node: movingNode,
                        selectorFactory,
                        restApi: restApiSpy,
                        callApi: callApiSpy,
                        nodeKind: 34,
                        userId: 'u1',
                    }
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EsqMoveDialog);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    afterEach(() => {
        (EsqObjectKindFactory as any)['kinds'] = [];
    });

    it('creates without error', () => {
        expect(component).toBeTruthy();
    });

    describe('isSelectable()', () => {
        it('returns true for an org-kind node', () => {
            var orgNode = new EsqTreeNode({ id: 'o2', kind: 20 });
            expect((component as any).isSelectable(orgNode)).toBeTrue();
        });

        it('returns false for a non-org node', () => {
            var clientNode = new EsqTreeNode({ id: 'c2', kind: 34 });
            expect((component as any).isSelectable(clientNode)).toBeFalse();
        });
    });

    describe('canSelect()', () => {
        it('returns false when no node is selected', () => {
            expect((component as any).canSelect()).toBeFalse();
        });

        it('returns false when selected node is the current org parent', () => {
            // Set selected to the current org parent (same entityId as movingNode's org ancestor)
            var sameParentNode = new EsqTreeNode({ id: 'org-tree-1', kind: 20, entityId: 'org-entity-1' });
            (component as any).selectedNode = sameParentNode;
            expect((component as any).canSelect()).toBeFalse();
        });

        it('returns true when selected node is a different org', () => {
            var differentOrg = new EsqTreeNode({ id: 'org-tree-2', kind: 20, entityId: 'org-entity-2' });
            (component as any).selectedNode = differentOrg;
            expect((component as any).canSelect()).toBeTrue();
        });
    });
});
