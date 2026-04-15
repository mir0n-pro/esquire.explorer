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
import { EsqNodeDialog } from 'src/esquire.ui/components/EsqNodeDialog';
import { EsqObjectKindFactory } from 'src/esquire.ui/api/EsqObjectKindFactory';
import { EsqObjectKind } from 'src/esquire.ui/api/EsqObjectKind';
import { EsqTreeNode } from 'src/esquire.ui/api/EsqTreeNode';
import { EsqNodeStatusFactory } from 'src/esquire.ui/api/EsqNodeStatusFactory';

describe('EsqNodeDialog', () => {
    var fixture: ComponentFixture<EsqNodeDialog>;
    var component: EsqNodeDialog;
    var dialogRefSpy: jasmine.SpyObj<MatDialogRef<EsqNodeDialog>>;

    beforeEach(async () => {
        (EsqObjectKindFactory as any)['kinds'] = [
            new EsqObjectKind({ id: 20, name: 'organization', treeFlags: 'B' }),
        ];
        EsqNodeStatusFactory.init([]);

        dialogRefSpy = jasmine.createSpyObj<MatDialogRef<EsqNodeDialog>>(
            'MatDialogRef', ['close', 'addPanelClass', 'updateSize']
        );
        Object.defineProperty(dialogRefSpy, 'disableClose', { get: () => false, set: () => {} });

        await TestBed.configureTestingModule({
            imports: [EsqNodeDialog, NoopAnimationsModule],
            providers: [
                { provide: MatDialogRef, useValue: dialogRefSpy },
                {
                    provide: MAT_DIALOG_DATA, useValue: {
                        node: new EsqTreeNode({ id: 'n1', kind: 20 }),
                        readOnly: false,
                        userId: 'u1',
                    }
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EsqNodeDialog);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        (EsqObjectKindFactory as any)['kinds'] = [];
    });

    it('creates without error', () => {
        expect(component).toBeTruthy();
    });

    describe('nodeStatusIcon()', () => {
        it('returns a string', () => {
            var icon = component.nodeStatusIcon();
            expect(typeof icon).toBe('string');
        });
    });
});
