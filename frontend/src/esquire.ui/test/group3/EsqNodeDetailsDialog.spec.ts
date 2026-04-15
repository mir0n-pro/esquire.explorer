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
import { of } from 'rxjs';
import { EsqNodeDetailsDialog } from 'src/esquire.ui/components/EsqNodeDetailsDialog';
import { EsqRestApi } from 'src/esquire.ui/api/EsqRestApi';
import { EsqDictionaryApi } from 'src/esquire.ui/api/EsqDictionaryApi';
import { EsqExplorerCallApi } from 'src/esquire.ui/api/EsqExplorerCallApi';
import { EsqObjectKindFactory } from 'src/esquire.ui/api/EsqObjectKindFactory';
import { EsqObjectKind } from 'src/esquire.ui/api/EsqObjectKind';
import { EsqTreeNode } from 'src/esquire.ui/api/EsqTreeNode';
import { EsqNodeStatusFactory } from 'src/esquire.ui/api/EsqNodeStatusFactory';

describe('EsqNodeDetailsDialog', () => {
    var fixture: ComponentFixture<EsqNodeDetailsDialog>;
    var component: EsqNodeDetailsDialog;

    beforeEach(async () => {
        (EsqObjectKindFactory as any)['kinds'] = [
            new EsqObjectKind({ id: 20, name: 'organization', treeFlags: 'B' }),
        ];
        EsqNodeStatusFactory.init([]);

        var restApiSpy = jasmine.createSpyObj<EsqRestApi>('EsqRestApi', ['esquireCmd']);
        restApiSpy.esquireCmd.and.returnValue(of({ id: 'e1', kind: 20, name: 'Test Org' }));

        var dictionaryApiSpy = jasmine.createSpyObj<EsqDictionaryApi>('EsqDictionaryApi', [
            'dictionary', 'dictionaryFromCache',
        ]);
        dictionaryApiSpy.dictionary.and.returnValue(of([]));
        dictionaryApiSpy.dictionaryFromCache.and.returnValue([]);

        var callApiSpy = jasmine.createSpyObj<EsqExplorerCallApi>('EsqExplorerCallApi', [
            'registerHost', 'unregisterHost', 'confirmDlg',
        ]);

        var dialogRefSpy = jasmine.createSpyObj<MatDialogRef<EsqNodeDetailsDialog>>(
            'MatDialogRef', ['close', 'addPanelClass', 'updateSize']
        );
        Object.defineProperty(dialogRefSpy, 'disableClose', { get: () => false, set: () => {} });

        await TestBed.configureTestingModule({
            imports: [EsqNodeDetailsDialog, NoopAnimationsModule],
            providers: [
                { provide: MatDialogRef, useValue: dialogRefSpy },
                {
                    provide: MAT_DIALOG_DATA, useValue: {
                        restApi: restApiSpy,
                        dictionaryApi: dictionaryApiSpy,
                        callApi: callApiSpy,
                        readOnly: false,
                        userId: 'u1',
                        node: new EsqTreeNode({ id: 'n1', kind: 20, entityId: 'e1' }),
                        nodeKind: 20,
                    }
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EsqNodeDetailsDialog);
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
