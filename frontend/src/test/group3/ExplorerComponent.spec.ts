/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
*/
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { KEYCLOAK_EVENT_SIGNAL } from 'keycloak-angular';
import Keycloak from 'keycloak-js';
import { ExplorerComponent } from 'src/explorer/flatTree/app-shell';

describe('ExplorerComponent', () => {
    var fixture: ComponentFixture<ExplorerComponent>;
    var component: ExplorerComponent;

    beforeEach(async () => {
        var dialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

        await TestBed.configureTestingModule({
            imports: [ExplorerComponent, NoopAnimationsModule],
            providers: [
                provideHttpClient(),
                { provide: KEYCLOAK_EVENT_SIGNAL, useValue: signal(null) },
                { provide: Keycloak, useValue: jasmine.createSpyObj<Keycloak>('Keycloak', ['login', 'logout', 'updateToken']) },
                { provide: MatDialog, useValue: dialogSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ExplorerComponent);
        component = fixture.componentInstance;
        // Do not call detectChanges — ngOnInit requires live Keycloak/REST
    });

    it('creates without error', () => {
        expect(component).toBeTruthy();
    });
});
