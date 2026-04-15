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
import { EsqAccessProfileDialog } from 'src/esquire.ui/components/EsqAccessProfileDialog';
import { EsqRestApi } from 'src/esquire.ui/api/EsqRestApi';
import { EsqDictionaryApi } from 'src/esquire.ui/api/EsqDictionaryApi';
import { EsqExplorerCallApi } from 'src/esquire.ui/api/EsqExplorerCallApi';

describe('EsqAccessProfileDialog', () => {
    var fixture: ComponentFixture<EsqAccessProfileDialog>;
    var component: EsqAccessProfileDialog;

    beforeEach(async () => {
        var restApiSpy = jasmine.createSpyObj<EsqRestApi>('EsqRestApi', ['esquireKey']);
        restApiSpy.esquireKey.and.returnValue(of({}));

        var dictionaryApiSpy = jasmine.createSpyObj<EsqDictionaryApi>('EsqDictionaryApi', [
            'dictionary', 'dictionaryFromCache',
        ]);
        dictionaryApiSpy.dictionary.and.returnValue(of([]));
        dictionaryApiSpy.dictionaryFromCache.and.returnValue([]);

        var callApiSpy = jasmine.createSpyObj<EsqExplorerCallApi>('EsqExplorerCallApi', [
            'registerHost', 'unregisterHost', 'confirmDlg',
        ]);

        var dialogRefSpy = jasmine.createSpyObj<MatDialogRef<EsqAccessProfileDialog>>(
            'MatDialogRef', ['close', 'addPanelClass', 'updateSize']
        );
        Object.defineProperty(dialogRefSpy, 'disableClose', { get: () => false, set: () => {} });

        await TestBed.configureTestingModule({
            imports: [EsqAccessProfileDialog, NoopAnimationsModule],
            providers: [
                { provide: MatDialogRef, useValue: dialogRefSpy },
                {
                    provide: MAT_DIALOG_DATA, useValue: {
                        restApi: restApiSpy,
                        dictionaryApi: dictionaryApiSpy,
                        callApi: callApiSpy,
                        readOnly: false,
                        userId: 'u1',
                        id: 'user-1',
                    }
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EsqAccessProfileDialog);
        component = fixture.componentInstance;
    });

    it('creates without error', () => {
        expect(component).toBeTruthy();
    });
});
