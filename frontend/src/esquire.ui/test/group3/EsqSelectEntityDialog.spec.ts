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
import { EsqSelectEntityDialog } from 'src/esquire.ui/explorer/flatTree/components/EsqSelectEntityDialog';
import { EsqFlatTreeSelector } from 'src/esquire.ui/explorer/flatTree/EsqFlatTreeSelector';
import { EsqObjectKindFactory } from 'src/esquire.ui/api/EsqObjectKindFactory';
import { EsqObjectKind } from 'src/esquire.ui/api/EsqObjectKind';
import { EsqTreeNode } from 'src/esquire.ui/api/EsqTreeNode';

describe('EsqSelectEntityDialog', () => {
    var fixture: ComponentFixture<EsqSelectEntityDialog>;
    var component: EsqSelectEntityDialog;
    var treeDsSpy: jasmine.SpyObj<EsqFlatTreeSelector>;

    beforeEach(async () => {
        (EsqObjectKindFactory as any)['kinds'] = [
            new EsqObjectKind({ id: 20, name: 'organization', treeFlags: 'B' }),
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

        var dialogRefSpy = jasmine.createSpyObj<MatDialogRef<EsqSelectEntityDialog>>(
            'MatDialogRef', ['close', 'addPanelClass', 'updateSize']
        );
        Object.defineProperty(dialogRefSpy, 'disableClose', { get: () => false, set: () => {} });

        await TestBed.configureTestingModule({
            imports: [EsqSelectEntityDialog, NoopAnimationsModule],
            providers: [
                { provide: MatDialogRef, useValue: dialogRefSpy },
                {
                    provide: MAT_DIALOG_DATA, useValue: {
                        treeDs: treeDsSpy,
                        userId: 'u1',
                        title: 'Select Org',
                    }
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EsqSelectEntityDialog);
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
        it('returns true for any node by default', () => {
            var node = new EsqTreeNode({ id: 'n1', kind: 20 });
            expect((component as any).isSelectable(node)).toBeTrue();
        });
    });

    describe('canSelect()', () => {
        it('returns false when no node is selected', () => {
            expect((component as any).canSelect()).toBeFalse();
        });

        it('returns true when a selectable node is selected', () => {
            var node = new EsqTreeNode({ id: 'n1', kind: 20 });
            (component as any).selectedNode = node;
            expect((component as any).canSelect()).toBeTrue();
        });
    });
});
