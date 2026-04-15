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
import { EsqSingleEntryDialog } from 'src/esquire.ui/components/EsqSingleEntryDialog';

describe('EsqSingleEntryDialog', () => {
    var fixture: ComponentFixture<EsqSingleEntryDialog>;
    var component: EsqSingleEntryDialog;

    beforeEach(async () => {
        var dialogRefSpy = jasmine.createSpyObj<MatDialogRef<EsqSingleEntryDialog>>(
            'MatDialogRef', ['close', 'addPanelClass', 'updateSize']
        );
        Object.defineProperty(dialogRefSpy, 'disableClose', { get: () => false, set: () => {} });

        await TestBed.configureTestingModule({
            imports: [EsqSingleEntryDialog, NoopAnimationsModule],
            providers: [
                { provide: MatDialogRef, useValue: dialogRefSpy },
                {
                    provide: MAT_DIALOG_DATA, useValue: {
                        dictionary: [],
                        readOnly: true,
                        details: {},
                        title: 'Test',
                        userId: 'u1',
                    }
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EsqSingleEntryDialog);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('creates without error', () => {
        expect(component).toBeTruthy();
    });
});
