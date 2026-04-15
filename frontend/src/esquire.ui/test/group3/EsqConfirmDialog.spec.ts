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
import { EsqConfirmDialog } from 'src/esquire.ui/components/EsqConfirmDialog';
import { EsqExplorerCallApi } from 'src/esquire.ui/api/EsqExplorerCallApi';

describe('EsqConfirmDialog', () => {
    var fixture: ComponentFixture<EsqConfirmDialog>;
    var component: EsqConfirmDialog;
    var dialogRefSpy: jasmine.SpyObj<MatDialogRef<EsqConfirmDialog>>;

    function createComponent(flag: EsqExplorerCallApi.ConfirmFlag) {
        dialogRefSpy = jasmine.createSpyObj<MatDialogRef<EsqConfirmDialog>>(
            'MatDialogRef', ['close', 'addPanelClass', 'updateSize']
        );
        Object.defineProperty(dialogRefSpy, 'disableClose', { get: () => false, set: () => {} });

        TestBed.configureTestingModule({
            imports: [EsqConfirmDialog, NoopAnimationsModule],
            providers: [
                { provide: MatDialogRef, useValue: dialogRefSpy },
                { provide: MAT_DIALOG_DATA, useValue: { flag, header: 'Test', text: 'Message' } },
            ],
        });
        fixture = TestBed.createComponent(EsqConfirmDialog);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }

    it('creates without error (Ok flag)', () => {
        createComponent(EsqExplorerCallApi.ConfirmFlag.Ok);
        expect(component).toBeTruthy();
    });

    it('creates without error (YesNo flag)', () => {
        createComponent(EsqExplorerCallApi.ConfirmFlag.YesNo);
        expect(component).toBeTruthy();
    });

    describe('onOkYes()', () => {
        it('closes dialog with result 0', () => {
            createComponent(EsqExplorerCallApi.ConfirmFlag.Ok);
            component.onOkYes();
            expect(dialogRefSpy.close).toHaveBeenCalledWith(0);
        });
    });

    describe('onNoCancel()', () => {
        it('closes dialog with result 1', () => {
            createComponent(EsqExplorerCallApi.ConfirmFlag.YesNo);
            component.onNoCancel();
            expect(dialogRefSpy.close).toHaveBeenCalledWith(1);
        });
    });
});
