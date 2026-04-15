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
import { EsqEntityDetailsDialog } from 'src/esquire.ui/components/EsqEntityDetailsDialog';
import { EsqRestApi } from 'src/esquire.ui/api/EsqRestApi';
import { EsqDictionaryApi } from 'src/esquire.ui/api/EsqDictionaryApi';
import { EsqExplorerCallApi } from 'src/esquire.ui/api/EsqExplorerCallApi';
import { EsqObjectKindFactory } from 'src/esquire.ui/api/EsqObjectKindFactory';
import { EsqObjectKind } from 'src/esquire.ui/api/EsqObjectKind';

describe('EsqEntityDetailsDialog', () => {
    var fixture: ComponentFixture<EsqEntityDetailsDialog>;
    var component: EsqEntityDetailsDialog;
    var restApiSpy: jasmine.SpyObj<EsqRestApi>;
    var dictionaryApiSpy: jasmine.SpyObj<EsqDictionaryApi>;
    var callApiSpy: jasmine.SpyObj<EsqExplorerCallApi>;

    beforeEach(async () => {
        (EsqObjectKindFactory as any)['kinds'] = [
            new EsqObjectKind({ id: 20, name: 'organization', treeFlags: 'B' }),
        ];

        restApiSpy = jasmine.createSpyObj<EsqRestApi>('EsqRestApi', ['esquireCmd']);
        restApiSpy.esquireCmd.and.returnValue(of({ id: 'e1', kind: 20, name: 'Test Org' }));

        dictionaryApiSpy = jasmine.createSpyObj<EsqDictionaryApi>('EsqDictionaryApi', [
            'dictionary', 'dictionaryFromCache',
        ]);
        dictionaryApiSpy.dictionary.and.returnValue(of([]));
        dictionaryApiSpy.dictionaryFromCache.and.returnValue([]);

        callApiSpy = jasmine.createSpyObj<EsqExplorerCallApi>('EsqExplorerCallApi', [
            'registerHost', 'unregisterHost', 'confirmDlg',
        ]);

        var dialogRefSpy = jasmine.createSpyObj<MatDialogRef<EsqEntityDetailsDialog>>(
            'MatDialogRef', ['close', 'addPanelClass', 'updateSize']
        );
        Object.defineProperty(dialogRefSpy, 'disableClose', { get: () => false, set: () => {} });

        await TestBed.configureTestingModule({
            imports: [EsqEntityDetailsDialog, NoopAnimationsModule],
            providers: [
                { provide: MatDialogRef, useValue: dialogRefSpy },
                {
                    provide: MAT_DIALOG_DATA, useValue: {
                        restApi: restApiSpy,
                        dictionaryApi: dictionaryApiSpy,
                        callApi: callApiSpy,
                        readOnly: false,
                        userId: 'u1',
                        id: 'e1',
                        kind: 20,
                    }
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EsqEntityDetailsDialog);
        component = fixture.componentInstance;
    });

    afterEach(() => {
        (EsqObjectKindFactory as any)['kinds'] = [];
    });

    it('creates without error', () => {
        expect(component).toBeTruthy();
    });

    describe('hasChanges()', () => {
        it('returns false when both details are null', () => {
            expect(component.hasChanges()).toBeFalse();
        });

        it('returns false when details match original', () => {
            component['originalDetails'] = { name: 'Org', value: 'A' };
            component.details = { name: 'Org', value: 'A' };
            expect(component.hasChanges()).toBeFalse();
        });

        it('returns true when a field differs from original', () => {
            component['originalDetails'] = { name: 'Org', value: 'A' };
            component.details = { name: 'Org', value: 'B' };
            expect(component.hasChanges()).toBeTrue();
        });
    });
});
