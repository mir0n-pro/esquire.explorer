/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
*/
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { EsqExplorerComponent } from 'src/esquire.ui/explorer/flatTree/EsqExplorerComponent';

describe('EsqExplorerComponent', () => {
    var fixture: ComponentFixture<EsqExplorerComponent>;
    var component: EsqExplorerComponent;

    beforeEach(async () => {
        var dialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

        await TestBed.configureTestingModule({
            imports: [EsqExplorerComponent, NoopAnimationsModule],
            providers: [
                { provide: MatDialog, useValue: dialogSpy },
                provideHttpClient(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EsqExplorerComponent);
        component = fixture.componentInstance;
        // Do not call detectChanges here — ngOnInit requires esqRestApi to be set
    });

    it('creates without error', () => {
        expect(component).toBeTruthy();
    });
});
